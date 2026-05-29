import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

type Ctx = { params: Promise<{ clientId: string }> };

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v19.0";

const LEAD_TYPES = [
  "lead",
  "onsite_web_view_content",
  "view_content",
  "offsite_conversion.fb_pixel_view_content",
  "offsite_conversion.fb_pixel_lead",
];

function findLeads(actions: { action_type: string; value: string }[]): number {
  for (const type of LEAD_TYPES) {
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
    .select("meta_account_id")
    .eq("id", clientId)
    .single();

  if (!client?.meta_account_id) return NextResponse.json({ error: "Conta não configurada." }, { status: 400 });

  const sp = req.nextUrl.searchParams;
  const datePreset = sp.get("date_preset") || "last_7d";
  const since = sp.get("since");
  const until = sp.get("until");

  const qp = new URLSearchParams({
    fields: "date_start,spend,impressions,clicks,actions",
    time_increment: "1",
    access_token: token,
  });

  if (since && until) {
    qp.set("time_range", JSON.stringify({ since, until }));
  } else {
    qp.set("date_preset", datePreset);
  }

  try {
    const url = `${META_BASE}/act_${client.meta_account_id}/insights?${qp}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();

    if (json.error) {
      return NextResponse.json({ error: json.error.message }, { status: 400 });
    }

    const rows = json.data ?? [];
    const daily = rows.map((row: { date_start: string; spend: string; impressions: string; clicks: string; actions?: { action_type: string; value: string }[] }) => ({
      date: row.date_start,
      leads: findLeads(row.actions ?? []),
      spend: parseFloat(row.spend ?? "0"),
      impressions: parseInt(row.impressions ?? "0"),
      clicks: parseInt(row.clicks ?? "0"),
    }));

    return NextResponse.json({ data: daily });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
