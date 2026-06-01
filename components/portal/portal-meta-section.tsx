"use client";

import { useEffect, useState, useCallback } from "react";

const ACCENT = "#00CFFF";
const CARD = "#111111";
const CARD2 = "#161616";
const BORDER = "rgba(255,255,255,0.07)";
const TEXT = "#F0EDE8";
const MUTED = "#777068";
const GREEN = "#4ADE80";
const PURPLE = "#A78BFA";
const ORANGE = "#FB923C";

interface MetaData {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  reach: number;
  cpm: number;
  leads: number | null;
  cost_per_lead: number | null;
  roas: number | null;
  conversations: number | null;
  cost_per_conversation: number | null;
  all_results: { label: string; value: number; cost: number | null }[];
  profile_visits: number | null;
  cost_per_profile_visit: number | null;
  followers: number | null;
  cost_per_follower: number | null;
}

interface FollowerData {
  followers: number | null;
  cost_per_follower: number | null;
  profile_visits: number | null;
  cost_per_profile_visit: number | null;
}

interface DailyRow {
  date: string;
  leads: number;
  spend: number;
}

const PRESETS = [
  { key: "today",     label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "last_7d",   label: "7 dias" },
  { key: "last_30d",  label: "30 dias" },
] as const;
type Preset = (typeof PRESETS)[number]["key"];

function fmt(n: number | null | undefined, prefix = "", suffix = "", dec = 0): string {
  if (n == null || isNaN(n) || !isFinite(n)) return "—";
  return `${prefix}${n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec })}${suffix}`;
}

function fmtDateLabel(iso: string, preset: Preset): string {
  const [, m, d] = iso.split("-");
  if (preset === "last_7d") {
    const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    return days[new Date(iso + "T12:00:00").getDay()];
  }
  return `${d}/${m}`;
}

