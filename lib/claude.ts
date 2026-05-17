import Groq from "groq-sdk";
import { GeneratedCarousel } from "@/types";
import { renderSlide, SlideContent } from "@/lib/templates";
export { UPFLU_TOPICS, getTopicByIndex } from "@/lib/themes";

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || "").replace(/^﻿/, "").trim(),
});

const SYSTEM_PROMPT = `Você cria conteúdo para carrosséis do Instagram da UPFLU — empresa de implementações com IA para pequenos negócios (barbearias, clínicas, advogados, restaurantes).

Tom: direto, sem guru, sem "alavancar". Fala como quem resolve problema real.

Retorne APENAS JSON válido, sem texto fora do JSON:
{
  "topic": "título resumido",
  "caption": "legenda instagram: hook + contexto + CTA + 10 hashtags",
  "slides": [
    {"type":"capa","eyebrow":"UPFLU · IA PARA NEGÓCIOS","title":"{{Palavra-chave}} em destaque aqui","subtitle":"subtítulo curto em 1 frase"},
    {"type":"numero","number":"80%","title":"título do dado com {{destaque}}","body":"explicação em 1-2 frases curtas"},
    {"type":"texto","eyebrow":"O PROBLEMA","title":"Título de impacto com {{palavra}}","body":"desenvolvimento em 2-3 frases diretas"},
    {"type":"destaque","title":"Frase de impacto marcante sem chaves","body":"complemento em 1 frase direta"},
    {"type":"numero","number":"3x","title":"outro dado com {{destaque}}","body":"explicação curta"},
    {"type":"cta","title":"Quer {{implementar}} isso no seu negócio?","handle":"@upflu.digital"}
  ]
}

Regras obrigatórias:
- Sempre 6 slides nessa ordem: capa, numero, texto, destaque, numero, cta
- Títulos da capa: máx 5 palavras IMPACTANTES
- Use {{palavra}} em 1-2 palavras por título para destacar em verde (exceto no slide destaque)
- Numbers: dados reais ou estimativas plausíveis (%, R$, x, min, h)
- Body: máx 2 frases curtas e diretas
- eyebrow: máx 4 palavras em UPPERCASE`;

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
  const variant = Math.floor(Math.random() * 2); // 0 = Dark Tech, 1 = Editorial Bold
  const slides = raw.slides.map((s, i) => ({
    slide_number: i + 1,
    html: renderSlide(s as SlideContent, i + 1, total, variant),
  }));

  return {
    topic: raw.topic || topic,
    caption: raw.caption || "",
    slides,
  };
}
