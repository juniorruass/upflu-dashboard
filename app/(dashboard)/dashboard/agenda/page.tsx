"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import { Plus, Trash2, Check, X, User, Bell, RefreshCw, ChevronRight } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

type Client = { id: string; name: string; contact_phone?: string; contact_email?: string };
type Instance = { name: string; connectionStatus: string };

type AgendaEvent = {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  starts_at: string;
  ends_at: string | null;
  notify_admin_whatsapp: boolean;
  notify_admin_email: boolean;
  notify_client_whatsapp: boolean;
  notify_client_email: boolean;
  status: string;
  notified_at: string | null;
  created_at: string;
  clients?: Client | null;
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#FF9500",
  notified: "#00CFFF",
  done: "#22c55e",
  cancelled: "#ef4444",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Agendado",
  notified: "Notificado",
  done: "Concluído",
  cancelled: "Cancelado",
};

const emptyForm = {
  title: "",
  description: "",
  client_id: "",
  starts_at: "",
  ends_at: "",
  notify_admin_whatsapp: true,
  notify_admin_email: false,
  notify_client_whatsapp: false,
  notify_client_email: false,
  notify_instance: "",
  notify_admin_phone: "",
};

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: "40px", height: "22px", borderRadius: "11px", cursor: "pointer",
        background: on ? ACCENT : "#2a2a2a",
        position: "relative", flexShrink: 0, transition: "background 0.2s",
        border: `1px solid ${on ? ACCENT : "#3a3a3a"}`,
      }}
    >
      <div style={{
        position: "absolute", top: "3px",
        left: on ? "19px" : "3px",
        width: "14px", height: "14px", borderRadius: "50%",
        background: on ? "#000" : "#666",
        transition: "left 0.2s",
      }} />
    </div>
  );
}

