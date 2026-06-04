"use client";
import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";

export interface Step2Data {
  name: string;
  messages: string[];
}

const VARIABLES = ["{nome_empresa}", "{cidade}", "{ramo}", "{telefone}"];
const PREVIEW_DATA: Record<string, string> = {
  nome_empresa: "Academia FitLife",
  cidade: "São Paulo",
  ramo: "Academia / Fitness",
  telefone: "(11) 99999-0000",
};

function renderPreview(msg: string): string {
  return msg.replace(/\{(\w+)\}/g, (_, k) => PREVIEW_DATA[k] ?? `{${k}}`);
}

export default function Step2Message({
  value,
  onChange,
}: {
  value: Step2Data;
  onChange: (d: Step2Data) => void;
}) {
  const refs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const [activePreview, setActivePreview] = useState(0);

  const textarea =
    "w-full bg-[#0d0d0d] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-[#F0EDE8] placeholder-[#444] resize-y outline-none focus:border-[#00CFFF]/40 transition-colors font-sans leading-relaxed";

  function insertVar(v: string, idx: number) {
    const el = refs.current[idx];
    if (!el) return;
    const start = el.selectionStart ?? value.messages[idx].length;
    const end   = el.selectionEnd   ?? value.messages[idx].length;
    const msgs  = [...value.messages];
    msgs[idx]   = msgs[idx].slice(0, start) + v + msgs[idx].slice(end);
    onChange({ ...value, messages: msgs });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    });
  }

  function updateMsg(idx: number, text: string) {
    const msgs = [...value.messages];
    msgs[idx]  = text;
    onChange({ ...value, messages: msgs });
  }

  function addVariation() {
    if (value.messages.length >= 5) return;
    onChange({ ...value, messages: [...value.messages, ""] });
  }

  function removeVariation(idx: number) {
    if (value.messages.length <= 1) return;
    const msgs = value.messages.filter((_, i) => i !== idx);
    onChange({ ...value, messages: msgs });
    setActivePreview(0);
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Nome */}
      <div>
        <label className="block text-[11px] font-semibold text-[#777068] tracking-[0.1em] uppercase mb-2">
          Nome da automação
        </label>
        <input
          className="w-full bg-[#0d0d0d] border border-white/[0.07] rounded-xl px-4 py-2.5 text-[13px] text-[#F0EDE8] placeholder-[#444] outline-none focus:border-[#00CFFF]/40 transition-colors"
          placeholder="Ex: Clínicas SP — Captação junho"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
        <p className="text-[11px] text-[#555] mt-1.5">
          Identificador interno — não aparece para o lead
        </p>
      </div>

      {/* Header variações */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-[11px] font-semibold text-[#777068] tracking-[0.1em] uppercase">
            Variações de mensagem
          </label>
          <p className="text-[11px] text-[#555] mt-0.5">
            O sistema alterna aleatoriamente — reduz risco de bloqueio
          </p>
        </div>
        {value.messages.length < 5 && (
          <button type="button" onClick={addVariation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00CFFF]/25 bg-[#00CFFF]/06 text-[#00CFFF] text-[12px] font-semibold hover:bg-[#00CFFF]/12 transition-all shrink-0">
            <Plus size={12} /> Adicionar variação
          </button>
        )}
      </div>

      {/* Lista de variações */}
      <div className="flex flex-col gap-4">
        {value.messages.map((msg, idx) => (
          <div key={idx} className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-[#555] tracking-[0.12em] uppercase">
                Variação {idx + 1}
              </span>
              {value.messages.length > 1 && (
                <button type="button" onClick={() => removeVariation(idx)}
                  className="text-[#444] hover:text-[#FF6B6B] transition-colors p-0.5">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Variáveis */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {VARIABLES.map((v) => (
                <button key={v} type="button" onClick={() => insertVar(v, idx)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#00CFFF]/25 bg-[#00CFFF]/06 text-[#00CFFF] hover:bg-[#00CFFF]/12 hover:border-[#00CFFF]/40 transition-all cursor-pointer select-none">
                  {v}
                </button>
              ))}
            </div>

            <textarea
              ref={(el) => { refs.current[idx] = el; }}
              value={msg}
              onChange={(e) => updateMsg(idx, e.target.value)}
              rows={4}
              placeholder="Escreva a mensagem. Clique nas variáveis acima para inserir."
              className={textarea}
              onFocus={() => setActivePreview(idx)}
            />
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
        <p className="text-[10px] font-semibold text-[#555] tracking-[0.12em] uppercase mb-2">
          Pré-visualização — Variação {activePreview + 1}
        </p>
        {value.messages[activePreview]?.trim() ? (
          <p className="text-[13px] text-[#AAA] leading-relaxed whitespace-pre-wrap">
            {renderPreview(value.messages[activePreview])}
          </p>
        ) : (
          <p className="text-[12px] text-[#444] italic">
            Digite a mensagem acima para ver a pré-visualização.
          </p>
        )}
      </div>
    </div>
  );
}
