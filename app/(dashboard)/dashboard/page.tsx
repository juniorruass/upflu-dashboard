import { createServerClient } from "@/lib/supabase";
import Header from "@/components/header";
import { BarChart2, Users, FileText, Megaphone, Zap } from "lucide-react";

const GOLD = "#BEA06A";
const BORDER = "rgba(255,255,255,0.07)";
const BORDER_STRONG = "rgba(255,255,255,0.12)";

async function getStats() {
  const supabase = await createServerClient();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [approvedRes, thisMonthRes] = await Promise.all([
    supabase.from("carousels").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("carousels").select("*", { count: "exact", head: true }).eq("status", "approved").gte("approved_at", firstDayOfMonth),
  ]);

  return {
    approved: approvedRes.count ?? 0,
    thisMonth: thisMonthRes.count ?? 0,
  };
}

const comingSoon = [
  {
    icon: BarChart2,
    label: "Relatórios",
    desc: "Métricas de performance e análise de resultados em tempo real.",
  },
  {
    icon: Users,
    label: "Clientes",
    desc: "Gestão centralizada da carteira de clientes e histórico de projetos.",
  },
  {
    icon: FileText,
    label: "Propostas",
    desc: "Criação e acompanhamento de propostas comerciais com IA.",
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

      <div style={{ padding: "40px 40px 60px", flex: 1 }}>

        {/* Welcome */}
        <div style={{ marginBottom: "56px" }}>
          <p style={{ fontSize: "12px", fontWeight: "500", color: GOLD, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 12px" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "56px" }}>
          {[
            {
              label: "Posts gerados",
              value: String(stats.approved),
              sub: "carrosséis aprovados no total",
            },
            {
              label: "Este mês",
              value: String(stats.thisMonth),
              sub: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
            },
            {
              label: "Sistema",
              value: "Ativo",
              sub: "UPFLU Admin v1.0",
              highlight: true,
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
                  background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
                }} />
              )}
              <p style={{ fontSize: "11px", fontWeight: "500", color: "#777068", margin: "0 0 10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {card.label}
              </p>
              <p style={{
                fontSize: "38px", fontWeight: "700",
                color: card.highlight ? GOLD : "#F0EDE8",
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

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div style={{ flex: 1, height: "1px", background: BORDER }} />
          <span style={{ fontSize: "10px", fontWeight: "500", color: "#777068", letterSpacing: "0.2em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            Em desenvolvimento
          </span>
          <div style={{ flex: 1, height: "1px", background: BORDER }} />
        </div>

        {/* Coming soon modules */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
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
                opacity: 0.6,
              }}
            >
              <div style={{
                width: "36px", height: "36px",
                background: "rgba(190,160,106,0.06)",
                border: `1px solid rgba(190,160,106,0.12)`,
                borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <item.icon size={16} color={GOLD} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <p style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8", margin: 0 }}>
                    {item.label}
                  </p>
                  <span style={{
                    fontSize: "8px", fontWeight: "600", color: GOLD,
                    background: "rgba(190,160,106,0.08)",
                    border: "1px solid rgba(190,160,106,0.15)",
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
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "40px", height: "40px",
              background: "rgba(190,160,106,0.08)",
              border: `1px solid rgba(190,160,106,0.18)`,
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={18} color={GOLD} strokeWidth={1.5} />
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
