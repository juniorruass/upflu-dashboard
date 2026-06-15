"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Row = { date: string; prospects: number; enviados: number };


function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "8px", padding: "10px 14px", fontSize: "12px" }}>
      <p style={{ color: "#777", margin: "0 0 6px" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0", fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function ProspeccaoChart({ data }: { data: Row[] }) {
  if (!data.length) return (
    <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "13px", color: "var(--up-text-dim)" }}>Sem dados de prospecção ainda.</p>
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="gProspects" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00CFFF" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#00CFFF" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gEnviados" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4ADE80" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: "11px", color: "#777", paddingTop: "8px" }} />
        <Area type="monotone" dataKey="prospects" name="Captados" stroke="#00CFFF" strokeWidth={1.8} fill="url(#gProspects)" dot={false} />
        <Area type="monotone" dataKey="enviados"  name="WA enviados" stroke="#4ADE80" strokeWidth={1.8} fill="url(#gEnviados)"  dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
