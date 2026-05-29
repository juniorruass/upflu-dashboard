import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "META_ACCESS_TOKEN não está definido no ambiente." }, { status: 500 });
  }

  const masked = `${token.slice(0, 8)}...${token.slice(-6)}`;
  const results: Record<string, unknown> = { token_present: true, token_masked: masked };

  // 1. Debug the token itself
  try {
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`;
    const r = await fetch(debugUrl, { signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    results.debug_token = j;
  } catch (e) {
    results.debug_token_error = String(e);
  }

  // 2. Check /me to see if token is valid at all
  try {
    const meUrl = `https://graph.facebook.com/v19.0/me?access_token=${token}`;
    const r = await fetch(meUrl, { signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    results.me = j;
  } catch (e) {
    results.me_error = String(e);
  }

  // 3. List ad accounts accessible by this token
  try {
    const accsUrl = `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${token}`;
    const r = await fetch(accsUrl, { signal: AbortSignal.timeout(8000) });
    const j = await r.json();
    results.ad_accounts = j;
  } catch (e) {
    results.ad_accounts_error = String(e);
  }

  return NextResponse.json(results);
}
