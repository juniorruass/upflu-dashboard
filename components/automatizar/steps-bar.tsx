"use client";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step { label: string; icon: LucideIcon }

export default function StepsBar({ steps, current, done }: {
  steps: Step[]; current: number; done: number[];
}) {
  return (
    <div className="flex items-start mb-8">
      {steps.map((step, i) => {
        const n     = i + 1;
        const active = n === current;
        const isDone = done.includes(n);
        const Icon  = step.icon;

        return (
          <div key={n} className="flex-1 flex flex-col items-center relative">
            {/* connector */}
            {i < steps.length - 1 && (
              <div className={`absolute top-[18px] left-1/2 w-full h-px transition-colors duration-300 ${isDone ? "bg-[#4ADE80]/50" : "bg-white/[0.07]"}`} />
            )}

            {/* circle */}
            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold border transition-all duration-300
              ${isDone  ? "bg-[#4ADE80]/10 border-[#4ADE80] text-[#4ADE80]"
              : active  ? "bg-[#00CFFF]/10 border-[#00CFFF] text-[#00CFFF]"
              :            "bg-[#0d0d0d] border-white/10 text-[#444]"}`}>
              {isDone ? <Check size={15} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={active ? 2 : 1.5} />}
            </div>

            {/* label */}
            <span className={`mt-2 text-[10px] font-semibold tracking-[0.12em] uppercase text-center leading-tight transition-colors duration-300
              ${isDone ? "text-[#4ADE80]" : active ? "text-[#00CFFF]" : "text-[#444]"}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
