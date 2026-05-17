import Groq from "groq-sdk";
import { GeneratedCarousel } from "@/types";
import { renderSlide, SlideContent } from "@/lib/templates";
export { UPFLU_TOPICS, getTopicByIndex } from "@/lib/themes";

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || "").replace(/^﻿/, "").trim(),
});

const SYSTEM_PROMPT = `Você cria conteúdo para carrosséis do Instagram da UPFLU — empresa de crescimento digital e implementações com IA para pequenos negócios (barbearias, clínicas, advogados, restaurantes).

Tom: direto, sem guru, sem "alavancar" ou "sinergia". Fala como quem resolve problema real.

Retorne APENAS JSON válido, sem texto fora do JSON:
{
  "topic": "título resumido",
  "caption": "legenda instagram: hook + contexto + CTA + 10 hashtags",
  "slides": [
    {"type":"capa","eyebrow":"TEXTO CURTO UPPERCASE","title":"Título Grande","subtitle":"subtítulo curto"},
    {"type":"numero","number":"80%","title":"título do dado","body":"explicação em 1-2 frases"},
    {"type":"texto","eyebrow":"CONTEXTO","title":"Título de impacto","body":"desenvolvimento em 2-3 frases"},
    {"type":"destaque","title":"Frase de impacto curta","body":"complemento em 1 frase"},
    {"type":"numero","number":"3x","title":"outro dado relevante","body":"explicação"},
    {"type":"cta","title":"Quer implementar isso no seu negócio?","handle":"@upflu.digital"}
  ]
}

Regras:
- Sempre 6 slides nessa ordem: capa, numero, texto, destaque, numero, cta
- Títulos da capa: máx 4 palavras impactantes
- Numbers: use dados reais ou estimativas plausíveis (%, R$, x, h)
- Body: máx 2 frases curtas e diretas`;

interface RawSlide {
  type: "capa" | "numero" | "texto" | "destaque" | "cta";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  body?: string;
  number?: string;
  handle?: string;
}

interface RawGenerated {
  topic: string;
  caption: string;
  slides: RawSlide[];
}

export async function generateCarousel(topic: string): Promise<GeneratedCarousel> {
  const userPrompt = `Tema: "${topic}"\n\nGere o JSON do carrossel.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 3000,
    temperature: 0.7,
  });

  const text = (completion.choices[0].message.content || "").trim();
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1].trim() : text;

  let raw: RawGenerated;
  try {
    raw = JSON.parse(jsonText) as RawGenerated;
  } catch {
    throw new Error(`JSON inválido. Início: ${jsonText.slice(0, 300)}`);
  }

  if (!Array.isArray(raw.slides) || raw.slides.length === 0) {
    throw new Error("Nenhum slide gerado");
  }

  const total = raw.slides.length;
  const slides = raw.slides.map((s, i) => ({
    slide_number: i + 1,
    html: renderSlide(s as SlideContent, i + 1, total),
  }));

  return {
    topic: raw.topic || topic,
    caption: raw.caption || "",
    slides,
  };
}
