import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ clientId: string }> };
export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v21.0";

function presetToDates(preset: string): { since: Date; until: Date } {
  const now = new Date();
  const until = new Date(now);
  const since = new Date(now);

  switch (preset) {
    case "today":
      since.setHours(0, 0, 0, 0);
      break;
    case "yesterday":
      since.setDate(since.getDate() - 1); since.setHours(0, 0, 0, 0);
      until.setDate(until.getDate() - 1); until.setHours(23, 59, 59, 0);
      break;
    case "last_7d":
      since.setDate(since.getDate() - 7);
      break;
    case "last_30d":
    default:
      since.setDate(since.getDate() - 30);
      break;
  }
  return { since, until };
}

async function fetchFollowersAt(igId: string, token: string, since: Date, until: Date): Promise<{ start: number | null; end: number | null }> {
  try {
    const sinceTs = Math.floor(since.getTime() / 1000);
    const untilTs = Math.floor(until.getTime() / 1000) + 86400;
    const qp = new URLSearchParams({
      metric: "follower_count",
      period: "day",
      since: String(sinceTs),
      until: String(untilTs),
      access_token: token,
    });
    const res = await fetch(`${META_BASE}/${igId}/insights?${qp}`, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();
    if (json.error || !json.data?.[0]?.values?.length) return { start: null, end: null };
    const values: { value: number }[] = json.data[0].values;
    return { start: values[0].value, end: values[values.length - 1].value };
  } catch { return { start: null, end: null }; }
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { clientId } = await params;
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ growth: null });

  const preset = req.nextUrl.searchParams.get("date_preset") ?? "last_30d";

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("instagram_business_account_id")
    .eq("id", clientId)
    .single();

  const igId = client?.instagram_business_account_id;
  if (!igId) return NextResponse.json({ growth: null });

  // Tenta via Instagram Insights API
  const { since, until } = presetToDates(preset);
  const { start, end } = await fetchFollowersAt(igId, token, since, until);

  if (start != null && end != null) {
    return NextResponse.json({ growth: end - start, source: "insights" });
  }

  // Fallback: snapshots do banco
  const sinceStr = since.toISOString().split("T")[0];
  const { data: snaps } = await supabase
    .from("instagram_snapshots")
    .select("date, followers_count")
    .eq("client_id", clientId)
    .gte("date", sinceStr)
    .order("date", { ascending: true });

  if (!snaps || snaps.length < 2) return NextResponse.json({ growth: null });

  const growth = snaps[snaps.length - 1].followers_count - snaps[0].followers_count;
  return NextResponse.json({ growth, source: "snapshots" });
}
