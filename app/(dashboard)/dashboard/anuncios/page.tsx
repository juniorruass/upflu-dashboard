"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Loader2, AlertCircle, Search, ChevronDown, ChevronUp } from "lucide-react";
import Header from "@/components/header";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";
const CARD = "#111111";
const MUTED = "#777068";
const TEXT = "#F0EDE8";

// ─── Types ────────────────────────────────────────────────────────────────────

type DatePreset = "today" | "yesterday" | "last_7d" | "last_30d" | "custom";

type MetricKey =
  | "spend" | "results" | "cost_per_result" | "leads" | "cost_per_lead"
  | "clicks" | "ctr" | "impressions" | "reach" | "cpm" | "roas" | "purchases" | "cost_per_purchase";

type MetaInsights = {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  reach: number;
  frequency: number;
  cpm: number;
  cpp: number;
  leads: number | null;
  purchases: number | null;
  results: number | null;
  result_label: string | null;
  all_results: { label: string; value: number; cost: number | null }[];
  cost_per_result: number | null;
  cost_per_lead: number | null;
  cost_per_purchase: number | null;
  cpl: number | null;
  roas: number | null;
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  objective: string;
  insights: {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    reach: number;
    cpm: number;
    results: number | null;
    result_label: string | null;
    cost_per_result: number | null;
    leads: number | null;
    cost_per_lead: number | null;
  } | null;
};

type ClientRow = {
  id: string;
  name: string;
  segment: string;
  meta_account_id: string | null;
};

type ClientState = {
  insights: MetaInsights | null;
  campaigns: Campaign[] | null;
  loading: boolean;
  loadingCampaigns: boolean;
  error: string | null;
  expanded: boolean;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "today",     label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "last_7d",   label: "7 dias" },
  { key: "last_30d",  label: "30 dias" },
  { key: "custom",    label: "Personalizado" },
];

const ALL_METRICS: { key: MetricKey; label: string; group: string }[] = [
  { key: "spend",            label: "Investimento",      group: "Principal" },
  { key: "results",          label: "Resultados",        group: "Principal" },
  { key: "cost_per_result",  label: "Custo/Resultado",   group: "Principal" },
  { key: "leads",            label: "Leads",             group: "Principal" },
  { key: "cost_per_lead",    label: "Custo/Lead",        group: "Principal" },
  { key: "roas",             label: "ROAS",              group: "Principal" },
  { key: "clicks",           label: "Clicks",            group: "Engajamento" },
  { key: "ctr",              label: "CTR",               group: "Engajamento" },
  { key: "impressions",      label: "Impressões",        group: "Alcance" },
  { key: "reach",            label: "Alcance",           group: "Alcance" },
  { key: "cpm",              label: "CPM",               group: "Alcance" },
  { key: "purchases",        label: "Compras",           group: "Conversão" },
  { key: "cost_per_purchase",label: "Custo/Compra",      group: "Conversão" },
];

