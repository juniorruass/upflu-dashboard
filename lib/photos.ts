// Curated Unsplash photos for carousel backgrounds.
// All fit=crop&w=1080&h=1350 for perfect 4:5 Instagram portrait format.

export const PHOTOS = [
  // Entrepreneur / laptop at night
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1080&h=1350&fit=crop&q=85",
  // Business charts / analytics
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&h=1350&fit=crop&q=85",
  // Team meeting / collaboration
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1080&h=1350&fit=crop&q=85",
  // Person coding / working focused
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1080&h=1350&fit=crop&q=85",
  // Modern office / minimal desk
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&h=1350&fit=crop&q=85",
  // Professional portrait (arms crossed)
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1080&h=1350&fit=crop&q=85",
  // Startup / hustle vibes
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1080&h=1350&fit=crop&q=85",
  // Tech / AI concept
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&h=1350&fit=crop&q=85",
  // Restaurant / food business
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1080&h=1350&fit=crop&q=85",
  // Barbershop / personal care
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1080&h=1350&fit=crop&q=85",
];

export function pickPhoto(seed: number): string {
  return PHOTOS[Math.abs(seed) % PHOTOS.length];
}
