export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ clientId: string }> };

const META_BASE = "https://graph.facebook.com/v19.0";

const FOLLOWER_TYPES = [
  "instagram_page_follow", "follow", "page_fan", "like",
  "instagram_user_follow", "page_like",
];
const PROFILE_VISIT_TYPES = ["instagram_profile_visit"];

function findFollowerValue(actions: { action_type: string; value: string }[]): number {
  for (const type of FOLLOWER_TYPES) {
    const found = actions?.find((a) => a.action_type === type);
    if (found) return parseInt(found.value);
  }
  const fallback = actions?.find((a) => /follow|fan/i.test(a.action_type));
  return fallback ? parseInt(fallback.value) : 0;
}

function findProfileVisits(actions: { action_type: string; value: string }[]): number {
  for (const type of PROFILE_VISIT_TYPES) {
    const found = actions?.find((a) => a.action_type === type);
    if (found) return parseInt(found.value);
  }
  return 0;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { clientId } = await params;
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Token não configurado." }, { status: 500 });

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("meta_account_id, instagram_followers")
    .eq("id", clientId)
    .single();

  if (!client?.meta_account_id) return NextResponse.json({ error: "Conta não configurada." }, { status: 400 });

  const sp = req.nextUrl.searchParams;
  const datePreset = sp.get("date_preset") || "last_30d";
  const since = sp.get("since");
  const until = sp.get("until");

  try {
    // Busca campanhas
    const campQP = new URLSearchParams({ fields: "id,status,objective", limit: "100", access_token: token });
    const campRes = await fetch(`${META_BASE}/act_${client.meta_account_id}/campaigns?${campQP}`, { signal: AbortSignal.timeout(10000) });
    const campJson = await campRes.json();
    if (campJson.error) return NextResponse.json({ error: campJson.error.message }, { status: 400 });

    const campaigns = campJson.data ?? [];

    // Busca insights por campanha
    const insightQP: Record<string, string> = { fields: "spend,actions,cost_per_action_type", access_token: token };
    if (since && until) { insightQP.time_range = JSON.stringify({ since, until }); }
    else { insightQP.date_preset = datePreset; }

    const results = await Promise.all(
      campaigns.map(async (camp: { id: string }) => {
        try {
          const iRes = await fetch(`${META_BASE}/${camp.id}/insights?${new URLSearchParams(insightQP)}`, { signal: AbortSignal.timeout(8000) });
          const iJson = await iRes.json();
          const row = iJson.data?.[0];
          if (!row) return null;
          const actions: { action_type: string; value: string }[] = row.actions ?? [];
          const cpa: { action_type: string; value: string }[] = row.cost_per_action_type ?? [];
          const spend = parseFloat(row.spend ?? "0");
          const profileVisits = findProfileVisits(actions);
          const followers = findFollowerValue(actions);
          const cpFollower = (() => {
            for (const t of FOLLOWER_TYPES) {
              const f = cpa.find((a) => a.action_type === t);
              if (f) return parseFloat(f.value);
            }
            return null;
          })();
          const cpProfileVisit = (() => {
            for (const t of PROFILE_VISIT_TYPES) {
              const f = cpa.find((a) => a.action_type === t);
              if (f) return parseFloat(f.value);
            }
            return null;
          })();
          return { spend, profileVisits, followers, cpFollower, cpProfileVisit };
        } catch { return null; }
      })
    );

    const valid = results.filter(Boolean) as { spend: number; profileVisits: number; followers: number; cpFollower: number | null; cpProfileVisit: number | null }[];

    const totalFollowersFromAds = valid.reduce((s, c) => s + c.followers, 0);
    const totalProfileVisits = valid.reduce((s, c) => s + c.profileVisits, 0);
    const totalSpend = valid.reduce((s, c) => s + c.spend, 0);

    const costPerFollower = totalFollowersFromAds > 0 && totalSpend > 0 ? totalSpend / totalFollowersFromAds : null;
    const costPerProfileVisit = totalProfileVisits > 0 && totalSpend > 0 ? totalSpend / totalProfileVisits : null;

    // Somente seguidores adquiridos via campanhas — sem fallback manual
    return NextResponse.json({
      followers: totalFollowersFromAds > 0 ? totalFollowersFromAds : null,
      cost_per_follower: totalFollowersFromAds > 0 ? costPerFollower : null,
      profile_visits: totalProfileVisits || null,
      cost_per_profile_visit: costPerProfileVisit,
      is_organic: false,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
