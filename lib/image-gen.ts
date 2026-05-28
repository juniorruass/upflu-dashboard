import OpenAI from "openai";

export interface CarouselPhotos {
  cover: string;   // capa + cta
  content: string; // slides internos
}

// Gera 2 fotos via DALL-E 3 para o carrossel
export async function generateCarouselPhotos(topic: string): Promise<CarouselPhotos> {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) return { cover: "", content: "" };

  const openai = new OpenAI({ apiKey });

  try {
    const [cover, content] = await Promise.all([
      generatePhoto(openai,
        `Dramatic cinematic dark background photo for an Instagram post about "${topic}". Very dark scene, deep blue atmospheric glow, dramatic professional lighting, moody ambiance, hyper-realistic. Absolutely NO text, NO typography, NO words, NO logos anywhere in the image.`
      ),
      generatePhoto(openai,
        `Dark professional tech environment photo related to "${topic}". Dark moody workspace or city, blue neon data screens, dramatic shadows, high-tech atmosphere, hyper-realistic photography. Absolutely NO text, NO words, NO logos.`
      ),
    ]);
    return { cover, content };
  } catch (err) {
    console.error("[image-gen] Failed to generate photos:", err);
    return { cover: "", content: "" };
  }
}

async function generatePhoto(openai: OpenAI, prompt: string): Promise<string> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1792",
    quality: "standard",
    response_format: "url",
  });
  return response.data?.[0]?.url ?? "";
}
