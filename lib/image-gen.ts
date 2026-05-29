// Geração de imagens via Pollinations.ai — gratuito, sem chave, preview funciona

export interface CarouselPhotos {
  cover: string;   // capa + cta
  content: string; // slides internos
}

function seed(s: string, offset = 0): number {
  return Math.abs(s.split("").reduce((n, c) => n + c.charCodeAt(0), 0)) + offset;
}

function url(prompt: string, s: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1350&seed=${s}&nologo=true&model=flux-pro&enhance=true`;
}

const COVER_PROMPTS = [
  `cinematic dark office at night, entrepreneur working on laptop, city skyline through glass window, blue glow from screens, dramatic shadows, ultra realistic photography, no text, no words`,
  `professional in dark suit standing in front of city skyline at night, blue neon reflections, cinematic portrait, ultra realistic, no text`,
  `person looking at glowing screens in dark room with city view, blue light, dramatic mood, ultra realistic photography, no text`,
];

const CONTENT_PROMPTS = [
  `dark futuristic control room with multiple glowing blue holographic screens showing business charts and data, dramatic blue neon lighting, cinematic, ultra realistic, no text`,
  `dark server room with rows of glowing blue neon tubes and cables, dramatic perspective, ultra realistic photography, no text`,
  `dark high-tech workspace with glowing blue screens showing analytics dashboards, dramatic lighting, cinematic, ultra realistic, no text`,
];

export async function generateCarouselPhotos(topic: string): Promise<CarouselPhotos> {
  const s = seed(topic);
  return {
    cover:   url(COVER_PROMPTS[s % COVER_PROMPTS.length],   s),
    content: url(CONTENT_PROMPTS[s % CONTENT_PROMPTS.length], s + 1),
  };
}
