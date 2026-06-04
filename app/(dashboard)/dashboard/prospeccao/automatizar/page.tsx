"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Plus, Trash2, Play, Pause, X,
  RefreshCw, Wifi, WifiOff, QrCode, LogOut,
  Send, Zap, Clock,
} from "lucide-react";
import Header from "@/components/header";

const ACCENT  = "#00CFFF";
const BORDER  = "rgba(255,255,255,0.07)";
const GREEN   = "#4ADE80";
const PINK    = "#E1306C";
const YELLOW  = "#F0B429";

const CNAE_LISTA = [
  { codigo: "8630504", label: "Odontologia" },
  { codigo: "9602502", label: "Estética e Beleza" },
  { codigo: "8650004", label: "Fisioterapia" },
  { codigo: "8690901", label: "Psicologia / Psicanálise" },
  { codigo: "8630503", label: "Clínica Médica" },
  { codigo: "9313100", label: "Academia / Fitness" },
  { codigo: "9602501", label: "Cabeleireiro / Barbearia" },
  { codigo: "6911701", label: "Advocacia" },
  { codigo: "6822600", label: "Imobiliária" },
  { codigo: "5611201", label: "Restaurante" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const FOLLOWUP_DEFAULT = `Oi! Passei aqui para ver se conseguiu ver a mensagem anterior sobre o crescimento digital da {nome}.\n\nSe tiver interesse em conversar, é só responder.\n\nUpflu | upflu.digital`;
const DIAS_SEMANA = [
  { value: 0, label: "Dom" }, { value: 1, label: "Seg" }, { value: 2, label: "Ter" },
  { value: 3, label: "Qua" }, { value: 4, label: "Qui" }, { value: 5, label: "Sex" }, { value: 6, label: "Sáb" },
];
const PRESETS_SEGURANCA = [
  { key: "conservador", label: "🛡️ Conservador", desc: "Número novo — máxima proteção", min: 90, max: 180, session: 10, break: 60, days: [2,3,4] },
  { key: "moderado",    label: "⚖️ Moderado",    desc: "1–2 semanas de uso — recomendado", min: 45, max: 120, session: 20, break: 30, days: [1,2,3,4,5] },
  { key: "agressivo",   label: "⚡ Agressivo",   desc: "Número aquecido — use com cautela", min: 25, max: 70,  session: 30, break: 20, days: [1,2,3,4,5,6] },
];

type EvolutionInst = { id?: string; name: string; connectionStatus: string; ownerJid?: string; profileName?: string; profilePicUrl?: string; };
type WaLog         = { id: string; nome: string; telefone: string; template: string; status: string; sent_at: string; };

type Config = {
  id: string; name: string; source: "cnae" | "google";
  cnae: string; cnae_label: string; search_term: string;
  municipio: string; uf: string; cities: string[];
  message_template: string; daily_limit: number;
  active: boolean; send_hour: number; end_hour: number;
  active_days: number[];
  min_delay_seconds: number; max_delay_seconds: number;
  session_max: number; session_break_minutes: number;
  followup_days: number; followup_template: string | null;
};

const EMPTY: Omit<Config, "id"> = {
  name: "", source: "google", cnae: "8630504", cnae_label: "Odontologia",
  search_term: "", municipio: "", uf: "ES", cities: [],
  message_template: "", daily_limit: 30, active: true,
  send_hour: 9, end_hour: 18, active_days: [1,2,3,4,5],
  min_delay_seconds: 45, max_delay_seconds: 120,
  session_max: 20, session_break_minutes: 30,
  followup_days: 3, followup_template: FOLLOWUP_DEFAULT,
};

const inp: React.CSSProperties = { background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#F0EDE8", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" };
const lbl: React.CSSProperties = { fontSize: "11px", fontWeight: "600" as const, color: "#777068", letterSpacing: "0.1em", textTransform: "uppercase" as const, display: "block", marginBottom: "6px" };
const sec: React.CSSProperties = { fontSize: "11px", fontWeight: "600" as const, color: "#555", letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: "16px" };

function latencyColor(ms: number) {
  if (ms < 0) return "#555";
  if (ms < 200) return GREEN;
  if (ms < 500) return YELLOW;
  return PINK;
}

function msgText(m: EvolutionMsg) {
  return m.message?.conversation ?? m.message?.extendedTextMessage?.text ?? "";
}

function formatTime(ts?: number) {
  if (!ts) return "";
  return new Date(ts * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function AutomatizarPage() {
  // ── prospecting configs ──
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [form, setForm]       = useState<Omit<Config, "id">>(EMPTY);
  const [editId, setEditId]   = useState<string | null>(null);
  const [msg, setMsg]         = useState("");
  const [newCity, setNewCity] = useState("");

  // ── instance panel ──
  const [instances, setInstances]         = useState<EvolutionInst[]>([]);
  const [instLoading, setInstLoading]     = useState(true);
  const [latency, setLatency]             = useState(-1);
  const [qrData, setQrData]               = useState<Record<string, string>>({});
  const [qrLoading, setQrLoading]         = useState<Record<string, boolean>>({});
  const [disconnecting, setDisconnecting] = useState<Record<string, boolean>>({});

  // ── test message ──
  const [showTest, setShowTest]   = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMsg, setTestMsg]     = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult]   = useState<string | null>(null);

  // ── quick history ──
  const [histLogs, setHistLogs]       = useState<WaLog[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  // ── instant dispatch ──
  const [dispNumbers, setDispNumbers] = useState("");
  const [dispMsg, setDispMsg]         = useState("");
  const [dispSending, setDispSending] = useState(false);
  const [dispResult, setDispResult]   = useState<string | null>(null);


  useEffect(() => {
    loadConfigs();
    loadInstances();
    loadHistory();
  }, []);

  // ── loaders ──
  async function loadInstances() {
    setInstLoading(true);
    try {
      const t0 = Date.now();
      const r  = await fetch("/api/evolution");
      setLatency(Date.now() - t0);
      const d  = await r.json();
      setInstances(d.instances ?? []);
    } catch { setInstances([]); }
    setInstLoading(false);
  }

  async function loadHistory() {
    setHistLoading(true);
    try {
      const r = await fetch("/api/disparos/whatsapp/historico");
      const d = await r.json();
      setHistLogs((d.logs ?? []).slice(0, 10));
    } catch { setHistLogs([]); }
    setHistLoading(false);
  }


  async function loadConfigs() {
    setLoading(true);
    const r = await fetch("/api/prospecting-configs");
    const d = await r.json();
    setConfigs(d.configs ?? []);
    setLoading(false);
  }

  // ── instance actions ──
  async function connectInstance(name: string) {
    setQrLoading((p) => ({ ...p, [name]: true }));
    try {
      const r = await fetch(`/api/evolution?action=connect&instance=${encodeURIComponent(name)}`);
      const d = await r.json();
      if (d.base64) setQrData((p) => ({ ...p, [name]: d.base64 }));
    } catch {}
    setQrLoading((p) => ({ ...p, [name]: false }));
  }

  async function disconnectInstance(name: string) {
    if (!confirm(`Desconectar "${name}"?`)) return;
    setDisconnecting((p) => ({ ...p, [name]: true }));
    await fetch("/api/evolution", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "disconnect", instance: name }) });
    setDisconnecting((p) => ({ ...p, [name]: false }));
    setQrData((p) => { const n = { ...p }; delete n[name]; return n; });
    await loadInstances();
  }

  // ── test message ──
  async function sendTest() {
    if (!testPhone.trim() || !testMsg.trim()) return;
    setTestSending(true); setTestResult(null);
    const r = await fetch("/api/evolution", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test", phone: testPhone, message: testMsg }) });
    const d = await r.json();
    setTestResult(d.ok ? "Mensagem enviada!" : "Falha no envio.");
    setTestSending(false);
  }

  // ── instant dispatch ──
  async function sendNow() {
    const numbers = dispNumbers.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!numbers.length || !dispMsg.trim()) return;
    setDispSending(true); setDispResult(null);
    const r = await fetch("/api/evolution", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "sendNow", numbers, message: dispMsg }) });
    const d = await r.json();
    setDispResult(`Enviado: ${d.sent} · Falhou: ${d.failed}`);
    setDispSending(false);
    loadHistory();
  }


  // ── prospecting config ──
  function addCity() {
    const c = newCity.trim();
    if (!c || form.cities.includes(c)) return;
    setForm({ ...form, cities: [...form.cities, c] });
    setNewCity("");
  }
  function removeCity(c: string) { setForm({ ...form, cities: form.cities.filter((x) => x !== c) }); }

  async function salvar() {
    if (!form.name.trim()) { setMsg("Nome é obrigatório."); return; }
    if (form.source === "google" && form.cities.length === 0) { setMsg("Adicione ao menos uma cidade."); return; }
    if (form.source === "google" && !form.search_term.trim()) { setMsg("Termo de busca é obrigatório."); return; }
    if (form.source === "cnae" && !form.municipio.trim()) { setMsg("Cidade é obrigatória."); return; }
    setSaving(true); setMsg("");
    const cnaeInfo = CNAE_LISTA.find((c) => c.codigo === form.cnae);
    const body = { ...form, cnae_label: cnaeInfo?.label ?? form.cnae_label, ...(editId ? { id: editId } : {}) };
    const r = await fetch("/api/prospecting-configs", { method: editId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error ?? "Erro ao salvar."); setSaving(false); return; }
    setMsg("Salvo!"); setForm(EMPTY); setEditId(null);
    await loadConfigs(); setSaving(false);
  }

  async function toggleActive(config: Config) {
    await fetch("/api/prospecting-configs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: config.id, active: !config.active }) });
    await loadConfigs();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta automação?")) return;
    await fetch("/api/prospecting-configs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await loadConfigs();
  }

  function editar(config: Config) {
    setEditId(config.id);
    setForm({ name: config.name, source: config.source ?? "cnae", cnae: config.cnae, cnae_label: config.cnae_label, search_term: config.search_term ?? "", municipio: config.municipio, uf: config.uf, cities: config.cities ?? [], message_template: config.message_template, daily_limit: config.daily_limit, active: config.active, send_hour: config.send_hour, end_hour: config.end_hour ?? 18, active_days: config.active_days ?? [1,2,3,4,5], min_delay_seconds: config.min_delay_seconds ?? 45, max_delay_seconds: config.max_delay_seconds ?? 120, session_max: config.session_max ?? 20, session_break_minutes: config.session_break_minutes ?? 30, followup_days: config.followup_days, followup_template: config.followup_template });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isGoogle = form.source === "google";

  return (
    <>
      <Header title="Prospecção Automática" />
      <div style={{ padding: "40px", maxWidth: "1100px" }}>

        {/* ── INSTANCE CARD ── */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <p style={sec}>WhatsApp — Evolution API</p>
            <button onClick={loadInstances} disabled={instLoading} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "5px 10px", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" }}>
              <RefreshCw size={11} style={{ animation: instLoading ? "spin 1s linear infinite" : "none" }} /> Atualizar
            </button>
          </div>

          {instLoading ? (
            <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "24px", textAlign: "center" }}>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#555" }} />
            </div>
          ) : instances.length === 0 ? (
            <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "24px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "#555", margin: 0 }}>Nenhuma instância encontrada.</p>
            </div>
          ) : instances.map((inst) => {
            const name      = inst.name;
            const state     = (inst.connectionStatus ?? "").toUpperCase();
            const connected = state === "OPEN" || state === "CONNECTED" || state === "AUTHENTICATED";
            const owner     = inst.ownerJid?.replace("@s.whatsapp.net", "") ?? "";
            const profile   = inst.profileName ?? "";
            const qr        = qrData[name];

            return (
              <div key={name} style={{ background: "#111", border: `1px solid ${connected ? "rgba(74,222,128,0.2)" : BORDER}`, borderRadius: "14px", padding: "20px 24px", marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {inst.profilePicUrl ? (
                      <img src={inst.profilePicUrl} alt="foto" style={{ width: "48px", height: "48px", borderRadius: "50%", border: `2px solid ${connected ? "rgba(74,222,128,0.4)" : BORDER}`, objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#1a1a1a", border: `2px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {connected ? <Wifi size={20} color={GREEN} /> : <WifiOff size={20} color="#555" />}
                      </div>
                    )}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "700", color: "#F0EDE8" }}>{name}</span>
                        <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", background: connected ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", color: connected ? GREEN : "#555", border: `1px solid ${connected ? "rgba(74,222,128,0.2)" : BORDER}` }}>
                          {connected ? "CONECTADO" : "DESCONECTADO"}
                        </span>
                        {latency > 0 && (
                          <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.03)", color: latencyColor(latency), border: `1px solid rgba(255,255,255,0.06)` }}>
                            {latency}ms
                          </span>
                        )}
                      </div>
                      {connected && (
                        <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                          {profile}{profile && owner ? " · " : ""}{owner}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    {connected && (
                      <button onClick={() => setShowTest((v) => !v)} style={{ display: "flex", alignItems: "center", gap: "6px", background: showTest ? "rgba(0,207,255,0.12)" : "rgba(0,207,255,0.06)", border: `1px solid ${showTest ? "rgba(0,207,255,0.4)" : "rgba(0,207,255,0.2)"}`, borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", color: ACCENT, cursor: "pointer" }}>
                        <Send size={12} /> Testar
                      </button>
                    )}
                    {!connected && (
                      <button onClick={() => connectInstance(name)} disabled={qrLoading[name]} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", color: ACCENT, cursor: "pointer" }}>
                        {qrLoading[name] ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <QrCode size={12} />} QR Code
                      </button>
                    )}
                    {connected && (
                      <button onClick={() => disconnectInstance(name)} disabled={disconnecting[name]} style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", color: "#FF6B6B", cursor: "pointer" }}>
                        {disconnecting[name] ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <LogOut size={12} />} Desconectar
                      </button>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                {qr && (
                  <div style={{ marginTop: "16px", padding: "16px", background: "#fff", borderRadius: "8px", display: "inline-block" }}>
                    <img src={qr} alt="QR Code" style={{ width: "200px", height: "200px", display: "block" }} />
                    <p style={{ fontSize: "11px", color: "#333", textAlign: "center", margin: "8px 0 0" }}>Escaneie com o WhatsApp</p>
                  </div>
                )}

                {/* Test message panel */}
                {showTest && connected && (
                  <div style={{ marginTop: "16px", padding: "16px", background: "rgba(0,207,255,0.04)", border: "1px solid rgba(0,207,255,0.12)", borderRadius: "10px" }}>
                    <p style={{ ...lbl, color: ACCENT, margin: "0 0 12px" }}>Mensagem de teste</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "10px", alignItems: "end" }}>
                      <div>
                        <label style={lbl}>Número</label>
                        <input style={inp} placeholder="55119..." value={testPhone} onChange={(e) => setTestPhone(e.target.value)} />
                      </div>
                      <div>
                        <label style={lbl}>Mensagem</label>
                        <input style={inp} placeholder="Teste da Evolution API..." value={testMsg} onChange={(e) => setTestMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendTest()} />
                      </div>
                      <button onClick={sendTest} disabled={testSending || !testPhone || !testMsg} style={{ display: "flex", alignItems: "center", gap: "6px", background: ACCENT, color: "#000", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "12px", fontWeight: "700", cursor: "pointer", opacity: testSending ? 0.7 : 1, whiteSpace: "nowrap" }}>
                        {testSending ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={12} />} Enviar
                      </button>
                    </div>
                    {testResult && <p style={{ fontSize: "12px", color: testResult.includes("!") ? GREEN : "#FF6B6B", margin: "10px 0 0" }}>{testResult}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── DISPARO IMEDIATO ── */}
        <div style={{ marginBottom: "32px" }}>

          {/* Disparo Imediato */}
          <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
              <Zap size={14} color={YELLOW} />
              <p style={{ ...sec, margin: 0, color: YELLOW }}>Disparo Imediato</p>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={lbl}>Números (um por linha)</label>
              <textarea
                style={{ ...inp, minHeight: "100px", resize: "vertical" }}
                placeholder={"11999999999\n21988888888\n31977777777"}
                value={dispNumbers}
                onChange={(e) => setDispNumbers(e.target.value)}
              />
              <p style={{ fontSize: "11px", color: "#555", margin: "4px 0 0" }}>
                {dispNumbers.split("\n").filter((s) => s.trim()).length} número(s)
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={lbl}>Mensagem</label>
              <textarea style={{ ...inp, minHeight: "80px", resize: "vertical" }} placeholder="Escreva a mensagem..." value={dispMsg} onChange={(e) => setDispMsg(e.target.value)} />
            </div>

            <button onClick={sendNow} disabled={dispSending || !dispNumbers.trim() || !dispMsg.trim()} style={{ display: "flex", alignItems: "center", gap: "8px", background: YELLOW, color: "#000", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: "700", cursor: "pointer", opacity: dispSending ? 0.7 : 1, width: "100%", justifyContent: "center" }}>
              {dispSending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={14} />}
              {dispSending ? "Enviando..." : "Disparar agora"}
            </button>
            {dispResult && <p style={{ fontSize: "12px", color: GREEN, margin: "10px 0 0", textAlign: "center" }}>{dispResult}</p>}
          </div>
        </div>

        {/* ── HISTÓRICO RÁPIDO ── */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={13} color="#555" />
              <p style={{ ...sec, margin: 0 }}>Últimas mensagens enviadas</p>
            </div>
            <button onClick={loadHistory} style={{ background: "none", border: "none", cursor: "pointer", color: "#555" }}>
              <RefreshCw size={12} style={{ animation: histLoading ? "spin 1s linear infinite" : "none" }} />
            </button>
          </div>

          <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden" }}>
            {histLoading ? (
              <div style={{ padding: "24px", textAlign: "center" }}><Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "#555" }} /></div>
            ) : histLogs.length === 0 ? (
              <p style={{ fontSize: "13px", color: "#555", padding: "24px", margin: 0, textAlign: "center" }}>Nenhum envio registrado ainda.</p>
            ) : histLogs.map((log, i) => (
              <div key={log.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < histLogs.length - 1 ? `1px solid ${BORDER}` : "none", gap: "12px" }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#F0EDE8" }}>{log.nome ?? "—"}</span>
                  <span style={{ fontSize: "12px", color: "#555", marginLeft: "10px" }}>{log.telefone}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "4px", background: log.status === "enviado" ? "rgba(74,222,128,0.1)" : "rgba(255,107,107,0.1)", color: log.status === "enviado" ? GREEN : "#FF6B6B", border: `1px solid ${log.status === "enviado" ? "rgba(74,222,128,0.2)" : "rgba(255,107,107,0.2)"}` }}>
                    {log.status?.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "11px", color: "#555" }}>
                    {log.sent_at ? new Date(log.sent_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AUTOMAÇÕES AGENDADAS ── */}
        <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "32px", marginBottom: "40px" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 24px" }}>
            {editId ? "Editando automação" : "Nova automação"}
          </p>

          <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
            {(["google", "cnae"] as const).map((s) => (
              <button key={s} onClick={() => setForm({ ...form, source: s })} style={{ flex: 1, padding: "14px", borderRadius: "10px", border: `1px solid ${form.source === s ? (s === "google" ? ACCENT : PINK) : BORDER}`, background: form.source === s ? (s === "google" ? "rgba(0,207,255,0.08)" : "rgba(225,48,108,0.08)") : "transparent", color: form.source === s ? (s === "google" ? ACCENT : PINK) : "#666", fontWeight: "600", fontSize: "13px", cursor: "pointer" }}>
                {s === "google" ? "🗺️ Google Maps (nacional)" : "🏢 CNAE · Receita Federal"}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={lbl}>Nome da automação</label>
              <input style={inp} placeholder="Ex: Advogados SP" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={lbl}>Horário do disparo</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.send_hour} onChange={(e) => setForm({ ...form, send_hour: Number(e.target.value) })}>
                {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00h (Brasília)</option>)}
              </select>
            </div>
          </div>

          {isGoogle && (
            <div style={{ background: "rgba(0,207,255,0.04)", border: "1px solid rgba(0,207,255,0.12)", borderRadius: "10px", padding: "20px", marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" }}>Configuração Google Maps</p>
              <div style={{ marginBottom: "16px" }}>
                <label style={lbl}>Termo de busca no Google</label>
                <input style={inp} placeholder='Ex: "advogado", "clínica estética", "academia"' value={form.search_term} onChange={(e) => setForm({ ...form, search_term: e.target.value })} />
                <p style={{ fontSize: "11px", color: "#555", margin: "5px 0 0" }}>Será buscado como &quot;{'"{termo} em {cidade}"'}&quot; para cada cidade</p>
              </div>
              <div>
                <label style={lbl}>Cidades (nível Brasil)</label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <input style={{ ...inp, flex: 1 }} placeholder='"São Paulo, SP"' value={newCity} onChange={(e) => setNewCity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())} />
                  <button onClick={addCity} style={{ padding: "10px 16px", background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.3)", borderRadius: "8px", color: ACCENT, fontSize: "12px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}>+ Adicionar</button>
                </div>
                {form.cities.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {form.cities.map((c) => (
                      <span key={c} style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: ACCENT }}>
                        {c} <button onClick={() => removeCity(c)} style={{ background: "none", border: "none", cursor: "pointer", color: ACCENT, padding: 0, display: "flex" }}><X size={11} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!isGoogle && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={lbl}>Segmento / CNAE</label>
                <select style={{ ...inp, cursor: "pointer" }} value={form.cnae} onChange={(e) => setForm({ ...form, cnae: e.target.value })}>
                  {CNAE_LISTA.map((c) => <option key={c.codigo} value={c.codigo}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Cidade</label>
                <input style={inp} placeholder="Ex: Vitória" value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
              </div>
              <div>
                <label style={lbl}>UF</label>
                <select style={{ ...inp, cursor: "pointer" }} value={form.uf} onChange={(e) => setForm({ ...form, uf: e.target.value })}>
                  {UF_LIST.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={lbl}>Limite diário de WhatsApps</label>
            <input style={{ ...inp, width: "120px" }} type="number" min="1" max="100" value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: Number(e.target.value) })} />
          </div>

          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
            <label style={{ ...lbl, marginBottom: "4px" }}>Mensagem personalizada (opcional)</label>
            <p style={{ fontSize: "11px", color: "#555", margin: "0 0 8px" }}>
              {isGoogle ? "Deixe vazio para usar avaliação automática do Google. Variáveis: {nome}, {cidade}, {rating}, {reviews}" : "Variáveis: {nome}, {cidade}"}
            </p>
            <textarea style={{ ...inp, minHeight: "100px", resize: "vertical" }} placeholder={isGoogle ? "Vazio = geração automática" : "Mensagem do 1º contato..."} value={form.message_template} onChange={(e) => setForm({ ...form, message_template: e.target.value })} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "16px", marginBottom: "24px" }}>
            <div>
              <label style={lbl}>Follow-up após</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input style={{ ...inp, width: "70px" }} type="number" min="1" max="30" value={form.followup_days} onChange={(e) => setForm({ ...form, followup_days: Number(e.target.value) })} />
                <span style={{ fontSize: "13px", color: "#777" }}>dias</span>
              </div>
            </div>
            <div>
              <label style={lbl}>Mensagem de follow-up</label>
              <textarea style={{ ...inp, minHeight: "70px", resize: "vertical" }} value={form.followup_template ?? ""} onChange={(e) => setForm({ ...form, followup_template: e.target.value || null })} />
            </div>
          </div>

          {/* Anti-ban */}
          <div style={{ background: "rgba(255,183,77,0.04)", border: "1px solid rgba(255,183,77,0.15)", borderRadius: "10px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <p style={{ fontSize: "11px", fontWeight: "600", color: YELLOW, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>🛡️ Proteção Anti-Ban</p>
              <div style={{ display: "flex", gap: "6px" }}>
                {PRESETS_SEGURANCA.map((p) => (
                  <button key={p.key} onClick={() => setForm((f) => ({ ...f, min_delay_seconds: p.min, max_delay_seconds: p.max, session_max: p.session, session_break_minutes: p.break, active_days: p.days }))} title={p.desc} style={{ fontSize: "11px", fontWeight: "600", padding: "5px 10px", borderRadius: "6px", border: "1px solid rgba(240,180,41,0.2)", background: "rgba(240,180,41,0.07)", color: YELLOW, cursor: "pointer" }}>{p.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              {[["Delay mín. (seg)", "min_delay_seconds", 10, 300], ["Delay máx. (seg)", "max_delay_seconds", 10, 600], ["Msgs por sessão", "session_max", 1, 100], ["Descanso (min)", "session_break_minutes", 5, 120]].map(([label, field, min, max]) => (
                <div key={field as string}>
                  <label style={{ ...lbl, color: YELLOW }}>{label as string}</label>
                  <input style={inp} type="number" min={min as number} max={max as number} value={(form as Record<string, unknown>)[field as string] as number} onChange={(e) => setForm({ ...form, [field as string]: Number(e.target.value) })} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto auto 1fr", gap: "16px", alignItems: "start" }}>
              <div>
                <label style={{ ...lbl, color: YELLOW }}>Início</label>
                <select style={{ ...inp, width: "110px", cursor: "pointer" }} value={form.send_hour} onChange={(e) => setForm({ ...form, send_hour: Number(e.target.value) })}>
                  {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2,"0")}:00h</option>)}
                </select>
              </div>
              <div>
                <label style={{ ...lbl, color: YELLOW }}>Encerramento</label>
                <select style={{ ...inp, width: "110px", cursor: "pointer" }} value={form.end_hour} onChange={(e) => setForm({ ...form, end_hour: Number(e.target.value) })}>
                  {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2,"0")}:00h</option>)}
                </select>
              </div>
              <div>
                <label style={{ ...lbl, color: YELLOW }}>Dias ativos</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {DIAS_SEMANA.map((d) => {
                    const ativo = form.active_days.includes(d.value);
                    return (
                      <button key={d.value} onClick={() => setForm((f) => ({ ...f, active_days: ativo ? f.active_days.filter((x) => x !== d.value) : [...f.active_days, d.value].sort() }))} style={{ padding: "6px 10px", borderRadius: "6px", border: `1px solid ${ativo ? "rgba(240,180,41,0.4)" : BORDER}`, background: ativo ? "rgba(240,180,41,0.12)" : "transparent", color: ativo ? YELLOW : "#555", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {msg && <p style={{ fontSize: "13px", color: msg === "Salvo!" ? GREEN : "#FF6B6B", marginBottom: "16px" }}>{msg}</p>}

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={salvar} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px", background: ACCENT, color: "#000", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "13px", fontWeight: "700", cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={14} />}
              {editId ? "Salvar alterações" : "Criar automação"}
            </button>
            {editId && (
              <button onClick={() => { setEditId(null); setForm(EMPTY); setMsg(""); }} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "10px 20px", fontSize: "13px", color: "#777", cursor: "pointer" }}>
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* ── AUTOMAÇÕES ATIVAS ── */}
        <p style={sec}>Automações ativas</p>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#555" }}><Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /></div>
        ) : configs.length === 0 ? (
          <div style={{ background: "#111", border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "40px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#555", margin: 0 }}>Nenhuma automação criada ainda.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {configs.map((c) => {
              const isG = c.source === "google";
              return (
                <div key={c.id} style={{ background: "#111", border: `1px solid ${c.active ? (isG ? "rgba(0,207,255,0.15)" : "rgba(74,222,128,0.15)") : BORDER}`, borderRadius: "12px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#F0EDE8" }}>{c.name}</span>
                      <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "4px", background: isG ? "rgba(0,207,255,0.1)" : "rgba(255,255,255,0.05)", color: isG ? ACCENT : "#777", border: `1px solid ${isG ? "rgba(0,207,255,0.2)" : BORDER}` }}>
                        {isG ? "Google Maps" : "CNAE"}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "4px", background: c.active ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", color: c.active ? GREEN : "#555", border: `1px solid ${c.active ? "rgba(74,222,128,0.2)" : BORDER}` }}>
                        {c.active ? "ATIVA" : "PAUSADA"}
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                      {isG
                        ? `"${c.search_term}" · ${(c.cities ?? []).length} cidades · ${String(c.send_hour).padStart(2,"0")}h–${String(c.end_hour ?? 18).padStart(2,"0")}h · ${c.daily_limit} msgs/dia`
                        : `${c.cnae_label} · ${c.municipio}, ${c.uf} · ${String(c.send_hour).padStart(2,"0")}h–${String(c.end_hour ?? 18).padStart(2,"0")}h · ${c.daily_limit} msgs/dia`}
                      {c.followup_days ? ` · follow-up ${c.followup_days}d` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button onClick={() => toggleActive(c)} title={c.active ? "Pausar" : "Ativar"} style={{ background: c.active ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${c.active ? "rgba(74,222,128,0.2)" : BORDER}`, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: c.active ? GREEN : "#555" }}>
                      {c.active ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => editar(c)} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: "#888", fontSize: "12px" }}>Editar</button>
                    <button onClick={() => excluir(c.id)} style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: "#FF6B6B" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
