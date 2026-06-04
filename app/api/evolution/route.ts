import { NextRequest, NextResponse } from "next/server";
import {
  evolutionInstances,
  evolutionStatus,
  evolutionConnect,
  evolutionDisconnect,
  evolutionSend,
  evolutionFindChats,
  evolutionFindMessages,
  evolutionFindContacts,
  evolutionMeasureLatency,
} from "@/lib/evolution-api";
import { createAdminClient } from "@/lib/supabase";

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

    // Enrich names from prospects table for contacts without pushName
    const unnamed = chats.filter((c) => !c.pushName && !c.name);
    if (unnamed.length > 0) {
      try {
        const supabase = createAdminClient();
        const phones = unnamed.map((c) =>
          c.id.replace("@s.whatsapp.net", "").replace("@lid", "").replace(/\D/g, "")
        ).filter(Boolean);

        if (phones.length > 0) {
          const { data: prospects } = await supabase
            .from("prospects")
            .select("nome, telefone")
            .in("telefone", phones.flatMap((p) => [p, p.replace(/^55/, "")]));

          if (prospects?.length) {
            const phoneMap: Record<string, string> = {};
            prospects.forEach((p) => {
              const normalized = (p.telefone ?? "").replace(/\D/g, "");
              phoneMap[normalized] = p.nome;
              phoneMap[normalized.replace(/^55/, "")] = p.nome;
            });

            chats.forEach((c) => {
              if (!c.pushName && !c.name) {
                const num = c.id.replace("@s.whatsapp.net", "").replace("@lid", "").replace(/\D/g, "");
                if (phoneMap[num]) c.pushName = phoneMap[num];
              }
            });
          }
        }
      } catch {}
    }

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

  if (action === "contacts") {
    const contacts = await evolutionFindContacts(instance);
    return NextResponse.json({ contacts });
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
