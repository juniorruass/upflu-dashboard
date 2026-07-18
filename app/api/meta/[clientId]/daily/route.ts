import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/admin-session";
import { getPortalClientIds } from "@/lib/portal-session";
import { actionTypesForGoal, actionTypesForPrimaryMetric, dominantGoal, RESULT_ACTIONS } from "@/lib/meta-goals";

type Ctx = { params: Promise<{ clientId: string }> };

export const dynamic = "force-dynamic";

const META_BASE = "https://graph.facebook.com/v19.0";

function findResult(actions: { action_type: string; value: string }[], types: string[]): number {
  for (const type of types) {
    const found = actions?.find((a) => a.action_type === type);
    if (found) return parseInt(found.value);
  }
  return 0;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const { clientId } = await params;

  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from("clients")
    .select("meta_account_id, meta_access_token, primary_metric")
    .eq("id", clientId)
    .single();

  if (!client?.meta_account_id) return NextResponse.json({ error: "Conta não configurada." }, { status: 400 });

  const adminOk = await isAdminAuthed(req);
  const portalIds = await getPortalClientIds(req);
  if (!adminOk && !portalIds.includes(clientId)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const token = client.meta_access_token || process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Token não configurado." }, { status: 500 });

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
    // Objetivo real das campanhas ativas — mesmo critério usado no endpoint
    // agregado (/api/meta/[clientId]), pra "leads no período" bater com o
    // "resultado principal" em vez de forçar um action_type fixo de lead.
    let priorityTypes = RESULT_ACTIONS;
    const manualTypes = actionTypesForPrimaryMetric(client.primary_metric);
    if (manualTypes) {
      priorityTypes = manualTypes;
    } else {
      try {
        const campQP = new URLSearchParams({
          fields: "id",
          filtering: JSON.stringify([{ field: "effective_status", operator: "IN", value: ["ACTIVE"] }]),
          limit: "10",
          access_token: token,
        });
        const campsRes = await fetch(`${META_BASE}/act_${client.meta_account_id}/campaigns?${campQP}`, { signal: AbortSignal.timeout(8000) });
        const campsJson = await campsRes.json();
        const campIds: string[] = (campsJson.data ?? []).map((c: { id: string }) => c.id);

        const goals = await Promise.all(
          campIds.map(async (id) => {
            const r = await fetch(`${META_BASE}/${id}/adsets?fields=optimization_goal&limit=1&access_token=${token}`, { signal: AbortSignal.timeout(6000) });
            const j = await r.json();
            return (j.data?.[0]?.optimization_goal as string | undefined) ?? null;
          })
        );

        const goal = dominantGoal(goals);
        const goalTypes = actionTypesForGoal(goal, undefined);
        if (goalTypes) priorityTypes = goalTypes;
      } catch { /* mantém fallback RESULT_ACTIONS */ }
    }

    const url = `${META_BASE}/act_${client.meta_account_id}/insights?${qp}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const json = await res.json();

    if (json.error) {
      return NextResponse.json({ error: json.error.message }, { status: 400 });
    }

    const rows = json.data ?? [];
    const daily = rows.map((row: { date_start: string; spend: string; impressions: string; clicks: string; actions?: { action_type: string; value: string }[] }) => ({
      date: row.date_start,
      leads: findResult(row.actions ?? [], priorityTypes),
      spend: parseFloat(row.spend ?? "0"),
      impressions: parseInt(row.impressions ?? "0"),
      clicks: parseInt(row.clicks ?? "0"),
    }));

    return NextResponse.json({ data: daily });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
