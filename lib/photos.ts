// Curated Unsplash tech photos for carousel backgrounds.
// All fit=crop&w=1080&h=1350 for 4:5 Instagram portrait format.

export const PHOTOS = [
  // Circuit board macro — gold/green tones
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&h=1350&fit=crop&q=85",
  // Binary / matrix code on screen
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1080&h=1350&fit=crop&q=85",
  // AI robot / holographic concept
  "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1080&h=1350&fit=crop&q=85",
  // Code on MacBook screen — dark setup
  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1080&h=1350&fit=crop&q=85",
  // Server room — blue neon lights
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1080&h=1350&fit=crop&q=85",
  // Futuristic tech — glowing interface
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1080&h=1350&fit=crop&q=85",
  // Person typing on laptop — dark moody
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1080&h=1350&fit=crop&q=85",
  // Tech / AI earth from space
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1080&h=1350&fit=crop&q=85",
  // Dark tech workspace / multiple screens
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&h=1350&fit=crop&q=85",
  // Glowing keyboard / dark neon
  "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=1080&h=1350&fit=crop&q=85",
];

export function pickPhoto(seed: number): string {
  return PHOTOS[Math.abs(seed) % PHOTOS.length];
}
