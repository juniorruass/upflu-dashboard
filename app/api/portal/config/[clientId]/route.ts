export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/admin-session";
import { getPortalClientIds } from "@/lib/portal-session";

type Ctx = { params: Promise<{ clientId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const { clientId } = await params;

  const adminOk = await isAdminAuthed(req);
  const portalIds = await getPortalClientIds(req);
  if (!adminOk && !portalIds.includes(clientId)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .select("portal_metrics")
    .eq("id", clientId)
    .single();

  if (error || !data) return NextResponse.json({ portal_metrics: null });
  return NextResponse.json({ portal_metrics: data.portal_metrics ?? null });
}
