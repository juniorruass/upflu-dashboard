import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { notifyAdmin, notifyClient } from "@/lib/webpush";

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v19.0";

function fmt(n: number, prefix = "", suffix = "") {
  return `${prefix}${n.toLocaleString("pt-BR")}${suffix}`;
}

async function fetchYesterdayInsights(accountId: string, token: string) {
  const qp = new URLSearchParams({
    fields: "spend,actions",
    date_preset: "yesterday",
    access_token: token,
  });
  const res = await fetch(`${META_BASE}/act_${accountId}/insights?${qp}`, {
    signal: AbortSignal.timeout(8000),
  });
  const json = await res.json();
  const row = json.data?.[0];
  if (!row) return null;

  const actions: { action_type: string; value: string }[] = row.actions ?? [];
  const LEAD_TYPES = ["lead", "onsite_web_view_content", "view_content", "offsite_conversion.fb_pixel_view_content", "offsite_conversion.fb_pixel_lead"];
  const leads = LEAD_TYPES.reduce((s, t) => {
    const found = actions.find((a) => a.action_type === t);
    return found ? s + parseInt(found.value) : s;
  }, 0);

  return { spend: parseFloat(row.spend ?? "0"), leads };
}

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

  if (!clients?.length) return NextResponse.json({ ok: true, message: "no clients" });

  // ── Admin: resumo de todos os clientes ──────────────────
  const results = await Promise.all(
    clients.map(async (c) => {
      const insights = await fetchYesterdayInsights(c.meta_account_id!, token).catch(() => null);
      return { name: c.name, id: c.id, ...insights };
    })
  );

  const valid = results.filter((r) => r?.leads !== undefined && r.leads !== null);
  const totalLeads = valid.reduce((s, r) => s + (r.leads ?? 0), 0);
  const totalSpend = valid.reduce((s, r) => s + (r.spend ?? 0), 0);
  const best = valid.sort((a, b) => (b.leads ?? 0) - (a.leads ?? 0))[0];

  if (totalLeads > 0 || totalSpend > 0) {
    await notifyAdmin({
      title: "📊 Resumo de ontem — UPFLU",
      body: `${fmt(totalLeads)} leads · ${fmt(totalSpend, "R$", "", )} investido${best?.name ? ` · Melhor: ${best.name}` : ""}`,
      url: "/dashboard",
      tag: "daily-summary",
    });
  }

  // ── Clientes: lead novo + melhor dia ────────────────────
  for (const client of clients) {
    const insights = results.find((r) => r.id === client.id);
    if (!insights || (insights.leads ?? 0) === 0) continue;

    // Lead novo
    await notifyClient(client.id, {
      title: "🎯 Novos leads ontem",
      body: `${fmt(insights.leads ?? 0)} leads · ${fmt(insights.spend ?? 0, "R$ ")} investido`,
      url: `/${client.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")}`,
      tag: "daily-leads",
    });

    // Melhor dia do mês: busca histórico do mês atual
    const { data: metricsThisMonth } = await supabase
      .from("client_metrics")
      .select("leads")
      .eq("client_id", client.id);
    const maxLeads = Math.max(...(metricsThisMonth ?? []).map((m) => m.leads ?? 0), 0);
    if ((insights.leads ?? 0) > maxLeads && (insights.leads ?? 0) > 0) {
      await notifyClient(client.id, {
        title: "🏆 Melhor dia do mês!",
        body: `${fmt(insights.leads ?? 0)} leads em um único dia — novo recorde!`,
        url: `/${client.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")}`,
        tag: "best-day",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
