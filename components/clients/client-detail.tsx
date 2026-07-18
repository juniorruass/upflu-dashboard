"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Edit2, Phone, Mail, Calendar, Plus, Send, Trash2, Clock, Share2, Link2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Client, ClientMetric, ClientNote, ServiceType } from "@/types";
import { STATUS_LABELS, STATUS_COLORS } from "./clients-view";
import ClientFormModal from "./client-form-modal";
import MetaAdsPanel from "./meta-ads-panel";

const GOLD = "#00CFFF";

const SERVICE_LABELS: Record<ServiceType, string> = {
  ai: "IA", automation: "Automação", traffic: "Tráfego",
  chatbot: "Chatbot", crm: "CRM", funnel: "Funil",
  whatsapp: "WhatsApp", seo: "SEO",
};

const ALL_SERVICES: ServiceType[] = ["ai","automation","traffic","chatbot","crm","funnel","whatsapp","seo"];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMonth(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

const PORTAL_METRIC_OPTIONS: { key: string; label: string; group: string }[] = [
  { key: "leads_chart",    label: "Gráfico de Leads",       group: "Gráficos" },
  { key: "leads",          label: "Leads",                  group: "Resultados" },
  { key: "purchases",      label: "Vendas",                 group: "Resultados" },
  { key: "conversations",  label: "Conversas por mensagem", group: "Resultados" },
  { key: "profile_visits", label: "Visitas ao perfil",      group: "Resultados" },
  { key: "followers",      label: "Seguidores",             group: "Resultados" },
  { key: "spend",          label: "Investimento",           group: "Métricas Gerais" },
  { key: "roas",           label: "ROAS",                   group: "Métricas Gerais" },
  { key: "clicks",         label: "Cliques",                group: "Métricas Gerais" },
  { key: "ctr",            label: "CTR",                    group: "Métricas Gerais" },
  { key: "impressions",    label: "Impressões",             group: "Métricas Gerais" },
  { key: "reach",          label: "Alcance",                group: "Métricas Gerais" },
];

const PRIMARY_METRIC_UI_OPTIONS = [
  { key: "", label: "Automático (pelo objetivo da campanha)" },
  { key: "lead", label: "Leads" },
  { key: "purchase", label: "Vendas" },
  { key: "conversation", label: "Conversas (WhatsApp)" },
  { key: "contact", label: "Contatos" },
  { key: "complete_registration", label: "Cadastros" },
  { key: "link_click", label: "Cliques no link" },
  { key: "profile_visit", label: "Visitas ao perfil" },
];

function TokenMetaField({ clientId, currentToken, currentExpiry, onSaved }: {
  clientId: string;
  currentToken: string | null;
  currentExpiry: string | null;
  onSaved: (token: string | null, expiry: string | null) => void;
}) {
  const [token, setToken]   = useState(currentToken ?? "");
  const [expiry, setExpiry] = useState(currentExpiry ? currentExpiry.split("T")[0] : "");
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const expiryStatus = (() => {
    if (!currentExpiry) return null;
    const days = Math.ceil((new Date(currentExpiry).getTime() - Date.now()) / 86400000);
    if (days <= 0)  return { label: "Expirado", color: "#EF4444" };
    if (days <= 7)  return { label: `Expira em ${days}d`, color: "#F59E0B" };
    if (days <= 30) return { label: `Expira em ${days}d`, color: "#F0B429" };
    return { label: `Válido (${days}d)`, color: "#4ADE80" };
  })();

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meta_access_token: token || null,
        meta_token_expires_at: expiry ? new Date(expiry).toISOString() : null,
      }),
    });
    setSaving(false);
    if (res.ok) { onSaved(token || null, expiry ? new Date(expiry).toISOString() : null); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="EAAxxxxx... (Access Token)"
          style={{ flex: 1, background: "var(--up-bg)", border: "1px solid var(--up-border)", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", color: "var(--up-text)", outline: "none", fontFamily: "var(--font-outfit),sans-serif" }}
        />
        {expiryStatus && (
          <span style={{ fontSize: "11px", fontWeight: "600", color: expiryStatus.color, whiteSpace: "nowrap", background: `${expiryStatus.color}18`, padding: "4px 10px", borderRadius: "6px", border: `1px solid ${expiryStatus.color}44` }}>
            {expiryStatus.label}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "10px", color: "var(--up-text-label)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Data de expiração</span>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            style={{ background: "var(--up-bg)", border: "1px solid var(--up-border)", borderRadius: "6px", padding: "7px 10px", fontSize: "12px", color: "var(--up-text)", outline: "none", colorScheme: "dark", fontFamily: "var(--font-outfit),sans-serif" }}
          />
        </div>
        <button
          onClick={save}
          disabled={saving}
          style={{ marginTop: "18px", padding: "8px 18px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", background: saved ? "#4ADE80" : GOLD, color: "#000", border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1, fontFamily: "var(--font-outfit),sans-serif", transition: "background 0.2s" }}
        >
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar token"}
        </button>
      </div>
      <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: 0 }}>
        Token salvo aqui tem prioridade sobre o env var do Vercel. Tokens Meta expiram em ~60 dias — use um System User para token permanente.
      </p>
    </div>
  );
}

export default function ClientDetail({ initialClient }: { initialClient: Client }) {
  const router = useRouter();
  const [client, setClient] = useState<Client>(initialClient);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [savingPortalMetrics, setSavingPortalMetrics] = useState(false);
  const [savingPrimaryMetric, setSavingPrimaryMetric] = useState(false);

  async function refreshMetrics() {
    try {
      const res = await fetch(`/api/clients/${client.id}/metrics`);
      if (!res.ok) return;
      const data: ClientMetric[] = await res.json();
      setClient((prev) => ({ ...prev, metrics: data }));
      setLastSync(new Date());
    } catch { /* silent */ }
  }

  useEffect(() => {
    pollRef.current = setInterval(refreshMetrics, 30_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  function clientSlug(name: string) {
    return name.toLowerCase().normalize("NFD").split("").filter((c) => c.charCodeAt(0) < 0x0300 || c.charCodeAt(0) > 0x036f).join("").replace(/[^a-z0-9]/g, "");
  }


  function copyLink() {
    const slug = clientSlug(client.name);
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }
  const [metricForm, setMetricForm] = useState({ month: "", leads: "", conversions: "", revenue: "", ad_spend: "" });
  const [savingMetric, setSavingMetric] = useState(false);

  const sc = STATUS_COLORS[client.status];
  const services = client.services ?? [];
  const metrics = client.metrics ?? [];
  const notes = client.notes ?? [];

  async function toggleService(service: ServiceType) {
    const has = services.some((s) => s.service === service);
    const method = has ? "DELETE" : "POST";
    const res = await fetch(`/api/clients/${client.id}/services`, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service }),
    });
    if (!res.ok) return;
    setClient((prev) => ({
      ...prev,
      services: has
        ? (prev.services ?? []).filter((s) => s.service !== service)
        : [...(prev.services ?? []), { id: "", client_id: client.id, service, created_at: new Date().toISOString() }],
    }));
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setAddingNote(true);
    setNoteError("");
    try {
      const res = await fetch(`/api/clients/${client.id}/notes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteText }),
      });
      if (res.ok) {
        const note: ClientNote = await res.json();
        setClient((prev) => ({ ...prev, notes: [note, ...(prev.notes ?? [])] }));
        setNoteText("");
      } else {
        const err = await res.json().catch(() => ({}));
        setNoteError(`Erro ${res.status}: ${err.error ?? "falha ao salvar nota"}`);
      }
    } catch {
      setNoteError("Sem conexão com o servidor.");
    }
    setAddingNote(false);
  }

  async function deleteNote(noteId: string) {
    const supabaseRes = await fetch(`/api/clients/${client.id}/notes?noteId=${noteId}`, { method: "DELETE" });
    if (supabaseRes.ok) {
      setClient((prev) => ({ ...prev, notes: (prev.notes ?? []).filter((n) => n.id !== noteId) }));
    }
  }

  async function handleDeleteClient() {
    if (!confirm(`Excluir "${client.name}"? Esta ação não pode ser desfeita.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/clientes");
    else setDeleting(false);
  }

  const ALL_PORTAL_KEYS = PORTAL_METRIC_OPTIONS.map((m) => m.key);

  // Nunca usa null — sempre salva array. "Mostrar tudo" = array com todos os 11 itens.
  async function togglePortalMetric(key: string) {
    const current = client.portal_metrics ?? ALL_PORTAL_KEYS;
    let next: string[];
    if (current.includes(key)) {
      next = current.filter((k) => k !== key);
    } else {
      next = [...current, key];
    }
    if (next.length === 0) return; // não deixa esvaziar tudo
    setSavingPortalMetrics(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portal_metrics: next }),
    });
    const json = await res.json();
    if (res.ok) {
      setClient((prev) => ({ ...prev, portal_metrics: json.portal_metrics as string[] ?? next }));
    } else {
      alert("Erro ao salvar: " + (json.error ?? res.status));
    }
    setSavingPortalMetrics(false);
  }

  async function resetPortalMetrics() {
    setSavingPortalMetrics(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portal_metrics: ALL_PORTAL_KEYS }),
    });
    const json = await res.json();
    if (res.ok) {
      setClient((prev) => ({ ...prev, portal_metrics: json.portal_metrics as string[] ?? ALL_PORTAL_KEYS }));
    } else {
      alert("Erro ao salvar: " + (json.error ?? res.status));
    }
    setSavingPortalMetrics(false);
  }

  async function savePrimaryMetric(key: string) {
    setSavingPrimaryMetric(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primary_metric: key || null }),
    });
    const json = await res.json();
    if (res.ok) {
      setClient((prev) => ({ ...prev, primary_metric: json.primary_metric ?? null }));
    } else {
      alert("Erro ao salvar: " + (json.error ?? res.status));
    }
    setSavingPrimaryMetric(false);
  }

  async function saveMetric() {
    if (!metricForm.month) return;
    setSavingMetric(true);
    const res = await fetch(`/api/clients/${client.id}/metrics`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: metricForm.month + "-01",
        leads: metricForm.leads !== "" ? parseInt(metricForm.leads) : null,
        conversions: metricForm.conversions !== "" ? parseInt(metricForm.conversions) : null,
        revenue: metricForm.revenue !== "" ? parseFloat(metricForm.revenue) : null,
        ad_spend: metricForm.ad_spend !== "" ? parseFloat(metricForm.ad_spend) : null,
      }),
    });
    if (res.ok) {
      const m: ClientMetric = await res.json();
      setClient((prev) => {
        const existing = (prev.metrics ?? []).filter((x) => x.month !== m.month);
        return { ...prev, metrics: [...existing, m].sort((a, b) => a.month.localeCompare(b.month)) };
      });
      setLastSync(new Date());
      setShowMetricForm(false);
      setMetricForm({ month: "", leads: "", conversions: "", revenue: "", ad_spend: "" });
    }
    setSavingMetric(false);
  }

  const card = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "12px", padding: "24px", ...style }}>
      {children}
    </div>
  );

  const sectionTitle = (text: string, action?: React.ReactNode) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
      <p style={{ fontSize: "12px", fontWeight: "600", color: "var(--up-text-label)", margin: 0, letterSpacing: "0.14em", textTransform: "uppercase" }}>{text}</p>
      {action}
    </div>
  );

  const inputMini = (val: string, onChange: (v: string) => void, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input value={val} onChange={(e) => onChange(e.target.value)} {...props}
      style={{ background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "6px", padding: "8px 10px", fontSize: "12px", color: "var(--up-text)", outline: "none", width: "100%", boxSizing: "border-box" as const, fontFamily: "var(--font-outfit),sans-serif" }} />
  );

  return (
    <div className="cd-wrapper" style={{ padding: "32px 40px 60px", flex: 1 }}>
      {/* Back + actions */}
      <div className="cd-actions" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", flexWrap: "wrap" }}>
        <Link href="/dashboard/clientes" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--up-text-label)", textDecoration: "none", fontSize: "13px" }}>
          <ArrowLeft size={14} /> Clientes
        </Link>
        <div style={{ flex: 1 }} />
        <button onClick={copyLink} style={{ display: "flex", alignItems: "center", gap: "7px", background: linkCopied ? "rgba(0,207,255,0.1)" : "transparent", border: `1px solid ${linkCopied ? "rgba(0,207,255,0.3)" : "var(--up-border)"}`, borderRadius: "8px", padding: "9px 16px", color: linkCopied ? "#00CFFF" : "#9A9288", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif", transition: "all 0.2s" }}>
          <Link2 size={13} /> {linkCopied ? "Copiado!" : "Copiar link"}
        </button>
        <button onClick={handleDeleteClient} disabled={deleting} style={{ display: "flex", alignItems: "center", gap: "7px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "8px", padding: "9px 16px", color: "#EF4444", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif", opacity: deleting ? 0.6 : 1 }}>
          <Trash2 size={13} /> {deleting ? "Excluindo..." : "Excluir"}
        </button>
        <button onClick={() => setShowEdit(true)} style={{ display: "flex", alignItems: "center", gap: "7px", background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "8px", padding: "9px 16px", color: "var(--up-text-muted)", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif" }}>
          <Edit2 size={13} /> Editar
        </button>
      </div>

      <div className="cd-grid" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", alignItems: "start" }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Identity */}
          {card(<>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "20px" }}>
              <div style={{ width: "64px", height: "64px", background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.20)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "700", color: GOLD, marginBottom: "14px" }}>
                {initials(client.name)}
              </div>
              <h1 style={{ fontSize: "18px", fontWeight: "700", color: "var(--up-text)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{client.name}</h1>
              <p style={{ fontSize: "13px", color: "var(--up-text-label)", margin: "0 0 12px" }}>{client.segment}</p>
              <span style={{ fontSize: "11px", fontWeight: "600", color: sc.color, background: sc.bg, padding: "4px 12px", borderRadius: "20px" }}>
                {STATUS_LABELS[client.status]}
              </span>
            </div>
            <div style={{ borderTop: `1px solid var(--up-border)`, paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {client.contact_name && <p style={{ fontSize: "13px", color: "var(--up-text)", margin: 0 }}>{client.contact_name}</p>}
              {client.contact_phone && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Phone size={12} color="#777068" /><span style={{ fontSize: "12px", color: "var(--up-text-muted)" }}>{client.contact_phone}</span></div>}
              {client.contact_email && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Mail size={12} color="#777068" /><span style={{ fontSize: "12px", color: "var(--up-text-muted)" }}>{client.contact_email}</span></div>}
              {client.start_date && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={12} color="#777068" /><span style={{ fontSize: "12px", color: "var(--up-text-muted)" }}>Desde {fmtDate(client.start_date)}</span></div>}
              {client.status === "apresentacao" && client.appointment_date && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: "6px" }}>
                  <Clock size={12} color="#60A5FA" />
                  <span style={{ fontSize: "12px", color: "#60A5FA", fontWeight: "500" }}>
                    {fmtDate(client.appointment_date)}{client.appointment_time ? ` as ${client.appointment_time}` : ""}
                  </span>
                </div>
              )}
              {client.status === "captado" && client.captado_via && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: "6px" }}>
                  <Share2 size={12} color="#A78BFA" />
                  <span style={{ fontSize: "12px", color: "#A78BFA", fontWeight: "500" }}>
                    via {client.captado_via}
                  </span>
                </div>
              )}
            </div>
            {client.monthly_value > 0 && (
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid var(--up-border)`, textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "var(--up-text-label)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>MRR</p>
                <p style={{ fontSize: "28px", fontWeight: "700", color: GOLD, margin: 0, letterSpacing: "-0.03em" }}>
                  {"R$ " + client.monthly_value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
              </div>
            )}
          </>)}

          {/* Services */}
          {card(<>
            {sectionTitle("Servicos")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
              {ALL_SERVICES.map((s) => {
                const active = services.some((sv) => sv.service === s);
                return (
                  <button key={s} onClick={() => toggleService(s)} style={{
                    padding: "6px 12px", borderRadius: "6px", cursor: "pointer",
                    border: `1px solid ${active ? "rgba(0,207,255,0.4)" : "var(--up-border)"}`,
                    background: active ? "rgba(0,207,255,0.09)" : "transparent",
                    color: active ? GOLD : "#777068",
                    fontSize: "11px", fontWeight: "500",
                    fontFamily: "var(--font-outfit),sans-serif", transition: "all 0.15s",
                  }}>{SERVICE_LABELS[s]}</button>
                );
              })}
            </div>
          </>)}
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Metrics */}
          {card(<>
            {sectionTitle("Metricas mensais",
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {lastSync && (
                  <span style={{ fontSize: "10px", color: "var(--up-text-label)" }}>
                    atualizado {lastSync.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                <button onClick={refreshMetrics} title="Atualizar agora" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "6px", padding: "6px 8px", color: "var(--up-text-label)", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif" }}>
                  <RefreshCw size={11} />
                </button>
                <button onClick={() => setShowMetricForm(!showMetricForm)} style={{ display: "flex", alignItems: "center", gap: "5px", background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "6px", padding: "6px 12px", color: GOLD, fontSize: "11px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif" }}>
                  <Plus size={11} /> Adicionar
                </button>
              </div>
            )}

            {showMetricForm && (
              <div style={{ background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "10px", marginBottom: "12px" }}>
                  {[
                    { label: "Mes *", key: "month", type: "month" },
                    { label: "Leads", key: "leads", type: "number" },
                    { label: "Conversoes", key: "conversions", type: "number" },
                    { label: "Receita (R$)", key: "revenue", type: "number" },
                    { label: "Ad Spend (R$)", key: "ad_spend", type: "number" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <p style={{ fontSize: "10px", color: "var(--up-text-label)", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                      {inputMini(metricForm[key as keyof typeof metricForm], (v) => setMetricForm((p) => ({ ...p, [key]: v })), { type, placeholder: "0" })}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setShowMetricForm(false)} style={{ flex: 1, padding: "8px", background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "6px", color: "var(--up-text-muted)", fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif" }}>Cancelar</button>
                  <button onClick={saveMetric} disabled={savingMetric} style={{ flex: 2, padding: "8px", background: GOLD, border: "none", borderRadius: "6px", color: "#080808", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif", opacity: savingMetric ? 0.7 : 1 }}>
                    {savingMetric ? "Salvando..." : "Salvar metrica"}
                  </button>
                </div>
              </div>
            )}

            {metrics.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--up-text-label)", textAlign: "center", padding: "24px 0" }}>Nenhuma metrica registrada ainda.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Mes","Leads","Conv.","CPL","Receita","Ad Spend","ROAS","ROI"].map((h) => (
                        <th key={h} style={{ fontSize: "10px", fontWeight: "600", color: "var(--up-text-label)", padding: "0 12px 10px", textAlign: "right", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => {
                      const fmtNum = (v: number | null) => v != null ? v.toLocaleString("pt-BR") : "-";
                      const fmtMoney = (v: number | null) => v != null ? "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 0 }) : "-";
                      const cpl = (m.ad_spend != null && m.leads != null && m.leads > 0)
                        ? fmtMoney(m.ad_spend / m.leads) : "-";
                      const roas = (m.ad_spend != null && m.ad_spend > 0 && m.revenue != null)
                        ? (m.revenue / m.ad_spend).toFixed(2) + "x" : "-";
                      const roi = (m.ad_spend != null && m.ad_spend > 0 && m.revenue != null)
                        ? ((m.revenue - m.ad_spend) / m.ad_spend * 100).toFixed(0) : null;
                      return (
                        <tr key={m.id} style={{ borderTop: `1px solid var(--up-border)` }}>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "var(--up-text)", whiteSpace: "nowrap" }}>{fmtMonth(m.month)}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "var(--up-text-muted)", textAlign: "right" }}>{fmtNum(m.leads)}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "var(--up-text-muted)", textAlign: "right" }}>{fmtNum(m.conversions)}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "#00CFFF", textAlign: "right" }}>{cpl}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: m.revenue != null ? "#F0EDE8" : "#777068", textAlign: "right" }}>{fmtMoney(m.revenue)}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "var(--up-text-muted)", textAlign: "right" }}>{fmtMoney(m.ad_spend)}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: roas !== "-" ? "#a064ff" : "#777068", textAlign: "right", fontWeight: "600" }}>{roas}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: roi ? (parseInt(roi) >= 0 ? "#4ADE80" : "#EF4444") : "#777068", textAlign: "right", fontWeight: "600" }}>
                            {roi ? roi + "%" : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>)}

          {/* Notes */}
          {card(<>
            {sectionTitle("Notas internas")}
            <div style={{ display: "flex", gap: "8px", marginBottom: noteError ? "8px" : "20px" }}>
              <textarea
                value={noteText}
                onChange={(e) => { setNoteText(e.target.value); if (noteError) setNoteError(""); }}
                placeholder="Adicionar nota ou atualizacao..."
                rows={2}
                style={{ flex: 1, background: "var(--up-bg)", border: `1px solid ${noteError ? "rgba(239,68,68,0.4)" : "var(--up-border)"}`, borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "var(--up-text)", outline: "none", resize: "vertical", fontFamily: "var(--font-outfit),sans-serif", minHeight: "60px" }}
              />
              <button onClick={addNote} disabled={addingNote || !noteText.trim()} style={{ alignSelf: "flex-end", width: "40px", height: "40px", background: noteText.trim() ? GOLD : "rgba(0,207,255,0.15)", border: "none", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: noteText.trim() ? "pointer" : "default", flexShrink: 0, transition: "background 0.15s" }}>
                <Send size={15} color={noteText.trim() ? "#080808" : "#00CFFF"} />
              </button>
            </div>
            {noteError && (
              <p style={{ fontSize: "12px", color: "#EF4444", margin: "0 0 16px", padding: "8px 12px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px" }}>
                {noteError}
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
              {notes.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--up-text-label)", textAlign: "center", padding: "16px 0" }}>Nenhuma nota ainda.</p>
              ) : notes.map((note) => (
                <div key={note.id} style={{ background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "8px", padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "22px", height: "22px", background: "rgba(0,207,255,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", color: GOLD }}>{(note.author || "?").slice(0,2).toUpperCase()}</div>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--up-text-muted)" }}>{note.author || "Equipe"}</span>
                      <span style={{ fontSize: "11px", color: "var(--up-text-label)" }}>{fmtDate(note.created_at)}</span>
                    </div>
                    <button onClick={() => deleteNote(note.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--up-text-label)", display: "flex", padding: "2px", opacity: 0.5 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--up-text)", margin: 0, lineHeight: 1.6, fontWeight: "300" }}>{note.content}</p>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </div>

      {/* ── Métrica principal ── */}
      {client.meta_account_id && (
        <div style={{ marginTop: "20px" }}>
          {card(<>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              {sectionTitle("Métrica Principal")}
              {savingPrimaryMetric && (
                <span style={{ fontSize: "11px", color: "var(--up-text-label)" }}>Salvando...</span>
              )}
            </div>
            <p style={{ fontSize: "12px", color: "var(--up-text-label)", margin: "0 0 12px" }}>
              Qual resultado conta como &ldquo;principal&rdquo; (resultado + custo por resultado) pra esse cliente. Automático detecta pelo objetivo configurado na campanha.
            </p>
            <select
              value={client.primary_metric ?? ""}
              disabled={savingPrimaryMetric}
              onChange={(e) => savePrimaryMetric(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: "8px",
                border: "1px solid var(--up-border)", background: "var(--up-bg)",
                color: "var(--up-text)", fontSize: "13px",
                fontFamily: "var(--font-outfit),sans-serif",
              }}
            >
              {PRIMARY_METRIC_UI_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </>)}
        </div>
      )}

      {/* ── Portal: Métricas visíveis ── */}
      {client.meta_account_id && (
        <div style={{ marginTop: "20px" }}>
          {card(<>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              {sectionTitle("Portal — Métricas Visíveis")}
              {savingPortalMetrics && (
                <span style={{ fontSize: "11px", color: "var(--up-text-label)" }}>Salvando...</span>
              )}
            </div>
            <p style={{ fontSize: "12px", color: "var(--up-text-label)", margin: "0 0 16px" }}>
              Escolha o que o cliente vê no portal de anúncios.{" "}
              {client.portal_metrics !== null && client.portal_metrics.length < PORTAL_METRIC_OPTIONS.length && (
                <button onClick={resetPortalMetrics} style={{ background: "none", border: "none", color: GOLD, fontSize: "12px", cursor: "pointer", padding: 0, fontFamily: "var(--font-outfit),sans-serif", textDecoration: "underline" }}>
                  Exibir tudo
                </button>
              )}
              {(client.portal_metrics === null || client.portal_metrics.length === PORTAL_METRIC_OPTIONS.length) && <span style={{ color: GOLD }}>Exibindo tudo (padrão)</span>}
            </p>
            {(() => {
              const groups = Array.from(new Set(PORTAL_METRIC_OPTIONS.map((m) => m.group)));
              return groups.map((group) => (
                <div key={group} style={{ marginBottom: "14px" }}>
                  <p style={{ fontSize: "10px", color: "var(--up-text-label)", margin: "0 0 8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>{group}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                    {PORTAL_METRIC_OPTIONS.filter((m) => m.group === group).map((m) => {
                      const active = !client.portal_metrics || client.portal_metrics.includes(m.key);
                      return (
                        <button
                          key={m.key}
                          onClick={() => togglePortalMetric(m.key)}
                          disabled={savingPortalMetrics}
                          style={{
                            padding: "6px 12px", borderRadius: "6px", cursor: "pointer",
                            border: `1px solid ${active ? "rgba(0,207,255,0.4)" : "var(--up-border)"}`,
                            background: active ? "rgba(0,207,255,0.09)" : "transparent",
                            color: active ? GOLD : "#777068",
                            fontSize: "11px", fontWeight: "500",
                            fontFamily: "var(--font-outfit),sans-serif", transition: "all 0.15s",
                            opacity: savingPortalMetrics ? 0.6 : 1,
                          }}
                        >
                          {active ? "✓ " : ""}{m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}

            {/* Seguidores manuais */}
            <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: `1px solid var(--up-border)` }}>
              <p style={{ fontSize: "10px", color: "var(--up-text-label)", margin: "0 0 8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>Seguidores no Instagram</p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="number"
                  placeholder="Ex: 1250"
                  defaultValue={client.instagram_followers ?? ""}
                  onBlur={async (e) => {
                    const val = e.target.value === "" ? null : parseInt(e.target.value);
                    const res = await fetch(`/api/clients/${client.id}`, {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ instagram_followers: val }),
                    });
                    if (res.ok) setClient((prev) => ({ ...prev, instagram_followers: val }));
                  }}
                  style={{ width: "140px", background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "6px", padding: "8px 10px", fontSize: "13px", color: "var(--up-text)", outline: "none", fontFamily: "var(--font-outfit),sans-serif" }}
                />
                <span style={{ fontSize: "12px", color: "var(--up-text-label)" }}>Salva ao sair do campo. Aparece no portal quando a Meta não retornar dados de seguidores.</span>
              </div>
            </div>
          </>)}
        </div>
      )}

      {/* ── Token Meta ── */}
      {client.meta_account_id && (
        <div style={{ marginTop: "20px" }}>
          {card(<>
            {sectionTitle("Token Meta Ads")}
            <p style={{ fontSize: "12px", color: "var(--up-text-label)", margin: "0 0 14px" }}>
              Token de acesso à API do Meta. Fica salvo aqui — sem precisar mexer no Vercel.
            </p>
            <TokenMetaField clientId={client.id} currentToken={client.meta_access_token} currentExpiry={client.meta_token_expires_at}
              onSaved={(token, expiry) => setClient((prev) => ({ ...prev, meta_access_token: token, meta_token_expires_at: expiry }))} />
          </>)}
        </div>
      )}

      {/* ── Meta Ads full panel ── */}
      {client.meta_account_id && (
        <div style={{ marginTop: "20px" }}>
          <p style={{ fontSize: "10px", fontWeight: "600", color: "var(--up-text-label)", margin: "0 0 14px", letterSpacing: "0.18em", textTransform: "uppercase" }}>Meta Ads — conta {client.meta_account_id}</p>
          <MetaAdsPanel clientId={client.id} />
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .cd-wrapper { padding: 16px 16px 40px !important; }
          .cd-grid { grid-template-columns: 1fr !important; }
          .cd-actions { gap: 8px !important; }
          .cd-actions a { font-size: 12px !important; }
          .cd-actions button { font-size: 12px !important; padding: 8px 12px !important; }
        }
      `}</style>
      {showEdit && (
        <ClientFormModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => { setClient((prev) => ({ ...prev, ...updated })); setShowEdit(false); }}
        />
      )}
    </div>
  );
}
