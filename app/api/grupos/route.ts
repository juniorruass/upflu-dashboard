import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { evolutionFindGroups, evolutionInstances } from "@/lib/evolution-api";

// GET /api/grupos?action=list-groups&instance=X  — lista grupos do Evolution
// GET /api/grupos                                — lista mensagens agendadas
// POST /api/grupos                               — cria mensagem agendada
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "list-groups") {
    const instance = searchParams.get("instance") ?? undefined;
    const groups = await evolutionFindGroups(instance);
    return NextResponse.json({ groups });
  }

  if (action === "list-instances") {
    const instances = await evolutionInstances();
    return NextResponse.json({ instances });
  }

  if (action === "debug-groups") {
    const instance = searchParams.get("instance") ?? "";
    const base = (process.env.EVOLUTION_API_URL ?? "").replace(/\/$/, "");
    const apiKey = process.env.EVOLUTION_API_KEY ?? "";
    const headers = { "Content-Type": "application/json", apikey: apiKey };
    try {
      const r1 = await fetch(`${base}/group/fetchAllGroups/${encodeURIComponent(instance)}?getParticipants=false`, { headers });
      const body1 = await r1.text();
      const r2 = await fetch(`${base}/chat/findChats/${encodeURIComponent(instance)}`, { method: "POST", headers, body: JSON.stringify({ where: {} }) });
      const body2 = await r2.text();
      return NextResponse.json({ fetchAllGroups: { status: r1.status, body: body1.slice(0, 2000) }, findChats: { status: r2.status, body: body2.slice(0, 2000) } });
    } catch (err) {
      return NextResponse.json({ error: String(err) });
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("group_messages")
    .select("*")
    .order("scheduled_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { instance, group_jid, group_name, message, type, scheduled_at, media_type, media_data, media_filename, media_caption } = body;

  if (!instance || !group_jid || !group_name || !scheduled_at) {
    return NextResponse.json({ error: "Campos obrigatórios: instance, group_jid, group_name, scheduled_at" }, { status: 400 });
  }
  if (!message && !media_data) {
    return NextResponse.json({ error: "Informe mensagem ou arquivo de mídia" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("group_messages")
    .insert({
      instance, group_jid, group_name,
      message: message ?? "",
      type: type ?? "marketing",
      scheduled_at, status: "pending",
      media_type: media_type ?? null,
      media_data: media_data ?? null,
      media_filename: media_filename ?? null,
      media_caption: media_caption ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
