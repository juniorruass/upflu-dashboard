"use client";

import { useEffect, useState } from "react";
import { Save, Info } from "lucide-react";

const ACCENT = "#00CFFF";
const BORDER = "rgba(255,255,255,0.07)";

const VARS = [
  { key: "{{client_name}}",     desc: "Nome do cliente / empresa" },
  { key: "{{signer_name}}",     desc: "Nome do responsável pela assinatura" },
  { key: "{{signer_email}}",    desc: "Email do signatário" },
  { key: "{{total_value}}",     desc: "Valor total formatado (ex: R$ 1.500,00)" },
  { key: "{{payment_day}}",     desc: "Dia de vencimento do pagamento" },
  { key: "{{contract_start}}",  desc: "Data de início do contrato" },
  { key: "{{duration_months}}", desc: "Duração em meses" },
  { key: "{{service_list}}",    desc: "Lista de serviços com valores" },
  { key: "{{today}}",           desc: "Data atual por extenso" },
];

export default function ContractTemplateEditor() {
  const [content, setContent] = useState("");
  const [name, setName]       = useState("Padrão");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [showVars, setShowVars] = useState(false);

  useEffect(() => {
    fetch("/api/contract-template")
      .then(r => r.json())
      .then(d => {
        setContent(d.content ?? "");
        setName(d.name ?? "Padrão");
        setLoading(false);
      });
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/contract-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, name }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function insertVar(v: string) {
    const textarea = document.getElementById("contract-template-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end   = textarea.selectionEnd;
    const newContent = content.slice(0, start) + v + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + v.length;
      textarea.focus();
    }, 0);
  }

  if (loading) return (
    <p style={{ fontSize: "13px", color: "#777068", textAlign: "center", marginTop: "48px" }}>
      Carregando template...
    </p>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "16px", alignItems: "flex-start" }}
      className="template-grid">
      <style>{`@media (max-width: 900px) { .template-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Editor */}
      <div style={{ background: "#111111", border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input value={name} onChange={e => setName(e.target.value)}
              style={{ background: "transparent", border: "none", color: "#F0EDE8", fontSize: "14px", fontWeight: "600", fontFamily: "inherit", outline: "none", width: "180px" }} />
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowVars(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", padding: "6px 12px", borderRadius: "5px", border: `1px solid ${BORDER}`, background: showVars ? "rgba(0,207,255,0.08)" : "transparent", color: showVars ? ACCENT : "#9A9288", cursor: "pointer", fontFamily: "inherit" }}>
              <Info size={12} />
              Variáveis
            </button>
            <button onClick={save} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "600", padding: "6px 14px", borderRadius: "5px", border: "none", background: saved ? "#4CAF50" : ACCENT, color: "#080808", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
              <Save size={12} strokeWidth={2.5} />
              {saved ? "Salvo!" : saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        {/* Variables quick-insert (when open) */}
        {showVars && (
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {VARS.map(v => (
              <button key={v.key} onClick={() => insertVar(v.key)} title={v.desc}
                style={{ fontSize: "10px", fontFamily: "monospace", padding: "3px 8px", borderRadius: "4px", border: `1px solid rgba(0,207,255,0.25)`, background: "rgba(0,207,255,0.06)", color: ACCENT, cursor: "pointer" }}>
                {v.key}
              </button>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          id="contract-template-textarea"
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{
            width: "100%",
            minHeight: "600px",
            background: "transparent",
            border: "none",
            color: "#F0EDE8",
            fontSize: "13px",
            fontFamily: "monospace",
            lineHeight: "1.7",
            padding: "20px",
            outline: "none",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Variables reference */}
      <div style={{ background: "#111111", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "20px", position: "sticky", top: "20px" }}>
        <p style={{ fontSize: "10px", fontWeight: "600", color: "#777068", margin: "0 0 16px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
          Variáveis disponíveis
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {VARS.map(v => (
            <div key={v.key}>
              <button onClick={() => insertVar(v.key)}
                style={{ display: "block", fontFamily: "monospace", fontSize: "11px", color: ACCENT, background: "rgba(0,207,255,0.06)", border: `1px solid rgba(0,207,255,0.15)`, borderRadius: "4px", padding: "3px 8px", cursor: "pointer", marginBottom: "3px", textAlign: "left" }}>
                {v.key}
              </button>
              <p style={{ fontSize: "11px", color: "#777068", margin: 0, fontWeight: "300" }}>{v.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "24px", padding: "14px", background: "#0D0D0D", borderRadius: "8px", border: `1px solid ${BORDER}` }}>
          <p style={{ fontSize: "10px", fontWeight: "600", color: "#777068", margin: "0 0 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Formatação</p>
          <p style={{ fontSize: "11px", color: "#777068", margin: "0 0 6px", lineHeight: 1.6 }}>
            Linhas com <code style={{ color: "#F0EDE8", background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: "3px" }}>─────</code> viram divisórias
          </p>
          <p style={{ fontSize: "11px", color: "#777068", margin: "0 0 6px", lineHeight: 1.6 }}>
            Linhas em MAIÚSCULAS viram títulos em negrito
          </p>
          <p style={{ fontSize: "11px", color: "#777068", margin: 0, lineHeight: 1.6 }}>
            Linhas com <code style={{ color: "#F0EDE8", background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: "3px" }}>__________</code> viram linhas de assinatura
          </p>
        </div>
      </div>
    </div>
  );
}
