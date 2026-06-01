import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const maxDuration = 60;

const ZAPI_BASE = "https://api.z-api.io/instances";

function normalizarTelefone(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

function telefoneValido(tel: string): boolean {
  const n = normalizarTelefone(tel);
  return n.length >= 12 && n.length <= 14;
}

function zapiHeaders(clientToken: string): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) h["Client-Token"] = clientToken;
  return h;
}

async function zapiSend(instanceId: string, token: string, clientToken: string, phone: string, message: string) {
  const res = await fetch(`${ZAPI_BASE}/${instanceId}/token/${token}/send-text`, {
    method: "POST",
    headers: zapiHeaders(clientToken),
    body: JSON.stringify({ phone, message }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `Z-API status ${res.status}`);
  return data;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const instanceId  = searchParams.get("instanceId")  || process.env.ZAPI_INSTANCE_ID;
  const token       = searchParams.get("token")        || process.env.ZAPI_TOKEN;
  const clientToken = searchParams.get("clientToken")  || process.env.ZAPI_CLIENT_TOKEN || "";

  if (!instanceId || !token) {
    return NextResponse.json({ error: "Instance ID e Token são obrigatórios." }, { status: 400 });
  }
  try {
    const res = await fetch(`${ZAPI_BASE}/${instanceId}/token/${token}/status`, {
      headers: zapiHeaders(clientToken),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    const val = String(
      data.value || data.status || data.state || data.session || ""
    ).toUpperCase();
    const connected =
      data.connected === true ||
      data.connected === "true" ||
      val === "CONNECTED" ||
      val === "OPEN" ||
      val === "AUTHENTICATED";
    return NextResponse.json({ connected, needsQr: !connected, rawValue: val, raw: data });
  } catch (e) {
    return NextResponse.json({ connected: false, needsQr: true, rawValue: "ERRO", error: String(e) }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const {
    prospectIds, mensagem, template,
    instanceId: bodyInstance, token: bodyToken, clientToken: bodyClientToken,
    config,
  } = await req.json();

  const instanceId  = bodyInstance    || process.env.ZAPI_INSTANCE_ID;
  const token       = bodyToken       || process.env.ZAPI_TOKEN;
  const clientToken = bodyClientToken || process.env.ZAPI_CLIENT_TOKEN || "";

  // Configurações anti-ban
  const minDelay     = Number(config?.minDelay     ?? 30);
  const maxDelay     = Number(config?.maxDelay     ?? 90);
  const maxSessao    = Number(config?.maxSessao    ?? 30);
  const startHour    = Number(config?.startHour    ?? 8);
  const endHour      = Number(config?.endHour      ?? 18);

  if (!instanceId || !token) {
    return NextResponse.json({ error: "Instance ID e Token são obrigatórios." }, { status: 400 });
  }
  if (!prospectIds?.length) {
    return NextResponse.json({ error: "Nenhum prospect selecionado." }, { status: 400 });
  }

  // Verificar horário permitido (fuso Brasil -3h)
  const agora = new Date();
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
    .slice(0, maxSessao); // Limite por sessão

  const results: { id: string; nome: string; telefone: string; ok: boolean; erro?: string }[] = [];
  const logs: Record<string, unknown>[] = [];

  for (let i = 0; i < comTelefone.length; i++) {
    const p = comTelefone[i];
    const phone = normalizarTelefone(p.telefone);
    const texto = mensagem
      .replace(/\{nome\}/g, p.nome)
      .replace(/\{mensagem\}/g, p.mensagem || "")
      .replace(/\{cidade\}/g, p.cidade || "");

    // Delay aleatório entre mensagens (exceto na primeira)
    if (i > 0) {
      const delayMs = (Math.random() * (maxDelay - minDelay) + minDelay) * 1000;
      await new Promise((r) => setTimeout(r, delayMs));
    }

    try {
      await zapiSend(instanceId, token, clientToken, phone, texto);
      results.push({ id: p.id, nome: p.nome, telefone: phone, ok: true });
      logs.push({ prospect_id: p.id, nome: p.nome, telefone: phone, template, status: "enviado" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: p.id, nome: p.nome, telefone: phone, ok: false, erro: msg });
      logs.push({ prospect_id: p.id, nome: p.nome, telefone: phone, template, status: "falhou" });
    }
  }

  if (logs.length > 0) {
    await supabase.from("whatsapp_logs").insert(logs);
  }

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({
    sent, failed: results.length - sent,
    total: comTelefone.length,
    limitado: prospects!.length > maxSessao,
    results,
  });
}
