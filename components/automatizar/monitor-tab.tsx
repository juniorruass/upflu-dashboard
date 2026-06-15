"use client";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Loader2, Clock, Send, MessageSquare, CheckCircle2 } from "lucide-react";

interface Prospect {
  id: string; nome: string; telefone: string; cidade: string; tipo: string;
  status: string; whatsapp_enviado: boolean; whatsapp_enviado_at: string | null;
  followup_enviado: boolean; followup_enviado_at: string | null;
  created_at: string; proximo_envio: string | null;
}
interface Config {
  id: string; name: string; search_term: string; source: string;
  send_hour: number; end_hour: number; active_days: number[];
  daily_limit: number; min_delay_seconds: number; max_delay_seconds: number;
  followup_days: number;
}
interface Stats { fila: number; enviados_hoje: number; aguardando_followup: number; responderam: number; }

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  novo:          { label: "Novo",          color: "#00CFFF", bg: "rgba(0,207,255,0.1)"   },
  contatado:     { label: "Contatado",     color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  followup:      { label: "Follow-up",     color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  respondeu:     { label: "Respondeu",     color: "#4ADE80", bg: "rgba(74,222,128,0.1)"  },
  fechado:       { label: "Fechado",       color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  sem_interesse: { label: "Sem interesse", color: "var(--up-text-dim)",    bg: "rgba(255,255,255,0.04)"},
  potencial:     { label: "Potencial",     color: "#FF9500", bg: "rgba(255,149,0,0.1)"   },
};

const DIAS_LABEL: Record<number, string> = { 0:"Dom", 1:"Seg", 2:"Ter", 3:"Qua", 4:"Qui", 5:"Sex", 6:"Sáb" };

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? { label: status, color: "var(--up-text-dim)", bg: "rgba(255,255,255,0.04)" };
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: `${cfg.color}33` }}>
      {cfg.label}
    </span>
  );
}

function ProximoEnvio({ dt }: { dt: string | null }) {
  if (!dt) return <span className="text-[11px] text-[#444]">—</span>;

  const d    = new Date(dt);
  const now  = new Date();
  const diff = d.getTime() - now.getTime();
  const horas = Math.round(diff / 3_600_000);

  const hora = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  let label: string;
  let color: string;

  const hoje    = new Date(); hoje.setHours(0,0,0,0);
  const amanha  = new Date(hoje); amanha.setDate(hoje.getDate() + 1);
  const dData   = new Date(d);   dData.setHours(0,0,0,0);

  if (dData.getTime() === hoje.getTime()) {
    label = `Hoje às ${hora}`;
    color = horas <= 2 ? "#4ADE80" : "#00CFFF";
  } else if (dData.getTime() === amanha.getTime()) {
    label = `Amanhã às ${hora}`;
    color = "#f59e0b";
  } else {
    label = `${DIAS_LABEL[d.getDay()]} ${d.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" })} às ${hora}`;
    color = "#777";
  }

  return (
    <span className="text-[11px] font-semibold" style={{ color }}>
      {label}
    </span>
  );
}

