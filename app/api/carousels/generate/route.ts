import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { generateCarousel } from "@/lib/claude";
import { UPFLU_TOPICS } from "@/lib/themes";

// Vercel Cron: 0 12 * * * (12:00 UTC = 09:00 BRT)
export async function GET(request: Request) {
  const isDev = process.env.NODE_ENV !== "production";
  const cronSecret = (process.env.CRON_SECRET || "").replace(/^﻿/, "").trim();

  if (!isDev) {
    const auth = request.headers.get("authorization");
    if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Cron: skip if there's already a pending carousel (prevent backlog)
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("carousels")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if ((count ?? 0) > 0) {
    console.log("[cron] Skipped — pending carousel exists.");
    return NextResponse.json({ success: false, reason: "pending_exists" });
  }

  return runGenerate();
}

async function runGenerate(topic?: string) {
  try {
    const supabase = createAdminClient();

    let topicToUse: string;

    if (topic) {
      topicToUse = topic;
    } else {
      // Sequential rotation: index = total carousel count % topics length
      const { count, error: countError } = await supabase
        .from("carousels")
        .select("*", { count: "exact", head: true });

      if (countError) throw new Error(countError.message);

      const topicIndex = (count ?? 0) % UPFLU_TOPICS.length;
      topicToUse = UPFLU_TOPICS[topicIndex];
    }

    const generated = await generateCarousel(topicToUse);

    // ── 1. Insert carousel as pending ──────────────────────────────────────
    const { data: carousel, error: carouselError } = await supabase
      .from("carousels")
      .insert({
        topic: generated.topic,
        caption: generated.caption,
        status: "pending",
      })
      .select()
      .single();

    if (carouselError || !carousel) {
      throw new Error(`Failed to insert carousel: ${carouselError?.message}`);
    }

    // ── 2. Insert slides ───────────────────────────────────────────────────
    const slidesPayload = generated.slides.map((s) => ({
      carousel_id: carousel.id,
      slide_number: s.slide_number,
      html_content: s.html,
    }));

    const { error: slidesError } = await supabase
      .from("slides")
      .insert(slidesPayload);

    if (slidesError) throw new Error(`Failed to insert slides: ${slidesError.message}`);

    // ── 3. Return full carousel (pending for review) ───────────────────────
    const { data: full, error: fullError } = await supabase
      .from("carousels")
      .select(
        `id, status, post_number, topic, caption, created_at, approved_at, declined_at,
         slides(id, carousel_id, slide_number, html_content, image_url, created_at)`
      )
      .eq("id", carousel.id)
      .single();

    if (fullError) throw new Error(fullError.message);

    console.log(`[generate] Pending carousel: ${carousel.id} — "${generated.topic}"`);

    return NextResponse.json(full, { status: 201 });
  } catch (err) {
    console.error("[generate] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  return runGenerate(body?.topic as string | undefined);
}
