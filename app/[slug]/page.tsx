import { createAdminClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Client, ClientMetric, ClientNote, OnboardingTask } from "@/types";
import ConstellationCanvas from "@/components/constellation-canvas";
import { PortalLogin } from "@/components/portal/portal-login";
import { PortalLogoutBtn } from "@/components/portal/portal-logout-btn";
import { PortalMetaSection } from "@/components/portal/portal-meta-section";
import { PortalPushSubscribe } from "@/components/portal/portal-push-subscribe";
import { PortalInstagramSection } from "@/components/portal/portal-instagram-section";
import { verifyPortalSession } from "@/lib/portal-session";

export const dynamic = "force-dynamic";

const ACCENT = "#00CFFF";
const BG = "#080808";
const CARD = "#111111";
const CARD2 = "#161616";
const TEXT = "#F0EDE8";
const MUTED = "#777068";
const GREEN = "#4ADE80";


function toSlug(name: string): string {
  return name.toLowerCase().normalize("NFD")
    .split("").filter((c) => c.charCodeAt(0) < 0x0300 || c.charCodeAt(0) > 0x036f)
    .join("").replace(/[^a-z0-9]/g, "");
}

function fmt(n: number | null | undefined, prefix = "", suffix = "", decimals = 0): string {
  if (n == null || isNaN(n) || !isFinite(n)) return "—";
  return `${prefix}${n.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
}

function fmtMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${months[parseInt(m,10)-1]}/${y.slice(2)}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function AreaChart({ data, field, color }: {
  data: ClientMetric[];
  field: "leads" | "revenue" | "ad_spend";
  color: string;
}) {
  if (data.length < 2) return null;
  const W = 560; const H = 100; const PY = 8;
  const vals = data.map((d) => (d[field] as number) ?? 0);
  const max = Math.max(...vals, 1);
  const pts = vals.map((v, i) => ({
    x: (i / (vals.length - 1)) * W,
    y: PY + (1 - v / max) * (H - PY * 2),
  }));
  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cp1x = (pts[i - 1].x + pts[i].x) / 2;
    path += ` C ${cp1x} ${pts[i-1].y}, ${cp1x} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  const area = `${path} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "80px", overflow: "visible" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`pg-${field}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#pg-${field})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
    </svg>
  );
}

async function getClient(slug: string): Promise<(Client & { notes: ClientNote[]; tasks: OnboardingTask[]; portal_password?: string | null }) | null> {
  const supabase = createAdminClient();
  const { data: all } = await supabase.from("clients").select("*");
  if (!all) return null;

  const client = (all as Client[]).find((c) => c.slug === slug || toSlug(c.name) === slug);
  if (!client) return null;

  const [{ data: metrics }, { data: services }, { data: notes }, { data: tasks }, { data: full }] = await Promise.all([
    supabase.from("client_metrics").select("*").eq("client_id", client.id).order("month", { ascending: true }),
    supabase.from("client_services").select("*").eq("client_id", client.id),
    supabase.from("client_notes").select("*").eq("client_id", client.id).order("created_at", { ascending: false }),
    supabase.from("onboarding_tasks").select("*").eq("client_id", client.id).order("position", { ascending: true }),
    supabase.from("clients").select("portal_password").eq("id", client.id).single(),
  ]);

  return {
    ...client,
    metrics: metrics ?? [],
    services: services ?? [],
    notes: notes ?? [],
    tasks: tasks ?? [],
    portal_password: (full as { portal_password: string | null } | null)?.portal_password ?? null,
  };
}

