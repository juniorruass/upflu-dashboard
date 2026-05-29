import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { notifyAdmin } from "@/lib/webpush";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Pagamentos pendentes com vencimento nos próximos 3 dias
  const today = new Date();
  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, due_date, clients(name)")
    .eq("status", "pending")
    .lte("due_date", in3Days.toISOString().split("T")[0])
    .gte("due_date", today.toISOString().split("T")[0]);

  if (!payments?.length) return NextResponse.json({ ok: true, pending: 0 });

  for (const p of payments) {
    const clientRaw = Array.isArray(p.clients) ? p.clients[0] : p.clients;
    const client = (clientRaw as { name?: string } | null)?.name ?? "Cliente";
    const due = new Date(p.due_date).toLocaleDateString("pt-BR");
    const amount = Number(p.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    await notifyAdmin({
      title: `💰 Pagamento a receber`,
      body: `${client} — ${amount} vence em ${due}`,
      url: "/dashboard/financeiro",
      tag: `payment-${p.id}`,
    });
  }

  return NextResponse.json({ ok: true, pending: payments.length });
}
