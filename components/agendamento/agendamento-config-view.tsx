"use client";

import { useState } from "react";
import { Save, Plus, Trash2, GripVertical, Link2, Zap, Clock, Calendar, Building2 } from "lucide-react";
import type { AgendamentoConfig, QuizPergunta, AgendamentoSlot } from "@/types";
import { diaSemanaParaNome } from "@/lib/agendamento";

const ACCENT = "#00CFFF";
type Tab = "clinica" | "quiz" | "horarios" | "webhook";

const DIAS_SEMANA = [0, 1, 2, 3, 4, 5, 6];

interface Props {
  config: AgendamentoConfig | null;
  perguntas: QuizPergunta[];
  slots: AgendamentoSlot[];
}

export default function AgendamentoConfigView({ config, perguntas: initPerguntas, slots: initSlots }: Props) {
  const [tab, setTab] = useState<Tab>("clinica");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Clínica
  const [clinicaForm, setClinicaForm] = useState({
    nome_clinica: config?.nome_clinica ?? "",
    especialidade: config?.especialidade ?? "",
    descricao: config?.descricao ?? "",
    duracao_consulta: config?.duracao_consulta ?? 30,
    antecedencia_minima_horas: config?.antecedencia_minima_horas ?? 2,
    dias_antecedencia: config?.dias_antecedencia ?? 30,
  });

  // Quiz
  const [perguntas, setPerguntas] = useState<Partial<QuizPergunta>[]>(initPerguntas);

  // Slots
  const [slots, setSlots] = useState<Partial<AgendamentoSlot>[]>(
    DIAS_SEMANA.map((dia) => {
      const existing = initSlots.find((s) => s.dia_semana === dia);
      return existing ?? { dia_semana: dia, hora_inicio: "09:00", hora_fim: "18:00", ativo: false };
    })
  );

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState(config?.webhook_url ?? "");
  const [webhookAtivo, setWebhookAtivo] = useState(config?.webhook_ativo ?? false);

  function showSaved() {
    setSavedMsg("Salvo!");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  async function saveClinica() {
    setSaving(true);
    try {
      await fetch("/api/agendamento/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicaForm),
      });
      showSaved();
    } finally { setSaving(false); }
  }

  async function saveQuiz() {
    setSaving(true);
    try {
      const payload = perguntas.map((p, i) => ({ ...p, ordem: i + 1 }));
      await fetch("/api/agendamento/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      showSaved();
    } finally { setSaving(false); }
  }

  async function saveSlots() {
    setSaving(true);
    try {
      await fetch("/api/agendamento/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slots),
      });
      showSaved();
    } finally { setSaving(false); }
  }

  async function saveWebhook() {
    setSaving(true);
    try {
      await fetch("/api/agendamento/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhook_url: webhookUrl, webhook_ativo: webhookAtivo }),
      });
      showSaved();
    } finally { setSaving(false); }
  }

  function addPergunta() {
    setPerguntas([...perguntas, { pergunta: "", tipo: "single_choice", opcoes: ["Opção A", "Opção B"], obrigatoria: true, ativo: true, ordem: perguntas.length + 1 }]);
  }

  function removePergunta(i: number) {
    setPerguntas(perguntas.filter((_, idx) => idx !== i));
  }

  function updatePergunta(i: number, field: string, value: unknown) {
    setPerguntas(perguntas.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function updateSlot(dia: number, field: string, value: unknown) {
    setSlots(slots.map((s) => s.dia_semana === dia ? { ...s, [field]: value } : s));
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "clinica", label: "Clínica", icon: <Building2 size={14} /> },
    { key: "quiz", label: "Quiz", icon: <Zap size={14} /> },
    { key: "horarios", label: "Horários", icon: <Clock size={14} /> },
    { key: "webhook", label: "Webhook", icon: <Link2 size={14} /> },
  ];

  return (
    <div style={{ padding: "24px", flex: 1 }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "28px", borderBottom: `1px solid var(--up-border)`, paddingBottom: "0" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "10px 18px", background: "transparent", border: "none", borderBottom: `2px solid ${tab === t.key ? ACCENT : "transparent"}`, color: tab === t.key ? ACCENT : "#9A9288", cursor: "pointer", fontSize: "13px", fontWeight: tab === t.key ? "600" : "400", display: "flex", alignItems: "center", gap: "6px", marginBottom: "-1px" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── CLÍNICA ── */}
      {tab === "clinica" && (
        <div style={{ maxWidth: "540px" }}>
          <Section title="Informações gerais">
            <Field label="Nome da clínica">
              <Input value={clinicaForm.nome_clinica} onChange={(v) => setClinicaForm({ ...clinicaForm, nome_clinica: v })} placeholder="Ex: Clínica Saúde Total" />
            </Field>
            <Field label="Especialidade / Nicho">
              <Input value={clinicaForm.especialidade} onChange={(v) => setClinicaForm({ ...clinicaForm, especialidade: v })} placeholder="Ex: Estética, Odontologia, Fisioterapia" />
            </Field>
            <Field label="Descrição (aparece na página de agendamento)">
              <textarea value={clinicaForm.descricao} onChange={(e) => setClinicaForm({ ...clinicaForm, descricao: e.target.value })}
                rows={3} placeholder="Ex: Agende sua consulta em segundos."
                style={{ width: "100%", padding: "12px 14px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "8px", color: "#fff", fontSize: "13px", resize: "none", outline: "none", boxSizing: "border-box" }} />
            </Field>
          </Section>

          <Section title="Configurações de agenda">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <Field label="Duração da consulta (min)">
                <Input type="number" value={String(clinicaForm.duracao_consulta)} onChange={(v) => setClinicaForm({ ...clinicaForm, duracao_consulta: Number(v) })} />
              </Field>
              <Field label="Antecedência mínima (h)">
                <Input type="number" value={String(clinicaForm.antecedencia_minima_horas)} onChange={(v) => setClinicaForm({ ...clinicaForm, antecedencia_minima_horas: Number(v) })} />
              </Field>
              <Field label="Dias à frente disponíveis">
                <Input type="number" value={String(clinicaForm.dias_antecedencia)} onChange={(v) => setClinicaForm({ ...clinicaForm, dias_antecedencia: Number(v) })} />
              </Field>
            </div>
          </Section>

          <SaveBar saving={saving} msg={savedMsg} onSave={saveClinica} />
        </div>
      )}

      {/* ── QUIZ ── */}
      {tab === "quiz" && (
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <p style={{ fontSize: "13px", color: "var(--up-text-muted)" }}>{perguntas.length} pergunta{perguntas.length !== 1 ? "s" : ""} configurada{perguntas.length !== 1 ? "s" : ""}</p>
            <button onClick={addPergunta}
              style={{ padding: "8px 14px", background: "rgba(0,207,255,0.08)", border: `1px solid rgba(0,207,255,0.2)`, borderRadius: "8px", color: ACCENT, cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Plus size={14} /> Nova pergunta
            </button>
          </div>

          {perguntas.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--up-text-label)" }}>
              <Zap size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p>Nenhuma pergunta ainda. Adicione para qualificar os pacientes.</p>
            </div>
          )}

          {perguntas.map((p, i) => (
            <div key={i} style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", padding: "16px", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <GripVertical size={14} color="#444" />
                <span style={{ fontSize: "11px", color: "var(--up-text-label)" }}>Pergunta {i + 1}</span>
                <div style={{ flex: 1 }} />
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", color: p.ativo ? ACCENT : "#777068" }}>
                  <input type="checkbox" checked={p.ativo ?? true} onChange={(e) => updatePergunta(i, "ativo", e.target.checked)} style={{ accentColor: ACCENT }} />
                  Ativa
                </label>
                <button onClick={() => removePergunta(i)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#EF4444", padding: "4px" }}>
                  <Trash2 size={14} />
                </button>
              </div>

              <Field label="Pergunta">
                <Input value={p.pergunta ?? ""} onChange={(v) => updatePergunta(i, "pergunta", v)} placeholder="Ex: Qual o motivo da consulta?" />
              </Field>

              <Field label="Tipo">
                <select value={p.tipo ?? "single_choice"} onChange={(e) => updatePergunta(i, "tipo", e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "8px", color: "#fff", fontSize: "13px", outline: "none" }}>
                  <option value="single_choice">Múltipla escolha</option>
                  <option value="text">Texto livre</option>
                  <option value="boolean">Sim / Não</option>
                </select>
              </Field>

              {p.tipo === "single_choice" && (
                <Field label="Opções (uma por linha)">
                  <textarea
                    value={(p.opcoes ?? []).join("\n")}
                    onChange={(e) => updatePergunta(i, "opcoes", e.target.value.split("\n").filter(Boolean))}
                    rows={4} placeholder={"Consulta de rotina\nRetorno\nProcedimento estético"}
                    style={{ width: "100%", padding: "12px 14px", background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "8px", color: "#fff", fontSize: "13px", resize: "none", outline: "none", boxSizing: "border-box" }} />
                </Field>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", color: "var(--up-text-muted)" }}>
                <input type="checkbox" checked={p.obrigatoria ?? true} onChange={(e) => updatePergunta(i, "obrigatoria", e.target.checked)} style={{ accentColor: ACCENT }} />
                Resposta obrigatória
              </label>
            </div>
          ))}

          {perguntas.length > 0 && <SaveBar saving={saving} msg={savedMsg} onSave={saveQuiz} />}
        </div>
      )}

      {/* ── HORÁRIOS ── */}
      {tab === "horarios" && (
        <div style={{ maxWidth: "540px" }}>
          <p style={{ fontSize: "13px", color: "var(--up-text-muted)", marginBottom: "20px" }}>
            Configure os dias e horários de atendimento. Os slots serão gerados automaticamente com base na duração da consulta.
          </p>
          {DIAS_SEMANA.map((dia) => {
            const s = slots.find((sl) => sl.dia_semana === dia) ?? { dia_semana: dia, hora_inicio: "09:00", hora_fim: "18:00", ativo: false };
            return (
              <div key={dia} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", marginBottom: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", minWidth: "110px" }}>
                  <input type="checkbox" checked={s.ativo ?? false} onChange={(e) => updateSlot(dia, "ativo", e.target.checked)} style={{ accentColor: ACCENT, width: "14px", height: "14px" }} />
                  <span style={{ fontSize: "13px", fontWeight: "500", color: s.ativo ? "#fff" : "#555" }}>{diaSemanaParaNome(dia)}</span>
                </label>
                <div style={{ flex: 1, display: "flex", gap: "8px", alignItems: "center", opacity: s.ativo ? 1 : 0.3 }}>
                  <Calendar size={12} color="#555" />
                  <input type="time" value={s.hora_inicio ?? "09:00"} disabled={!s.ativo}
                    onChange={(e) => updateSlot(dia, "hora_inicio", e.target.value)}
                    style={{ padding: "6px 10px", background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "6px", color: "#fff", fontSize: "13px", outline: "none" }} />
                  <span style={{ color: "var(--up-text-dim)", fontSize: "12px" }}>até</span>
                  <input type="time" value={s.hora_fim ?? "18:00"} disabled={!s.ativo}
                    onChange={(e) => updateSlot(dia, "hora_fim", e.target.value)}
                    style={{ padding: "6px 10px", background: "var(--up-bg)", border: `1px solid var(--up-border)`, borderRadius: "6px", color: "#fff", fontSize: "13px", outline: "none" }} />
                </div>
              </div>
            );
          })}
          <SaveBar saving={saving} msg={savedMsg} onSave={saveSlots} />
        </div>
      )}

      {/* ── WEBHOOK ── */}
      {tab === "webhook" && (
        <div style={{ maxWidth: "540px" }}>
          <div style={{ background: "rgba(0,207,255,0.04)", border: `1px solid rgba(0,207,255,0.15)`, borderRadius: "10px", padding: "16px", marginBottom: "24px" }}>
            <p style={{ fontSize: "13px", color: ACCENT, fontWeight: "600", marginBottom: "6px" }}>Como funciona</p>
            <p style={{ fontSize: "13px", color: "var(--up-text-muted)", lineHeight: 1.6 }}>
              Quando um novo agendamento for criado, o sistema registra um evento na tabela <code style={{ color: ACCENT }}>agendamento_webhook_events</code>.
              Configure o n8n para escutar o endpoint <code style={{ color: ACCENT }}>GET /api/agendamento/webhook</code> e disparar WhatsApp automático.
            </p>
          </div>

          <Section title="Configuração do n8n">
            <Field label="URL do webhook (n8n)">
              <Input value={webhookUrl} onChange={setWebhookUrl} placeholder="https://seu-n8n.com/webhook/agendamento" />
            </Field>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: webhookAtivo ? ACCENT : "#9A9288" }}>
              <input type="checkbox" checked={webhookAtivo} onChange={(e) => setWebhookAtivo(e.target.checked)} style={{ accentColor: ACCENT, width: "14px", height: "14px" }} />
              Ativar disparo automático de webhooks
            </label>
          </Section>

          <Section title="Eventos disponíveis">
            {[
              { tipo: "novo_agendamento", desc: "Disparado quando paciente confirma agendamento" },
              { tipo: "cancelamento", desc: "Disparado quando agendamento é cancelado" },
              { tipo: "lembrete_24h", desc: "Para disparar 24h antes (configurar cron no n8n)" },
              { tipo: "lembrete_2h", desc: "Para disparar 2h antes (configurar cron no n8n)" },
              { tipo: "avaliacao", desc: "Para disparar 24-48h após a consulta" },
            ].map(({ tipo, desc }) => (
              <div key={tipo} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "12px" }}>
                <div style={{ width: "8px", height: "8px", background: ACCENT, borderRadius: "50%", marginTop: "5px", flexShrink: 0 }} />
                <div>
                  <code style={{ fontSize: "12px", color: ACCENT }}>{tipo}</code>
                  <p style={{ fontSize: "12px", color: "var(--up-text-label)", marginTop: "2px" }}>{desc}</p>
                </div>
              </div>
            ))}
          </Section>

          <SaveBar saving={saving} msg={savedMsg} onSave={saveWebhook} />
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--up-text-label)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "12px", color: "var(--up-text-label)", display: "block", marginBottom: "6px" }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "10px 14px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "8px", color: "#fff", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
  );
}

function SaveBar({ saving, msg, onSave }: { saving: boolean; msg: string; onSave: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
      <button disabled={saving} onClick={onSave}
        style={{ padding: "10px 22px", background: ACCENT, border: "none", borderRadius: "8px", color: "#000", fontSize: "13px", fontWeight: "700", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: saving ? 0.7 : 1 }}>
        <Save size={14} /> {saving ? "Salvando..." : "Salvar"}
      </button>
      {msg && <span style={{ fontSize: "13px", color: "#10B981" }}>{msg}</span>}
    </div>
  );
}
