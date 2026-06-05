"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import { Plus, Trash2, Send, RefreshCw, Users, Calendar, Clock, X } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

type GroupMsg = {
  id: string;
  instance: string;
  group_jid: string;
  group_name: string;
  message: string;
  type: string;
  scheduled_at: string;
  status: string;
  sent_at: string | null;
  error: string | null;
  created_at: string;
};

type Group = { id: string; subject: string; size?: number };
type Instance = { name: string; connectionStatus: string };

const STATUS_COLOR: Record<string, string> = {
  pending: "#FF9500",
  sent: "#22c55e",
  failed: "#ef4444",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Agendado",
  sent: "Enviado",
  failed: "Falhou",
};

export default function GruposPage() {
  const [messages, setMessages] = useState<GroupMsg[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    instance: "",
    group_jid: "",
    group_name: "",
    message: "",
    type: "marketing",
    scheduled_at: "",
  });

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/grupos");
    const data = await res.json();
    setMessages(data.messages ?? []);
    setLoading(false);
  }, []);

  const fetchInstances = useCallback(async () => {
    const res = await fetch("/api/grupos?action=list-instances");
    const data = await res.json();
    setInstances(data.instances ?? []);
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchInstances();
  }, [fetchMessages, fetchInstances]);

  async function loadGroups(instance: string) {
    if (!instance) { setGroups([]); return; }
    setLoadingGroups(true);
    const res = await fetch(`/api/grupos?action=list-groups&instance=${encodeURIComponent(instance)}`);
    const data = await res.json();
    setGroups(data.groups ?? []);
    setLoadingGroups(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.instance || !form.group_jid || !form.message || !form.scheduled_at) return;
    const res = await fetch("/api/grupos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ instance: "", group_jid: "", group_name: "", message: "", type: "marketing", scheduled_at: "" });
      fetchMessages();
    }
  }

  async function deleteMsg(id: string) {
    await fetch(`/api/grupos/${id}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  const pending = messages.filter((m) => m.status === "pending");
  const history = messages.filter((m) => m.status !== "pending");

  const inputStyle = {
    width: "100%", background: "#0d0d0d", border: `1px solid ${BORDER}`,
    borderRadius: "6px", padding: "10px 12px", fontSize: "13px", color: "#F0EDE8",
    outline: "none", boxSizing: "border-box" as const,
  };

  const selectStyle = { ...inputStyle };

  return (
    <>
      <Header title="Grupos" />

      <style>{`
        .grupos-wrap { padding: 24px 32px 32px; flex: 1; }
        .section-title { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 0.14em; margin: 0 0 12px; }
        .msg-card { background: #0d0d0d; border: 1px solid ${BORDER}; border-radius: 8px; padding: 16px; margin-bottom: 8px; }
        .msg-card:hover { border-color: rgba(255,255,255,0.12); }
        .form-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .form-panel { background: #111; border: 1px solid ${BORDER}; border-radius: 12px; padding: 28px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
        input:focus, select:focus, textarea:focus { border-color: ${ACCENT} !important; }
        @media (max-width: 768px) { .grupos-wrap { padding: 16px; } }
      `}</style>

      <div className="grupos-wrap">
        {/* Header row */}
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "11px", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 4px" }}>WhatsApp</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#F0EDE8", margin: 0, letterSpacing: "-0.02em" }}>Grupos</h2>
            <p style={{ fontSize: "13px", color: "#555", margin: "6px 0 0" }}>Agende mensagens para grupos do WhatsApp</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => { fetchMessages(); fetchInstances(); }}
              style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "8px 12px", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}
            >
              <RefreshCw size={13} /> Atualizar
            </button>
            <button
              onClick={() => setShowForm(true)}
              style={{ background: ACCENT, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", color: "#000", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}
            >
              <Plus size={14} /> Nova mensagem
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
          {[
            { label: "Agendadas", value: pending.length, color: "#FF9500" },
            { label: "Enviadas", value: messages.filter((m) => m.status === "sent").length, color: "#22c55e" },
            { label: "Falhas", value: messages.filter((m) => m.status === "failed").length, color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "14px 20px", minWidth: "120px" }}>
              <div style={{ fontSize: "22px", fontWeight: "700", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Pending */}
        <p className="section-title">Agendadas ({pending.length})</p>
        {loading ? (
          <div style={{ color: "#555", fontSize: "13px", padding: "20px 0" }}>Carregando...</div>
        ) : pending.length === 0 ? (
          <div style={{ background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "24px", textAlign: "center", color: "#444", fontSize: "13px", marginBottom: "28px" }}>
            Nenhuma mensagem agendada
          </div>
        ) : (
          <div style={{ marginBottom: "28px" }}>
            {pending.map((msg) => (
              <MsgCard key={msg.id} msg={msg} onDelete={deleteMsg} />
            ))}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <>
            <p className="section-title">Histórico ({history.length})</p>
            <div>
              {history.slice(0, 50).map((msg) => (
                <MsgCard key={msg.id} msg={msg} onDelete={deleteMsg} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="form-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="form-panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#F0EDE8", margin: 0 }}>Nova mensagem para grupo</h3>
              <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Instance */}
              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Instância</label>
                <select
                  value={form.instance}
                  onChange={(e) => {
                    const inst = e.target.value;
                    setForm((f) => ({ ...f, instance: inst, group_jid: "", group_name: "" }));
                    loadGroups(inst);
                  }}
                  style={selectStyle}
                  required
                >
                  <option value="">Selecionar instância...</option>
                  {instances.map((i) => (
                    <option key={i.name} value={i.name}>{i.name} ({i.connectionStatus})</option>
                  ))}
                </select>
              </div>

              {/* Group */}
              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>
                  Grupo {loadingGroups && <span style={{ color: "#555" }}>carregando...</span>}
                </label>
                <select
                  value={form.group_jid}
                  onChange={(e) => {
                    const jid = e.target.value;
                    const g = groups.find((g) => g.id === jid);
                    setForm((f) => ({ ...f, group_jid: jid, group_name: g?.subject ?? "" }));
                  }}
                  style={selectStyle}
                  required
                  disabled={!form.instance || loadingGroups}
                >
                  <option value="">Selecionar grupo...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.subject}{g.size ? ` (${g.size})` : ""}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  style={selectStyle}
                >
                  <option value="marketing">Marketing</option>
                  <option value="operational">Operacional</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Mensagem</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={5}
                  placeholder="Digite a mensagem..."
                  required
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                />
                <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>{form.message.length} caracteres</div>
              </div>

              {/* Date/time */}
              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>Data e hora</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="submit"
                  style={{ flex: 1, background: ACCENT, border: "none", borderRadius: "6px", padding: "11px", fontSize: "13px", fontWeight: "600", color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <Send size={14} /> Agendar
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "11px 16px", cursor: "pointer", color: "#555", fontSize: "13px" }}
                >
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

function MsgCard({ msg, onDelete }: { msg: GroupMsg; onDelete: (id: string) => void }) {
  const scheduledDate = new Date(msg.scheduled_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return (
    <div className="msg-card">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", fontWeight: "600", color: "#F0EDE8" }}>
              <Users size={13} color={ACCENT} /> {msg.group_name}
            </span>
            <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.06em", background: `${STATUS_COLOR[msg.status]}20`, color: STATUS_COLOR[msg.status] }}>
              {STATUS_LABEL[msg.status] ?? msg.status}
            </span>
            <span style={{ fontSize: "10px", color: "#444", background: "#1a1a1a", padding: "2px 7px", borderRadius: "4px", textTransform: "uppercase" }}>
              {msg.type}
            </span>
          </div>

          <p style={{ fontSize: "12px", color: "#888", margin: "0 0 8px", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {msg.message.length > 200 ? msg.message.slice(0, 200) + "..." : msg.message}
          </p>

          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#555" }}>
              <Calendar size={11} /> {scheduledDate}
            </span>
            <span style={{ fontSize: "11px", color: "#444" }}>{msg.instance}</span>
            {msg.sent_at && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#22c55e" }}>
                <Clock size={11} /> Enviado: {new Date(msg.sent_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
              </span>
            )}
            {msg.error && (
              <span style={{ fontSize: "11px", color: "#ef4444" }}>Erro: {msg.error}</span>
            )}
          </div>
        </div>

        {msg.status === "pending" && (
          <button
            onClick={() => onDelete(msg.id)}
            style={{ background: "transparent", border: `1px solid rgba(239,68,68,0.2)`, borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#ef4444", flexShrink: 0 }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
