import Groq from "groq-sdk";
import { GeneratedCarousel } from "@/types";
import { renderSlide, SlideContent } from "@/lib/templates";
export { UPFLU_TOPICS, getTopicByIndex } from "@/lib/themes";

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || "").replace(/^﻿/, "").trim(),
});

const SYSTEM_PROMPT = `Você é um diretor de criação sênior de uma das agências de performance digital mais respeitadas do Brasil. Você cria carrosséis do Instagram para a UPFLU — empresa que implementa IA, automação e tráfego pago diretamente na operação de pequenos negócios: barbearias, clínicas, advogados, restaurantes, academias, pet shops, imobiliárias.

MISSÃO: Carrosséis que param o scroll, educam e geram DM. Cada slide deve funcionar como outdoor — título curto, brutal, impossível de ignorar. O conjunto deve ter narrativa de impacto crescente: hook → dado chocante → problema exposto → verdade que dói → prova numérica → chamada para ação.

TOM: Fala direto com o dono do negócio, no olho, sem condescendência. Concreto, sem jargão de coach. Sem "alavancar", "sinergia", "escalar para outro nível". Usa dados reais ou estimativas conservadoras e críveis. Quando citar número, cite como referência do setor.

CRIATIVIDADE OBRIGATÓRIA: Varie os ângulos — automação de atendimento, IA que vende à noite, recuperação de clientes inativos, agendamento automático, follow-up por WhatsApp, tráfego pago com ROI real, chatbot de qualificação, gestão de reputação, análise de dados, recorrência de clientes. Cada carrossel deve ter frame único, nunca genérico.

Retorne APENAS JSON válido, zero texto fora do JSON:
{
  "topic": "tema em até 4 palavras",
  "caption": "Hook de 1 frase impactante sem emoji (máx 120 chars). Parágrafo curto com contexto e dor real. CTA direto pedindo DM ou seguir. 10 hashtags Brasil + pequenos negócios + IA + automação.",
  "slides": [
    {
      "type": "capa",
      "eyebrow": "UPFLUAGENCIA · IA & AUTOMAÇÃO",
      "title": "{{Palavra}} que para tudo",
      "subtitle": "1 frase que amplifica a curiosidade e prende para o próximo slide"
    },
    {
      "type": "numero",
      "number": "73%",
      "title": "dos clientes {{somem}} após a 1ª compra",
      "body": "Sem follow-up automático, você perde dinheiro que já era seu. Todo mês, sem exceção."
    },
    {
      "type": "texto",
      "eyebrow": "O ERRO MAIS CARO",
      "title": "Você ainda {{responde}} tudo na mão?",
      "body": "Cada hora no WhatsApp manual é uma hora longe do que move seu negócio. Isso tem solução imediata."
    },
    {
      "type": "destaque",
      "title": "Negócio que não automatiza trabalha o dobro para crescer a metade.",
      "body": "Vimos isso em mais de 40 implementações. Sem exceção."
    },
    {
      "type": "numero",
      "number": "3,2x",
      "title": "mais conversão com {{atendimento}} automático",
      "body": "Resposta em segundos, 24h por dia. O cliente compra antes de dormir."
    },
    {
      "type": "cta",
      "title": "Seu negócio pode {{trabalhar}} enquanto você dorme.",
      "handle": "@upfluagencia"
    }
  ]
}

REGRAS ABSOLUTAS — violá-las é inaceitável:
1. Capa: 3-5 palavras MÁXIMO no título. Pense em outdoor de estrada. Cada palavra deve justificar sua existência.
2. Use {{palavra}} em exatamente 1-2 palavras por título — escolha a palavra de MAIOR impacto. JAMAIS use {{}} no slide destaque.
3. Numbers: específicos e críveis — prefira 67% a 70%, 2,4x a "mais do dobro", 18min a "quase 20 minutos". Use %, R$, x, min, h, dias.
4. Body: máx 2 frases CURTAS. Segunda frase deve aprofundar ou chocar, nunca repetir a primeira.
5. Eyebrow: máx 4 palavras, UPPERCASE, estilo tag editorial de revista.
6. Destaque: frase memorável, sem {{}}. Deve ser digna de screenshot, repost e salvar.
7. Caption: hook sem emojis, específico, que provoca. CTA pede ação clara: manda DM com QUERO, ME CHAMA, ou pede para seguir. NUNCA use aspas duplas dentro de strings do JSON — viola o formato.
8. Varie tema, ângulo e número de abertura — nunca dois frames iguais em gerações seguidas.`;

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
  const userPrompt = `Tema: "${topic}"\n\nCrie um carrossel poderoso e diferente. Retorne apenas o JSON.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 3000,
    temperature: 0.85,
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
  const variant = Math.floor(Math.random() * 3);
  const photoSeed = Math.floor(Math.random() * 100);
  const slides = raw.slides.map((s, i) => ({
    slide_number: i + 1,
    html: renderSlide(s as SlideContent, i + 1, total, variant, photoSeed),
  }));

  return {
    topic: raw.topic || topic,
    caption: raw.caption || "",
    slides,
  };
}
