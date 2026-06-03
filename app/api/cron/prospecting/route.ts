import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BRASILIO_URL = "https://brasil.io/api/dataset/socios-brasil/empresas/data/";
const ZAPI_BASE    = "https://api.z-api.io/instances";

function normalizarMunicipio(nome: string): string {
  return nome.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function formatarCNPJ(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function normalizarTelefone(tel: string): string {
  const d = tel.replace(/\D/g, "");
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

function telefoneValido(tel: string): boolean {
  const n = normalizarTelefone(tel);
  return n.length >= 12 && n.length <= 14;
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

async function buscarEmpresas(cnae: string, municipio: string, uf: string, token: string) {
  const params = new URLSearchParams({
    cnae_fiscal: cnae.replace(/\D/g, ""),
    municipio: normalizarMunicipio(municipio),
    situacao_cadastral: "ATIVA",
    page_size: "100",
    uf: uf.toUpperCase(),
  });
  const res = await fetch(`${BRASILIO_URL}?${params}`, {
    headers: { Authorization: `Token ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []) as Record<string, string>[];
}

async function enviarWhatsApp(phone: string, message: string): Promise<boolean> {
  const instanceId  = process.env.ZAPI_INSTANCE_ID;
  const token       = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN ?? "";
  if (!instanceId || !token) return false;
  try {
    const res = await fetch(`${ZAPI_BASE}/${instanceId}/token/${token}/send-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(clientToken ? { "Client-Token": clientToken } : {}) },
      body: JSON.stringify({ phone, message }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch { return false; }
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const brasilioToken = (process.env.BRASILIO_TOKEN ?? "").trim();
  if (!brasilioToken) return NextResponse.json({ error: "BRASILIO_TOKEN não configurado" }, { status: 500 });

  const supabase = createAdminClient();

  // Verifica horário BR (-3h UTC)
  const horaBR = (new Date().getUTCHours() - 3 + 24) % 24;

  // Busca configs ativas cujo send_hour bate com a hora atual
  const { data: configs } = await supabase
    .from("prospecting_configs")
    .select("*")
    .eq("active", true)
    .eq("send_hour", horaBR);

  if (!configs?.length) return NextResponse.json({ ok: true, message: "Nenhuma config ativa neste horário" });

  // CNPJs já no CRM
  const { data: existentes } = await supabase.from("prospects").select("cnpj").not("cnpj", "is", null);
  const cnpjsExistentes = new Set((existentes ?? []).map((r: { cnpj: string }) => r.cnpj));

  let totalBuscados = 0;
  let totalSalvos   = 0;
  let totalEnviados = 0;

  for (const config of configs) {
    const empresas = await buscarEmpresas(config.cnae, config.municipio, config.uf, brasilioToken);
    const novas = empresas.filter((e) => e.cnpj && !cnpjsExistentes.has(e.cnpj));
    totalBuscados += novas.length;

    if (!novas.length) continue;

    const cidadeDisplay = `${config.municipio}, ${config.uf}`;
    const toInsert = novas.map((e) => {
      const nome = e.nome_fantasia?.trim() || e.razao_social;
      const mensagem = renderTemplate(config.message_template, { nome, cidade: config.municipio });
      return {
        place_id: `cnpj:${e.cnpj}`,
        nome,
        tipo: config.cnae_label ?? "empresa",
        cidade: cidadeDisplay,
        telefone: e.ddd_telefone_1 ? `(${e.ddd_telefone_1}) ${e.telefone_1}` : "",
        website: "",
        email: e.email?.toLowerCase().trim() ?? "",
        mensagem,
        status: "potencial",
        email_enviado: false,
        cnpj: e.cnpj,
        cnpj_formatado: formatarCNPJ(e.cnpj),
        cnae: config.cnae,
        situacao_cadastral: "ATIVA",
        whatsapp_enviado: false,
      };
    });

    const { data: inseridos } = await supabase.from("prospects").insert(toInsert).select("id, telefone, mensagem, nome");
    totalSalvos += inseridos?.length ?? 0;

    // Atualiza set de cnpjs existentes
    novas.forEach((e) => cnpjsExistentes.add(e.cnpj));

    // Envia WhatsApp para os que têm telefone válido, respeitando o limite diário
    const comTelefone = (inseridos ?? [])
      .filter((p) => p.telefone && telefoneValido(p.telefone))
      .slice(0, config.daily_limit);

    for (let i = 0; i < comTelefone.length; i++) {
      const p = comTelefone[i];
      const phone = normalizarTelefone(p.telefone);
      if (i > 0) {
        const delay = Math.random() * 60_000 + 30_000; // 30–90s
        await sleep(delay);
      }
      const ok = await enviarWhatsApp(phone, p.mensagem);
      if (ok) {
        await supabase.from("prospects").update({
          whatsapp_enviado: true,
          whatsapp_enviado_at: new Date().toISOString(),
          status: "contactado",
        }).eq("id", p.id);
        totalEnviados++;
      }
    }
  }

  return NextResponse.json({ ok: true, buscados: totalBuscados, salvos: totalSalvos, enviados: totalEnviados });
}
