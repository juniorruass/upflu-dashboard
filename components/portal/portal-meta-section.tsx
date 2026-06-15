"use client";

import { useEffect, useState, useCallback } from "react";

const ACCENT  = "#00CFFF";
const CARD    = "#0E0E0E";
const CARD2   = "#131313";
const TEXT    = "#F0EDE8";
const MUTED   = "#666060";
const GREEN   = "#4ADE80";
const PURPLE  = "#A78BFA";
const ORANGE  = "#FB923C";

interface MetaData {
  spend: number; impressions: number; clicks: number; ctr: number;
  reach: number; cpm: number; leads: number | null; cost_per_lead: number | null;
  roas: number | null; conversations: number | null; cost_per_conversation: number | null;
  all_results: { label: string; value: number; cost: number | null }[];
  profile_visits: number | null; cost_per_profile_visit: number | null;
  followers: number | null; cost_per_follower: number | null;
}

interface FollowerData {
  followers: number | null; cost_per_follower: number | null;
  profile_visits: number | null; cost_per_profile_visit: number | null;
  is_organic?: boolean;
}

interface DailyRow { date: string; leads: number; spend: number; }

const PRESETS = [
  { key: "today", label: "Hoje" }, { key: "yesterday", label: "Ontem" },
  { key: "last_7d", label: "7 dias" }, { key: "last_30d", label: "30 dias" },
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

// ── Bar Chart ──────────────────────────────────────────────
function LeadsBarChart({ data, preset }: { data: DailyRow[]; preset: Preset }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.leads), 1);
  const W = 600; const H = 120; const labelH = 22; const chartH = H - labelH;
  const total = data.length;
  const gap = total > 14 ? 2 : 4;
  const barW = (W - gap * (total - 1)) / total;

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100px", overflow: "visible" }} onMouseLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.85" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="barHov" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = Math.max((d.leads / max) * (chartH - 24), d.leads > 0 ? 4 : 0);
          const x = i * (barW + gap);
          const y = chartH - barH - 4;
          const isHov = hovered === i;
          const showLabel = total <= 14 || i % Math.ceil(total / 10) === 0 || i === total - 1;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} style={{ cursor: "default" }}>
              <rect x={x} y={y} width={barW} height={barH}
                fill={isHov ? "url(#barHov)" : "url(#barGrad)"} rx="3" />
              {isHov && d.leads > 0 && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">{d.leads}</text>
              )}
              {!isHov && total <= 8 && d.leads > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fill={MUTED}>{d.leads}</text>
              )}
              {showLabel && (
                <text x={x + barW / 2} y={H - 3} textAnchor="middle" fontSize="9" fill={MUTED}>{fmtDateLabel(d.date, preset)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {hovered !== null && data[hovered] && (
        <div style={{ position: "absolute", top: "4px", left: `${Math.min(Math.max((hovered / total) * 100, 10), 85)}%`, transform: "translateX(-50%)", pointerEvents: "none", zIndex: 10 }}>
          <div style={{ background: "rgba(14,14,14,0.97)", border: `1px solid rgba(0,207,255,0.3)`, borderRadius: "10px", padding: "8px 14px", whiteSpace: "nowrap", fontSize: "12px", color: TEXT, boxShadow: `0 4px 20px rgba(0,0,0,.7)` }}>
            <span style={{ color: MUTED, fontSize: "10px" }}>{data[hovered].date.slice(5).replace("-","/")} · </span>
            <span style={{ color: ACCENT, fontWeight: "700" }}>{data[hovered].leads} lead{data[hovered].leads !== 1 ? "s" : ""}</span>
            {data[hovered].spend > 0 && <span style={{ color: MUTED }}> · R$ {data[hovered].spend.toFixed(0)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Premium Metric Card ────────────────────────────────────
function MetricCard({ label, value, accent, color, icon }: { label: string; value: string; accent?: boolean; color?: string; icon?: string }) {
  const c = color ?? (accent ? ACCENT : TEXT);
  const isEmpty = value === "—";
  return (
    <div style={{
      background: accent ? `linear-gradient(135deg, rgba(0,207,255,0.06) 0%, rgba(0,207,255,0.02) 100%)` : CARD2,
      border: `1px solid ${accent ? "rgba(0,207,255,0.18)" : "var(--up-border)"}`,
      borderRadius: "14px", padding: "18px 16px", position: "relative", overflow: "hidden",
    }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg,transparent,${ACCENT}88,transparent)` }} />}
      {accent && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top left, rgba(0,207,255,0.04) 0%, transparent 60%)`, pointerEvents: "none" }} />}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <p style={{ fontSize: "9px", color: MUTED, margin: "0 0 8px", letterSpacing: "0.14em", textTransform: "uppercase", lineHeight: 1.4 }}>{label}</p>
        {icon && <span style={{ fontSize: "13px", opacity: 0.6 }}>{icon}</span>}
      </div>
      <p style={{ fontSize: isEmpty ? "16px" : "22px", fontWeight: "700", color: isEmpty ? MUTED : c, margin: 0, letterSpacing: "-0.025em" }}>{value}</p>
    </div>
  );
}

// ── Category Block (big result card) ──────────────────────
function CategoryBlock({ label, count, cost, color, icon }: { label: string; count: number; cost: number | null; color: string; icon: string }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}08 0%, transparent 60%)`,
      border: `1px solid ${color}20`,
      borderRadius: "18px", padding: "24px 26px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg,transparent,${color}60,transparent)` }} />
      <div style={{ position: "absolute", top: "-40px", left: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: `radial-gradient(circle, ${color}12 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "14px",
          background: `${color}15`, border: `1px solid ${color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", flexShrink: 0,
          boxShadow: `0 4px 16px ${color}20`,
        }}>{icon}</div>
        <div>
          <p style={{ fontSize: "10px", color: MUTED, margin: "0 0 4px", letterSpacing: "0.14em", textTransform: "uppercase" }}>{label}</p>
          <p style={{ fontSize: "32px", fontWeight: "800", color, margin: 0, letterSpacing: "-0.035em", lineHeight: 1 }}>
            {count.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>
      {cost != null && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: "9px", color: MUTED, margin: "0 0 4px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Custo unit.</p>
          <p style={{ fontSize: "20px", fontWeight: "700", color: TEXT, margin: 0, letterSpacing: "-0.02em" }}>{fmt(cost,"R$ ","",2)}</p>
        </div>
      )}
    </div>
  );
}

