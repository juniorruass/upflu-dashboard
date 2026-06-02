import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ clientId: string }> };
export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v21.0";

async function discoverIgAccount(metaAccountId: string, token: string): Promise<string | null> {
  try {
    const qp = new URLSearchParams({ fields: "id,username", access_token: token });
    const res = await fetch(`${META_BASE}/act_${metaAccountId}/instagram_accounts?${qp}`, {
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    return json.data?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function fetchFollowers(igId: string, token: string): Promise<{ followers_count: number; username: string } | null> {
  try {
    const qp = new URLSearchParams({ fields: "followers_count,username", access_token: token });
    const res = await fetch(`${META_BASE}/${igId}?${qp}`, { signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    if (json.error || json.followers_count == null) return null;
    return { followers_count: json.followers_count, username: json.username ?? null };
  } catch {
    return null;
  }
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { clientId } = await params;
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Token não configurado" }, { status: 500 });

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("id, meta_account_id, instagram_business_account_id")
    .eq("id", clientId)
    .single();

  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  let igId: string | null = client.instagram_business_account_id ?? null;

  if (!igId && client.meta_account_id) {
    igId = await discoverIgAccount(client.meta_account_id, token);
    if (igId) {
      await supabase.from("clients").update({ instagram_business_account_id: igId }).eq("id", clientId);
    }
  }

  if (!igId) {
    return NextResponse.json({ error: "Conta Instagram não encontrada para este cliente" }, { status: 404 });
  }

  const [current, { data: history }] = await Promise.all([
    fetchFollowers(igId, token),
    supabase
      .from("instagram_snapshots")
      .select("date, followers_count")
      .eq("client_id", clientId)
      .order("date", { ascending: true })
      .limit(90),
  ]);

  if (!current) {
    return NextResponse.json({ error: "Não foi possível buscar dados do Instagram" }, { status: 502 });
  }

  // Calcula crescimento dos últimos 30 dias a partir dos snapshots
  const snapshots = history ?? [];
  const oldest = snapshots.length > 0 ? snapshots[0].followers_count : null;
  const growth30 = oldest != null ? current.followers_count - oldest : null;

  return NextResponse.json({
    followers: current.followers_count,
    username: current.username,
    growth_30d: growth30,
    history: snapshots,
  });
}
