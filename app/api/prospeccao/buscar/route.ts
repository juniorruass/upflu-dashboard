import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const maxDuration = 60;

const SERPAPI_URL = "https://serpapi.com/search.json";

const SEARCH_TERMS: Record<string, string[]> = {
  "clínica estética": ["clínica estética", "centro estético"],
  "clínica odontológica": ["clínica odontológica", "dentista"],
  "psicólogo": ["psicólogo", "psicologia clínica"],
  "psiquiatra": ["psiquiatra"],
  "fisioterapeuta": ["fisioterapia", "fisioterapeuta"],
  "nutricionista": ["nutricionista"],
};

const ABERTURAS: Record<string, string[]> = {
  estetica: [
    "Vi que a {nome} atua no mercado de estética em {cidade} e queria trazer algo que pode fazer diferença.",
    "Pesquisando clínicas de estética em {cidade}, encontrei a {nome} e identifiquei uma oportunidade relevante.",
    "A {nome} está em {cidade} — queria compartilhar algo sobre presença digital nesse segmento.",
    "Vi que a {nome} atende clientes em {cidade} e queria mostrar onde estão as maiores oportunidades de crescimento.",
  ],
  odonto: [
    "Vi que a {nome} atende pacientes em {cidade} e queria compartilhar algo concreto sobre captação digital.",
    "Pesquisando clínicas odontológicas em {cidade}, encontrei a {nome} e identifiquei pontos que podem gerar mais pacientes.",
    "A {nome} está em {cidade} — queria trazer algo sobre como pacientes estão buscando dentistas na região.",
    "Vi que a {nome} está em {cidade} e queria mostrar o que pode estar limitando a captação de novos pacientes.",
  ],
  geral: [
    "Vi que a {nome} atua em {cidade} e queria trazer algo que pode fazer diferença no crescimento digital.",
    "Pesquisando {tipo} em {cidade}, encontrei a {nome} e identifiquei uma oportunidade relevante.",
    "A {nome} está presente em {cidade} — queria compartilhar algo concreto sobre presença digital nesse mercado.",
    "Vi que a {nome} atende clientes em {cidade} e queria mostrar onde estão as oportunidades de crescimento.",
  ],
};

const FECHAMENTOS = [
  "Temos um diagnóstico gratuito que mostra exatamente onde estão as oportunidades. Faz sentido conversar?",
  "A Upflu faz um diagnóstico digital gratuito e sem compromisso. Posso enviar o link?",
  "Posso mostrar em 2 minutos o que está travando o crescimento digital da {nome}. Faz sentido?",
  "Identificamos pontos específicos de melhoria para esse segmento em {cidade}. Posso compartilhar?",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateMessage(nome: string, cidade: string, tipo: string): string {
  const key = tipo.includes("estét") || tipo.includes("nutri") || tipo.includes("fisio") ? "estetica"
    : tipo.includes("odonto") || tipo.includes("dentista") ? "odonto"
    : "geral";
  const abertura = pick(ABERTURAS[key])
    .replace(/{nome}/g, nome)
    .replace(/{cidade}/g, cidade)
    .replace(/{tipo}/g, tipo);
  const fechamento = pick(FECHAMENTOS)
    .replace(/{nome}/g, nome)
    .replace(/{cidade}/g, cidade);
  return `Olá! ${abertura}\n\n${fechamento}\n\nUpflu | upflu.digital`;
}

async function extractEmail(url: string): Promise<string> {
  if (!url) return "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(3000),
    });
    const html = await res.text();
    const mailtoMatch = html.match(/href=["']mailto:([^"'?]+)/i);
    if (mailtoMatch) return mailtoMatch[1].trim();
    const emailMatch = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (emailMatch && !emailMatch[0].endsWith(".png") && !emailMatch[0].endsWith(".jpg")) {
      return emailMatch[0];
    }
  } catch {}
  return "";
}

