"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/header";
import { RefreshCw, Trash2, Mail, Phone, Globe, MessageSquare, X, Search, MessageCircle, Calendar, FileText } from "lucide-react";

const ACCENT = "#00CFFF";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  potencial:     { label: "Potencial",     color: "#FF9500" },
  novo:          { label: "Novo",          color: "#00CFFF" },
  contatado:     { label: "Contatado",     color: "#f59e0b" },
  followup:      { label: "Follow-up",     color: "#a78bfa" },
  respondeu:     { label: "Respondeu",     color: "#4ADE80" },
  fechado:       { label: "Fechado",       color: "#22c55e" },
  sem_interesse: { label: "Sem interesse", color: "var(--up-text-dim)"    },
};

const ALL_STATUS = ["todos", "novo", "contatado", "followup", "respondeu", "fechado", "sem_interesse", "potencial"];

const TIPO_OPTIONS = [
  { value: "todos",                label: "Todos os tipos"  },
  { value: "clínica estética",     label: "Estética"        },
  { value: "clínica odontológica", label: "Odonto"          },
  { value: "psicólogo",            label: "Psicólogo"       },
  { value: "psiquiatra",           label: "Psiquiatra"      },
  { value: "fisioterapeuta",       label: "Fisioterapia"    },
  { value: "nutricionista",        label: "Nutrição"        },
];

function tipoLabel(tipo: string) {
  const found = TIPO_OPTIONS.find((o) => o.value === tipo);
  if (found && found.value !== "todos") return found.label;
  if (tipo.includes("estética"))  return "Estética";
  if (tipo.includes("odontológ")) return "Odonto";
  if (tipo.includes("psicólog") || tipo.includes("psiquiat")) return "Psic";
  if (tipo.includes("fisioter"))  return "Fisio";
  if (tipo.includes("nutri"))     return "Nutrição";
  return tipo;
}

function tipoBadgeStyle(tipo: string) {
  if (tipo.includes("estética"))  return { bg: "rgba(0,207,255,0.1)",   color: ACCENT,    bd: "rgba(0,207,255,0.2)"   };
  if (tipo.includes("odontológ")) return { bg: "rgba(160,100,255,0.1)", color: "#a064ff", bd: "rgba(160,100,255,0.2)" };
  if (tipo.includes("psicólog") || tipo.includes("psiquiat")) return { bg: "rgba(255,183,77,0.1)", color: "#FFB74D", bd: "rgba(255,183,77,0.2)" };
  if (tipo.includes("fisioter")) return { bg: "rgba(76,175,80,0.1)",    color: "#4CAF50", bd: "rgba(76,175,80,0.2)"  };
  if (tipo.includes("nutri"))    return { bg: "rgba(255,138,101,0.1)",  color: "#FF8A65", bd: "rgba(255,138,101,0.2)" };
  return { bg: "rgba(255,255,255,0.05)", color: "var(--up-text-muted)", bd: "rgba(255,255,255,0.1)" };
}

const SAUDACOES_MSG = ["Oii", "Olá", "Opa,"];
const E1 = String.fromCodePoint(0x1F44B);
const E2 = String.fromCodePoint(0x1F440);

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateProspectMsg(): string {
  const saudacao = pickRandom(SAUDACOES_MSG);
  return `${saudacao} Tudo bem? ${E1}\n\nPercebi algo na sua clínica que pode estar afastando pacientes sem que você perceba.\n\nPosso te contar o que é? ${E2}\n\n*OBS: Não é sobre o marketing!*`;
}

function waLink(phone: string, msg: string) {
  const num = phone.replace(/\D/g, "");
  const intl = num.startsWith("55") ? num : `55${num}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`;
}

function isOverdue(date: string | null) {
  if (!date) return false;
  const today = new Date().toISOString().split("T")[0];
  return date < today;
}

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
  cnae: string | null;
  cnae_descricao: string | null;
  cnpj: string | null;
  situacao_cadastral: string | null;
  proximo_contato: string | null;
  anotacoes: string | null;
  contatado_em: string | null;
};

