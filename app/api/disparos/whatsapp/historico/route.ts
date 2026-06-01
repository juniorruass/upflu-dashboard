import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("whatsapp_logs")
    .select("id, prospect_id, nome, telefone, template, status, sent_at")
    .order("sent_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const contatados = new Set(
    (data || []).map((l: { prospect_id: string }) => l.prospect_id).filter(Boolean)
  );

  return NextResponse.json({ logs: data || [], contatados: Array.from(contatados) });
}
