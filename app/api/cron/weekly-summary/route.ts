import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { notifyAdmin, notifyClient } from "@/lib/webpush";

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v19.0";

async function fetchWeekInsights(accountId: string, token: string) {
  const qp = new URLSearchParams({
    fields: "spend,actions,cost_per_action_type",
    date_preset: "last_7d",
    access_token: token,
  });
  const res = await fetch(`${META_BASE}/act_${accountId}/insights?${qp}`, {
    signal: AbortSignal.timeout(8000),
  });
  const json = await res.json();
  const row = json.data?.[0];
  if (!row) return null;

  const actions: { action_type: string; value: string }[] = row.actions ?? [];
  const cpa: { action_type: string; value: string }[] = row.cost_per_action_type ?? [];
  const LEAD_TYPES = ["lead", "onsite_web_view_content", "view_content", "offsite_conversion.fb_pixel_view_content"];

  const leads = LEAD_TYPES.reduce((s, t) => {
    const found = actions.find((a) => a.action_type === t);
    return found ? s + parseInt(found.value) : s;
  }, 0);
  const spend = parseFloat(row.spend ?? "0");
  const cplEntry = cpa.find((a) => LEAD_TYPES.includes(a.action_type));
  const cpl = cplEntry ? parseFloat(cplEntry.value) : (leads > 0 && spend > 0 ? spend / leads : null);

  return { spend, leads, cpl };
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

  if (!clients?.length) return NextResponse.json({ ok: true });

  const results = await Promise.all(
    clients.map(async (c) => {
      const ins = await fetchWeekInsights(c.meta_account_id!, token).catch(() => null);
      return { ...c, ...ins };
    })
  );

  const valid = results.filter((r) => r.leads != null);
  const totalLeads = valid.reduce((s, r) => s + (r.leads ?? 0), 0);
  const totalSpend = valid.reduce((s, r) => s + (r.spend ?? 0), 0);

  // Admin: resumo geral da semana
  const lines = valid
    .filter((r) => (r.leads ?? 0) > 0)
    .map((r) => `${r.name}: ${r.leads} leads`)
    .join(" · ");

  await notifyAdmin({
    title: "📅 Resumo da semana — UPFLU",
    body: `${totalLeads} leads · R$${totalSpend.toFixed(0)} investido${lines ? ` · ${lines}` : ""}`,
    url: "/dashboard",
    tag: "weekly-summary",
  });

  // Clientes: resumo semanal individual
  for (const r of valid) {
    if ((r.leads ?? 0) === 0) continue;
    const cplText = r.cpl ? ` · R$${r.cpl.toFixed(2)}/lead` : "";
    await notifyClient(r.id, {
      title: "📅 Sua semana em resumo",
      body: `${r.leads} leads · R$${(r.spend ?? 0).toFixed(0)} investido${cplText}`,
      url: `/${r.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")}`,
      tag: "weekly-summary",
    });
  }

  return NextResponse.json({ ok: true });
}
