"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import { RefreshCw, Trash2, Mail, Phone, Globe, MessageSquare, X } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  potencial:     { label: "Potencial",     color: "#FF9500", bg: "rgba(255,149,0,0.1)"  },
  novo:          { label: "Novo",          color: "#00CFFF", bg: "rgba(0,207,255,0.1)"  },
  contatado:     { label: "Contatado",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  respondeu:     { label: "Respondeu",     color: "#a064ff", bg: "rgba(160,100,255,0.1)"},
  fechado:       { label: "Fechado",       color: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
  sem_interesse: { label: "Sem interesse", color: "#666",    bg: "rgba(100,100,100,0.1)"},
};

const ALL_STATUS = ["todos", "potencial", "novo", "contatado", "respondeu", "fechado", "sem_interesse"];

type Prospect = {
  id: string;
  nome: string;
  tipo: string;
  cidade: string;
  telefone: string;
  website: string;
  email: string;
  mensagem: string;
  status: string;
  email_enviado: boolean;
  avaliacao: number;
  total_avaliacoes: number;
  created_at: string;
};

export default function CRMPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterCidade, setFilterCidade] = useState("todas");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const cidades = ["todas", ...Array.from(new Set(prospects.map((p) => p.cidade)))];

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus !== "todos") params.set("status", filterStatus);
    if (filterCidade !== "todas") params.set("cidade", filterCidade);
    if (filterTipo !== "todos") params.set("tipo", filterTipo);
    const res = await fetch(`/api/crm/prospects?${params}`);
    const data = await res.json();
    setProspects(data.prospects || []);
    setLoading(false);
  }, [filterStatus, filterCidade, filterTipo]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/crm/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setProspects((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : null);
    setUpdating(null);
  }

  async function deleteProspect(id: string) {
    if (!confirm("Remover esta clínica do CRM?")) return;
    await fetch(`/api/crm/prospects/${id}`, { method: "DELETE" });
    setProspects((prev) => prev.filter((p) => p.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const counts = Object.fromEntries(
    Object.keys(STATUS_CONFIG).map((s) => [s, prospects.filter((p) => p.status === s).length])
  );

  return (
    <>
      <Header title="CRM" />

      <style>{`
        .crm-pad { padding: 40px; }
        .crm-table { width: 100%; border-collapse: collapse; }
        .crm-table th { font-size: 10px; font-weight: 600; color: #555; letter-spacing: 0.12em; text-transform: uppercase; padding: 10px 16px; text-align: left; border-bottom: 1px solid ${BORDER}; white-space: nowrap; }
        .crm-table td { font-size: 13px; color: #ccc; padding: 12px 16px; border-bottom: 1px solid ${BORDER}; vertical-align: middle; }
        .crm-table tr:last-child td { border-bottom: none; }
        .crm-table tr:hover td { background: rgba(255,255,255,0.02); cursor: pointer; }
        .filter-btn { background: transparent; border: 1px solid ${BORDER}; border-radius: 6px; padding: 7px 14px; font-size: 12px; color: #888; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .filter-btn:hover { border-color: rgba(255,255,255,0.2); color: #fff; }
        .filter-btn.active { border-color: ${ACCENT}; color: ${ACCENT}; background: rgba(0,207,255,0.06); }
        .status-select { background: #1a1a1a; border: 1px solid ${BORDER}; border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #ccc; cursor: pointer; outline: none; }
        .detail-panel { position: fixed; top: 0; right: 0; width: 420px; height: 100vh; background: #111; border-left: 1px solid ${BORDER}; z-index: 100; display: flex; flex-direction: column; overflow: hidden; }
        @media (max-width: 900px) {
          .crm-pad { padding: 20px 16px; }
          .detail-panel { width: 100%; }
        }
      `}</style>

      <div className="crm-pad" style={{ flex: 1 }}>

        {/* Título */}
        <div style={{ marginBottom: "28px" }}>
          <p style={{ fontSize: "11px", fontWeight: "500", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Gestão de relacionamento
          </p>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#F0EDE8", margin: 0, letterSpacing: "-0.02em" }}>
            CRM de Prospecção
          </h2>
        </div>

        {/* Cards de status */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "14px 20px", minWidth: "120px" }}>
              <p style={{ fontSize: "10px", color: "#555", margin: "0 0 6px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{cfg.label}</p>
              <p style={{ fontSize: "28px", fontWeight: "700", color: cfg.color, margin: 0, lineHeight: 1, letterSpacing: "-0.03em" }}>{counts[key] || 0}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#555", marginRight: "4px" }}>STATUS</span>
          {ALL_STATUS.map((s) => (
            <button key={s} className={`filter-btn${filterStatus === s ? " active" : ""}`} onClick={() => setFilterStatus(s)}>
              {s === "todos" ? "Todos" : STATUS_CONFIG[s]?.label}
            </button>
          ))}

          <div style={{ width: "1px", height: "20px", background: BORDER, margin: "0 8px" }} />

          <select className="status-select" value={filterCidade} onChange={(e) => setFilterCidade(e.target.value)}>
            {cidades.map((c) => <option key={c} value={c}>{c === "todas" ? "Todas as cidades" : c}</option>)}
          </select>

          <select className="status-select" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            <option value="todos">Todos os tipos</option>
            <option value="clínica estética">Estética</option>
            <option value="clínica odontológica">Odonto</option>
          </select>

          <button onClick={fetchProspects} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "7px 12px", color: "#666", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>

        {/* Tabela */}
        <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#555", fontSize: "13px" }}>Carregando...</div>
          ) : prospects.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#555", fontSize: "13px" }}>
              Nenhuma clínica encontrada. Vá em Prospecção para buscar novas.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Clínica</th>
                    <th>Cidade</th>
                    <th>Tipo</th>
                    <th>Contato</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((p) => {
                    const cfg = STATUS_CONFIG[p.status];
                    return (
                      <tr key={p.id} onClick={() => setSelected(p)}>
                        <td>
                          <div style={{ fontWeight: "500", color: "#F0EDE8" }}>{p.nome}</div>
                          {p.avaliacao && <div style={{ fontSize: "11px", color: "#555" }}>★ {p.avaliacao} ({p.total_avaliacoes})</div>}
                        </td>
                        <td style={{ whiteSpace: "nowrap", color: "#888" }}>{p.cidade}</td>
                        <td>
                          <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.06em", background: p.tipo.includes("estética") ? "rgba(0,207,255,0.1)" : "rgba(160,100,255,0.1)", color: p.tipo.includes("estética") ? ACCENT : "#a064ff", border: `1px solid ${p.tipo.includes("estética") ? "rgba(0,207,255,0.2)" : "rgba(160,100,255,0.2)"}` }}>
                            {p.tipo.includes("estética") ? "Estética" : "Odonto"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {p.telefone && <Phone size={13} color="#555" />}
                            {p.email && <Mail size={13} color="#555" />}
                            {p.website && <Globe size={13} color="#555" />}
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg?.color, flexShrink: 0 }} />
                            <select
                              className="status-select"
                              value={p.status}
                              disabled={updating === p.id}
                              onChange={(e) => updateStatus(p.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => deleteProspect(p.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#444", padding: "4px", borderRadius: "4px" }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Painel de detalhes */}
      {selected && (
        <div className="detail-panel">
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "11px", color: "#555", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Detalhes</p>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#F0EDE8", margin: 0 }}>{selected.nome}</h3>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555", padding: "4px" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

            {/* Status */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", color: "#555", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</p>
              <select className="status-select" value={selected.status} style={{ width: "100%", padding: "10px 12px" }}
                onChange={(e) => updateStatus(selected.id, e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Info */}
            {[
              { icon: Phone, label: "Telefone", value: selected.telefone },
              { icon: Mail, label: "Email", value: selected.email },
              { icon: Globe, label: "Website", value: selected.website },
            ].map(({ icon: Icon, label, value }) => value ? (
              <div key={label} style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "11px", color: "#555", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon size={13} color="#555" />
                  <span style={{ fontSize: "13px", color: "#ccc" }}>{value}</span>
                </div>
              </div>
            ) : null)}

            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", color: "#555", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Cidade / Tipo</p>
              <p style={{ fontSize: "13px", color: "#ccc", margin: 0 }}>{selected.cidade} · {selected.tipo}</p>
            </div>

            {/* Mensagem */}
            <div style={{ marginTop: "24px" }}>
              <p style={{ fontSize: "11px", color: "#555", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "6px" }}>
                <MessageSquare size={12} /> Mensagem gerada
              </p>
              <div style={{ background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "14px", fontSize: "13px", color: "#aaa", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {selected.mensagem}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(selected.mensagem)}
                style={{ marginTop: "8px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", color: "#666", cursor: "pointer", width: "100%" }}
              >
                Copiar mensagem
              </button>
            </div>

            <div style={{ marginTop: "20px", padding: "12px", background: "#0d0d0d", borderRadius: "8px", border: `1px solid ${BORDER}` }}>
              <p style={{ fontSize: "11px", color: "#555", margin: "0 0 2px" }}>Adicionado em</p>
              <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                {new Date(selected.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
