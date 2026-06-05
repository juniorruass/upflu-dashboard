import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { evolutionSend, evolutionInstances } from "@/lib/evolution-api";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  // janela: eventos que começam entre 25 e 35 minutos a partir de agora
  const windowStart = new Date(now.getTime() + 25 * 60 * 1000).toISOString();
  const windowEnd   = new Date(now.getTime() + 35 * 60 * 1000).toISOString();

  const { data: events, error } = await supabase
    .from("agenda_events")
    .select("*, clients(id, name, contact_phone, contact_email)")
    .eq("status", "pending")
    .gte("starts_at", windowStart)
    .lte("starts_at", windowEnd);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!events?.length) return NextResponse.json({ ok: true, notified: 0 });

  // pega a primeira instância conectada como fallback
  const allInstances = await evolutionInstances();
  const connectedInstance = allInstances.find((i) => i.connectionStatus === "open");
  const fallbackInstance = process.env.EVOLUTION_INSTANCE ?? connectedInstance?.name ?? "";

  const adminEmail = process.env.ADMIN_EMAIL;
  let notified = 0;

  for (const ev of events) {
    const instance = ev.notify_instance || fallbackInstance;
    const adminPhone = ev.notify_admin_phone || process.env.ADMIN_PHONE;
    const startsAt = new Date(ev.starts_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const adminMsg = `⏰ *Lembrete — começa em 30 minutos*\n\n*${ev.title}*\n${ev.description ? `${ev.description}\n` : ""}🕐 ${startsAt}${ev.clients?.name ? `\n👤 ${ev.clients.name}` : ""}`;

    if (ev.notify_admin_whatsapp && adminPhone) {
      await evolutionSend(adminPhone, adminMsg, instance);
    }

    if (ev.notify_admin_email && adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Agenda: ${ev.title}`,
        text: adminMsg.replace(/\*/g, ""),
      }).catch(() => null);
    }

    const client = ev.clients as { contact_phone?: string; contact_email?: string; name?: string } | null;

    if (ev.notify_client_whatsapp && client?.contact_phone) {
      const clientMsg = `📅 *Lembrete*\n\n*${ev.title}*\n${ev.description ? `${ev.description}\n` : ""}⏰ ${startsAt}`;
      await evolutionSend(client.contact_phone, clientMsg, instance);
    }

    if (ev.notify_client_email && client?.contact_email) {
      await sendEmail({
        to: client.contact_email,
        subject: `Lembrete: ${ev.title}`,
        text: `${ev.title}\n\n${ev.description ?? ""}\n\n⏰ ${startsAt}`,
      }).catch(() => null);
    }

    await supabase
      .from("agenda_events")
      .update({ status: "notified", notified_at: new Date().toISOString() })
      .eq("id", ev.id);

    notified++;
  }

  return NextResponse.json({ ok: true, notified });
}
