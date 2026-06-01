import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ clientId: string }> };

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v19.0";

const FOLLOWER_TYPES = [
  "instagram_page_follow",
  "follow",
  "page_fan",
  "like",
  "instagram_user_follow",
  "page_like",
];

const PROFILE_VISIT_TYPES = ["instagram_profile_visit"];

function findValue(actions: { action_type: string; value: string }[], types: string[]): number {
  for (const type of types) {
    const found = actions?.find((a) => a.action_type === type);
    if (found) return parseInt(found.value);
  }
  // Fallback: any action_type containing follow/fan
  const fallback = actions?.find((a) => /follow|fan/i.test(a.action_type));
  return fallback ? parseInt(fallback.value) : 0;
}

function findFollowerValue(actions: { action_type: string; value: string }[]): number {
  for (const type of FOLLOWER_TYPES) {
    const found = actions?.find((a) => a.action_type === type);
    if (found) return parseInt(found.value);
  }
  const fallback = actions?.find((a) => /follow|fan/i.test(a.action_type));
  return fallback ? parseInt(fallback.value) : 0;
}

async function tryGetInstagramId(accountId: string, token: string): Promise<string | null> {
  // Tenta 1: via instagram_accounts do ad account
  try {
    const r = await fetch(`${META_BASE}/act_${accountId}?fields=instagram_accounts{id,username}&access_token=${token}`, { signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    const id = j.instagram_accounts?.data?.[0]?.id;
    if (id) return id;
  } catch { /* ignora */ }

  // Tenta 2: via instagram_actors (contas usadas nos anúncios)
  try {
    const r = await fetch(`${META_BASE}/act_${accountId}/ads?fields=instagram_actor_id&limit=10&access_token=${token}`, { signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    for (const ad of j.data ?? []) {
      if (ad.instagram_actor_id) return ad.instagram_actor_id;
    }
  } catch { /* ignora */ }

  // Tenta 3: via promoted_object das campanhas
  try {
    const r = await fetch(`${META_BASE}/act_${accountId}/campaigns?fields=promoted_object&limit=10&access_token=${token}`, { signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    for (const c of j.data ?? []) {
      if (c.promoted_object?.instagram_profile_id) return c.promoted_object.instagram_profile_id;
    }
  } catch { /* ignora */ }

  // Tenta 4: pages conectadas à conta
  try {
    const r = await fetch(`${META_BASE}/act_${accountId}?fields=owner_business&access_token=${token}`, { signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    const bizId = j.owner_business?.id;
    if (bizId) {
      const r2 = await fetch(`${META_BASE}/${bizId}/instagram_accounts?fields=id,username&access_token=${token}`, { signal: AbortSignal.timeout(6000) });
      const j2 = await r2.json();
      const id = j2.data?.[0]?.id;
      if (id) return id;
    }
  } catch { /* ignora */ }

  return null;
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
    // 1. Busca todas as campanhas (ativas e pausadas)
    const campQP = new URLSearchParams({
      fields: "id,name,status,objective",
      limit: "100",
      access_token: token,
    });
    const campRes = await fetch(`${META_BASE}/act_${client.meta_account_id}/campaigns?${campQP}`, { signal: AbortSignal.timeout(10000) });
    const campJson = await campRes.json();

    if (campJson.error) return NextResponse.json({ error: campJson.error.message }, { status: 400 });

    const campaigns = campJson.data ?? [];

    // 2. Busca insights por campanha em paralelo
    const insightQP: Record<string, string> = {
      fields: "spend,actions,cost_per_action_type",
      access_token: token,
    };
    if (since && until) {
      insightQP.time_range = JSON.stringify({ since, until });
    } else {
      insightQP.date_preset = datePreset;
    }

    const results = await Promise.all(
      campaigns.map(async (camp: { id: string; name: string; objective: string }) => {
        try {
          const iRes = await fetch(
            `${META_BASE}/${camp.id}/insights?${new URLSearchParams(insightQP)}`,
            { signal: AbortSignal.timeout(8000) }
          );
          const iJson = await iRes.json();
          const row = iJson.data?.[0];
          if (!row) return null;

          const actions: { action_type: string; value: string }[] = row.actions ?? [];
          const spend = parseFloat(row.spend ?? "0");
          const profileVisits = findValue(actions, PROFILE_VISIT_TYPES);
          const followers = findFollowerValue(actions);

          return { id: camp.id, name: camp.name, objective: camp.objective, spend, profileVisits, followers };
        } catch {
          return null;
        }
      })
    );

    const valid = results.filter(Boolean) as {
      id: string; name: string; objective: string;
      spend: number; profileVisits: number; followers: number;
    }[];

    // 3. Campanhas de visita ao perfil = tem instagram_profile_visit ou objective inclui AWARENESS/REACH
    const profileCamps = valid.filter((c) => c.profileVisits > 0);
    const allCamps = valid;

    const totalFollowers = allCamps.reduce((s, c) => s + c.followers, 0);
    const totalProfileVisits = allCamps.reduce((s, c) => s + c.profileVisits, 0);
    const profileCampSpend = profileCamps.reduce((s, c) => s + c.spend, 0);
    const costPerFollower = totalFollowers > 0 && profileCampSpend > 0
      ? profileCampSpend / totalFollowers
      : null;
    const costPerProfileVisit = totalProfileVisits > 0 && profileCampSpend > 0
      ? profileCampSpend / totalProfileVisits
      : null;

    // 4. Fallback: busca seguidores do Instagram via instagram_actor dos anúncios
    let igFollowers: number | null = null;
    let igUsername: string | null = null;

    if (!totalFollowers) {
      const igId = await tryGetInstagramId(client.meta_account_id, token);
      if (igId) {
        try {
          const profileQP = new URLSearchParams({ fields: "id,username,followers_count", access_token: token });
          const profileRes = await fetch(`${META_BASE}/${igId}?${profileQP}`, { signal: AbortSignal.timeout(8000) });
          const profileJson = await profileRes.json();
          if (profileJson.followers_count) {
            igFollowers = profileJson.followers_count;
            igUsername = profileJson.username ?? null;
          }
        } catch { /* ignora */ }
      }
    }

    // Último fallback: valor manual cadastrado no ADM
    const manualFollowers = (client as { instagram_followers?: number | null }).instagram_followers ?? null;
    const finalFollowers = totalFollowers || igFollowers || manualFollowers || null;
    const isOrganic = !totalFollowers && !!(igFollowers || manualFollowers);

    return NextResponse.json({
      followers: finalFollowers,
      cost_per_follower: totalFollowers ? costPerFollower : null,
      profile_visits: totalProfileVisits || null,
      cost_per_profile_visit: costPerProfileVisit,
      profile_camp_spend: profileCampSpend || null,
      instagram_username: igUsername,
      is_organic: isOrganic,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
