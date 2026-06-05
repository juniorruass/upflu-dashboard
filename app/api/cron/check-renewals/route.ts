import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { evolutionSend, evolutionInstances } from "@/lib/evolution-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  // clientes com renovação nos próximos 30 dias (start_date + 12 meses)
  const in30 = new Date(now); in30.setDate(in30.getDate() + 30);
  const today = now.toISOString().split("T")[0];
  const limit = in30.toISOString().split("T")[0];

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, name, start_date, monthly_value, contact_phone")
    .eq("status", "active")
    .not("start_date", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const due = (clients ?? []).filter((c) => {
    if (!c.start_date) return false;
    const renewal = new Date(c.start_date);
    renewal.setFullYear(renewal.getFullYear() + 1);
    const renewalStr = renewal.toISOString().split("T")[0];
    return renewalStr >= today && renewalStr <= limit;
  });

  if (!due.length) return NextResponse.json({ ok: true, alerts: 0 });

  const adminPhone = process.env.ADMIN_PHONE;
  if (!adminPhone) return NextResponse.json({ ok: true, alerts: 0, reason: "ADMIN_PHONE não configurado" });

  const allInstances = await evolutionInstances();
  const instance = process.env.EVOLUTION_INSTANCE
    || allInstances.find((i) => i.connectionStatus === "open")?.name
    || "";

  if (!instance) return NextResponse.json({ ok: true, alerts: 0, reason: "Nenhuma instância conectada" });

  const normalize = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("55") ? d : `55${d}`; };

  let alerts = 0;
  for (const c of due) {
    const renewal = new Date(c.start_date);
    renewal.setFullYear(renewal.getFullYear() + 1);
    const daysLeft = Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const renewalDate = renewal.toLocaleDateString("pt-BR");

    const msg = `🔔 *Alerta de renovação*\n\n👤 *${c.name}*\n📅 Contrato vence em *${daysLeft} dias* (${renewalDate})\n💰 R$ ${(c.monthly_value ?? 0).toLocaleString("pt-BR")}/mês\n\nVerifique a renovação no painel.`;
    await evolutionSend(normalize(adminPhone), msg, instance);
    alerts++;
  }

  return NextResponse.json({ ok: true, alerts });
}
