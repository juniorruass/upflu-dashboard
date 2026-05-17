import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_settings")
      .select("auto_generate_enabled, cron_time_brt")
      .eq("id", 1)
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(data ?? { auto_generate_enabled: true, cron_time_brt: "09:00" });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { auto_generate_enabled, cron_time_brt } = body;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("app_settings")
      .upsert(
        {
          id: 1,
          ...(typeof auto_generate_enabled === "boolean" && { auto_generate_enabled }),
          ...(cron_time_brt && { cron_time_brt }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("auto_generate_enabled, cron_time_brt")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[POST /api/settings]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