export default async function ClientSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await getClient(slug);
  if (!client) notFound();

  // Auth check
  const cookieStore = cookies();
  const portalCookie = (cookieStore as ReturnType<typeof cookies>).get(`portal_${slug}`);
  const sessionClientId = portalCookie?.value ? await verifyPortalSession(portalCookie.value) : null;
  const isAuthenticated = sessionClientId === client.id;

  // If no password set, portal is open; if password set, require auth
  const needsAuth = !!client.portal_password && !isAuthenticated;

  if (needsAuth) {
    return <PortalLogin slug={slug} clientName={client.name} />;
  }

  // ─── Dashboard ────────────────────────────────────────────
  const metrics: ClientMetric[] = client.metrics ?? [];
  const notes: ClientNote[] = client.notes ?? [];
  const tasks: OnboardingTask[] = client.tasks ?? [];
  const lastMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  const roas = lastMetric?.revenue && lastMetric?.ad_spend ? lastMetric.revenue / lastMetric.ad_spend : null;
  const cpl  = lastMetric?.ad_spend && lastMetric?.leads ? lastMetric.ad_spend / lastMetric.leads : null;
  const roi  = lastMetric?.revenue && lastMetric?.ad_spend
    ? ((lastMetric.revenue - lastMetric.ad_spend) / lastMetric.ad_spend) * 100 : null;

  const totalLeads   = metrics.reduce((s, m) => s + (m.leads ?? 0), 0);
  const totalRevenue = metrics.reduce((s, m) => s + (m.revenue ?? 0), 0);
  const totalSpend   = metrics.reduce((s, m) => s + (m.ad_spend ?? 0), 0);
  const hasHistory   = metrics.length >= 2;

  const doneTasks  = tasks.filter((t) => t.done).length;
  const totalTasks = tasks.length;
  const progress   = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "var(--font-outfit, sans-serif)", color: TEXT }}>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes orbA { 0%,100%{transform:translate(0,0) scale(1);opacity:.20} 45%{transform:translate(48px,-28px) scale(1.07);opacity:.28} }
        @keyframes orbB { 0%,100%{transform:translate(0,0);opacity:.13} 38%{transform:translate(-36px,44px);opacity:.20} }
        .p-fade-1 { animation: fadeUp .6s ease both; }
        .p-fade-2 { animation: fadeUp .6s ease .12s both; }
        .p-fade-3 { animation: fadeUp .6s ease .22s both; }
        .p-fade-4 { animation: fadeUp .6s ease .32s both; }
        .p-fade-5 { animation: fadeUp .6s ease .42s both; }
        .p-wrap { padding: 44px 40px 80px; max-width: 960px; margin: 0 auto; }
        .p-grid3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
        .p-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .p-section { margin-bottom: 36px; }
        .p-label { font-size: 10px; font-weight: 600; color: ${MUTED}; letter-spacing: .20em; text-transform: uppercase; margin: 0 0 14px; }
        @media (max-width: 640px) {
          .p-wrap { padding: 24px 16px 60px; }
          .p-grid3 { grid-template-columns: 1fr 1fr; }
          .p-grid2 { grid-template-columns: 1fr; }
          .p-header-inner { padding: 0 16px !important; }
          .p-header-label { display: none !important; }
        }
      `}</style>

      {/* Background */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-6%", right: "2%", width: "560px", height: "560px", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,207,255,0.13) 0%,transparent 70%)", animation: "orbA 22s ease-in-out infinite", filter: "blur(52px)" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "8%", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,207,255,0.08) 0%,transparent 70%)", animation: "orbB 30s ease-in-out infinite", filter: "blur(60px)" }} />
        <ConstellationCanvas />
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: `1px solid var(--up-border)`, background: "rgba(8,8,8,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="p-header-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "58px", maxWidth: "960px", margin: "0 auto", padding: "0 40px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/upflu-logo.png" alt="UPFLU" style={{ height: "22px", width: "auto", flexShrink: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <span className="p-header-label" style={{ fontSize: "11px", color: MUTED, letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Relatório de Performance</span>
            <PortalPushSubscribe clientId={client.id} clientSlug={slug} />
            {client.portal_password && <PortalLogoutBtn slug={slug} />}
          </div>
        </div>
      </div>

      <div className="p-wrap" style={{ position: "relative", zIndex: 1 }}>

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="p-section p-fade-1" style={{ paddingTop: "8px", marginBottom: "48px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(32px,6vw,52px)", fontWeight: "800", color: TEXT, margin: 0, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            {client.name}
          </h1>
        </div>

        {/* ── Meta Ads ao Vivo ──────────────────────────────── */}
        {client.meta_account_id && (
          <div className="p-section p-fade-2">
            <p className="p-label">Meta Ads — conta {client.meta_account_id}</p>
            <PortalMetaSection clientId={client.id} />
          </div>
        )}

        {/* ── Instagram ────────────────────────────────────── */}
        {client.meta_account_id && (
          <div className="p-section p-fade-2">
            <p className="p-label">Instagram</p>
            <PortalInstagramSection clientId={client.id} />
          </div>
        )}

        {/* ── Progresso do Projeto ──────────────────────────── */}
        {totalTasks > 0 && (
          <div className="p-section p-fade-2">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
              <p className="p-label" style={{ margin: 0 }}>Progresso do Projeto</p>
              <span style={{ fontSize: "12px", fontWeight: "700", color: progress === 100 ? GREEN : ACCENT }}>
                {doneTasks} de {totalTasks} concluídos
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "100px", height: "6px", marginBottom: "20px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: progress === 100 ? GREEN : ACCENT, borderRadius: "100px", transition: "width .4s ease", boxShadow: `0 0 8px ${progress === 100 ? GREEN : ACCENT}66` }} />
            </div>

            {/* Tasks list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tasks.map((task) => (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: "12px", background: CARD, border: `1px solid ${task.done ? "rgba(74,222,128,0.15)" : "var(--up-border)"}`, borderRadius: "10px", padding: "12px 16px" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: `1.5px solid ${task.done ? GREEN : "var(--up-border)"}`, background: task.done ? `${GREEN}20` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {task.done && <span style={{ fontSize: "10px", color: GREEN }}>✓</span>}
                  </div>
                  <span style={{ fontSize: "13px", color: task.done ? MUTED : TEXT, textDecoration: task.done ? "line-through" : "none" }}>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Totais acumulados ─────────────────────────────── */}
        {metrics.length > 0 && (
          <div className="p-section p-fade-3">
            <p className="p-label">Acumulado geral</p>
            <div className="p-grid3">
              {[
                { label: "Total de Leads",  value: fmt(totalLeads) },
                { label: "Total Investido", value: fmt(totalSpend, "R$ ","",0) },
                { label: "Receita Gerada",  value: fmt(totalRevenue, "R$ ","",0), hi: true },
              ].map((s) => (
                <div key={s.label} style={{ background: CARD, border: `1px solid ${s.hi ? "rgba(0,207,255,0.22)" : "var(--up-border)"}`, borderRadius: "14px", padding: "22px 18px", position: "relative", overflow: "hidden" }}>
                  {s.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,${ACCENT},transparent)` }} />}
                  <p style={{ fontSize: "10px", color: MUTED, margin: "0 0 8px", letterSpacing: "0.14em", textTransform: "uppercase" }}>{s.label}</p>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: s.hi ? ACCENT : TEXT, margin: 0, letterSpacing: "-0.025em" }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Último período ────────────────────────────────── */}
        {lastMetric ? (
          <div className="p-section p-fade-3">
            <p className="p-label">Último período — {fmtMonth(lastMetric.month)}</p>
            <div className="p-grid3" style={{ marginBottom: "12px" }}>
              {[
                { label: "Leads",        value: fmt(lastMetric.leads) },
                { label: "Conversões",   value: fmt(lastMetric.conversions) },
                { label: "Custo/Lead",   value: fmt(cpl, "R$ ","",2) },
                { label: "Investimento", value: fmt(lastMetric.ad_spend, "R$ ","",0) },
                { label: "Receita",      value: fmt(lastMetric.revenue, "R$ ","",0), hi: true },
                { label: "ROAS",         value: fmt(roas,"","x",2), hi: roas != null && roas >= 2 },
              ].map((s) => (
                <div key={s.label} style={{ background: CARD, border: `1px solid ${s.hi ? "rgba(0,207,255,0.22)" : "var(--up-border)"}`, borderRadius: "14px", padding: "20px 18px", position: "relative", overflow: "hidden" }}>
                  {s.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg,transparent,${ACCENT},transparent)` }} />}
                  <p style={{ fontSize: "10px", color: MUTED, margin: "0 0 8px", letterSpacing: "0.14em", textTransform: "uppercase" }}>{s.label}</p>
                  <p style={{ fontSize: "22px", fontWeight: "700", color: s.hi ? ACCENT : TEXT, margin: 0, letterSpacing: "-0.02em" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {roi != null && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", background: "rgba(0,207,255,0.05)", border: "1px solid rgba(0,207,255,0.18)", borderRadius: "14px", padding: "24px 28px" }}>
                <div>
                  <p style={{ fontSize: "10px", fontWeight: "700", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 6px" }}>Retorno sobre Investimento</p>
                  <p style={{ fontSize: "13px", color: MUTED, margin: 0 }}>
                    Cada R$ 1,00 investido gerou R$ {fmt(roas,"","",2)} em receita
                  </p>
                </div>
                <p style={{ fontSize: "clamp(30px,6vw,44px)", fontWeight: "800", color: ACCENT, margin: 0, letterSpacing: "-0.04em", whiteSpace: "nowrap" }}>
                  {roi >= 0 ? "+" : ""}{fmt(roi,"","%",0)}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* ── Evolução mensal (gráficos) ────────────────────── */}
        {hasHistory && (
          <div className="p-section p-fade-4">
            <p className="p-label">Evolução mensal</p>
            <div className="p-grid2">
              <div style={{ background: CARD, border: `1px solid var(--up-border)`, borderRadius: "14px", padding: "20px 18px" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", color: MUTED, margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Leads</p>
                <p style={{ fontSize: "22px", fontWeight: "700", color: TEXT, margin: "0 0 12px" }}>{fmt(totalLeads)}</p>
                <AreaChart data={metrics} field="leads" color={ACCENT} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                  <span style={{ fontSize: "10px", color: MUTED }}>{fmtMonth(metrics[0].month)}</span>
                  <span style={{ fontSize: "10px", color: MUTED }}>{fmtMonth(metrics[metrics.length-1].month)}</span>
                </div>
              </div>
              <div style={{ background: CARD, border: `1px solid var(--up-border)`, borderRadius: "14px", padding: "20px 18px" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", color: MUTED, margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Receita</p>
                <p style={{ fontSize: "22px", fontWeight: "700", color: GREEN, margin: "0 0 12px" }}>{fmt(totalRevenue,"R$ ","",0)}</p>
                <AreaChart data={metrics} field="revenue" color={GREEN} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                  <span style={{ fontSize: "10px", color: MUTED }}>{fmtMonth(metrics[0].month)}</span>
                  <span style={{ fontSize: "10px", color: MUTED }}>{fmtMonth(metrics[metrics.length-1].month)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Histórico mensal ──────────────────────────────── */}
        {metrics.length > 1 && (
          <div className="p-section p-fade-4">
            <p className="p-label">Histórico Mensal</p>
            <div style={{ background: CARD, border: `1px solid var(--up-border)`, borderRadius: "14px", overflow: "hidden", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "480px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid var(--up-border)` }}>
                    {["Mês","Leads","Investimento","Receita","ROAS"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: h === "Mês" ? "left" : "right", fontSize: "10px", fontWeight: "600", color: MUTED, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...metrics].reverse().map((m, i) => {
                    const mRoas = m.revenue && m.ad_spend ? m.revenue / m.ad_spend : null;
                    const isLatest = i === 0;
                    return (
                      <tr key={m.id} style={{ borderBottom: i < metrics.length-1 ? `1px solid var(--up-border)` : "none", background: isLatest ? "rgba(0,207,255,0.03)" : "transparent" }}>
                        <td style={{ padding: "12px 16px", color: isLatest ? ACCENT : TEXT, fontWeight: isLatest ? "600" : "400" }}>{fmtMonth(m.month)}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", color: TEXT }}>{fmt(m.leads)}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", color: TEXT }}>{fmt(m.ad_spend,"R$ ","",0)}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", color: TEXT }}>{fmt(m.revenue,"R$ ","",0)}</td>
                        <td style={{ padding: "12px 16px", textAlign: "right", color: mRoas && mRoas >= 2 ? ACCENT : TEXT, fontWeight: mRoas && mRoas >= 2 ? "600" : "400" }}>{fmt(mRoas,"","x",2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Mensagens da equipe ───────────────────────────── */}
        {notes.length > 0 && (
          <div className="p-section p-fade-5">
            <p className="p-label">Mensagens da equipe</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {notes.map((note) => (
                <div key={note.id} style={{ background: CARD2, border: `1px solid var(--up-border)`, borderRadius: "14px", padding: "20px 22px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,207,255,0.12)", border: "1px solid rgba(0,207,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: ACCENT }}>UP</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: "600", color: TEXT, margin: 0 }}>{note.author || "Equipe Upflu"}</p>
                      <p style={{ fontSize: "10px", color: MUTED, margin: 0 }}>{fmtDate(note.created_at)}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: TEXT, margin: 0, lineHeight: "1.65", whiteSpace: "pre-wrap" }}>{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="p-fade-5" style={{ borderTop: `1px solid var(--up-border)`, paddingTop: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/upflu-logo.png" alt="UPFLU" style={{ height: "18px", opacity: 0.6 }} />
            <p style={{ fontSize: "11px", color: MUTED, margin: 0, opacity: 0.7 }}>upflu.digital · Crescimento Digital & IA</p>
          </div>
          <p style={{ fontSize: "11px", color: MUTED, margin: 0, opacity: 0.6 }}>
            Gerado em {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>

      </div>
    </div>
  );
}
