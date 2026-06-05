import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { evolutionSend, evolutionInstances } from "@/lib/evolution-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agenda_events")
    .select("*, clients(id, name, contact_phone, contact_email)")
    .order("starts_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}

async function resolveInstance(preferred?: string): Promise<string> {
  if (preferred) return preferred;
  const env = process.env.EVOLUTION_INSTANCE;
  if (env) return env;
  const all = await evolutionInstances();
  return all.find((i) => i.connectionStatus === "open")?.name ?? "";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    title, description, client_id, starts_at, ends_at,
    notify_admin_whatsapp, notify_admin_email,
    notify_client_whatsapp, notify_client_email,
    notify_instance, notify_admin_phone,
  } = body;

  if (!title || !starts_at) {
    return NextResponse.json({ error: "Campos obrigatórios: title, starts_at" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // tenta inserir com as colunas novas, faz fallback sem elas se não existirem
  const baseInsert = {
    title,
    description: description ?? null,
    client_id: client_id ?? null,
    starts_at,
    ends_at: ends_at ?? null,
    notify_admin_whatsapp: notify_admin_whatsapp ?? true,
    notify_admin_email: notify_admin_email ?? false,
    notify_client_whatsapp: notify_client_whatsapp ?? false,
    notify_client_email: notify_client_email ?? false,
    status: "pending",
  };

  let result = await supabase
    .from("agenda_events")
    .insert({ ...baseInsert, notify_instance: notify_instance ?? null, notify_admin_phone: notify_admin_phone ?? null })
    .select("*, clients(id, name, contact_phone, contact_email)")
    .single();

  // fallback sem as colunas novas (migration ainda não rodada)
  if (result.error?.message?.includes("column")) {
    result = await supabase
      .from("agenda_events")
      .insert(baseInsert)
      .select("*, clients(id, name, contact_phone, contact_email)")
      .single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

  // notificação imediata — usa valores do body diretamente
  const notifyLog: Record<string, unknown> = {};
  if (notify_admin_whatsapp) {
    const adminPhone = (notify_admin_phone as string) || process.env.ADMIN_PHONE || "";
    const instance   = await resolveInstance(notify_instance as string);
    notifyLog.adminPhone = adminPhone || "(não configurado)";
    notifyLog.instance   = instance   || "(não encontrado)";

    if (adminPhone && instance) {
      const startsAt = new Date(starts_at as string).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const msg = `✅ *Evento agendado*\n\n*${title}*\n${description ? `${description}\n` : ""}🕐 ${startsAt}\n\nVocê receberá um lembrete 30 minutos antes.`;
      const ok = await evolutionSend(adminPhone, msg, instance);
      notifyLog.sent = ok;
    } else {
      notifyLog.sent = false;
      notifyLog.reason = !adminPhone ? "telefone não configurado" : "instância não encontrada";
    }
  }

  return NextResponse.json({ event: result.data, notifyLog });
}
