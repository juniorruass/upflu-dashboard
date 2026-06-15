import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { DynamicToaster } from "@/components/dynamic-toaster";
import { SWRegister } from "@/components/sw-register";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "UPFLU | Admin",
  description: "Painel de gestão UPFLU",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UPFLU",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={outfit.variable} suppressHydrationWarning>
      <body style={{ margin: 0, fontFamily: "var(--font-outfit), sans-serif" }}>
        <ThemeProvider>
          {children}
          <SWRegister />
          <DynamicToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
