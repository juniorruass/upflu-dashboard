type Prospect = {
  telefone?: string | null;
  cnpj?: string | null;
  situacao_cadastral?: string | null;
  status?: string | null;
  anotacoes?: string | null;
  email?: string | null;
  followup_enviado?: boolean | null;
  cidade?: string | null;
};

export function calcScore(p: Prospect): number {
  let score = 0;
  if (p.telefone)                                 score += 10; // tem telefone
  if (p.email)                                    score += 10; // tem email
  if (p.cnpj)                                     score += 10; // tem CNPJ
  if (p.situacao_cadastral === "ATIVA")           score += 10; // CNPJ ativo
  if (p.anotacoes)                                score += 10; // tem anotações
  if (p.followup_enviado)                         score += 10; // recebeu follow-up
  if (p.status === "followup")                    score += 10;
  if (p.status === "respondeu")                   score += 30; // respondeu = alta intenção
  if (p.status === "reuniao" || p.status === "proposta") score += 40;
  if (p.status === "fechado")                     score += 60;
  return Math.min(score, 100);
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Quente",  color: "#22c55e" };
  if (score >= 40) return { label: "Morno",   color: "#FF9500" };
  if (score >= 20) return { label: "Frio",    color: "#00CFFF" };
  return            { label: "Novo",    color: "#555"    };
}
