"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle2, Clock, XCircle, Edit2, ExternalLink, LogOut, TrendingUp } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";
const BG     = "#111111";

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft:    { label: "Rascunho", color: "#777068", bg: "rgba(119,112,104,0.1)", icon: Edit2 },
  sent:     { label: "Enviada",  color: "#F0B429", bg: "rgba(240,180,41,0.1)",  icon: Clock },
  signed:   { label: "Assinada", color: "#4CAF50", bg: "rgba(76,175,80,0.1)",   icon: CheckCircle2 },
  rejected: { label: "Recusada", color: "#FF6B6B", bg: "rgba(255,107,107,0.1)", icon: XCircle },
};

function currency(n: number) {
  return `R$ ${Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}
function fmtDate(iso: string) {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}
function paymentStatus(p: { due_date: string; paid_date: string | null }) {
  if (p.paid_date) return { label: "Pago", color: "#4CAF50" };
  if (p.due_date < new Date().toISOString().split("T")[0]) return { label: "Em atraso", color: "#FF6B6B" };
  return { label: "Pendente", color: "#F0B429" };
}

type ClientData = {
  client: { id: string; name: string; contact_email: string; segment: string; monthly_value: number; start_date: string; services: { service: string }[] };
  proposals: { id: string; title: string; type: string; status: string; total_value: number; created_at: string; valid_until: string | null; autentique_short_link: string | null }[];
  payments: { id: string; amount: number; due_date: string; paid_date: string | null; notes: string | null }[];
};

export default function PortalDashboard() {
  const router  = useRouter();
  const [data, setData]     = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/portal/me");
        if (!r.ok) { router.push("/portal/login"); return; }
        const d = await r.json();
        setData(d);
      } catch (e) {
        setError("Erro ao carregar dados. Tente novamente.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function logout() {
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.push("/portal/login");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#777068", fontSize: "13px" }}>Carregando...</p>
    </div>
  );
  if (error || !data) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
      <p style={{ color: "#FF6B6B", fontSize: "14px" }}>{error || "Sessão expirada."}</p>
      <button onClick={() => { window.location.href = "/portal/login"; }} style={{ fontSize: "13px", padding: "8px 20px", borderRadius: "6px", border: "1px solid rgba(0,207,255,0.3)", background: "rgba(0,207,255,0.08)", color: "#00CFFF", cursor: "pointer" }}>Voltar ao login</button>
    </div>
  );

  const { client, proposals, payments } = data;
  const pending = payments.filter(p => !p.paid_date && p.due_date >= new Date().toISOString().split("T")[0]);
  const late    = payments.filter(p => !p.paid_date && p.due_date < new Date().toISOString().split("T")[0]);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "var(--font-outfit, sans-serif)" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "0 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: ACCENT, letterSpacing: "0.1em" }}>UPFLU</span>
            <span style={{ fontSize: "11px", color: "#777068" }}>/ Portal do Cliente</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "13px", color: "#9A9288" }}>{client.name}</span>
            <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#777068", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "6px 10px", cursor: "pointer" }}>
              <LogOut size={12} /> Sair
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>

        {/* Welcome */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 8px" }}>Bem-vindo</p>
          <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#F0EDE8", margin: "0 0 4px", letterSpacing: "-0.03em" }}>{client.name}</h1>
          <p style={{ fontSize: "13px", color: "#777068", margin: 0 }}>{client.segment} · desde {client.start_date ? fmtDate(client.start_date) : "—"}</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "32px" }}>
          {[
            { label: "Mensalidade", value: currency(client.monthly_value), hi: true },
            { label: "A pagar",     value: pending.length > 0 ? currency(pending.reduce((s, p) => s + p.amount, 0)) : "Em dia" },
            { label: "Em atraso",   value: late.length > 0 ? String(late.length) + " pagamento(s)" : "Nenhum", warn: late.length > 0 },
          ].map(s => (
            <div key={s.label} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "20px", position: "relative", overflow: "hidden" }}>
              {s.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,${ACCENT},transparent)` }} />}
              <p style={{ fontSize: "10px", fontWeight: "500", color: "#777068", margin: "0 0 8px", letterSpacing: "0.14em", textTransform: "uppercase" }}>{s.label}</p>
              <p style={{ fontSize: "22px", fontWeight: "700", color: s.hi ? ACCENT : s.warn ? "#FF6B6B" : "#F0EDE8", margin: 0, letterSpacing: "-0.03em" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Proposals */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <FileText size={15} color={ACCENT} strokeWidth={1.5} />
            <h2 style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8", margin: 0 }}>Propostas & Contratos</h2>
          </div>
          {proposals.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#777068" }}>Nenhum documento ainda.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {proposals.map(p => {
                const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.draft;
                const Icon = cfg.icon;
                return (
                  <div key={p.id} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#F0EDE8" }}>{p.title}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", color: cfg.color, background: cfg.bg, padding: "2px 8px", borderRadius: "4px" }}>
                          <Icon size={10} strokeWidth={2} />{cfg.label}
                        </span>
                        <span style={{ fontSize: "10px", color: "#777068", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, padding: "2px 7px", borderRadius: "4px" }}>
                          {p.type === "contract" ? "Contrato" : "Proposta"}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "12px", color: ACCENT, fontWeight: "600" }}>{currency(p.total_value)}</span>
                        <span style={{ fontSize: "12px", color: "#777068" }}>criado {fmtDate(p.created_at)}</span>
                      </div>
                    </div>
                    {p.autentique_short_link && (
                      <a href={p.autentique_short_link} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "6px 10px", borderRadius: "5px", border: "1px solid rgba(0,207,255,0.25)", background: "rgba(0,207,255,0.07)", color: ACCENT, textDecoration: "none", fontWeight: "600", flexShrink: 0 }}>
                        <ExternalLink size={11} /> Assinar
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payments */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <TrendingUp size={15} color={ACCENT} strokeWidth={1.5} />
            <h2 style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8", margin: 0 }}>Histórico de Pagamentos</h2>
          </div>
          {payments.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#777068" }}>Nenhum pagamento registrado.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {payments.map(p => {
                const st = paymentStatus(p);
                return (
                  <div key={p.id} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#F0EDE8", margin: "0 0 3px" }}>{currency(p.amount)}</p>
                      <p style={{ fontSize: "12px", color: "#777068", margin: 0 }}>
                        Vencimento: {fmtDate(p.due_date)}
                        {p.paid_date && ` · Pago em ${fmtDate(p.paid_date)}`}
                        {p.notes && ` · ${p.notes}`}
                      </p>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: st.color, background: `${st.color}18`, padding: "3px 10px", borderRadius: "4px", flexShrink: 0 }}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
