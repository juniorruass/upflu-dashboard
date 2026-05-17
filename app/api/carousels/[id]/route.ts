import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("carousels")
      .select(
        `id, status, post_number, topic, caption, created_at, approved_at, declined_at,
         slides(id, carousel_id, slide_number, html_content, image_url, created_at)`
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
      }
      throw new Error(error.message);
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/carousels/[id]] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
