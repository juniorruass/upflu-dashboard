"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2, Trash2, Play, Pause, X,
  RefreshCw, Wifi, WifiOff, QrCode, LogOut,
  Send, Zap, Clock, MapPin, MessageSquare, CheckCircle2,
  ChevronLeft, ChevronRight, Plus,
} from "lucide-react";
import Header from "@/components/header";
import StepsBar from "@/components/automatizar/steps-bar";
import Step1Alvo, { type Step1Data } from "@/components/automatizar/step1-alvo";
import Step2Message, { type Step2Data } from "@/components/automatizar/step2-message";
import ScheduleConfig, { type ScheduleData } from "@/components/automatizar/schedule-config";
import Step4Review from "@/components/automatizar/step4-review";
import MonitorTab from "@/components/automatizar/monitor-tab";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";
const GREEN  = "#4ADE80";
const PINK   = "#E1306C";
const YELLOW = "#F0B429";

const FOLLOWUP_DEFAULT = `Oi! Passei aqui para ver se conseguiu ver a mensagem anterior sobre o crescimento digital da {nome}.\n\nSe tiver interesse em conversar, é só responder.\n\nUpflu | upflu.digital`;

const STEPS = [
  { label: "Alvo",        icon: MapPin        },
  { label: "Mensagem",    icon: MessageSquare },
  { label: "Agendamento", icon: Clock         },
  { label: "Revisão",     icon: CheckCircle2  },
];

const STEP1_DEFAULT: Step1Data = {
  source: "google", searchTerm: "", cities: [],
  cnae: "8630504", cnaeLabel: "Odontologia",
  municipio: "", uf: "SP", dailyLimit: 30,
};

const SCHED_DEFAULT: ScheduleData = {
  minDelay: 120, maxDelay: 300, sessionMax: 20, sessionBreak: 30,
  startHour: 8, endHour: 17, activeDays: [1, 2, 3, 4, 5], dailyLimit: 30,
};

type EvolutionInst = {
  id?: string; name: string; connectionStatus: string;
  ownerJid?: string; profileName?: string; profilePicUrl?: string;
};
type WaLog = {
  id: string; nome: string; telefone: string;
  template: string; status: string; sent_at: string;
};
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

const inp: React.CSSProperties = {
  background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px",
  padding: "10px 12px", fontSize: "13px", color: "#F0EDE8", outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "inherit",
};
const lbl: React.CSSProperties = {
  fontSize: "11px", fontWeight: "600" as const, color: "#777068",
  letterSpacing: "0.1em", textTransform: "uppercase" as const,
  display: "block", marginBottom: "6px",
};
const sec: React.CSSProperties = {
  fontSize: "11px", fontWeight: "600" as const, color: "#555",
  letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: "16px",
};

function parseMessages(template: string): string[] {
  try {
    const parsed = JSON.parse(template);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}
  return template ? [template] : [""];
}

function latencyColor(ms: number) {
  if (ms < 0) return "#555";
  if (ms < 200) return GREEN;
  if (ms < 500) return YELLOW;
  return PINK;
}

