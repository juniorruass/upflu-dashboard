"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConstellationCanvas from "@/components/constellation-canvas";

const ACCENT = "#00CFFF";
const BG = "#080808";
const CARD = "#111111";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#F0EDE8";
const MUTED = "#777068";

export function PortalLogin({ slug, clientName }: { slug: string; clientName: string }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/portal/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Senha incorreta");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "var(--font-outfit, sans-serif)", position: "relative", overflow: "hidden" }}>

      {/* Background */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", right: "0%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,207,255,0.12) 0%,transparent 70%)", filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "0%", left: "10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,207,255,0.07) 0%,transparent 70%)", filter: "blur(50px)" }} />
        <ConstellationCanvas />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "400px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/upflu-logo.png" alt="UPFLU" style={{ height: "28px", marginBottom: "20px" }} />
          <div style={{ width: "48px", height: "1px", background: `rgba(0,207,255,0.3)`, margin: "0 auto 20px" }} />
          <p style={{ fontSize: "12px", color: MUTED, margin: 0, letterSpacing: "0.06em" }}>
            Painel exclusivo de <strong style={{ color: TEXT }}>{clientName}</strong>
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "20px", padding: "36px 32px", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        >
          <p style={{ fontSize: "18px", fontWeight: "700", color: TEXT, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Acessar painel
          </p>
          <p style={{ fontSize: "13px", color: MUTED, margin: "0 0 28px" }}>
            Digite sua senha para continuar
          </p>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: "600", color: MUTED, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "8px" }}>
              Senha de acesso
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                style={{ width: "100%", background: BG, border: `1px solid ${error ? "#FF6B6B44" : BORDER}`, borderRadius: "10px", padding: "13px 44px 13px 16px", fontSize: "14px", color: TEXT, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color .2s" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(0,207,255,0.35)"; }}
                onBlur={(e) => { e.target.style.borderColor = error ? "#FF6B6B44" : BORDER; }}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: "12px", padding: 0 }}
              >
                {show ? "ocultar" : "ver"}
              </button>
            </div>
            {error && (
              <p style={{ fontSize: "12px", color: "#FF6B6B", margin: "8px 0 0", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>⚠</span> {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            style={{ width: "100%", background: loading || !password ? "rgba(0,207,255,0.3)" : ACCENT, border: "none", borderRadius: "10px", padding: "14px", fontSize: "13px", fontWeight: "700", color: loading || !password ? "rgba(0,207,255,0.6)" : "#080808", cursor: loading || !password ? "not-allowed" : "pointer", letterSpacing: "0.04em", transition: "all .2s" }}
          >
            {loading ? "Entrando..." : "Entrar no painel →"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "11px", color: MUTED, marginTop: "28px", opacity: 0.6 }}>
          upflu.digital · Crescimento Digital & IA
        </p>
      </div>
    </div>
  );
}
