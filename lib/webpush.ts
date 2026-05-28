import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase";

if (
  process.env.VAPID_SUBJECT &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<"ok" | "expired" | "error"> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return "ok";
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    if (e.statusCode === 410 || e.statusCode === 404) return "expired";
    return "error";
  }
}

export async function notifyAdmin(payload: PushPayload) {
  const supabase = createAdminClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("type", "admin");

  if (!subs?.length) return;

  const expired: string[] = [];
  await Promise.all(
    subs.map(async (sub) => {
      const result = await sendPush(sub, payload);
      if (result === "expired") expired.push(sub.endpoint);
    })
  );
  if (expired.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", expired);
  }
}

export async function notifyClient(clientId: string, payload: PushPayload) {
  const supabase = createAdminClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("type", "client")
    .eq("client_id", clientId);

  if (!subs?.length) return;

  const expired: string[] = [];
  await Promise.all(
    subs.map(async (sub) => {
      const result = await sendPush(sub, payload);
      if (result === "expired") expired.push(sub.endpoint);
    })
  );
  if (expired.length) {
    await supabase.from("push_subscriptions").delete().in("endpoint", expired);
  }
}
