"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Client, ClientStatus, ServiceType } from "@/types";

const GOLD = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

const SERVICES: { key: ServiceType; label: string }[] = [
  { key: "ai", label: "IA" }, { key: "automation", label: "Automacao" },
  { key: "traffic", label: "Trafego Pago" }, { key: "chatbot", label: "Chatbot" },
  { key: "crm", label: "CRM" }, { key: "funnel", label: "Funil" },
  { key: "whatsapp", label: "WhatsApp" }, { key: "seo", label: "SEO" },
];

const SEGMENTS = [
  "Saude & Estetica", "Alimentacao", "Educacao", "Juridico", "Imoveis",
  "Varejo", "Servicos", "Tecnologia", "Fitness", "Pet", "Outro",
];

const CAPTADO_CHANNELS = [
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
];

interface Props {
  client?: Client;
  onClose: () => void;
  onSaved: (client: Client) => void;
}

export default function ClientFormModal({ client, onClose, onSaved }: Props) {
  const editing = !!client;

  const [form, setForm] = useState({
    name: client?.name ?? "",
    segment: client?.segment ?? "",
    contact_name: client?.contact_name ?? "",
    contact_phone: client?.contact_phone ?? "",
    contact_email: client?.contact_email ?? "",
    portal_password: (client as Client & { portal_password?: string })?.portal_password ?? "",
    status: (client?.status ?? "onboarding") as ClientStatus,
    monthly_value: client?.monthly_value ? String(client.monthly_value) : "",
    start_date: client?.start_date ?? "",
    appointment_date: client?.appointment_date ?? "",
    appointment_time: client?.appointment_time ?? "",
    meta_account_id: client?.meta_account_id ?? "",
    slug: client?.slug ?? "",
  });

  const [captadoChannels, setCaptadoChannels] = useState<string[]>(
    client?.captado_via ? client.captado_via.split(",").map((s) => s.trim()).filter(Boolean) : []
  );

  const [selectedServices, setSelectedServices] = useState<ServiceType[]>(
    client?.services?.map((s) => s.service as ServiceType) ?? []
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);

  function toggleService(s: ServiceType) {
    setSelectedServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function toggleChannel(ch: string) {
    setCaptadoChannels((prev) => prev.includes(ch) ? prev.filter((x) => x !== ch) : [...prev, ch]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("O nome do cliente e obrigatorio."); return; }

    setLoading(true); setError(null);
    try {
      const url = editing ? `/api/clients/${client!.id}` : "/api/clients";
      const method = editing ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        ...form,
        monthly_value: parseFloat(form.monthly_value) || 0,
        segment: form.segment || "Outro",
        appointment_date: form.status === "apresentacao" ? (form.appointment_date || null) : null,
        appointment_time: form.status === "apresentacao" ? (form.appointment_time || null) : null,
        captado_via: form.status === "captado" ? (captadoChannels.join(", ") || null) : null,
      };

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.");

      if (!editing && selectedServices.length > 0) {
        await Promise.all(selectedServices.map((s) =>
          fetch(`/api/clients/${data.id}/services`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service: s }),
          })
        ));
        data.services = selectedServices.map((s) => ({ service: s }));
      }

      onSaved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido.");
    } finally { setLoading(false); }
  }

  const inputStyle = (field: string) => ({
    width: "100%", background: "#080808",
    border: `1px solid ${focusField === field ? "rgba(0,207,255,0.5)" : BORDER}`,
    borderRadius: "8px", padding: "11px 14px",
    fontSize: "13px", color: "#F0EDE8", outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "var(--font-outfit),sans-serif",
    transition: "border-color 0.15s",
  });

  const labelStyle = {
    display: "block" as const, fontSize: "11px", fontWeight: "500" as const,
    color: "#9A9288", marginBottom: "7px", letterSpacing: "0.08em", textTransform: "uppercase" as const,
  };

  const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
    { value: "apresentacao", label: "Apresentacao" },
    { value: "captado", label: "Captado" },
    { value: "onboarding", label: "Onboarding" },
    { value: "active", label: "Ativo" },
    { value: "paused", label: "Pausado" },
    { value: "ended", label: "Encerrado" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "24px" }}>
      <div style={{ background: "#111111", border: `1px solid ${BORDER}`, borderRadius: "14px", width: "100%", maxWidth: "580px", maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#F0EDE8", margin: "0 0 2px", letterSpacing: "-0.02em" }}>
              {editing ? "Editar cliente" : "Novo cadastro"}
            </h2>
            <p style={{ fontSize: "12px", color: "#777068", margin: 0 }}>Preencha as informacoes do cliente</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#777068", display: "flex", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "28px" }}>
          <div style={{ display: "grid", gap: "20px" }}>

            {/* Name + Segment */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Nome *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome da empresa" onFocus={() => setFocusField("name")} onBlur={() => setFocusField(null)} style={inputStyle("name")} />
              </div>
              <div>
                <label style={labelStyle}>Segmento</label>
                <select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })} onFocus={() => setFocusField("segment")} onBlur={() => setFocusField(null)} style={{ ...inputStyle("segment"), appearance: "none" as const }}>
                  <option value="">Selecionar...</option>
                  {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Contact */}
            <div>
              <label style={labelStyle}>Nome do contato</label>
              <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Responsavel" onFocus={() => setFocusField("contact_name")} onBlur={() => setFocusField(null)} style={inputStyle("contact_name")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Telefone</label>
                <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="(11) 99999-9999" onFocus={() => setFocusField("phone")} onBlur={() => setFocusField(null)} style={inputStyle("phone")} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="email@empresa.com" type="email" onFocus={() => setFocusField("email")} onBlur={() => setFocusField(null)} style={inputStyle("email")} />
              </div>
            </div>

            {/* Status */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ClientStatus })} style={{ ...inputStyle("status"), appearance: "none" as const }}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>MRR (R$)</label>
                <input value={form.monthly_value} onChange={(e) => setForm({ ...form, monthly_value: e.target.value })} placeholder="0" type="number" min="0" onFocus={() => setFocusField("mrr")} onBlur={() => setFocusField(null)} style={inputStyle("mrr")} />
              </div>
            </div>

            {/* Conditional: Apresentacao */}
            {form.status === "apresentacao" && (
              <div style={{ background: "rgba(0,207,255,0.04)", border: "1px solid rgba(0,207,255,0.15)", borderRadius: "10px", padding: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", color: GOLD, margin: "0 0 14px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Dados da apresentacao
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Data</label>
                    <input value={form.appointment_date} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} type="date" onFocus={() => setFocusField("appt_date")} onBlur={() => setFocusField(null)} style={{ ...inputStyle("appt_date"), colorScheme: "dark" }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Horario</label>
                    <input value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} type="time" onFocus={() => setFocusField("appt_time")} onBlur={() => setFocusField(null)} style={{ ...inputStyle("appt_time"), colorScheme: "dark" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Conditional: Captado */}
            {form.status === "captado" && (
              <div style={{ background: "rgba(0,207,255,0.04)", border: "1px solid rgba(0,207,255,0.15)", borderRadius: "10px", padding: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", color: GOLD, margin: "0 0 14px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Canal de captacao
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  {CAPTADO_CHANNELS.map(({ key, label }) => {
                    const active = captadoChannels.includes(key);
                    return (
                      <button key={key} type="button" onClick={() => toggleChannel(key)} style={{
                        padding: "8px 18px", borderRadius: "6px", cursor: "pointer",
                        border: `1px solid ${active ? "rgba(0,207,255,0.45)" : BORDER}`,
                        background: active ? "rgba(0,207,255,0.10)" : "transparent",
                        color: active ? GOLD : "#9A9288",
                        fontSize: "13px", fontWeight: "500",
                        fontFamily: "var(--font-outfit),sans-serif",
                        transition: "all 0.15s",
                      }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Slug + Meta Ads */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={labelStyle}>Slug do portal</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "#777068", pointerEvents: "none" }}>adm.upflu.digital/</span>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                    placeholder="nomeCliente"
                    onFocus={() => setFocusField("slug")}
                    onBlur={() => setFocusField(null)}
                    style={{ ...inputStyle("slug"), paddingLeft: "130px" }}
                  />
                </div>
                <p style={{ fontSize: "11px", color: "#777068", margin: "5px 0 0" }}>URL pública do cliente. Só letras, números e hífen.</p>
              </div>
              <div>
                <label style={labelStyle}>ID Conta Meta Ads</label>
                <input value={form.meta_account_id} onChange={(e) => setForm({ ...form, meta_account_id: e.target.value })} placeholder="Ex: 123456789012345" onFocus={() => setFocusField("meta")} onBlur={() => setFocusField(null)} style={inputStyle("meta")} />
                <p style={{ fontSize: "11px", color: "#777068", margin: "5px 0 0" }}>Meta Business → Gerenciador → Configurações</p>
              </div>
            </div>

            {/* Portal access */}
            <div style={{ background: "rgba(0,207,255,0.04)", border: "1px solid rgba(0,207,255,0.12)", borderRadius: "10px", padding: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: GOLD, margin: "0 0 14px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Acesso ao portal do cliente
              </p>
              <p style={{ fontSize: "11px", color: "#777068", margin: "0 0 14px" }}>
                Email de login: <strong style={{ color: "#9A9288" }}>{form.contact_email || "—"}</strong>
              </p>
              <div>
                <label style={labelStyle}>Senha de acesso</label>
                <input
                  value={form.portal_password}
                  onChange={(e) => setForm({ ...form, portal_password: e.target.value })}
                  placeholder="Definir senha do cliente"
                  type="text"
                  onFocus={() => setFocusField("portal_password")}
                  onBlur={() => setFocusField(null)}
                  style={inputStyle("portal_password")}
                />
              </div>
            </div>

            {/* Start date */}
            <div>
              <label style={labelStyle}>Data de inicio</label>
              <input value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} type="date" onFocus={() => setFocusField("start")} onBlur={() => setFocusField(null)} style={{ ...inputStyle("start"), colorScheme: "dark" }} />
            </div>

            {/* Services */}
            <div>
              <label style={{ ...labelStyle, marginBottom: "10px" }}>Servicos contratados</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {SERVICES.map(({ key, label }) => {
                  const active = selectedServices.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => toggleService(key)} style={{
                      padding: "7px 14px", borderRadius: "6px", cursor: "pointer",
                      border: `1px solid ${active ? "rgba(0,207,255,0.45)" : BORDER}`,
                      background: active ? "rgba(0,207,255,0.10)" : "transparent",
                      color: active ? GOLD : "#9A9288",
                      fontSize: "12px", fontWeight: "500",
                      fontFamily: "var(--font-outfit),sans-serif",
                      transition: "all 0.15s",
                    }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", padding: "12px", fontSize: "13px", color: "#EF4444" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "8px", color: "#9A9288", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif" }}>
                Cancelar
              </button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: "12px", background: GOLD, border: "none", borderRadius: "8px", color: "#080808", fontSize: "13px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "var(--font-outfit),sans-serif", opacity: loading ? 0.7 : 1 }}>
                {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />Salvando...</> : editing ? "Salvar alteracoes" : "Cadastrar"}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