// ── Bar chart ──────────────────────────────────────────────
function LeadsBarChart({ data, preset }: { data: DailyRow[]; preset: Preset }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.leads), 1);
  const W = 600; const H = 110; const labelH = 20; const chartH = H - labelH;
  const total = data.length;
  const gap = total > 14 ? 2 : 4;
  const barW = (W - gap * (total - 1)) / total;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "90px", overflow: "visible" }}
        onMouseLeave={() => setHovered(null)}
      >
        {data.map((d, i) => {
          const barH = Math.max((d.leads / max) * (chartH - 24), d.leads > 0 ? 4 : 0);
          const x = i * (barW + gap);
          const y = chartH - barH - 4;
          const isHov = hovered === i;
          const showLabel = total <= 14 || i % Math.ceil(total / 10) === 0 || i === total - 1;

          return (
            <g key={i} onMouseEnter={() => setHovered(i)} style={{ cursor: "default" }}>
              <rect x={x} y={y} width={barW} height={barH} fill={isHov ? ACCENT : "rgba(0,207,255,0.35)"} rx="3" style={{ transition: "fill .15s" }} />
              {isHov && d.leads > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="10" fill={ACCENT} fontWeight="700">{d.leads}</text>
              )}
              {!isHov && total <= 10 && d.leads > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill={MUTED}>{d.leads}</text>
              )}
              {showLabel && (
                <text x={x + barW / 2} y={H - 2} textAnchor="middle" fontSize="9" fill={MUTED}>{fmtDateLabel(d.date, preset)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {hovered !== null && data[hovered] && (
        <div style={{ position: "absolute", top: 0, left: `${(hovered / total) * 100}%`, transform: "translateX(-50%)", pointerEvents: "none", zIndex: 10 }}>
          <div style={{ background: "#1a1a1a", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "6px 12px", whiteSpace: "nowrap", fontSize: "11px", color: TEXT, boxShadow: "0 4px 16px rgba(0,0,0,.4)" }}>
            <span style={{ color: MUTED }}>{data[hovered].date.slice(5).replace("-", "/")} · </span>
            <span style={{ color: ACCENT, fontWeight: "700" }}>{data[hovered].leads} leads</span>
            {data[hovered].spend > 0 && <span style={{ color: MUTED }}> · {fmt(data[hovered].spend, "R$ ","",0)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Metric card ────────────────────────────────────────────
function MetricCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: CARD2, border: `1px solid ${accent ? "rgba(0,207,255,0.2)" : BORDER}`, borderRadius: "12px", padding: "16px 14px", position: "relative", overflow: "hidden" }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,${ACCENT},transparent)` }} />}
      <p style={{ fontSize: "10px", color: MUTED, margin: "0 0 5px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: "20px", fontWeight: "700", color: accent ? ACCENT : TEXT, margin: 0, letterSpacing: "-0.02em" }}>{value}</p>
    </div>
  );
}

// ── Special category block ─────────────────────────────────
function CategoryBlock({ label, count, cost, color, icon }: { label: string; count: number; cost: number | null; color: string; icon: string }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${color}22`, borderRadius: "14px", padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <p style={{ fontSize: "10px", color: MUTED, margin: "0 0 3px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</p>
          <p style={{ fontSize: "24px", fontWeight: "700", color, margin: 0, letterSpacing: "-0.03em" }}>{count.toLocaleString("pt-BR")}</p>
        </div>
      </div>
      {cost != null && (
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "10px", color: MUTED, margin: "0 0 3px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Custo unit.</p>
          <p style={{ fontSize: "18px", fontWeight: "700", color: TEXT, margin: 0 }}>{fmt(cost, "R$ ","",2)}</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export function PortalMetaSection({ clientId }: { clientId: string }) {
  const [preset, setPreset] = useState<Preset>("last_30d");
  const [data, setData] = useState<MetaData | null>(null);
  const [followerData, setFollowerData] = useState<FollowerData | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [portalMetrics, setPortalMetrics] = useState<string[] | null | undefined>(undefined);

  // Busca config de métricas visíveis direto da API (sempre fresco)
  useEffect(() => {
    fetch(`/api/portal/config/${clientId}`)
      .then((r) => r.json())
      .then((d) => setPortalMetrics(d.portal_metrics ?? null))
      .catch(() => setPortalMetrics(null));
  }, [clientId]);

  // undefined = ainda carregando config; null = mostrar tudo; array = filtrado
  const show = (key: string) => portalMetrics === undefined || !portalMetrics || portalMetrics.includes(key);

  const load = useCallback(async (p: Preset) => {
    setLoading(true);
    try {
      const [aggRes, dayRes, followRes] = await Promise.all([
        fetch(`/api/meta/${clientId}?date_preset=${p}`),
        fetch(`/api/meta/${clientId}/daily?date_preset=${p}`),
        fetch(`/api/meta/${clientId}/followers?date_preset=${p}`),
      ]);
      const agg = await aggRes.json();
      const day = await dayRes.json();
      const follow = await followRes.json();

      if (agg.error) {
        setError(agg.error);
        setData(null);
        setDaily([]);
        setFollowerData(null);
      } else {
        setData(agg.data ?? null);
        setDaily(day.data ?? []);
        setFollowerData(follow.error ? null : follow);
        setError(null);
        setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch {
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load(preset);
    const interval = setInterval(() => load(preset), 60_000);
    return () => clearInterval(interval);
  }, [load, preset]);

  function changePreset(p: Preset) {
    setPreset(p);
    load(p);
  }

  const totalLeads = daily.reduce((s, d) => s + d.leads, 0);

  // Resolve followers combining followerData + main data
  const fl = (followerData?.followers ?? 0) > 0 ? followerData!.followers! : (data?.followers ?? null);
  const flc = (followerData?.followers ?? 0) > 0 ? followerData!.cost_per_follower : data?.cost_per_follower ?? null;
  const pv = (followerData?.profile_visits ?? 0) > 0 ? followerData!.profile_visits! : (data?.profile_visits ?? 0);
  const pvc = (followerData?.profile_visits ?? 0) > 0 ? followerData!.cost_per_profile_visit : data?.cost_per_profile_visit ?? null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        {/* Preset buttons */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "3px" }}>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => changePreset(p.key)}
              style={{ background: preset === p.key ? ACCENT : "transparent", border: "none", borderRadius: "7px", padding: "6px 14px", fontSize: "11px", fontWeight: "600", color: preset === p.key ? "#080808" : MUTED, cursor: "pointer", transition: "all .15s", letterSpacing: "0.02em" }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Status + refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: error ? "#FF6B6B" : GREEN, display: "inline-block", boxShadow: `0 0 6px ${error ? "#FF6B6B" : GREEN}88`, animation: "mpulse 2s ease-in-out infinite" }} />
            <style>{`@keyframes mpulse{0%,100%{opacity:1}50%{opacity:.5}} @keyframes mspin{to{transform:rotate(360deg)}}`}</style>
            <span style={{ fontSize: "10px", color: MUTED }}>Ao vivo</span>
          </div>
          {lastUpdate && (
            <button
              onClick={() => load(preset)}
              disabled={loading}
              style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "4px 10px", fontSize: "10px", color: MUTED, cursor: loading ? "default" : "pointer", opacity: loading ? 0.5 : 1 }}
            >
              {loading ? "..." : `↻ ${lastUpdate}`}
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && !data && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "32px", textAlign: "center" }}>
          <div style={{ width: "22px", height: "22px", border: `2px solid ${BORDER}`, borderTopColor: ACCENT, borderRadius: "50%", animation: "mspin 1s linear infinite", margin: "0 auto 10px" }} />
          <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>Carregando dados da Meta...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ background: "rgba(255,107,107,0.05)", border: "1px solid rgba(255,107,107,0.12)", borderRadius: "14px", padding: "22px 24px" }}>
          <p style={{ fontSize: "13px", color: "#FF6B6B", margin: "0 0 4px", fontWeight: "600" }}>Dados em configuração</p>
          <p style={{ fontSize: "12px", color: MUTED, margin: 0 }}>As métricas da Meta Ads estarão disponíveis em breve.</p>
        </div>
      )}

      {/* Content */}
      {!error && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Leads chart */}
          {show("leads_chart") && daily.length > 0 && (
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <p style={{ fontSize: "10px", color: MUTED, margin: "0 0 3px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Leads no período</p>
                  <p style={{ fontSize: "22px", fontWeight: "700", color: ACCENT, margin: 0, letterSpacing: "-0.02em" }}>{totalLeads}</p>
                </div>
                <span style={{ fontSize: "10px", color: MUTED }}>{PRESETS.find((p) => p.key === preset)?.label}</span>
              </div>
              <LeadsBarChart data={daily} preset={preset} />
            </div>
          )}

          {/* ── Leads (principal) ─────────────────────────── */}
          {show("leads") && (data.leads != null || data.cost_per_lead != null) && (
            <CategoryBlock
              label="Leads"
              count={data.leads ?? 0}
              cost={data.cost_per_lead}
              color={ACCENT}
              icon="🎯"
            />
          )}

          {/* ── Conversa por mensagem ─────────────────────── */}
          {show("conversations") && data.conversations != null && data.conversations > 0 && (
            <CategoryBlock
              label="Conversa por mensagem"
              count={data.conversations}
              cost={data.cost_per_conversation}
              color={GREEN}
              icon="💬"
            />
          )}

          {/* ── Visitas ao perfil ─────────────────────────── */}
          {show("profile_visits") && pv > 0 && (
            <CategoryBlock label="Visitas ao perfil" count={pv} cost={pvc} color={ORANGE} icon="👁" />
          )}

          {/* ── Seguidores ────────────────────────────────── */}
          {show("followers") && fl != null && fl > 0 && (
            <CategoryBlock label="Novos seguidores" count={fl} cost={flc} color={PURPLE} icon="👥" />
          )}

          {/* ── Métricas gerais ───────────────────────────── */}
          {(() => {
            const generalMetrics: { key: string; label: string; value: string; accent?: boolean }[] = [];
            if (show("spend"))      generalMetrics.push({ key: "spend",      label: "Investimento", value: fmt(data.spend, "R$ ","",0),    accent: true });
            if (show("roas"))       generalMetrics.push({ key: "roas",       label: "ROAS",          value: fmt(data.roas, "","x",2),       accent: data.roas != null && data.roas >= 2 });
            if (show("followers"))  generalMetrics.push({ key: "followers",  label: "Seguidores",    value: fmt(fl, "","",0) });
            if (show("clicks"))     generalMetrics.push({ key: "clicks",     label: "Cliques",       value: fmt(data.clicks) });
            if (show("ctr"))        generalMetrics.push({ key: "ctr",        label: "CTR",           value: fmt(data.ctr, "","%",2) });
            if (show("impressions"))generalMetrics.push({ key: "impressions",label: "Impressões",    value: fmt(data.impressions) });
            if (show("reach"))      generalMetrics.push({ key: "reach",      label: "Alcance",       value: fmt(data.reach) });
            if (generalMetrics.length === 0) return null;
            return (
              <div>
                <p style={{ fontSize: "10px", color: MUTED, letterSpacing: "0.14em", textTransform: "uppercase", margin: "8px 0 10px", fontWeight: "600" }}>Métricas gerais</p>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(generalMetrics.length, 3)}, 1fr)`, gap: "8px" }}>
                  {generalMetrics.map((m) => (
                    <MetricCard key={m.key} label={m.label} value={m.value} accent={m.accent} />
                  ))}
                </div>
              </div>
            );
          })()}

        </div>
      )}
    </div>
  );
}
