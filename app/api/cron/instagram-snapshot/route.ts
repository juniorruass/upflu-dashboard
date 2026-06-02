import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v21.0";

async function discoverIgAccount(metaAccountId: string, token: string): Promise<string | null> {
  try {
    const qp = new URLSearchParams({ fields: "id", access_token: token });
    const res = await fetch(`${META_BASE}/act_${metaAccountId}/instagram_accounts?${qp}`, {
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json();
    return json.data?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "no token" }, { status: 500 });

  const supabase = createAdminClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, meta_account_id, instagram_business_account_id")
    .in("status", ["active", "onboarding"]);

  if (!clients?.length) return NextResponse.json({ ok: true, saved: 0 });

  const today = new Date().toISOString().split("T")[0];
  let saved = 0;
  const errors: string[] = [];

  await Promise.all(
    clients.map(async (client) => {
      let igId: string | null = client.instagram_business_account_id ?? null;

      if (!igId && client.meta_account_id) {
        igId = await discoverIgAccount(client.meta_account_id, token);
        if (igId) {
          await supabase.from("clients").update({ instagram_business_account_id: igId }).eq("id", client.id);
        }
      }

      if (!igId) return;

      try {
        const qp = new URLSearchParams({ fields: "followers_count", access_token: token });
        const res = await fetch(`${META_BASE}/${igId}?${qp}`, { signal: AbortSignal.timeout(8000) });
        const json = await res.json();

        if (json.error || json.followers_count == null) {
          errors.push(`${client.id}: ${json.error?.message ?? "sem dados"}`);
          return;
        }

        await supabase.from("instagram_snapshots").upsert(
          { client_id: client.id, date: today, followers_count: json.followers_count },
          { onConflict: "client_id,date" }
        );
        saved++;
      } catch (e) {
        errors.push(`${client.id}: ${String(e)}`);
      }
    })
  );

  return NextResponse.json({ ok: true, saved, errors: errors.length ? errors : undefined });
}
