import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/admin-session";
import { getPortalClientIds } from "@/lib/portal-session";
import { actionTypesForGoal, labelForActionType } from "@/lib/meta-goals";

type Ctx = { params: Promise<{ clientId: string }> };

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v19.0";

// Conversas de WhatsApp/Messenger vêm antes de link_click/engajamento —
// numa campanha de conversão pro WhatsApp, "clique no link" é só o meio,
// a conversa iniciada é o resultado real (o "lead" de fato).
const RESULT_ACTIONS = [
  "lead",
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.total_messaging_connection",
  "messaging_conversation_started_7d",
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
  for (const type of types) {
    const found = actions?.find((a) => a.action_type === type);
    if (found) return { value: parseInt(found.value), label: labelForActionType(type) };
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

  const supabase = createAdminClient();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, meta_account_id, meta_access_token")
    .eq("id", clientId)
    .single();

  if (clientError || !client || !client.meta_account_id) {
    return NextResponse.json({ error: "Cliente não encontrado ou sem Meta configurado." }, { status: 404 });
  }

  const adminOk = await isAdminAuthed(req);
  const portalIds = await getPortalClientIds(req);
  if (!adminOk && !portalIds.includes(client.id)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const token = client.meta_access_token || process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Token Meta não configurado." }, { status: 500 });
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

    // Fetch insights + objetivo real (optimization_goal do conjunto de
    // anúncios) pra cada campanha em paralelo
    const withInsights = await Promise.all(
      campaigns.map(async (camp: { id: string; name: string; status: string; objective: string }) => {
        try {
          const iQP = new URLSearchParams({ fields: insightFields, access_token: token, ...insightParams });
          const [iRes, adsetsRes] = await Promise.all([
            fetch(`${META_BASE}/${camp.id}/insights?${iQP}`, { signal: AbortSignal.timeout(8000) }),
            fetch(`${META_BASE}/${camp.id}/adsets?fields=optimization_goal,promoted_object&limit=10&access_token=${token}`, { signal: AbortSignal.timeout(8000) }),
          ]);
          const iJson = await iRes.json();
          const row = iJson.data?.[0] ?? null;

          if (!row) return { ...camp, insights: null };

          const actions: { action_type: string; value: string }[] = row.actions ?? [];
          const cpa: { action_type: string; value: string }[] = row.cost_per_action_type ?? [];
          const spend = parseFloat(row.spend ?? "0");

          // Objetivo real configurado no ad set (o que o cliente realmente
          // está otimizando) — só cai pra lista de prioridade genérica
          // (RESULT_ACTIONS) se a Meta não retornar isso.
          let priorityTypes = RESULT_ACTIONS;
          try {
            const adsetsJson = await adsetsRes.json();
            const firstSet = adsetsJson.data?.[0];
            const goalTypes = actionTypesForGoal(firstSet?.optimization_goal, firstSet?.promoted_object);
            if (goalTypes) priorityTypes = goalTypes;
          } catch { /* mantém fallback */ }

          const resultMatch = findResultWithLabel(actions, priorityTypes);

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
              cost_per_result: findCostPerAction(cpa, priorityTypes),
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