const DEFAULT_METRICS: MetricKey[] = ["spend", "results", "cost_per_result", "leads", "cost_per_lead"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMetric(key: MetricKey, val: number | null | undefined): string {
  if (val == null || isNaN(val) || !isFinite(val)) return "—";
  if (["spend","cost_per_result","cost_per_lead","cost_per_purchase","cpm","cpl"].includes(key))
    return "R$ " + val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (key === "ctr") return val.toFixed(2) + "%";
  if (key === "roas") return val.toFixed(2) + "x";
  return val.toLocaleString("pt-BR");
}

function getVal(key: MetricKey, ins: MetaInsights | null): number | null {
  if (!ins) return null;
  const map: Record<MetricKey, number | null> = {
    spend: ins.spend, results: ins.results, cost_per_result: ins.cost_per_result,
    leads: ins.leads, cost_per_lead: ins.cost_per_lead, roas: ins.roas,
    clicks: ins.clicks, ctr: ins.ctr, impressions: ins.impressions,
    reach: ins.reach, cpm: ins.cpm, purchases: ins.purchases,
    cost_per_purchase: ins.cost_per_purchase,
  };
  return map[key] ?? null;
}

function statusColor(s: string) {
  if (s === "ACTIVE") return "#4ADE80";
  if (s === "PAUSED") return "#F0B429";
  return MUTED;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnunciosPage() {
  const [allClients, setAllClients]   = useState<ClientRow[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [searchQ, setSearchQ]         = useState("");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [selectedMetrics, setSelectedMetrics] = useState<Set<MetricKey>>(new Set(DEFAULT_METRICS));
  const [datePreset, setDatePreset]   = useState<DatePreset>("last_30d");
  const [since, setSince]             = useState("");
  const [until, setUntil]             = useState("");
  const [states, setStates]           = useState<Record<string, ClientState>>({});
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const fetchRef                      = useRef(0);

  // Load clients
  useEffect(() => {
    async function load() {
      setLoadingClients(true);
      try {
        const res = await fetch("/api/clients");
        if (!res.ok) return;
        const data = await res.json();
        setAllClients((data as ClientRow[]).filter((c) => c.meta_account_id));
      } finally { setLoadingClients(false); }
    }
    load();
  }, []);

  const buildQP = useCallback(() => {
    const qp = new URLSearchParams();
    if (datePreset === "custom" && since && until) {
      qp.set("since", since); qp.set("until", until);
    } else if (datePreset !== "custom") {
      qp.set("date_preset", datePreset);
    }
    return qp.toString();
  }, [datePreset, since, until]);

  const fetchClient = useCallback(async (clientId: string, qp: string, token: number) => {
    setStates((prev) => ({
      ...prev,
      [clientId]: { ...prev[clientId], loading: true, loadingCampaigns: true, error: null, expanded: prev[clientId]?.expanded ?? false },
    }));

    // Fetch overview + campaigns in parallel
    const [overviewRes, campaignsRes] = await Promise.allSettled([
      fetch(`/api/meta/${clientId}?${qp}`),
      fetch(`/api/meta/${clientId}/campaigns?${qp}`),
    ]);

    if (token !== fetchRef.current) return; // stale

    let insights: MetaInsights | null = null;
    let insightError: string | null = null;
    if (overviewRes.status === "fulfilled") {
      const j = await overviewRes.value.json();
      if (j.error) insightError = j.error; else insights = j.data;
    }

    let campaigns: Campaign[] | null = null;
    if (campaignsRes.status === "fulfilled") {
      const j = await campaignsRes.value.json();
      if (!j.error) campaigns = j.campaigns;
    }

    setStates((prev) => ({
      ...prev,
      [clientId]: { insights, campaigns, loading: false, loadingCampaigns: false, error: insightError, expanded: prev[clientId]?.expanded ?? false },
    }));
  }, []);

  // Auto-fetch when selection or date changes
  useEffect(() => {
    if (selectedClients.size === 0) return;
    if (datePreset === "custom" && (!since || !until)) return;

    const token = ++fetchRef.current;
    const qp = buildQP();

    Array.from(selectedClients).forEach((id) => fetchClient(id, qp, token));
    setLastRefresh(new Date());
  }, [selectedClients, datePreset, since, until, buildQP, fetchClient]);

  function toggleClient(id: string) {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setStates((s) => { const n = { ...s }; delete n[id]; return n; });
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleMetric(key: MetricKey) {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }

  function toggleExpanded(id: string) {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], expanded: !prev[id]?.expanded } }));
  }

  function refresh() {
    const token = ++fetchRef.current;
    const qp = buildQP();
    Array.from(selectedClients).forEach((id) => fetchClient(id, qp, token));
    setLastRefresh(new Date());
  }

  const filteredClients = allClients.filter((c) => c.name.toLowerCase().includes(searchQ.toLowerCase()));
  const activeClients   = allClients.filter((c) => selectedClients.has(c.id));
  const activeMetrics   = ALL_METRICS.filter((m) => selectedMetrics.has(m.key));

  const pill = (active: boolean, onClick: () => void, label: string) => (
    <button onClick={onClick} style={{
      padding: "6px 13px", borderRadius: "6px", fontSize: "12px", fontWeight: "500",
      border: `1px solid ${active ? "rgba(0,207,255,0.4)" : BORDER}`,
      background: active ? "rgba(0,207,255,0.09)" : "transparent",
      color: active ? ACCENT : MUTED, cursor: "pointer",
      fontFamily: "var(--font-outfit),sans-serif", transition: "all 0.15s",
    }}>{label}</button>
  );

  return (
    <>
      <Header title="Anúncios" />
      <div className="page-wrap">

        {/* ── Filter panel ── */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px 24px", marginBottom: "24px" }}>

          {/* Date */}
          <div style={{ marginBottom: "18px" }}>
            <p style={{ fontSize: "10px", fontWeight: "600", color: MUTED, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 10px" }}>Período</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              {DATE_PRESETS.map((d) => pill(datePreset === d.key, () => setDatePreset(d.key), d.label))}
              {datePreset === "custom" && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="date" value={since} onChange={(e) => setSince(e.target.value)}
                    style={{ background: "#080808", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "6px 10px", fontSize: "12px", color: TEXT, outline: "none", colorScheme: "dark", fontFamily: "var(--font-outfit),sans-serif" }} />
                  <span style={{ fontSize: "12px", color: MUTED }}>até</span>
                  <input type="date" value={until} onChange={(e) => setUntil(e.target.value)}
                    style={{ background: "#080808", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "6px 10px", fontSize: "12px", color: TEXT, outline: "none", colorScheme: "dark", fontFamily: "var(--font-outfit),sans-serif" }} />
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div style={{ marginBottom: "18px" }}>
            <p style={{ fontSize: "10px", fontWeight: "600", color: MUTED, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 10px" }}>Métricas</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {ALL_METRICS.map((m) => pill(selectedMetrics.has(m.key), () => toggleMetric(m.key), m.label))}
            </div>
          </div>

          {/* Clients */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: "600", color: MUTED, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 10px" }}>Clientes</p>
            {loadingClients ? (
              <p style={{ fontSize: "13px", color: MUTED }}>Carregando...</p>
            ) : allClients.length === 0 ? (
              <p style={{ fontSize: "13px", color: MUTED }}>Nenhum cliente com Meta configurado.</p>
            ) : (
              <>
                <div style={{ position: "relative", marginBottom: "10px", maxWidth: "260px" }}>
                  <Search size={13} color={MUTED} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                  <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Buscar..."
                    style={{ width: "100%", background: "#080808", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "7px 10px 7px 30px", fontSize: "12px", color: TEXT, outline: "none", boxSizing: "border-box", fontFamily: "var(--font-outfit),sans-serif" }} />
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {filteredClients.map((c) => {
                    const active = selectedClients.has(c.id);
                    const st = states[c.id];
                    return (
                      <button key={c.id} onClick={() => toggleClient(c.id)} style={{
                        padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "500",
                        border: `1px solid ${active ? "rgba(0,207,255,0.4)" : BORDER}`,
                        background: active ? "rgba(0,207,255,0.09)" : "transparent",
                        color: active ? ACCENT : MUTED, cursor: "pointer",
                        fontFamily: "var(--font-outfit),sans-serif", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}>
                        {st?.loading ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : active ? "✓" : null}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Bottom bar */}
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: MUTED }}>
              {lastRefresh ? `Atualizado às ${lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Selecione um cliente para ver os dados"}
            </span>
            {selectedClients.size > 0 && (
              <button onClick={refresh} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "7px", padding: "7px 14px", color: MUTED, fontSize: "12px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif" }}>
                <RefreshCw size={12} /> Atualizar
              </button>
            )}
          </div>
        </div>

        {/* ── Results ── */}
        {activeClients.length === 0 ? (
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: MUTED, margin: 0 }}>Selecione um cliente acima para ver as métricas.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {activeClients.map((c) => {
              const st = states[c.id];
              const camps = st?.campaigns ?? [];

              return (
                <div key={c.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden" }}>

                  {/* Client header */}
                  <div style={{ padding: "20px 24px", borderBottom: st?.insights || st?.loading ? `1px solid ${BORDER}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (st?.insights && activeMetrics.length > 0) ? "16px" : "0" }}>
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: "600", color: TEXT, margin: "0 0 2px" }}>{c.name}</p>
                        <p style={{ fontSize: "11px", color: MUTED, margin: 0 }}>{c.segment}</p>
                      </div>
                      {st?.loading && <Loader2 size={15} color={MUTED} style={{ animation: "spin 1s linear infinite" }} />}
                    </div>

                    {st?.error && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "6px" }}>
                        <AlertCircle size={13} color="#EF4444" />
                        <span style={{ fontSize: "12px", color: "#EF4444" }}>{st.error}</span>
                      </div>
                    )}

                    {/* Overview metrics */}
                    {st?.insights && !st.loading && (() => {
                      const hasAllResults = (st.insights?.all_results?.length ?? 0) > 0;
                      const gridMetrics = activeMetrics.filter((m) => !hasAllResults || m.key !== "results");
                      return (
                        <>
                          {gridMetrics.length > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(gridMetrics.length, 6)}, 1fr)`, gap: "10px", marginBottom: hasAllResults ? "10px" : "0" }}>
                              {gridMetrics.map((m) => {
                                const val = getVal(m.key, st.insights);
                                const hi = m.key === "spend";
                                const firstResult = st.insights?.all_results?.[0];
                                const label = (m.key === "cost_per_result" && firstResult)
                                  ? `Custo / ${firstResult.label}`
                                  : m.label;
                                return (
                                  <div key={m.key} style={{ background: "#080808", borderRadius: "8px", padding: "12px 14px", border: `1px solid ${hi ? "rgba(0,207,255,0.2)" : BORDER}`, position: "relative", overflow: "hidden" }}>
                                    {hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,${ACCENT},transparent)` }} />}
                                    <p style={{ fontSize: "10px", color: MUTED, margin: "0 0 5px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</p>
                                    <p style={{ fontSize: "16px", fontWeight: "700", color: hi ? ACCENT : TEXT, margin: 0, letterSpacing: "-0.02em" }}>{fmtMetric(m.key, val)}</p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {/* All results breakdown */}
                          {hasAllResults && (
                            <div style={{ background: "#080808", borderRadius: "8px", border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0", borderBottom: `1px solid ${BORDER}` }}>
                                <p style={{ fontSize: "10px", color: MUTED, margin: 0, letterSpacing: "0.14em", textTransform: "uppercase", padding: "10px 14px 8px" }}>Tipo de resultado</p>
                                <p style={{ fontSize: "10px", color: MUTED, margin: 0, letterSpacing: "0.14em", textTransform: "uppercase", padding: "10px 14px 8px", textAlign: "right" }}>Qtd.</p>
                                <p style={{ fontSize: "10px", color: MUTED, margin: 0, letterSpacing: "0.14em", textTransform: "uppercase", padding: "10px 14px 8px", textAlign: "right", minWidth: "100px" }}>Custo unit.</p>
                              </div>
                              {st.insights!.all_results.map((r, i) => (
                                <div key={r.label} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", padding: "10px 14px", borderBottom: i < st.insights!.all_results.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                                  <span style={{ fontSize: "13px", color: TEXT, fontWeight: "500" }}>{r.label}</span>
                                  <span style={{ fontSize: "14px", fontWeight: "700", color: TEXT, padding: "0 14px", textAlign: "right" }}>{r.value.toLocaleString("pt-BR")}</span>
                                  <span style={{ fontSize: "13px", color: r.cost != null ? ACCENT : MUTED, minWidth: "100px", textAlign: "right", fontWeight: r.cost != null ? "600" : "400" }}>
                                    {r.cost != null ? "R$ " + r.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {st?.insights === null && !st?.loading && !st?.error && (
                      <p style={{ fontSize: "12px", color: MUTED, margin: 0 }}>Sem dados para o período.</p>
                    )}
                  </div>

                  {/* Campaigns section */}
                  {st && !st.loading && (
                    <div>
                      <button onClick={() => toggleExpanded(c.id)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif", color: MUTED, fontSize: "12px", fontWeight: "500" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {st.loadingCampaigns
                            ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Carregando campanhas...</>
                            : <>{camps.length} campanha{camps.length !== 1 ? "s" : ""}</>
                          }
                        </span>
                        {st.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {st.expanded && camps.length > 0 && (
                        <div className="r-scroll" style={{ borderTop: `1px solid ${BORDER}` }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                                {["Campanha", "Status", "Investimento", camps.find(c => c.insights?.result_label)?.insights?.result_label ?? "Resultados", "Custo/Result.", "Leads", "CPL", "Clicks", "CTR"].map((h) => (
                                  <th key={h} style={{ padding: "10px 16px", textAlign: h === "Campanha" ? "left" : "right", fontSize: "10px", fontWeight: "600", color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {camps.map((camp, i) => {
                                const ins = camp.insights;
                                const money = (v: number | null) => v != null ? "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
                                const num = (v: number | null) => v != null ? v.toLocaleString("pt-BR") : "—";
                                const pct = (v: number | null) => v != null ? v.toFixed(2) + "%" : "—";
                                return (
                                  <tr key={camp.id} style={{ borderBottom: i < camps.length - 1 ? `1px solid ${BORDER}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                                    <td style={{ padding: "12px 16px", color: TEXT, maxWidth: "220px" }}>
                                      <p style={{ margin: 0, fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{camp.name}</p>
                                      <p style={{ margin: 0, fontSize: "10px", color: MUTED }}>{camp.objective?.replace(/_/g, " ")}</p>
                                    </td>
                                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                      <span style={{ fontSize: "10px", fontWeight: "600", color: statusColor(camp.status), background: `${statusColor(camp.status)}18`, padding: "2px 8px", borderRadius: "4px" }}>
                                        {camp.status === "ACTIVE" ? "Ativa" : "Pausada"}
                                      </span>
                                    </td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", color: ACCENT, fontWeight: "600" }}>{ins ? money(ins.spend) : "—"}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", color: TEXT }}>{ins ? num(ins.results) : "—"}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", color: TEXT }}>{ins ? money(ins.cost_per_result) : "—"}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", color: TEXT }}>{ins ? num(ins.leads) : "—"}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", color: TEXT }}>{ins ? money(ins.cost_per_lead) : "—"}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", color: TEXT }}>{ins ? num(ins.clicks) : "—"}</td>
                                    <td style={{ padding: "12px 16px", textAlign: "right", color: TEXT }}>{ins ? pct(ins.ctr) : "—"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {st.expanded && !st.loadingCampaigns && camps.length === 0 && (
                        <div style={{ padding: "16px 24px", borderTop: `1px solid ${BORDER}` }}>
                          <p style={{ fontSize: "12px", color: MUTED, margin: 0 }}>Nenhuma campanha ativa ou pausada encontrada.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
