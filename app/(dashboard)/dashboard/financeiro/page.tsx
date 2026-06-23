import { createAdminClient } from "@/lib/supabase";
import Header from "@/components/header";
import { TrendingUp, Users, DollarSign } from "lucide-react";
import PaymentsSection from "@/components/financeiro/payments-section";
import ExpensesSection from "@/components/financeiro/expenses-section";
import BulkPaymentsButton from "@/components/financeiro/bulk-payments-button";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACCENT = "#00CFFF";
const BG_CARD = "#111111";

type Client = {
  id: string;
  name: string;
  segment: string;
  monthly_value: number;
  status: string;
  start_date: string | null;
};

type PaymentRow = {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
};

function currency(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function pct(n: number) { return `${n.toFixed(1)}%`; }
function formatMonth(yyyyMM: string) {
  const [year, month] = yyyyMM.split("-");
  const names = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${names[parseInt(month) - 1]}/${year.slice(2)}`;
}

async function getData() {
  const supabase = createAdminClient();
  const todayStr = new Date().toISOString().split("T")[0];

  const [clientsRes, paymentsRes, expensesRes] = await Promise.all([
    supabase.from("clients").select("id, name, segment, monthly_value, status, start_date"),
    supabase.from("payments").select("id, amount, due_date, paid_date"),
    supabase.from("expenses").select("id, amount, due_date, paid_date, type"),
  ]);

  const clients: Client[] = clientsRes.data ?? [];
  const allPayments: PaymentRow[] = paymentsRes.data ?? [];
  const allExpenses = expensesRes.data ?? [];

  const pendingPayments = allPayments.filter(p => !p.paid_date && p.due_date >= todayStr);
  const latePayments    = allPayments.filter(p => !p.paid_date && p.due_date < todayStr);
  const paidThisMonth   = allPayments.filter(p => p.paid_date?.startsWith(todayStr.slice(0, 7)));

  const pendingAmount       = pendingPayments.reduce((s, p) => s + p.amount, 0);
  const lateAmount          = latePayments.reduce((s, p) => s + p.amount, 0);
  const paidThisMonthAmount = paidThisMonth.reduce((s, p) => s + p.amount, 0);

  const active  = clients.filter(c => c.status === "active");
  const onboard = clients.filter(c => c.status === "onboarding");
  const churned = clients.filter(c => c.status === "ended" || c.status === "paused");
  const leads   = clients.filter(c => c.status === "apresentacao" || c.status === "captado");

  const mrr         = active.reduce((s, c) => s + (c.monthly_value || 0), 0);
  const arr         = mrr * 12;
  const ticketMedio = active.length > 0 ? mrr / active.length : 0;
  const ltv         = ticketMedio * 12;
  const totalEver   = active.length + onboard.length + churned.length;
  const churnRate   = totalEver > 0 ? (churned.length / totalEver) * 100 : 0;

  // Last 6 months — MRR chart from PAID payments
  const now = new Date();
  const last6: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const mrrByMonth = last6.map(month => {
    const received = allPayments
      .filter(p => p.paid_date?.startsWith(month))
      .reduce((s, p) => s + p.amount, 0);
    return { month, label: formatMonth(month), received };
  });
  const maxMrr = Math.max(...mrrByMonth.map(r => r.received), 1);

  // Receivables forecast: next 90 days grouped by bucket
  const d30 = new Date(now); d30.setDate(d30.getDate() + 30);
  const d60 = new Date(now); d60.setDate(d60.getDate() + 60);
  const d90 = new Date(now); d90.setDate(d90.getDate() + 90);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const futurePayments = allPayments.filter(p => !p.paid_date && p.due_date >= todayStr && p.due_date <= fmt(d90));

  const forecast = [
    { label: "Próximos 30 dias", amount: futurePayments.filter(p => p.due_date <= fmt(d30)).reduce((s, p) => s + p.amount, 0) },
    { label: "31–60 dias",       amount: futurePayments.filter(p => p.due_date > fmt(d30) && p.due_date <= fmt(d60)).reduce((s, p) => s + p.amount, 0) },
    { label: "61–90 dias",       amount: futurePayments.filter(p => p.due_date > fmt(d60) && p.due_date <= fmt(d90)).reduce((s, p) => s + p.amount, 0) },
  ];

  const topClients = [...active]
    .sort((a, b) => (b.monthly_value || 0) - (a.monthly_value || 0))
    .slice(0, 5);

  // Expenses summary
  const expensePending = allExpenses.filter(e => !e.paid_date && e.due_date >= todayStr).reduce((s, e) => s + e.amount, 0);
  const taxPending     = allExpenses.filter(e => !e.paid_date && e.type === "tax").reduce((s, e) => s + e.amount, 0);

  // Net (MRR - expenses pending)
  const netMRR = mrr - expensePending;

  // Average lifetime of active clients (from start_date to today)
  const withDate = active.filter((c) => c.start_date);
  const avgLifetimeDays = withDate.length > 0
    ? Math.round(withDate.reduce((s, c) => {
        return s + Math.floor((now.getTime() - new Date(c.start_date!).getTime()) / 86400000);
      }, 0) / withDate.length)
    : 0;
  const avgLifetimeMonths = Math.round(avgLifetimeDays / 30);

  return {
    mrr, arr, ticketMedio, ltv, netMRR, avgLifetimeMonths,
    activeCount: active.length, onboardCount: onboard.length,
    churnedCount: churned.length, leadCount: leads.length,
    churnRate, mrrByMonth, maxMrr, topClients,
    totalClients: clients.length,
    pendingAmount, lateAmount, lateCount: latePayments.length,
    paidThisMonthAmount, forecast,
    expensePending, taxPending,
  };
}

export default async function FinanceiroPage() {
  const d = await getData();

  return (
    <>
      <Header title="Painel Financeiro" />

      <style>{`
        .fin-pad { padding: 40px 40px 60px; }
        .fin-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 14px; }
        .fin-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 14px; }
        .fin-grid-chart { display: grid; grid-template-columns: 1fr 300px; gap: 14px; margin-bottom: 14px; }
        .fin-grid-health { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 14px; }
        .fin-kpi-val { font-size: 28px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; margin: 0 0 4px; }
        .fin-divider { display: flex; align-items: center; gap: 16px; margin: 20px 0 14px; }
        .fin-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.07); }
        .fin-divider-label { font-size: 10px; font-weight: 500; color: #777068; letter-spacing: 0.2em; text-transform: uppercase; white-space: nowrap; }
        /* Bar tooltip */
        [data-tooltip] { position: relative; cursor: default; }
        [data-tooltip]:hover::after {
          content: attr(data-tooltip);
          position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%);
          background: #1C1C1C; border: 1px solid rgba(255,255,255,0.12);
          color: #F0EDE8; font-size: 11px; font-weight: 600; padding: 5px 10px; border-radius: 6px;
          white-space: nowrap; z-index: 100; pointer-events: none;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        [data-tooltip]:hover::before {
          content: '';
          position: absolute; bottom: calc(100% + 2px); left: 50%; transform: translateX(-50%);
          border: 5px solid transparent; border-top-color: rgba(255,255,255,0.12);
          z-index: 100; pointer-events: none;
        }
        @media (max-width: 900px) {
          .fin-pad { padding: 20px 16px 48px; }
          .fin-grid-4 { grid-template-columns: 1fr 1fr; gap: 10px; }
          .fin-grid-3 { grid-template-columns: 1fr; gap: 10px; }
          .fin-grid-health { grid-template-columns: 1fr 1fr; gap: 10px; }
          .fin-grid-chart { grid-template-columns: 1fr; }
          .fin-kpi-val { font-size: 22px !important; }
        }
      `}</style>

      <div className="fin-pad" style={{ flex: 1 }}>

        {/* KPIs row 1 — receita */}
        <div className="fin-grid-4">
          {[
            { label: "MRR",          value: currency(d.mrr),         sub: "receita mensal recorrente", accent: true,  icon: DollarSign },
            { label: "ARR",          value: currency(d.arr),         sub: "projeção anual",             accent: false, icon: TrendingUp },
            { label: "MRR Líquido",  value: currency(d.netMRR),      sub: "MRR menos despesas pendentes", accent: false, warn: d.netMRR < 0, icon: DollarSign },
            { label: "Ticket médio", value: currency(d.ticketMedio), sub: "por cliente ativo",          accent: false, icon: Users },
          ].map(k => (
            <div key={k.label} style={{ background: BG_CARD, border: `1px solid ${k.warn ? "rgba(255,107,107,0.2)" : "var(--up-border)"}`, borderRadius: "10px", padding: "24px", position: "relative", overflow: "hidden" }}>
              {k.accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />}
              {k.warn && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(255,107,107,0.6), transparent)" }} />}
              <p style={{ fontSize: "10px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>{k.label}</p>
              <p className="fin-kpi-val" style={{ color: k.accent ? ACCENT : k.warn ? "#FF6B6B" : "#F0EDE8" }}>{k.value}</p>
              <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: 0, fontWeight: "300" }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* KPIs row 2 — saúde */}
        <div className="fin-grid-health" style={{ marginBottom: "28px" }}>
          {[
            { label: "LTV estimado",       value: currency(d.ltv),                                sub: "projeção 12 meses/cliente",    warn: false },
            { label: "Churn rate",         value: pct(d.churnRate),                               sub: `${d.churnedCount} cancelamentos`, warn: d.churnRate > 10 },
            { label: "Clientes ativos",    value: String(d.activeCount),                          sub: `${d.totalClients} no total`,   warn: false },
            { label: "Tempo médio ativo",  value: d.avgLifetimeMonths > 0 ? `${d.avgLifetimeMonths} ${d.avgLifetimeMonths === 1 ? "mês" : "meses"}` : "—", sub: "média dos clientes ativos", warn: false },
          ].map(k => (
            <div key={k.label} style={{ background: BG_CARD, border: `1px solid ${k.warn ? "rgba(255,80,80,0.18)" : "var(--up-border)"}`, borderRadius: "10px", padding: "24px", position: "relative", overflow: "hidden" }}>
              {k.warn && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(255,80,80,0.6), transparent)" }} />}
              <p style={{ fontSize: "10px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>{k.label}</p>
              <p className="fin-kpi-val" style={{ color: k.warn ? "#FF6B6B" : "#F0EDE8" }}>{k.value}</p>
              <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: 0, fontWeight: "300" }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* MRR Chart + Top clients */}
        <div className="fin-grid-chart">
          {/* MRR bar chart */}
          <div style={{ background: BG_CARD, border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "28px" }}>
            <p style={{ fontSize: "11px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 24px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Receita recebida — últimos 6 meses
            </p>
            {d.mrrByMonth.every(r => r.received === 0) ? (
              <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: "13px", color: "var(--up-text-dim)", margin: 0 }}>Nenhum pagamento registrado ainda.</p>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "160px" }}>
                {d.mrrByMonth.map(r => {
                  const hp = d.maxMrr > 0 ? (r.received / d.maxMrr) * 100 : 0;
                  return (
                    <div key={r.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                      <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                        <div data-tooltip={currency(r.received)} style={{
                          width: "100%",
                          height: `${Math.max(hp, r.received > 0 ? 4 : 0)}%`,
                          background: r.received > 0 ? `linear-gradient(180deg, ${ACCENT} 0%, rgba(0,207,255,0.35) 100%)` : "rgba(255,255,255,0.04)",
                          borderRadius: "4px 4px 0 0", minHeight: r.received > 0 ? "4px" : "2px",
                        }} />
                      </div>
                      <p style={{ fontSize: "10px", color: "var(--up-text-label)", margin: 0, whiteSpace: "nowrap" }}>{r.label}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid var(--up-border)` }}>
              <p style={{ fontSize: "10px", color: "var(--up-text-label)", margin: "0 0 2px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Total recebido (6 meses)</p>
              <p style={{ fontSize: "20px", fontWeight: "700", color: "var(--up-text)", margin: 0, letterSpacing: "-0.03em" }}>
                {currency(d.mrrByMonth.reduce((s, r) => s + r.received, 0))}
              </p>
            </div>
          </div>

          {/* Top clients */}
          <div style={{ background: BG_CARD, border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "28px" }}>
            <p style={{ fontSize: "11px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 20px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Top clientes (MRR)
            </p>
            {d.topClients.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--up-text-label)", margin: 0 }}>Nenhum cliente ativo.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {d.topClients.map((c, i) => {
                  const share = d.mrr > 0 ? (c.monthly_value / d.mrr) * 100 : 0;
                  return (
                    <div key={c.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", color: "var(--up-text-label)", fontWeight: "600", minWidth: "14px" }}>#{i + 1}</span>
                          <span style={{ fontSize: "13px", color: "var(--up-text)", fontWeight: "500" }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: "13px", color: ACCENT, fontWeight: "600" }}>{currency(c.monthly_value || 0)}</span>
                      </div>
                      <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px" }}>
                        <div style={{ height: "100%", width: `${share}%`, background: ACCENT, borderRadius: "2px", opacity: 0.6 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Forecast */}
        <div className="fin-divider">
          <div className="fin-divider-line" />
          <span className="fin-divider-label">Previsão de recebimentos</span>
          <div className="fin-divider-line" />
        </div>
        <div className="fin-grid-3" style={{ marginBottom: "28px" }}>
          {d.forecast.map((f, i) => (
            <div key={f.label} style={{ background: BG_CARD, border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "24px", position: "relative", overflow: "hidden" }}>
              {i === 0 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />}
              <p style={{ fontSize: "10px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>{f.label}</p>
              <p className="fin-kpi-val" style={{ color: f.amount > 0 ? "#F0EDE8" : "#555" }}>{currency(f.amount)}</p>
              <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: 0, fontWeight: "300" }}>a receber (pendentes)</p>
            </div>
          ))}
        </div>

        {/* Payment control */}
        <div className="fin-divider">
          <div className="fin-divider-line" />
          <span className="fin-divider-label">Controle de pagamentos</span>
          <div className="fin-divider-line" />
        </div>
        <div className="fin-grid-3" style={{ marginBottom: "0" }}>
          <div style={{ background: BG_CARD, border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "24px", position: "relative", overflow: "hidden" }}>
            <p style={{ fontSize: "10px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>A receber</p>
            <p className="fin-kpi-val" style={{ color: ACCENT }}>{currency(d.pendingAmount)}</p>
            <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: 0, fontWeight: "300" }}>pagamentos pendentes</p>
          </div>
          <div style={{ background: BG_CARD, border: `1px solid ${d.lateAmount > 0 ? "rgba(255,107,107,0.2)" : "var(--up-border)"}`, borderRadius: "10px", padding: "24px", position: "relative", overflow: "hidden" }}>
            {d.lateAmount > 0 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(255,107,107,0.7), transparent)" }} />}
            <p style={{ fontSize: "10px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Em atraso</p>
            <p className="fin-kpi-val" style={{ color: d.lateAmount > 0 ? "#FF6B6B" : "#F0EDE8" }}>{currency(d.lateAmount)}</p>
            <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: 0, fontWeight: "300" }}>{d.lateCount} pagamento{d.lateCount !== 1 ? "s" : ""} vencido{d.lateCount !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ background: BG_CARD, border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Recebido este mês</p>
            <p className="fin-kpi-val" style={{ color: d.paidThisMonthAmount > 0 ? "#4CAF50" : "#F0EDE8" }}>{currency(d.paidThisMonthAmount)}</p>
            <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: 0, fontWeight: "300" }}>pagamentos confirmados</p>
          </div>
        </div>

        {/* Bulk generate button + payments table */}
        <div style={{ marginTop: "14px", marginBottom: "14px", display: "flex", justifyContent: "flex-end" }}>
          <BulkPaymentsButton activeCount={d.activeCount} />
        </div>
        <PaymentsSection />

        {/* Expenses divider */}
        <div className="fin-divider" style={{ marginTop: "28px" }}>
          <div className="fin-divider-line" />
          <span className="fin-divider-label">Saídas</span>
          <div className="fin-divider-line" />
        </div>

        {/* Expenses KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "0" }}>
          <div style={{ background: BG_CARD, border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Despesas a pagar</p>
            <p className="fin-kpi-val" style={{ color: d.expensePending > 0 ? "#F0B429" : "#F0EDE8" }}>{currency(d.expensePending)}</p>
            <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: 0, fontWeight: "300" }}>contas operacionais pendentes</p>
          </div>
          <div style={{ background: BG_CARD, border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "24px" }}>
            <p style={{ fontSize: "10px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Impostos a recolher</p>
            <p className="fin-kpi-val" style={{ color: d.taxPending > 0 ? "#FF6B6B" : "#F0EDE8" }}>{currency(d.taxPending)}</p>
            <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: 0, fontWeight: "300" }}>tributos pendentes</p>
          </div>
        </div>
        <ExpensesSection />

        {/* Pipeline */}
        <div className="fin-divider" style={{ marginTop: "28px" }}>
          <div className="fin-divider-line" />
          <span className="fin-divider-label">Pipeline de clientes</span>
          <div className="fin-divider-line" />
        </div>
        <div style={{ background: BG_CARD, border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "28px", marginBottom: "0" }}>
          <div style={{ display: "flex", gap: "0", flexWrap: "wrap" }}>
            {[
              { label: "Apresentação / Lead", count: d.leadCount,    color: "var(--up-text-label)" },
              { label: "Onboarding",          count: d.onboardCount, color: ACCENT },
              { label: "Ativos",              count: d.activeCount,  color: "#4CAF50" },
              { label: "Pausados / Ended",    count: d.churnedCount, color: "#FF6B6B" },
            ].map((s, idx) => (
              <div key={s.label} style={{ flex: 1, minWidth: "140px", padding: "16px 20px", borderRight: idx < 3 ? `1px solid var(--up-border)` : "none" }}>
                <p style={{ fontSize: "10px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 6px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ fontSize: "28px", fontWeight: "700", color: s.color, margin: 0, letterSpacing: "-0.04em" }}>{s.count}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
