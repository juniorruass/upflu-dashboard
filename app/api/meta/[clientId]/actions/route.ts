import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/admin-session";
import { getPortalClientIds } from "@/lib/portal-session";

type Ctx = { params: Promise<{ clientId: string }> };

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: Ctx) {
  const { clientId } = await params;

  const supabase = createAdminClient();

  // Try by UUID first, then by slug/name
  let client: { id: string; meta_account_id: string | null; name: string; meta_access_token: string | null } | null = null;
  const byId = await supabase.from("clients").select("id, meta_account_id, name, meta_access_token").eq("id", clientId).single();
  if (byId.data) {
    client = byId.data;
  } else {
    const all = await supabase.from("clients").select("id, meta_account_id, name, slug, meta_access_token");
    const slugNorm = clientId.toLowerCase();
    client = (all.data ?? []).find((c: { slug: string | null; name: string; meta_account_id: string | null }) =>
      c.slug === slugNorm || c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === slugNorm
    ) ?? null;
  }

  if (!client?.meta_account_id) return NextResponse.json({ error: "Conta não configurada" }, { status: 400 });

  const adminOk = await isAdminAuthed(req);
  const portalIds = await getPortalClientIds(req);
  if (!adminOk && !portalIds.includes(client.id)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const token = client.meta_access_token || process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: "Token não configurado" }, { status: 500 });

  const sp = req.nextUrl.searchParams;
  const datePreset = sp.get("date_preset") || "last_30d";

  const qp = new URLSearchParams({
    fields: "actions,cost_per_action_type",
    date_preset: datePreset,
    access_token: token,
  });

  const url = `https://graph.facebook.com/v19.0/act_${client.meta_account_id}/insights?${qp}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  const json = await res.json();

  if (json.error) return NextResponse.json({ error: json.error.message }, { status: 400 });

  const row = json.data?.[0];
  if (!row) return NextResponse.json({ message: "Sem dados", actions: [], cpa: [] });

  return NextResponse.json({
    client: client.name,
    all_action_types: (row.actions ?? []).map((a: { action_type: string; value: string }) => ({
      type: a.action_type,
      value: a.value,
    })),
    all_cpa_types: (row.cost_per_action_type ?? []).map((a: { action_type: string; value: string }) => ({
      type: a.action_type,
      cost: a.value,
    })),
  });
}
