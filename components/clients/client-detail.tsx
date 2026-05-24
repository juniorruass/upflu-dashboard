"use client";

import { useState } from "react";
import { ArrowLeft, Edit2, Phone, Mail, Calendar, Plus, Send, Trash2, Clock, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Client, ClientMetric, ClientNote, ServiceType } from "@/types";
import { STATUS_LABELS, STATUS_COLORS } from "./clients-view";
import ClientFormModal from "./client-form-modal";

const GOLD = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

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

export default function ClientDetail({ initialClient }: { initialClient: Client }) {
  const router = useRouter();
  const [client, setClient] = useState<Client>(initialClient);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showMetricForm, setShowMetricForm] = useState(false);
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
    const res = await fetch(`/api/clients/${client.id}/notes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteText }),
    });
    if (res.ok) {
      const note: ClientNote = await res.json();
      setClient((prev) => ({ ...prev, notes: [note, ...(prev.notes ?? [])] }));
      setNoteText("");
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
      setShowMetricForm(false);
      setMetricForm({ month: "", leads: "", conversions: "", revenue: "", ad_spend: "" });
    }
    setSavingMetric(false);
  }

  const card = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{ background: "#111111", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "24px", ...style }}>
      {children}
    </div>
  );

  const sectionTitle = (text: string, action?: React.ReactNode) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
      <p style={{ fontSize: "12px", fontWeight: "600", color: "#777068", margin: 0, letterSpacing: "0.14em", textTransform: "uppercase" }}>{text}</p>
      {action}
    </div>
  );

  const inputMini = (val: string, onChange: (v: string) => void, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input value={val} onChange={(e) => onChange(e.target.value)} {...props}
      style={{ background: "#080808", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "8px 10px", fontSize: "12px", color: "#F0EDE8", outline: "none", width: "100%", boxSizing: "border-box" as const, fontFamily: "var(--font-outfit),sans-serif" }} />
  );

  return (
    <div style={{ padding: "32px 40px 60px", flex: 1 }}>
      {/* Back + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <Link href="/dashboard/clientes" style={{ display: "flex", alignItems: "center", gap: "6px", color: "#777068", textDecoration: "none", fontSize: "13px" }}>
          <ArrowLeft size={14} /> Clientes
        </Link>
        <div style={{ flex: 1 }} />
        <button onClick={handleDeleteClient} disabled={deleting} style={{ display: "flex", alignItems: "center", gap: "7px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: "8px", padding: "9px 16px", color: "#EF4444", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif", opacity: deleting ? 0.6 : 1 }}>
          <Trash2 size={13} /> {deleting ? "Excluindo..." : "Excluir"}
        </button>
        <button onClick={() => setShowEdit(true)} style={{ display: "flex", alignItems: "center", gap: "7px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 16px", color: "#9A9288", fontSize: "13px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif" }}>
          <Edit2 size={13} /> Editar
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", alignItems: "start" }}>
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Identity */}
          {card(<>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "20px" }}>
              <div style={{ width: "64px", height: "64px", background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.20)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "700", color: GOLD, marginBottom: "14px" }}>
                {initials(client.name)}
              </div>
              <h1 style={{ fontSize: "18px", fontWeight: "700", color: "#F0EDE8", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{client.name}</h1>
              <p style={{ fontSize: "13px", color: "#777068", margin: "0 0 12px" }}>{client.segment}</p>
              <span style={{ fontSize: "11px", fontWeight: "600", color: sc.color, background: sc.bg, padding: "4px 12px", borderRadius: "20px" }}>
                {STATUS_LABELS[client.status]}
              </span>
            </div>
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {client.contact_name && <p style={{ fontSize: "13px", color: "#F0EDE8", margin: 0 }}>{client.contact_name}</p>}
              {client.contact_phone && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Phone size={12} color="#777068" /><span style={{ fontSize: "12px", color: "#9A9288" }}>{client.contact_phone}</span></div>}
              {client.contact_email && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Mail size={12} color="#777068" /><span style={{ fontSize: "12px", color: "#9A9288" }}>{client.contact_email}</span></div>}
              {client.start_date && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Calendar size={12} color="#777068" /><span style={{ fontSize: "12px", color: "#9A9288" }}>Desde {fmtDate(client.start_date)}</span></div>}
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
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${BORDER}`, textAlign: "center" }}>
                <p style={{ fontSize: "11px", color: "#777068", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>MRR</p>
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
                    border: `1px solid ${active ? "rgba(0,207,255,0.4)" : BORDER}`,
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
              <button onClick={() => setShowMetricForm(!showMetricForm)} style={{ display: "flex", alignItems: "center", gap: "5px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "6px 12px", color: GOLD, fontSize: "11px", fontWeight: "500", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif" }}>
                <Plus size={11} /> Adicionar
              </button>
            )}

            {showMetricForm && (
              <div style={{ background: "#080808", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "10px", marginBottom: "12px" }}>
                  {[
                    { label: "Mes *", key: "month", type: "month" },
                    { label: "Leads", key: "leads", type: "number" },
                    { label: "Conversoes", key: "conversions", type: "number" },
                    { label: "Receita (R$)", key: "revenue", type: "number" },
                    { label: "Ad Spend (R$)", key: "ad_spend", type: "number" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <p style={{ fontSize: "10px", color: "#777068", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
                      {inputMini(metricForm[key as keyof typeof metricForm], (v) => setMetricForm((p) => ({ ...p, [key]: v })), { type, placeholder: "0" })}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setShowMetricForm(false)} style={{ flex: 1, padding: "8px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", color: "#9A9288", fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif" }}>Cancelar</button>
                  <button onClick={saveMetric} disabled={savingMetric} style={{ flex: 2, padding: "8px", background: GOLD, border: "none", borderRadius: "6px", color: "#080808", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "var(--font-outfit),sans-serif", opacity: savingMetric ? 0.7 : 1 }}>
                    {savingMetric ? "Salvando..." : "Salvar metrica"}
                  </button>
                </div>
              </div>
            )}

            {metrics.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#777068", textAlign: "center", padding: "24px 0" }}>Nenhuma metrica registrada ainda.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Mes","Leads","Conv.","CPL","Receita","Ad Spend","ROAS","ROI"].map((h) => (
                        <th key={h} style={{ fontSize: "10px", fontWeight: "600", color: "#777068", padding: "0 12px 10px", textAlign: "right", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
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
                        <tr key={m.id} style={{ borderTop: `1px solid ${BORDER}` }}>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "#F0EDE8", whiteSpace: "nowrap" }}>{fmtMonth(m.month)}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "#9A9288", textAlign: "right" }}>{fmtNum(m.leads)}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "#9A9288", textAlign: "right" }}>{fmtNum(m.conversions)}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "#00CFFF", textAlign: "right" }}>{cpl}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: m.revenue != null ? "#F0EDE8" : "#777068", textAlign: "right" }}>{fmtMoney(m.revenue)}</td>
                          <td style={{ padding: "10px 12px", fontSize: "12px", color: "#9A9288", textAlign: "right" }}>{fmtMoney(m.ad_spend)}</td>
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
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Adicionar nota ou atualizacao..."
                rows={2}
                style={{ flex: 1, background: "#080808", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#F0EDE8", outline: "none", resize: "vertical", fontFamily: "var(--font-outfit),sans-serif", minHeight: "60px" }}
              />
              <button onClick={addNote} disabled={addingNote || !noteText.trim()} style={{ alignSelf: "flex-end", width: "40px", height: "40px", background: noteText.trim() ? GOLD : "rgba(0,207,255,0.15)", border: "none", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: noteText.trim() ? "pointer" : "default", flexShrink: 0, transition: "background 0.15s" }}>
                <Send size={15} color={noteText.trim() ? "#080808" : "#00CFFF"} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
              {notes.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#777068", textAlign: "center", padding: "16px 0" }}>Nenhuma nota ainda.</p>
              ) : notes.map((note) => (
                <div key={note.id} style={{ background: "#080808", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "22px", height: "22px", background: "rgba(0,207,255,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", color: GOLD }}>{note.author.slice(0,2).toUpperCase()}</div>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "#9A9288" }}>{note.author}</span>
                      <span style={{ fontSize: "11px", color: "#777068" }}>{fmtDate(note.created_at)}</span>
                    </div>
                    <button onClick={() => deleteNote(note.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#777068", display: "flex", padding: "2px", opacity: 0.5 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p style={{ fontSize: "13px", color: "#F0EDE8", margin: 0, lineHeight: 1.6, fontWeight: "300" }}>{note.content}</p>
                </div>
              ))}
            </div>
          </>)}
        </div>
      </div>

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
