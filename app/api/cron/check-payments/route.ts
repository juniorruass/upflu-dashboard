import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { notifyAdmin, notifyClient } from "@/lib/webpush";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];
  const in3Days = new Date();
  in3Days.setDate(in3Days.getDate() + 3);
  const in3DaysStr = in3Days.toISOString().split("T")[0];

  // ── Pagamentos a vencer nos próximos 3 dias ──────────────
  const { data: upcoming } = await supabase
    .from("payments")
    .select("id, amount, due_date, client_id, clients(id, name)")
    .is("paid_date", null)
    .gte("due_date", today)
    .lte("due_date", in3DaysStr);

  for (const p of upcoming ?? []) {
    const clientRaw = Array.isArray(p.clients) ? p.clients[0] : p.clients;
    const clientName = (clientRaw as { name?: string } | null)?.name ?? "Cliente";
    const clientId = (clientRaw as { id?: string } | null)?.id;
    const due = new Date(p.due_date + "T12:00:00").toLocaleDateString("pt-BR");
    const amount = Number(p.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const daysLeft = Math.round((new Date(p.due_date).getTime() - new Date(today).getTime()) / 86400000);
    const when = daysLeft === 0 ? "vence hoje" : daysLeft === 1 ? "vence amanhã" : `vence em ${daysLeft} dias`;

    await notifyAdmin({
      title: `💰 ${clientName} — pagamento ${when}`,
      body: `${amount} · ${due} — acesse o financeiro para confirmar.`,
      url: "/dashboard/financeiro",
      tag: `payment-due-${p.id}`,
    });

    // Notifica o cliente que pagamento está próximo
    if (clientId) {
      await notifyClient(clientId, {
        title: `📋 Lembrete de pagamento`,
        body: `Sua mensalidade de ${amount} ${when}. Qualquer dúvida, fale com a gente.`,
        url: "/",
        tag: `payment-reminder-${p.id}`,
      });
    }
  }

  // ── Pagamentos em atraso ─────────────────────────────────
  const { data: overdue } = await supabase
    .from("payments")
    .select("id, amount, due_date, client_id, clients(id, name)")
    .is("paid_date", null)
    .lt("due_date", today);

  for (const p of overdue ?? []) {
    const clientRaw = Array.isArray(p.clients) ? p.clients[0] : p.clients;
    const clientName = (clientRaw as { name?: string } | null)?.name ?? "Cliente";
    const clientId = (clientRaw as { id?: string } | null)?.id;
    const due = new Date(p.due_date + "T12:00:00").toLocaleDateString("pt-BR");
    const amount = Number(p.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const daysLate = Math.round((new Date(today).getTime() - new Date(p.due_date).getTime()) / 86400000);

    await notifyAdmin({
      title: `⚠️ ${clientName} — pagamento atrasado`,
      body: `${amount} · venceu em ${due} (${daysLate} dia${daysLate > 1 ? "s" : ""} em atraso)`,
      url: "/dashboard/financeiro",
      tag: `payment-overdue-${p.id}`,
    });

    // Notifica o cliente sobre o atraso
    if (clientId) {
      await notifyClient(clientId, {
        title: `⚠️ Pagamento em atraso`,
        body: `Identificamos um pagamento de ${amount} em aberto desde ${due}. Entre em contato para regularizar.`,
        url: "/",
        tag: `payment-overdue-client-${p.id}`,
      });
    }
  }

  // ── Pagamentos efetuados hoje ─────────────────────────────
  const { data: paid } = await supabase
    .from("payments")
    .select("id, amount, paid_date, client_id, clients(id, name)")
    .eq("paid_date", today);

  for (const p of paid ?? []) {
    const clientRaw = Array.isArray(p.clients) ? p.clients[0] : p.clients;
    const clientName = (clientRaw as { name?: string } | null)?.name ?? "Cliente";
    const amount = Number(p.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    await notifyAdmin({
      title: `✅ Pagamento recebido`,
      body: `${clientName} · ${amount} confirmado hoje.`,
      url: "/dashboard/financeiro",
      tag: `payment-paid-${p.id}`,
    });
  }

  return NextResponse.json({
    ok: true,
    upcoming: upcoming?.length ?? 0,
    overdue: overdue?.length ?? 0,
    paid: paid?.length ?? 0,
  });
}
