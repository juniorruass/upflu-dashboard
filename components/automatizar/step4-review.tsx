"use client";
import { CheckCircle2, MapPin, Building2, MessageSquare, Clock, Save, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Step1Data } from "./step1-alvo";
import type { ScheduleData } from "./schedule-config";

const DIAS_LABEL: Record<number, string> = { 0:"Dom", 1:"Seg", 2:"Ter", 3:"Qua", 4:"Qui", 5:"Sex", 6:"Sáb" };

interface Props {
  step1: Step1Data;
  automacaoName: string;
  messages: string[];
  schedule: ScheduleData;
  saving: boolean;
  onSalvar: () => void;
  onCriar: () => void;
}

export default function Step4Review({ step1, automacaoName, messages, schedule, saving, onSalvar, onCriar }: Props) {
  const isGoogle = step1.source === "google";

  return (
    <div className="flex flex-col gap-5">
      {/* Banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#4ADE80]/06 border border-[#4ADE80]/20">
        <CheckCircle2 size={20} className="text-[#4ADE80] shrink-0" />
        <div>
          <p className="text-[14px] font-semibold text-[#4ADE80]">{automacaoName || "Nova automação"}</p>
          <p className="text-[12px] text-[#4ADE80]/60">Revise os dados antes de criar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Alvo */}
        <Block icon={isGoogle ? MapPin : Building2} color="#00CFFF" title="Alvo">
          {isGoogle ? (
            <>
              <Row label="Segmento" value={step1.searchTerm || "—"} />
              <Row label="Cidades" value={step1.cities.join(", ") || "—"} />
            </>
          ) : (
            <>
              <Row label="CNAE" value={`${step1.cnaeLabel} (${step1.cnae})`} />
              <Row label="Cidade" value={`${step1.municipio}, ${step1.uf}`} />
            </>
          )}
          <Row label="Limite diário" value={`${step1.dailyLimit} contatos`} />
        </Block>

        {/* Mensagem */}
        <Block icon={MessageSquare} color="#A78BFA" title="Mensagem">
          <Row label="Nome" value={automacaoName || "—"} />
          <Row label="Variações" value={`${messages.filter(m => m.trim()).length} mensagem${messages.filter(m => m.trim()).length !== 1 ? "s" : ""}`} />
          <div>
            <p className="text-[10px] font-semibold text-[#555] tracking-wide uppercase mb-1">Variação 1</p>
            <p className="text-[12px] text-[#AAA] bg-[#0d0d0d] rounded-lg px-3 py-2 border border-white/[0.05] leading-relaxed line-clamp-3">
              {messages[0] || "—"}
            </p>
          </div>
        </Block>

        {/* Agendamento */}
        <Block icon={Clock} color="#F0B429" title="Agendamento">
          <Row label="Horário" value={`${String(schedule.startHour).padStart(2,"0")}h – ${String(schedule.endHour).padStart(2,"0")}h`} />
          <Row label="Dias" value={schedule.activeDays.map((d) => DIAS_LABEL[d]).join(", ")} />
          <Row label="Delay" value={`${schedule.minDelay}s – ${schedule.maxDelay}s`} />
          <Row label="Sessão" value={`${schedule.sessionMax} msgs · pausa ${schedule.sessionBreak}min`} />
        </Block>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onSalvar} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.07] text-[#888] text-[13px] font-semibold hover:border-white/20 hover:text-[#F0EDE8] transition-all disabled:opacity-50">
          <Save size={15} />
          Salvar rascunho
        </button>
        <button type="button" onClick={onCriar} disabled={saving}
          className="flex-2 flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#00CFFF] text-black text-[13px] font-bold hover:bg-[#00CFFF]/90 transition-all disabled:opacity-50 min-w-[160px]">
          <Zap size={15} />
          Criar automação
        </button>
      </div>
    </div>
  );
}

function Block({ icon: Icon, color, title, children }: { icon: LucideIcon; color: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-white/[0.07] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} className="shrink-0" color={color} />
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color }}>{title}</p>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[11px] text-[#555] shrink-0">{label}</span>
      <span className="text-[12px] text-[#F0EDE8] text-right">{value}</span>
    </div>
  );
}
