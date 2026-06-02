export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { notifyAdmin } from "@/lib/webpush";

const META_BASE = "https://graph.facebook.com/v19.0";

const ACCOUNT_STATUS: Record<number, string> = {
  1: "Ativa",
  2: "Desativada",
  3: "Pendente de pagamento",
  7: "Encerrando",
  8: "Encerrada",
  9: "Pendente de liquidação",
};

const THRESHOLDS = [500, 300, 100, 50]; // R$ — alertas de saldo baixo

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "no token" }, { status: 500 });

  const supabase = createAdminClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, meta_account_id")
    .not("meta_account_id", "is", null)
    .eq("status", "active");

  if (!clients?.length) return NextResponse.json({ ok: true, checked: 0 });

  const alerts: string[] = [];

  await Promise.all(clients.map(async (client) => {
    try {
      const qp = new URLSearchParams({
        fields: "name,account_status,balance,currency,spend_cap,amount_spent,funding_source_details",
        access_token: token,
      });
      const res = await fetch(`${META_BASE}/act_${client.meta_account_id}?${qp}`, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();

      if (data.error) {
        alerts.push(`${client.name}: erro ao consultar (${data.error.message})`);
        return;
      }

      const accountStatus: number = data.account_status;
      const balance: number | null = data.balance ? parseFloat(data.balance) / 100 : null; // centavos → reais
      const currency: string = data.currency ?? "BRL";
      const spendCap: number | null = data.spend_cap ? parseFloat(data.spend_cap) / 100 : null;
      const amountSpent: number | null = data.amount_spent ? parseFloat(data.amount_spent) / 100 : null;

      // 1. Status da conta com problema
      if (accountStatus !== 1) {
        const statusLabel = ACCOUNT_STATUS[accountStatus] ?? `Status ${accountStatus}`;
        await notifyAdmin({
          title: `⚠️ Conta de anúncios com problema`,
          body: `${client.name} — ${statusLabel}. Verifique o pagamento da conta Meta.`,
          url: "/dashboard/clientes",
          tag: `ad-account-status-${client.id}`,
        });
        alerts.push(`${client.name}: ${statusLabel}`);
      }

      // 2. Saldo baixo (conta pré-paga)
      if (balance !== null && currency === "BRL") {
        for (const threshold of THRESHOLDS) {
          if (balance <= threshold) {
            await notifyAdmin({
              title: `💳 Saldo baixo — ${client.name}`,
              body: `Restam R$ ${balance.toFixed(2)} na conta de anúncios. Recarregue para não pausar as campanhas.`,
              url: "/dashboard/clientes",
              tag: `ad-balance-${client.id}-${threshold}`,
            });
            alerts.push(`${client.name}: saldo R$ ${balance.toFixed(2)}`);
            break; // notifica só o menor threshold atingido
          }
        }
      }

      // 3. Limite de gasto quase atingido (spend cap)
      if (spendCap !== null && amountSpent !== null) {
        const remaining = spendCap - amountSpent;
        for (const threshold of THRESHOLDS) {
          if (remaining <= threshold && remaining > 0) {
            await notifyAdmin({
              title: `📊 Orçamento quase no limite — ${client.name}`,
              body: `Restam R$ ${remaining.toFixed(2)} do orçamento total. Aumente o limite ou as campanhas vão pausar.`,
              url: "/dashboard/anuncios",
              tag: `ad-spend-cap-${client.id}-${threshold}`,
            });
            alerts.push(`${client.name}: orçamento restante R$ ${remaining.toFixed(2)}`);
            break;
          }
        }
      }

    } catch (e) {
      alerts.push(`${client.name}: ${String(e)}`);
    }
  }));

  return NextResponse.json({ ok: true, checked: clients.length, alerts });
}
