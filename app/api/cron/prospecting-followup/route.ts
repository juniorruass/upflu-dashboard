import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ZAPI_BASE = "https://api.z-api.io/instances";

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

  const supabase = createAdminClient();

  // Busca configs ativas com template de follow-up definido
  const { data: configs } = await supabase
    .from("prospecting_configs")
    .select("cnae, followup_days, followup_template, daily_limit")
    .eq("active", true)
    .not("followup_template", "is", null);

  if (!configs?.length) return NextResponse.json({ ok: true, message: "Nenhum follow-up configurado" });

  let totalEnviados = 0;

  for (const config of configs) {
    if (!config.followup_template || !config.followup_days) continue;

    // Prospects que receberam 1º contato há X dias e ainda não receberam follow-up
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - config.followup_days);

    const { data: prospects } = await supabase
      .from("prospects")
      .select("id, nome, telefone, cidade, mensagem")
      .eq("whatsapp_enviado", true)
      .eq("followup_enviado", false)
      .eq("cnae", config.cnae)
      .lte("whatsapp_enviado_at", cutoff.toISOString())
      .not("telefone", "is", null)
      .limit(config.daily_limit ?? 30);

    if (!prospects?.length) continue;

    const comTelefone = prospects.filter((p) => p.telefone && telefoneValido(p.telefone));

    for (let i = 0; i < comTelefone.length; i++) {
      const p = comTelefone[i];
      const phone = normalizarTelefone(p.telefone);
      const mensagem = renderTemplate(config.followup_template, {
        nome: p.nome,
        cidade: p.cidade ?? "",
      });

      if (i > 0) await sleep(Math.random() * 60_000 + 30_000);

      const ok = await enviarWhatsApp(phone, mensagem);
      if (ok) {
        await supabase.from("prospects").update({
          followup_enviado: true,
          followup_enviado_at: new Date().toISOString(),
        }).eq("id", p.id);
        totalEnviados++;
      }
    }
  }

  return NextResponse.json({ ok: true, enviados: totalEnviados });
}
