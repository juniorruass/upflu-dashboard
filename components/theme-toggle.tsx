"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="nav-link-hover"
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 12px", borderRadius: "6px",
        background: "transparent", border: "none", cursor: "pointer",
        width: "100%",
      }}
    >
      {isDark
        ? <Sun size={16} strokeWidth={1.5} color="var(--up-text-muted)" />
        : <Moon size={16} strokeWidth={1.5} color="var(--up-text-muted)" />}
      <span style={{ fontSize: "13px", fontWeight: "400", color: "var(--up-text-muted)" }}>
        {isDark ? "Tema claro" : "Tema escuro"}
      </span>
    </button>
  );
}
