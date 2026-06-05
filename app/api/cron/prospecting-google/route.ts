import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { avaliarProspect, gerarMensagemAvaliacao } from "@/lib/prospect-evaluation";
import { horarioPermitido, delayAleatorio, SAFETY_DEFAULTS } from "@/lib/whatsapp-safety";
import { evolutionSend } from "@/lib/evolution-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SERPAPI_URL = "https://serpapi.com/search.json";

function normalizarTelefone(tel: string): string {
  const d = tel.replace(/\D/g, "");
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

function telefoneValido(tel: string): boolean {
  const n = normalizarTelefone(tel);
  return n.length >= 12 && n.length <= 14;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function parseTemplates(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean);
  } catch {}
  return raw ? [raw] : [];
}

function aplicarVariaveis(template: string, vars: Record<string, string>): string {
  return template
    .replace(/\{nome_empresa\}/g, vars.nome ?? vars.nome_empresa ?? "")
    .replace(/\{nome\}/g,         vars.nome ?? vars.nome_empresa ?? "")
    .replace(/\{cidade\}/g,       vars.cidade ?? "")
    .replace(/\{ramo\}/g,         vars.ramo ?? vars.tipo ?? "")
    .replace(/\{telefone\}/g,     vars.telefone ?? "")
    .replace(/\{rating\}/g,       vars.rating ?? "—")
    .replace(/\{reviews\}/g,      vars.reviews ?? "0");
}

function safetyFromConfig(config: Record<string, unknown>) {
  return {
    ...SAFETY_DEFAULTS,
    min_delay_seconds:    Number(config.min_delay_seconds    ?? SAFETY_DEFAULTS.min_delay_seconds),
    max_delay_seconds:    Number(config.max_delay_seconds    ?? SAFETY_DEFAULTS.max_delay_seconds),
    session_max:          Number(config.session_max          ?? SAFETY_DEFAULTS.session_max),
    session_break_minutes:Number(config.session_break_minutes?? SAFETY_DEFAULTS.session_break_minutes),
    start_hour:           Number(config.send_hour            ?? SAFETY_DEFAULTS.start_hour),
    end_hour:             Number(config.end_hour             ?? SAFETY_DEFAULTS.end_hour),
    active_days:          Array.isArray(config.active_days)  ? config.active_days as number[] : SAFETY_DEFAULTS.active_days,
    daily_limit:          Number(config.daily_limit          ?? 30),
  };
}

async function searchGoogle(query: string, apiKey: string): Promise<Record<string, unknown>[]> {
  try {
    const params = new URLSearchParams({
      engine: "google_maps", q: query, api_key: apiKey,
      hl: "pt", gl: "br", type: "search",
    });
    const res = await fetch(`${SERPAPI_URL}?${params}`, { signal: AbortSignal.timeout(12000) });
    const data = await res.json();
    return (data.local_results as Record<string, unknown>[]) ?? [];
  } catch { return []; }
}