export default function AutomatizarPage() {
  // ── instance panel ──
  const [instances, setInstances]         = useState<EvolutionInst[]>([]);
  const [instLoading, setInstLoading]     = useState(true);
  const [latency, setLatency]             = useState(-1);
  const [qrData, setQrData]               = useState<Record<string, string>>({});
  const [qrLoading, setQrLoading]         = useState<Record<string, boolean>>({});
  const [disconnecting, setDisconnecting] = useState<Record<string, boolean>>({});

  // ── test message ──
  const [showTest, setShowTest]     = useState(false);
  const [testPhone, setTestPhone]   = useState("");
  const [testMsg, setTestMsg]       = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // ── history ──
  const [histLogs, setHistLogs]       = useState<WaLog[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  // ── instant dispatch ──
  const [dispNumbers, setDispNumbers] = useState("");
  const [dispMsg, setDispMsg]         = useState("");
  const [dispSending, setDispSending] = useState(false);
  const [dispResult, setDispResult]   = useState<string | null>(null);

  // ── configs list ──
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);

  // ── tabs ──
  const [activeTab, setActiveTab] = useState<"automacoes" | "monitor">("automacoes");

  // ── stepper ──
  const [step, setStep]   = useState(1);
  const [done, setDone]   = useState<number[]>([]);
  const [step1, setStep1] = useState<Step1Data>(STEP1_DEFAULT);
  const [step2, setStep2] = useState<Step2Data>({ name: "", messages: [""] });
  const [sched, setSched] = useState<ScheduleData>(SCHED_DEFAULT);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stepErr, setStepErr] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadInstances(); loadHistory(); loadConfigs(); }, []);

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
    await fetch("/api/evolution", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect", instance: name }),
    });
    setDisconnecting((p) => ({ ...p, [name]: false }));
    setQrData((p) => { const n = { ...p }; delete n[name]; return n; });
    await loadInstances();
  }

  async function sendTest() {
    if (!testPhone.trim() || !testMsg.trim()) return;
    setTestSending(true); setTestResult(null);
    const r = await fetch("/api/evolution", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", phone: testPhone, message: testMsg }),
    });
    const d = await r.json();
    setTestResult(d.ok ? "Mensagem enviada!" : "Falha no envio.");
    setTestSending(false);
  }

  async function sendNow() {
    const numbers = dispNumbers.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!numbers.length || !dispMsg.trim()) return;
    setDispSending(true); setDispResult(null);
    const r = await fetch("/api/evolution", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sendNow", numbers, message: dispMsg }),
    });
    const d = await r.json();
    setDispResult(`Enviado: ${d.sent} · Falhou: ${d.failed}`);
    setDispSending(false);
    loadHistory();
  }

  // ── stepper ──
  function validateStep(): string {
    if (step === 1) {
      if (step1.source === "google") {
        if (!step1.searchTerm.trim()) return "Informe o segmento de busca.";
        if (step1.cities.length === 0) return "Adicione ao menos uma cidade.";
      } else {
        if (!step1.municipio.trim()) return "Informe a cidade para busca no CNAE.";
      }
    }
    if (step === 2) {
      if (!step2.name.trim()) return "Nome da automação é obrigatório.";
      if (!step2.messages.some((m) => m.trim())) return "Escreva ao menos uma mensagem.";
    }
    return "";
  }

  function nextStep() {
    const err = validateStep();
    if (err) { setStepErr(err); return; }
    setStepErr("");
    setDone((p) => Array.from(new Set([...p, step])));
    setStep((p) => p + 1);
  }

  function prevStep() {
    setStepErr("");
    setStep((p) => p - 1);
  }

  function resetForm() {
    setEditId(null); setStep(1); setDone([]);
    setStep1(STEP1_DEFAULT); setStep2({ name: "", messages: [""] });
    setSched(SCHED_DEFAULT); setStepErr(""); setSaving(false);
  }

  async function salvar(active: boolean) {
    setSaving(true); setStepErr("");
    const body = {
      name: step2.name, source: step1.source,
      search_term: step1.searchTerm, cities: step1.cities,
      cnae: step1.cnae, cnae_label: step1.cnaeLabel,
      municipio: step1.municipio, uf: step1.uf,
      message_template: JSON.stringify(step2.messages.filter((m) => m.trim())), daily_limit: step1.dailyLimit,
      active, send_hour: sched.startHour, end_hour: sched.endHour,
      active_days: sched.activeDays, min_delay_seconds: sched.minDelay,
      max_delay_seconds: sched.maxDelay, session_max: sched.sessionMax,
      session_break_minutes: sched.sessionBreak,
      followup_days: 3, followup_template: FOLLOWUP_DEFAULT,
      ...(editId ? { id: editId } : {}),
    };
    const r = await fetch("/api/prospecting-configs", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!r.ok) { setStepErr(d.error ?? "Erro ao salvar."); setSaving(false); return; }
    resetForm();
    await loadConfigs();
  }

  function editar(config: Config) {
    setEditId(config.id);
    setStep1({
      source: config.source ?? "google",
      searchTerm: config.search_term ?? "",
      cities: config.cities ?? [],
      cnae: config.cnae, cnaeLabel: config.cnae_label,
      municipio: config.municipio, uf: config.uf,
      dailyLimit: config.daily_limit,
    });
    setStep2({ name: config.name, messages: parseMessages(config.message_template) });
    setSched({
      minDelay: config.min_delay_seconds ?? 45,
      maxDelay: config.max_delay_seconds ?? 120,
      sessionMax: config.session_max ?? 20,
      sessionBreak: config.session_break_minutes ?? 30,
      startHour: config.send_hour, endHour: config.end_hour ?? 18,
      activeDays: config.active_days ?? [1, 2, 3, 4, 5],
      dailyLimit: config.daily_limit,
    });
    setStep(1); setDone([]); setStepErr("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function toggleActive(config: Config) {
    await fetch("/api/prospecting-configs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: config.id, active: !config.active }),
    });
    await loadConfigs();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta automação?")) return;
    await fetch("/api/prospecting-configs", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadConfigs();
  }

  return (
    <>
      <Header title="Prospecção Automática" />
      <div style={{ padding: "40px", maxWidth: "1100px" }}>

        {/* ── TABS ── */}
        <div className="flex gap-1 mb-8 p-1 bg-[#111] border border-white/[0.07] rounded-xl w-fit">
          {([
            { key: "automacoes", label: "Automações" },
            { key: "monitor",    label: "Monitor de envios" },
          ] as const).map((t) => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
              className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                activeTab === t.key
                  ? "bg-[#00CFFF]/10 text-[#00CFFF] border border-[#00CFFF]/25"
                  : "text-[#555] hover:text-[#888]"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "monitor" && <MonitorTab />}

        {activeTab === "automacoes" && <>

        {/* ── INSTANCE CARD ── */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <p style={sec}>WhatsApp — Evolution API</p>
            <button onClick={loadInstances} disabled={instLoading}
              style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "5px 10px", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" }}>
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
                          <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.03)", color: latencyColor(latency), border: "1px solid rgba(255,255,255,0.06)" }}>
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
                      <button onClick={() => setShowTest((v) => !v)}
                        style={{ display: "flex", alignItems: "center", gap: "6px", background: showTest ? "rgba(0,207,255,0.12)" : "rgba(0,207,255,0.06)", border: `1px solid ${showTest ? "rgba(0,207,255,0.4)" : "rgba(0,207,255,0.2)"}`, borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", color: ACCENT, cursor: "pointer" }}>
                        <Send size={12} /> Testar
                      </button>
                    )}
                    {!connected && (
                      <button onClick={() => connectInstance(name)} disabled={qrLoading[name]}
                        style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", color: ACCENT, cursor: "pointer" }}>
                        {qrLoading[name] ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <QrCode size={12} />} QR Code
                      </button>
                    )}
                    {connected && (
                      <button onClick={() => disconnectInstance(name)} disabled={disconnecting[name]}
                        style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", color: "#FF6B6B", cursor: "pointer" }}>
                        {disconnecting[name] ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <LogOut size={12} />} Desconectar
                      </button>
                    )}
                  </div>
                </div>

                {qr && (
                  <div style={{ marginTop: "16px", padding: "16px", background: "#fff", borderRadius: "8px", display: "inline-block" }}>
                    <img src={qr} alt="QR Code" style={{ width: "200px", height: "200px", display: "block" }} />
                    <p style={{ fontSize: "11px", color: "#333", textAlign: "center", margin: "8px 0 0" }}>Escaneie com o WhatsApp</p>
                  </div>
                )}

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
                      <button onClick={sendTest} disabled={testSending || !testPhone || !testMsg}
                        style={{ display: "flex", alignItems: "center", gap: "6px", background: ACCENT, color: "#000", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "12px", fontWeight: "700", cursor: "pointer", opacity: testSending ? 0.7 : 1, whiteSpace: "nowrap" }}>
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

        {/* ── STEPPER — NOVA AUTOMAÇÃO ── */}
        <div ref={formRef} className="bg-[#111] border border-white/[0.07] rounded-[14px] p-8 mb-10">

          {/* Header */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#00CFFF]/10 border border-[#00CFFF]/20 flex items-center justify-center">
                <Plus size={13} color={ACCENT} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#00CFFF] tracking-[0.18em] uppercase leading-none">
                  {editId ? "Editando automação" : "Nova automação"}
                </p>
                {editId && step2.name && (
                  <p className="text-[11px] text-[#555] mt-0.5">{step2.name}</p>
                )}
              </div>
            </div>
            {editId && (
              <button type="button" onClick={resetForm}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] text-[12px] text-[#555] hover:border-white/20 hover:text-[#888] transition-all">
                <X size={12} /> Cancelar
              </button>
            )}
          </div>

          {/* StepsBar */}
          <StepsBar steps={STEPS} current={step} done={done} />

          {/* Step content */}
          <div className="mt-6">
            {step === 1 && <Step1Alvo value={step1} onChange={setStep1} />}
            {step === 2 && <Step2Message value={step2} onChange={setStep2} />}
            {step === 3 && (
              <div className="flex flex-col gap-8">
                <ScheduleConfig onChange={setSched} initial={sched} />

                {/* Disparo Imediato */}
                <div className="rounded-xl border border-[#F0B429]/20 bg-[#F0B429]/03 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap size={13} color={YELLOW} />
                    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: YELLOW }}>
                      Disparo Imediato
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#777068] tracking-[0.1em] uppercase mb-2">
                        Números (um por linha)
                      </label>
                      <textarea
                        className="w-full bg-[#0d0d0d] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-[#F0EDE8] placeholder-[#444] resize-y outline-none focus:border-[#F0B429]/40 transition-colors"
                        rows={4}
                        placeholder={"11999999999\n21988888888\n31977777777"}
                        value={dispNumbers}
                        onChange={(e) => setDispNumbers(e.target.value)}
                      />
                      <p className="text-[11px] text-[#555] mt-1">
                        {dispNumbers.split("\n").filter((s) => s.trim()).length} número(s)
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#777068] tracking-[0.1em] uppercase mb-2">
                        Mensagem
                      </label>
                      <textarea
                        className="w-full bg-[#0d0d0d] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-[#F0EDE8] placeholder-[#444] resize-y outline-none focus:border-[#F0B429]/40 transition-colors"
                        rows={3}
                        placeholder="Escreva a mensagem..."
                        value={dispMsg}
                        onChange={(e) => setDispMsg(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={sendNow}
                      disabled={dispSending || !dispNumbers.trim() || !dispMsg.trim()}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-bold transition-all disabled:opacity-50"
                      style={{ background: YELLOW, color: "#000" }}
                    >
                      {dispSending
                        ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                        : <Zap size={14} />}
                      {dispSending ? "Enviando..." : "Disparar agora"}
                    </button>
                    {dispResult && (
                      <p className="text-[12px] text-center" style={{ color: GREEN }}>{dispResult}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {step === 4 && (
              <Step4Review
                step1={step1}
                automacaoName={step2.name}
                messages={step2.messages}
                schedule={sched}
                saving={saving}
                onSalvar={() => salvar(false)}
                onCriar={() => salvar(true)}
              />
            )}
          </div>

          {/* Error */}
          {stepErr && (
            <p className="mt-5 text-[12px] text-[#FF6B6B] bg-[#FF6B6B]/06 border border-[#FF6B6B]/20 rounded-xl px-4 py-3">
              {stepErr}
            </p>
          )}

          {/* Navigation — only for steps 1–3 */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/[0.06]">
              <button type="button" onClick={prevStep} disabled={step === 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.07] text-[#666] text-[13px] font-semibold hover:border-white/20 hover:text-[#F0EDE8] transition-all disabled:opacity-25 disabled:cursor-default">
                <ChevronLeft size={14} /> Voltar
              </button>
              <button type="button" onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00CFFF] text-black text-[13px] font-bold hover:bg-[#00CFFF]/90 transition-all">
                {step === 3 ? "Revisar" : "Próximo"} <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── AUTOMAÇÕES ATIVAS ── */}
        <p style={sec}>Automações ativas</p>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#555" }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          </div>
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
                        ? `"${c.search_term}" · ${(c.cities ?? []).length} cidades · ${String(c.send_hour).padStart(2, "0")}h–${String(c.end_hour ?? 18).padStart(2, "0")}h · ${c.daily_limit} msgs/dia`
                        : `${c.cnae_label} · ${c.municipio}, ${c.uf} · ${String(c.send_hour).padStart(2, "0")}h–${String(c.end_hour ?? 18).padStart(2, "0")}h · ${c.daily_limit} msgs/dia`}
                      {c.followup_days ? ` · follow-up ${c.followup_days}d` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <button onClick={() => toggleActive(c)} title={c.active ? "Pausar" : "Ativar"}
                      style={{ background: c.active ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${c.active ? "rgba(74,222,128,0.2)" : BORDER}`, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: c.active ? GREEN : "#555" }}>
                      {c.active ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => editar(c)}
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: "#888", fontSize: "12px" }}>
                      Editar
                    </button>
                    <button onClick={() => excluir(c.id)}
                      style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: "#FF6B6B" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── HISTÓRICO RÁPIDO ── */}
        <div style={{ marginTop: "40px" }}>
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
              <div style={{ padding: "24px", textAlign: "center" }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "#555" }} />
              </div>
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

        </> /* fim automacoes */}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
}
