// Geração de imagens via gpt-image-1 (OpenAI) com fallback para Pollinations

import OpenAI from "openai";

export interface CarouselPhotos {
  cover: string;   // capa + cta
  content: string; // slides internos
}

// ── Pollinations fallback (gratuito) ──────────────────────────────────────────

function seed(s: string, offset = 0): number {
  return Math.abs(s.split("").reduce((n, c) => n + c.charCodeAt(0), 0)) + offset;
}

function pollinationsUrl(prompt: string, s: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1350&seed=${s}&nologo=true&model=flux-pro&enhance=true`;
}

const COVER_PROMPTS = [
  `cinematic dark office at night, young entrepreneur working on laptop, city skyline through glass window, blue screen glow on face, ultra realistic 8k photography, dramatic shadows, no text`,
  `dark futuristic businessman standing in front of city skyline at night, blue neon reflections, moody atmosphere, professional portrait, ultra realistic photography, no text`,
];

const CONTENT_PROMPTS = [
  `dark futuristic server room with glowing blue neon tubes, rows of servers, dramatic blue light, ultra realistic photography, no text`,
  `dark control room with multiple glowing blue holographic screens showing data dashboards, cinematic lighting, sci-fi atmosphere, no text`,
];

function pollinationsFallback(topic: string): CarouselPhotos {
  const s = seed(topic);
  return {
    cover:   pollinationsUrl(COVER_PROMPTS[s % COVER_PROMPTS.length],     s),
    content: pollinationsUrl(CONTENT_PROMPTS[s % CONTENT_PROMPTS.length], s + 1),
  };
}

// ── OpenAI gpt-image-1 ────────────────────────────────────────────────────────

const COVER_PROMPT_AI = `Cinematic dark office at night, professional entrepreneur at laptop with multiple screens, city skyline visible through large glass window, dramatic blue light from screens, photorealistic, ultra detailed, atmospheric. No text, no words, no logos.`;

const CONTENT_PROMPT_AI = `Dark futuristic control room with multiple glowing blue holographic screens showing business data and analytics, dramatic blue neon lighting, high-tech atmosphere, cinematic composition. No text, no words, no logos.`;

async function generateAIPhoto(openai: OpenAI, prompt: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (openai.images.generate as any)({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1536",
    quality: "medium",
    output_format: "jpeg",
  });

  const b64 = response.data?.[0]?.b64_json ?? "";
  if (!b64) return "";
  return `data:image/jpeg;base64,${b64}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateCarouselPhotos(topic: string): Promise<CarouselPhotos> {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return pollinationsFallback(topic);

  try {
    const openai = new OpenAI({ apiKey });
    const [cover, content] = await Promise.all([
      generateAIPhoto(openai, COVER_PROMPT_AI),
      generateAIPhoto(openai, CONTENT_PROMPT_AI),
    ]);

    if (!cover && !content) return pollinationsFallback(topic);
    return {
      cover:   cover   || pollinationsFallback(topic).cover,
      content: content || pollinationsFallback(topic).content,
    };
  } catch (err) {
    console.error("[image-gen] OpenAI failed, using Pollinations:", err);
    return pollinationsFallback(topic);
  }
}
