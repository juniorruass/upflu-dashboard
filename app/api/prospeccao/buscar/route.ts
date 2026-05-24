import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const SERPAPI_URL = "https://serpapi.com/search.json";

const SEARCH_TERMS: Record<string, string[]> = {
  "clínica estética": ["clínica estética", "estética facial", "centro estético", "clínica de beleza"],
  "clínica odontológica": ["clínica odontológica", "dentista", "odontologia", "consultório dentário"],
};

const ABERTURAS_ESTETICA = [
  "Vi que a {nome} atua no mercado de estética em {cidade} e queria trazer algo que pode fazer diferença.",
  "A {nome} está presente em {cidade}, mas será que está aparecendo para quem pesquisa no Google?",
  "Clínicas de estética em {cidade} estão perdendo pacientes para concorrentes que aparecem antes no Google.",
];

const ABERTURAS_ODONTO = [
  "Vi que a {nome} atende pacientes em {cidade} e queria compartilhar algo relevante.",
  "Clínicas odontológicas em {cidade} estão perdendo pacientes para concorrentes com melhor presença digital.",
  "A {nome} está em {cidade}, mas quando alguém pesquisa dentista na região — ela aparece?",
];

const FECHAMENTOS = [
  "A Upflu oferece um diagnóstico digital gratuito de 2 minutos, sem compromisso. Posso enviar o link?",
  "Temos um diagnóstico gratuito que mostra exatamente onde estão as oportunidades. Faz sentido conversar?",
  "Posso enviar um diagnóstico gratuito mostrando como a {nome} está posicionada digitalmente agora?",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMessage(nome: string, cidade: string, tipo: string): string {
  const aberturas = tipo.includes("estética") ? ABERTURAS_ESTETICA : ABERTURAS_ODONTO;
  const abertura = pick(aberturas).replace(/{nome}/g, nome).replace(/{cidade}/g, cidade);
  const fechamento = pick(FECHAMENTOS).replace(/{nome}/g, nome);
  return `Olá! ${abertura}\n\n${fechamento}\n\nUpflu | upflu.digital`;
}

async function extractEmail(url: string): Promise<string> {
  if (!url) return "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
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

async function searchMaps(query: string, apiKey: string, maxPages = 2): Promise<Record<string, unknown>[]> {
  const allResults: Record<string, unknown>[] = [];

  // Página 1
  const params = new URLSearchParams({ engine: "google_maps", q: query, api_key: apiKey, hl: "pt", gl: "br", type: "search" });
  const res = await fetch(`${SERPAPI_URL}?${params}`);
  const data = await res.json();
  allResults.push(...((data.local_results as Record<string, unknown>[]) || []));

  // Páginas seguintes via next_page_token
  let nextToken = data?.serpapi_pagination?.next_page_token;
  let page = 1;

  while (nextToken && page < maxPages) {
    const nextParams = new URLSearchParams({ engine: "google_maps", next_page_token: nextToken, api_key: apiKey });
    const nextRes = await fetch(`${SERPAPI_URL}?${nextParams}`);
    const nextData = await nextRes.json();
    allResults.push(...((nextData.local_results as Record<string, unknown>[]) || []));
    nextToken = nextData?.serpapi_pagination?.next_page_token;
    page++;
  }

  return allResults;
}

export async function POST(req: NextRequest) {
  try {
    const { cities, types } = await req.json();
    const apiKey = process.env.SERPAPI_KEY!;

    // Buscar place_ids já existentes — falha silenciosa se Supabase não conectar
    let existingIds = new Set<string>();
    try {
      const supabase = createAdminClient();
      const { data: existing } = await supabase.from("prospects").select("place_id");
      existingIds = new Set((existing || []).map((r: { place_id: string }) => r.place_id));
    } catch (e) {
      console.error("Supabase fetch error:", e);
    }

    const seen = new Set<string>(existingIds);
    const newClinics: Record<string, unknown>[] = [];

    for (const city of cities as string[]) {
      for (const type of types as string[]) {
        const terms = SEARCH_TERMS[type] || [type];
        const allPlaces: Record<string, unknown>[] = [];
        for (const term of terms) {
          const results = await searchMaps(`${term} em ${city}`, apiKey);
          allPlaces.push(...results);
        }
        const places = allPlaces;

        for (const place of places) {
          const id = (place.place_id as string) || (place.title as string);
          if (!id || seen.has(id)) continue;
          seen.add(id);

          const website = (place.website as string) || "";
          const email = await extractEmail(website);
          const nome = (place.title as string) || "";
          const cidadeShort = city.split(",")[0].trim();

          newClinics.push({
            place_id: id,
            nome,
            tipo: type,
            cidade: city,
            telefone: (place.phone as string) || "",
            website,
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
    }

    // Salvar no Supabase — falha silenciosa
    if (newClinics.length > 0) {
      try {
        const supabase = createAdminClient();
        const { error } = await supabase.from("prospects").insert(newClinics);
        if (error) console.error("Supabase insert error:", error);
      } catch (e) {
        console.error("Supabase save error:", e);
      }
    }

    return NextResponse.json({
      clinics: newClinics,
      total_new: newClinics.length,
      total_existing: existingIds.size,
    });
  } catch (e) {
    console.error("Buscar route error:", e);
    return NextResponse.json({ error: String(e), clinics: [] }, { status: 500 });
  }
}