function CRMPageInner() {
  const searchParams = useSearchParams();
  const [aba, setAba] = useState<"todos" | "cnae">(
    searchParams.get("aba") === "cnae" ? "cnae" : "todos"
  );
  const [prospects, setProspects]       = useState<Prospect[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterCidade, setFilterCidade] = useState("todas");
  const [filterTipo, setFilterTipo]     = useState("todos");
  const [busca, setBusca]               = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [selected, setSelected]         = useState<Prospect | null>(null);
  const [updating, setUpdating]         = useState<string | null>(null);
  const [noteDraft, setNoteDraft]       = useState("");
  const [savingNote, setSavingNote]     = useState(false);
  const [generatedMsg, setGeneratedMsg] = useState("");

  const cidades = ["todas", ...Array.from(new Set(prospects.map((p) => p.cidade).filter(Boolean)))];

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 350);
    return () => clearTimeout(t);
  }, [busca]);

  const fetchProspects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "todos") params.set("status", filterStatus);
      if (filterCidade !== "todas") params.set("cidade", filterCidade);
      if (filterTipo !== "todos")   params.set("tipo", filterTipo);
      if (buscaDebounced)           params.set("busca", buscaDebounced);
      if (aba === "cnae")           params.set("fonte", "cnae");
      const res = await fetch(`/api/crm/prospects?${params}`);
      const data = await res.json();
      setProspects(data.prospects || []);
    } catch { setProspects([]); }
    setLoading(false);
  }, [filterStatus, filterCidade, filterTipo, buscaDebounced, aba]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  useEffect(() => {
    setNoteDraft(selected?.anotacoes || "");
    if (selected) setGeneratedMsg(generateProspectMsg());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  async function patchProspect(id: string, patch: Partial<Prospect>) {
    await fetch(`/api/crm/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setProspects((prev) => prev.map((p) => p.id === id ? { ...p, ...patch } : p));
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...patch } : null);
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const patch: Partial<Prospect> = { status };
    if (status === "contatado" || status === "followup" || status === "respondeu") {
      const current = prospects.find((p) => p.id === id);
      if (!current?.contatado_em) patch.contatado_em = new Date().toISOString();
    }
    await patchProspect(id, patch);
    setUpdating(null);
    if (status === "contatado") {
      const prospect = prospects.find((p) => p.id === id);
      if (prospect) setSelected({ ...prospect, ...patch });
    }
  }

  async function saveNote() {
    if (!selected) return;
    setSavingNote(true);
    await patchProspect(selected.id, { anotacoes: noteDraft });
    setSavingNote(false);
  }

  async function deleteProspect(id: string) {
    if (!confirm("Remover este prospect do CRM?")) return;
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
        .crm-table th { font-size: 10px; font-weight: 600; color: #555; letter-spacing: 0.12em; text-transform: uppercase; padding: 10px 16px; text-align: left; border-bottom: 1px solid var(--up-border); white-space: nowrap; }
        .crm-table td { font-size: 13px; color: #ccc; padding: 12px 16px; border-bottom: 1px solid var(--up-border); vertical-align: middle; }
        .crm-table tr:last-child td { border-bottom: none; }
        .crm-table tr:hover td { background: rgba(255,255,255,0.02); cursor: pointer; }
        .filter-btn { background: transparent; border: 1px solid var(--up-border); border-radius: 6px; padding: 7px 14px; font-size: 12px; color: #888; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
        .filter-btn:hover { border-color: rgba(255,255,255,0.2); color: #fff; }
        .filter-btn.active { border-color: ${ACCENT}; color: ${ACCENT}; background: rgba(0,207,255,0.06); }
        .crm-select { background: var(--up-card); border: 1px solid var(--up-border); border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #ccc; cursor: pointer; outline: none; }
        .detail-panel { position: fixed; top: 0; right: 0; width: 440px; height: 100vh; background: var(--up-card); border-left: 1px solid var(--up-border); z-index: 100; display: flex; flex-direction: column; overflow: hidden; }
        .search-wrap { position: relative; }
        .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        .search-input { background: var(--up-card); border: 1px solid var(--up-border); border-radius: 6px; padding: 7px 12px 7px 34px; font-size: 12px; color: #ccc; outline: none; width: 220px; transition: border-color 0.15s; }
        .search-input:focus { border-color: rgba(0,207,255,0.4); }
        .search-input::placeholder { color: #444; }
        .note-textarea { background: var(--up-bg); border: 1px solid var(--up-border); border-radius: 8px; padding: 12px; font-size: 13px; color: #aaa; line-height: 1.6; resize: vertical; width: 100%; min-height: 90px; outline: none; font-family: inherit; transition: border-color 0.15s; box-sizing: border-box; }
        .note-textarea:focus { border-color: rgba(0,207,255,0.3); }
        .date-input { background: var(--up-bg); border: 1px solid var(--up-border); border-radius: 6px; padding: 8px 10px; font-size: 12px; color: #ccc; outline: none; width: 100%; box-sizing: border-box; color-scheme: dark; }
        .date-input:focus { border-color: rgba(0,207,255,0.3); }
        .detail-label { font-size: 11px; color: #555; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.1em; display: flex; align-items: center; gap: 5px; }
        @media (max-width: 900px) {
          .crm-pad { padding: 20px 16px; }
          .detail-panel { width: 100%; }
          .search-input { width: 160px; }
        }
      `}</style>

      <div className="crm-pad" style={{ flex: 1 }}>

        {/* Título */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "11px", fontWeight: "500", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 8px" }}>
            Gestão de relacionamento
          </p>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "var(--up-text)", margin: 0, letterSpacing: "-0.02em" }}>
            CRM de Prospecção
          </h2>
        </div>

        {/* Abas */}
        <div style={{ display: "flex", borderBottom: `1px solid var(--up-border)`, marginBottom: "24px" }}>
          <button
            onClick={() => { setAba("todos"); setSelected(null); }}
            style={{ background: "transparent", border: "none", borderBottom: `2px solid ${aba === "todos" ? ACCENT : "transparent"}`, padding: "8px 18px", fontSize: "13px", color: aba === "todos" ? ACCENT : "#666", cursor: "pointer", fontWeight: aba === "todos" ? "600" : "400", transition: "all 0.15s" }}
          >
            Google Maps
          </button>
          <button
            onClick={() => { setAba("cnae"); setSelected(null); }}
            style={{ background: "transparent", border: "none", borderBottom: `2px solid ${aba === "cnae" ? ACCENT : "transparent"}`, padding: "8px 18px", fontSize: "13px", color: aba === "cnae" ? ACCENT : "#666", cursor: "pointer", fontWeight: aba === "cnae" ? "600" : "400", transition: "all 0.15s" }}
          >
            Por CNAE
          </button>
        </div>

        {/* Cards de status */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "8px", padding: "14px 20px", minWidth: "110px" }}>
              <p style={{ fontSize: "10px", color: "var(--up-text-dim)", margin: "0 0 6px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{cfg.label}</p>
              <p style={{ fontSize: "28px", fontWeight: "700", color: cfg.color, margin: 0, lineHeight: 1, letterSpacing: "-0.03em" }}>{counts[key] || 0}</p>
            </div>
          ))}
        </div>

        {/* Filtros — linha 1: busca + cidade + tipo + refresh */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-wrap">
            <span className="search-icon"><Search size={13} color="#444" /></span>
            <input
              className="search-input"
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div style={{ width: "1px", height: "20px", background: "var(--up-border)", margin: "0 4px" }} />

          <select className="crm-select" value={filterCidade} onChange={(e) => setFilterCidade(e.target.value)}>
            {cidades.map((c) => <option key={c} value={c}>{c === "todas" ? "Todas as cidades" : c}</option>)}
          </select>

          <select className="crm-select" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
            {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button onClick={fetchProspects} style={{ marginLeft: "auto", background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "6px", padding: "7px 12px", color: "var(--up-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>

        {/* Filtros — linha 2: status */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "var(--up-text-dim)", marginRight: "4px" }}>STATUS</span>
          {ALL_STATUS.map((s) => (
            <button key={s} className={`filter-btn${filterStatus === s ? " active" : ""}`} onClick={() => setFilterStatus(s)}>
              {s === "todos" ? "Todos" : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--up-text-dim)", fontSize: "13px" }}>Carregando...</div>
          ) : prospects.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "var(--up-text-dim)", fontSize: "13px" }}>
              Nenhum prospect encontrado. {!busca && "Vá em Prospecção para buscar novos."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    {aba === "cnae" && <th>CNPJ</th>}
                    <th>Cidade</th>
                    <th>Tipo</th>
                    <th>Contato</th>
                    <th>Follow-up</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((p) => {
                    const cfg   = STATUS_CONFIG[p.status];
                    const badge = tipoBadgeStyle(p.tipo);
                    const overdue = isOverdue(p.proximo_contato);
                    return (
                      <tr key={p.id} onClick={() => setSelected(p)}>
                        <td>
                          <div style={{ fontWeight: "500", color: "var(--up-text)" }}>{p.nome}</div>
                          <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
                            {p.avaliacao ? <span style={{ fontSize: "11px", color: "var(--up-text-dim)" }}>★ {p.avaliacao} ({p.total_avaliacoes})</span> : null}
                            {p.anotacoes ? <span style={{ fontSize: "11px", color: "var(--up-text-dim)" }}>· nota</span> : null}
                          </div>
                        </td>
                        {aba === "cnae" && (
                          <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--up-text-dim)", whiteSpace: "nowrap" }}>
                            {p.cnpj ? p.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : "—"}
                          </td>
                        )}
                        <td style={{ whiteSpace: "nowrap", color: "var(--up-text-muted)" }}>{p.cidade}</td>
                        <td>
                          <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.06em", background: badge.bg, color: badge.color, border: `1px solid ${badge.bd}` }}>
                            {tipoLabel(p.tipo)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {p.telefone && <Phone size={13} color="#555" />}
                            {p.email    && <Mail  size={13} color="#555" />}
                            {p.website  && <Globe size={13} color="#555" />}
                          </div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {p.proximo_contato ? (
                            <span style={{ fontSize: "12px", color: overdue ? "#ef4444" : "#888", fontWeight: overdue ? "600" : "400" }}>
                              {overdue && "⚠ "}
                              {new Date(p.proximo_contato + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </span>
                          ) : <span style={{ color: "#333" }}>—</span>}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg?.color, flexShrink: 0 }} />
                            <div>
                              <select
                                className="crm-select"
                                value={p.status}
                                disabled={updating === p.id}
                                onChange={(e) => updateStatus(p.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                  <option key={k} value={k}>{v.label}</option>
                                ))}
                              </select>
                              {p.contatado_em && (
                                <div style={{ fontSize: "10px", color: "#555", marginTop: "3px", paddingLeft: "2px" }}>
                                  {new Date(p.contatado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" })}
                                </div>
                              )}
                            </div>
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
          <div style={{ padding: "20px 24px", borderBottom: `1px solid var(--up-border)`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "11px", color: "var(--up-text-dim)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Detalhes</p>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--up-text)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selected.nome}</h3>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--up-text-dim)", padding: "4px", flexShrink: 0 }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

            {/* Status */}
            <div style={{ marginBottom: "20px" }}>
              <p className="detail-label">Status</p>
              <select className="crm-select" value={selected.status} style={{ width: "100%", padding: "10px 12px" }}
                onChange={(e) => updateStatus(selected.id, e.target.value)}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            {/* Follow-up */}
            <div style={{ marginBottom: "20px" }}>
              <p className="detail-label"><Calendar size={11} /> Próximo contato</p>
              <input
                type="date"
                className="date-input"
                value={selected.proximo_contato || ""}
                onChange={(e) => patchProspect(selected.id, { proximo_contato: e.target.value || null })}
              />
            </div>

            {/* Contatos */}
            {selected.telefone && (
              <div style={{ marginBottom: "14px" }}>
                <p className="detail-label"><Phone size={11} /> Telefone</p>
                <span style={{ fontSize: "13px", color: "#ccc" }}>{selected.telefone}</span>
              </div>
            )}
            {selected.email && (
              <div style={{ marginBottom: "14px" }}>
                <p className="detail-label"><Mail size={11} /> Email</p>
                <span style={{ fontSize: "13px", color: "#ccc" }}>{selected.email}</span>
              </div>
            )}
            {selected.website && (
              <div style={{ marginBottom: "14px" }}>
                <p className="detail-label"><Globe size={11} /> Website</p>
                <a href={selected.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: ACCENT, textDecoration: "none" }}>
                  {selected.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}

            <div style={{ marginBottom: "20px" }}>
              <p className="detail-label">Cidade / Tipo</p>
              <p style={{ fontSize: "13px", color: "#ccc", margin: 0 }}>{selected.cidade} · {tipoLabel(selected.tipo)}</p>
            </div>

            {/* CNAE — só aparece quando preenchido (fase 2) */}
            {selected.cnae && (
              <div style={{ marginBottom: "20px", padding: "12px", background: "var(--up-bg)", borderRadius: "8px", border: `1px solid var(--up-border)` }}>
                <p className="detail-label">CNAE</p>
                <p style={{ fontSize: "13px", color: "#ccc", margin: 0, fontFamily: "monospace" }}>{selected.cnae}</p>
                {selected.cnae_descricao && <p style={{ fontSize: "12px", color: "var(--up-text-dim)", margin: "4px 0 0" }}>{selected.cnae_descricao}</p>}
              </div>
            )}

            {/* WhatsApp */}
            {selected.telefone && (
              <div style={{ marginBottom: "20px" }}>
                <a
                  href={waLink(selected.telefone, generatedMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: "8px", padding: "10px 14px", color: "#25D366", fontSize: "13px", fontWeight: "500", textDecoration: "none" }}
                >
                  <MessageCircle size={15} /> Abrir no WhatsApp
                </a>
              </div>
            )}

            {/* Mensagem gerada */}
            <div style={{ marginBottom: "20px" }}>
              <p className="detail-label"><MessageSquare size={11} /> Mensagem gerada</p>
              <div style={{ background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "8px", padding: "14px", fontSize: "13px", color: "#aaa", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {generatedMsg}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(generatedMsg)}
                style={{ marginTop: "8px", background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", color: "var(--up-text-dim)", cursor: "pointer", width: "100%" }}
              >
                Copiar mensagem
              </button>
            </div>

            {/* Anotações */}
            <div style={{ marginBottom: "20px" }}>
              <p className="detail-label"><FileText size={11} /> Anotações</p>
              <textarea
                className="note-textarea"
                placeholder="O que aconteceu? Próximos passos..."
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
              />
              <button
                onClick={saveNote}
                disabled={savingNote || noteDraft === (selected.anotacoes || "")}
                style={{
                  marginTop: "8px",
                  background: noteDraft !== (selected.anotacoes || "") ? ACCENT : "transparent",
                  border: `1px solid ${noteDraft !== (selected.anotacoes || "") ? ACCENT : "var(--up-border)"}`,
                  borderRadius: "6px", padding: "6px 12px", fontSize: "12px",
                  color: noteDraft !== (selected.anotacoes || "") ? "#000" : "#555",
                  cursor: "pointer", width: "100%", fontWeight: "500",
                  transition: "all 0.15s",
                }}
              >
                {savingNote ? "Salvando..." : "Salvar anotação"}
              </button>
            </div>

            {/* Rodapé */}
            <div style={{ padding: "12px", background: "var(--up-bg)", borderRadius: "8px", border: `1px solid var(--up-border)`, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <p style={{ fontSize: "11px", color: "var(--up-text-dim)", margin: "0 0 2px" }}>Adicionado em</p>
                <p style={{ fontSize: "12px", color: "var(--up-text-muted)", margin: 0 }}>
                  {new Date(selected.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              {selected.contatado_em && (
                <div>
                  <p style={{ fontSize: "11px", color: "var(--up-text-dim)", margin: "0 0 2px" }}>Contactado em</p>
                  <p style={{ fontSize: "12px", color: "#f59e0b", margin: 0 }}>
                    {new Date(selected.contatado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CRMPage() {
  return (
    <Suspense fallback={null}>
      <CRMPageInner />
    </Suspense>
  );
}
