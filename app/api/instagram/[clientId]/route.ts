import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/admin-session";
import { getPortalClientIds } from "@/lib/portal-session";

type Ctx = { params: Promise<{ clientId: string }> };
export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v21.0";

async function fetchFollowers(igId: string, token: string): Promise<{ followers_count: number; username: string } | { error: string }> {
  try {
    const qp = new URLSearchParams({ fields: "followers_count,username", access_token: token });
    const res = await fetch(`${META_BASE}/${igId}?${qp}`, { signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    if (json.error) return { error: `Meta API: ${json.error.message} (código ${json.error.code})` };
    if (json.followers_count == null) return { error: "followers_count não retornado pela API" };
    return { followers_count: json.followers_count, username: json.username ?? null };
  } catch (e) {
    return { error: String(e) };
  }
}

// Busca histórico diário do mês atual via Instagram Insights
async function fetchMonthlyHistory(igId: string, token: string): Promise<{ date: string; followers_count: number }[]> {
  try {
    const now = new Date();
    const since = Math.floor(new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000);
    const until = Math.floor(now.getTime() / 1000);

    const qp = new URLSearchParams({
      metric: "follower_count",
      period: "day",
      since: String(since),
      until: String(until),
      access_token: token,
    });

    const res = await fetch(`${META_BASE}/${igId}/insights?${qp}`, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();

    if (json.error || !json.data?.[0]?.values) return [];

    return json.data[0].values.map((v: { end_time: string; value: number }) => ({
      date: v.end_time.split("T")[0],
      followers_count: v.value,
    }));
  } catch { return []; }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { clientId } = await params;

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, instagram_business_account_id, meta_access_token")
    .eq("id", clientId)
    .single();

  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  const adminOk = await isAdminAuthed(req);
  const portalIds = await getPortalClientIds(req);
  if (!adminOk && !portalIds.includes(client.id)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const igId: string | null = client.instagram_business_account_id ?? null;

  if (!igId) {
    return NextResponse.json({ error: "ID do Instagram não configurado. Edite o cliente no painel admin." }, { status: 404 });
  }

  const token = client.meta_access_token || process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Token não configurado" }, { status: 500 });

  const [current, insightsHistory] = await Promise.all([
    fetchFollowers(igId, token),
    fetchMonthlyHistory(igId, token),
  ]);

  if ("error" in current) {
    return NextResponse.json({ error: current.error, igId }, { status: 502 });
  }

  // Salva snapshot do dia atual no banco
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("instagram_snapshots").upsert(
    { client_id: clientId, date: today, followers_count: current.followers_count },
    { onConflict: "client_id,date" }
  );

  // Usa insights do mês se disponíveis, senão usa snapshots do banco
  let history: { date: string; followers_count: number }[] = insightsHistory;

  if (history.length < 2) {
    const { data: dbSnaps } = await supabase
      .from("instagram_snapshots")
      .select("date, followers_count")
      .eq("client_id", clientId)
      .order("date", { ascending: true })
      .limit(90);
    history = dbSnaps ?? [];
  }

  const oldest = history.length > 0 ? history[0].followers_count : null;
  const growth = oldest != null ? current.followers_count - oldest : null;

  return NextResponse.json({
    followers: current.followers_count,
    username: current.username,
    growth_30d: growth,
    history,
  });
}
