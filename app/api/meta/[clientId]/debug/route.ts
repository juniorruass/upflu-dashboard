export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ clientId: string }> };
const META_BASE = "https://graph.facebook.com/v19.0";

export async function GET(req: NextRequest, { params }: Ctx) {
  const { clientId } = await params;
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "sem token" });

  const supabase = createAdminClient();
  const { data: client } = await supabase.from("clients").select("meta_account_id").eq("id", clientId).single();
  if (!client?.meta_account_id) return NextResponse.json({ error: "sem meta_account_id" });

  const acc = client.meta_account_id;
  const results: Record<string, unknown> = {};

  // Token info
  try {
    const r = await fetch(`${META_BASE}/me?fields=id,name&access_token=${token}`, { signal: AbortSignal.timeout(6000) });
    results.me = await r.json();
  } catch (e) { results.me = String(e); }

  // me/accounts
  try {
    const r = await fetch(`${META_BASE}/me/accounts?fields=id,name,instagram_business_account{id,username,followers_count}&access_token=${token}`, { signal: AbortSignal.timeout(8000) });
    results.me_accounts = await r.json();
  } catch (e) { results.me_accounts = String(e); }

  // ads page_id
  try {
    const r = await fetch(`${META_BASE}/act_${acc}/ads?fields=id,page_id,instagram_actor_id&limit=5&access_token=${token}`, { signal: AbortSignal.timeout(8000) });
    results.ads = await r.json();
  } catch (e) { results.ads = String(e); }

  // instagram_accounts
  try {
    const r = await fetch(`${META_BASE}/act_${acc}?fields=instagram_accounts{id,username,followers_count}&access_token=${token}`, { signal: AbortSignal.timeout(6000) });
    results.instagram_accounts = await r.json();
  } catch (e) { results.instagram_accounts = String(e); }

  // token debug
  try {
    const r = await fetch(`${META_BASE}/debug_token?input_token=${token}&access_token=${token}`, { signal: AbortSignal.timeout(6000) });
    results.token_debug = await r.json();
  } catch (e) { results.token_debug = String(e); }

  return NextResponse.json(results);
}