async function enviarWhatsApp(phone: string, message: string): Promise<boolean> {
  return evolutionSend(phone, message);
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const serpKey = process.env.SERPAPI_KEY;
  if (!serpKey) return NextResponse.json({ error: "SERPAPI_KEY não configurada" }, { status: 500 });

  const supabase = createAdminClient();

  // Busca todas as configs Google ativas — horário validado pelo horarioPermitido()
  const { data: configs } = await supabase
    .from("prospecting_configs")
    .select("*")
    .eq("active", true)
    .eq("source", "google");

  if (!configs?.length) return NextResponse.json({ ok: true, message: "Nenhuma config Google ativa neste horário" });

  let totalSalvos   = 0;
  let totalEnviados = 0;

  const { data: todosExistentes } = await supabase.from("prospects").select("place_id, nome, cidade");
  const idsExistentes        = new Set((todosExistentes ?? []).map((r: { place_id: string }) => r.place_id));
  const nomeCidadeExistentes = new Set((todosExistentes ?? []).map((r: { nome: string; cidade: string }) => `${r.nome?.toLowerCase().trim()}|${r.cidade?.toLowerCase().trim()}`));

  // Processa cada automação com suas próprias configurações
  for (const config of configs) {
    const safety    = safetyFromConfig(config as Record<string, unknown>);
    const horario   = horarioPermitido(safety);
    const delayMs   = delayAleatorio(safety.min_delay_seconds, safety.max_delay_seconds);
    const templates = parseTemplates(config.message_template ?? "");

    if (!horario.ok) continue;

    // ── 1. Primeiro: envia para quem já está no CRM como "novo" ──
    const { data: pendentes } = await supabase
      .from("prospects")
      .select("id, nome, telefone, cidade, tipo, mensagem")
      .eq("status", "novo")
      .eq("whatsapp_enviado", false)
      .not("telefone", "is", null)
      .limit(safety.daily_limit);

    const comTelefone = (pendentes ?? []).filter((p) => p.telefone && telefoneValido(p.telefone));

    for (let i = 0; i < comTelefone.length; i++) {
      const p = comTelefone[i];
      if (i > 0) await sleep(delayMs);

      const tpl = templates.length
        ? templates[Math.floor(Math.random() * templates.length)]
        : p.mensagem;

      const mensagem = tpl
        ? aplicarVariaveis(tpl, {
            nome_empresa: p.nome ?? "", nome: p.nome ?? "",
            cidade: p.cidade ?? "", ramo: p.tipo ?? "",
            tipo: p.tipo ?? "", telefone: p.telefone ?? "",
          })
        : p.mensagem;

      const ok = await enviarWhatsApp(normalizarTelefone(p.telefone), mensagem);
      if (ok) {
        await supabase.from("prospects").update({
          whatsapp_enviado: true,
          whatsapp_enviado_at: new Date().toISOString(),
          status: "contactado",
        }).eq("id", p.id);
        totalEnviados++;
      }
    }

    if (comTelefone.length > 0) continue;

    // ── 2. Se não havia ninguém no CRM, busca novas empresas no Google Maps ──
    const cities: string[] = Array.isArray(config.cities) ? config.cities : [];
    const term = config.search_term ?? config.cnae_label ?? "empresa";
    const allResults: { place: Record<string, unknown>; cidade: string }[] = [];

    const BATCH = 5;
    for (let i = 0; i < cities.length; i += BATCH) {
      const batchCities = cities.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batchCities.map(async (cidade) => {
          const places = await searchGoogle(`${term} em ${cidade}`, serpKey);
          return places.map((place) => ({ place, cidade }));
        })
      );
      for (const r of results) {
        if (r.status === "fulfilled") allResults.push(...r.value);
      }
      if (i + BATCH < cities.length) await sleep(1000);
    }

    const novos = allResults.filter(({ place, cidade }) => {
      const id        = (place.place_id as string) ?? (place.title as string);
      const nome      = (place.title as string ?? "").toLowerCase().trim();
      const nomeCidade = `${nome}|${cidade.toLowerCase().trim()}`;
      return id && !idsExistentes.has(id) && !nomeCidadeExistentes.has(nomeCidade);
    });

    if (!novos.length) continue;

    const toInsert = novos.map(({ place, cidade }) => {
      const nome    = (place.title as string) ?? "";
      const rating  = (place.rating as number) ?? null;
      const reviews = (place.reviews as number) ?? 0;
      const website = (place.website as string) ?? "";
      const phone   = (place.phone as string) ?? "";
      const placeId = (place.place_id as string) ?? nome;

      const evaluation   = avaliarProspect({ rating, reviews, website, tipo: term });
      const tplEscolhido = templates.length
        ? templates[Math.floor(Math.random() * templates.length)]
        : null;
      const mensagem = tplEscolhido
        ? aplicarVariaveis(tplEscolhido, {
            nome_empresa: nome, nome, cidade, ramo: term, tipo: term,
            telefone: phone, rating: rating?.toFixed(1) ?? "—", reviews: String(reviews),
          })
        : gerarMensagemAvaliacao(nome, cidade, term, rating, reviews, website, evaluation);

      idsExistentes.add(placeId);
      nomeCidadeExistentes.add(`${nome.toLowerCase().trim()}|${cidade.toLowerCase().trim()}`);

      return {
        place_id: placeId, nome, tipo: term, cidade, telefone: phone,
        website, endereco: (place.address as string) ?? "",
        avaliacao: rating, total_avaliacoes: reviews,
        email: "", mensagem, status: "novo",
        email_enviado: false, whatsapp_enviado: false,
        evaluation_score: evaluation.score, evaluation_angle: evaluation.angle,
      };
    });

    const { data: inseridos } = await supabase
      .from("prospects").insert(toInsert)
      .select("id, telefone, mensagem, nome, evaluation_score");

    totalSalvos += inseridos?.length ?? 0;

    const ordenados = (inseridos ?? [])
      .filter((p) => p.telefone && telefoneValido(p.telefone))
      .sort((a, b) => (b.evaluation_score ?? 0) - (a.evaluation_score ?? 0))
      .slice(0, safety.daily_limit);

    for (let i = 0; i < ordenados.length; i++) {
      const p = ordenados[i];
      if (i > 0) await sleep(delayMs);
      const ok = await enviarWhatsApp(normalizarTelefone(p.telefone), p.mensagem);
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

  return NextResponse.json({ ok: true, salvos: totalSalvos, enviados: totalEnviados });
}
