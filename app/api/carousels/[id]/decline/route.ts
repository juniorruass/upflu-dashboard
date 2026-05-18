import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createAdminClient();

    // Delete slides first (carousel record is kept for history/sequence tracking)
    const { error: slidesError } = await supabase
      .from("slides")
      .delete()
      .eq("carousel_id", id);

    if (slidesError) throw new Error(slidesError.message);

    // Soft-mark the carousel as declined
    const { data, error } = await supabase
      .from("carousels")
      .update({
        status: "declined",
        declined_at: new Date().toISOString(),
      })
      .eq("id", id)
      .in("status", ["pending", "approved"])
      .select("id, status, topic, declined_at")
      .single();

    if (error) throw new Error(error.message);

    if (!data) {
      return NextResponse.json(
        { error: "Carousel not found or already processed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, carousel: data });
  } catch (err) {
    console.error("[decline] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
