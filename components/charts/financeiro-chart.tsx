"use client";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Row = { month: string; receita: number; mrr: number };


function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "8px", padding: "10px 14px", fontSize: "12px" }}>
      <p style={{ color: "#777", margin: "0 0 6px" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0", fontWeight: 600 }}>
          {p.name}: R$ {Number(p.value).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  );
}

export default function FinanceiroChart({ data }: { data: Row[] }) {
  if (!data.length) return (
    <div style={{ height: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "13px", color: "var(--up-text-dim)" }}>Sem dados financeiros ainda.</p>
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ComposedChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false}
          tickFormatter={(v) => `R$${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Legend wrapperStyle={{ fontSize: "11px", color: "#777", paddingTop: "8px" }} />
        <Bar dataKey="receita" name="Receita" fill="#4ADE80" fillOpacity={0.6} radius={[4,4,0,0]} />
        <Line type="monotone" dataKey="mrr" name="MRR" stroke="#00CFFF" strokeWidth={2} dot={{ r: 3, fill: "#00CFFF" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
