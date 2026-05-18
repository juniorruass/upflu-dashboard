"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const GOLD = "#BEA06A";
const GOLD_LIGHT = "#D0B688";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Credenciais inválidas.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "var(--font-outfit), sans-serif",
    }}>
      {/* Subtle radial glow */}
      <div style={{
        position: "fixed", inset: 0,
        background: `radial-gradient(ellipse 80% 50% at 50% -10%, rgba(190,160,106,0.07) 0%, transparent 60%)`,
        pointerEvents: "none",
      }} />

      {/* Subtle grid */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: "380px", position: "relative" }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "48px" }}>
          <img src="/upflu-logo.png" alt="UPFLU" style={{ height: "44px", width: "auto", objectFit: "contain" }} />
          <p style={{ fontSize: "11px", color: "#777068", marginTop: "14px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
            Acesso Restrito
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#111111",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "12px",
          padding: "40px",
        }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#F0EDE8", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Entrar
          </h2>
          <p style={{ fontSize: "13px", color: "#777068", margin: "0 0 32px", fontWeight: "300" }}>
            Credenciais de administrador
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#9A9288", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                onFocus={() => setFocusField("email")}
                onBlur={() => setFocusField(null)}
                style={{
                  width: "100%",
                  background: "#080808",
                  border: `1px solid ${focusField === "email" ? "rgba(190,160,106,0.5)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "8px",
                  padding: "13px 16px",
                  fontSize: "14px",
                  fontWeight: "300",
                  color: "#F0EDE8",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-outfit), sans-serif",
                  transition: "border-color 0.15s",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#9A9288", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                onFocus={() => setFocusField("password")}
                onBlur={() => setFocusField(null)}
                style={{
                  width: "100%",
                  background: "#080808",
                  border: `1px solid ${focusField === "password" ? "rgba(190,160,106,0.5)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: "8px",
                  padding: "13px 16px",
                  fontSize: "14px",
                  fontWeight: "300",
                  color: "#F0EDE8",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-outfit), sans-serif",
                  transition: "border-color 0.15s",
                }}
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                borderRadius: "8px",
                padding: "12px 16px",
                fontSize: "13px",
                color: "#EF4444",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "rgba(190,160,106,0.6)" : GOLD,
                border: "none",
                borderRadius: "8px",
                padding: "14px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#080808",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                letterSpacing: "0.04em",
                fontFamily: "var(--font-outfit), sans-serif",
                transition: "background 0.15s",
                marginTop: "4px",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "#777068", marginTop: "28px", letterSpacing: "0.06em" }}>
          UPFLU · {new Date().getFullYear()}
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