function fmt(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function MonitorTab() {
  const [stats, setStats]         = useState<Stats>({ fila: 0, enviados_hoje: 0, aguardando_followup: 0, responderam: 0 });
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [configs, setConfigs]     = useState<Config[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [mode, setMode]           = useState<"pending" | "all">("pending");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTipo, setFilterTipo]     = useState("");
  const [page, setPage]           = useState(1);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), mode });
    if (filterStatus) params.set("status", filterStatus);
    if (filterTipo)   params.set("tipo", filterTipo);
    const r = await fetch(`/api/automatizar/monitor?${params}`);
    const d = await r.json();
    setStats(d.stats);
    setProspects(d.prospects);
    setConfigs(d.configs);
    setTotal(d.total);
    setLastUpdate(new Date());
    setLoading(false);
  }, [page, mode, filterStatus, filterTipo]);

  useEffect(() => { setPage(1); load(1); }, [mode, filterStatus, filterTipo]);
  useEffect(() => { load(page); }, [page]);

  useEffect(() => {
    const t = setInterval(() => load(page), 30_000);
    return () => clearInterval(t);
  }, [load, page]);

  const totalPages = Math.ceil(total / 50);

  const STAT_CARDS = [
    { label: "Na fila",          value: stats.fila,                color: "#00CFFF", icon: Clock        },
    { label: "Enviados hoje",    value: stats.enviados_hoje,        color: "#4ADE80", icon: Send         },
    { label: "Aguard. follow-up",value: stats.aguardando_followup,  color: "#a78bfa", icon: MessageSquare},
    { label: "Responderam",      value: stats.responderam,          color: "#f59e0b", icon: CheckCircle2 },
  ];

  return (
    <div className="flex flex-col gap-5">

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="bg-[#111] border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={13} color={s.color} />
              <p className="text-[10px] font-semibold text-[#555] tracking-[0.1em] uppercase">{s.label}</p>
            </div>
            <p className="text-[26px] font-bold leading-none" style={{ color: s.color }}>
              {s.value.toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>

      {/* Horários das automações */}
      {configs.length > 0 && (
        <div className="flex flex-col gap-2">
          {configs.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-[#111] border border-white/[0.07] rounded-xl px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                <span className="text-[13px] font-semibold text-[#F0EDE8]">{c.name}</span>
                <span className="text-[11px] text-[#555]">
                  {String(c.send_hour ?? 8).padStart(2,"0")}:00 – {String(c.end_hour ?? 18).padStart(2,"0")}:00
                  {" · "}{(c.active_days ?? []).map((d) => DIAS_LABEL[d]).join(", ")}
                  {" · "}{c.daily_limit} msgs/dia
                  {" · "}delay {c.min_delay_seconds}–{c.max_delay_seconds}s
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#00CFFF" }}>
                <Clock size={12} />
                <ProximoEnvio dt={
                  (() => {
                    const dias = c.active_days ?? [1,2,3,4,5];
                    const diasSet = new Set(dias);
                    const now = new Date();
                    for (let d = 0; d <= 7; d++) {
                      const day = new Date(now); day.setDate(now.getDate() + d);
                      if (!diasSet.has(day.getDay())) continue;
                      const hrs = d === 0 ? [8,14].filter(h => h > now.getHours()) : [8,14];
                      if (!hrs.length) continue;
                      const r = new Date(day); r.setHours(hrs[0],0,0,0);
                      return r.toISOString();
                    }
                    return null;
                  })()
                } />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-[#111] border border-white/[0.07] rounded-lg">
          {([
            { key: "pending", label: "Pendentes" },
            { key: "all",     label: "Todos"     },
          ] as const).map((t) => (
            <button key={t.key} type="button" onClick={() => setMode(t.key)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                mode === t.key ? "bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/25" : "text-[#555] hover:text-[#888]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}
          className="bg-[#0d0d0d] border border-white/[0.07] rounded-lg px-3 py-2 text-[12px] text-[#F0EDE8] outline-none focus:border-[#00CFFF]/40 transition-colors cursor-pointer">
          <option value="">Todas as automações</option>
          {configs.map((c) => <option key={c.id} value={c.search_term}>{c.name}</option>)}
        </select>

        {mode === "all" && (
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0d0d0d] border border-white/[0.07] rounded-lg px-3 py-2 text-[12px] text-[#F0EDE8] outline-none focus:border-[#00CFFF]/40 transition-colors cursor-pointer">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        )}

        <button type="button" onClick={() => load(page)} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/[0.07] text-[#555] text-[12px] hover:border-white/20 hover:text-[#888] transition-all disabled:opacity-50">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>

        <span className="ml-auto text-[11px] text-[#444]">
          {lastUpdate ? `${lastUpdate.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}` : ""}
          {" · "}auto 30s
        </span>
      </div>

      {/* Tabela */}
      <div className="bg-[#111] border border-white/[0.07] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-white/[0.06]">
          {["Nome", "Telefone", "Cidade", "Status", "Enviado em", "Próximo envio"].map((h) => (
            <span key={h} className="text-[10px] font-semibold text-[#444] tracking-[0.1em] uppercase">{h}</span>
          ))}
        </div>

        {loading && prospects.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="animate-spin text-[#555]" />
          </div>
        ) : prospects.length === 0 ? (
          <p className="text-[13px] text-[#555] text-center py-12">
            {mode === "pending" ? "Nenhum contato pendente." : "Nenhum contato encontrado."}
          </p>
        ) : prospects.map((p, i) => (
          <div key={p.id}
            className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center transition-colors hover:bg-white/[0.02] ${i < prospects.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
            <span className="text-[13px] font-medium text-[#F0EDE8] truncate" title={p.nome}>{p.nome || "—"}</span>
            <span className="text-[12px] text-[#AAA] font-mono">{p.telefone || "—"}</span>
            <span className="text-[12px] text-[#777] truncate">{p.cidade || "—"}</span>
            <StatusBadge status={p.status} />
            <span className="text-[11px] text-[#666]">{fmt(p.whatsapp_enviado_at)}</span>
            <ProximoEnvio dt={p.proximo_envio} />
          </div>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#555]">{total.toLocaleString("pt-BR")} contatos</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-white/[0.07] text-[12px] text-[#666] hover:border-white/20 disabled:opacity-30 transition-all">
              ← Anterior
            </button>
            <span className="px-3 py-1.5 text-[12px] text-[#555]">{page} / {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/[0.07] text-[12px] text-[#666] hover:border-white/20 disabled:opacity-30 transition-all">
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
