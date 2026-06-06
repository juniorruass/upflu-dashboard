"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import { RefreshCw, X, Trash2 } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

type Ticket = {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  clients?: { id: string; name: string } | null;
};

const STATUS = {
  open:        { label: "Aberto",       color: "#FF9500" },
  in_progress: { label: "Em andamento", color: "#00CFFF" },
  resolved:    { label: "Resolvido",    color: "#22c55e" },
  closed:      { label: "Fechado",      color: "#555"    },
};

const PRIORITY = {
  low:    { label: "Baixa",   color: "#555"    },
  medium: { label: "Média",   color: "#FF9500" },
  high:   { label: "Alta",    color: "#ef4444" },
  urgent: { label: "Urgente", color: "#ff0000" },
};

export default function SuportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/suporte");
    const data = await res.json();
    setTickets(data.tickets ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function updateTicket(id: string, patch: Record<string, string>) {
    const res = await fetch(`/api/suporte/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setTickets((prev) => prev.map((t) => t.id === id ? data.ticket : t));
    if (selected?.id === id) setSelected(data.ticket);
  }

  async function deleteTicket(id: string) {
    await fetch(`/api/suporte/${id}`, { method: "DELETE" });
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const filtered = filterStatus === "all" ? tickets : tickets.filter((t) => t.status === filterStatus);

  const counts = Object.keys(STATUS).reduce((acc, k) => {
    acc[k] = tickets.filter((t) => t.status === k).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <Header title="Suporte" />
      <style>{`
        .sup-wrap { padding: 24px 32px 32px; flex: 1; display: flex; gap: 24px; overflow: hidden; }
        .sup-list { flex: 1; overflow-y: auto; }
        .ticket-card { background: #0d0d0d; border: 1px solid ${BORDER}; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; }
        .ticket-card:hover, .ticket-card.active { border-color: rgba(255,255,255,0.18); }
        .ticket-card.active { border-color: ${ACCENT}; }
        .detail { width: 360px; flex-shrink: 0; background: #0d0d0d; border: 1px solid ${BORDER}; border-radius: 10px; padding: 20px; overflow-y: auto; height: fit-content; max-height: calc(100vh - 120px); }
        textarea:focus, select:focus { outline: none; border-color: ${ACCENT} !important; }
        @media (max-width: 1024px) { .detail { display: none; } }
        @media (max-width: 768px) { .sup-wrap { padding: 16px; flex-direction: column; } }
      `}</style>

      <div style={{ padding: "24px 32px 0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p style={{ fontSize: "11px", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 4px" }}>Clientes</p>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#F0EDE8", margin: 0 }}>Suporte</h2>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {(["all", ...Object.keys(STATUS)]).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              background: filterStatus === s ? "rgba(0,207,255,0.08)" : "transparent",
              border: `1px solid ${filterStatus === s ? ACCENT : BORDER}`,
              borderRadius: "6px", padding: "6px 12px", cursor: "pointer",
              fontSize: "12px", color: filterStatus === s ? ACCENT : "#555",
            }}>
              {s === "all" ? "Todos" : STATUS[s as keyof typeof STATUS]?.label ?? s}
              {s !== "all" && (counts[s] ?? 0) > 0 && <span style={{ marginLeft: "5px", background: "#222", padding: "1px 5px", borderRadius: "4px" }}>{counts[s]}</span>}
            </button>
          ))}
          <button onClick={fetch_} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "6px 10px", cursor: "pointer", color: "#555", display: "flex", alignItems: "center" }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="sup-wrap">
        <div className="sup-list">
          {loading ? (
            <div style={{ color: "#555", fontSize: "13px" }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "32px", textAlign: "center", color: "#444", fontSize: "13px" }}>
              Nenhum ticket encontrado
            </div>
          ) : filtered.map((t) => {
            const st = STATUS[t.status as keyof typeof STATUS];
            const pr = PRIORITY[t.priority as keyof typeof PRIORITY];
            return (
              <div key={t.id} className={`ticket-card${selected?.id === t.id ? " active" : ""}`} onClick={() => { setSelected(t); setAdminNotes(t.admin_notes ?? ""); }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8", marginBottom: "4px" }}>{t.title}</div>
                    {t.clients && <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>{t.clients.name}</div>}
                    {t.description && <div style={{ fontSize: "12px", color: "#555", lineHeight: 1.4 }}>{t.description.slice(0, 100)}{t.description.length > 100 ? "..." : ""}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                    <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "4px", background: `${st.color}18`, color: st.color }}>{st.label}</span>
                    <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "4px", background: `${pr.color}18`, color: pr.color }}>{pr.label}</span>
                  </div>
                </div>
                <div style={{ fontSize: "11px", color: "#444", marginTop: "6px" }}>
                  {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })}
        </div>

        {selected && (
          <div className="detail">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#F0EDE8", margin: 0 }}>{selected.title}</h3>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555" }}><X size={16} /></button>
            </div>

            {selected.clients && <div style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>Cliente: {selected.clients.name}</div>}
            {selected.description && <p style={{ fontSize: "13px", color: "#888", marginBottom: "16px", lineHeight: 1.5 }}>{selected.description}</p>}

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "5px" }}>Status</label>
              <select value={selected.status} onChange={(e) => updateTicket(selected.id, { status: e.target.value })}
                style={{ width: "100%", background: "#161616", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "8px 10px", fontSize: "13px", color: "#F0EDE8" }}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "5px" }}>Prioridade</label>
              <select value={selected.priority} onChange={(e) => updateTicket(selected.id, { priority: e.target.value })}
                style={{ width: "100%", background: "#161616", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "8px 10px", fontSize: "13px", color: "#F0EDE8" }}>
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "5px" }}>Notas internas</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} placeholder="Anotações visíveis só para você..."
                style={{ width: "100%", background: "#161616", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "9px", fontSize: "12px", color: "#ccc", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }} />
              <button onClick={() => updateTicket(selected.id, { admin_notes: adminNotes })}
                style={{ marginTop: "6px", width: "100%", background: ACCENT, border: "none", borderRadius: "6px", padding: "8px", fontSize: "12px", fontWeight: "600", color: "#000", cursor: "pointer" }}>
                Salvar
              </button>
            </div>

            <button onClick={() => deleteTicket(selected.id)}
              style={{ width: "100%", background: "transparent", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "8px", fontSize: "12px", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <Trash2 size={13} /> Excluir ticket
            </button>
          </div>
        )}
      </div>
    </>
  );
}
