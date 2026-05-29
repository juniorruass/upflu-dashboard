"use client";

import { useState } from "react";
import { Zap } from "lucide-react";

export default function BulkPaymentsButton({ activeCount }: { activeCount: number }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  async function generate() {
    if (!confirm(`Gerar cobranças mensais para ${activeCount} cliente(s) ativo(s) que ainda não têm pagamento este mês?`)) return;
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/payments/bulk", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setResult(data);
      // Reload page to refresh payments table
      setTimeout(() => window.location.reload(), 1200);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {result && (
        <span style={{ fontSize: "12px", color: result.created > 0 ? "#4CAF50" : "#777068" }}>
          {result.created > 0 ? `${result.created} cobrança(s) criada(s)` : "Todos já têm cobrança este mês"}
          {result.skipped > 0 ? ` · ${result.skipped} já existia(m)` : ""}
        </span>
      )}
      <button
        onClick={generate}
        disabled={loading || activeCount === 0}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "12px", fontWeight: "600", padding: "7px 14px",
          borderRadius: "6px", border: "1px solid rgba(0,207,255,0.3)",
          background: "rgba(0,207,255,0.07)", color: "#00CFFF",
          cursor: loading || activeCount === 0 ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: loading || activeCount === 0 ? 0.5 : 1,
          transition: "all 0.15s",
        }}
      >
        <Zap size={13} strokeWidth={2} />
        {loading ? "Gerando..." : "Gerar cobranças do mês"}
      </button>
    </div>
  );
}
