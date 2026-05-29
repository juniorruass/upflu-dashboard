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

const ABERTURAS_ESTETICA = [
  "Vi que a {nome} atua no mercado de estética em {cidade} e queria trazer algo que pode fazer diferença.",
  "A {nome} está presente em {cidade}, mas será que está aparecendo para quem pesquisa no Google?",
];
const ABERTURAS_ODONTO = [
  "Vi que a {nome} atende pacientes em {cidade} e queria compartilhar algo relevante.",
  "A {nome} está em {cidade}, mas quando alguém pesquisa dentista na região — ela aparece?",
];
const FECHAMENTOS = [
  "A Upflu oferece um diagnóstico digital gratuito de 2 minutos, sem compromisso. Posso enviar o link?",
  "Temos um diagnóstico gratuito que mostra exatamente onde estão as oportunidades. Faz sentido conversar?",
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateMessage(nome: string, cidade: string, tipo: string): string {
  const aberturas = tipo.includes("estética") || tipo.includes("nutri") || tipo.includes("fisiо") ? ABERTURAS_ESTETICA : ABERTURAS_ODONTO;
  const abertura = pick(aberturas).replace(/{nome}/g, nome).replace(/{cidade}/g, cidade);
  const fechamento = pick(FECHAMENTOS).replace(/{nome}/g, nome);
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
          status: "potencial",
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
