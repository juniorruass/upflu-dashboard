export function gerarSlots(horaInicio: string, horaFim: string, duracaoMinutos: number): string[] {
  const slots: string[] = [];
  const [hI, mI] = horaInicio.split(":").map(Number);
  const [hF, mF] = horaFim.split(":").map(Number);
  let minutos = hI * 60 + mI;
  const fimMinutos = hF * 60 + mF;
  while (minutos + duracaoMinutos <= fimMinutos) {
    const h = Math.floor(minutos / 60).toString().padStart(2, "0");
    const m = (minutos % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    minutos += duracaoMinutos;
  }
  return slots;
}

export function diaSemanaParaNome(dia: number): string {
  return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][dia] ?? "";
}

export function formatarData(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataCompleta(dataISO: string): string {
  const d = new Date(dataISO + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  cancelado: "Cancelado",
  concluido: "Concluído",
  no_show: "Não compareceu",
};

export const STATUS_COLORS: Record<string, string> = {
  pendente: "#F59E0B",
  confirmado: "#10B981",
  cancelado: "#EF4444",
  concluido: "#6B7280",
  no_show: "#8B5CF6",
};
