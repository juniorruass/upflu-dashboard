// Mapeia o objetivo REAL configurado no conjunto de anúncios (optimization_goal
// da Meta) pro action_type correspondente nos insights — em vez de adivinhar
// qual resultado é "o principal" por prioridade fixa (isso quebra porque cada
// cliente/campanha tem um objetivo diferente: lead, venda, conversa no
// WhatsApp, engajamento etc.).
//
// Referência: developers.facebook.com/docs/marketing-api/reference/ad-campaign
// (optimization_goal) — combinado com promoted_object.custom_event_type
// quando o goal é genérico (OFFSITE_CONVERSIONS / VALUE).

export type PromotedObject = { custom_event_type?: string } | undefined;

// Compra tem vários action_types conforme onde a conversão acontece (checkout
// externo via pixel, compra dentro do próprio Instagram/Facebook via
// "onsite"/"omni") — todos representam a MESMA venda, então usamos
// first-match-wins (nunca somar) igual ao resto do código.
export const PURCHASE_TYPES = [
  "purchase",
  "onsite_conversion.purchase",
  "omni_purchase",
  "onsite_web_purchase",
  "onsite_app_purchase",
  "onsite_web_app_purchase",
  "offsite_conversion.fb_pixel_purchase",
];

// Lista de prioridade genérica — usada só como fallback quando a Meta não
// retorna optimization_goal (ou ele não é reconhecido).
export const RESULT_ACTIONS = [
  "lead",
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.total_messaging_connection",
  "messaging_conversation_started_7d",
  ...PURCHASE_TYPES,
  "complete_registration",
  "submit_application",
  "contact",
  "offsite_conversion.fb_pixel_lead",
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

const MESSAGING_TYPES = [
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.total_messaging_connection",
  "messaging_conversation_started_7d",
];

const CUSTOM_EVENT_MAP: Record<string, string[]> = {
  PURCHASE: PURCHASE_TYPES,
  LEAD: ["lead", "offsite_conversion.fb_pixel_lead"],
  COMPLETE_REGISTRATION: ["complete_registration"],
  CONTACT: ["contact"],
  SUBSCRIBE: ["subscribe"],
  START_TRIAL: ["start_trial"],
  SUBMIT_APPLICATION: ["submit_application"],
};

// Retorna os action_types candidatos (em ordem) pro objetivo real da campanha.
// Se o goal não for reconhecido, retorna null — quem chama deve cair pra uma
// lista de prioridade genérica como fallback.
export function actionTypesForGoal(optimizationGoal: string | null | undefined, promotedObject: PromotedObject): string[] | null {
  if (!optimizationGoal) return null;

  switch (optimizationGoal) {
    case "LEAD_GENERATION":
    case "QUALITY_LEAD":
      return ["lead"];
    case "CONVERSATIONS":
    case "MESSAGING_PURCHASE_CONVERSION":
    case "MESSAGING_APPOINTMENT_CONVERSION":
      return MESSAGING_TYPES;
    case "LINK_CLICKS":
      return ["link_click"];
    case "LANDING_PAGE_VIEWS":
      return ["landing_page_view"];
    case "THRUPLAY":
      return ["video_view"];
    case "APP_INSTALLS":
    case "APP_INSTALLS_AND_OFFSITE_CONVERSIONS":
      return ["app_install", "mobile_app_install"];
    case "POST_ENGAGEMENT":
    case "ENGAGED_USERS":
    case "PROFILE_AND_PAGE_ENGAGEMENT":
      return ["post_engagement", "page_engagement"];
    case "VISIT_INSTAGRAM_PROFILE":
    case "PROFILE_VISIT":
      return ["instagram_profile_visit"];
    case "QUALITY_CALL":
    case "MEANINGFUL_CALL_ATTEMPT":
      return ["contact"];
    case "OFFSITE_CONVERSIONS":
    case "VALUE":
    case "IN_APP_VALUE":
    case "DERIVED_EVENTS": {
      const custom = promotedObject?.custom_event_type;
      if (custom && CUSTOM_EVENT_MAP[custom]) return CUSTOM_EVENT_MAP[custom];
      return PURCHASE_TYPES; // fallback comum p/ OUTCOME_SALES
    }
    // REACH, IMPRESSIONS, AD_RECALL_LIFT, PAGE_LIKES etc. não têm "resultado"
    // discreto — retorna null pra não forçar um número que não existe.
    default:
      return null;
  }
}

const LABELS: Record<string, string> = {
  lead: "Leads",
  purchase: "Compras",
  "onsite_conversion.purchase": "Compras",
  omni_purchase: "Compras",
  onsite_web_purchase: "Compras",
  onsite_app_purchase: "Compras",
  onsite_web_app_purchase: "Compras",
  "offsite_conversion.fb_pixel_purchase": "Compras",
  "offsite_conversion.fb_pixel_lead": "Leads",
  complete_registration: "Cadastros",
  contact: "Contatos",
  subscribe: "Assinaturas",
  start_trial: "Testes iniciados",
  submit_application: "Aplicações",
  link_click: "Cliques no link",
  landing_page_view: "Visualizações da página",
  video_view: "Visualizações de vídeo",
  app_install: "Instalações",
  mobile_app_install: "Instalações",
  post_engagement: "Engajamento",
  page_engagement: "Engajamento",
  instagram_profile_visit: "Visitas ao perfil",
  "onsite_conversion.messaging_conversation_started_7d": "Conversas iniciadas (WhatsApp)",
  "onsite_conversion.total_messaging_connection": "Conversas iniciadas (WhatsApp)",
  messaging_conversation_started_7d: "Conversas iniciadas (WhatsApp)",
};

export function labelForActionType(type: string): string {
  return LABELS[type] ?? type;
}

// Opções pro admin escolher manualmente a métrica principal do cliente
// (substitui a detecção automática via optimization_goal quando o Junior
// quer forçar qual resultado aparece como "principal").
export const PRIMARY_METRIC_OPTIONS: { key: string; label: string; types: string[] }[] = [
  { key: "lead", label: "Leads", types: ["lead", "offsite_conversion.fb_pixel_lead", "onsite_web_view_content", "view_content", "offsite_conversion.fb_pixel_view_content"] },
  { key: "purchase", label: "Vendas", types: PURCHASE_TYPES },
  { key: "conversation", label: "Conversas (WhatsApp)", types: MESSAGING_TYPES },
  { key: "contact", label: "Contatos", types: ["contact"] },
  { key: "complete_registration", label: "Cadastros", types: ["complete_registration"] },
  { key: "link_click", label: "Cliques no link", types: ["link_click"] },
  { key: "profile_visit", label: "Visitas ao perfil", types: ["instagram_profile_visit"] },
];

export function actionTypesForPrimaryMetric(key: string | null | undefined): string[] | null {
  if (!key) return null;
  return PRIMARY_METRIC_OPTIONS.find((o) => o.key === key)?.types ?? null;
}

// Busca no array de ad sets qual optimization_goal predomina (a maioria das
// campanhas ativas de uma conta costuma compartilhar o mesmo objetivo).
export function dominantGoal(goals: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const g of goals) {
    if (!g) continue;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  counts.forEach((c, g) => {
    if (c > bestCount) { best = g; bestCount = c; }
  });
  return best;
}
