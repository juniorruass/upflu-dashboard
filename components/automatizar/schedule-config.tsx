"use client";
import { useState, useEffect } from "react";
import { Info } from "lucide-react";

const DIAS = [
  { v: 1, l: "Seg" }, { v: 2, l: "Ter" }, { v: 3, l: "Qua" },
  { v: 4, l: "Qui" }, { v: 5, l: "Sex" }, { v: 6, l: "Sáb" }, { v: 0, l: "Dom" },
];

const PRESETS = [
  { key: "conservador", label: "Conservador", min: 90, max: 180, session: 10, brk: 60, days: [1,2,3] },
  { key: "moderado",    label: "Moderado",    min: 45, max: 120, session: 20, brk: 30, days: [1,2,3,4,5] },
  { key: "agressivo",  label: "Agressivo",   min: 25, max: 70,  session: 30, brk: 20, days: [1,2,3,4,5,6] },
];

export interface ScheduleData {
  minDelay: number; maxDelay: number;
  sessionMax: number; sessionBreak: number;
  startHour: number; endHour: number;
  activeDays: number[]; dailyLimit: number;
}

const DEFAULT: ScheduleData = {
  minDelay: 45, maxDelay: 120, sessionMax: 20, sessionBreak: 30,
  startHour: 9, endHour: 18, activeDays: [1,2,3,4,5], dailyLimit: 30,
};

export default function ScheduleConfig({ onChange, initial }: {
  onChange: (d: ScheduleData) => void;
  initial?: Partial<ScheduleData>;
}) {
  const [d, setD] = useState<ScheduleData>({ ...DEFAULT, ...initial });
  const [tip, setTip] = useState(false);

  function upd(patch: Partial<ScheduleData>) {
    const next = { ...d, ...patch };
    setD(next);
    onChange(next);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onChange(d); }, []);

  const HOURS = Array.from({ length: 24 }, (_, i) => i);
  const field = "w-full bg-[#0d0d0d] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[13px] text-[#F0EDE8] outline-none focus:border-[#00CFFF]/40 transition-colors";

  return (
    <div className="flex flex-col gap-6">
      {/* Presets */}
      <div>
        <p className="text-[10px] font-semibold text-[#555] tracking-[0.12em] uppercase mb-3">🛡️ Preset anti-ban</p>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((p) => (
            <button key={p.key} type="button"
              onClick={() => upd({ minDelay: p.min, maxDelay: p.max, sessionMax: p.session, sessionBreak: p.brk, activeDays: p.days })}
              className="p-3 rounded-xl border border-[#F0B429]/20 bg-[#F0B429]/04 text-[#F0B429] hover:bg-[#F0B429]/10 transition-all text-[12px] font-semibold text-left">
              {p.label}
              <span className="block text-[10px] font-normal text-[#F0B429]/60 mt-0.5">
                {p.min}–{p.max}s · {p.session} msgs/sessão
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Delay + limite */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-semibold text-[#777068] tracking-wide uppercase">Delay mín. (seg)</label>
            <div className="relative" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
              <Info size={12} className="text-[#555] cursor-help" />
              {tip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-[11px] text-[#AAA] z-20 leading-relaxed">
                  Mínimo recomendado: 30s entre mensagens
                </div>
              )}
            </div>
          </div>
          <input type="number" min={10} max={300} value={d.minDelay} onChange={(e) => upd({ minDelay: +e.target.value })} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-[#777068] tracking-wide uppercase">Delay máx. (seg)</label>
          <input type="number" min={10} max={600} value={d.maxDelay} onChange={(e) => upd({ maxDelay: +e.target.value })} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-[#777068] tracking-wide uppercase">Msgs por sessão</label>
          <input type="number" min={1} max={100} value={d.sessionMax} onChange={(e) => upd({ sessionMax: +e.target.value })} className={field} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-[#777068] tracking-wide uppercase">Descanso (min)</label>
          <input type="number" min={5} max={120} value={d.sessionBreak} onChange={(e) => upd({ sessionBreak: +e.target.value })} className={field} />
        </div>
      </div>

      {/* Horário + limite diário */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-[#777068] tracking-wide uppercase">Início</label>
          <select value={d.startHour} onChange={(e) => upd({ startHour: +e.target.value })} className={field + " cursor-pointer"}>
            {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2,"0")}:00h</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-[#777068] tracking-wide uppercase">Encerramento</label>
          <select value={d.endHour} onChange={(e) => upd({ endHour: +e.target.value })} className={field + " cursor-pointer"}>
            {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2,"0")}:00h</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-[#777068] tracking-wide uppercase">Limite diário</label>
          <input type="number" min={1} max={200} value={d.dailyLimit} onChange={(e) => upd({ dailyLimit: +e.target.value })} className={field} />
        </div>
      </div>

      {/* Dias */}
      <div>
        <p className="text-[11px] font-semibold text-[#777068] tracking-wide uppercase mb-3">Dias ativos</p>
        <div className="flex gap-2">
          {DIAS.map((dia) => {
            const on = d.activeDays.includes(dia.v);
            return (
              <button key={dia.v} type="button"
                onClick={() => upd({ activeDays: on ? d.activeDays.filter((x) => x !== dia.v) : [...d.activeDays, dia.v].sort() })}
                className={`flex-1 py-2 rounded-lg text-[12px] font-semibold border transition-all
                  ${on ? "bg-[#00CFFF]/10 border-[#00CFFF]/40 text-[#00CFFF]" : "bg-transparent border-white/[0.07] text-[#444] hover:border-white/20"}`}>
                {dia.l}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
