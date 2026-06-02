import type { Metadata } from "next";
import { PortalSWRegister } from "@/components/portal/portal-sw-register";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: "UPFlu",
    description: "Seu painel de performance digital",
    manifest: `/api/portal/manifest/${slug}`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "UPFlu",
    },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/icon-192.png",
    },
  };
}

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PortalSWRegister />
    </>
  );
}
