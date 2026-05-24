"use client";

import { useEffect, useState } from "react";
import Header from "@/components/header";
import ProposalFormModal, { type Proposal } from "@/components/propostas/proposal-form-modal";
import { Plus, Send, ExternalLink, Trash2, RefreshCw, FileText, Clock, CheckCircle2, XCircle, Edit2, ScrollText } from "lucide-react";
import dynamic from "next/dynamic";

const ContractTemplateEditor = dynamic(
  () => import("@/components/propostas/contract-template-editor"),
  { ssr: false, loading: () => <p style={{ color: "#777068", fontSize: "13px" }}>Carregando editor...</p> }
);

type Tab    = "docs" | "template";
type Filter = "Todos" | "Rascunho" | "Enviada" | "Assinada" | "Recusada";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";
const BG     = "#111111";

const STATUS_CFG = {
  draft:    { label: "Rascunho",  color: "#777068", bg: "rgba(119,112,104,0.1)", border: "rgba(119,112,104,0.2)", icon: Edit2 },
  sent:     { label: "Enviada",   color: "#F0B429", bg: "rgba(240,180,41,0.1)",  border: "rgba(240,180,41,0.2)",  icon: Clock },
  signed:   { label: "Assinada",  color: "#4CAF50", bg: "rgba(76,175,80,0.1)",  border: "rgba(76,175,80,0.2)",   icon: CheckCircle2 },
  rejected: { label: "Recusada",  color: "#FF6B6B", bg: "rgba(255,107,107,0.1)",border: "rgba(255,107,107,0.2)", icon: XCircle },
};

const FILTERS: Filter[] = ["Todos", "Rascunho", "Enviada", "Assinada", "Recusada"];
const FILTER_MAP: Record<Filter, string | null> = {
  Todos: null, Rascunho: "draft", Enviada: "sent", Assinada: "signed", Recusada: "rejected",
};

const TABS = [
  { key: "docs"     as Tab, label: "Documentos",          icon: FileText },
  { key: "template" as Tab, label: "Template de Contrato", icon: ScrollText },
];

