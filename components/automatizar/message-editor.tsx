"use client";
import { useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  variables: string[];
  previewData: Record<string, string>;
}

export default function MessageEditor({ value, onChange, variables, previewData }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function insertVar(v: string) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end   = el.selectionEnd   ?? value.length;
    const next  = value.slice(0, start) + v + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + v.length, start + v.length);
    });
  }

  const preview = value
    ? value.replace(/\{(\w+)\}/g, (_, k) => previewData[k] ?? `{${k}}`)
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Variáveis */}
      <div className="flex flex-wrap gap-2">
        {variables.map((v) => (
          <button key={v} type="button" onClick={() => insertVar(v)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide border border-[#00CFFF]/25 bg-[#00CFFF]/06 text-[#00CFFF] hover:bg-[#00CFFF]/12 hover:border-[#00CFFF]/40 transition-all cursor-pointer select-none">
            {v}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Escreva a mensagem. Clique nas variáveis acima para inserir."
        className="w-full bg-[#0d0d0d] border border-white/[0.07] rounded-xl px-4 py-3 text-[13px] text-[#F0EDE8] placeholder-[#444] resize-y outline-none focus:border-[#00CFFF]/40 transition-colors font-sans leading-relaxed"
      />

      {/* Preview */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
        <p className="text-[10px] font-semibold text-[#555] tracking-[0.12em] uppercase mb-2">Pré-visualização</p>
        {preview ? (
          <p className="text-[13px] text-[#AAA] leading-relaxed whitespace-pre-wrap">{preview}</p>
        ) : (
          <p className="text-[12px] text-[#444] italic">Digite a mensagem acima para ver a pré-visualização.</p>
        )}
      </div>
    </div>
  );
}
