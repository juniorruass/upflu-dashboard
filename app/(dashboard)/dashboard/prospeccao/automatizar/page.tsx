"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2, Trash2, Play, Pause, X,
  RefreshCw, Wifi, WifiOff, QrCode, LogOut,
  Send, Zap, Clock, MapPin, MessageSquare, CheckCircle2,
  ChevronLeft, ChevronRight, Plus, Copy, BarChart2,
  Layers, Smartphone, Upload,
} from "lucide-react";
import Header from "@/components/header";
import StepsBar from "@/components/automatizar/steps-bar";
import Step1Alvo, { type Step1Data, QUAL_FILTERS_DEFAULT } from "@/components/automatizar/step1-alvo";
import Step2Message, { type Step2Data } from "@/components/automatizar/step2-message";
import ScheduleConfig, { type ScheduleData } from "@/components/automatizar/schedule-config";
import Step4Review from "@/components/automatizar/step4-review";
import MonitorTab from "@/components/automatizar/monitor-tab";

const ACCENT = "#00CFFF";
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
  filters: { ...QUAL_FILTERS_DEFAULT },
};

const SCHED_DEFAULT: ScheduleData = {
  minDelay: 120, maxDelay: 300, sessionMax: 20, sessionBreak: 30,
  startHour: 8, endHour: 17, activeDays: [1, 2, 3, 4, 5], dailyLimit: 30,
};

const DAYS_LABEL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

