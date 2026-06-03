import { NextRequest, NextResponse } from "next/server";
import {
  evolutionInstances,
  evolutionStatus,
  evolutionConnect,
  evolutionDisconnect,
  evolutionSend,
  evolutionFindChats,
  evolutionFindMessages,
  evolutionMeasureLatency,
} from "@/lib/evolution-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action   = searchParams.get("action") ?? "instances";
  const instance = searchParams.get("instance") ?? undefined;
  const jid      = searchParams.get("jid") ?? undefined;
  const limit    = Number(searchParams.get("limit") ?? 20);

  if (action === "status") {
    const data = await evolutionStatus(instance);
    if (!data) return NextResponse.json({ error: "Sem resposta da Evolution API" }, { status: 502 });
    return NextResponse.json(data);
  }

  if (action === "connect") {
    const data = await evolutionConnect(instance);
    if (!data) return NextResponse.json({ error: "Erro ao gerar QR code" }, { status: 502 });
    return NextResponse.json(data);
  }

  if (action === "chats") {
    const chats = await evolutionFindChats(instance, limit);
    return NextResponse.json({ chats });
  }

  if (action === "messages") {
    const messages = await evolutionFindMessages(instance, jid, limit);
    return NextResponse.json({ messages });
  }

  if (action === "latency") {
    const ms = await evolutionMeasureLatency();
    return NextResponse.json({ ms });
  }

  const instances = await evolutionInstances();
  return NextResponse.json({ instances });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, instance } = body;

  if (action === "disconnect") {
    const ok = await evolutionDisconnect(instance);
    return NextResponse.json({ ok });
  }

  if (action === "test") {
    const { phone, message } = body;
    if (!phone || !message) return NextResponse.json({ error: "phone e message obrigatórios" }, { status: 400 });
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.startsWith("55") ? digits : `55${digits}`;
    const ok = await evolutionSend(normalized, message, instance);
    return NextResponse.json({ ok });
  }

  if (action === "sendNow") {
    const { numbers, message } = body as { numbers: string[]; message: string };
    if (!numbers?.length || !message) return NextResponse.json({ error: "numbers e message obrigatórios" }, { status: 400 });

    const results: { phone: string; ok: boolean }[] = [];
    for (let i = 0; i < numbers.length; i++) {
      const digits = numbers[i].replace(/\D/g, "");
      if (!digits) continue;
      const phone = digits.startsWith("55") ? digits : `55${digits}`;
      if (i > 0) await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));
      const ok = await evolutionSend(phone, message, instance);
      results.push({ phone, ok });
    }
    const sent = results.filter((r) => r.ok).length;
    return NextResponse.json({ sent, failed: results.length - sent, results });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
