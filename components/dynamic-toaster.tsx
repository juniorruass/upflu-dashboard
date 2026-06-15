"use client";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";

export function DynamicToaster() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const dark = resolvedTheme !== "light";
  return (
    <Toaster
      theme={dark ? "dark" : "light"}
      position="bottom-right"
      toastOptions={{
        style: {
          background: dark ? "#111111" : "#FFFFFF",
          border: `1px solid ${dark ? "var(--up-border)" : "rgba(0,0,0,0.09)"}`,
          color: dark ? "#F0EDE8" : "#1A1A1A",
          fontFamily: "var(--font-outfit), sans-serif",
        },
      }}
    />
  );
}
