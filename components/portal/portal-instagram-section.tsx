"use client";

import { useEffect, useState } from "react";

const PINK    = "#E1306C";
const CARD    = "#0E0E0E";
const BORDER  = "rgba(255,255,255,0.06)";
const TEXT    = "#F0EDE8";
const MUTED   = "#666060";

interface Snapshot { date: string; followers_count: number; }
interface IgData {
  followers: number;
  username: string | null;
  growth_30d: number | null;
  history: Snapshot[];
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
  return n.toLocaleString("pt-BR");
}

function fmtGrowth(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toLocaleString("pt-BR")}`;
}

function fmtDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function FollowersChart({ history }: { history: Snapshot[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (history.length < 2) return null;

  const W = 600; const H = 110; const PY = 12;
  const vals = history.map((s) => s.followers_count);
  const min = Math.min(...vals);
  const max = Math.max(...vals, min + 1);
  const range = max - min || 1;

  const pts = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * W,
    y: PY + (1 - (v - min) / range) * (H - PY * 2),
  }));

  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    path += ` C ${cpx} ${pts[i - 1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  const area = `${path} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  const total = history.length;
  const showEvery = Math.max(1, Math.ceil(total / 6));

  return (
    <div style={{ position: "relative", marginTop: "16px" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: "90px", overflow: "visible" }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="ig-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PINK} stopOpacity="0.3" />
            <stop offset="100%" stopColor={PINK} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#ig-area-grad)" />
        <path d={path} fill="none" stroke={PINK} strokeWidth="2" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} style={{ cursor: "default" }}>
            <rect x={p.x - 8} y={0} width={16} height={H} fill="transparent" />
            {hovered === i && (
              <>
                <line x1={p.x} y1={0} x2={p.x} y2={H - 16} stroke={PINK} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3,3" />
                <circle cx={p.x} cy={p.y} r="5" fill={PINK} />
                <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fill={TEXT} fontWeight="700">
                  {fmt(history[i].followers_count)}
                </text>
              </>
            )}
            {hovered !== i && i % showEvery === 0 && (
              <circle cx={p.x} cy={p.y} r="3" fill={PINK} opacity="0.7" />
            )}
            {i % showEvery === 0 && (
              <text x={p.x} y={H - 1} textAnchor="middle" fontSize="9" fill={MUTED}>
                {fmtDateShort(history[i].date)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function PortalInstagramSection({ clientId }: { clientId: string }) {
  const [data, setData] = useState<IgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/instagram/${clientId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Erro ao carregar dados do Instagram"))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "18px", padding: "32px", textAlign: "center" }}>
      <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>Carregando Instagram...</p>
    </div>
  );

  if (error || !data) return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "18px", padding: "24px", textAlign: "center" }}>
      <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>Instagram em configuração.</p>
    </div>
  );

  const hasHistory = data.history.length >= 2;

  return (
    <div style={{ background: CARD, border: `1px solid rgba(225,48,108,0.2)`, borderRadius: "18px", padding: "24px 26px", position: "relative", overflow: "hidden" }}>
      {/* top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg,transparent,rgba(225,48,108,0.6),transparent)" }} />
      {/* bg glow */}
      <div style={{ position: "absolute", top: "-40px", right: "-20px", width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle, rgba(225,48,108,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "10px", color: MUTED, margin: 0, letterSpacing: "0.14em", textTransform: "uppercase" }}>Instagram</p>
              {data.username && (
                <p style={{ fontSize: "11px", color: "rgba(225,48,108,0.8)", margin: 0, fontWeight: "600" }}>@{data.username}</p>
              )}
            </div>
          </div>

          <p style={{ fontSize: "38px", fontWeight: "800", color: TEXT, margin: "8px 0 0", letterSpacing: "-0.04em", lineHeight: 1 }}>
            {fmt(data.followers)}
          </p>
          <p style={{ fontSize: "11px", color: MUTED, margin: "4px 0 0" }}>seguidores</p>
        </div>

        {data.growth_30d != null && (
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "9px", color: MUTED, margin: "0 0 4px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Últimos 30 dias</p>
            <p style={{ fontSize: "22px", fontWeight: "700", color: data.growth_30d >= 0 ? "#4ADE80" : "#FF6B6B", margin: 0, letterSpacing: "-0.02em" }}>
              {fmtGrowth(data.growth_30d)}
            </p>
          </div>
        )}
      </div>

      {hasHistory && <FollowersChart history={data.history} />}

      {!hasHistory && (
        <p style={{ fontSize: "12px", color: MUTED, margin: "16px 0 0" }}>
          O gráfico de evolução aparece após os primeiros dias de coleta.
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", paddingTop: "16px" }}>
        <div style={{ width: "16px", height: "1px", background: BORDER }} />
        <span style={{ fontSize: "9px", color: `${MUTED}80`, letterSpacing: "0.1em", textTransform: "uppercase" }}>powered by Instagram</span>
        <div style={{ width: "16px", height: "1px", background: BORDER }} />
      </div>
    </div>
  );
}
