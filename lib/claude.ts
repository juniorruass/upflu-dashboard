import Groq from "groq-sdk";
import { GeneratedCarousel } from "@/types";
import { renderSlide, SlideContent, SlidePhotos } from "@/lib/templates";
export { UPFLU_TOPICS, getTopicByIndex } from "@/lib/themes";

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || "").replace(/^﻿/, "").trim(),
});

const SYSTEM_PROMPT = `Você cria carrosséis para o Instagram da UPFLU — empresa de implementação de IA, automação e crescimento digital para donos de negócio brasileiro.

━━━ TOM ━━━
Direto. Sem rodeio. Sem coach. Sem jargão corporativo. Zero "escalar", "alavancar", "sinergia". Dados específicos e críveis. Fala para o empreendedor geral — não mencione nichos específicos.

━━━ ESTRUTURA — SEMPRE 4 SLIDES ━━━
Slide 1: sempre "capa"
Slides 2 e 3: escolha o tipo mais adequado ao tema (veja abaixo)
Slide 4: sempre "cta"

━━━ TIPOS DE SLIDE DISPONÍVEIS ━━━

"capa" — capa de abertura
  eyebrow, title (3-5 palavras, 1 {{palavra}} em destaque), subtitle (tensão emocional)

"numero" — dado numérico de impacto
  number (ex: "67%", "3,2x", "R$4.800"), title com 1 {{palavra}}, body (2 frases curtas)

"texto" — insight ou explicação
  eyebrow, title com 1 {{palavra}}, body (2 frases curtas)

"lista" — checklist de pontos (3 a 5 itens)
  eyebrow, title com 1 {{palavra}}, body com itens separados por "|"
  Exemplo de body: "Responde tarde no WhatsApp | Perde o cliente após orçamento | Sem follow-up automático | Processo depende 100% de você"

"stats" — grade de métricas (2 a 4 dados)
  eyebrow, title com 1 {{palavra}}, body com stats no formato "número§descrição curta|número§descrição curta|..."
  Exemplo: "+80%§economia de tempo operacional|-67%§redução de custos manuais|+3x§velocidade para crescer|+94%§satisfação dos clientes"
  subtitle (opcional): frase de fechamento

"destaque" — frase forte para repost (sem {{}} no title)
  title (frase de impacto pura, sem highlight), body (complemento em teal)

"cta" — chamada final
  title com 1 {{palavra}}, handle

━━━ ESCOLHA OS TIPOS CERTOS ━━━
- Tema com dado forte → use "numero" em um dos slides internos
- Tema com lista de erros/sinais/passos → use "lista"
- Tema com múltiplas métricas → use "stats"
- Tema com insight profundo → use "texto" ou "destaque"
- Varie: nunca use o mesmo par de tipos nas posições 2 e 3 em gerações consecutivas

━━━ JSON DE RETORNO ━━━
Retorne APENAS JSON válido, sem texto fora:
{
  "topic": "tema em até 4 palavras",
  "caption": "Hook direto sem emoji. 2-3 linhas com a dor real. CTA (manda DM ou segue). 10 hashtags Brasil.",
  "slides": [ ... 4 slides ... ]
}

━━━ REGRAS ABSOLUTAS ━━━
1. SEMPRE exatamente 4 slides.
2. {{highlight}}: 1 palavra por título, a mais impactante. NUNCA em "destaque".
3. EYEBROW (max 4 palavras UPPERCASE): DADO DO SETOR · ERRO QUE CUSTA CARO · O QUE NINGUÉM FALA · ALERTA PARA DONOS · DESCOBERTA BRUTAL · IA & AUTOMAÇÃO · MERCADO EM 2025 · CASO REAL · A VERDADE É DURA
4. NUNCA aspas duplas dentro de strings JSON.
5. Lista e stats: separar itens exatamente com "|" e stats com "§".`;

interface RawSlide {
  type: "capa" | "numero" | "texto" | "lista" | "stats" | "destaque" | "cta";
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

export async function generateCarousel(topic: string, photos?: SlidePhotos): Promise<GeneratedCarousel> {
  const userPrompt = `Tema: "${topic}"\n\nCrie um carrossel direto e impactante. Retorne apenas o JSON com exatamente 4 slides.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2000,
    temperature: 0.8,
    response_format: { type: "json_object" },
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
    html: renderSlide(s as SlideContent, i + 1, total, photos),
  }));

  return {
    topic: raw.topic || topic,
    caption: raw.caption || "",
    slides,
  };
}
