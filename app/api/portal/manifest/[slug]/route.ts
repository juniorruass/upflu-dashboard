import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { slug } = await params;

  const manifest = {
    name: "UPFlu",
    short_name: "UPFlu",
    description: "Seu painel de performance digital",
    start_url: `/${slug}`,
    scope: `/${slug}`,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#080808",
    theme_color: "#080808",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "no-cache",
    },
  });
}
