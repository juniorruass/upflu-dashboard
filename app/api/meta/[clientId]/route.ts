import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ clientId: string }> };

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v19.0";

// Priority order — first match wins as "result"
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

const RESULT_LABELS: Record<string, string> = {
  lead: "Leads",
  purchase: "Compras",
  complete_registration: "Cadastros",
  submit_application: "Aplicações",
  contact: "Contatos",
  "offsite_conversion.fb_pixel_lead": "Leads (Pixel)",
  "offsite_conversion.fb_pixel_purchase": "Compras (Pixel)",
  app_install: "Instalações",
  mobile_app_install: "Instalações",
  link_click: "Cliques no link",
  post_engagement: "Engajamento",
  page_engagement: "Engajamento",
  video_view: "Visualizações de vídeo",
  instagram_profile_visit: "Visitas ao perfil",
  onsite_web_view_content: "Leads (visualização de página)",
  view_content: "Leads (visualização de página)",
  "offsite_conversion.fb_pixel_view_content": "Leads (visualização de página)",
};

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
    if (found) return { value: parseInt(found.value), label: RESULT_LABELS[type] ?? type };
  }
  return null;
}

// Returns ALL distinct result types found (deduplicated by label)
function findAllResults(
  actions: { action_type: string; value: string }[],
  cpa: { action_type: string; value: string }[],
  types: string[]
): { label: string; value: number; cost: number | null }[] {
  const seen = new Set<string>();
  const out: { label: string; value: number; cost: number | null }[] = [];
  for (const type of types) {
    const act = actions?.find((a) => a.action_type === type);
    if (!act) continue;
    const label = RESULT_LABELS[type] ?? type;
    if (seen.has(label)) continue;
    seen.add(label);
    const costEntry = cpa?.find((a) => a.action_type === type);
    out.push({ label, value: parseInt(act.value), cost: costEntry ? parseFloat(costEntry.value) : null });
  }
  return out;
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
    .select("id, name, meta_account_id, meta_access_token, meta_token_expires_at")
    .eq("id", clientId)
    .single();

  if (clientError || !client) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  if (!client.meta_account_id) {
    return NextResponse.json({ error: "meta_account_id não configurado." }, { status: 400 });
  }

  const token = client.meta_access_token || process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Token Meta não configurado. Adicione o token no cadastro do cliente." }, { status: 500 });
  }

  // Aviso de expiração
  let tokenWarning: string | null = null;
  if (client.meta_token_expires_at) {
    const expiresAt = new Date(client.meta_token_expires_at);
    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
    if (daysLeft <= 0) tokenWarning = "Token expirado. Atualize o token Meta no cadastro do cliente.";
    else if (daysLeft <= 7) tokenWarning = `Token expira em ${daysLeft} dia(s). Renove em breve.`;
  }

  const searchParams = req.nextUrl.searchParams;
  const datePreset = searchParams.get("date_preset");
  const since = searchParams.get("since");
  const until = searchParams.get("until");

  try {
    const fields = [
      "spend",
      "impressions",
      "clicks",
      "ctr",
      "reach",
      "frequency",
      "cpm",
      "cpp",
      "actions",
      "cost_per_action_type",
      "website_purchase_roas",
    ].join(",");

    const qp = new URLSearchParams({ fields, access_token: token });

    if (since && until) {
      qp.set("time_range", JSON.stringify({ since, until }));
    } else {
      qp.set("date_preset", datePreset || "last_30d");
    }

    const url = `${META_BASE}/act_${client.meta_account_id}/insights?${qp}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();

    if (json.error) {
      const code = json.error.code ? ` (#${json.error.code})` : "";
      return NextResponse.json({ error: `${json.error.message}${code}` }, { status: 400 });
    }

    const row = json.data?.[0] ?? null;
    if (!row) {
      return NextResponse.json({ data: null, message: "Sem dados para o período selecionado." });
    }

    const actions: { action_type: string; value: string }[] = row.actions ?? [];
    const cpa: { action_type: string; value: string }[] = row.cost_per_action_type ?? [];

    const LEAD_TYPES = ["lead", "onsite_web_view_content", "view_content", "offsite_conversion.fb_pixel_view_content", "offsite_conversion.fb_pixel_lead"];
    const CONV_TYPES = ["messaging_conversation_started_7d", "onsite_conversion.messaging_conversation_started_7d"];
    const FOLLOWER_TYPES = ["follow", "instagram_page_follow", "page_fan", "like", "instagram_user_follow", "page_like"];
    const PROFILE_VISIT_TYPES = ["instagram_profile_visit"];

    const leads = findAction(actions, LEAD_TYPES);
    const purchases = findAction(actions, ["purchase"]);
    const resultMatch = findResultWithLabel(actions, RESULT_ACTIONS);
    const results = resultMatch?.value ?? null;
    const result_label = resultMatch?.label ?? null;
    const costPerResult = findCostPerAction(cpa, RESULT_ACTIONS);
    const all_results = findAllResults(actions, cpa, RESULT_ACTIONS);
    const costPerLead = findCostPerAction(cpa, LEAD_TYPES);
    const costPerPurchase = findCostPerAction(cpa, ["purchase"]);

    const conversations = findAction(actions, CONV_TYPES);
    const costPerConversation = findCostPerAction(cpa, CONV_TYPES);

    // Busca seguidores por lista fixa, com fallback buscando qualquer action_type contendo "follow" ou "fan"
    let followers = findAction(actions, FOLLOWER_TYPES);
    let costPerFollower = findCostPerAction(cpa, FOLLOWER_TYPES);
    if (!followers) {
      const fallback = actions.find((a) => /follow|fan/i.test(a.action_type));
      if (fallback) {
        followers = parseInt(fallback.value);
        const cpaFallback = cpa.find((a) => a.action_type === fallback.action_type);
        costPerFollower = cpaFallback ? parseFloat(cpaFallback.value) : null;
      }
    }

    const profileVisits = findAction(actions, PROFILE_VISIT_TYPES);
    const costPerProfileVisit = findCostPerAction(cpa, PROFILE_VISIT_TYPES);

    const spend = parseFloat(row.spend ?? "0");
    const roasArr = row.website_purchase_roas as { action_type: string; value: string }[] | undefined;
    const roas = roasArr?.[0] ? parseFloat(roasArr[0].value) : null;

    return NextResponse.json({
      tokenWarning,
      data: {
        spend,
        impressions: parseInt(row.impressions ?? "0"),
        clicks: parseInt(row.clicks ?? "0"),
        ctr: parseFloat(row.ctr ?? "0"),
        reach: parseInt(row.reach ?? "0"),
        frequency: parseFloat(row.frequency ?? "0"),
        cpm: parseFloat(row.cpm ?? "0"),
        cpp: parseFloat(row.cpp ?? "0"),
        leads,
        purchases,
        results,
        result_label,
        all_results,
        cost_per_result: costPerResult,
        cost_per_lead: costPerLead,
        cost_per_purchase: costPerPurchase,
        cpl: leads && spend ? spend / leads : null,
        roas,
        conversations,
        cost_per_conversation: costPerConversation,
        followers,
        cost_per_follower: costPerFollower,
        profile_visits: profileVisits,
        cost_per_profile_visit: costPerProfileVisit,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
