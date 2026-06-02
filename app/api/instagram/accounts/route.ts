import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v21.0";

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Token não configurado" }, { status: 500 });

  const accounts: { id: string; username: string; name: string; followers_count: number }[] = [];

  // Busca via páginas
  try {
    const qp = new URLSearchParams({
      fields: "id,name,instagram_business_account{id,username,name,followers_count}",
      limit: "25",
      access_token: token,
    });
    const res = await fetch(`${META_BASE}/me/accounts?${qp}`, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();
    for (const page of json.data ?? []) {
      const ig = page.instagram_business_account;
      if (ig?.id) {
        accounts.push({
          id: ig.id,
          username: ig.username ?? "",
          name: ig.name ?? page.name ?? "",
          followers_count: ig.followers_count ?? 0,
        });
      }
    }
  } catch { /* ignora */ }

  // Busca via ad accounts se nada encontrado via páginas
  if (accounts.length === 0) {
    try {
      const adQP = new URLSearchParams({ fields: "id,name", limit: "25", access_token: token });
      const adRes = await fetch(`${META_BASE}/me/adaccounts?${adQP}`, { signal: AbortSignal.timeout(10000) });
      const adJson = await adRes.json();

      await Promise.all(
        (adJson.data ?? []).map(async (ad: { id: string }) => {
          try {
            const igQP = new URLSearchParams({ fields: "id,username,name,followers_count", access_token: token });
            const igRes = await fetch(`${META_BASE}/${ad.id}/instagram_accounts?${igQP}`, { signal: AbortSignal.timeout(8000) });
            const igJson = await igRes.json();
            for (const ig of igJson.data ?? []) {
              if (ig.id && !accounts.find((a) => a.id === ig.id)) {
                accounts.push({ id: ig.id, username: ig.username ?? "", name: ig.name ?? "", followers_count: ig.followers_count ?? 0 });
              }
            }
          } catch { /* ignora */ }
        })
      );
    } catch { /* ignora */ }
  }

  return NextResponse.json({ accounts });
}
