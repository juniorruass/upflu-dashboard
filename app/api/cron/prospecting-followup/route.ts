import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { evolutionSend } from "@/lib/evolution-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function normalizarTelefone(tel: string): string {
  const d = tel.replace(/\D/g, "");
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

function telefoneValido(tel: string): boolean {
  const n = normalizarTelefone(tel);
  return n.length >= 12 && n.length <= 14;
}

function parseTemplates(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean);
  } catch {}
  return raw ? [raw] : [];
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template
    .replace(/\{nome_empresa\}/g, vars.nome ?? "")
    .replace(/\{nome\}/g,         vars.nome ?? "")
    .replace(/\{cidade\}/g,       vars.cidade ?? "")
    .replace(/\{ramo\}/g,         vars.ramo ?? "")
    .replace(/\{(\w+)\}/g,        (_, k) => vars[k] ?? "");
}

async function enviarWhatsApp(phone: string, message: string): Promise<boolean> {
  return evolutionSend(phone, message);
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Busca a config com followup_days mais curto como referência global
  const { data: configs } = await supabase
    .from("prospecting_configs")
    .select("followup_days, followup_template, daily_limit, min_delay_seconds, max_delay_seconds")
    .eq("active", true)
    .not("followup_template", "is", null)
    .order("followup_days", { ascending: true })
    .limit(1);

  if (!configs?.length) return NextResponse.json({ ok: true, message: "Nenhum follow-up configurado" });

  const config = configs[0];
  if (!config.followup_template || !config.followup_days) {
    return NextResponse.json({ ok: true, message: "Follow-up sem template ou dias definidos" });
  }

  const templates = parseTemplates(config.followup_template);
  let totalEnviados = 0;

  // Todos os prospects contatados há X dias que ainda não receberam follow-up
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.followup_days);

  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, nome, telefone, cidade, tipo")
    .eq("whatsapp_enviado", true)
    .eq("followup_enviado", false)
    .lte("whatsapp_enviado_at", cutoff.toISOString())
    .not("telefone", "is", null)
    .limit(config.daily_limit ?? 30);

  if (!prospects?.length) return NextResponse.json({ ok: true, enviados: 0 });

  const comTelefone = prospects.filter((p) => p.telefone && telefoneValido(p.telefone));

  for (let i = 0; i < comTelefone.length; i++) {
    const p = comTelefone[i];
    const phone = normalizarTelefone(p.telefone);
    const tpl = templates[Math.floor(Math.random() * templates.length)];
    const mensagem = renderTemplate(tpl, {
      nome: p.nome ?? "", nome_empresa: p.nome ?? "",
      cidade: p.cidade ?? "", ramo: p.tipo ?? "",
    });

    {

      if (i > 0) {
        const minMs = (config.min_delay_seconds ?? 45) * 1000;
        const maxMs = (config.max_delay_seconds ?? 120) * 1000;
        await sleep(minMs + Math.random() * (maxMs - minMs));
      }

      const ok = await enviarWhatsApp(phone, mensagem);
      if (ok) {
        await supabase.from("prospects").update({
          followup_enviado: true,
          followup_enviado_at: new Date().toISOString(),
          status: "followup",
        }).eq("id", p.id);
        totalEnviados++;
      }
    }
  }

  return NextResponse.json({ ok: true, enviados: totalEnviados });
}
