export const UPFLU_TOPICS = [
  "Por que sua empresa precisa de um assistente IA no WhatsApp",
  "5 processos que você pode automatizar ainda esse mês",
  "A diferença entre ter um site e ter uma estrutura digital",
  "Como o tráfego pago funciona na prática para negócios locais",
  "O que é SEO e por que é o investimento mais barato do marketing digital",
  "Barbearia: como dobrar o agendamento com automação",
  "Clínica: como confirmar consultas sem secretária",
  "Advogado: como captar clientes enquanto você trabalha",
  "O que faz uma empresa parecer maior do que ela é",
  "Como saber se seus anúncios estão funcionando de verdade",
  "CRM não é só para grandes empresas",
  "Por que negócios locais perdem clientes para concorrentes menores",
  "O que automatizar primeiro quando você é solo",
  "Instagram que vende vs Instagram que só tem seguidor",
  "Presença digital em 2025: o mínimo que todo negócio precisa ter",
];

export function getTopicByIndex(index: number): string {
  return UPFLU_TOPICS[index % UPFLU_TOPICS.length];
}
