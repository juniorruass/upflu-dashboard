import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedCarousel } from "@/types";
export { UPFLU_TOPICS, getTopicByIndex } from "@/lib/themes";

const genai = new GoogleGenerativeAI(
  (process.env.GEMINI_API_KEY || "").replace(/^﻿/, "").trim()
);
const model = genai.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const SYSTEM_PROMPT = `Você é o sistema de criação de conteúdo da UPFLU, empresa de crescimento digital, implementações e IA para negócios. Sua tarefa é gerar carrosséis completos para o Instagram da UPFLU.

A UPFLU não é agência de marketing — é empresa de implementação tecnológica. O tom de voz é: direto, sem rodeio, informal mas profissional. Sem jargões de guru ("alavancar", "sinergia", "escalar"). Sem emojis decorativos. Fala como quem sabe o que faz.

Clientes ideais: barbearias, advogados, clínicas, restaurantes, academias.

Ao gerar um carrossel, retorne APENAS um JSON válido no seguinte formato:
{
  "topic": "título do carrossel",
  "caption": "legenda completa para o Instagram (hook + contexto + CTA + hashtags)",
  "slides": [
    {
      "slide_number": 1,
      "html": "HTML COMPLETO DO SLIDE (ver especificações abaixo)"
    }
  ]
}

Especificações do HTML de cada slide:
- Dimensões exatas: 1080px × 1350px (width e height fixos no elemento raiz)
- Fonte: Inter via Google Fonts (@import no <style> no início do HTML)
- Fundo escuro padrão: #0E1116
- Fundo alternativo (slides pares): #F5ECD7
- Cor de destaque: #00C896
- Texto sobre escuro: #FAFAF7
- Texto sobre claro: #1A1A1A
- Sem imagens externas (apenas CSS puro)
- Logo: texto "UPFLU" em verde (#00C896) 16px weight 700 no canto superior esquerdo
- Contador de slide no canto superior direito: "01/07" formato, 14px, #888888
- Inline CSS apenas (sem classes externas, sem Tailwind)
- Padding lateral: 80px

Estrutura dos slides (6 a 8 slides):
- Slide 1 (CAPA): layout CAPA — eyebrow uppercase em verde, título grande (90px, weight 900, letter-spacing -0.04em), subtítulo 24px
- Slides 2-N (INTERNOS): alternar entre:
  - layout NÚMERO: número gigante em verde + texto explicativo
  - layout TEXTO: eyebrow + h2 + parágrafo
  - layout DESTAQUE: fundo na cor de destaque (#00C896) com texto escuro (#1A1A1A)
- Slide final (CTA): fundo #00C896, logo centralizado, "Quer implementar isso no seu negócio?", handle @upflu.digital

Formato de cada slide no campo "html":
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;0,900&display=swap');
</style>
<div style="width:1080px;height:1350px;font-family:'Inter','Helvetica Neue',Arial,sans-serif;position:relative;overflow:hidden;box-sizing:border-box;[BACKGROUND];padding:80px;">
  <!-- logo + contador no topo -->
  <!-- conteúdo central -->
</div>

NUNCA use background-image ou imagens externas.
SEMPRE gere HTML completo e auto-contido por slide.
NUNCA inclua explicações fora do JSON.`;

export async function generateCarousel(topic: string): Promise<GeneratedCarousel> {
  const userPrompt = `Gere um carrossel completo sobre o seguinte tema:\n"${topic}"\n\nGere entre 6 e 8 slides. Retorne apenas o JSON, sem explicações.`;

  const result = await model.generateContent({
    systemInstruction: SYSTEM_PROMPT,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: 16000 },
  });

  const text = result.response.text().trim();

  // Gemini sometimes wraps JSON in markdown fences
  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)\s*```/) ||
    text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1].trim() : text;

  let parsed: GeneratedCarousel;
  try {
    parsed = JSON.parse(jsonText) as GeneratedCarousel;
  } catch {
    throw new Error(
      `Failed to parse Gemini response as JSON. First 400 chars: ${jsonText.slice(0, 400)}`
    );
  }

  parsed.topic = topic;

  if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) {
    throw new Error("Gemini returned no slides in the JSON response");
  }

  return parsed;
}
