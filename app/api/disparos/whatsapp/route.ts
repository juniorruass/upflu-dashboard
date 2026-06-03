import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { evolutionSend, evolutionStatus } from "@/lib/evolution-api";

export const maxDuration = 60;

function normalizarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

function telefoneValido(tel: string): boolean {
  const n = normalizarTelefone(tel);
  return n.length >= 12 && n.length <= 14;
}

export async function GET() {
  const data = await evolutionStatus();
  if (!data) return NextResponse.json({ connected: false, needsQr: true, rawValue: "ERRO" }, { status: 502 });
  const state = data.instance?.state?.toUpperCase() ?? "";
  const connected = state === "OPEN" || state === "CONNECTED" || state === "AUTHENTICATED";
  return NextResponse.json({ connected, needsQr: !connected, rawValue: state, raw: data });
}

export async function POST(req: NextRequest) {
  const {
    prospectIds, mensagem, template,
    config,
  } = await req.json();

  const minDelay  = Number(config?.minDelay  ?? 30);
  const maxDelay  = Number(config?.maxDelay  ?? 90);
  const maxSessao = Number(config?.maxSessao ?? 30);
  const startHour = Number(config?.startHour ?? 8);
  const endHour   = Number(config?.endHour   ?? 18);

  if (!prospectIds?.length) {
    return NextResponse.json({ error: "Nenhum prospect selecionado." }, { status: 400 });
  }

  const agora  = new Date();
  const horaBR = (agora.getUTCHours() - 3 + 24) % 24;
  if (horaBR < startHour || horaBR >= endHour) {
    return NextResponse.json({
      error: `Fora do horário configurado (${startHour}h–${endHour}h). Agora são ${horaBR}h (horário de Brasília).`
    }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, nome, telefone, mensagem, cidade")
    .in("id", prospectIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comTelefone = (prospects || [])
    .filter((p) => p.telefone && telefoneValido(p.telefone))
    .slice(0, maxSessao);

  const results: { id: string; nome: string; telefone: string; ok: boolean; erro?: string }[] = [];
  const logs: Record<string, unknown>[] = [];

  for (let i = 0; i < comTelefone.length; i++) {
    const p     = comTelefone[i];
    const phone = normalizarTelefone(p.telefone);
    const texto = mensagem
      .replace(/\{nome\}/g, p.nome)
      .replace(/\{mensagem\}/g, p.mensagem || "")
      .replace(/\{cidade\}/g, p.cidade || "");

    if (i > 0) {
      const delayMs = (Math.random() * (maxDelay - minDelay) + minDelay) * 1000;
      await new Promise((r) => setTimeout(r, delayMs));
    }

    const ok = await evolutionSend(phone, texto);
    results.push({ id: p.id, nome: p.nome, telefone: phone, ok, ...(ok ? {} : { erro: "Falha no envio" }) });
    logs.push({ prospect_id: p.id, nome: p.nome, telefone: phone, template, status: ok ? "enviado" : "falhou" });
  }

  if (logs.length > 0) {
    await supabase.from("whatsapp_logs").insert(logs);
  }

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({
    sent, failed: results.length - sent,
    total: comTelefone.length,
    limitado: (prospects?.length ?? 0) > maxSessao,
    results,
  });
}
