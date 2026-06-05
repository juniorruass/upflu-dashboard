"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import { Plus, Trash2, RefreshCw, ShieldOff, X } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

type BlacklistEntry = { id: string; phone: string; reason: string | null; created_at: string };

export default function BlacklistPage() {
  const [list, setList] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/blacklist");
    const data = await res.json();
    setList(data.blacklist ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setAdding(true);
    const res = await fetch("/api/blacklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), reason: reason.trim() || null }),
    });
    if (res.ok) { setPhone(""); setReason(""); setShowForm(false); fetch_(); }
    setAdding(false);
  }

  async function remove(id: string) {
    await fetch(`/api/blacklist/${id}`, { method: "DELETE" });
    setList((prev) => prev.filter((e) => e.id !== id));
  }

  const inputStyle = {
    width: "100%", background: "#0d0d0d", border: `1px solid ${BORDER}`,
    borderRadius: "6px", padding: "10px 12px", fontSize: "13px", color: "#F0EDE8",
    outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <>
      <Header title="Blacklist" />

      <style>{`
        .bl-wrap { padding: 24px 32px 32px; flex: 1; }
        .bl-row { background: #0d0d0d; border: 1px solid ${BORDER}; border-radius: 8px; padding: 14px 18px; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        input:focus { border-color: ${ACCENT} !important; }
        @media (max-width: 768px) { .bl-wrap { padding: 16px; } }
      `}</style>

      <div className="bl-wrap">
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "11px", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 4px" }}>Prospecção</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#F0EDE8", margin: 0, letterSpacing: "-0.02em" }}>Blacklist</h2>
            <p style={{ fontSize: "13px", color: "#555", margin: "6px 0 0" }}>{list.length} número{list.length !== 1 ? "s" : ""} bloqueado{list.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={fetch_} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "8px 12px", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <RefreshCw size={13} /> Atualizar
            </button>
            <button onClick={() => setShowForm(true)} style={{ background: ACCENT, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", color: "#000", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
              <Plus size={14} /> Adicionar
            </button>
          </div>
        </div>

        {/* Form inline */}
        {showForm && (
          <form onSubmit={add} style={{ background: "#0d0d0d", border: `1px solid ${ACCENT}`, borderRadius: "10px", padding: "16px 20px", marginBottom: "16px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label style={{ fontSize: "11px", color: "#555", display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Telefone *</label>
              <input autoFocus value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5511999999999" required style={inputStyle} />
            </div>
            <div style={{ flex: "2 1 220px" }}>
              <label style={{ fontSize: "11px", color: "#555", display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Motivo</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: pediu para não contatar" style={inputStyle} />
            </div>
            <button type="submit" disabled={adding} style={{ background: ACCENT, border: "none", borderRadius: "6px", padding: "10px 18px", fontSize: "13px", fontWeight: "600", color: "#000", cursor: "pointer" }}>
              {adding ? "Adicionando..." : "Adicionar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "10px", cursor: "pointer", color: "#555" }}>
              <X size={14} />
            </button>
          </form>
        )}

        {loading ? (
          <div style={{ color: "#555", fontSize: "13px", padding: "20px 0" }}>Carregando...</div>
        ) : list.length === 0 ? (
          <div style={{ background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "40px", textAlign: "center" }}>
            <ShieldOff size={28} color="#333" style={{ marginBottom: "12px" }} />
            <p style={{ color: "#444", fontSize: "13px", margin: 0 }}>Nenhum número bloqueado</p>
          </div>
        ) : (
          list.map((entry) => (
            <div key={entry.id} className="bl-row">
              <ShieldOff size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8" }}>
                  {entry.phone.replace(/^55(\d{2})(\d{5})(\d{4})$/, "+55 ($1) $2-$3")}
                </div>
                {entry.reason && <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>{entry.reason}</div>}
              </div>
              <div style={{ fontSize: "11px", color: "#444", flexShrink: 0 }}>
                {new Date(entry.created_at).toLocaleDateString("pt-BR")}
              </div>
              <button onClick={() => remove(entry.id)} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#ef4444", flexShrink: 0 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
