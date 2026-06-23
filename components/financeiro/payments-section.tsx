"use client";

import { useEffect, useState } from "react";
import { Plus, Check, Trash2, AlertCircle, Clock, CheckCircle2, X } from "lucide-react";

const ACCENT = "#00CFFF";
const BG_CARD = "#111111";

type Payment = {
  id: string;
  client_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  client: { id: string; name: string } | null;
};

type Client = { id: string; name: string };

function today() {
  return new Date().toISOString().split("T")[0];
}

function paymentStatus(p: Payment): "paid" | "late" | "pending" {
  if (p.paid_date) return "paid";
  if (p.due_date < today()) return "late";
  return "pending";
}

function currency(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function daysOverdue(due_date: string) {
  const diff = Math.floor((Date.now() - new Date(due_date + "T00:00:00").getTime()) / 86400000);
  return diff;
}

const STATUS_CONFIG = {
  paid:    { label: "Pago",      color: "#4CAF50", bg: "rgba(76,175,80,0.1)",   border: "rgba(76,175,80,0.2)",   icon: CheckCircle2 },
  pending: { label: "Pendente",  color: "var(--up-text)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", icon: Clock },
  late:    { label: "Atrasado",  color: "#FF6B6B", bg: "rgba(255,107,107,0.1)", border: "rgba(255,107,107,0.2)", icon: AlertCircle },
};

const FILTER_OPTIONS = ["Todos", "Pendente", "Atrasado", "Pago"] as const;
type Filter = typeof FILTER_OPTIONS[number];

export default function PaymentsSection() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("Todos");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const [form, setForm] = useState({
    client_id: "",
    amount: "",
    due_date: "",
    notes: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchClients();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    const res = await fetch("/api/payments");
    if (res.ok) setPayments(await res.json());
    setLoading(false);
  }

  async function fetchClients() {
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = await res.json();
      setClients(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
    }
  }

  async function markPaid(p: Payment) {
    setMarkingPaidId(p.id);
    const res = await fetch(`/api/payments/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid_date: today() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPayments(prev => prev.map(x => x.id === updated.id ? updated : x));
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(errData.error || `Erro ao marcar como pago (${res.status})`);
    }
    setMarkingPaidId(null);
  }

  async function deletePayment(id: string) {
    if (!confirm("Excluir este pagamento?")) return;
    const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
    if (res.ok) setPayments(prev => prev.filter(x => x.id !== id));
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const created = await res.json();
        setPayments(prev => [...prev, created].sort((a, b) => a.due_date.localeCompare(b.due_date)));
        setShowModal(false);
        setForm({ client_id: "", amount: "", due_date: "", notes: "" });
      } else {
        const errData = await res.json().catch(() => ({}));
        setFormError(errData.error || `Erro ao registrar (${res.status})`);
      }
    } catch {
      setFormError("Erro de conexão. Tente novamente.");
    }
    setSubmitting(false);
  }

  const filtered = payments.filter(p => {
    const s = paymentStatus(p);
    if (filter === "Todos") return true;
    if (filter === "Pago") return s === "paid";
    if (filter === "Pendente") return s === "pending";
    if (filter === "Atrasado") return s === "late";
    return true;
  });

  const lateCount = payments.filter(p => paymentStatus(p) === "late").length;

  return (
    <div style={{ marginTop: "14px" }}>
      <style>{`@media (max-width: 640px) { .ps-card { padding: 16px !important; } }`}</style>
      <div className="ps-card" style={{ background: BG_CARD, border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "28px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <p style={{ fontSize: "11px", fontWeight: "500", color: "var(--up-text-label)", margin: 0, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              Pagamentos
            </p>
            {lateCount > 0 && (
              <span style={{ fontSize: "10px", fontWeight: "600", color: "#FF6B6B", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)", padding: "2px 8px", borderRadius: "4px" }}>
                {lateCount} em atraso
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {/* Filters */}
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {FILTER_OPTIONS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ fontSize: "11px", padding: "5px 10px", borderRadius: "5px", border: "1px solid", cursor: "pointer", fontFamily: "inherit", fontWeight: filter === f ? "600" : "400", background: filter === f ? "rgba(0,207,255,0.1)" : "transparent", color: filter === f ? ACCENT : "#777068", borderColor: filter === f ? "rgba(0,207,255,0.3)" : "var(--up-border)" }}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", padding: "7px 14px", borderRadius: "6px", border: "none", cursor: "pointer", background: ACCENT, color: "#080808", fontFamily: "inherit" }}>
              <Plus size={13} strokeWidth={2.5} />
              Registrar
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ fontSize: "13px", color: "var(--up-text-label)", margin: "32px 0", textAlign: "center" }}>Carregando...</p>
        ) : filtered.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--up-text-label)", margin: "32px 0", textAlign: "center" }}>Nenhum pagamento encontrado.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Cliente", "Valor", "Vencimento", "Status", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: "500", color: "var(--up-text-label)", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1px solid var(--up-border)` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const s = paymentStatus(p);
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  const overdue = s === "late" ? daysOverdue(p.due_date) : 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid var(--up-border)` }}>
                      <td style={{ padding: "12px", color: "var(--up-text)", fontWeight: "500" }}>
                        {p.client?.name ?? "—"}
                        {p.notes && <span style={{ display: "block", fontSize: "11px", color: "var(--up-text-label)", fontWeight: "300" }}>{p.notes}</span>}
                      </td>
                      <td style={{ padding: "12px", color: s === "late" ? "#FF6B6B" : "#F0EDE8", fontWeight: "600" }}>
                        {currency(p.amount)}
                      </td>
                      <td style={{ padding: "12px", color: "var(--up-text-muted)" }}>
                        {formatDate(p.due_date)}
                        {s === "late" && (
                          <span style={{ display: "block", fontSize: "10px", color: "#FF6B6B" }}>{overdue}d em atraso</span>
                        )}
                        {s === "paid" && p.paid_date && (
                          <span style={{ display: "block", fontSize: "10px", color: "#4CAF50" }}>pago em {formatDate(p.paid_date)}</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "600", color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "3px 9px", borderRadius: "4px" }}>
                          <Icon size={11} strokeWidth={2} />
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {s !== "paid" && (
                            <button
                              onClick={() => markPaid(p)}
                              disabled={markingPaidId === p.id}
                              title="Marcar como pago"
                              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "5px 10px", borderRadius: "5px", border: "1px solid rgba(76,175,80,0.3)", background: markingPaidId === p.id ? "rgba(76,175,80,0.04)" : "rgba(76,175,80,0.08)", color: "#4CAF50", cursor: markingPaidId === p.id ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: "600", opacity: markingPaidId === p.id ? 0.6 : 1, transition: "opacity 0.15s", minWidth: "62px", justifyContent: "center" }}
                            >
                              {markingPaidId === p.id
                                ? <span style={{ letterSpacing: "0.1em" }}>···</span>
                                : <><Check size={12} strokeWidth={2.5} />Pago</>
                              }
                            </button>
                          )}
                          <button onClick={() => deletePayment(p.id)} title="Excluir"
                            style={{ display: "flex", alignItems: "center", padding: "5px 8px", borderRadius: "5px", border: `1px solid var(--up-border)`, background: "transparent", color: "var(--up-text-label)", cursor: "pointer" }}>
                            <Trash2 size={12} strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--up-card)", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: "12px", padding: "32px", width: "100%", maxWidth: "440px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "var(--up-text)" }}>Registrar Pagamento</h3>
              <button onClick={() => { setShowModal(false); setFormError(null); }} style={{ background: "transparent", border: "none", color: "var(--up-text-label)", cursor: "pointer", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitPayment} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--up-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Cliente *
                </label>
                <select required value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  style={{ width: "100%", background: "var(--up-bg)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "6px", padding: "10px 12px", color: form.client_id ? "#F0EDE8" : "#777068", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
                  <option value="">Selecionar cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--up-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Valor (R$) *
                  </label>
                  <input required type="number" step="0.01" min="0" placeholder="0,00"
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    style={{ width: "100%", background: "var(--up-bg)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "6px", padding: "10px 12px", color: "var(--up-text)", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--up-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    Vencimento *
                  </label>
                  <input required type="date"
                    value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    style={{ width: "100%", background: "var(--up-bg)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "6px", padding: "10px 12px", color: "var(--up-text)", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "500", color: "var(--up-text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Observação
                </label>
                <input type="text" placeholder="Ex: mensalidade maio, parcela 2..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width: "100%", background: "var(--up-bg)", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "6px", padding: "10px 12px", color: "var(--up-text)", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>

              {formError && (
                <div style={{ background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: "#FF6B6B" }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button type="button" onClick={() => { setShowModal(false); setFormError(null); }}
                  style={{ flex: 1, padding: "11px", borderRadius: "7px", border: `1px solid var(--up-border)`, background: "transparent", color: "var(--up-text-muted)", fontSize: "13px", fontFamily: "inherit", cursor: "pointer" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: "11px", borderRadius: "7px", border: "none", background: ACCENT, color: "#080808", fontSize: "13px", fontWeight: "700", fontFamily: "inherit", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Salvando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
