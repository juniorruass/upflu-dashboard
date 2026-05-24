import { createServerClient } from "@/lib/supabase";
import Header from "@/components/header";
import { BarChart2, Megaphone, Images, Bell, CalendarDays, BrainCircuit } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_STRONG = "rgba(255,255,255,0.12)";

async function getStats() {
  const supabase = await createServerClient();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [approvedRes, thisMonthRes, clientsRes] = await Promise.all([
    supabase.from("carousels").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("carousels").select("*", { count: "exact", head: true }).eq("status", "approved").gte("approved_at", firstDayOfMonth),
    supabase.from("clients").select("status, monthly_value"),
  ]);

  const clients = clientsRes.data ?? [];
  const activeClients = clients.filter((c) => c.status === "active");
  const mrr = activeClients.reduce((sum, c) => sum + (c.monthly_value || 0), 0);
  const leads = clients.filter((c) => c.status === "apresentacao" || c.status === "captado").length;

  return {
    approved: approvedRes.count ?? 0,
    thisMonth: thisMonthRes.count ?? 0,
    totalClients: clients.length,
    activeClients: activeClients.length,
    mrr,
    leads,
  };
}

const comingSoon = [
  {
    icon: Bell,
    label: "Alertas Inteligentes",
    desc: "Notificações automáticas de renovação, atraso e oportunidades.",
  },
  {
    icon: CalendarDays,
    label: "Agendamento",
    desc: "Agenda de reuniões e follow-ups integrada ao CRM.",
  },
  {
    icon: BarChart2,
    label: "Relatórios",
    desc: "Métricas de performance e análise de resultados em tempo real.",
  },
  {
    icon: Megaphone,
    label: "Anúncios",
    desc: "Gestão de campanhas de tráfego pago integrada ao painel.",
  },
];

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <>
      <Header title="Visão Geral" />

      <style>{`
        .dash-pad { padding: 40px 40px 60px; }
        .dash-welcome { margin-bottom: 48px; }
        .dash-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
        .dash-grid-2 { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; margin-bottom: 48px; }
        .dash-grid-coming { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; }
        .dash-stat-value { font-size: 38px; }
        @media (max-width: 768px) {
          .dash-pad { padding: 20px 16px 48px; }
          .dash-welcome { margin-bottom: 32px; }
          .dash-welcome h2 { font-size: 24px !important; }
          .dash-grid-3 { grid-template-columns: 1fr; gap: 10px; }
          .dash-grid-2 { grid-template-columns: 1fr; gap: 10px; margin-bottom: 32px; }
          .dash-grid-coming { grid-template-columns: 1fr; }
          .dash-stat-value { font-size: 28px !important; }
        }
      `}</style>
      <div className="dash-pad" style={{ flex: 1 }}>

        {/* Welcome */}
        <div className="dash-welcome">
          <p style={{ fontSize: "11px", fontWeight: "600", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Painel de gestão
          </p>
          <h2 style={{ fontSize: "32px", fontWeight: "700", color: "#F0EDE8", margin: "0 0 8px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Bem-vindo, Junior.
          </h2>
          <p style={{ fontSize: "14px", color: "#777068", margin: 0, fontWeight: "300", maxWidth: "480px", lineHeight: 1.6 }}>
            Central de operações UPFLU — IA, automação e tráfego pago em um só lugar.
          </p>
        </div>

        {/* Stats row */}
        <div className="dash-grid-3">
          {[
            {
              label: "Clientes ativos",
              value: String(stats.activeClients),
              sub: `${stats.totalClients} cadastrados no total`,
            },
            {
              label: "MRR",
              value: `R$ ${stats.mrr.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`,
              sub: "receita mensal recorrente",
              highlight: true,
            },
            {
              label: "Leads em aberto",
              value: String(stats.leads),
              sub: "apresentações e captados",
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: "#111111",
                border: `1px solid ${BORDER}`,
                borderRadius: "10px",
                padding: "28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {card.highlight && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0,
                  height: "2px",
                  background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
                }} />
              )}
              <p style={{ fontSize: "11px", fontWeight: "500", color: "#777068", margin: "0 0 10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {card.label}
              </p>
              <p className="dash-stat-value" style={{
                fontWeight: "700",
                color: card.highlight ? ACCENT : "#F0EDE8",
                margin: "0 0 4px", lineHeight: 1, letterSpacing: "-0.04em",
              }}>
                {card.value}
              </p>
              <p style={{ fontSize: "11px", color: "#777068", margin: 0, fontWeight: "300" }}>
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Posts stats */}
        <div className="dash-grid-2">
          {[
            { label: "Posts gerados", value: String(stats.approved), sub: "carrosséis aprovados no total", icon: Images },
            { label: "Este mês", value: String(stats.thisMonth), sub: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }), icon: Images },
          ].map((card) => (
            <div key={card.label} style={{ background: "#111111", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "28px", display: "flex", alignItems: "center", gap: "20px" }}>
              <div style={{ width: "40px", height: "40px", background: "rgba(0,207,255,0.06)", border: "1px solid rgba(0,207,255,0.12)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <card.icon size={17} color={ACCENT} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontSize: "11px", fontWeight: "500", color: "#777068", margin: "0 0 6px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{card.label}</p>
                <p style={{ fontSize: "30px", fontWeight: "700", color: "#F0EDE8", margin: "0 0 2px", lineHeight: 1, letterSpacing: "-0.04em" }}>{card.value}</p>
                <p style={{ fontSize: "11px", color: "#777068", margin: 0, fontWeight: "300" }}>{card.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div style={{ flex: 1, height: "1px", background: BORDER }} />
          <span style={{ fontSize: "10px", fontWeight: "500", color: "#777068", letterSpacing: "0.2em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            Em desenvolvimento
          </span>
          <div style={{ flex: 1, height: "1px", background: BORDER }} />
        </div>

        {/* Coming soon modules */}
        <div className="dash-grid-coming">
          {comingSoon.map((item) => (
            <div
              key={item.label}
              style={{
                background: "#111111",
                border: `1px solid ${BORDER}`,
                borderRadius: "10px",
                padding: "24px",
                display: "flex",
                gap: "16px",
                alignItems: "flex-start",
                opacity: 0.55,
              }}
            >
              <div style={{
                width: "36px", height: "36px",
                background: "rgba(0,207,255,0.05)",
                border: "1px solid rgba(0,207,255,0.1)",
                borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <item.icon size={16} color={ACCENT} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8", margin: 0 }}>
                    {item.label}
                  </p>
                  <span style={{
                    fontSize: "8px", fontWeight: "600", color: ACCENT,
                    background: "rgba(0,207,255,0.07)",
                    border: "1px solid rgba(0,207,255,0.15)",
                    padding: "2px 6px", borderRadius: "3px",
                    letterSpacing: "0.1em", textTransform: "uppercase",
                  }}>
                    Em breve
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#777068", margin: 0, fontWeight: "300", lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom banner */}
        <div style={{
          marginTop: "48px",
          background: "#111111",
          border: `1px solid ${BORDER_STRONG}`,
          borderRadius: "10px",
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "40px", height: "40px",
              background: "rgba(0,207,255,0.07)",
              border: "1px solid rgba(0,207,255,0.15)",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BrainCircuit size={18} color={ACCENT} strokeWidth={1.5} />
            </div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8", margin: "0 0 2px" }}>
                UPFLU · IA & Automação
              </p>
              <p style={{ fontSize: "12px", color: "#777068", margin: 0, fontWeight: "300" }}>
                Implementando inteligência nos negócios que querem crescer.
              </p>
            </div>
          </div>
          <p style={{ fontSize: "11px", color: "#777068", whiteSpace: "nowrap", letterSpacing: "0.08em" }}>
            upflu.digital
          </p>
        </div>

      </div>
    </>
  );
}
