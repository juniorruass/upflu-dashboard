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
    `dramatic cinematic dark photo, ${topic}, deep blue atmospheric light, dark moody professional, hyper-realistic, no text, no words, no logos`,
    seed
  );

  const content = pollinationsUrl(
    `dark professional tech environment, ${topic}, dark moody workspace, blue neon screens, dramatic shadows, hyper-realistic, no text, no words, no logos`,
    seed + 1
  );

  return { cover, content };
}
