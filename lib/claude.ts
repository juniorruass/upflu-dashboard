import Groq from "groq-sdk";
import { GeneratedCarousel } from "@/types";
export { UPFLU_TOPICS, getTopicByIndex } from "@/lib/themes";

const groq = new Groq({
  apiKey: (process.env.GROQ_API_KEY || "").replace(/^﻿/, "").trim(),
});

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
      "html": "HTML COMPLETO DO SLIDE"
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

Estrutura (5 slides apenas):
- Slide 1 CAPA: eyebrow verde uppercase + título 90px weight 900 + subtítulo
- Slides 2-4: alternar NÚMERO (numeral gigante verde), TEXTO (h2+parágrafo), DESTAQUE (fundo #00C896)
- Slide 5 CTA: fundo #00C896, logo, "Quer implementar no seu negócio?", @upflu.digital

Sem imagens externas. HTML inline completo por slide. Responda APENAS o JSON.`;

export async function generateCarousel(topic: string): Promise<GeneratedCarousel> {
  const userPrompt = `Tema: "${topic}"\n\nGere 5 slides. Retorne apenas o JSON.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 8000,
    temperature: 0.7,
  });

  const text = (completion.choices[0].message.content || "").trim();

  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)\s*```/) ||
    text.match(/```\s*([\s\S]*?)\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1].trim() : text;

  let parsed: GeneratedCarousel;
  try {
    parsed = JSON.parse(jsonText) as GeneratedCarousel;
  } catch {
    throw new Error(
      `Falha ao interpretar resposta como JSON. Início: ${jsonText.slice(0, 400)}`
    );
  }

  parsed.topic = topic;

  if (!Array.isArray(parsed.slides) || parsed.slides.length === 0) {
    throw new Error("Nenhum slide foi gerado");
  }

  return parsed;
}