type TabKey = "campanhas" | "disparos" | "monitor" | "instancias";

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
  background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "8px",
  padding: "10px 12px", fontSize: "13px", color: "var(--up-text)", outline: "none",
  width: "100%", boxSizing: "border-box", fontFamily: "inherit",
};
const lbl: React.CSSProperties = {
  fontSize: "11px", fontWeight: "600" as const, color: "var(--up-text-label)",
  letterSpacing: "0.1em", textTransform: "uppercase" as const,
  display: "block", marginBottom: "6px",
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
  // ── instances ──
  const [instances, setInstances]         = useState<EvolutionInst[]>([]);
  const [instLoading, setInstLoading]     = useState(true);
  const [latency, setLatency]             = useState(-1);
  const [qrData, setQrData]               = useState<Record<string, string>>({});
  const [qrLoading, setQrLoading]         = useState<Record<string, boolean>>({});
  const [disconnecting, setDisconnecting] = useState<Record<string, boolean>>({});

  // ── test message ──
  const [showTest, setShowTest]       = useState(false);
  const [testPhone, setTestPhone]     = useState("");
  const [testMsg, setTestMsg]         = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult]   = useState<string | null>(null);

  // ── history ──
  const [histLogs, setHistLogs]       = useState<WaLog[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  // ── disparos ──
  const [dispNumbers, setDispNumbers]   = useState("");
  const [dispMsg, setDispMsg]           = useState("");
  const [dispSending, setDispSending]   = useState(false);
  const [dispResult, setDispResult]     = useState<string | null>(null);
  const [dispMinDelay, setDispMinDelay] = useState(30);
  const [dispMaxDelay, setDispMaxDelay] = useState(90);

  // ── campaigns ──
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);

  // ── tabs / wizard ──
  const [activeTab, setActiveTab]   = useState<TabKey>("campanhas");
  const [showWizard, setShowWizard] = useState(false);

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
  const fileRef = useRef<HTMLInputElement>(null);

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
      setHistLogs((d.logs ?? []).slice(0, 50));
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

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const nums = text.split(/[\n,;]/)
        .map((s) => s.replace(/\D/g, "").trim())
        .filter((s) => s.length >= 8);
      setDispNumbers((prev) => {
        const combined = [...prev.split("\n").filter(Boolean), ...nums];
        const unique = combined.filter((v, i, a) => a.indexOf(v) === i);
        return unique.join("\n");
      });
    };
    reader.readAsText(file);
    e.target.value = "";
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
      if (!step2.name.trim()) return "Nome da campanha é obrigatório.";
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

  function prevStep() { setStepErr(""); setStep((p) => p - 1); }

  function resetForm() {
    setEditId(null); setStep(1); setDone([]);
    setStep1(STEP1_DEFAULT); setStep2({ name: "", messages: [""] });
    setSched(SCHED_DEFAULT); setStepErr(""); setSaving(false);
    setShowWizard(false);
  }

  async function salvar(active: boolean) {
    setSaving(true); setStepErr("");
    const body = {
      name: step2.name, source: step1.source,
      search_term: step1.searchTerm, cities: step1.cities,
      cnae: step1.cnae, cnae_label: step1.cnaeLabel,
      municipio: step1.municipio, uf: step1.uf,
      message_template: JSON.stringify(step2.messages.filter((m) => m.trim())),
      daily_limit: step1.dailyLimit,
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
      filters: { ...QUAL_FILTERS_DEFAULT },
    });
    setStep2({ name: config.name, messages: parseMessages(config.message_template) });
    setSched({
      minDelay: config.min_delay_seconds ?? 120,
      maxDelay: config.max_delay_seconds ?? 300,
      sessionMax: config.session_max ?? 20,
      sessionBreak: config.session_break_minutes ?? 30,
      startHour: config.send_hour, endHour: config.end_hour ?? 17,
      activeDays: config.active_days ?? [1, 2, 3, 4, 5],
      dailyLimit: config.daily_limit,
    });
    setStep(1); setDone([]); setStepErr("");
    setShowWizard(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function duplicar(config: Config) {
    await fetch("/api/prospecting-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: config.name + " (cópia)",
        source: config.source, search_term: config.search_term,
        cities: config.cities ?? [], cnae: config.cnae, cnae_label: config.cnae_label,
        municipio: config.municipio, uf: config.uf,
        message_template: config.message_template,
        daily_limit: config.daily_limit, active: false,
        send_hour: config.send_hour, end_hour: config.end_hour ?? 17,
        active_days: config.active_days ?? [1,2,3,4,5],
        min_delay_seconds: config.min_delay_seconds ?? 120,
        max_delay_seconds: config.max_delay_seconds ?? 300,
        session_max: config.session_max ?? 20,
        session_break_minutes: config.session_break_minutes ?? 30,
        followup_days: config.followup_days ?? 3,
        followup_template: config.followup_template ?? FOLLOWUP_DEFAULT,
      }),
    });
    await loadConfigs();
  }

  async function toggleActive(config: Config) {
    await fetch("/api/prospecting-configs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: config.id, active: !config.active }),
    });
    await loadConfigs();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir esta campanha?")) return;
    await fetch("/api/prospecting-configs", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadConfigs();
  }

  const dispCount = dispNumbers.split("\n").filter((s) => s.trim()).length;
  const dispEst   = dispCount > 0 ? Math.ceil((dispCount * dispMaxDelay) / 60) : 0;
  const connectedInstances = instances.filter((i) => {
    const s = (i.connectionStatus ?? "").toUpperCase();
    return s === "OPEN" || s === "CONNECTED" || s === "AUTHENTICATED";
  });

  return (
    <>
      <Header title="Automatizar" />
      <div style={{ padding: "32px 40px 60px", maxWidth: "1200px" }}>

        {/* ── TAB BAR ── */}
        <div style={{ display: "flex", gap: "2px", marginBottom: "32px", background: "var(--up-card)", border: "1px solid var(--up-border)", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
          {([
            { key: "campanhas",  label: "Campanhas",  Icon: Layers      },
            { key: "disparos",   label: "Disparos",   Icon: Zap         },
            { key: "monitor",    label: "Monitor",    Icon: BarChart2   },
            { key: "instancias", label: "Instâncias", Icon: Smartphone  },
          ] as const).map(({ key, label, Icon }) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "8px 18px", borderRadius: "8px", cursor: "pointer",
                background: activeTab === key ? "rgba(0,207,255,0.1)" : "transparent",
                border: activeTab === key ? "1px solid rgba(0,207,255,0.25)" : "1px solid transparent",
                color: activeTab === key ? ACCENT : "var(--up-text-dim)",
                fontSize: "13px", fontWeight: activeTab === key ? "600" : "400",
                transition: "all 0.15s",
              }}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════
            TAB: CAMPANHAS
        ════════════════════════════════ */}
        {activeTab === "campanhas" && (
          <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--up-text)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Campanhas</h2>
                <p style={{ fontSize: "12px", color: "var(--up-text-dim)", margin: 0 }}>
                  {loading ? "Carregando…" : configs.length === 0 ? "Nenhuma campanha criada" : `${configs.filter((c) => c.active).length} ativas · ${configs.length} total`}
                </p>
              </div>
              {!showWizard && !editId && (
                <button type="button" onClick={() => { resetForm(); setShowWizard(true); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", background: ACCENT, color: "#000", border: "none", borderRadius: "9px", padding: "10px 20px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                  <Plus size={14} /> Nova campanha
                </button>
              )}
            </div>

            {/* ── WIZARD ── */}
            {(showWizard || !!editId) && (
              <div ref={formRef} style={{ background: "var(--up-card)", border: "1px solid rgba(0,207,255,0.18)", borderRadius: "16px", overflow: "hidden", marginBottom: "32px" }}>
                {/* Accent bar */}
                <div style={{ height: "2px", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
                <div style={{ padding: "28px 32px" }}>

                  {/* Wizard header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(0,207,255,0.1)", border: "1px solid rgba(0,207,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Plus size={15} color={ACCENT} />
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: "700", color: "var(--up-text)", margin: 0 }}>
                          {editId ? "Editar campanha" : "Nova campanha"}
                        </p>
                        {editId && step2.name && (
                          <p style={{ fontSize: "11px", color: "var(--up-text-dim)", margin: "3px 0 0" }}>{step2.name}</p>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={resetForm}
                      style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "1px solid var(--up-border)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", color: "var(--up-text-dim)", cursor: "pointer" }}>
                      <X size={12} /> Cancelar
                    </button>
                  </div>

                  <StepsBar steps={STEPS} current={step} done={done} />

                  <div style={{ marginTop: "28px" }}>
                    {step === 1 && <Step1Alvo value={step1} onChange={setStep1} />}
                    {step === 2 && <Step2Message value={step2} onChange={setStep2} />}
                    {step === 3 && <ScheduleConfig onChange={setSched} initial={sched} />}
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

                  {stepErr && (
                    <p style={{ marginTop: "20px", fontSize: "12px", color: "#FF6B6B", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "10px", padding: "12px 16px" }}>
                      {stepErr}
                    </p>
                  )}

                  {step < 4 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "28px", paddingTop: "22px", borderTop: "1px solid var(--up-border)" }}>
                      <button type="button" onClick={prevStep} disabled={step === 1}
                        style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", background: "transparent", border: "1px solid var(--up-border)", borderRadius: "9px", fontSize: "13px", color: "var(--up-text-dim)", cursor: step === 1 ? "default" : "pointer", opacity: step === 1 ? 0.3 : 1 }}>
                        <ChevronLeft size={14} /> Voltar
                      </button>
                      <button type="button" onClick={nextStep}
                        style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 22px", background: ACCENT, border: "none", borderRadius: "9px", fontSize: "13px", fontWeight: "700", color: "#000", cursor: "pointer" }}>
                        {step === 3 ? "Revisar" : "Próximo"} <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── CAMPAIGN CARDS ── */}
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "var(--up-text-dim)" }}>
                <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : configs.length === 0 && !showWizard ? (
              <div style={{ background: "var(--up-card)", border: "1px solid var(--up-border)", borderRadius: "16px", padding: "64px 40px", textAlign: "center" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "16px", background: "rgba(0,207,255,0.07)", border: "1px solid rgba(0,207,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  <Layers size={26} color={ACCENT} strokeWidth={1.5} />
                </div>
                <p style={{ fontSize: "16px", fontWeight: "700", color: "var(--up-text)", margin: "0 0 8px" }}>Nenhuma campanha ainda</p>
                <p style={{ fontSize: "13px", color: "var(--up-text-dim)", margin: "0 0 28px" }}>Configure sua primeira campanha de prospecção automática</p>
                <button onClick={() => setShowWizard(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: ACCENT, color: "#000", border: "none", borderRadius: "9px", padding: "10px 22px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>
                  <Plus size={14} /> Nova campanha
                </button>
              </div>
            ) : (
              <div className="camp-grid">
                {configs.map((c) => {
                  const isG  = c.source === "google";
                  const msgs = parseMessages(c.message_template);
                  const days = (c.active_days ?? [1,2,3,4,5]).map((d) => DAYS_LABEL[d]).join(", ");
                  const target = isG
                    ? `"${c.search_term}" · ${(c.cities ?? []).slice(0, 3).join(", ")}${(c.cities ?? []).length > 3 ? ` +${(c.cities ?? []).length - 3}` : ""}`
                    : `${c.cnae_label} · ${c.municipio}, ${c.uf}`;

                  return (
                    <div key={c.id} style={{ background: "var(--up-card)", border: `1px solid ${c.active ? "rgba(0,207,255,0.18)" : "var(--up-border)"}`, borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column", transition: "border-color 0.2s" }}>
                      {c.active && <div style={{ height: "2px", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, flexShrink: 0 }} />}

                      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
                        {/* Name + badges */}
                        <div>
                          <p style={{ fontSize: "15px", fontWeight: "700", color: "var(--up-text)", margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {c.name}
                          </p>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 9px", borderRadius: "5px", background: c.active ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", color: c.active ? GREEN : "#555", border: `1px solid ${c.active ? "rgba(74,222,128,0.25)" : "var(--up-border)"}`, letterSpacing: "0.05em" }}>
                              {c.active ? "● ATIVA" : "◐ PAUSADA"}
                            </span>
                            <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 9px", borderRadius: "5px", background: isG ? "rgba(0,207,255,0.08)" : "rgba(74,222,128,0.08)", color: isG ? ACCENT : GREEN, border: `1px solid ${isG ? "rgba(0,207,255,0.2)" : "rgba(74,222,128,0.2)"}` }}>
                              {isG ? "Google Maps" : "CNAE"}
                            </span>
                          </div>
                        </div>

                        {/* Target */}
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "7px" }}>
                          <MapPin size={11} color="var(--up-text-dim)" style={{ marginTop: "2px", flexShrink: 0 }} />
                          <span style={{ fontSize: "12px", color: "var(--up-text-label)", lineHeight: "1.5", wordBreak: "break-word" }}>{target}</span>
                        </div>

                        {/* Info pills */}
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                          {[
                            `${String(c.send_hour ?? 8).padStart(2,"0")}h–${String(c.end_hour ?? 17).padStart(2,"0")}h`,
                            days,
                            `${c.daily_limit} msgs/dia`,
                            `${msgs.length} variação${msgs.length !== 1 ? "ões" : ""}`,
                            ...(c.followup_days ? [`follow-up ${c.followup_days}d`] : []),
                          ].map((pill) => (
                            <span key={pill} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "5px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--up-border)", color: "var(--up-text-dim)" }}>
                              {pill}
                            </span>
                          ))}
                        </div>

                        {/* Divider + actions */}
                        <div style={{ marginTop: "auto", borderTop: "1px solid var(--up-border)", paddingTop: "14px", display: "flex", gap: "6px" }}>
                          <button onClick={() => toggleActive(c)}
                            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 13px", background: c.active ? "rgba(74,222,128,0.08)" : "rgba(0,207,255,0.08)", border: `1px solid ${c.active ? "rgba(74,222,128,0.2)" : "rgba(0,207,255,0.2)"}`, borderRadius: "7px", fontSize: "12px", fontWeight: "600", color: c.active ? GREEN : ACCENT, cursor: "pointer" }}>
                            {c.active ? <><Pause size={11} /> Pausar</> : <><Play size={11} /> Ativar</>}
                          </button>
                          <button onClick={() => editar(c)}
                            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 13px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--up-border)", borderRadius: "7px", fontSize: "12px", color: "var(--up-text-dim)", cursor: "pointer" }}>
                            Editar
                          </button>
                          <button onClick={() => duplicar(c)} title="Duplicar campanha"
                            style={{ display: "flex", alignItems: "center", padding: "6px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--up-border)", borderRadius: "7px", cursor: "pointer", color: "var(--up-text-dim)" }}>
                            <Copy size={12} />
                          </button>
                          <button onClick={() => excluir(c.id)} title="Excluir"
                            style={{ display: "flex", alignItems: "center", padding: "6px 10px", background: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: "7px", cursor: "pointer", color: "#FF6B6B", marginLeft: "auto" }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════
            TAB: DISPAROS
        ════════════════════════════════ */}
        {activeTab === "disparos" && (
          <div>
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--up-text)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Disparos</h2>
              <p style={{ fontSize: "12px", color: "var(--up-text-dim)", margin: 0 }}>Envio imediato para listas avulsas</p>
            </div>

            <div className="disp-grid">
              {/* ── Compose ── */}
              <div style={{ background: "var(--up-card)", border: "1px solid var(--up-border)", borderRadius: "14px", padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
                <p style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--up-text-label)", margin: 0 }}>Compose</p>

                {/* Numbers */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
                    <label style={lbl}>Números</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {dispCount > 0 && (
                        <span style={{ fontSize: "11px", color: "var(--up-text-dim)" }}>{dispCount} número{dispCount !== 1 ? "s" : ""}</span>
                      )}
                      <button onClick={() => fileRef.current?.click()}
                        style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,207,255,0.06)", border: "1px solid rgba(0,207,255,0.18)", borderRadius: "5px", padding: "3px 9px", fontSize: "11px", color: ACCENT, cursor: "pointer", fontWeight: "600" }}>
                        <Upload size={10} /> CSV
                      </button>
                      <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleCSV} />
                    </div>
                  </div>
                  <textarea
                    style={{ ...inp, resize: "vertical", minHeight: "110px" }}
                    placeholder={"55119...\n55218...\n55317..."}
                    value={dispNumbers}
                    onChange={(e) => setDispNumbers(e.target.value)}
                  />
                  {dispCount > 0 && dispEst > 0 && (
                    <p style={{ fontSize: "11px", color: "var(--up-text-dim)", marginTop: "6px" }}>
                      Estimativa: ~{dispEst} min de disparo
                    </p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label style={lbl}>Mensagem</label>
                  <textarea
                    style={{ ...inp, resize: "vertical", minHeight: "90px" }}
                    placeholder="Escreva a mensagem..."
                    value={dispMsg}
                    onChange={(e) => setDispMsg(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: "6px", marginTop: "7px", flexWrap: "wrap" }}>
                    {["{nome_empresa}", "{cidade}", "{ramo}"].map((v) => (
                      <button key={v} onClick={() => setDispMsg((p) => p + v)}
                        style={{ fontSize: "10px", padding: "2px 8px", background: "rgba(0,207,255,0.06)", border: "1px solid rgba(0,207,255,0.15)", borderRadius: "4px", color: ACCENT, cursor: "pointer", fontWeight: "600" }}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delays */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={lbl}>Delay mín (seg)</label>
                    <input type="number" style={inp} value={dispMinDelay} min={5} max={600}
                      onChange={(e) => setDispMinDelay(Number(e.target.value))} />
                  </div>
                  <div>
                    <label style={lbl}>Delay máx (seg)</label>
                    <input type="number" style={inp} value={dispMaxDelay} min={5} max={600}
                      onChange={(e) => setDispMaxDelay(Number(e.target.value))} />
                  </div>
                </div>

                {/* Send */}
                <button onClick={sendNow} disabled={dispSending || !dispNumbers.trim() || !dispMsg.trim()}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", background: YELLOW, color: "#000", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer", opacity: (dispSending || !dispNumbers.trim() || !dispMsg.trim()) ? 0.45 : 1, transition: "opacity 0.2s" }}>
                  {dispSending ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={15} />}
                  {dispSending ? "Enviando…" : `Disparar agora${dispCount > 0 ? ` (${dispCount})` : ""}`}
                </button>
                {dispResult && (
                  <p style={{ textAlign: "center", fontSize: "12px", color: GREEN }}>{dispResult}</p>
                )}
              </div>

              {/* ── History ── */}
              <div style={{ background: "var(--up-card)", border: "1px solid var(--up-border)", borderRadius: "14px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--up-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                  <p style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--up-text-label)", margin: 0 }}>Histórico</p>
                  <button onClick={loadHistory} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--up-text-dim)" }}>
                    <RefreshCw size={12} style={{ animation: histLoading ? "spin 1s linear infinite" : "none" }} />
                  </button>
                </div>

                {histLoading ? (
                  <div style={{ padding: "48px", textAlign: "center" }}>
                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite", color: "var(--up-text-dim)" }} />
                  </div>
                ) : histLogs.length === 0 ? (
                  <p style={{ padding: "48px", textAlign: "center", fontSize: "13px", color: "var(--up-text-dim)", margin: 0 }}>Nenhum envio registrado.</p>
                ) : (
                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {histLogs.map((log, i) => (
                      <div key={log.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: i < histLogs.length - 1 ? "1px solid var(--up-border)" : "none", gap: "10px" }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "12px", fontWeight: "600", color: "var(--up-text)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {log.nome ?? log.telefone}
                          </p>
                          <p style={{ fontSize: "11px", color: "var(--up-text-dim)", margin: 0 }}>{log.telefone}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <span style={{ fontSize: "9px", fontWeight: "700", padding: "2px 6px", borderRadius: "3px", background: log.status === "enviado" ? "rgba(74,222,128,0.1)" : "rgba(255,107,107,0.1)", color: log.status === "enviado" ? GREEN : "#FF6B6B", border: `1px solid ${log.status === "enviado" ? "rgba(74,222,128,0.2)" : "rgba(255,107,107,0.2)"}`, textTransform: "uppercase" }}>
                            {log.status}
                          </span>
                          <span style={{ fontSize: "10px", color: "var(--up-text-dim)", whiteSpace: "nowrap" }}>
                            {log.sent_at ? new Date(log.sent_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            TAB: MONITOR
        ════════════════════════════════ */}
        {activeTab === "monitor" && (
          <div>
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--up-text)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Monitor</h2>
              <p style={{ fontSize: "12px", color: "var(--up-text-dim)", margin: 0 }}>Acompanhamento em tempo real dos envios</p>
            </div>
            <MonitorTab />
          </div>
        )}

        {/* ════════════════════════════════
            TAB: INSTÂNCIAS
        ════════════════════════════════ */}
        {activeTab === "instancias" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: "var(--up-text)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Instâncias WhatsApp</h2>
                <p style={{ fontSize: "12px", color: "var(--up-text-dim)", margin: 0 }}>
                  Evolution API · {latency > 0 ? `${latency}ms` : "—"} · {connectedInstances.length}/{instances.length} conectadas
                </p>
              </div>
              <button onClick={loadInstances} disabled={instLoading}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.04)", border: "1px solid var(--up-border)", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", color: "var(--up-text-dim)", cursor: "pointer" }}>
                <RefreshCw size={12} style={{ animation: instLoading ? "spin 1s linear infinite" : "none" }} /> Atualizar
              </button>
            </div>

            {instLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "var(--up-text-dim)" }}>
                <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            ) : instances.length === 0 ? (
              <div style={{ background: "var(--up-card)", border: "1px solid var(--up-border)", borderRadius: "14px", padding: "48px", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: "var(--up-text-dim)", margin: 0 }}>Nenhuma instância encontrada.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {instances.map((inst) => {
                  const name      = inst.name;
                  const state     = (inst.connectionStatus ?? "").toUpperCase();
                  const connected = state === "OPEN" || state === "CONNECTED" || state === "AUTHENTICATED";
                  const owner     = inst.ownerJid?.replace("@s.whatsapp.net", "") ?? "";
                  const profile   = inst.profileName ?? "";
                  const qr        = qrData[name];
                  const health    = connected ? (latency < 200 ? 100 : latency < 500 ? 70 : 40) : 0;
                  const hColor    = health >= 80 ? GREEN : health >= 50 ? YELLOW : "#FF6B6B";

                  return (
                    <div key={name} style={{ background: "var(--up-card)", border: `1px solid ${connected ? "rgba(74,222,128,0.2)" : "var(--up-border)"}`, borderRadius: "14px", padding: "22px 26px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          {/* Avatar */}
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            {inst.profilePicUrl ? (
                              <img src={inst.profilePicUrl} alt="foto" style={{ width: "52px", height: "52px", borderRadius: "50%", border: `2px solid ${connected ? "rgba(74,222,128,0.4)" : "var(--up-border)"}`, objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--up-bg)", border: `2px solid ${connected ? "rgba(74,222,128,0.3)" : "var(--up-border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {connected ? <Wifi size={22} color={GREEN} /> : <WifiOff size={22} color="#555" />}
                              </div>
                            )}
                            <div style={{ position: "absolute", bottom: "1px", right: "1px", width: "13px", height: "13px", borderRadius: "50%", background: connected ? GREEN : "#444", border: "2px solid var(--up-card)" }} />
                          </div>

                          {/* Info */}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                              <span style={{ fontSize: "16px", fontWeight: "700", color: "var(--up-text)" }}>{name}</span>
                              <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px", background: connected ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", color: connected ? GREEN : "#555", border: `1px solid ${connected ? "rgba(74,222,128,0.25)" : "var(--up-border)"}`, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                {connected ? "Conectado" : "Offline"}
                              </span>
                            </div>
                            {connected && profile && (
                              <p style={{ fontSize: "12px", color: "var(--up-text-dim)", margin: "0 0 7px" }}>
                                {profile}{owner ? ` · +${owner}` : ""}
                              </p>
                            )}
                            {/* Health bar */}
                            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                              <div style={{ width: "88px", height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
                                <div style={{ width: `${health}%`, height: "100%", background: hColor, borderRadius: "99px", transition: "width 0.4s" }} />
                              </div>
                              <span style={{ fontSize: "10px", color: hColor, fontWeight: "600" }}>
                                {connected ? `Saúde ${health}%` : "Offline"}
                              </span>
                              {latency > 0 && connected && (
                                <span style={{ fontSize: "10px", color: latencyColor(latency), fontWeight: "600" }}>{latency}ms</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          {connected && (
                            <button onClick={() => setShowTest((v) => !v)}
                              style={{ display: "flex", alignItems: "center", gap: "6px", background: showTest ? "rgba(0,207,255,0.12)" : "rgba(0,207,255,0.06)", border: `1px solid ${showTest ? "rgba(0,207,255,0.35)" : "rgba(0,207,255,0.18)"}`, borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", color: ACCENT, cursor: "pointer" }}>
                              <Send size={12} /> Testar
                            </button>
                          )}
                          {!connected && (
                            <button onClick={() => connectInstance(name)} disabled={qrLoading[name]}
                              style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,207,255,0.08)", border: "1px solid rgba(0,207,255,0.2)", borderRadius: "8px", padding: "7px 14px", fontSize: "12px", fontWeight: "600", color: ACCENT, cursor: "pointer" }}>
                              {qrLoading[name] ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <QrCode size={12} />} Conectar
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

                      {/* QR Code */}
                      {qr && (
                        <div style={{ marginTop: "20px", padding: "16px", background: "#fff", borderRadius: "10px", display: "inline-block" }}>
                          <img src={qr} alt="QR Code" style={{ width: "200px", height: "200px", display: "block" }} />
                          <p style={{ fontSize: "11px", color: "#333", textAlign: "center", margin: "8px 0 0" }}>Escaneie com o WhatsApp</p>
                        </div>
                      )}

                      {/* Test panel */}
                      {showTest && connected && (
                        <div style={{ marginTop: "20px", padding: "18px 20px", background: "rgba(0,207,255,0.04)", border: "1px solid rgba(0,207,255,0.12)", borderRadius: "12px" }}>
                          <p style={{ fontSize: "11px", fontWeight: "700", color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 14px" }}>Mensagem de teste</p>
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
                          {testResult && (
                            <p style={{ fontSize: "12px", color: testResult.includes("!") ? GREEN : "#FF6B6B", margin: "10px 0 0" }}>{testResult}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .camp-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 16px;
          }
          .disp-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            align-items: start;
          }
          @media (max-width: 900px) {
            .camp-grid { grid-template-columns: 1fr; }
            .disp-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </div>
    </>
  );
}