export default function AgendaPage() {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agenda");
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(Array.isArray(data) ? data : (data.clients ?? []));
    } catch { /* silent */ }
  }, []);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/evolution");
      const data = await res.json();
      setInstances((data.instances ?? []).filter((i: Instance) => i.connectionStatus === "open"));
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchEvents(); fetchClients(); fetchInstances(); }, [fetchEvents, fetchClients, fetchInstances]);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setSaveError("");
    setShowForm(true);
  }

  function openEdit(ev: AgendaEvent) {
    setForm({
      title: ev.title,
      description: ev.description ?? "",
      client_id: ev.client_id ?? "",
      starts_at: ev.starts_at.slice(0, 16),
      ends_at: ev.ends_at ? ev.ends_at.slice(0, 16) : "",
      notify_admin_whatsapp: ev.notify_admin_whatsapp,
      notify_admin_email: ev.notify_admin_email,
      notify_client_whatsapp: ev.notify_client_whatsapp,
      notify_client_email: ev.notify_client_email,
      notify_instance: (ev as AgendaEvent & { notify_instance?: string }).notify_instance ?? "",
      notify_admin_phone: (ev as AgendaEvent & { notify_admin_phone?: string }).notify_admin_phone ?? "",
    });
    setEditingId(ev.id);
    setSaveError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.starts_at) { setSaveError("Preencha título e data de início."); return; }
    setSaving(true);
    setSaveError("");

    const payload = {
      ...form,
      client_id: form.client_id || null,
      // converte datetime-local (horário local) para ISO UTC
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      description: form.description || null,
      notify_instance: form.notify_instance || null,
      notify_admin_phone: form.notify_admin_phone || null,
    };

    try {
      const url = editingId ? `/api/agenda/${editingId}` : "/api/agenda";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setSaveError(data.error ?? "Erro ao salvar."); return; }

      // mostra resultado da notificação
      if (data.notifyLog) {
        const log = data.notifyLog;
        const erros: string[] = [];
        if (log.adminSent === false)  erros.push(`Admin: ${log.adminReason ?? log.adminPhone}`);
        if (log.clientSent === false) erros.push(`Cliente: ${log.clientReason ?? log.clientPhone}`);
        if (erros.length > 0) {
          setSaveError(`⚠️ Evento salvo. Notificação falhou — ${erros.join(" | ")}`);
          setSaving(false);
          fetchEvents();
          return;
        }
      }

      setShowForm(false);
      fetchEvents();
    } catch {
      setSaveError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  async function markDone(id: string) {
    await fetch(`/api/agenda/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "done" }) });
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: "done" } : e));
  }

  async function deleteEvent(id: string) {
    await fetch(`/api/agenda/${id}`, { method: "DELETE" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  const filtered = events.filter((ev) => {
    if (filter === "pending") return ev.status === "pending" || ev.status === "notified";
    if (filter === "done") return ev.status === "done" || ev.status === "cancelled";
    return true;
  });

  const grouped: Record<string, AgendaEvent[]> = {};
  filtered.forEach((ev) => {
    const day = new Date(ev.starts_at).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" });
    grouped[day] = grouped[day] ?? [];
    grouped[day].push(ev);
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayCount = events.filter((e) => (e.starts_at ?? "").slice(0, 10) === today && (e.status === "pending" || e.status === "notified")).length;

  const inputStyle = {
    width: "100%", background: "#0d0d0d", border: `1px solid ${BORDER}`,
    borderRadius: "6px", padding: "10px 12px", fontSize: "13px", color: "#F0EDE8",
    outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <>
      <Header title="Agenda" />

      <style>{`
        .agenda-wrap { padding: 24px 32px 32px; flex: 1; }
        .ev-card { background: #0d0d0d; border: 1px solid ${BORDER}; border-radius: 8px; padding: 16px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; }
        .ev-card:hover { border-color: rgba(255,255,255,0.12); }
        .form-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .form-panel { background: #111; border: 1px solid ${BORDER}; border-radius: 12px; padding: 28px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
        .day-label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.12em; margin: 20px 0 8px; padding-bottom: 8px; border-bottom: 1px solid ${BORDER}; }
        input:focus, select:focus, textarea:focus { border-color: ${ACCENT} !important; }
        .filter-btn { background: transparent; border: 1px solid ${BORDER}; border-radius: 6px; padding: 6px 14px; font-size: 12px; cursor: pointer; color: #555; transition: all 0.15s; }
        .filter-btn.active { background: rgba(0,207,255,0.08); border-color: ${ACCENT}; color: ${ACCENT}; }
        @media (max-width: 768px) { .agenda-wrap { padding: 16px; } }
      `}</style>

      <div className="agenda-wrap">
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "11px", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 4px" }}>Interno</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#F0EDE8", margin: 0, letterSpacing: "-0.02em" }}>Agenda</h2>
            <p style={{ fontSize: "13px", color: "#555", margin: "6px 0 0" }}>
              {todayCount > 0 ? `${todayCount} compromisso${todayCount > 1 ? "s" : ""} hoje` : "Nenhum compromisso hoje"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={fetchEvents} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "8px 12px", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <RefreshCw size={13} /> Atualizar
            </button>
            <button onClick={openCreate} style={{ background: ACCENT, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", color: "#000", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
              <Plus size={14} /> Novo evento
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          {[
            { label: "Pendentes", value: events.filter((e) => e.status === "pending" || e.status === "notified").length, color: "#FF9500" },
            { label: "Concluídos", value: events.filter((e) => e.status === "done").length, color: "#22c55e" },
            { label: "Hoje", value: todayCount, color: ACCENT },
          ].map((s) => (
            <div key={s.label} style={{ background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "14px 20px", minWidth: "110px" }}>
              <div style={{ fontSize: "22px", fontWeight: "700", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
          {(["all", "pending", "done"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`filter-btn${filter === f ? " active" : ""}`}>
              {f === "all" ? "Todos" : f === "pending" ? "Ativos" : "Concluídos"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: "#555", fontSize: "13px", padding: "20px 0" }}>Carregando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "32px", textAlign: "center", color: "#444", fontSize: "13px" }}>
            Nenhum evento encontrado
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day}>
              <p className="day-label">{day}</p>
              {dayEvents.map((ev) => (
                <EventCard key={ev.id} ev={ev} onEdit={() => openEdit(ev)} onDone={() => markDone(ev.id)} onDelete={() => deleteEvent(ev.id)} />
              ))}
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="form-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="form-panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#F0EDE8", margin: 0 }}>
                {editingId ? "Editar evento" : "Novo evento"}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Título *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Reunião com cliente" required style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Detalhes do evento..." rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Cliente (opcional)</label>
                <select value={form.client_id} onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))} style={{ ...inputStyle }}>
                  <option value="">Sem cliente vinculado</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Início *</label>
                  <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} required style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Fim (opcional)</label>
                  <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              {/* Instância e telefone do admin */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Instância WhatsApp</label>
                  <select value={form.notify_instance} onChange={(e) => setForm((f) => ({ ...f, notify_instance: e.target.value }))} style={{ ...inputStyle }}>
                    <option value="">Padrão do sistema</option>
                    {instances.map((i) => <option key={i.name} value={i.name}>{i.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Seu número (notif.)</label>
                  <input
                    value={form.notify_admin_phone}
                    onChange={(e) => setForm((f) => ({ ...f, notify_admin_phone: e.target.value }))}
                    placeholder="5511999999999"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "10px" }}>Notificações</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {([
                    { key: "notify_admin_whatsapp" as const, label: "WhatsApp — você" },
                    { key: "notify_admin_email" as const, label: "Email — você" },
                    { key: "notify_client_whatsapp" as const, label: "WhatsApp — cliente" },
                    { key: "notify_client_email" as const, label: "Email — cliente" },
                  ]).map(({ key, label }) => (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", color: "#ccc" }}>{label}</span>
                      <Toggle on={form[key]} onChange={() => setForm((f) => ({ ...f, [key]: !f[key] }))} />
                    </div>
                  ))}
                </div>
              </div>

              {saveError && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", padding: "10px 12px", fontSize: "12px", color: "#ef4444" }}>
                  {saveError}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button type="submit" disabled={saving} style={{ flex: 1, background: ACCENT, border: "none", borderRadius: "6px", padding: "11px", fontSize: "13px", fontWeight: "600", color: "#000", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Salvando..." : editingId ? "Salvar" : "Criar evento"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "11px 16px", cursor: "pointer", color: "#555", fontSize: "13px" }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function EventCard({ ev, onEdit, onDone, onDelete }: { ev: AgendaEvent; onEdit: () => void; onDone: () => void; onDelete: () => void }) {
  const startTime = new Date(ev.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  const endTime = ev.ends_at ? new Date(ev.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }) : null;
  const isPast = new Date(ev.starts_at) < new Date();
  const isDone = ev.status === "done" || ev.status === "cancelled";
  const notifyIcons = [];
  if (ev.notify_admin_whatsapp) notifyIcons.push("WA");
  if (ev.notify_admin_email) notifyIcons.push("Email");
  if (ev.notify_client_whatsapp) notifyIcons.push("WA cliente");
  if (ev.notify_client_email) notifyIcons.push("Email cliente");

  return (
    <div className="ev-card" onClick={onEdit} style={{ opacity: isDone ? 0.5 : 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ minWidth: "48px", textAlign: "center", paddingTop: "2px" }}>
          <div style={{ fontSize: "14px", fontWeight: "700", color: isDone ? "#555" : isPast ? "#888" : ACCENT }}>{startTime}</div>
          {endTime && <div style={{ fontSize: "10px", color: "#444" }}>{endTime}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: isDone ? "#666" : "#F0EDE8", textDecoration: isDone ? "line-through" : "none" }}>{ev.title}</span>
            <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.06em", background: `${STATUS_COLOR[ev.status] ?? "#555"}18`, color: STATUS_COLOR[ev.status] ?? "#555" }}>
              {STATUS_LABEL[ev.status] ?? ev.status}
            </span>
          </div>
          {ev.description && <p style={{ fontSize: "12px", color: "#666", margin: "0 0 6px", lineHeight: 1.5 }}>{ev.description}</p>}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {ev.clients && <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#555" }}><User size={11} /> {ev.clients.name}</span>}
            {notifyIcons.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#555" }}><Bell size={11} /> {notifyIcons.join(", ")}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {!isDone && (
            <button onClick={onDone} title="Concluído" style={{ background: "transparent", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#22c55e" }}>
              <Check size={13} />
            </button>
          )}
          <button onClick={onDelete} title="Excluir" style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#ef4444" }}>
            <Trash2 size={13} />
          </button>
          <div style={{ display: "flex", alignItems: "center", paddingLeft: "2px" }}>
            <ChevronRight size={14} color="#333" />
          </div>
        </div>
      </div>
    </div>
  );
}
