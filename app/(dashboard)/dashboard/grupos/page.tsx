"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import { Plus, Trash2, Send, RefreshCw, Users, Calendar, Clock, X, ImageIcon, Video, FileX } from "lucide-react";

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
  media_type?: string | null;
  media_filename?: string | null;
  media_caption?: string | null;
};

type Group = { id: string; subject: string; size?: number };
type Instance = { name: string; connectionStatus: string; ownerJid?: string };

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
    message: "",
    type: "marketing",
    scheduled_at: "",
  });
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [mediaFile, setMediaFile] = useState<{ base64: string; type: "image" | "video"; name: string } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [adminOnly, setAdminOnly] = useState(false);
  const [sendNow, setSendNow] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string>("");

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

  async function loadGroups(instance: string, onlyAdmin = false) {
    if (!instance) { setGroups([]); setSelectedGroups([]); return; }
    setLoadingGroups(true);
    const ownerJid = instances.find((i) => i.name === instance)?.ownerJid ?? "";
    const params = new URLSearchParams({ action: "list-groups", instance });
    if (onlyAdmin && ownerJid) { params.set("adminOnly", "true"); params.set("ownerJid", ownerJid); }
    const res = await fetch(`/api/grupos?${params}`);
    const data = await res.json();
    setGroups(data.groups ?? []);
    setSelectedGroups([]);
    setLoadingGroups(false);
  }

  async function handleAdminToggle(value: boolean) {
    setAdminOnly(value);
    setSearchText("");
    if (form.instance) loadGroups(form.instance, value);
  }

  function toggleGroup(group: Group) {
    setSelectedGroups((prev) =>
      prev.find((g) => g.id === group.id)
        ? prev.filter((g) => g.id !== group.id)
        : [...prev, group]
    );
  }

  function toggleAllGroups() {
    setSelectedGroups((prev) => prev.length === groups.length ? [] : [...groups]);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setMediaFile(null); return; }
    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();
    reader.onload = () => {
      setMediaFile({ base64: reader.result as string, type: isVideo ? "video" : "image", name: file.name });
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.instance || selectedGroups.length === 0) return;
    if (!sendNow && !form.scheduled_at) return;
    if (!form.message && !mediaFile) return;

    setSending(true);
    setSendResult("");

    if (sendNow) {
      const res = await fetch("/api/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          send_now: true,
          instance: form.instance,
          group_jid: selectedGroups[0]?.id,
          group_name: selectedGroups[0]?.subject,
          groups: selectedGroups.map((g) => ({ group_jid: g.id, group_name: g.subject })),
          message: mediaFile ? "" : form.message,
          media_type: mediaFile?.type ?? null,
          media_data: mediaFile?.base64 ?? null,
          media_filename: mediaFile?.name ?? null,
          media_caption: mediaFile ? form.message : null,
        }),
      });
      const data = await res.json();
      setSending(false);
      setSendResult(`Enviado: ${data.sent ?? 0} ✓  Falhou: ${data.failed ?? 0}`);
      fetchMessages();
      return;
    }

    await Promise.all(selectedGroups.map((group) =>
      fetch("/api/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instance: form.instance,
          group_jid: group.id,
          group_name: group.subject,
          message: mediaFile ? "" : form.message,
          type: form.type,
          scheduled_at: form.scheduled_at,
          media_type: mediaFile?.type ?? null,
          media_data: mediaFile?.base64 ?? null,
          media_filename: mediaFile?.name ?? null,
          media_caption: mediaFile ? form.message : null,
        }),
      })
    ));

    setSending(false);
    setShowForm(false);
    setForm({ instance: "", message: "", type: "marketing", scheduled_at: "" });
    setSelectedGroups([]);
    setMediaFile(null);
    setSendNow(false);
    fetchMessages();
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
              onClick={() => { setShowForm(true); setMediaFile(null); setSelectedGroups([]); }}
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
                    setForm((f) => ({ ...f, instance: inst }));
                    setSearchText("");
                    loadGroups(inst, adminOnly);
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

              {/* Groups multi-select */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Grupos {loadingGroups && <span style={{ color: "#555" }}>carregando...</span>}
                    {selectedGroups.length > 0 && <span style={{ color: ACCENT, marginLeft: "6px" }}>{selectedGroups.length} selecionado{selectedGroups.length > 1 ? "s" : ""}</span>}
                  </label>
                  {groups.length > 0 && (
                    <button type="button" onClick={toggleAllGroups} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "11px", color: "#555" }}>
                      {selectedGroups.length === groups.length ? "Desmarcar todos" : "Selecionar todos"}
                    </button>
                  )}
                </div>

                {/* Busca + filtro admin */}
                {form.instance && groups.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <input
                      type="text"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Buscar grupo..."
                      style={{ ...inputStyle, flex: 1, padding: "8px 10px", fontSize: "12px" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAdminToggle(!adminOnly)}
                      title="Somente grupos onde sou admin"
                      style={{
                        background: adminOnly ? "rgba(0,207,255,0.12)" : "transparent",
                        border: `1px solid ${adminOnly ? ACCENT : BORDER}`,
                        borderRadius: "6px", padding: "8px 12px", cursor: "pointer",
                        fontSize: "11px", fontWeight: adminOnly ? "600" : "400",
                        color: adminOnly ? ACCENT : "#555",
                        whiteSpace: "nowrap",
                      }}
                    >
                      👑 Só admin
                    </button>
                  </div>
                )}

                <GroupList
                  groups={groups}
                  selected={selectedGroups}
                  loading={loadingGroups}
                  hasInstance={!!form.instance}
                  adminOnly={adminOnly}
                  search={searchText}
                  onToggle={toggleGroup}
                />
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

              {/* Media upload */}
              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>
                  Imagem / Vídeo (opcional)
                </label>
                {mediaFile ? (
                  <div style={{ background: "#0d0d0d", border: `1px solid ${ACCENT}`, borderRadius: "6px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    {mediaFile.type === "image" ? <ImageIcon size={16} color={ACCENT} /> : <Video size={16} color={ACCENT} />}
                    <span style={{ fontSize: "12px", color: "#ccc", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mediaFile.name}</span>
                    <button type="button" onClick={() => setMediaFile(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555" }}>
                      <FileX size={15} />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: "block", cursor: "pointer" }}>
                    <div style={{ ...inputStyle, display: "flex", alignItems: "center", gap: "8px", color: "#555", cursor: "pointer" }}>
                      <ImageIcon size={14} /> Clique para selecionar arquivo
                    </div>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>

              {/* Message */}
              <div>
                <label style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "6px" }}>
                  {mediaFile ? "Legenda (opcional)" : "Mensagem *"}
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  rows={5}
                  placeholder={mediaFile ? "Legenda da mídia..." : "Digite a mensagem..."}
                  required={!mediaFile}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
                />
                <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>{form.message.length} caracteres</div>
              </div>

              {/* Enviar agora ou agendar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "12px 14px" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#F0EDE8", fontWeight: "600" }}>Enviar agora</div>
                  <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>Dispara imediatamente sem agendar</div>
                </div>
                <div
                  onClick={() => { setSendNow((v) => !v); setSendResult(""); }}
                  style={{ width: "40px", height: "22px", borderRadius: "11px", cursor: "pointer", background: sendNow ? ACCENT : "#2a2a2a", position: "relative", flexShrink: 0, transition: "background 0.2s", border: `1px solid ${sendNow ? ACCENT : "#3a3a3a"}` }}
                >
                  <div style={{ position: "absolute", top: "3px", left: sendNow ? "19px" : "3px", width: "14px", height: "14px", borderRadius: "50%", background: sendNow ? "#000" : "#666", transition: "left 0.2s" }} />
                </div>
              </div>

              {/* Date/time — só mostra se não for envio imediato */}
              {!sendNow && (
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
              )}

              {sendResult && (
                <div style={{ background: "rgba(0,207,255,0.08)", border: `1px solid rgba(0,207,255,0.2)`, borderRadius: "6px", padding: "10px 14px", fontSize: "13px", color: ACCENT }}>
                  {sendResult}
                  <button type="button" onClick={() => { setShowForm(false); setSendResult(""); setSelectedGroups([]); setMediaFile(null); setSendNow(false); setForm({ instance: "", message: "", type: "marketing", scheduled_at: "" }); }} style={{ marginLeft: "12px", background: "transparent", border: "none", cursor: "pointer", color: "#555", fontSize: "12px" }}>Fechar</button>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="submit"
                  disabled={sending}
                  style={{ flex: 1, background: sendNow ? "#22c55e" : ACCENT, border: "none", borderRadius: "6px", padding: "11px", fontSize: "13px", fontWeight: "600", color: "#000", cursor: sending ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", opacity: sending ? 0.7 : 1 }}
                >
                  <Send size={14} />
                  {sending ? "Enviando..." : sendNow
                    ? `Enviar agora${selectedGroups.length > 1 ? ` (${selectedGroups.length} grupos)` : ""}`
                    : selectedGroups.length > 1 ? `Agendar para ${selectedGroups.length} grupos` : "Agendar"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setSendResult(""); setSendNow(false); }} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "11px 16px", cursor: "pointer", color: "#555", fontSize: "13px" }}>
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

function GroupList({ groups, selected, loading, hasInstance, adminOnly, search, onToggle }: {
  groups: Group[];
  selected: Group[];
  loading: boolean;
  hasInstance: boolean;
  adminOnly: boolean;
  search: string;
  onToggle: (g: Group) => void;
}) {
  const ACCENT = "#00CFFF";
  const BORDER = "rgba(255,255,255,0.07)";

  const borderColor = selected.length > 0 ? ACCENT : BORDER;
  const opacity = !hasInstance || loading ? 0.5 : 1;

  let content: React.ReactNode;

  if (!hasInstance) {
    content = <div style={{ padding: "12px", fontSize: "12px", color: "#444" }}>Selecione uma instância primeiro</div>;
  } else if (loading) {
    content = <div style={{ padding: "12px", fontSize: "12px", color: "#444" }}>Carregando grupos{adminOnly ? " (filtrando admins...)" : ""}...</div>;
  } else if (groups.length === 0) {
    content = <div style={{ padding: "12px", fontSize: "12px", color: "#444" }}>{adminOnly ? "Nenhum grupo onde você é admin" : "Nenhum grupo encontrado"}</div>;
  } else {
    const filtered = search ? groups.filter((g) => g.subject.toLowerCase().includes(search.toLowerCase())) : groups;
    if (filtered.length === 0) {
      content = <div style={{ padding: "12px", fontSize: "12px", color: "#444" }}>Nenhum grupo com &ldquo;{search}&rdquo;</div>;
    } else {
      content = filtered.map((g) => {
        const checked = !!selected.find((s) => s.id === g.id);
        return (
          <label key={g.id} style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "9px 12px", cursor: "pointer",
            borderBottom: `1px solid ${BORDER}`,
            background: checked ? "rgba(0,207,255,0.05)" : "transparent",
          }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(g)}
              style={{ accentColor: ACCENT, width: "14px", height: "14px", flexShrink: 0 }}
            />
            <span style={{ fontSize: "13px", color: checked ? "#F0EDE8" : "#888", flex: 1 }}>{g.subject}</span>
            {g.size && <span style={{ fontSize: "11px", color: "#444" }}>{g.size}</span>}
          </label>
        );
      });
    }
  }

  return (
    <div style={{ maxHeight: "200px", overflowY: "auto", background: "#0d0d0d", border: `1px solid ${borderColor}`, borderRadius: "6px", opacity }}>
      {content}
    </div>
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

          {msg.media_type && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              {msg.media_type === "image" ? <ImageIcon size={13} color="#555" /> : <Video size={13} color="#555" />}
              <span style={{ fontSize: "11px", color: "#555" }}>{msg.media_filename ?? msg.media_type}</span>
            </div>
          )}
          <p style={{ fontSize: "12px", color: "#888", margin: "0 0 8px", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {(msg.media_caption ?? msg.message ?? "").slice(0, 200)}{(msg.media_caption ?? msg.message ?? "").length > 200 ? "..." : ""}
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
