// Geração de imagens via Pollinations.ai — gratuito, sem chave

export interface CarouselPhotos {
  cover: string;
  slide2: string;
  slide3: string;
  cta: string;
}

function seed(s: string, offset = 0): number {
  return Math.abs(s.split("").reduce((n, c) => n + c.charCodeAt(0), 0)) + offset;
}

function url(prompt: string, s: number): string {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1350&seed=${s}&nologo=true&model=flux-pro&enhance=true`;
}

const COVER_PROMPTS = [
  `cinematic dark office at night, young entrepreneur working on laptop, city skyline through glass window, blue screen glow on face, ultra realistic 8k photography, dramatic shadows, no text`,
  `dark futuristic businessman standing in front of city skyline at night, blue neon reflections, moody atmosphere, professional portrait, ultra realistic photography, no text`,
  `person looking at multiple glowing screens in dark room, data visualizations, blue light illumination, cinematic photography, dramatic, no text`,
];

const CONTENT_PROMPTS = [
  `dark futuristic server room with glowing blue neon tubes, rows of servers, dramatic blue light, ultra realistic photography, no text`,
  `dark control room with multiple glowing blue holographic screens showing data dashboards, cinematic lighting, sci-fi atmosphere, no text`,
  `glowing blue holographic data visualization floating in dark space, abstract digital concept, dramatic lighting, no text`,
  `dark high-tech workspace with glowing screens showing analytics and charts, blue neon desk, cinematic, no text`,
];

const CTA_PROMPTS = [
  `rocket launching from dark city at night with dramatic blue light explosion, ultra realistic photography, cinematic, no text`,
  `earth from space with blue city lights visible, dramatic atmosphere, ultra realistic satellite photography, no text`,
  `dark cityscape at night with blue neon lights from above, aerial dramatic shot, ultra realistic, no text`,
];

export async function generateCarouselPhotos(topic: string): Promise<CarouselPhotos> {
  const s = seed(topic);
  const ci = s % COVER_PROMPTS.length;
  const s2i = (s + 1) % CONTENT_PROMPTS.length;
  const s3i = (s + 2) % CONTENT_PROMPTS.length;
  const ctai = s % CTA_PROMPTS.length;

  return {
    cover:  url(COVER_PROMPTS[ci],   s),
    slide2: url(CONTENT_PROMPTS[s2i], s + 1),
    slide3: url(CONTENT_PROMPTS[s3i], s + 2),
    cta:    url(CTA_PROMPTS[ctai],    s + 3),
  };
}
