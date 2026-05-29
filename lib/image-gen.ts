import OpenAI from "openai";

export interface CarouselPhotos {
  cover: string;   // capa + cta
  content: string; // slides internos
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const COVER_PROMPT = `Cinematic dark office at night. Professional entrepreneur sitting at desk with laptop and multiple glowing screens. Large glass window showing city skyline at night. Dramatic blue light from screens. Ultra realistic photography. No text, no words, no logos anywhere.`;

const CONTENT_PROMPT = `Dark futuristic control room with multiple glowing blue holographic screens showing business charts and data dashboards. Dramatic blue neon lighting, high-tech atmosphere. Ultra realistic photography. No text, no words, no logos anywhere.`;

// ── Pollinations fallback (gratuito) ──────────────────────────────────────────

function seed(s: string, offset = 0): number {
  return Math.abs(s.split("").reduce((n, c) => n + c.charCodeAt(0), 0)) + offset;
}

function pollUrl(prompt: string, s: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1350&seed=${s}&nologo=true&model=flux-pro&enhance=true`;
}

function pollinationsFallback(topic: string): CarouselPhotos {
  const s = seed(topic);
  return {
    cover:   pollUrl(`cinematic dark office night, entrepreneur at laptop, city through window, blue light, ultra realistic, no text`, s),
    content: pollUrl(`dark control room, glowing blue screens, data dashboards, neon lighting, ultra realistic, no text`, s + 1),
  };
}

// ── gpt-image-1 (low quality = $0.011/imagem) ────────────────────────────────

async function generatePhoto(openai: OpenAI, prompt: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (openai.images.generate as any)({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "low",
    output_format: "jpeg",
  });
  const b64 = response.data?.[0]?.b64_json ?? "";
  return b64 ? `data:image/jpeg;base64,${b64}` : "";
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generateCarouselPhotos(topic: string): Promise<CarouselPhotos> {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return pollinationsFallback(topic);

  try {
    const openai = new OpenAI({ apiKey });
    const [cover, content] = await Promise.all([
      generatePhoto(openai, COVER_PROMPT),
      generatePhoto(openai, CONTENT_PROMPT),
    ]);

    return {
      cover:   cover   || pollinationsFallback(topic).cover,
      content: content || pollinationsFallback(topic).content,
    };
  } catch (err) {
    console.error("[image-gen] OpenAI error, fallback Pollinations:", err);
    return pollinationsFallback(topic);
  }
}
