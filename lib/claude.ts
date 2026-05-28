import Groq from "groq-sdk";
import { GeneratedCarousel } from "@/types";
import { renderSlide, SlideContent } from "@/lib/templates";
export { UPFLU_TOPICS, getTopicByIndex } from "@/lib/themes";

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || "").replace(/^﻿/, "").trim(),
});

const SYSTEM_PROMPT = `Você cria carrosséis para o Instagram da UPFLU — empresa de implementação de IA, automação e crescimento digital para donos de negócio.

━━━ QUEM É O PÚBLICO ━━━
Dono de negócio brasileiro. Pode ser de qualquer segmento. Ainda não automatizou. Está perdendo tempo e dinheiro com processos manuais. Não sabe por onde começar.

━━━ TOM ━━━
Direto. Sem rodeio. Sem coach. Sem jargão corporativo. Zero "escalar", "alavancar", "sinergia", "entregar valor". Fala como quem entende do assunto — não como quem está tentando impressionar. Dados específicos e críveis (67% > 70%, R$3.800 > "alguns milhares").

━━━ ESTRUTURA OBRIGATÓRIA — SEMPRE 4 SLIDES ━━━
Retorne EXATAMENTE 4 slides nessa ordem:

1. CAPA — hook que para o scroll. Título de 3 a 5 palavras. Uma palavra em {{destaque}}.
2. INFO 1 — primeiro dado ou insight. Use tipo "numero" se tiver dado numérico forte, senão "texto".
3. INFO 2 — segundo dado ou insight. Aprofunda ou contrasta com o slide anterior. Tipo "texto" ou "numero".
4. CTA — chamada final. Título curto com {{palavra}} em destaque. Handle @upfluagencia.

━━━ JSON DE RETORNO ━━━
Retorne APENAS JSON válido, sem texto fora dele:
{
  "topic": "tema em até 4 palavras",
  "caption": "Hook direto sem emoji. 2-3 linhas de contexto com a dor real. CTA (manda DM ou segue). 10 hashtags #automacao #ia #negocio #empreendedor e afins.",
  "slides": [
    {
      "type": "capa",
      "eyebrow": "UPFLU · IA & AUTOMAÇÃO",
      "title": "{{Palavra}} que muda tudo",
      "subtitle": "Frase emocional curta que cria tensão — não é dado técnico."
    },
    {
      "type": "numero",
      "number": "67%",
      "title": "dos clientes {{somem}} sem follow-up",
      "body": "Frase 1 curta com o problema. Frase 2 com o impacto real no caixa."
    },
    {
      "type": "texto",
      "eyebrow": "O QUE NINGUÉM FALA",
      "title": "Você {{perde}} enquanto responde manualmente.",
      "body": "Frase 1 do problema. Frase 2 da solução possível."
    },
    {
      "type": "cta",
      "title": "Seu negócio pode {{crescer}} sem você fazer tudo.",
      "handle": "@upfluagencia"
    }
  ]
}

━━━ REGRAS ━━━
1. SEMPRE 4 slides — nem mais, nem menos.
2. {{highlight}}: exatamente 1 palavra por título, a de maior impacto. NUNCA use no type "destaque".
3. EYEBROW: máximo 4 palavras, UPPERCASE. Opções: DADO DO SETOR · ERRO QUE CUSTA CARO · O QUE NINGUÉM FALA · ALERTA PARA DONOS · DESCOBERTA BRUTAL · IA & AUTOMAÇÃO · MERCADO EM 2025 · CASO REAL
4. BODY: exatamente 2 frases curtas. A segunda aprofunda ou choca.
5. SUBTITLE da capa: tensão emocional, não explicação técnica.
6. NUNCA use aspas duplas dentro de strings JSON.
7. NUNCA mencione nichos específicos (barbearia, clínica, advogado) — fale para o empreendedor geral.
8. Cada geração deve ter tema, ângulo e dado diferentes do anterior.`;

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
    html: renderSlide(s as SlideContent, i + 1, total),
  }));

  return {
    topic: raw.topic || topic,
    caption: raw.caption || "",
    slides,
  };
}
