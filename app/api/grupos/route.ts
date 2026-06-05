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
  const { instance, group_jid, group_name, message, type, scheduled_at } = body;

  if (!instance || !group_jid || !group_name || !message || !scheduled_at) {
    return NextResponse.json({ error: "Campos obrigatórios: instance, group_jid, group_name, message, scheduled_at" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("group_messages")
    .insert({ instance, group_jid, group_name, message, type: type ?? "marketing", scheduled_at, status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