function currency(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

export default function PropostasPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<Filter>("Todos");
  const [tab,       setTab]       = useState<Tab>("docs");
  const [showModal, setShowModal] = useState(false);
  const [sending,   setSending]   = useState<string | null>(null);
  const [syncing,   setSyncing]   = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/proposals");
      if (r.ok) setProposals(await r.json());
    } catch (e) {
      console.error("Erro ao carregar propostas:", e);
    } finally {
      setLoading(false);
    }
  }

  async function send(p: Proposal) {
    setSending(p.id);
    const r = await fetch(`/api/proposals/${p.id}/send`, { method: "POST" });
    if (r.ok) {
      const u = await r.json();
      setProposals(prev => prev.map(x => x.id === u.id ? u : x));
    } else {
      const e = await r.json();
      alert(e.error ?? "Erro ao enviar");
    }
    setSending(null);
  }

  async function sync(p: Proposal) {
    setSyncing(p.id);
    const r = await fetch(`/api/proposals/${p.id}/sync`, { method: "POST" });
    if (r.ok) {
      const res = await r.json();
      if (res.signed) setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "signed" } : x));
    }
    setSyncing(null);
  }

  async function del(id: string) {
    if (!confirm("Excluir?")) return;
    const r = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    if (r.ok) setProposals(prev => prev.filter(x => x.id !== id));
  }

  const filtered = proposals.filter(p => {
    const t = FILTER_MAP[filter];
    return t === null || p.status === t;
  });

  const stats = {
    total:  proposals.length,
    sent:   proposals.filter(p => p.status === "sent").length,
    signed: proposals.filter(p => p.status === "signed").length,
    value:  proposals.filter(p => p.status === "signed").reduce((s, p) => s + p.total_value, 0),
  };

  return (
    <>
      <Header title="Propostas & Contratos" />
      <style>{`
        .pp { padding: 40px 40px 60px; flex: 1; }
        .pp-grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 28px; }
        @media (max-width: 900px) {
          .pp { padding: 20px 16px 48px; }
          .pp-grid4 { grid-template-columns: 1fr 1fr; gap: 10px; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="pp">

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "28px" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: tab === t.key ? "600" : "400", padding: "7px 16px", borderRadius: "6px", border: `1px solid ${tab === t.key ? "rgba(0,207,255,0.3)" : BORDER}`, background: tab === t.key ? "rgba(0,207,255,0.08)" : "transparent", color: tab === t.key ? ACCENT : "#777068", cursor: "pointer", fontFamily: "inherit" }}>
              <t.icon size={13} strokeWidth={1.5} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Template editor */}
        {tab === "template" && <ContractTemplateEditor />}

        {/* Documents list */}
        {tab === "docs" && (
          <>
            {/* Stats */}
            <div className="pp-grid4">
              {[
                { label: "Total",         value: String(stats.total),      sub: "documentos" },
                { label: "Enviados",      value: String(stats.sent),       sub: "aguardando assinatura" },
                { label: "Assinados",     value: String(stats.signed),     sub: "fechados", hi: true },
                { label: "Valor fechado", value: currency(stats.value),    sub: "em assinados", hi: true },
              ].map(s => (
                <div key={s.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "22px", position: "relative", overflow: "hidden" }}>
                  {s.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,${ACCENT},transparent)` }} />}
                  <p style={{ fontSize: "10px", fontWeight: "500", color: "#777068", margin: "0 0 8px", letterSpacing: "0.14em", textTransform: "uppercase" }}>{s.label}</p>
                  <p style={{ fontSize: "26px", fontWeight: "700", color: s.hi ? ACCENT : "#F0EDE8", margin: "0 0 3px", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: "11px", color: "#777068", margin: 0 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "5px", border: "1px solid", cursor: "pointer", fontFamily: "inherit", fontWeight: filter === f ? "600" : "400", background: filter === f ? "rgba(0,207,255,0.1)" : "transparent", color: filter === f ? ACCENT : "#777068", borderColor: filter === f ? "rgba(0,207,255,0.3)" : BORDER }}>
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", background: ACCENT, color: "#080808", fontFamily: "inherit" }}>
                <Plus size={13} strokeWidth={2.5} />
                Novo documento
              </button>
            </div>

            {/* List */}
            {loading ? (
              <p style={{ fontSize: "13px", color: "#777068", textAlign: "center", marginTop: "48px" }}>Carregando...</p>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", marginTop: "64px" }}>
                <FileText size={36} color="#333" strokeWidth={1} style={{ marginBottom: "12px" }} />
                <p style={{ fontSize: "14px", color: "#777068", margin: 0 }}>Nenhum documento encontrado.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filtered.map(p => {
                  const cfg = STATUS_CFG[p.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.draft;
                  const Icon = cfg.icon;
                  return (
                    <div key={p.id} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8" }}>{p.title}</span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "2px 8px", borderRadius: "4px" }}>
                            <Icon size={10} strokeWidth={2} />{cfg.label}
                          </span>
                          <span style={{ fontSize: "10px", color: "#777068", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "2px 7px", borderRadius: "4px" }}>
                            {p.type === "contract" ? "Contrato" : "Proposta"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                          {p.client && <span style={{ fontSize: "12px", color: "#9A9288" }}>{p.client.name}</span>}
                          <span style={{ fontSize: "12px", color: ACCENT, fontWeight: "600" }}>{currency(p.total_value)}</span>
                          {p.valid_until && <span style={{ fontSize: "12px", color: "#777068" }}>válido até {fmtDate(p.valid_until)}</span>}
                          <span style={{ fontSize: "12px", color: "#777068" }}>criado {fmtDate(p.created_at)}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "center" }}>
                        {p.autentique_short_link && (
                          <a href={p.autentique_short_link} target="_blank" rel="noreferrer"
                            style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "6px 10px", borderRadius: "5px", border: "1px solid rgba(0,207,255,0.25)", background: "rgba(0,207,255,0.07)", color: ACCENT, textDecoration: "none", fontWeight: "600" }}>
                            <ExternalLink size={11} /> Link
                          </a>
                        )}
                        {p.status === "sent" && (
                          <button onClick={() => sync(p)} title="Verificar assinatura"
                            style={{ display: "flex", alignItems: "center", padding: "6px 10px", borderRadius: "5px", border: `1px solid ${BORDER}`, background: "transparent", color: "#9A9288", cursor: "pointer" }}>
                            <RefreshCw size={13} strokeWidth={1.5} style={{ animation: syncing === p.id ? "spin 1s linear infinite" : "none" }} />
                          </button>
                        )}
                        {p.status === "draft" && (
                          <button onClick={() => send(p)} disabled={sending === p.id}
                            style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", padding: "6px 12px", borderRadius: "5px", border: "none", background: ACCENT, color: "#080808", cursor: sending === p.id ? "not-allowed" : "pointer", fontWeight: "700", fontFamily: "inherit", opacity: sending === p.id ? 0.7 : 1 }}>
                            <Send size={11} strokeWidth={2} />
                            {sending === p.id ? "Enviando..." : "Enviar"}
                          </button>
                        )}
                        <button onClick={() => del(p.id)}
                          style={{ display: "flex", alignItems: "center", padding: "6px 9px", borderRadius: "5px", border: `1px solid ${BORDER}`, background: "transparent", color: "#777068", cursor: "pointer" }}>
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <ProposalFormModal
          onClose={() => setShowModal(false)}
          onCreated={p => setProposals(prev => [p, ...prev])}
        />
      )}
    </>
  );
}
