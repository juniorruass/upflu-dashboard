"use client";

import { useEffect, useState } from "react";
import { Plus, Check, Trash2, AlertCircle, Clock, CheckCircle2, X, Receipt, Landmark } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";
const BG_CARD = "#111111";

type Expense = {
  id: string;
  title: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  type: "expense" | "tax";
  category: string | null;
  notes: string | null;
};

const EXPENSE_CATEGORIES = ["Ferramenta", "Salário", "Aluguel", "Marketing", "Serviço", "Outro"];
const TAX_CATEGORIES = ["DAS / MEI", "IRPF", "IRPJ", "ISS", "PIS/COFINS", "Outro"];

function today() { return new Date().toISOString().split("T")[0]; }
function currency(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function daysOverdue(due: string) {
  return Math.floor((Date.now() - new Date(due + "T00:00:00").getTime()) / 86400000);
}

function status(e: Expense): "paid" | "late" | "pending" {
  if (e.paid_date) return "paid";
  if (e.due_date < today()) return "late";
  return "pending";
}

const STATUS_CFG = {
  paid:    { label: "Pago",     color: "#4CAF50", bg: "rgba(76,175,80,0.1)",   border: "rgba(76,175,80,0.2)",   Icon: CheckCircle2 },
  pending: { label: "Pendente", color: "#F0B429", bg: "rgba(240,180,41,0.08)", border: "rgba(240,180,41,0.2)",  Icon: Clock },
  late:    { label: "Atrasado", color: "#FF6B6B", bg: "rgba(255,107,107,0.1)", border: "rgba(255,107,107,0.2)", Icon: AlertCircle },
};

type Tab = "expense" | "tax";

export default function ExpensesSection() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("expense");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", amount: "", due_date: "", category: "", notes: "", type: "expense" as Tab });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/expenses");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  async function markPaid(e: Expense) {
    const res = await fetch(`/api/expenses/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid_date: today() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(prev => prev.map(x => x.id === updated.id ? updated : x));
    }
  }

  async function del(id: string) {
    if (!confirm("Excluir este lançamento?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) setItems(prev => prev.filter(x => x.id !== id));
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type: tab }),
    });
    if (res.ok) {
      const created = await res.json();
      setItems(prev => [...prev, created].sort((a, b) => a.due_date.localeCompare(b.due_date)));
      setShowModal(false);
      setForm({ title: "", amount: "", due_date: "", category: "", notes: "", type: "expense" });
    }
    setSubmitting(false);
  }

  const filtered = items.filter(i => i.type === tab);
  const lateCount = filtered.filter(i => status(i) === "late").length;
  const totalPending = filtered.filter(i => !i.paid_date).reduce((s, i) => s + i.amount, 0);
  const totalPaid = filtered.filter(i => i.paid_date).reduce((s, i) => s + i.amount, 0);

  const categories = tab === "tax" ? TAX_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div style={{ marginTop: "14px" }}>
      <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "28px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Tabs */}
            {([
              { key: "expense" as Tab, label: "Contas a Pagar", Icon: Receipt },
              { key: "tax" as Tab,     label: "Impostos",       Icon: Landmark },
            ] as const).map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setTab(key)} style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: tab === key ? "600" : "400",
                color: tab === key ? "#F0EDE8" : "#777068",
                padding: "0 0 8px",
                borderBottom: tab === key ? `2px solid ${ACCENT}` : "2px solid transparent",
                fontFamily: "var(--font-outfit),sans-serif",
                transition: "color 0.15s",
              }}>
                <Icon size={14} strokeWidth={1.5} />
                {label}
              </button>
            ))}
            {lateCount > 0 && (
              <span style={{ fontSize: "10px", fontWeight: "600", color: "#FF6B6B", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.25)", padding: "2px 8px", borderRadius: "4px" }}>
                {lateCount} em atraso
              </span>
            )}
          </div>
          <button onClick={() => { setForm(f => ({ ...f, type: tab })); setShowModal(true); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", padding: "7px 14px", borderRadius: "6px", border: "none", cursor: "pointer", background: ACCENT, color: "#080808", fontFamily: "inherit" }}>
            <Plus size={13} strokeWidth={2.5} /> Registrar
          </button>
        </div>

        {/* Summary strip */}
        {filtered.length > 0 && (
          <div style={{ display: "flex", gap: "24px", marginBottom: "16px", paddingBottom: "16px", borderBottom: `1px solid ${BORDER}` }}>
            <div>
              <p style={{ fontSize: "10px", color: "#777068", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>A pagar</p>
              <p style={{ fontSize: "17px", fontWeight: "700", color: "#FF6B6B", margin: 0, letterSpacing: "-0.02em" }}>{currency(totalPending)}</p>
            </div>
            <div>
              <p style={{ fontSize: "10px", color: "#777068", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pago</p>
              <p style={{ fontSize: "17px", fontWeight: "700", color: "#4CAF50", margin: 0, letterSpacing: "-0.02em" }}>{currency(totalPaid)}</p>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p style={{ fontSize: "13px", color: "#777068", margin: "32px 0", textAlign: "center" }}>Carregando...</p>
        ) : filtered.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#777068", margin: "32px 0", textAlign: "center" }}>
            Nenhum lançamento ainda.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Descrição", "Categoria", "Valor", "Vencimento", "Status", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: "500", color: "#777068", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1px solid ${BORDER}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const s = status(e);
                  const cfg = STATUS_CFG[s];
                  const overdue = s === "late" ? daysOverdue(e.due_date) : 0;
                  return (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: "12px", color: "#F0EDE8", fontWeight: "500" }}>
                        {e.title}
                        {e.notes && <span style={{ display: "block", fontSize: "11px", color: "#777068", fontWeight: "300" }}>{e.notes}</span>}
                      </td>
                      <td style={{ padding: "12px", color: "#777068", fontSize: "12px" }}>
                        {e.category ?? "—"}
                      </td>
                      <td style={{ padding: "12px", color: s === "late" ? "#FF6B6B" : "#F0EDE8", fontWeight: "600" }}>
                        {currency(e.amount)}
                      </td>
                      <td style={{ padding: "12px", color: "#9A9288" }}>
                        {formatDate(e.due_date)}
                        {s === "late" && <span style={{ display: "block", fontSize: "10px", color: "#FF6B6B" }}>{overdue}d em atraso</span>}
                        {s === "paid" && e.paid_date && <span style={{ display: "block", fontSize: "10px", color: "#4CAF50" }}>pago em {formatDate(e.paid_date)}</span>}
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "600", color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "3px 9px", borderRadius: "4px" }}>
                          <cfg.Icon size={11} strokeWidth={2} />{cfg.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {s !== "paid" && (
                            <button onClick={() => markPaid(e)}
                              style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", padding: "5px 10px", borderRadius: "5px", border: "1px solid rgba(76,175,80,0.3)", background: "rgba(76,175,80,0.08)", color: "#4CAF50", cursor: "pointer", fontFamily: "inherit", fontWeight: "600" }}>
                              <Check size={12} strokeWidth={2.5} /> Pago
                            </button>
                          )}
                          <button onClick={() => del(e.id)}
                            style={{ display: "flex", alignItems: "center", padding: "5px 8px", borderRadius: "5px", border: `1px solid ${BORDER}`, background: "transparent", color: "#777068", cursor: "pointer" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#111111", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: "12px", padding: "32px", width: "100%", maxWidth: "440px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#F0EDE8" }}>
                {tab === "tax" ? "Registrar Imposto" : "Registrar Conta"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "#777068", cursor: "pointer", padding: "4px" }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "500", color: "#9A9288", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Descrição *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={tab === "tax" ? "Ex: DAS Maio 2025" : "Ex: Conta de internet"}
                  style={{ width: "100%", background: "#080808", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "6px", padding: "10px 12px", color: "#F0EDE8", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#9A9288", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Valor (R$) *</label>
                  <input required type="number" step="0.01" min="0" placeholder="0,00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    style={{ width: "100%", background: "#080808", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "6px", padding: "10px 12px", color: "#F0EDE8", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "500", color: "#9A9288", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Vencimento *</label>
                  <input required type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    style={{ width: "100%", background: "#080808", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "6px", padding: "10px 12px", color: "#F0EDE8", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "500", color: "#9A9288", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Categoria</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: "100%", background: "#080808", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "6px", padding: "10px 12px", color: form.category ? "#F0EDE8" : "#777068", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}>
                  <option value="">Selecionar</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "500", color: "#9A9288", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Observação</label>
                <input type="text" placeholder="Opcional" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width: "100%", background: "#080808", border: `1px solid rgba(255,255,255,0.1)`, borderRadius: "6px", padding: "10px 12px", color: "#F0EDE8", fontSize: "13px", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "11px", borderRadius: "7px", border: `1px solid ${BORDER}`, background: "transparent", color: "#9A9288", fontSize: "13px", fontFamily: "inherit", cursor: "pointer" }}>Cancelar</button>
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
