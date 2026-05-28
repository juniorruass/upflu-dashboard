// Geração de imagens via Pollinations.ai — gratuito, sem chave, gera por tema

export interface CarouselPhotos {
  cover: string;   // capa + cta
  content: string; // slides internos
}

function topicSeed(topic: string): number {
  return Math.abs(topic.split("").reduce((n, c) => n + c.charCodeAt(0), 0));
}

function pollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1350&seed=${seed}&nologo=true&model=flux`;
}

export async function generateCarouselPhotos(topic: string): Promise<CarouselPhotos> {
  const seed = topicSeed(topic);

  const cover = pollinationsUrl(
    `dramatic cinematic aerial city at night, blue neon lights, skyscrapers, dark sky, atmospheric fog, ultra realistic photography, no people, no text`,
    seed
  );

  const content = pollinationsUrl(
    `dark futuristic control room, multiple blue glowing screens showing data dashboards, moody dramatic lighting, no people, no text, ultra realistic`,
    seed + 1
  );

  return { cover, content };
}
