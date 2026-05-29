import Groq from "groq-sdk";
import { GeneratedCarousel } from "@/types";
import { renderSlide, SlideContent } from "@/lib/templates";
import type { SlidePhotos } from "@/lib/templates";
export { UPFLU_TOPICS, getTopicByIndex } from "@/lib/themes";

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || "").replace(/^﻿/, "").trim(),
});

const SYSTEM_PROMPT = `Você cria carrosséis para o Instagram da UPFLU — empresa de implementação de IA, automação e crescimento digital para donos de negócio brasileiro.

━━━ TOM ━━━
Direto. Sem rodeio. Sem coach. Sem jargão corporativo. Zero "escalar", "alavancar", "sinergia". Dados específicos e críveis. Fala para o empreendedor geral — não mencione nichos específicos.

━━━ ESTRUTURA — SEMPRE 4 SLIDES ━━━
Slide 1: SEMPRE "capa" — hook que para o scroll
Slide 2: conteúdo educativo tipo 1 (escolha entre lista, texto, stats ou destaque)
Slide 3: conteúdo educativo tipo 2 (tipo DIFERENTE do slide 2)
Slide 4: SEMPRE "cta"

PROIBIDO: usar "numero" nos slides 2 e 3. Conteúdo educativo e didático, não estatística isolada.

━━━ TIPOS DISPONÍVEIS PARA SLIDES 2 E 3 ━━━

"texto" — explicação educativa
  Campos: eyebrow, title, body
  eyebrow: máx 4 palavras UPPERCASE
  title: frase com 1 {{palavra}} em destaque — pode ter 8-12 palavras
  body: 2 frases que ENSINAM algo concreto sobre o tema
  Exemplo:
  { "type": "texto", "eyebrow": "O QUE NINGUÉM FALA", "title": "Responder {{rápido}} é a diferença entre vender e perder.", "body": "Estudos mostram que leads respondidos em até 5 minutos convertem 9x mais. Depois disso, a chance cai drasticamente." }

"lista" — pontos práticos (4 a 5 itens curtos)
  Campos: eyebrow, title, body
  body: itens separados por "|" — cada item tem 5-8 palavras
  Exemplo:
  { "type": "lista", "eyebrow": "ERROS QUE CUSTAM CARO", "title": "Sinais de que você está {{perdendo}} clientes agora.", "body": "Não faz follow-up depois do orçamento | Responde WhatsApp só quando lembra | Sem processo de pós-venda | Depende 100% da memória | Lead esfria sem perceber" }

"stats" — grade de dados (3 a 4 métricas)
  Campos: eyebrow, title, body, subtitle
  body formato: "valor§descrição curta|valor§descrição|valor§descrição"
  Exemplo:
  { "type": "stats", "eyebrow": "DADOS DO MERCADO", "title": "Negócios que {{automatizam}} crescem mais.", "body": "+3x§velocidade para atender leads|67%§menos tarefas manuais|R$4.200§economizados por mês|94%§mais satisfação dos clientes", "subtitle": "Automação não é custo. É investimento com retorno medido." }

"destaque" — frase forte para screenshot
  Campos: title, body
  title: frase poderosa com 8-14 palavras, SEM {{}}, SEM highlights
  body: frase de apoio em teal
  Exemplo:
  { "type": "destaque", "title": "Negócio que não automatiza trabalha o dobro para crescer a metade.", "body": "Isso vale para qualquer segmento, qualquer porte." }

━━━ TIPOS DA CAPA E CTA ━━━

"capa" — slide 1
  eyebrow, title (3-5 palavras, 1 {{palavra}}, impacto total), subtitle (tensão emocional curta)

"cta" — slide 4
  title com 1 {{palavra}}, handle SEMPRE "@upfluagencia"

━━━ JSON DE RETORNO ━━━
{
  "topic": "tema em até 4 palavras",
  "caption": "Hook direto sem emoji. 2-3 linhas com a dor real. CTA (manda DM ou segue). 10 hashtags Brasil.",
  "slides": [ ...4 slides... ]
}

━━━ REGRAS ABSOLUTAS ━━━
1. SEMPRE exatamente 4 slides.
2. Slide 1: OBRIGATÓRIO type "capa".
3. Slide 2: OBRIGATÓRIO type "lista" OU "texto" OU "stats" OU "destaque". NUNCA "cta", NUNCA "numero", NUNCA "capa".
4. Slide 3: OBRIGATÓRIO type "lista" OU "texto" OU "stats" OU "destaque". NUNCA "cta", NUNCA "numero", NUNCA "capa". Tipo DIFERENTE do slide 2.
5. Slide 4: OBRIGATÓRIO type "cta".
6. {{highlight}}: 1 palavra por título. NUNCA no "destaque".
7. handle do cta: SEMPRE "@upfluagencia".
8. NUNCA aspas duplas dentro de strings JSON.
9. lista e stats: separar com "|" e stats com "§".

EXEMPLO DE RESPOSTA CORRETA:
{
  "topic": "automação whatsapp",
  "caption": "...",
  "slides": [
    { "type": "capa", "eyebrow": "IA & AUTOMAÇÃO", "title": "Seu WhatsApp pode {{vender}} enquanto você dorme.", "subtitle": "A maioria dos negócios perde cliente por demora. Tem solução." },
    { "type": "lista", "eyebrow": "ERROS QUE CUSTAM CARO", "title": "Sinais de que seu {{atendimento}} está afastando clientes.", "body": "Responde mensagem horas depois | Esquece de fazer follow-up | Perde contato após enviar orçamento | Depende 100% de você estar online | Sem resposta automática fora do horário" },
    { "type": "texto", "eyebrow": "COMO RESOLVER", "title": "Automação não substitui você — {{liberta}} você.", "body": "Um assistente no WhatsApp responde em segundos, 24h por dia, sem erro. Você foca no que só você pode fazer." },
    { "type": "cta", "title": "Pronto para {{automatizar}} seu negócio?", "handle": "@upfluagencia" }
  ]
}`;

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

  // Garante estrutura correta independente do que a IA gerou
  const validContent = ["lista", "texto", "stats", "destaque"] as const;
  if (raw.slides.length >= 4) {
    raw.slides[0].type = "capa";
    if (!validContent.includes(raw.slides[1].type as typeof validContent[number])) {
      raw.slides[1].type = "lista";
    }
    if (!validContent.includes(raw.slides[2].type as typeof validContent[number])) {
      raw.slides[2].type = "texto";
    }
    raw.slides[raw.slides.length - 1].type = "cta";
    raw.slides[raw.slides.length - 1].handle = raw.slides[raw.slides.length - 1].handle || "@upfluagencia";
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
