export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data || [] });
}
