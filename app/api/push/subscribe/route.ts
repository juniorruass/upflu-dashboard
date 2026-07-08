import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { isAdminAuthed } from "@/lib/admin-session";
import { getPortalClientIds } from "@/lib/portal-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { subscription, type, clientId } = await req.json();
  if (!subscription?.endpoint) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const adminOk = await isAdminAuthed(req);

  if (type === "client") {
    const portalIds = await getPortalClientIds(req);
    if (!clientId || (!adminOk && !portalIds.includes(clientId))) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }
  } else if (!adminOk) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const supabase = createAdminClient();
  await supabase.from("push_subscriptions").upsert({
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    type: type ?? "admin",
    client_id: clientId ?? null,
  }, { onConflict: "endpoint" });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json();
  const supabase = createAdminClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
