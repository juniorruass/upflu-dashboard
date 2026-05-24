import { createAdminClient } from "@/lib/supabase";
import Header from "@/components/header";
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";
import PaymentsSection from "@/components/financeiro/payments-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";
const BG_CARD = "#111111";

type Client = {
  id: string;
  name: string;
  segment: string;
  monthly_value: number;
  status: string;
  start_date: string | null;
};

type MetricRow = {
  client_id: string;
  month: string;
  revenue: number | null;
  ad_spend: number | null;
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

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function formatMonth(yyyyMM: string) {
  const [year, month] = yyyyMM.split("-");
  const names = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${names[parseInt(month) - 1]}/${year.slice(2)}`;
}

async function getData() {
  const supabase = createAdminClient();
  const todayStr = new Date().toISOString().split("T")[0];

  const [clientsRes, metricsRes, paymentsRes] = await Promise.all([
    supabase.from("clients").select("id, name, segment, monthly_value, status, start_date"),
    supabase.from("client_metrics").select("client_id, month, revenue, ad_spend").order("month", { ascending: true }),
    supabase.from("payments").select("id, amount, due_date, paid_date"),
  ]);

  const clients: Client[] = clientsRes.data ?? [];
  const metrics: MetricRow[] = metricsRes.data ?? [];
  const allPayments: PaymentRow[] = paymentsRes.data ?? [];

  const pendingPayments = allPayments.filter(p => !p.paid_date && p.due_date >= todayStr);
  const latePayments    = allPayments.filter(p => !p.paid_date && p.due_date < todayStr);
  const paidThisMonth   = allPayments.filter(p => p.paid_date?.startsWith(todayStr.slice(0, 7)));

  const pendingAmount = pendingPayments.reduce((s, p) => s + p.amount, 0);
  const lateAmount    = latePayments.reduce((s, p) => s + p.amount, 0);
  const paidThisMonthAmount = paidThisMonth.reduce((s, p) => s + p.amount, 0);

  const active    = clients.filter(c => c.status === "active");
  const onboard   = clients.filter(c => c.status === "onboarding");
  const churned   = clients.filter(c => c.status === "ended" || c.status === "paused");
  const leads     = clients.filter(c => c.status === "apresentacao" || c.status === "captado");

  const mrr = active.reduce((s, c) => s + (c.monthly_value || 0), 0);
  const arr = mrr * 12;
  const ticketMedio = active.length > 0 ? mrr / active.length : 0;
  const ltv = ticketMedio * 12;

  const totalEver = active.length + onboard.length + churned.length;
  const churnRate = totalEver > 0 ? (churned.length / totalEver) * 100 : 0;

  // Last 6 months
  const now = new Date();
  const last6: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const revenueByMonth = last6.map(month => {
    const rows = metrics.filter(m => m.month === month);
    return {
      month,
      label: formatMonth(month),
      revenue: rows.reduce((s, r) => s + (r.revenue || 0), 0),
      ad_spend: rows.reduce((s, r) => s + (r.ad_spend || 0), 0),
    };
  });

  const maxRevenue = Math.max(...revenueByMonth.map(r => r.revenue), 1);

  const topClients = [...active]
    .sort((a, b) => (b.monthly_value || 0) - (a.monthly_value || 0))
    .slice(0, 5);

  return {
    mrr, arr, ticketMedio, ltv,
    activeCount: active.length,
    onboardCount: onboard.length,
    churnedCount: churned.length,
    leadCount: leads.length,
    churnRate,
    revenueByMonth,
    maxRevenue,
    topClients,
    totalClients: clients.length,
    pendingAmount,
    lateAmount,
    lateCount: latePayments.length,
    paidThisMonthAmount,
  };
}

export default async function FinanceiroPage() {
  const d = await getData();

  const kpis1 = [
    { label: "MRR", value: currency(d.mrr), sub: "receita mensal recorrente", accent: true, icon: DollarSign },
    { label: "ARR", value: currency(d.arr), sub: "projeção anual", icon: TrendingUp },
    { label: "Clientes ativos", value: String(d.activeCount), sub: `${d.totalClients} cadastrados no total`, icon: Users },
    { label: "Ticket médio", value: currency(d.ticketMedio), sub: "por cliente ativo", icon: DollarSign },
  ];

  const kpis2 = [
    {
      label: "Cancelamentos",
      value: String(d.churnedCount),
      sub: "ended + pausados",
      warn: d.churnedCount > 0,
      icon: TrendingDown,
    },
    {
      label: "Churn rate",
      value: pct(d.churnRate),
      sub: "% do total que cancelou",
      warn: d.churnRate > 10,
      icon: TrendingDown,
    },
    {
      label: "LTV estimado",
      value: currency(d.ltv),
      sub: "projeção 12 meses por cliente",
      icon: TrendingUp,
    },
  ];

  return (
    <>
      <Header title="Painel Financeiro" />

      <style>{`
        .fin-pad { padding: 40px 40px 60px; }
        .fin-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 14px; }
        .fin-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 28px; }
        .fin-grid-chart { display: grid; grid-template-columns: 1fr 340px; gap: 14px; margin-bottom: 14px; }
        .fin-kpi-val { font-size: 30px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; margin: 0 0 4px; }
        @media (max-width: 900px) {
          .fin-pad { padding: 20px 16px 48px; }
          .fin-grid-4 { grid-template-columns: 1fr 1fr; gap: 10px; }
          .fin-grid-3 { grid-template-columns: 1fr; gap: 10px; }
          .fin-grid-pay { grid-template-columns: 1fr !important; }
          .fin-grid-chart { grid-template-columns: 1fr; }
          .fin-kpi-val { font-size: 24px !important; }
        }
      `}</style>

      <div className="fin-pad" style={{ flex: 1 }}>

        {/* KPIs row 1 */}
        <div className="fin-grid-4">
          {kpis1.map(k => (
            <div key={k.label} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "24px", position: "relative", overflow: "hidden" }}>
              {k.accent && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
              )}
              <p style={{ fontSize: "10px", fontWeight: "500", color: "#777068", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>{k.label}</p>
              <p className="fin-kpi-val" style={{ color: k.accent ? ACCENT : "#F0EDE8" }}>{k.value}</p>
              <p style={{ fontSize: "11px", color: "#777068", margin: 0, fontWeight: "300" }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* KPIs row 2 */}
        <div className="fin-grid-3">
          {kpis2.map(k => (
            <div key={k.label} style={{ background: BG_CARD, border: `1px solid ${k.warn ? "rgba(255,80,80,0.18)" : BORDER}`, borderRadius: "10px", padding: "24px", position: "relative", overflow: "hidden" }}>
              {k.warn && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(255,80,80,0.6), transparent)" }} />
              )}
              <p style={{ fontSize: "10px", fontWeight: "500", color: "#777068", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>{k.label}</p>
              <p className="fin-kpi-val" style={{ color: k.warn ? "#FF6B6B" : "#F0EDE8" }}>{k.value}</p>
              <p style={{ fontSize: "11px", color: "#777068", margin: 0, fontWeight: "300" }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart + Top clients */}
        <div className="fin-grid-chart">

          {/* Revenue bar chart */}
          <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "28px" }}>
            <p style={{ fontSize: "11px", fontWeight: "500", color: "#777068", margin: "0 0 24px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Receita por mês (últimos 6 meses)
            </p>
            {d.revenueByMonth.every(r => r.revenue === 0) ? (
              <div style={{ height: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: "13px", color: "#777068", margin: 0 }}>Sem dados de receita registrados ainda.</p>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "140px" }}>
                {d.revenueByMonth.map(r => {
                  const heightPct = d.maxRevenue > 0 ? (r.revenue / d.maxRevenue) * 100 : 0;
                  return (
                    <div key={r.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                      <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                        <div
                          title={currency(r.revenue)}
                          style={{
                            width: "100%",
                            height: `${Math.max(heightPct, r.revenue > 0 ? 4 : 0)}%`,
                            background: r.revenue > 0
                              ? `linear-gradient(180deg, ${ACCENT} 0%, rgba(0,207,255,0.4) 100%)`
                              : "rgba(255,255,255,0.05)",
                            borderRadius: "4px 4px 0 0",
                            minHeight: r.revenue > 0 ? "4px" : "2px",
                          }}
                        />
                      </div>
                      <p style={{ fontSize: "10px", color: "#777068", margin: 0, whiteSpace: "nowrap" }}>{r.label}</p>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Legend below */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${BORDER}`, display: "flex", gap: "24px" }}>
              <div>
                <p style={{ fontSize: "10px", color: "#777068", margin: "0 0 2px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Total (6 meses)</p>
                <p style={{ fontSize: "18px", fontWeight: "700", color: "#F0EDE8", margin: 0, letterSpacing: "-0.03em" }}>
                  {currency(d.revenueByMonth.reduce((s, r) => s + r.revenue, 0))}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "10px", color: "#777068", margin: "0 0 2px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ad spend (6 meses)</p>
                <p style={{ fontSize: "18px", fontWeight: "700", color: "#F0EDE8", margin: 0, letterSpacing: "-0.03em" }}>
                  {currency(d.revenueByMonth.reduce((s, r) => s + r.ad_spend, 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Top clients */}
          <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "28px" }}>
            <p style={{ fontSize: "11px", fontWeight: "500", color: "#777068", margin: "0 0 20px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Top clientes (MRR)
            </p>
            {d.topClients.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#777068", margin: 0 }}>Nenhum cliente ativo.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {d.topClients.map((c, i) => {
                  const share = d.mrr > 0 ? (c.monthly_value / d.mrr) * 100 : 0;
                  return (
                    <div key={c.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", color: "#777068", fontWeight: "600", minWidth: "14px" }}>#{i + 1}</span>
                          <span style={{ fontSize: "13px", color: "#F0EDE8", fontWeight: "500" }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: "13px", color: ACCENT, fontWeight: "600" }}>{currency(c.monthly_value || 0)}</span>
                      </div>
                      <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px" }}>
                        <div style={{ height: "100%", width: `${share}%`, background: ACCENT, borderRadius: "2px", opacity: 0.7 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Payment KPIs */}
        <div style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "14px" }}>
            <div style={{ flex: 1, height: "1px", background: BORDER }} />
            <span style={{ fontSize: "10px", fontWeight: "500", color: "#777068", letterSpacing: "0.2em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Controle de pagamentos
            </span>
            <div style={{ flex: 1, height: "1px", background: BORDER }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }} className="fin-grid-pay">
            <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "24px", position: "relative", overflow: "hidden" }}>
              <p style={{ fontSize: "10px", fontWeight: "500", color: "#777068", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>A receber</p>
              <p className="fin-kpi-val" style={{ color: ACCENT }}>{currency(d.pendingAmount)}</p>
              <p style={{ fontSize: "11px", color: "#777068", margin: 0, fontWeight: "300" }}>pagamentos pendentes</p>
            </div>
            <div style={{ background: BG_CARD, border: `1px solid ${d.lateAmount > 0 ? "rgba(255,107,107,0.2)" : BORDER}`, borderRadius: "10px", padding: "24px", position: "relative", overflow: "hidden" }}>
              {d.lateAmount > 0 && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(255,107,107,0.7), transparent)" }} />
              )}
              <p style={{ fontSize: "10px", fontWeight: "500", color: "#777068", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Em atraso</p>
              <p className="fin-kpi-val" style={{ color: d.lateAmount > 0 ? "#FF6B6B" : "#F0EDE8" }}>{currency(d.lateAmount)}</p>
              <p style={{ fontSize: "11px", color: "#777068", margin: 0, fontWeight: "300" }}>{d.lateCount} pagamento{d.lateCount !== 1 ? "s" : ""} vencido{d.lateCount !== 1 ? "s" : ""}</p>
            </div>
            <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "24px" }}>
              <p style={{ fontSize: "10px", fontWeight: "500", color: "#777068", margin: "0 0 10px", letterSpacing: "0.14em", textTransform: "uppercase" }}>Recebido este mês</p>
              <p className="fin-kpi-val" style={{ color: d.paidThisMonthAmount > 0 ? "#4CAF50" : "#F0EDE8" }}>{currency(d.paidThisMonthAmount)}</p>
              <p style={{ fontSize: "11px", color: "#777068", margin: 0, fontWeight: "300" }}>pagamentos confirmados</p>
            </div>
          </div>
        </div>

        {/* Payments interactive section */}
        <PaymentsSection />

        {/* Status breakdown */}
        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "28px" }}>
          <p style={{ fontSize: "11px", fontWeight: "500", color: "#777068", margin: "0 0 20px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Pipeline de clientes
          </p>
          <div style={{ display: "flex", gap: "0", flexWrap: "wrap" }}>
            {[
              { label: "Apresentação / Lead", count: d.leadCount, color: "#777068" },
              { label: "Onboarding", count: d.onboardCount, color: ACCENT },
              { label: "Ativos", count: d.activeCount, color: "#4CAF50" },
              { label: "Pausados / Ended", count: d.churnedCount, color: "#FF6B6B" },
            ].map((s, idx) => (
              <div key={s.label} style={{ flex: 1, minWidth: "140px", padding: "16px 20px", borderRight: idx < 3 ? `1px solid ${BORDER}` : "none" }}>
                <p style={{ fontSize: "10px", fontWeight: "500", color: "#777068", margin: "0 0 6px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{s.label}</p>
                <p style={{ fontSize: "28px", fontWeight: "700", color: s.color, margin: 0, letterSpacing: "-0.04em" }}>{s.count}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
