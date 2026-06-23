"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, X } from "lucide-react";

type AlertData = {
  lateCount: number;
  lateAmount: number;
  renewalsSoon: number;
};

export default function GlobalAlerts() {
  const [data, setData] = useState<AlertData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function load() {
      const [paymentsRes, clientsRes] = await Promise.all([
        fetch("/api/payments"),
        fetch("/api/clients"),
      ]);

      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const d30 = new Date(now);
      d30.setDate(d30.getDate() + 30);

      const payments: Array<{ paid_date: string | null; due_date: string; amount: number }> =
        paymentsRes.ok ? await paymentsRes.json() : [];
      const clients: Array<{ status: string; start_date: string | null }> =
        clientsRes.ok ? await clientsRes.json() : [];

      const late = payments.filter((p) => !p.paid_date && p.due_date < today);
      const lateCount = late.length;
      const lateAmount = late.reduce((s, p) => s + (p.amount || 0), 0);

      const renewalsSoon = clients.filter((c) => {
        if (c.status !== "active" || !c.start_date) return false;
        const renewal = new Date(c.start_date);
        renewal.setFullYear(renewal.getFullYear() + 1);
        return renewal >= now && renewal <= d30;
      }).length;

      setData({ lateCount, lateAmount, renewalsSoon });
    }
    load();
  }, []);

  if (dismissed || !data || (data.lateCount === 0 && data.renewalsSoon === 0)) return null;

  return (
    <div style={{
      background: "rgba(255,107,107,0.05)",
      borderBottom: "1px solid rgba(255,107,107,0.15)",
      padding: "9px 32px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "18px", flex: 1, flexWrap: "wrap" }}>
        {data.lateCount > 0 && (
          <Link
            href="/dashboard/financeiro"
            style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none", color: "#FF6B6B", fontSize: "12px", fontWeight: "600" }}
          >
            <AlertTriangle size={13} strokeWidth={2} />
            {data.lateCount} pagamento{data.lateCount !== 1 ? "s" : ""} em atraso
            {data.lateAmount > 0 && (
              <span style={{ fontWeight: "400", opacity: 0.75 }}>
                — R$ {data.lateAmount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </span>
            )}
          </Link>
        )}
        {data.lateCount > 0 && data.renewalsSoon > 0 && (
          <span style={{ color: "rgba(255,255,255,0.12)", fontSize: "14px" }}>|</span>
        )}
        {data.renewalsSoon > 0 && (
          <Link
            href="/dashboard/clientes"
            style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none", color: "#FF9500", fontSize: "12px", fontWeight: "600" }}
          >
            <Clock size={13} strokeWidth={2} />
            {data.renewalsSoon} renovação{data.renewalsSoon !== 1 ? "ões" : ""} nos próximos 30 dias
          </Link>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--up-text-label)", padding: "2px", display: "flex", alignItems: "center", flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
