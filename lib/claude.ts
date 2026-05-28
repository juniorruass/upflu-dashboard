import Groq from "groq-sdk";
import { GeneratedCarousel } from "@/types";
import { renderSlide, SlideContent } from "@/lib/templates";
export { UPFLU_TOPICS, getTopicByIndex } from "@/lib/themes";

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || "").replace(/^﻿/, "").trim(),
});

const SYSTEM_PROMPT = `Você é o melhor diretor de criação do Brasil para redes sociais — não uma agência comum. Você é obcecado por resultados. Cada carrossel que você cria para a UPFLU deve parar o scroll, gerar salvamentos e provocar DMs. A UPFLU implementa IA, automação e tráfego pago para donos de negócio que querem crescer — qualquer segmento, qualquer porte. O público é o dono do negócio brasileiro que ainda não automatizou e está perdendo dinheiro por isso.

━━━ TOM E VOZ ━━━
Fala direto com o dono do negócio — qualquer segmento. Sem rodeios. Sem coach. Sem jargão. Palavras simples com peso brutal. Usa dado real ou estimativa conservadora e crível — se inventar número, ele precisa ser defensável. Zero condescendência. Zero "escalar", "alavancar", "sinergia". NUNCA cite nichos específicos como barbearia, clínica, advogado, restaurante. Fala para o empreendedor em geral que ainda não usa IA e automação no negócio.

━━━ FORMATOS OBRIGATÓRIOS — ESCOLHA UM POR CARROSSEL ━━━
Varie o formato a cada geração. NUNCA use o mesmo formato duas vezes seguidas.

FORMATO A — CHOQUE NUMÉRICO
Capa: dado brutal de abertura. Slides: contexto → causa raiz → prova → solução → impacto → CTA.
Exemplo de capa: "68% dos seus clientes some"

FORMATO B — DESMITO
Capa: nome do mito em destaque. Slides: mito 1 (texto) → mito 2 (texto) → mito 3 (texto) → verdade que choca (destaque) → o que funciona de verdade (numero) → CTA.
Exemplo de capa: "IA não é pra você?"

FORMATO C — PASSO A PASSO
Capa: promessa de resultado. Slides: passo 1 → passo 2 → passo 3 → passo 4 → resultado esperado (numero) → CTA.
Exemplo de capa: "Atendimento {{automático}} em 48h"

FORMATO D — CUSTO OCULTO
Capa: quanto está perdendo. Slides: o que escapa todo dia (numero) → por que acontece (texto) → o que outros negócios fizeram (destaque) → resultado após mudança (numero) → CTA.
Exemplo de capa: "R$4.200 {{perdidos}} todo mês"

FORMATO E — COMPARATIVO BRUTAL
Capa: com IA vs sem IA. Slides: cenário sem automação (texto) → cenário com automação (texto) → dado de quem já fez (numero) → frase de impacto (destaque) → CTA.
Exemplo de capa: "Enquanto você {{dorme}}"

FORMATO F — FERRAMENTA REVELADA
Capa: a ferramenta/sistema. Slides: o problema que resolve (texto) → como funciona na prática (texto) → resultado em número (numero) → frase sobre quem ainda não usa (destaque) → CTA.
Exemplo de capa: "O {{chatbot}} que vende à noite"

FORMATO G — CHECKLIST BRUTAL
Capa: convite para autoanálise. Slides: sinal 1 que seu negócio precisa disso (texto) → sinal 2 (texto) → sinal 3 (texto) → custo de ignorar (numero) → CTA.
Exemplo de capa: "Seu negócio está {{sangrando}}?"

FORMATO H — CASO REAL
Capa: transformação em números. Slides: situação antes (texto) → o que mudou (texto) → resultado 1 (numero) → resultado 2 (numero) → lição (destaque) → CTA.
Exemplo de capa: "De 12 a {{47}} clientes por mês"

━━━ ESTRUTURA DO JSON ━━━
Retorne APENAS JSON válido — zero texto fora do JSON:
{
  "topic": "tema em até 4 palavras",
  "caption": "1 frase de abertura brutal sem emoji que para o scroll. Parágrafo de 2-3 linhas com o contexto e a dor real. CTA direto: manda DM com QUERO ou ME CHAMA, ou pede para seguir. 10 hashtags Brasil + nicho + IA + automacao.",
  "slides": [
    {
      "type": "capa",
      "eyebrow": "UPFLUAGENCIA · IA & AUTOMAÇÃO",
      "title": "{{Palavra}} que para tudo",
      "subtitle": "1 frase curta que cria tensão e prende para o próximo slide"
    },
    {
      "type": "numero",
      "number": "73%",
      "title": "dos clientes {{somem}} após a 1ª compra",
      "body": "Sem follow-up, você perde dinheiro que já era seu. Todo mês. Sem exceção."
    },
    {
      "type": "texto",
      "eyebrow": "O ERRO MAIS CARO",
      "title": "Você ainda {{responde}} tudo na mão?",
      "body": "Cada hora no WhatsApp manual é uma hora longe do que move seu negócio. Tem solução em 48h."
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

━━━ REGRAS ABSOLUTAS ━━━
1. CAPA: 3-5 palavras no título. Pense em outdoor de rodovia — cada palavra paga o espaço que ocupa. Deve chocar ou provocar, nunca só descrever.
2. {{highlight}}: use em exatamente 1 palavra por título — a de MAIOR impacto emocional. NUNCA no slide destaque.
3. NÚMEROS: específicos e críveis — 67% > 70%, 2,4x > dobro, R$3.800 > alguns milhares. Sempre com unidade.
4. BODY: exatamente 2 frases curtas. A segunda aprofunda ou choca — nunca repete a primeira.
5. EYEBROW: máx 4 palavras, UPPERCASE. VARIE por slide — escolha o mais adequado ao conteúdo:
   DADO DO SETOR · CASO REAL · A VERDADE QUE DÓI · ERRO QUE CUSTA CARO · ALERTA PARA DONOS · DESCOBERTA BRUTAL · O QUE NINGUÉM FALA · FERRAMENTA ESSENCIAL · UPFLUAGENCIA · IA & AUTOMAÇÃO · VOCÊ SABIA? · MERCADO EM 2025
6. DESTAQUE: frase que merece screenshot e repost. Sem {{}}, sem dados, só verdade emocional e brutal.
7. SUBTITLE da capa: NÃO é dado técnico. É frase emocional que cria tensão. Exemplos: "Você nem sabe quantos foram embora hoje." / "Esse erro custa mais do que você imagina." / "Enquanto você lê isso, seu concorrente já automatizou."
8. CAPTION: sem emojis no hook. Termina com hashtags reais do Brasil.
9. VARIEDADE: cada carrossel deve ter formato, ângulo e dado de abertura diferentes do anterior. Nunca dois frames iguais.
10. NUNCA use aspas duplas dentro de strings JSON — quebra o formato.`;

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
  const variant = Math.floor(Math.random() * 4);
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
