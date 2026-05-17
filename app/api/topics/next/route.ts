import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { UPFLU_TOPICS } from "@/lib/themes";

export async function GET() {
  try {
    const supabase = createAdminClient();

    const { count, error } = await supabase
      .from("carousels")
      .select("*", { count: "exact", head: true });

    if (error) throw new Error(error.message);

    const totalCreated = count ?? 0;
    const topicIndex = totalCreated % UPFLU_TOPICS.length;
    const topic = UPFLU_TOPICS[topicIndex];

    return NextResponse.json({
      topic,
      topic_index: topicIndex,
      total_topics: UPFLU_TOPICS.length,
      total_carousels_created: totalCreated,
      cycle: Math.floor(totalCreated / UPFLU_TOPICS.length) + 1,
    });
  } catch (err) {
    console.error("[GET /api/topics/next] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