async function searchMaps(query: string, apiKey: string): Promise<Record<string, unknown>[]> {
  try {
    const params = new URLSearchParams({
      engine: "google_maps", q: query, api_key: apiKey,
      hl: "pt", gl: "br", type: "search",
    });
    const res = await fetch(`${SERPAPI_URL}?${params}`, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    const results = (data.local_results as Record<string, unknown>[]) || [];
    return results.slice(0, 5); // max 5 per term
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { cities, types } = await req.json();
    const apiKey = process.env.SERPAPI_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "SERPAPI_KEY não configurada.", clinics: [] }, { status: 500 });
    }

    // Load existing IDs
    let existingIds = new Set<string>();
    try {
      const supabase = createAdminClient();
      const { data: existing } = await supabase.from("prospects").select("place_id");
      existingIds = new Set((existing || []).map((r: { place_id: string }) => r.place_id));
    } catch (e) {
      console.error("Supabase fetch error:", e);
    }

    // Build all search queries
    const queries: { city: string; type: string; term: string }[] = [];
    for (const city of cities as string[]) {
      for (const type of types as string[]) {
        const terms = SEARCH_TERMS[type] || [type];
        for (const term of terms) {
          queries.push({ city, type, term });
        }
      }
    }

    // Run all searches in parallel (max 8 at a time)
    const BATCH = 8;
    const allPlaces: { place: Record<string, unknown>; city: string; type: string }[] = [];

    for (let i = 0; i < queries.length; i += BATCH) {
      const batch = queries.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map(({ city, type, term }) =>
          searchMaps(`${term} em ${city}`, apiKey).then((places) =>
            places.map((place) => ({ place, city, type }))
          )
        )
      );
      for (const r of results) {
        if (r.status === "fulfilled") allPlaces.push(...r.value);
      }
    }

    // Deduplicate
    const seen = new Set<string>(existingIds);
    const uniquePlaces: { place: Record<string, unknown>; city: string; type: string }[] = [];
    for (const item of allPlaces) {
      const id = (item.place.place_id as string) || (item.place.title as string);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      uniquePlaces.push(item);
    }

    // Extract emails in parallel (max 10 at a time)
    const EMAIL_BATCH = 10;
    const withEmails: Record<string, unknown>[] = [];

    for (let i = 0; i < uniquePlaces.length; i += EMAIL_BATCH) {
      const batch = uniquePlaces.slice(i, i + EMAIL_BATCH);
      const emails = await Promise.allSettled(
        batch.map(({ place }) => extractEmail((place.website as string) || ""))
      );

      for (let j = 0; j < batch.length; j++) {
        const { place, city, type } = batch[j];
        const emailResult = emails[j];
        const email = emailResult.status === "fulfilled" ? emailResult.value : "";
        const nome = (place.title as string) || "";
        const cidadeShort = city.split(",")[0].trim();
        const id = (place.place_id as string) || nome;

        withEmails.push({
          place_id: id,
          nome,
          tipo: type,
          cidade: city,
          telefone: (place.phone as string) || "",
          website: (place.website as string) || "",
          endereco: (place.address as string) || "",
          avaliacao: place.rating ?? null,
          total_avaliacoes: (place.reviews as number) || 0,
          email,
          mensagem: generateMessage(nome, cidadeShort, type),
          status: "novo",
          email_enviado: false,
        });
      }
    }

    // Save to Supabase
    if (withEmails.length > 0) {
      try {
        const supabase = createAdminClient();
        const { error } = await supabase.from("prospects").insert(withEmails);
        if (error) console.error("Supabase insert error:", error);
      } catch (e) {
        console.error("Supabase save error:", e);
      }
    }

    // Map to frontend shape
    const clinics = withEmails.map((c) => ({
      id: c.place_id,
      nome: c.nome,
      tipo: c.tipo,
      cidade: c.cidade,
      telefone: c.telefone,
      website: c.website,
      endereco: c.endereco,
      avaliacao: c.avaliacao,
      totalAvaliacoes: c.total_avaliacoes,
      email: c.email,
      mensagem: c.mensagem,
      emailEnviado: false,
    }));

    return NextResponse.json({
      clinics,
      total_new: clinics.length,
      total_existing: existingIds.size,
    });

  } catch (e) {
    console.error("Buscar route error:", e);
    return NextResponse.json({ error: String(e), clinics: [] }, { status: 500 });
  }
}
