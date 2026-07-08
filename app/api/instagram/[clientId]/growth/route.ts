import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/admin-session";
import { getPortalClientIds } from "@/lib/portal-session";

type Ctx = { params: Promise<{ clientId: string }> };
export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v21.0";

function presetToDates(preset: string): { since: Date; until: Date } {
  const now = new Date();
  const until = new Date(now);
  const since = new Date(now);
  switch (preset) {
    case "today":     since.setHours(0, 0, 0, 0); break;
    case "yesterday":
      since.setDate(since.getDate() - 1); since.setHours(0, 0, 0, 0);
      until.setDate(until.getDate() - 1); until.setHours(23, 59, 59, 0);
      break;
    case "last_7d":  since.setDate(since.getDate() - 7);  break;
    case "last_30d":
    default:         since.setDate(since.getDate() - 29); break;
  }
  return { since, until };
}

// follower_count no Instagram Insights retorna NOVOS seguidores por dia (delta)
// Somamos todos os valores para obter o crescimento total no período
async function fetchGrowthFromInsights(igId: string, token: string, since: Date, until: Date): Promise<{ growth: number | null; debug: unknown }> {
  try {
    const sinceTs = Math.floor(since.getTime() / 1000);
    const untilTs = Math.floor(until.getTime() / 1000);
    const qp = new URLSearchParams({
      metric: "follower_count",
      period: "day",
      since: String(sinceTs),
      until: String(untilTs),
      access_token: token,
    });
    const res = await fetch(`${META_BASE}/${igId}/insights?${qp}`, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();
    if (json.error) return { growth: null, debug: { api_error: json.error } };
    if (!json.data?.[0]?.values?.length) return { growth: null, debug: { raw: json } };
    const values: { value: number }[] = json.data[0].values;
    return { growth: values.reduce((sum, v) => sum + (v.value ?? 0), 0), debug: null };
  } catch (e) {
    return { growth: null, debug: { exception: String(e) } };
  }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { clientId } = await params;

  const preset = req.nextUrl.searchParams.get("date_preset") ?? "last_30d";

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("instagram_business_account_id, meta_access_token")
    .eq("id", clientId)
    .single();

  const igId = client?.instagram_business_account_id;
  if (!igId) return NextResponse.json({ growth: null });

  const adminOk = await isAdminAuthed(req);
  const portalIds = await getPortalClientIds(req);
  if (!adminOk && !portalIds.includes(clientId)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const token = client?.meta_access_token || process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ growth: null });

  const { since, until } = presetToDates(preset);

  // Tenta via Instagram Insights API
  const { growth: insightsGrowth, debug: insightsDebug } = await fetchGrowthFromInsights(igId, token, since, until);
  if (insightsGrowth !== null) {
    return NextResponse.json({ growth: insightsGrowth, source: "insights" });
  }

  // Fallback: snapshots do banco (absoluto — diferença entre primeiro e último)
  const sinceStr = since.toISOString().split("T")[0];
  const { data: snaps } = await supabase
    .from("instagram_snapshots")
    .select("date, followers_count")
    .eq("client_id", clientId)
    .gte("date", sinceStr)
    .gt("followers_count", 0)
    .order("date", { ascending: true });

  if (!snaps || snaps.length < 2) {
    return NextResponse.json({ growth: null, debug: { insights: insightsDebug, snapshots: snaps ?? [], igId } });
  }

  return NextResponse.json({
    growth: snaps[snaps.length - 1].followers_count - snaps[0].followers_count,
    source: "snapshots",
  });
}
