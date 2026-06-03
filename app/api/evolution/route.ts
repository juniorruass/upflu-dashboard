import { NextRequest, NextResponse } from "next/server";
import {
  evolutionInstances,
  evolutionStatus,
  evolutionConnect,
  evolutionDisconnect,
} from "@/lib/evolution-api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action   = searchParams.get("action") ?? "instances";
  const instance = searchParams.get("instance") ?? undefined;

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

  const instances = await evolutionInstances();
  return NextResponse.json({ instances });
}

export async function POST(req: NextRequest) {
  const { action, instance } = await req.json();

  if (action === "disconnect") {
    const ok = await evolutionDisconnect(instance);
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