// ── Pulse dot ─────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: "8px", height: "8px" }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.4, animation: "portalPing 1.5s ease-in-out infinite" }} />
      <span style={{ position: "relative", borderRadius: "50%", width: "8px", height: "8px", background: color, display: "inline-block" }} />
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────
export function PortalMetaSection({ clientId }: { clientId: string }) {
  const [preset, setPreset] = useState<Preset>("last_30d");
  const [data, setData] = useState<MetaData | null>(null);
  const [followerData, setFollowerData] = useState<FollowerData | null>(null);
  const [igGrowth, setIgGrowth] = useState<number | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [portalMetrics, setPortalMetrics] = useState<string[] | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/portal/config/${clientId}`)
      .then((r) => r.json())
      .then((d) => setPortalMetrics(d.portal_metrics ?? null))
      .catch(() => setPortalMetrics(null));
  }, [clientId]);

  const show = (key: string) => portalMetrics === undefined || portalMetrics === null || portalMetrics.includes(key);

  const load = useCallback(async (p: Preset) => {
    setLoading(true);
    try {
      const [aggRes, dayRes, followRes, growthRes] = await Promise.all([
        fetch(`/api/meta/${clientId}?date_preset=${p}`),
        fetch(`/api/meta/${clientId}/daily?date_preset=${p}`),
        fetch(`/api/meta/${clientId}/followers?date_preset=${p}`),
        fetch(`/api/instagram/${clientId}/growth?date_preset=${p}`),
      ]);
      const agg = await aggRes.json();
      const day = await dayRes.json();
      const follow = await followRes.json();
      const growth = await growthRes.json();
      if (agg.error) { setError(agg.error); setData(null); setDaily([]); setFollowerData(null); setIgGrowth(null); }
      else {
        setData(agg.data ?? null); setDaily(day.data ?? []);
        setFollowerData(follow.error ? null : follow);
        setIgGrowth(growth.growth ?? null);
        setError(null);
        setLastUpdate(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
      }
    } catch { setError("Erro ao carregar dados."); }
    finally { setLoading(false); }
  }, [clientId]);

  useEffect(() => {
    load(preset);
    const interval = setInterval(() => load(preset), 60_000);
    return () => clearInterval(interval);
  }, [load, preset]);

  function changePreset(p: Preset) { setPreset(p); }

  const totalLeads = daily.reduce((s, d) => s + d.leads, 0);
  const adsFollowers = (followerData?.followers ?? 0) > 0 ? followerData!.followers! : (data?.followers ?? null);
  const fl  = adsFollowers ?? igGrowth;
  const flc = (followerData?.followers ?? 0) > 0 ? followerData!.cost_per_follower : data?.cost_per_follower ?? null;
  const pv  = (followerData?.profile_visits ?? 0) > 0 ? followerData!.profile_visits! : (data?.profile_visits ?? 0);
  const pvc = (followerData?.profile_visits ?? 0) > 0 ? followerData!.cost_per_profile_visit : data?.cost_per_profile_visit ?? null;

  return (
    <div>
      <style>{`
        @keyframes portalPing { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(2.2);opacity:0} }
        @keyframes portalSpin { to{transform:rotate(360deg)} }
        @keyframes portalFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Controls ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "3px", background: "var(--up-border)", border: `1px solid var(--up-border)`, borderRadius: "12px", padding: "4px" }}>
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => changePreset(p.key)} style={{
              background: preset === p.key ? ACCENT : "transparent",
              border: "none", borderRadius: "8px", padding: "7px 16px",
              fontSize: "11px", fontWeight: "600",
              color: preset === p.key ? "#060606" : MUTED,
              cursor: "pointer", transition: "all .2s",
              letterSpacing: "0.02em",
            }}>{p.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <PulseDot color={error ? "#FF6B6B" : GREEN} />
            <span style={{ fontSize: "11px", color: MUTED, letterSpacing: "0.04em" }}>Ao vivo</span>
          </div>
          {lastUpdate && (
            <button onClick={() => load(preset)} disabled={loading} style={{
              background: "var(--up-border)", border: `1px solid var(--up-border)`,
              borderRadius: "8px", padding: "5px 12px", fontSize: "10px",
              color: MUTED, cursor: loading ? "default" : "pointer", opacity: loading ? 0.5 : 1,
              letterSpacing: "0.04em", transition: "opacity .15s",
            }}>
              {loading ? "..." : `↻ ${lastUpdate}`}
            </button>
          )}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && !data && (
        <div style={{ background: CARD, border: `1px solid var(--up-border)`, borderRadius: "18px", padding: "48px", textAlign: "center" }}>
          <div style={{ width: "28px", height: "28px", border: `2px solid var(--up-border)`, borderTopColor: ACCENT, borderRadius: "50%", animation: "portalSpin 1s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>Carregando dados da Meta...</p>
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div style={{ background: "rgba(255,107,107,0.04)", border: "1px solid rgba(255,107,107,0.12)", borderRadius: "18px", padding: "26px 28px" }}>
          <p style={{ fontSize: "14px", color: "#FF6B6B", margin: "0 0 6px", fontWeight: "600" }}>Dados em configuração</p>
          <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>As métricas da Meta Ads estarão disponíveis em breve.</p>
        </div>
      )}

      {/* ── Content ── */}
      {!error && data && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", animation: "portalFade .4s ease both" }}>

          {/* Leads Chart */}
          {show("leads_chart") && daily.length > 0 && (
            <div style={{ background: CARD, border: `1px solid var(--up-border)`, borderRadius: "18px", padding: "22px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-60px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT}08 0%, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <p style={{ fontSize: "10px", color: MUTED, margin: "0 0 6px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Leads no período</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <p style={{ fontSize: "36px", fontWeight: "800", color: ACCENT, margin: 0, letterSpacing: "-0.04em", lineHeight: 1 }}>{totalLeads}</p>
                    {totalLeads > 0 && <span style={{ fontSize: "12px", color: `${ACCENT}80`, fontWeight: "600" }}>leads</span>}
                  </div>
                </div>
                <span style={{ fontSize: "10px", color: MUTED, background: "var(--up-border)", border: `1px solid var(--up-border)`, borderRadius: "6px", padding: "4px 10px" }}>
                  {PRESETS.find((p) => p.key === preset)?.label}
                </span>
              </div>
              <LeadsBarChart data={daily} preset={preset} />
            </div>
          )}

          {/* Leads CategoryBlock */}
          {show("leads") && (data.leads != null || data.cost_per_lead != null) && (
            <CategoryBlock label="Leads gerados" count={data.leads ?? 0} cost={data.cost_per_lead} color={ACCENT} icon="🎯" />
          )}

          {/* Conversas */}
          {show("conversations") && data.conversations != null && data.conversations > 0 && (
            <CategoryBlock label="Conversas por mensagem" count={data.conversations} cost={data.cost_per_conversation} color={GREEN} icon="💬" />
          )}

          {/* Visitas ao perfil */}
          {show("profile_visits") && pv > 0 && (
            <CategoryBlock label="Visitas ao perfil" count={pv} cost={pvc} color={ORANGE} icon="👁" />
          )}

          {/* Seguidores ganhos no período */}
          {show("followers") && fl != null && fl > 0 && (
            <CategoryBlock
              label={adsFollowers != null ? "Seguidores adquiridos" : "Seguidores ganhos"}
              count={fl}
              cost={adsFollowers != null ? flc : null}
              color={PURPLE}
              icon="👥"
            />
          )}

          {/* Métricas Gerais */}
          {(() => {
            const items: { key: string; label: string; value: string; accent?: boolean; color?: string; icon?: string }[] = [];
            if (show("spend"))       items.push({ key:"spend",       label:"Investimento",  value: fmt(data.spend,"R$ ","",0),    accent:true, icon:"💰" });
            if (show("roas"))        items.push({ key:"roas",        label:"ROAS",           value: fmt(data.roas,"","x",2),       color: data.roas != null && data.roas >= 2 ? GREEN : TEXT, icon:"📈" });
            if (show("followers"))   items.push({ key:"followers",   label: adsFollowers != null ? "Seg. adquiridos" : "Seg. ganhos", value: fmt(fl,"","",0), icon:"👥" });
            if (show("clicks"))      items.push({ key:"clicks",      label:"Cliques",        value: fmt(data.clicks),              icon:"🖱️" });
            if (show("ctr"))         items.push({ key:"ctr",         label:"CTR",            value: fmt(data.ctr,"","%",2),        icon:"%" });
            if (show("impressions")) items.push({ key:"impressions", label:"Impressões",     value: fmt(data.impressions),         icon:"👁" });
            if (show("reach"))       items.push({ key:"reach",       label:"Alcance",        value: fmt(data.reach),               icon:"📡" });
            if (!items.length) return null;
            const cols = Math.min(items.length, 3);
            return (
              <div>
                <p style={{ fontSize: "9px", color: MUTED, letterSpacing: "0.18em", textTransform: "uppercase", margin: "4px 0 12px", fontWeight: "700" }}>Métricas gerais</p>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "10px" }}>
                  {items.map((m) => <MetricCard key={m.key} label={m.label} value={m.value} accent={m.accent} color={m.color} icon={m.icon} />)}
                </div>
              </div>
            );
          })()}

          {/* Rodapé */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", paddingTop: "4px" }}>
            <div style={{ width: "16px", height: "1px", background: "var(--up-border)" }} />
            <span style={{ fontSize: "9px", color: `${MUTED}80`, letterSpacing: "0.1em", textTransform: "uppercase" }}>powered by Meta Ads</span>
            <div style={{ width: "16px", height: "1px", background: "var(--up-border)" }} />
          </div>

        </div>
      )}
    </div>
  );
}
