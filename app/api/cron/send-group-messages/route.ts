import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { evolutionSendGroup, evolutionSendMedia } from "@/lib/evolution-api";
import { isBlacklisted } from "@/lib/blacklist";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: pending, error } = await supabase
    .from("group_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", now);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!pending?.length) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;
  let failed = 0;

  for (const msg of pending) {
    if (await isBlacklisted(msg.group_jid)) {
      await supabase.from("group_messages").update({ status: "failed", error: "Número na blacklist" }).eq("id", msg.id);
      failed++;
      continue;
    }
    let ok: boolean;
    if (msg.media_data && msg.media_type) {
      ok = await evolutionSendMedia(
        msg.group_jid,
        msg.media_data,
        msg.media_type as "image" | "video" | "document",
        msg.media_caption ?? msg.message ?? "",
        msg.media_filename ?? "arquivo",
        msg.instance,
      );
    } else {
      ok = await evolutionSendGroup(msg.group_jid, msg.message, msg.instance);
    }
    if (ok) {
      await supabase
        .from("group_messages")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", msg.id);
      sent++;
    } else {
      await supabase
        .from("group_messages")
        .update({ status: "failed", error: "Falha ao enviar via Evolution API" })
        .eq("id", msg.id);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
