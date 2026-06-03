// Avalia o perfil digital de um prospect no Google Maps
// e gera uma mensagem personalizada baseada nos pontos fracos encontrados

export type Evaluation = {
  score: number;           // 0–100 (quanto pior o digital, maior o score de oportunidade)
  problems: string[];      // pontos fracos encontrados
  angle: "reputacao" | "visibilidade" | "presenca" | "crescimento";
};

export function avaliarProspect(data: {
  rating: number | null;
  reviews: number;
  website: string;
  tipo: string;
}): Evaluation {
  const { rating, reviews, website } = data;
  const problems: string[] = [];
  let score = 0;

  // Sem site
  if (!website) {
    problems.push("sem_site");
    score += 35;
  }

  // Nota baixa
  if (rating != null && rating < 3.8) {
    problems.push("nota_baixa");
    score += 40;
  } else if (rating != null && rating < 4.2) {
    problems.push("nota_media");
    score += 20;
  }

  // Poucas avaliações
  if (reviews < 10) {
    problems.push("quase_sem_avaliacoes");
    score += 30;
  } else if (reviews < 40) {
    problems.push("poucas_avaliacoes");
    score += 15;
  }

  // Define o ângulo principal da abordagem
  let angle: Evaluation["angle"] = "crescimento";
  if (problems.includes("nota_baixa")) angle = "reputacao";
  else if (problems.includes("sem_site")) angle = "presenca";
  else if (problems.includes("quase_sem_avaliacoes") || problems.includes("poucas_avaliacoes")) angle = "visibilidade";

  return { score: Math.min(score, 100), problems, angle };
}

export function gerarMensagemAvaliacao(
  nome: string,
  cidade: string,
  tipo: string,
  rating: number | null,
  reviews: number,
  website: string,
  evaluation: Evaluation
): string {
  const nomeFormatado = nome.length > 40 ? nome.substring(0, 40).trim() + "..." : nome;
  const tipoLabel = tipo.toLowerCase();

  let diagnostico = "";

  // Ângulo: reputação (nota baixa)
  if (evaluation.angle === "reputacao") {
    const nota = rating?.toFixed(1) ?? "baixa";
    diagnostico = `Fiz uma análise rápida do perfil da *${nomeFormatado}* no Google e vi que a nota está em *${nota}★* com ${reviews} avaliações.\n\nIsso pode estar afastando clientes antes mesmo de você saber que eles existiam — a maioria pesquisa no Google antes de escolher um ${tipoLabel} em ${cidade}.`;
  }

  // Ângulo: presença (sem site)
  else if (evaluation.angle === "presenca") {
    const notaStr = rating ? ` Tem nota ${rating.toFixed(1)}★` : "";
    diagnostico = `Vi o perfil da *${nomeFormatado}* no Google.${notaStr} com ${reviews} avaliações — mas sem site, o negócio perde visibilidade e credibilidade antes do cliente entrar em contato.\n\nEm ${cidade}, quem pesquisa "${tipoLabel}" no Google dificilmente escolhe quem não tem presença completa.`;
  }

  // Ângulo: visibilidade (poucas avaliações)
  else if (evaluation.angle === "visibilidade") {
    const nota = rating ? `${rating.toFixed(1)}★` : "boa nota";
    diagnostico = `A *${nomeFormatado}* tem ${nota} no Google, mas só ${reviews} avaliações — o que coloca vocês invisíveis para quem pesquisa ${tipoLabel} em ${cidade}.\n\nNegócios com menos de 50 avaliações aparecem muito abaixo nos resultados, independente da qualidade do serviço.`;
  }

  // Ângulo: crescimento (geral)
  else {
    diagnostico = `Analisei o perfil digital da *${nomeFormatado}* e identifiquei oportunidades claras de crescimento em ${cidade} — tanto em visibilidade no Google quanto em captação de novos clientes.`;
  }

  const fechamento = `Trabalho com crescimento digital para empresas como a de vocês e tenho resultados concretos nesse segmento.\n\nPostaria fazer um diagnóstico gratuito de 2 minutos sem compromisso?\n\n*Upflu | upflu.digital*`;

  return `Olá! ${diagnostico}\n\n${fechamento}`;
}
