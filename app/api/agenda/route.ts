import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { evolutionSend, evolutionInstances } from "@/lib/evolution-api";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("agenda_events")
    .select("*, clients(id, name, contact_phone, contact_email)")
    .order("starts_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
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
  const { data, error } = await supabase
    .from("agenda_events")
    .insert({
      title,
      description: description ?? null,
      client_id: client_id ?? null,
      starts_at,
      ends_at: ends_at ?? null,
      notify_admin_whatsapp: notify_admin_whatsapp ?? true,
      notify_admin_email: notify_admin_email ?? false,
      notify_client_whatsapp: notify_client_whatsapp ?? false,
      notify_client_email: notify_client_email ?? false,
      notify_instance: notify_instance ?? null,
      notify_admin_phone: notify_admin_phone ?? null,
      status: "pending",
    })
    .select("*, clients(id, name, contact_phone, contact_email)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // notificação imediata de criação
  if (data && notify_admin_whatsapp) {
    try {
      const adminPhone = notify_admin_phone || process.env.ADMIN_PHONE;
      if (adminPhone) {
        const allInstances = await evolutionInstances();
        const instance = notify_instance
          || process.env.EVOLUTION_INSTANCE
          || allInstances.find((i) => i.connectionStatus === "open")?.name
          || "";
        const startsAt = new Date(data.starts_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const msg = `✅ *Evento agendado*\n\n*${data.title}*\n${data.description ? `${data.description}\n` : ""}🕐 ${startsAt}\n\nVocê receberá um lembrete 30 minutos antes.`;
        await evolutionSend(adminPhone, msg, instance);
      }
    } catch { /* não bloqueia a resposta */ }
  }

  return NextResponse.json({ event: data });
}
