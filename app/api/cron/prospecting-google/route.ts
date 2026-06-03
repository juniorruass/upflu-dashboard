import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { avaliarProspect, gerarMensagemAvaliacao } from "@/lib/prospect-evaluation";
import { horarioPermitido, delayAleatorio, SAFETY_DEFAULTS } from "@/lib/whatsapp-safety";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SERPAPI_URL = "https://serpapi.com/search.json";
const ZAPI_BASE   = "https://api.z-api.io/instances";

function normalizarTelefone(tel: string): string {
  const d = tel.replace(/\D/g, "");
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

function telefoneValido(tel: string): boolean {
  const n = normalizarTelefone(tel);
  return n.length >= 12 && n.length <= 14;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

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

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const serpKey = process.env.SERPAPI_KEY;
  if (!serpKey) return NextResponse.json({ error: "SERPAPI_KEY não configurada" }, { status: 500 });

  const supabase = createAdminClient();
  const horaBR   = (new Date().getUTCHours() - 3 + 24) % 24;

  // Busca configs ativas do tipo Google no horário atual
  const { data: configs } = await supabase
    .from("prospecting_configs")
    .select("*")
    .eq("active", true)
    .eq("source", "google")
    .eq("send_hour", horaBR);

  if (!configs?.length) return NextResponse.json({ ok: true, message: "Nenhuma config Google ativa neste horário" });

  // Place IDs já no CRM
  const { data: existentes } = await supabase.from("prospects").select("place_id");
  const idsExistentes = new Set((existentes ?? []).map((r: { place_id: string }) => r.place_id));

  let totalSalvos   = 0;
  let totalEnviados = 0;

  for (const config of configs) {
    const cities: string[] = Array.isArray(config.cities) ? config.cities : [];
    const term = config.search_term ?? config.cnae_label ?? "empresa";

    const allResults: { place: Record<string, unknown>; cidade: string }[] = [];

    // Busca em todas as cidades configuradas (em batches de 5 pra não explodir a API)
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

    // Filtra duplicatas
    const novos = allResults.filter(({ place }) => {
      const id = (place.place_id as string) ?? (place.title as string);
      return id && !idsExistentes.has(id);
    });

    if (!novos.length) continue;

    // Avalia cada prospect e gera mensagem personalizada
    const toInsert = novos.map(({ place, cidade }) => {
      const nome    = (place.title as string) ?? "";
      const rating  = (place.rating as number) ?? null;
      const reviews = (place.reviews as number) ?? 0;
      const website = (place.website as string) ?? "";
      const phone   = (place.phone as string) ?? "";
      const placeId = (place.place_id as string) ?? nome;

      const evaluation = avaliarProspect({ rating, reviews, website, tipo: term });
      const mensagem   = config.message_template?.includes("{nome}")
        ? config.message_template.replace(/\{nome\}/g, nome).replace(/\{cidade\}/g, cidade).replace(/\{rating\}/g, rating?.toFixed(1) ?? "—").replace(/\{reviews\}/g, String(reviews))
        : gerarMensagemAvaliacao(nome, cidade, term, rating, reviews, website, evaluation);

      idsExistentes.add(placeId);

      return {
        place_id: placeId,
        nome,
        tipo: term,
        cidade,
        telefone: phone,
        website,
        endereco: (place.address as string) ?? "",
        avaliacao: rating,
        total_avaliacoes: reviews,
        email: "",
        mensagem,
        status: "potencial",
        email_enviado: false,
        whatsapp_enviado: false,
        evaluation_score: evaluation.score,
        evaluation_angle: evaluation.angle,
      };
    });

    const { data: inseridos } = await supabase
      .from("prospects")
      .insert(toInsert)
      .select("id, telefone, mensagem, nome, evaluation_score");

    totalSalvos += inseridos?.length ?? 0;

    const safety = safetyFromConfig(config as Record<string, unknown>);
    const horario = horarioPermitido(safety);
    if (!horario.ok) {
      console.log(`[prospecting-google] Bloqueado: ${horario.motivo}`);
      continue;
    }

    // Ordena por score de oportunidade (piores perfis digitais primeiro)
    const ordenados = (inseridos ?? [])
      .filter((p) => p.telefone && telefoneValido(p.telefone))
      .sort((a, b) => (b.evaluation_score ?? 0) - (a.evaluation_score ?? 0))
      .slice(0, safety.session_max);

    for (let i = 0; i < ordenados.length; i++) {
      const p = ordenados[i];

      // Descanso de sessão: a cada session_max mensagens, pausa longa
      if (i > 0 && i % safety.session_max === 0) {
        console.log(`[prospecting-google] Descanso de sessão: ${safety.session_break_minutes}min`);
        await sleep(safety.session_break_minutes * 60_000);
      } else if (i > 0) {
        await sleep(delayAleatorio(safety.min_delay_seconds, safety.max_delay_seconds));
      }

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
