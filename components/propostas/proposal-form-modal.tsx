"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, FileText, ScrollText } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.1)";

type Service = { name: string; description: string; value: string };
type Client  = { id: string; name: string; contact_email: string | null };
type DocType = "proposal" | "contract";

type Props = {
  onClose: () => void;
  onCreated: (p: Proposal) => void;
};

export type Proposal = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  services: { name: string; description: string; value: number }[];
  total_value: number;
  valid_until: string | null;
  status: string;
  signer_name: string | null;
  signer_email: string | null;
  payment_day: number | null;
  contract_start: string | null;
  duration_months: number | null;
  autentique_short_link: string | null;
  client: { id: string; name: string } | null;
  created_at: string;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#080808",
  border: `1px solid ${BORDER}`,
  borderRadius: "6px",
  padding: "10px 12px",
  color: "#F0EDE8",
  fontSize: "13px",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: "600",
  color: "#9A9288",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: "5px",
};

export default function ProposalFormModal({ onClose, onCreated }: Props) {
  const [clients, setClients]       = useState<Client[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [docType, setDocType]       = useState<DocType>("proposal");

  const [form, setForm] = useState({
    client_id:       "",
    title:           "",
    description:     "",
    valid_until:     "",
    signer_name:     "",
    signer_email:    "",
    payment_day:     "",
    contract_start:  "",
    duration_months: "",
  });

  const [services, setServices] = useState<Service[]>([
    { name: "", description: "", value: "" },
  ]);

  useEffect(() => {
    fetch("/api/clients").then(r => r.json()).then(data =>
      setClients(data.map((c: Client) => ({ id: c.id, name: c.name, contact_email: c.contact_email })))
    );
  }, []);

  function setField(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function setServiceField(i: number, k: keyof Service, v: string) {
    setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  }

  function addService() {
    setServices(prev => [...prev, { name: "", description: "", value: "" }]);
  }

  function removeService(i: number) {
    setServices(prev => prev.filter((_, idx) => idx !== i));
  }

  const total = services.reduce((s, sv) => s + (parseFloat(sv.value) || 0), 0);

  function onClientChange(clientId: string) {
    setField("client_id", clientId);
    const c = clients.find(cl => cl.id === clientId);
    if (c) {
      setField("signer_name",  c.name);
      setField("signer_email", c.contact_email ?? "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      type:            docType,
      client_id:       form.client_id       || null,
      description:     form.description     || null,
      valid_until:     form.valid_until      || null,
      payment_day:     form.payment_day      ? Number(form.payment_day) : null,
      contract_start:  form.contract_start   || null,
      duration_months: form.duration_months  ? Number(form.duration_months) : null,
      services: services
        .filter(s => s.name.trim())
        .map(s => ({ name: s.name, description: s.description, value: parseFloat(s.value) || 0 })),
      total_value: total,
    };

    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onCreated(await res.json());
      onClose();
    }
    setSubmitting(false);
  }

  const isContract = docType === "contract";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 16px", overflowY: "auto" }}>
      <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "32px", width: "100%", maxWidth: "580px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#F0EDE8" }}>Novo Documento</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#777068", cursor: "pointer", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>

        {/* Type selector */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "24px" }}>
          {([
            { type: "proposal" as DocType, icon: FileText, label: "Proposta", sub: "Apresentação de serviços" },
            { type: "contract" as DocType, icon: ScrollText, label: "Contrato", sub: "Usa o template padrão" },
          ] as const).map(opt => (
            <button key={opt.type} type="button" onClick={() => setDocType(opt.type)}
              style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", padding: "14px 16px", borderRadius: "8px", border: `1px solid ${docType === opt.type ? "rgba(0,207,255,0.4)" : BORDER}`, background: docType === opt.type ? "rgba(0,207,255,0.07)" : "transparent", cursor: "pointer", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <opt.icon size={14} color={docType === opt.type ? ACCENT : "#777068"} strokeWidth={1.5} />
                <span style={{ fontSize: "13px", fontWeight: "600", color: docType === opt.type ? ACCENT : "#9A9288" }}>{opt.label}</span>
              </div>
              <span style={{ fontSize: "11px", color: "#777068" }}>{opt.sub}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Client */}
          <div>
            <label style={labelStyle}>Cliente</label>
            <select value={form.client_id} onChange={e => onClientChange(e.target.value)}
              style={{ ...inputStyle, color: form.client_id ? "#F0EDE8" : "#777068" }}>
              <option value="">Sem vínculo (preencher manualmente)</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Título *</label>
            <input required value={form.title} onChange={e => setField("title", e.target.value)}
              placeholder={isContract ? "Ex: Contrato Gestão de Tráfego — Barbearia Silva" : "Ex: Proposta Gestão de Tráfego Pago"}
              style={inputStyle} />
          </div>

          {/* Description (only for proposal) */}
          {!isContract && (
            <div>
              <label style={labelStyle}>Descrição (opcional)</label>
              <textarea value={form.description} onChange={e => setField("description", e.target.value)}
                placeholder="Contexto adicional..." rows={2}
                style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          )}

          {/* Signer */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Nome do destinatário *</label>
              <input required value={form.signer_name} onChange={e => setField("signer_name", e.target.value)}
                placeholder="Nome do cliente" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email do destinatário *</label>
              <input required type="email" value={form.signer_email} onChange={e => setField("signer_email", e.target.value)}
                placeholder="email@cliente.com" style={inputStyle} />
            </div>
          </div>

          {/* Contract-specific fields */}
          {isContract && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Início *</label>
                <input required={isContract} type="date" value={form.contract_start} onChange={e => setField("contract_start", e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
              <div>
                <label style={labelStyle}>Duração (meses) *</label>
                <input required={isContract} type="number" min="1" value={form.duration_months} onChange={e => setField("duration_months", e.target.value)}
                  placeholder="12" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Dia de pagto. *</label>
                <input required={isContract} type="number" min="1" max="31" value={form.payment_day} onChange={e => setField("payment_day", e.target.value)}
                  placeholder="5" style={inputStyle} />
              </div>
            </div>
          )}

          {/* Valid until (only proposal) */}
          {!isContract && (
            <div>
              <label style={labelStyle}>Validade</label>
              <input type="date" value={form.valid_until} onChange={e => setField("valid_until", e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
          )}

          {/* Services */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Serviços</label>
              <button type="button" onClick={addService}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: ACCENT, background: "transparent", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                <Plus size={12} /> Adicionar
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {services.map((s, i) => (
                <div key={i} style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", marginBottom: "8px" }}>
                    <input value={s.name} onChange={e => setServiceField(i, "name", e.target.value)}
                      placeholder="Nome do serviço" style={{ ...inputStyle, fontSize: "12px" }} />
                    <button type="button" onClick={() => removeService(i)}
                      style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "6px", color: "#777068", cursor: "pointer", padding: "0 10px" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "8px" }}>
                    <input value={s.description} onChange={e => setServiceField(i, "description", e.target.value)}
                      placeholder="Descrição (opcional)" style={{ ...inputStyle, fontSize: "12px" }} />
                    <input type="number" step="0.01" min="0" value={s.value} onChange={e => setServiceField(i, "value", e.target.value)}
                      placeholder="R$ 0,00" style={{ ...inputStyle, fontSize: "12px" }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "11px", color: "#777068" }}>Total:</span>
              <span style={{ fontSize: "18px", fontWeight: "700", color: ACCENT }}>
                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "11px", borderRadius: "7px", border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "#9A9288", fontSize: "13px", fontFamily: "inherit", cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting}
              style={{ flex: 1, padding: "11px", borderRadius: "7px", border: "none", background: ACCENT, color: "#080808", fontSize: "13px", fontWeight: "700", fontFamily: "inherit", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Criando..." : `Criar ${isContract ? "Contrato" : "Proposta"}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
