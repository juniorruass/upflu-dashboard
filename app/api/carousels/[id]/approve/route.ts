import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createAdminClient();

    // Get next post_number
    const { data: maxRow } = await supabase
      .from("carousels")
      .select("post_number")
      .not("post_number", "is", null)
      .order("post_number", { ascending: false })
      .limit(1)
      .single();

    const nextNumber = (maxRow?.post_number ?? 0) + 1;

    const { data, error } = await supabase
      .from("carousels")
      .update({
        status: "approved",
        post_number: nextNumber,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)
      .in("status", ["pending", "approved"])
      .select(
        `
        id, status, post_number, topic, caption, created_at, approved_at, declined_at,
        slides(id, slide_number, html_content, image_url, created_at)
      `
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return NextResponse.json(
        { error: "Carousel not found or already processed" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[approve] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
