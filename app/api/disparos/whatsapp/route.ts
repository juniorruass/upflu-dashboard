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

async function zapiSend(instanceId: string, token: string, phone: string, message: string) {
  const res = await fetch(`${ZAPI_BASE}/${instanceId}/token/${token}/send-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, message }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `Z-API status ${res.status}`);
  return data;
}

export async function GET() {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token      = process.env.ZAPI_TOKEN;
  if (!instanceId || !token) {
    return NextResponse.json({ error: "Z-API não configurada." }, { status: 500 });
  }
  const res = await fetch(`${ZAPI_BASE}/${instanceId}/token/${token}/status`, {
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { prospectIds, mensagem, template } = await req.json();

  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token      = process.env.ZAPI_TOKEN;

  if (!instanceId || !token) {
    return NextResponse.json({ error: "Z-API não configurada." }, { status: 500 });
  }
  if (!prospectIds?.length) {
    return NextResponse.json({ error: "Nenhum prospect selecionado." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, nome, telefone, mensagem, cidade")
    .in("id", prospectIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comTelefone = (prospects || []).filter(
    (p) => p.telefone && telefoneValido(p.telefone)
  );

  const results: { id: string; nome: string; telefone: string; ok: boolean; erro?: string }[] = [];
  const logs: Record<string, unknown>[] = [];

  for (const p of comTelefone) {
    const phone = normalizarTelefone(p.telefone);
    const texto = mensagem
      .replace(/\{nome\}/g, p.nome)
      .replace(/\{mensagem\}/g, p.mensagem || "")
      .replace(/\{cidade\}/g, p.cidade || "");

    try {
      await zapiSend(instanceId, token, phone, texto);
      results.push({ id: p.id, nome: p.nome, telefone: phone, ok: true });
      logs.push({ prospect_id: p.id, nome: p.nome, telefone: phone, template, status: "enviado" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: p.id, nome: p.nome, telefone: phone, ok: false, erro: msg });
      logs.push({ prospect_id: p.id, nome: p.nome, telefone: phone, template, status: "falhou" });
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  if (logs.length > 0) {
    await supabase.from("whatsapp_logs").insert(logs);
  }

  const sent = results.filter((r) => r.ok).length;
  return NextResponse.json({ sent, failed: results.length - sent, total: comTelefone.length, results });
}
