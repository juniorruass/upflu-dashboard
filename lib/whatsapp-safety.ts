// Regras de proteção anti-ban para disparos WhatsApp

export type SafetyConfig = {
  min_delay_seconds: number;   // delay mínimo entre mensagens
  max_delay_seconds: number;   // delay máximo entre mensagens
  session_max: number;         // máximo de msgs antes de descanso
  session_break_minutes: number; // minutos de descanso entre sessões
  start_hour: number;          // hora de início (Brasília)
  end_hour: number;            // hora de fim (Brasília)
  active_days: number[];       // dias ativos (0=Dom, 1=Seg..6=Sáb)
};

export const SAFETY_DEFAULTS: SafetyConfig = {
  min_delay_seconds: 45,
  max_delay_seconds: 120,
  session_max: 20,
  session_break_minutes: 30,
  start_hour: 8,
  end_hour: 18,
  active_days: [1, 2, 3, 4, 5], // Seg–Sex
};

export const SAFETY_PRESETS = {
  conservador: {
    label: "Conservador (recomendado para número novo)",
    min_delay_seconds: 90,
    max_delay_seconds: 180,
    session_max: 10,
    session_break_minutes: 60,
    start_hour: 9,
    end_hour: 17,
    active_days: [2, 3, 4], // Ter, Qua, Qui
  },
  moderado: {
    label: "Moderado (número com 1–2 semanas de uso)",
    min_delay_seconds: 45,
    max_delay_seconds: 120,
    session_max: 20,
    session_break_minutes: 30,
    start_hour: 8,
    end_hour: 18,
    active_days: [1, 2, 3, 4, 5],
  },
  agressivo: {
    label: "Agressivo (número aquecido, use com cuidado)",
    min_delay_seconds: 25,
    max_delay_seconds: 70,
    session_max: 30,
    session_break_minutes: 20,
    start_hour: 8,
    end_hour: 20,
    active_days: [1, 2, 3, 4, 5, 6],
  },
};

export function horarioPermitido(config: SafetyConfig): { ok: boolean; motivo?: string } {
  const agora = new Date();
  const horaBR = (agora.getUTCHours() - 3 + 24) % 24;
  const diaSemana = agora.getUTCDay(); // 0=Dom

  if (!config.active_days.includes(diaSemana)) {
    const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return { ok: false, motivo: `Dia inativo (${DIAS[diaSemana]}). Dias ativos: ${config.active_days.map((d) => DIAS[d]).join(", ")}` };
  }

  if (horaBR < config.start_hour || horaBR >= config.end_hour) {
    return { ok: false, motivo: `Fora do horário (${String(config.start_hour).padStart(2,"0")}h–${String(config.end_hour).padStart(2,"0")}h). Agora: ${String(horaBR).padStart(2,"0")}h` };
  }

  return { ok: true };
}

export function delayAleatorio(min: number, max: number): number {
  return (Math.random() * (max - min) + min) * 1000;
}
