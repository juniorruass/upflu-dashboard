"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Loader2, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";
const CARD   = "#111111";
const MUTED  = "#777068";
const TEXT   = "#F0EDE8";

type DatePreset = "today" | "yesterday" | "last_7d" | "last_30d" | "custom";
type MetricKey  =
  | "spend" | "results" | "cost_per_result" | "leads" | "cost_per_lead"
  | "clicks" | "ctr" | "impressions" | "reach" | "cpm" | "roas"
  | "purchases" | "cost_per_purchase";

type MetaInsights = {
  spend: number; impressions: number; clicks: number; ctr: number;
  reach: number; frequency: number; cpm: number; cpp: number;
  leads: number | null; purchases: number | null;
  results: number | null; result_label: string | null;
  all_results: { label: string; value: number; cost: number | null }[];
  cost_per_result: number | null; cost_per_lead: number | null;
  cost_per_purchase: number | null; cpl: number | null; roas: number | null;
};

type Campaign = {
  id: string; name: string; status: string; objective: string;
  insights: {
    spend: number; impressions: number; clicks: number; ctr: number;
    reach: number; cpm: number; results: number | null;
    result_label: string | null; cost_per_result: number | null;
    leads: number | null; cost_per_lead: number | null;
  } | null;
};

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "today",     label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "last_7d",   label: "7 dias" },
  { key: "last_30d",  label: "30 dias" },
  { key: "custom",    label: "Personalizado" },
];

const ALL_METRICS: { key: MetricKey; label: string }[] = [
  { key: "spend",             label: "Investimento" },
  { key: "results",           label: "Resultados" },
  { key: "cost_per_result",   label: "Custo/Resultado" },
  { key: "leads",             label: "Leads" },
  { key: "cost_per_lead",     label: "Custo/Lead" },
  { key: "roas",              label: "ROAS" },
  { key: "clicks",            label: "Clicks" },
  { key: "ctr",               label: "CTR" },
  { key: "impressions",       label: "Impressões" },
  { key: "reach",             label: "Alcance" },
  { key: "cpm",               label: "CPM" },
  { key: "purchases",         label: "Compras" },
  { key: "cost_per_purchase", label: "Custo/Compra" },
];

const DEFAULT_METRICS: MetricKey[] = ["spend", "results", "cost_per_result", "leads", "cost_per_lead"];

function fmtMetric(key: MetricKey, val: number | null | undefined): string {
  if (val == null || isNaN(val) || !isFinite(val)) return "—";
  if (["spend","cost_per_result","cost_per_lead","cost_per_purchase","cpm","cpl"].includes(key))
    return "R$ " + val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (key === "ctr")  return val.toFixed(2) + "%";
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
  if (s === "PAUSED") return "#F59E0B";
  return MUTED;
}

interface Props { clientId: string }

