import { createServerClient } from "@/lib/supabase";
import Header from "@/components/header";
import { Images, CheckCircle, Clock, CalendarDays, TrendingUp } from "lucide-react";
import Link from "next/link";

function getNextCronDisplay(): string {
  const now = new Date();
  const nowBRT = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const todayCron = new Date(nowBRT);
  todayCron.setHours(9, 0, 0, 0);

  const nextDate =
    nowBRT < todayCron
      ? todayCron
      : new Date(todayCron.setDate(todayCron.getDate() + 1));

  const weekday = nextDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    timeZone: "America/Sao_Paulo",
  });
  const date = nextDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  });

  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${date} às 09:00`;
}

async function getStats() {
  const supabase = await createServerClient();
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [approvedRes, pendingRes, thisMonthRes, recentRes] = await Promise.all([
    supabase.from("carousels").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("carousels").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("carousels").select("*", { count: "exact", head: true }).eq("status", "approved").gte("approved_at", firstDayOfMonth),
    supabase.from("carousels").select("id, topic, status, post_number, created_at, approved_at").order("created_at", { ascending: false }).limit(6),
  ]);

  return {
    approved: approvedRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    thisMonth: thisMonthRes.count ?? 0,
    recent: recentRes.data ?? [],
  };
}

const statusConfig = {
  pending: { label: "Pendente", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  approved: { label: "Aprovado", color: "#00C896", bg: "rgba(0,200,150,0.1)" },
  declined: { label: "Recusado", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

export default async function DashboardPage() {
  const stats = await getStats();
  const nextCron = getNextCronDisplay();

  const metricCards = [
    {
      label: "Posts aprovados",
      value: stats.approved,
      icon: CheckCircle,
      color: "#00C896",
      bg: "rgba(0,200,150,0.1)",
      sublabel: "total de carrosséis aprovados",
    },
    {
      label: "Aguardando revisão",
      value: stats.pending,
      icon: Clock,
      color: stats.pending > 0 ? "#F59E0B" : "#888888",
      bg: stats.pending > 0 ? "rgba(245,158,11,0.1)" : "rgba(136,136,136,0.08)",
      badge: stats.pending > 0,
      sublabel: stats.pending > 0 ? "pendente(s) de aprovação" : "nenhum pendente",
    },
    {
      label: "Posts este mês",
      value: stats.thisMonth,
      icon: TrendingUp,
      color: "#888888",
      bg: "rgba(136,136,136,0.08)",
      sublabel: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    },
    {
      label: "Próxima geração",
      value: null,
      text: nextCron,
      icon: CalendarDays,
      color: "#00C896",
      bg: "rgba(0,200,150,0.05)",
      sublabel: "horário de Brasília",
    },
  ];

  return (
    <>
      <Header title="Visão Geral" />

      <div style={{ padding: "32px", flex: 1 }}>
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#F5F5F5", margin: "0 0 6px" }}>
            Olá, Junior 👋
          </h2>
          <p style={{ fontSize: "14px", color: "#888888", margin: 0 }}>
            Aqui está o resumo do sistema de conteúdo UPFLU.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {metricCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: "#1A1A1A",
                border: "1px solid #2A2A2A",
                borderRadius: "12px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {card.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "10px",
                    height: "10px",
                    background: "#00C896",
                    borderRadius: "50%",
                    boxShadow: "0 0 8px rgba(0,200,150,0.5)",
                  }}
                />
              )}

              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: card.bg,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <card.icon size={20} color={card.color} />
              </div>

              <p style={{ fontSize: "13px", fontWeight: "500", color: "#888888", margin: "0 0 6px" }}>
                {card.label}
              </p>

              {card.value !== null && card.value !== undefined ? (
                <p style={{ fontSize: "36px", fontWeight: "700", color: "#F5F5F5", margin: "0 0 4px", lineHeight: 1 }}>
                  {card.value}
                </p>
              ) : (
                <p style={{ fontSize: "15px", fontWeight: "600", color: "#F5F5F5", margin: "0 0 4px", lineHeight: 1.3 }}>
                  {card.text}
                </p>
              )}

              <p style={{ fontSize: "11px", color: "#888888", margin: 0 }}>
                {card.sublabel}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div
            style={{
              background: "#1A1A1A",
              border: "1px solid #2A2A2A",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#F5F5F5", margin: 0 }}>
                Atividade recente
              </h3>
              <Link
                href="/dashboard/conteudo"
                style={{ fontSize: "12px", color: "#00C896", textDecoration: "none", fontWeight: "500" }}
              >
                Ver conteúdo →
              </Link>
            </div>

            {stats.recent.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#888888" }}>
                <Images size={32} color="#2A2A2A" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", margin: 0 }}>Nenhum carrossel gerado ainda.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {stats.recent.map((item: {
                  id: string;
                  topic: string;
                  status: string;
                  post_number: number | null;
                  created_at: string;
                }) => {
                  const cfg = statusConfig[item.status as keyof typeof statusConfig];
                  return (
                    <Link
                      key={item.id}
                      href="/dashboard/conteudo"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 12px",
                        background: "#252525",
                        borderRadius: "8px",
                        textDecoration: "none",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#F5F5F5",
                            margin: "0 0 2px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.post_number ? `#${String(item.post_number).padStart(3, "0")} · ` : ""}
                          {item.topic}
                        </p>
                        <p style={{ fontSize: "11px", color: "#888888", margin: 0 }}>
                          {new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "600",
                          color: cfg.color,
                          background: cfg.bg,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          flexShrink: 0,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div
            style={{
              background: "#1A1A1A",
              border: "1px solid #2A2A2A",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "#F5F5F5", margin: "0 0 20px" }}>
              Como funciona
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                {
                  step: "01",
                  title: "Geração automática",
                  desc: "Todo dia às 09:00 BRT a IA gera um carrossel seguindo a lista de temas da UPFLU.",
                },
                {
                  step: "02",
                  title: "Revisão e aprovação",
                  desc: "Visualize cada slide, edite a legenda e decida: aceitar ou recusar.",
                },
                {
                  step: "03",
                  title: "Download em ZIP",
                  desc: "Carrosséis aprovados ficam disponíveis para download como PNGs prontos para o Instagram.",
                },
              ].map((item) => (
                <div key={item.step} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      background: "rgba(0,200,150,0.1)",
                      border: "1px solid rgba(0,200,150,0.2)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#00C896",
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#F5F5F5", margin: "0 0 3px" }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: "12px", color: "#888888", margin: 0, lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
