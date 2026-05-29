import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { notifyAdmin, notifyClient } from "@/lib/webpush";

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v19.0";

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
    .not("meta_account_id", "is", null);

  if (!clients?.length) return NextResponse.json({ ok: true });

  for (const client of clients) {
    try {
      // Campanhas ativas
      const activeQP = new URLSearchParams({
        fields: "id,name,status,budget_remaining",
        filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]),
        limit: "50",
        access_token: token,
      });
      const activeRes = await fetch(`${META_BASE}/act_${client.meta_account_id}/campaigns?${activeQP}`, {
        signal: AbortSignal.timeout(8000),
      });
      const activeJson = await activeRes.json();
      if (activeJson.error) continue;

      // Campanhas com budget < 10% restante
      const lowBudget = (activeJson.data ?? []).filter((c: { budget_remaining: string }) => {
        const rem = parseFloat(c.budget_remaining ?? "0");
        return rem > 0 && rem < 1000; // < R$10 restante (em centavos)
      });

      if (lowBudget.length > 0) {
        const names = lowBudget.map((c: { name: string }) => c.name).join(", ");
        await notifyAdmin({
          title: `⚠️ Budget baixo — ${client.name}`,
          body: `Campanha quase sem verba: ${names}`,
          url: `/dashboard/clientes`,
          tag: `budget-${client.id}`,
        });
        await notifyClient(client.id, {
          title: "⚠️ Campanha com verba baixa",
          body: `Uma campanha está quase sem orçamento. Entre em contato com a equipe.`,
          url: `/${client.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")}`,
          tag: "budget-low",
        });
      }

      // Campanhas pausadas recentemente (status PAUSED mas com gasto hoje)
      const pausedQP = new URLSearchParams({
        fields: "id,name,status",
        filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["PAUSED"] }]),
        limit: "50",
        access_token: token,
      });
      const pausedRes = await fetch(`${META_BASE}/act_${client.meta_account_id}/campaigns?${pausedQP}`, {
        signal: AbortSignal.timeout(8000),
      });
      const pausedJson = await pausedRes.json();
      if (pausedJson.error) continue;

      // Checa se alguma paused teve gasto hoje
      for (const camp of pausedJson.data ?? []) {
        const iQP = new URLSearchParams({
          fields: "spend",
          date_preset: "today",
          access_token: token,
        });
        const iRes = await fetch(`${META_BASE}/${camp.id}/insights?${iQP}`, {
          signal: AbortSignal.timeout(5000),
        });
        const iJson = await iRes.json();
        const spend = parseFloat(iJson.data?.[0]?.spend ?? "0");
        if (spend > 0) {
          await notifyAdmin({
            title: `🔴 Campanha pausada — ${client.name}`,
            body: `"${camp.name}" foi pausada mas tinha gasto hoje (R$${spend.toFixed(2)})`,
            url: `/dashboard/anuncios`,
            tag: `paused-${camp.id}`,
          });
        }
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({ ok: true });
}
