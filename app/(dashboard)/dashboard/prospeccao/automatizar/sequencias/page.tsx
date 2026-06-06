"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/header";
import { Plus, Trash2, RefreshCw, X } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

type Step = { id: string; sequence_name: string; step_order: number; day_offset: number; message: string; active: boolean };

export default function SequenciasPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sequence_name: "Padrão", day_offset: "", message: "" });

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/followup-sequences");
    const data = await res.json();
    setSteps(data.steps ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  async function addStep(e: React.FormEvent) {
    e.preventDefault();
    const maxOrder = steps.filter((s) => s.sequence_name === form.sequence_name).length;
    await fetch("/api/followup-sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, day_offset: Number(form.day_offset), step_order: maxOrder + 1 }),
    });
    setForm({ sequence_name: "Padrão", day_offset: "", message: "" });
    setShowForm(false);
    fetch_();
  }

  async function deleteStep(id: string) {
    await fetch("/api/followup-sequences", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  const sequences = [...new Set(steps.map((s) => s.sequence_name))];

  const inputStyle = {
    width: "100%", background: "#0d0d0d", border: `1px solid ${BORDER}`,
    borderRadius: "6px", padding: "10px 12px", fontSize: "13px", color: "#F0EDE8",
    outline: "none", boxSizing: "border-box" as const,
  };

  return (
    <>
      <Header title="Sequências de Follow-up" />
      <style>{`
        .seq-wrap { padding: 24px 32px 32px; flex: 1; }
        .step-card { background: #0d0d0d; border: 1px solid ${BORDER}; border-radius: 8px; padding: 14px 16px; margin-bottom: 8px; display: flex; gap: 12px; align-items: flex-start; }
        input:focus, textarea:focus, select:focus { border-color: ${ACCENT} !important; }
        @media (max-width: 768px) { .seq-wrap { padding: 16px; } }
      `}</style>

      <div className="seq-wrap">
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <p style={{ fontSize: "11px", color: ACCENT, letterSpacing: "0.22em", textTransform: "uppercase", margin: "0 0 4px" }}>Automação</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#F0EDE8", margin: 0 }}>Sequências</h2>
            <p style={{ fontSize: "13px", color: "#555", margin: "6px 0 0" }}>Configure múltiplos follow-ups em dias diferentes</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={fetch_} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "8px 12px", cursor: "pointer", color: "#555", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
              <RefreshCw size={13} />
            </button>
            <button onClick={() => setShowForm(true)} style={{ background: ACCENT, border: "none", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", color: "#000", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
              <Plus size={14} /> Adicionar passo
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div style={{ background: "#0d0d0d", border: `1px solid ${ACCENT}`, borderRadius: "10px", padding: "18px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#F0EDE8" }}>Novo passo</span>
              <button onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#555" }}><X size={15} /></button>
            </div>
            <form onSubmit={addStep} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "#555", display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Sequência</label>
                  <input value={form.sequence_name} onChange={(e) => setForm((f) => ({ ...f, sequence_name: e.target.value }))} placeholder="Padrão" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "#555", display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Enviar no dia</label>
                  <input type="number" min="1" value={form.day_offset} onChange={(e) => setForm((f) => ({ ...f, day_offset: e.target.value }))} placeholder="Ex: 3 (3 dias após contato)" required style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "#555", display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Mensagem</label>
                <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={4} placeholder="Use {nome}, {cidade}, {ramo}..." required style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
                <div style={{ fontSize: "11px", color: "#444", marginTop: "3px" }}>Variáveis: {"{nome}"} {"{cidade}"} {"{ramo}"}</div>
              </div>
              <button type="submit" style={{ alignSelf: "flex-start", background: ACCENT, border: "none", borderRadius: "6px", padding: "9px 18px", fontSize: "13px", fontWeight: "600", color: "#000", cursor: "pointer" }}>
                Salvar passo
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ color: "#555", fontSize: "13px" }}>Carregando...</div>
        ) : steps.length === 0 ? (
          <div style={{ background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "32px", textAlign: "center", color: "#444", fontSize: "13px" }}>
            Nenhuma sequência configurada. Adicione o primeiro passo.
          </div>
        ) : sequences.map((seq) => (
          <div key={seq} style={{ marginBottom: "28px" }}>
            <p style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px", paddingBottom: "8px", borderBottom: `1px solid ${BORDER}` }}>
              Sequência: {seq}
            </p>
            {steps.filter((s) => s.sequence_name === seq).map((step, i) => (
              <div key={step.id} className="step-card">
                <div style={{ minWidth: "40px", textAlign: "center", paddingTop: "2px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "#000", margin: "0 auto" }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>Dia {step.day_offset}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", color: "#ccc", margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {step.message.length > 200 ? step.message.slice(0, 200) + "..." : step.message}
                  </p>
                </div>
                <button onClick={() => deleteStep(step.id)} style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", color: "#ef4444", flexShrink: 0 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
