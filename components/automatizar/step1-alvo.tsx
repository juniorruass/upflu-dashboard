"use client";
import { useState } from "react";
import { X, Loader2, MapPin, Building2 } from "lucide-react";

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

const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export interface Step1Data {
  source: "google" | "cnae";
  searchTerm: string;
  cities: string[];
  cnae: string;
  cnaeLabel: string;
  municipio: string;
  uf: string;
  dailyLimit: number;
}

const DEFAULT: Step1Data = {
  source: "google", searchTerm: "", cities: [],
  cnae: "8630504", cnaeLabel: "Odontologia",
  municipio: "", uf: "SP", dailyLimit: 30,
};

type SimStats = { empresas: number; telefones: number; emails: number; municipios: number } | null;

export default function Step1Alvo({ value, onChange }: {
  value: Step1Data; onChange: (d: Step1Data) => void;
}) {
  const [cityInput, setCityInput] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simStats, setSimStats]     = useState<SimStats>(null);
  const [simErr, setSimErr]         = useState("");

  function upd(patch: Partial<Step1Data>) { onChange({ ...value, ...patch }); }

  function addCity() {
    const c = cityInput.trim();
    if (!c || value.cities.includes(c)) return;
    upd({ cities: [...value.cities, c] });
    setCityInput("");
  }

  async function simular() {
    setSimLoading(true); setSimStats(null); setSimErr("");
    try {
      const params = new URLSearchParams({
        source: value.source,
        ...(value.source === "google"
          ? { searchTerm: value.searchTerm, city: value.cities[0] ?? "" }
          : { cnae: value.cnae, municipio: value.municipio, uf: value.uf }),
      });
      const r = await fetch(`/api/automatizar/simular?${params}`);
      const d = await r.json();
      if (!r.ok) { setSimErr(d.error ?? "Erro na simulação."); }
      else setSimStats(d);
    } catch { setSimErr("Não foi possível simular. Verifique os campos."); }
    setSimLoading(false);
  }

  const field = "w-full bg-[#0d0d0d] border border-white/[0.07] rounded-xl px-4 py-2.5 text-[13px] text-[#F0EDE8] placeholder-[#444] outline-none focus:border-[#00CFFF]/40 transition-colors";

  return (
    <div className="flex flex-col gap-5">
      {/* Source tabs */}
      <div className="grid grid-cols-2 gap-3">
        {(["google","cnae"] as const).map((s) => {
          const active = value.source === s;
          const Icon   = s === "google" ? MapPin : Building2;
          return (
            <button key={s} type="button" onClick={() => upd({ source: s })}
              className={`flex items-center justify-center gap-2.5 p-4 rounded-xl border font-semibold text-[13px] transition-all
                ${active
                  ? s === "google"
                    ? "bg-[#00CFFF]/08 border-[#00CFFF]/40 text-[#00CFFF]"
                    : "bg-[#E1306C]/06 border-[#E1306C]/30 text-[#E1306C]"
                  : "bg-transparent border-white/[0.07] text-[#555] hover:border-white/20"}`}>
              <Icon size={16} strokeWidth={active ? 2 : 1.5} />
              {s === "google" ? "Google Maps (nacional)" : "CNAE · Receita Federal"}
            </button>
          );
        })}
      </div>

      {/* Google Maps fields */}
      {value.source === "google" && (
        <div className="rounded-xl border border-[#00CFFF]/12 bg-[#00CFFF]/03 p-5 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#00CFFF]/70 tracking-[0.1em] uppercase mb-2">Segmento / Termo de busca</label>
            <input className={field} placeholder='Ex: "clínica estética", "advogado", "academia"'
              value={value.searchTerm} onChange={(e) => upd({ searchTerm: e.target.value })} />
            <p className="text-[11px] text-[#555] mt-1.5">Buscado como &quot;{`{termo} em {cidade}`}&quot; no Google Maps</p>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#00CFFF]/70 tracking-[0.1em] uppercase mb-2">Cidades alvo</label>
            <div className="flex gap-2 mb-2">
              <input className={field + " flex-1"} placeholder='"São Paulo, SP"'
                value={cityInput} onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())} />
              <button type="button" onClick={addCity}
                className="px-4 rounded-xl bg-[#00CFFF]/10 border border-[#00CFFF]/25 text-[#00CFFF] text-[12px] font-semibold hover:bg-[#00CFFF]/18 transition-all whitespace-nowrap">
                + Adicionar
              </button>
            </div>
            {value.cities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {value.cities.map((c) => (
                  <span key={c} className="flex items-center gap-1.5 bg-[#00CFFF]/08 border border-[#00CFFF]/20 text-[#00CFFF] text-[12px] px-3 py-1 rounded-lg">
                    {c}
                    <button type="button" onClick={() => upd({ cities: value.cities.filter((x) => x !== c) })} className="text-[#00CFFF]/60 hover:text-[#00CFFF]"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CNAE fields */}
      {value.source === "cnae" && (
        <div className="rounded-xl border border-[#E1306C]/12 bg-[#E1306C]/02 p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#E1306C]/70 tracking-[0.1em] uppercase mb-2">Segmento</label>
              <select className={field + " cursor-pointer"} value={value.cnae}
                onChange={(e) => { const c = CNAE_LISTA.find((x) => x.codigo === e.target.value); upd({ cnae: e.target.value, cnaeLabel: c?.label ?? "" }); }}>
                {CNAE_LISTA.map((c) => <option key={c.codigo} value={c.codigo}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#E1306C]/70 tracking-[0.1em] uppercase mb-2">Estado (UF)</label>
              <select className={field + " cursor-pointer"} value={value.uf} onChange={(e) => upd({ uf: e.target.value })}>
                {UF_LIST.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#E1306C]/70 tracking-[0.1em] uppercase mb-2">Cidade</label>
            <input className={field} placeholder="Ex: Vitória" value={value.municipio} onChange={(e) => upd({ municipio: e.target.value })} />
          </div>
        </div>
      )}

      {/* Limite diário */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-[#777068] tracking-[0.1em] uppercase mb-2">Limite diário de contatos</label>
          <input type="number" min={1} max={200} className={field}
            value={value.dailyLimit} onChange={(e) => upd({ dailyLimit: +e.target.value })} />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] font-semibold text-[#777068] tracking-[0.1em] uppercase mb-2">&nbsp;</label>
          <button type="button" onClick={simular} disabled={simLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#00CFFF]/30 bg-[#00CFFF]/07 text-[#00CFFF] text-[13px] font-semibold hover:bg-[#00CFFF]/14 transition-all disabled:opacity-60">
            {simLoading ? <Loader2 size={14} className="animate-spin" /> : null}
            {simLoading ? "Simulando..." : "Simular busca"}
          </button>
        </div>
      </div>

      {/* Sim error */}
      {simErr && <p className="text-[12px] text-[#FF6B6B] bg-[#FF6B6B]/06 border border-[#FF6B6B]/20 rounded-xl px-4 py-3">{simErr}</p>}

      {/* Sim stats */}
      {simStats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Empresas",   value: simStats.empresas,  color: "#00CFFF" },
            { label: "Telefones",  value: simStats.telefones, color: "#4ADE80" },
            { label: "E-mails",    value: simStats.emails,    color: "#F0B429" },
            { label: "Municípios", value: simStats.municipios,color: "#A78BFA" },
          ].map((s) => (
            <div key={s.label} className="bg-[#111] border border-white/[0.07] rounded-xl p-4 text-center">
              <p className="text-[24px] font-bold leading-none mb-1" style={{ color: s.color }}>{s.value.toLocaleString("pt-BR")}</p>
              <p className="text-[11px] text-[#555] font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
