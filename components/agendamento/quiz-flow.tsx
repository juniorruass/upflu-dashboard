"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Calendar, Clock, User, Phone, Mail, CheckCircle } from "lucide-react";
import type { AgendamentoConfig, QuizPergunta, AgendamentoSlot } from "@/types";
import { diaSemanaParaNome, formatarData } from "@/lib/agendamento";

const ACCENT = "#00CFFF";

interface Props {
  config: AgendamentoConfig | null;
  perguntas: QuizPergunta[];
  slots: AgendamentoSlot[];
}

type Step = "welcome" | "quiz" | "dados" | "data" | "hora" | "revisar";

export default function QuizFlow({ config, perguntas, slots }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [quizIndex, setQuizIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [dados, setDados] = useState({ nome: "", telefone: "", email: "" });
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horaSelecionada, setHoraSelecionada] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [erro, setErro] = useState("");

  const perguntasAtivas = perguntas.filter((p) => p.ativo);
  const clinicaNome = config?.nome_clinica ?? "Clínica";

  // Gera datas disponíveis (próximos N dias com slot ativo)
  const diasAtivos = new Set(slots.filter((s) => s.ativo).map((s) => s.dia_semana));
  const diasAntecedencia = config?.dias_antecedencia ?? 30;
  const datasDisponiveis: string[] = [];
  const hoje = new Date();
  for (let i = 1; i <= diasAntecedencia + 30; i++) {
    if (datasDisponiveis.length >= diasAntecedencia) break;
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    if (diasAtivos.has(d.getDay())) {
      datasDisponiveis.push(d.toISOString().split("T")[0]);
    }
  }

  useEffect(() => {
    if (!dataSelecionada) return;
    setHorarios([]);
    setHoraSelecionada("");
    setLoadingHorarios(true);
    fetch(`/api/agendamento/disponibilidade?data=${dataSelecionada}`)
      .then((r) => r.json())
      .then((d) => setHorarios(d.horarios ?? []))
      .finally(() => setLoadingHorarios(false));
  }, [dataSelecionada]);

  async function handleSubmit() {
    setSubmitting(true);
    setErro("");
    try {
      const res = await fetch("/api/agendamento/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paciente: dados,
          data: dataSelecionada,
          hora: horaSelecionada,
          quiz_respostas: respostas,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setErro(d.error ?? "Erro ao agendar. Tente novamente.");
        return;
      }
      const params = new URLSearchParams({
        nome: dados.nome,
        data: dataSelecionada,
        hora: horaSelecionada,
        clinica: clinicaNome,
      });
      router.push(`/agendar/confirmacao?${params.toString()}`);
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const totalSteps = perguntasAtivas.length + 4; // dados + data + hora + revisar
  const currentStepNum =
    step === "welcome" ? 0 :
    step === "quiz" ? quizIndex + 1 :
    step === "dados" ? perguntasAtivas.length + 1 :
    step === "data" ? perguntasAtivas.length + 2 :
    step === "hora" ? perguntasAtivas.length + 3 :
    totalSteps;
  const progress = step === "welcome" ? 0 : Math.round((currentStepNum / totalSteps) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "var(--up-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "system-ui, sans-serif" }}>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: "520px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "11px", fontWeight: "600", color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "8px" }}>
            {clinicaNome}
          </p>
          {step !== "welcome" && (
            <div style={{ height: "3px", background: "var(--up-border)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: ACCENT, borderRadius: "99px", transition: "width 0.3s ease" }} />
            </div>
          )}
        </div>

        {/* ── WELCOME ── */}
        {step === "welcome" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", background: "rgba(0,207,255,0.08)", border: `1px solid rgba(0,207,255,0.2)`, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <Calendar size={28} color={ACCENT} />
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#fff", marginBottom: "12px", lineHeight: 1.2 }}>
              Agende sua consulta
            </h1>
            <p style={{ fontSize: "14px", color: "var(--up-text-muted)", marginBottom: "36px", lineHeight: 1.6 }}>
              {config?.descricao ?? "Processo rápido, sem ligação."}
            </p>
            <button onClick={() => perguntasAtivas.length > 0 ? setStep("quiz") : setStep("dados")}
              style={{ width: "100%", padding: "16px", background: ACCENT, border: "none", borderRadius: "10px", color: "#000", fontSize: "15px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              Começar agendamento <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── QUIZ ── */}
        {step === "quiz" && perguntasAtivas[quizIndex] && (() => {
          const p = perguntasAtivas[quizIndex];
          return (
            <div>
              <p style={{ fontSize: "11px", color: "var(--up-text-label)", marginBottom: "12px" }}>
                Pergunta {quizIndex + 1} de {perguntasAtivas.length}
              </p>
              <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff", marginBottom: "24px", lineHeight: 1.4 }}>
                {p.pergunta}
              </h2>

              {p.tipo === "single_choice" && Array.isArray(p.opcoes) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {p.opcoes.map((op) => {
                    const sel = respostas[p.id] === op;
                    return (
                      <button key={op} onClick={() => setRespostas({ ...respostas, [p.id]: op })}
                        style={{ padding: "14px 16px", background: sel ? "rgba(0,207,255,0.1)" : "#111", border: `1px solid ${sel ? "rgba(0,207,255,0.4)" : "var(--up-border)"}`, borderRadius: "10px", color: sel ? ACCENT : "#ccc", fontSize: "14px", textAlign: "left", cursor: "pointer", transition: "all 0.15s", fontWeight: sel ? "600" : "400" }}>
                        {op}
                      </button>
                    );
                  })}
                </div>
              )}

              {p.tipo === "text" && (
                <textarea
                  value={respostas[p.id] ?? ""}
                  onChange={(e) => setRespostas({ ...respostas, [p.id]: e.target.value })}
                  placeholder="Sua resposta..."
                  rows={3}
                  style={{ width: "100%", padding: "14px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", color: "#fff", fontSize: "14px", resize: "none", outline: "none", boxSizing: "border-box" }}
                />
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "28px" }}>
                {quizIndex > 0 && (
                  <button onClick={() => setQuizIndex(quizIndex - 1)}
                    style={{ flex: 1, padding: "14px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", color: "var(--up-text-muted)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <ChevronLeft size={16} /> Voltar
                  </button>
                )}
                {quizIndex === 0 && (
                  <button onClick={() => setStep("welcome")}
                    style={{ flex: 1, padding: "14px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", color: "var(--up-text-muted)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <ChevronLeft size={16} /> Voltar
                  </button>
                )}
                <button
                  disabled={p.obrigatoria && !respostas[p.id]}
                  onClick={() => {
                    if (quizIndex < perguntasAtivas.length - 1) setQuizIndex(quizIndex + 1);
                    else setStep("dados");
                  }}
                  style={{ flex: 2, padding: "14px", background: (p.obrigatoria && !respostas[p.id]) ? "#222" : ACCENT, border: "none", borderRadius: "10px", color: (p.obrigatoria && !respostas[p.id]) ? "#555" : "#000", fontSize: "14px", fontWeight: "600", cursor: (p.obrigatoria && !respostas[p.id]) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  {quizIndex < perguntasAtivas.length - 1 ? "Próxima" : "Continuar"} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── DADOS PESSOAIS ── */}
        {step === "dados" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff", marginBottom: "6px" }}>Seus dados</h2>
            <p style={{ fontSize: "13px", color: "var(--up-text-muted)", marginBottom: "24px" }}>Precisamos para confirmar seu agendamento.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "28px" }}>
              {[
                { label: "Nome completo *", key: "nome", icon: <User size={16} />, placeholder: "Como prefere ser chamado?" },
                { label: "WhatsApp *", key: "telefone", icon: <Phone size={16} />, placeholder: "(11) 99999-9999" },
                { label: "E-mail (opcional)", key: "email", icon: <Mail size={16} />, placeholder: "seu@email.com" },
              ].map(({ label, key, icon, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: "12px", color: "var(--up-text-label)", display: "block", marginBottom: "6px" }}>{label}</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--up-text-dim)" }}>{icon}</div>
                    <input
                      value={dados[key as keyof typeof dados]}
                      onChange={(e) => setDados({ ...dados, [key]: e.target.value })}
                      placeholder={placeholder}
                      style={{ width: "100%", padding: "13px 14px 13px 36px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => perguntasAtivas.length > 0 ? setStep("quiz") : setStep("welcome")}
                style={{ flex: 1, padding: "14px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", color: "var(--up-text-muted)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <ChevronLeft size={16} /> Voltar
              </button>
              <button
                disabled={!dados.nome || !dados.telefone}
                onClick={() => setStep("data")}
                style={{ flex: 2, padding: "14px", background: (!dados.nome || !dados.telefone) ? "#222" : ACCENT, border: "none", borderRadius: "10px", color: (!dados.nome || !dados.telefone) ? "#555" : "#000", fontSize: "14px", fontWeight: "600", cursor: (!dados.nome || !dados.telefone) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                Escolher data <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── DATA ── */}
        {step === "data" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff", marginBottom: "6px" }}>Escolha a data</h2>
            <p style={{ fontSize: "13px", color: "var(--up-text-muted)", marginBottom: "24px" }}>Datas disponíveis para agendamento.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "8px", marginBottom: "28px" }}>
              {datasDisponiveis.slice(0, 21).map((d) => {
                const dt = new Date(d + "T12:00:00");
                const sel = dataSelecionada === d;
                return (
                  <button key={d} onClick={() => setDataSelecionada(d)}
                    style={{ padding: "12px 8px", background: sel ? "rgba(0,207,255,0.12)" : "#111", border: `1px solid ${sel ? "rgba(0,207,255,0.4)" : "var(--up-border)"}`, borderRadius: "10px", cursor: "pointer", transition: "all 0.15s" }}>
                    <p style={{ fontSize: "10px", color: sel ? ACCENT : "#777068", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
                      {diaSemanaParaNome(dt.getDay()).substring(0, 3)}
                    </p>
                    <p style={{ fontSize: "18px", fontWeight: "700", color: sel ? ACCENT : "#fff" }}>
                      {String(dt.getDate()).padStart(2, "0")}
                    </p>
                    <p style={{ fontSize: "10px", color: sel ? ACCENT : "#777068" }}>
                      {dt.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                    </p>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep("dados")}
                style={{ flex: 1, padding: "14px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", color: "var(--up-text-muted)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <ChevronLeft size={16} /> Voltar
              </button>
              <button disabled={!dataSelecionada} onClick={() => setStep("hora")}
                style={{ flex: 2, padding: "14px", background: !dataSelecionada ? "#222" : ACCENT, border: "none", borderRadius: "10px", color: !dataSelecionada ? "#555" : "#000", fontSize: "14px", fontWeight: "600", cursor: !dataSelecionada ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                Escolher horário <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── HORA ── */}
        {step === "hora" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff", marginBottom: "4px" }}>Escolha o horário</h2>
            <p style={{ fontSize: "13px", color: "var(--up-text-muted)", marginBottom: "24px" }}>{formatarData(dataSelecionada)}</p>

            {loadingHorarios ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--up-text-label)" }}>Carregando horários...</div>
            ) : horarios.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--up-text-label)", marginBottom: "16px" }}>Nenhum horário disponível nesta data.</p>
                <button onClick={() => { setDataSelecionada(""); setStep("data"); }}
                  style={{ padding: "10px 20px", background: "transparent", border: `1px solid var(--up-border)`, borderRadius: "8px", color: "var(--up-text-muted)", cursor: "pointer", fontSize: "13px" }}>
                  Escolher outra data
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "8px", marginBottom: "28px" }}>
                {horarios.map((h) => {
                  const sel = horaSelecionada === h;
                  return (
                    <button key={h} onClick={() => setHoraSelecionada(h)}
                      style={{ padding: "12px 8px", background: sel ? "rgba(0,207,255,0.12)" : "#111", border: `1px solid ${sel ? "rgba(0,207,255,0.4)" : "var(--up-border)"}`, borderRadius: "10px", color: sel ? ACCENT : "#ccc", fontSize: "15px", fontWeight: sel ? "700" : "400", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <Clock size={12} color={sel ? ACCENT : "#555"} />
                      {h}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep("data")}
                style={{ flex: 1, padding: "14px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", color: "var(--up-text-muted)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <ChevronLeft size={16} /> Voltar
              </button>
              <button disabled={!horaSelecionada} onClick={() => setStep("revisar")}
                style={{ flex: 2, padding: "14px", background: !horaSelecionada ? "#222" : ACCENT, border: "none", borderRadius: "10px", color: !horaSelecionada ? "#555" : "#000", fontSize: "14px", fontWeight: "600", cursor: !horaSelecionada ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                Revisar <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── REVISAR ── */}
        {step === "revisar" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "600", color: "#fff", marginBottom: "6px" }}>Confirmar agendamento</h2>
            <p style={{ fontSize: "13px", color: "var(--up-text-muted)", marginBottom: "24px" }}>Revise os dados antes de confirmar.</p>

            <div style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
              <Row icon={<User size={15} />} label="Nome" value={dados.nome} />
              <Row icon={<Phone size={15} />} label="WhatsApp" value={dados.telefone} />
              {dados.email && <Row icon={<Mail size={15} />} label="E-mail" value={dados.email} />}
              <div style={{ height: "1px", background: "var(--up-border)", margin: "16px 0" }} />
              <Row icon={<Calendar size={15} />} label="Data" value={formatarData(dataSelecionada)} />
              <Row icon={<Clock size={15} />} label="Horário" value={horaSelecionada} last />
            </div>

            {Object.keys(respostas).length > 0 && (
              <div style={{ background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                <p style={{ fontSize: "11px", color: "var(--up-text-label)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Respostas do quiz</p>
                {perguntasAtivas.filter((p) => respostas[p.id]).map((p) => (
                  <div key={p.id} style={{ marginBottom: "10px" }}>
                    <p style={{ fontSize: "12px", color: "var(--up-text-label)", marginBottom: "2px" }}>{p.pergunta}</p>
                    <p style={{ fontSize: "13px", color: "#ccc" }}>{respostas[p.id]}</p>
                  </div>
                ))}
              </div>
            )}

            {erro && (
              <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#EF4444", fontSize: "13px", marginBottom: "16px" }}>
                {erro}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep("hora")}
                style={{ flex: 1, padding: "14px", background: "var(--up-card)", border: `1px solid var(--up-border)`, borderRadius: "10px", color: "var(--up-text-muted)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <ChevronLeft size={16} /> Voltar
              </button>
              <button disabled={submitting} onClick={handleSubmit}
                style={{ flex: 2, padding: "14px", background: submitting ? "#222" : ACCENT, border: "none", borderRadius: "10px", color: submitting ? "#555" : "#000", fontSize: "14px", fontWeight: "700", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                {submitting ? "Agendando..." : (<><CheckCircle size={16} /> Confirmar agendamento</>)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ icon, label, value, last = false }: { icon: React.ReactNode; label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: last ? "0" : "12px" }}>
      <div style={{ color: ACCENT }}>{icon}</div>
      <div>
        <p style={{ fontSize: "11px", color: "var(--up-text-label)", marginBottom: "1px" }}>{label}</p>
        <p style={{ fontSize: "14px", color: "#fff", fontWeight: "500" }}>{value}</p>
      </div>
    </div>
  );
}
