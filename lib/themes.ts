export const UPFLU_TOPICS = [
  "Por que sua empresa precisa de um assistente IA no WhatsApp",
  "5 processos que você pode automatizar ainda esse mês",
  "A diferença entre ter um site e ter uma estrutura digital",
  "Como o tráfego pago funciona na prática para negócios locais",
  "O que é SEO e por que é o investimento mais barato do marketing digital",
  "Como automatizar seu atendimento sem perder o toque humano",
  "O que acontece quando seu concorrente adota IA primeiro",
  "Como transformar o WhatsApp no seu melhor vendedor",
  "O que faz uma empresa parecer maior do que ela é",
  "Como saber se seus anúncios estão funcionando de verdade",
  "CRM não é só para grandes empresas",
  "Por que negócios locais perdem clientes para concorrentes menores",
  "O que automatizar primeiro quando você é solo",
  "Instagram que vende vs Instagram que só acumula seguidor",
  "Presença digital em 2025: o mínimo que todo negócio precisa ter",
  "Como parar de perder venda por demora no atendimento",
  "O custo invisível de fazer tudo na mão",
  "Como gerar leads qualificados sem aumentar o orçamento de anúncios",
];

export function getTopicByIndex(index: number): string {
  return UPFLU_TOPICS[index % UPFLU_TOPICS.length];
}
