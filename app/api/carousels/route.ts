import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "all";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const supabase = createAdminClient();

    let query = supabase
      .from("carousels")
      .select(
        `id, status, post_number, topic, caption, created_at, approved_at, declined_at,
         slides(id, carousel_id, slide_number, html_content, image_url, created_at)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

    return NextResponse.json({
      data: data ?? [],
      pagination: {
        page,
        page_size: PAGE_SIZE,
        total: count ?? 0,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (err) {
    console.error("[GET /api/carousels] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
