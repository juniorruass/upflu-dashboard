import { createServerClient } from "@/lib/supabase";
import Header from "@/components/header";
import Link from "next/link";
import { Megaphone, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";

const ProspeccaoChart = dynamic(() => import("@/components/charts/prospeccao-chart"), { ssr: false });
const ClientesChart   = dynamic(() => import("@/components/charts/clientes-chart"),   { ssr: false });
const FinanceiroChart = dynamic(() => import("@/components/charts/financeiro-chart"), { ssr: false });

const ACCENT  = "#00CFFF";

async function getDashboardData() {
  const supabase = await createServerClient();
  const now      = new Date();

  // ── stats cards ──────────────────────────────
  const { data: clientsRaw } = await supabase
    .from("clients")
    .select("status, monthly_value, name, start_date");

  const clients       = clientsRaw ?? [];
  const activeClients = clients.filter((c) => c.status === "active");
  const mrr           = activeClients.reduce((s, c) => s + (c.monthly_value || 0), 0);
  const arr           = mrr * 12;
  const leads         = clients.filter((c) => c.status === "onboarding").length;

  // renovações nos próximos 30 dias
  const today30 = new Date(now); today30.setDate(today30.getDate() + 30);
  const renewalsSoon = activeClients.filter((c) => {
    if (!c.start_date) return false;
    const renewal = new Date(c.start_date);
    renewal.setFullYear(renewal.getFullYear() + 1);
    return renewal >= now && renewal <= today30;
  }).length;

  // ── prospecção chart (últimos 30 dias) ────────
  const since30 = new Date(now); since30.setDate(since30.getDate() - 29);
  const [{ data: prospectsRaw }, { data: waLogsRaw }] = await Promise.all([
    supabase.from("prospects")
      .select("created_at")
      .gte("created_at", since30.toISOString()),
    supabase.from("whatsapp_logs")
      .select("sent_at")
      .eq("status", "enviado")
      .gte("sent_at", since30.toISOString()),
  ]);

  const dayMap: Record<string, { prospects: number; enviados: number }> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(since30); d.setDate(d.getDate() + i);
    const k = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    dayMap[k] = { prospects: 0, enviados: 0 };
  }
  (prospectsRaw ?? []).forEach((r) => {
    const k = new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (dayMap[k]) dayMap[k].prospects++;
  });
  (waLogsRaw ?? []).forEach((r) => {
    const k = new Date(r.sent_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (dayMap[k]) dayMap[k].enviados++;
  });
  const prospectsChart = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

  // ── clientes chart ────────────────────────────
  const statusMap: Record<string, number> = {};
  clients.forEach((c) => { statusMap[c.status] = (statusMap[c.status] ?? 0) + 1; });
  const statusData = Object.entries(statusMap).map(([status, total]) => ({ status, total }));

  const mrrData = activeClients
    .filter((c) => c.monthly_value > 0)
    .sort((a, b) => b.monthly_value - a.monthly_value)
    .map((c) => ({ name: c.name.split(" ")[0], mrr: c.monthly_value }));

  // ── financeiro chart (últimos 6 meses) ────────
  const months: { month: string; receita: number; mrr: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    months.push({ month: label, receita: 0, mrr: 0 });
  }

  const { data: metricsRaw } = await supabase
    .from("client_metrics")
    .select("month, revenue")
    .gte("month", new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split("T")[0]);

  (metricsRaw ?? []).forEach((r) => {
    const label = new Date(r.month).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const m = months.find((x) => x.month === label);
    if (m) m.receita += r.revenue ?? 0;
  });

  // MRR atual repetido nos últimos meses (sem histórico, usa valor atual)
  months.forEach((m) => { if (m.mrr === 0) m.mrr = mrr; });

  return { mrr, arr, activeClients: activeClients.length, totalClients: clients.length, leads, renewalsSoon, prospectsChart, statusData, mrrData, financeiroChart: months };
}

export default async function DashboardPage() {
  const d = await getDashboardData();

  return (
    <>
      <Header title="Visão Geral" />

      <style>{`
        .dash-pad { padding: 40px 40px 60px; }
        .dash-grid-3 { display: grid; grid-template-columns: repeat(5,1fr); gap: 16px; margin-bottom: 24px; }
        .chart-card { background: var(--up-card); border: 1px solid var(--up-border); border-radius: 12px; padding: 24px; transition: background 0.2s, border-color 0.2s; }
        .chart-title { font-size: 11px; font-weight: 600; color: var(--up-text-muted); letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 20px; }
        .anuncios-link > div { transition: border-color 0.2s; }
        .anuncios-link:hover > div { border-color: rgba(0,207,255,0.35) !important; }
        @media (max-width: 768px) {
          .dash-pad { padding: 20px 16px 48px; }
          .dash-grid-3 { grid-template-columns: repeat(2,1fr); gap: 10px; }
        }
      `}</style>

      <div className="dash-pad" style={{ flex: 1 }}>

        {/* Welcome */}
        <div style={{ marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 10px" }}>
            Painel de gestão
          </p>
          <h2 style={{ fontSize: "32px", fontWeight: "700", color: "var(--up-text)", margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Bem-vindo, Junior.
          </h2>
          <p style={{ fontSize: "14px", color: "var(--up-text-label)", margin: 0, fontWeight: "300", maxWidth: "480px", lineHeight: 1.6 }}>
            Central de operações UPFLU — IA, automação e tráfego pago em um só lugar.
          </p>
        </div>

        {/* Stats row */}
        <div className="dash-grid-3" style={{ marginBottom: "32px" }}>
          {[
            { label: "Clientes ativos",   value: String(d.activeClients), sub: `${d.totalClients} cadastrados no total`, accent: false, warn: false },
            { label: "MRR",               value: `R$ ${d.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, sub: "receita mensal recorrente", accent: true, warn: false },
            { label: "ARR",               value: `R$ ${d.arr.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, sub: "receita anual recorrente", accent: false, warn: false },
            { label: "Em onboarding",     value: String(d.leads), sub: "clientes em implantação", accent: false, warn: false },
            { label: "Renovações (30d)",  value: String(d.renewalsSoon), sub: d.renewalsSoon > 0 ? "⚠️ contratos vencendo em breve" : "nenhuma renovação pendente", accent: false, warn: d.renewalsSoon > 0 },
          ].map((card) => (
            <div key={card.label} style={{ background: "var(--up-card)", border: `1px solid ${card.warn ? "rgba(255,149,0,0.3)" : "var(--up-border)"}`, borderRadius: "12px", padding: "24px", position: "relative", overflow: "hidden", transition: "background 0.2s, border-color 0.2s" }}>
              {(card.accent || card.warn) && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: card.warn ? "linear-gradient(90deg,transparent,#FF9500,transparent)" : `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />}
              <p style={{ fontSize: "11px", fontWeight: "500", color: "var(--up-text-label)", margin: "0 0 10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{card.label}</p>
              <p style={{ fontSize: "36px", fontWeight: "700", color: card.warn ? "#FF9500" : card.accent ? ACCENT : "var(--up-text)", margin: "0 0 4px", lineHeight: 1, letterSpacing: "-0.04em" }}>{card.value}</p>
              <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: 0, fontWeight: "300" }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* ── CHARTS ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>

          {/* Prospecção */}
          <div className="chart-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p className="chart-title" style={{ margin: 0 }}>Prospecção — últimos 30 dias</p>
              <Link href="/dashboard/prospeccao/automatizar" style={{ fontSize: "11px", color: ACCENT, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", opacity: 0.8 }}>
                Ver automações <ArrowRight size={11} />
              </Link>
            </div>
            <ProspeccaoChart data={d.prospectsChart} />
          </div>

          {/* Clientes */}
          <div className="chart-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p className="chart-title" style={{ margin: 0 }}>Clientes</p>
              <Link href="/dashboard/clientes" style={{ fontSize: "11px", color: ACCENT, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", opacity: 0.8 }}>
                Gerenciar <ArrowRight size={11} />
              </Link>
            </div>
            <ClientesChart statusData={d.statusData} mrrData={d.mrrData} />
          </div>

          {/* Financeiro */}
          <div className="chart-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <p className="chart-title" style={{ margin: 0 }}>Financeiro — últimos 6 meses</p>
              <Link href="/dashboard/financeiro" style={{ fontSize: "11px", color: ACCENT, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", opacity: 0.8 }}>
                Ver financeiro <ArrowRight size={11} />
              </Link>
            </div>
            <FinanceiroChart data={d.financeiroChart} />
          </div>
        </div>

        {/* ── ATALHO ANÚNCIOS ── */}
        <Link href="/dashboard/anuncios" style={{ textDecoration: "none", display: "block" }} className="anuncios-link">
          <div style={{ background: "var(--up-card)", border: `1px solid rgba(0,207,255,0.15)`, borderRadius: "12px", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", position: "relative", overflow: "hidden", transition: "background 0.2s" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "44px", height: "44px", background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Megaphone size={20} color={ACCENT} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--up-text)", margin: "0 0 3px" }}>Anúncios</p>
                <p style={{ fontSize: "12px", color: "var(--up-text-label)", margin: 0, fontWeight: "300" }}>Visualize e gerencie suas campanhas de tráfego pago</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: ACCENT, fontSize: "12px", fontWeight: "600", flexShrink: 0 }}>
              Acessar <ArrowRight size={14} />
            </div>
          </div>
        </Link>

      </div>
    </>
  );
}
