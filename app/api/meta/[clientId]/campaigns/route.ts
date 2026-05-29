import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ clientId: string }> };

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v19.0";

const RESULT_ACTIONS = [
  "lead",
  "purchase",
  "complete_registration",
  "submit_application",
  "contact",
  "offsite_conversion.fb_pixel_lead",
  "offsite_conversion.fb_pixel_purchase",
  "app_install",
  "mobile_app_install",
  "link_click",
  "post_engagement",
  "page_engagement",
  "video_view",
  "instagram_profile_visit",
  "onsite_web_view_content",
  "view_content",
  "offsite_conversion.fb_pixel_view_content",
];

function findAction(actions: { action_type: string; value: string }[], types: string[]): number | null {
  for (const type of types) {
    const found = actions?.find((a) => a.action_type === type);
    if (found) return parseInt(found.value);
  }
  return null;
}

function findResultWithLabel(actions: { action_type: string; value: string }[], types: string[]): { value: number; label: string } | null {
  const labels: Record<string, string> = {
    lead: "Leads", purchase: "Compras", complete_registration: "Cadastros",
    link_click: "Cliques no link", post_engagement: "Engajamento",
    page_engagement: "Engajamento", video_view: "Visualizações de vídeo",
    instagram_profile_visit: "Visitas ao perfil", view_content: "Visualizações",
    onsite_web_view_content: "Visualizações", "offsite_conversion.fb_pixel_view_content": "Visualizações",
  };
  for (const type of types) {
    const found = actions?.find((a) => a.action_type === type);
    if (found) return { value: parseInt(found.value), label: labels[type] ?? type };
  }
  return null;
}

function findCostPerAction(cpa: { action_type: string; value: string }[], types: string[]): number | null {
  for (const type of types) {
    const found = cpa?.find((a) => a.action_type === type);
    if (found) return parseFloat(found.value);
  }
  return null;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { clientId } = await params;
  const token = process.env.META_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "META_ACCESS_TOKEN não configurado." }, { status: 500 });
  }

  const supabase = createAdminClient();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, meta_account_id")
    .eq("id", clientId)
    .single();

  if (clientError || !client || !client.meta_account_id) {
    return NextResponse.json({ error: "Cliente não encontrado ou sem Meta configurado." }, { status: 404 });
  }

  const searchParams = req.nextUrl.searchParams;
  const datePreset = searchParams.get("date_preset");
  const since = searchParams.get("since");
  const until = searchParams.get("until");

  try {
    const insightFields = [
      "spend", "impressions", "clicks", "ctr", "reach",
      "cpm", "actions", "cost_per_action_type",
    ].join(",");

    const insightParams: Record<string, string> = { fields: insightFields };
    if (since && until) {
      insightParams.time_range = JSON.stringify({ since, until });
    } else {
      insightParams.date_preset = datePreset || "last_30d";
    }

    const qp = new URLSearchParams({
      fields: `id,name,status,objective`,
      filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]),
      limit: "50",
      access_token: token,
    });

    const campaignUrl = `${META_BASE}/act_${client.meta_account_id}/campaigns?${qp}`;
    const campaignRes = await fetch(campaignUrl, { signal: AbortSignal.timeout(10000) });
    const campaignJson = await campaignRes.json();

    if (campaignJson.error) {
      return NextResponse.json({ error: campaignJson.error.message }, { status: 400 });
    }

    const campaigns = campaignJson.data ?? [];

    // Fetch insights for each campaign in parallel
    const withInsights = await Promise.all(
      campaigns.map(async (camp: { id: string; name: string; status: string; objective: string }) => {
        try {
          const iQP = new URLSearchParams({ fields: insightFields, access_token: token, ...insightParams });
          const iRes = await fetch(`${META_BASE}/${camp.id}/insights?${iQP}`, { signal: AbortSignal.timeout(8000) });
          const iJson = await iRes.json();
          const row = iJson.data?.[0] ?? null;

          if (!row) return { ...camp, insights: null };

          const actions: { action_type: string; value: string }[] = row.actions ?? [];
          const cpa: { action_type: string; value: string }[] = row.cost_per_action_type ?? [];
          const spend = parseFloat(row.spend ?? "0");
          const resultMatch = findResultWithLabel(actions, RESULT_ACTIONS);

          return {
            ...camp,
            insights: {
              spend,
              impressions: parseInt(row.impressions ?? "0"),
              clicks: parseInt(row.clicks ?? "0"),
              ctr: parseFloat(row.ctr ?? "0"),
              reach: parseInt(row.reach ?? "0"),
              cpm: parseFloat(row.cpm ?? "0"),
              results: resultMatch?.value ?? null,
              result_label: resultMatch?.label ?? null,
              cost_per_result: findCostPerAction(cpa, RESULT_ACTIONS),
              leads: findAction(actions, ["lead", "onsite_web_view_content", "view_content", "offsite_conversion.fb_pixel_view_content"]),
              cost_per_lead: findCostPerAction(cpa, ["lead", "onsite_web_view_content", "view_content", "offsite_conversion.fb_pixel_view_content"]),
            },
          };
        } catch {
          return { ...camp, insights: null };
        }
      })
    );

    return NextResponse.json({ campaigns: withInsights });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
