import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "UPFLU | Admin",
  description: "Painel de gestão UPFLU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={outfit.variable}>
      <body style={{ margin: 0, background: "#080808", color: "#F0EDE8", fontFamily: "var(--font-outfit), sans-serif" }}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#111111",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "#F0EDE8",
              fontFamily: "var(--font-outfit), sans-serif",
            },
          }}
        />
      </body>
    </html>
  );
}
