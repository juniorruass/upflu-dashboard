"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

const ACCENT = "#00CFFF";

export default function PortalLoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/portal/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      window.location.href = "/portal/dashboard";
    } else {
      const d = await res.json();
      setError(d.error ?? "Erro ao entrar");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "var(--font-outfit, sans-serif)" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 10px" }}>Portal do Cliente</p>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#F0EDE8", margin: "0 0 8px", letterSpacing: "-0.03em" }}>UPFLU</h1>
          <p style={{ fontSize: "13px", color: "#777068", margin: 0 }}>Acesse seu painel de acompanhamento</p>
        </div>

        <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", padding: "32px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#9A9288", marginBottom: "7px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
                style={{ width: "100%", background: "#080808", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 14px", color: "#F0EDE8", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: "600", color: "#9A9288", marginBottom: "7px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Senha</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                style={{ width: "100%", background: "#080808", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px 14px", color: "#F0EDE8", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>

            {error && <p style={{ fontSize: "13px", color: "#FF6B6B", margin: 0 }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", background: ACCENT, border: "none", borderRadius: "8px", color: "#080808", fontSize: "14px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "inherit", opacity: loading ? 0.7 : 1, marginTop: "4px" }}>
              {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />Entrando...</> : "Entrar"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#555", marginTop: "24px" }}>
          UPFLU · IA & Automação
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
