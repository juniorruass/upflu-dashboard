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

const MESSAGING_TYPES = [
  "onsite_conversion.messaging_conversation_started_7d",
  "onsite_conversion.total_messaging_connection",
  "messaging_conversation_started_7d",
];

const CUSTOM_EVENT_MAP: Record<string, string[]> = {
  PURCHASE: ["purchase", "offsite_conversion.fb_pixel_purchase"],
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
      return ["purchase", "offsite_conversion.fb_pixel_purchase"]; // fallback comum p/ OUTCOME_SALES
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
