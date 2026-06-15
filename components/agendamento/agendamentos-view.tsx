"use client";

import { useState } from "react";
import { Calendar, Clock, User, Phone, ChevronDown, ExternalLink, Settings, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { Agendamento, AgendamentoStatus } from "@/types";
import { formatarData, STATUS_LABELS, STATUS_COLORS } from "@/lib/agendamento";

const ACCENT = "#00CFFF";

const STATUS_ALL = ["pendente", "confirmado", "cancelado", "concluido", "no_show"] as AgendamentoStatus[];

interface Props { initialData: Agendamento[] }

export default function AgendamentosView({ initialData }: Props) {
  const [agendamentos, setAgendamentos] = useState(initialData);
  const [filtroStatus, setFiltroStatus] = useState<AgendamentoStatus | "todos">("todos");
  const [loading, setLoading] = useState(false);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/agendamento/agendar");
      if (r.ok) setAgendamentos(await r.json());
    } finally { setLoading(false); }
  }

  async function updateStatus(id: string, status: AgendamentoStatus) {
    setAtualizandoId(id);
    try {
      const r = await fetch(`/api/agendamento/agendar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (r.ok) {
        const updated = await r.json();
        setAgendamentos((prev) => prev.map((a) => a.id === id ? { ...a, ...updated } : a));
      }
    } finally { setAtualizandoId(null); }
  }

  const filtrados = filtroStatus === "todos" ? agendamentos : agendamentos.filter((a) => a.status === filtroStatus);

  // Stats
  const hoje = new Date().toISOString().split("T")[0];
  const stats = {
    total: agendamentos.length,
    hoje: agendamentos.filter((a) => a.data === hoje).length,
    pendentes: agendamentos.filter((a) => a.status === "pendente").length,
    confirmados: agendamentos.filter((a) => a.status === "confirmado").length,
  };

  return (
    <div style={{ padding: "24px", flex: 1 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        {[
          { label: "Total", value: stats.total, color: "#fff" },
          { label: "Hoje", value: stats.hoje, color: ACCENT },
          { label: "Pendentes", value: stats.pendentes, color: "#F59E0B" },
          { label: "Confirmados", value: stats.confirmados, color: "#10B981" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "16px" }}>
            <p style={{ fontSize: "11px", color: "var(--up-text-label)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{label}</p>
            <p style={{ fontSize: "28px", fontWeight: "700", color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {(["todos", ...STATUS_ALL] as const).map((s) => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              style={{ padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "500", cursor: "pointer", border: `1px solid ${filtroStatus === s ? (s === "todos" ? ACCENT : STATUS_COLORS[s] ?? ACCENT) : "var(--up-border)"}`, background: filtroStatus === s ? (s === "todos" ? "rgba(0,207,255,0.1)" : `${STATUS_COLORS[s]}18`) : "transparent", color: filtroStatus === s ? (s === "todos" ? ACCENT : STATUS_COLORS[s] ?? ACCENT) : "#9A9288" }}>
              {s === "todos" ? "Todos" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={refresh} disabled={loading}
            style={{ padding: "8px 14px", background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "8px", color: "var(--up-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Atualizar
          </button>
          <Link href="/agendar" target="_blank"
            style={{ padding: "8px 14px", background: "rgba(0,207,255,0.08)", border: `1px solid rgba(0,207,255,0.2)`, borderRadius: "8px", color: ACCENT, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "500" }}>
            <ExternalLink size={14} />
            Ver página pública
          </Link>
          <Link href="/dashboard/agendamentos/configuracoes"
            style={{ padding: "8px 14px", background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "8px", color: "var(--up-text-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <Settings size={14} />
            Configurar
          </Link>
        </div>
      </div>

      {/* Tabela */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--up-text-label)" }}>
          <Calendar size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p>Nenhum agendamento {filtroStatus !== "todos" ? `com status "${STATUS_LABELS[filtroStatus]}"` : "encontrado"}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtrados.map((ag) => (
            <AgendamentoCard key={ag.id} ag={ag} onStatusChange={updateStatus} loading={atualizandoId === ag.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgendamentoCard({ ag, onStatusChange, loading }: {
  ag: Agendamento;
  onStatusChange: (id: string, status: AgendamentoStatus) => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const cor = STATUS_COLORS[ag.status] ?? "#777";

  return (
    <div style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>

        <div style={{ width: "4px", height: "44px", background: cor, borderRadius: "99px", flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>{ag.paciente?.nome ?? "—"}</span>
            <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: `${cor}18`, color: cor, border: `1px solid ${cor}30`, fontWeight: "500" }}>
              {STATUS_LABELS[ag.status]}
            </span>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "var(--up-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar size={11} /> {formatarData(ag.data)}
            </span>
            <span style={{ fontSize: "12px", color: "var(--up-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock size={11} /> {ag.hora}
            </span>
            {ag.paciente?.telefone && (
              <span style={{ fontSize: "12px", color: "var(--up-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <Phone size={11} /> {ag.paciente.telefone}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Status changer */}
          <div style={{ position: "relative" }}>
            <button
              disabled={loading}
              onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
              style={{ padding: "6px 12px", background: "var(--up-border)", border: `1px solid var(--up-border)`, borderRadius: "6px", color: "var(--up-text-muted)", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
              {loading ? "..." : <><User size={12} /> Status <ChevronDown size={12} /></>}
            </button>
            {showStatusMenu && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "8px", zIndex: 50, minWidth: "160px", overflow: "hidden" }}
                onMouseLeave={() => setShowStatusMenu(false)}>
                {(["pendente", "confirmado", "concluido", "cancelado", "no_show"] as AgendamentoStatus[]).map((s) => (
                  <button key={s}
                    onClick={(e) => { e.stopPropagation(); onStatusChange(ag.id, s); setShowStatusMenu(false); }}
                    style={{ display: "block", width: "100%", padding: "10px 14px", background: ag.status === s ? `${STATUS_COLORS[s]}15` : "transparent", border: "none", color: ag.status === s ? STATUS_COLORS[s] : "#ccc", fontSize: "13px", textAlign: "left", cursor: "pointer" }}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <ChevronDown size={16} color="#555" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid var(--up-border)`, padding: "16px", background: "var(--up-bg)" }}>
          {ag.quiz_respostas && Object.keys(ag.quiz_respostas).length > 0 && (
            <div>
              <p style={{ fontSize: "11px", color: "var(--up-text-label)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Respostas do quiz</p>
              {Object.entries(ag.quiz_respostas).map(([k, v]) => (
                <div key={k} style={{ marginBottom: "8px" }}>
                  <p style={{ fontSize: "11px", color: "var(--up-text-dim)", marginBottom: "2px" }}>{k}</p>
                  <p style={{ fontSize: "13px", color: "#ccc" }}>{v}</p>
                </div>
              ))}
            </div>
          )}
          {ag.observacoes && (
            <div style={{ marginTop: "12px" }}>
              <p style={{ fontSize: "11px", color: "var(--up-text-label)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Observações</p>
              <p style={{ fontSize: "13px", color: "#ccc" }}>{ag.observacoes}</p>
            </div>
          )}
          <p style={{ fontSize: "11px", color: "#444", marginTop: "12px" }}>
            Criado em {new Date(ag.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
      )}
    </div>
  );
}
