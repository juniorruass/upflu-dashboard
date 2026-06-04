"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type StatusRow  = { status: string; total: number };
type MrrRow     = { name: string; mrr: number };

const BORDER = "rgba(255,255,255,0.07)";
const STATUS_COLORS: Record<string, string> = {
  active:     "#4ADE80",
  onboarding: "#00CFFF",
  paused:     "#F0B429",
  ended:      "#FF6B6B",
};
const STATUS_LABELS: Record<string, string> = {
  active:     "Ativo",
  onboarding: "Onboarding",
  paused:     "Pausado",
  ended:      "Encerrado",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px 14px", fontSize: "12px" }}>
      <p style={{ color: "#777", margin: "0 0 4px" }}>{label}</p>
      <p style={{ color: payload[0].color, margin: 0, fontWeight: 600 }}>{payload[0].value}</p>
    </div>
  );
}

export default function ClientesChart({ statusData, mrrData }: { statusData: StatusRow[]; mrrData: MrrRow[] }) {
  const hasStatus = statusData.length > 0;
  const hasMrr    = mrrData.length > 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      {/* Status */}
      <div>
        <p style={{ fontSize: "11px", color: "#555", margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Por status</p>
        {!hasStatus ? (
          <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: "12px", color: "#555" }}>Sem dados</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={statusData.map(d => ({ ...d, label: STATUS_LABELS[d.status] ?? d.status }))} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="total" radius={[4,4,0,0]}>
                {statusData.map((d) => (
                  <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? "#00CFFF"} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* MRR por cliente */}
      <div>
        <p style={{ fontSize: "11px", color: "#555", margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>MRR por cliente</p>
        {!hasMrr ? (
          <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontSize: "12px", color: "#555" }}>Sem dados</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={mrrData} layout="vertical" margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="mrr" fill="#00CFFF" fillOpacity={0.75} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
