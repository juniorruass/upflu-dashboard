"use client";
import MessageEditor from "./message-editor";

export interface Step2Data {
  name: string;
  message: string;
}

const VARIABLES = ["{nome_empresa}", "{cidade}", "{ramo}", "{telefone}"];
const PREVIEW_DATA: Record<string, string> = {
  nome_empresa: "Academia FitLife",
  cidade: "São Paulo",
  ramo: "Academia / Fitness",
  telefone: "(11) 99999-0000",
};

export default function Step2Message({
  value,
  onChange,
}: {
  value: Step2Data;
  onChange: (d: Step2Data) => void;
}) {
  const field =
    "w-full bg-[#0d0d0d] border border-white/[0.07] rounded-xl px-4 py-2.5 text-[13px] text-[#F0EDE8] placeholder-[#444] outline-none focus:border-[#00CFFF]/40 transition-colors";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-[11px] font-semibold text-[#777068] tracking-[0.1em] uppercase mb-2">
          Nome da automação
        </label>
        <input
          className={field}
          placeholder="Ex: Clínicas SP — Captação junho"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
        <p className="text-[11px] text-[#555] mt-1.5">
          Identificador interno — não aparece para o lead
        </p>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#777068] tracking-[0.1em] uppercase mb-3">
          Mensagem do 1º contato
        </label>
        <MessageEditor
          value={value.message}
          onChange={(msg) => onChange({ ...value, message: msg })}
          variables={VARIABLES}
          previewData={PREVIEW_DATA}
        />
      </div>
    </div>
  );
}