export default function MetaAdsPanel({ clientId }: Props) {
  const [insights,         setInsights]         = useState<MetaInsights | null>(null);
  const [campaigns,        setCampaigns]         = useState<Campaign[] | null>(null);
  const [loading,          setLoading]           = useState(false);
  const [loadingCampaigns, setLoadingCampaigns]  = useState(false);
  const [error,            setError]             = useState<string | null>(null);
  const [expanded,         setExpanded]          = useState(false);
  const [datePreset,       setDatePreset]        = useState<DatePreset>("last_30d");
  const [since,            setSince]             = useState("");
  const [until,            setUntil]             = useState("");
  const [selectedMetrics,  setSelectedMetrics]   = useState<Set<MetricKey>>(new Set(DEFAULT_METRICS));
  const [lastRefresh,      setLastRefresh]       = useState<Date | null>(null);
  const fetchRef = useRef(0);

  const buildQP = useCallback(() => {
    const qp = new URLSearchParams();
    if (datePreset === "custom" && since && until) {
      qp.set("since", since); qp.set("until", until);
    } else if (datePreset !== "custom") {
      qp.set("date_preset", datePreset);
    }
    return qp.toString();
  }, [datePreset, since, until]);

  const load = useCallback(async (token: number) => {
    setLoading(true); setLoadingCampaigns(true); setError(null);
    const qp = buildQP();

    const [overRes, campRes] = await Promise.allSettled([
      fetch(`/api/meta/${clientId}?${qp}`),
      fetch(`/api/meta/${clientId}/campaigns?${qp}`),
    ]);

    if (token !== fetchRef.current) return;

    if (overRes.status === "fulfilled") {
      const j = await overRes.value.json();
      if (j.error) setError(j.error);
      else setInsights(j.data ?? null);
    }
    setLoading(false);

    if (campRes.status === "fulfilled") {
      const j = await campRes.value.json();
      if (!j.error) setCampaigns(j.campaigns ?? []);
    }
    setLoadingCampaigns(false);
    setLastRefresh(new Date());
  }, [clientId, buildQP]);

  // Auto-load on mount
  useEffect(() => {
    const token = ++fetchRef.current;
    load(token);
  }, [load]);

  function refresh() {
    const token = ++fetchRef.current;
    load(token);
  }

  function toggleMetric(key: MetricKey) {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const pill = (active: boolean, onClick: () => void, label: string) => (
    <button onClick={onClick} key={label} style={{
      padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "500",
      border: `1px solid ${active ? "rgba(0,207,255,0.4)" : BORDER}`,
      background: active ? "rgba(0,207,255,0.09)" : "transparent",
      color: active ? ACCENT : MUTED, cursor: "pointer",
      fontFamily: "var(--font-outfit),sans-serif", transition: "all 0.15s",
    }}>{label}</button>
  );

  const activeMetrics = ALL_METRICS.filter((m) => selectedMetrics.has(m.key));
  const camps = campaigns ?? [];

  const hasAllResults = (insights?.all_results?.length ?? 0) > 0;
  const gridMetrics   = activeMetrics.filter((m) => !hasAllResults || m.key !== "results");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Filter bar ── */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "18px 22px" }}>

        {/* Período */}
        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontSize: "10px", fontWeight: "600", color: MUTED, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 8px" }}>Período</p>
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", alignItems: "center" }}>
            {DATE_PRESETS.map((d) => pill(datePreset === d.key, () => setDatePreset(d.key), d.label))}
            {datePreset === "custom" && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input type="date" value={since} onChange={(e) => setSince(e.target.value)}
                  style={{ background: "#080808", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "5px 10px", fontSize: "12px", color: TEXT, outline: "none", colorScheme: "dark", fontFamily: "var(--font-outfit),sans-serif" }} />
                <span style={{ fontSize: "12px", color: MUTED }}>até</span>
                <input type="date" value={until} onChange={(e) => setUntil(e.target.value)}
                  style={{ background: "#080808", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "5px 10px", fontSize: "12px", color: TEXT, outline: "none", colorScheme: "dark", fontFamily: "var(--font-outfit),sans-serif" }} />
              </div>
            )}
          </div>
        </div>

        {/* Métricas */}
        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontSize: "10px", fontWeight: "600", color: MUTED, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 8px" }}>Métricas</p>
          <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
            {ALL_METRICS.map((m) => pill(selectedMetrics.has(m.key), () => toggleMetric(m.key), m.label))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ paddingTop: "12px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", color: MUTED }}>
            {loading ? "Buscando dados..." : lastRefresh ? `Atualizado às ${lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}
          </span>
          <button onClick={refresh} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "7px", padding: "6px 14px", color: MUTED, fontSize: "12px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif", opacity: loading ? 0.5 : 1 }}>
            <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : undefined} /> Atualizar
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden" }}>

        <div style={{ padding: "20px 24px", borderBottom: (insights || loading) ? `1px solid ${BORDER}` : "none" }}>

          {/* Loading */}
          {loading && !insights && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Loader2 size={15} color={MUTED} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "13px", color: MUTED }}>Buscando dados do Meta Ads...</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px" }}>
                <AlertCircle size={14} color="#EF4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <p style={{ fontSize: "13px", color: "#EF4444", margin: "0 0 4px", fontWeight: "500" }}>{error}</p>
                  <p style={{ fontSize: "11px", color: "#9A9288", margin: 0 }}>
                    Verifique se o usuário do sistema tem acesso à conta de anúncios e se o token possui permissão <code style={{ color: ACCENT }}>ads_read</code>.
                    <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer"
                      style={{ color: ACCENT, textDecoration: "none", marginLeft: "6px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      Abrir Business Manager <ExternalLink size={10} />
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metrics grid */}
          {insights && !loading && (() => {
            const firstResult = insights.all_results?.[0];
            return (
              <>
                {gridMetrics.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(gridMetrics.length, 6)}, 1fr)`, gap: "10px", marginBottom: hasAllResults ? "10px" : "0" }}>
                    {gridMetrics.map((m) => {
                      const val = getVal(m.key, insights);
                      const hi  = m.key === "spend";
                      const label = (m.key === "cost_per_result" && firstResult)
                        ? `Custo / ${firstResult.label}` : m.label;
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", borderBottom: `1px solid ${BORDER}` }}>
                      {["Tipo de resultado", "Qtd.", "Custo unit."].map((h, i) => (
                        <p key={h} style={{ fontSize: "10px", color: MUTED, margin: 0, letterSpacing: "0.14em", textTransform: "uppercase", padding: "10px 14px 8px", textAlign: i === 0 ? "left" : "right", minWidth: i === 2 ? "110px" : undefined }}>{h}</p>
                      ))}
                    </div>
                    {insights.all_results.map((r, i) => (
                      <div key={r.label} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", padding: "10px 14px", borderBottom: i < insights.all_results.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                        <span style={{ fontSize: "13px", color: TEXT, fontWeight: "500" }}>{r.label}</span>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: TEXT, padding: "0 14px", textAlign: "right" }}>{r.value.toLocaleString("pt-BR")}</span>
                        <span style={{ fontSize: "13px", color: r.cost != null ? ACCENT : MUTED, minWidth: "110px", textAlign: "right", fontWeight: r.cost != null ? "600" : "400" }}>
                          {r.cost != null ? "R$ " + r.cost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          {insights === null && !loading && !error && (
            <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>Sem dados para o período selecionado.</p>
          )}
        </div>

        {/* Campaigns */}
        {!loading && (
          <div>
            <button onClick={() => setExpanded((v) => !v)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif", color: MUTED, fontSize: "12px", fontWeight: "500" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {loadingCampaigns
                  ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Carregando campanhas...</>
                  : <>{camps.length} campanha{camps.length !== 1 ? "s" : ""} ativa{camps.length !== 1 ? "s" : ""}</>
                }
              </span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expanded && camps.length > 0 && (
              <div className="r-scroll" style={{ borderTop: `1px solid ${BORDER}` }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {["Campanha", "Status", "Investimento", camps.find((c) => c.insights?.result_label)?.insights?.result_label ?? "Resultados", "Custo/Result.", "Leads", "CPL", "Clicks", "CTR"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: h === "Campanha" ? "left" : "right", fontSize: "10px", fontWeight: "600", color: MUTED, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {camps.map((camp, i) => {
                      const ins = camp.insights;
                      const money = (v: number | null) => v != null ? "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
                      const num   = (v: number | null) => v != null ? v.toLocaleString("pt-BR") : "—";
                      const pct   = (v: number | null) => v != null ? v.toFixed(2) + "%" : "—";
                      return (
                        <tr key={camp.id} style={{ borderBottom: i < camps.length - 1 ? `1px solid ${BORDER}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                          <td style={{ padding: "12px 16px", color: TEXT, maxWidth: "240px" }}>
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

            {expanded && !loadingCampaigns && camps.length === 0 && (
              <div style={{ padding: "16px 24px", borderTop: `1px solid ${BORDER}` }}>
                <p style={{ fontSize: "12px", color: MUTED, margin: 0 }}>Nenhuma campanha ativa encontrada.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
