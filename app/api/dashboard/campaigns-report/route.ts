import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v19.0";

const LEAD_TYPES = [
  "lead",
  "onsite_web_view_content",
  "view_content",
  "offsite_conversion.fb_pixel_view_content",
  "offsite_conversion.fb_pixel_lead",
];

function findLeads(actions: { action_type: string; value: string }[]): number {
  for (const type of LEAD_TYPES) {
    const found = actions?.find((a) => a.action_type === type);
    if (found) return parseInt(found.value);
  }
  return 0;
}

// Resumo de campanhas ativas por cliente (gasto, leads, cliques, budget restante),
// consumido pelo Lilly's pra reportar em grupos do WhatsApp e numa área ao vivo.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.ADM_API_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, meta_account_id, meta_access_token")
    .not("meta_account_id", "is", null);

  if (!clients?.length) return NextResponse.json({ clients: [] });

  const report = await Promise.all(
    clients.map(async (client) => {
      const token = client.meta_access_token || process.env.META_ACCESS_TOKEN;
      if (!token) return { id: client.id, name: client.name, error: "sem token" };

      try {
        const qp = new URLSearchParams({
          fields: "id,name,budget_remaining",
          filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]),
          limit: "50",
          access_token: token,
        });
        const res = await fetch(`${META_BASE}/act_${client.meta_account_id}/campaigns?${qp}`, {
          signal: AbortSignal.timeout(8000),
        });
        const json = await res.json();
        if (json.error) return { id: client.id, name: client.name, error: json.error.message };

        const campaigns = json.data ?? [];

        const withInsights = await Promise.all(
          campaigns.map(async (camp: { id: string; budget_remaining?: string }) => {
            const iQP = new URLSearchParams({
              fields: "spend,clicks,actions",
              date_preset: "last_7d",
              access_token: token,
            });
            const iRes = await fetch(`${META_BASE}/${camp.id}/insights?${iQP}`, { signal: AbortSignal.timeout(8000) });
            const iJson = await iRes.json();
            const row = iJson.data?.[0];
            if (!row) return { spend: 0, clicks: 0, leads: 0 };
            return {
              spend: parseFloat(row.spend ?? "0"),
              clicks: parseInt(row.clicks ?? "0"),
              leads: findLeads(row.actions ?? []),
            };
          })
        );

        return {
          id: client.id,
          name: client.name,
          active_campaigns: campaigns.length,
          spend_7d: withInsights.reduce((s, r) => s + r.spend, 0),
          clicks_7d: withInsights.reduce((s, r) => s + r.clicks, 0),
          leads_7d: withInsights.reduce((s, r) => s + r.leads, 0),
        };
      } catch (e) {
        return { id: client.id, name: client.name, error: String(e) };
      }
    })
  );

  return NextResponse.json({ clients: report });
}
