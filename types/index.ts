// ─── Clients ────────────────────────────────────────────────────────────────

export type ClientStatus = "active" | "onboarding" | "paused" | "ended" | "apresentacao" | "captado";

export type ServiceType =
  | "ai" | "automation" | "traffic" | "chatbot" | "crm" | "funnel" | "whatsapp" | "seo";

export interface Client {
  id: string;
  name: string;
  segment: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: ClientStatus;
  monthly_value: number;
  start_date: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  captado_via: string | null;
  meta_account_id: string | null;
  slug: string | null;
  portal_password: string | null;
  portal_metrics: string[] | null;
  instagram_followers: number | null;
  instagram_business_account_id: string | null;
  created_at: string;
  updated_at: string;
  services?: ClientService[];
  metrics?: ClientMetric[];
  notes?: ClientNote[];
}

export interface ClientService {
  id: string;
  client_id: string;
  service: ServiceType;
  created_at: string;
}

export interface ClientMetric {
  id: string;
  client_id: string;
  month: string;
  leads: number | null;
  conversions: number | null;
  revenue: number | null;
  ad_spend: number | null;
  created_at: string;
}

export interface ClientNote {
  id: string;
  client_id: string;
  content: string;
  author: string;
  created_at: string;
}

export interface OnboardingTask {
  id: string;
  client_id: string;
  title: string;
  done: boolean;
  position: number;
  created_at: string;
}

// ─── Carousels ───────────────────────────────────────────────────────────────

export type CarouselStatus = "pending" | "approved" | "declined";

export interface Carousel {
  id: string;
  status: CarouselStatus;
  post_number: number | null;
  topic: string;
  caption: string | null;
  created_at: string;
  approved_at: string | null;
  declined_at: string | null;
  slides?: Slide[];
}

export interface Slide {
  id: string;
  carousel_id: string;
  slide_number: number;
  html_content: string;   // DB column name — never changes
  image_url: string | null;
  created_at: string;
}

export interface GeneratedCarousel {
  topic: string;
  caption: string;
  slides: GeneratedSlide[];
}

// Claude returns "html" (not "html_content") — mapped on save
export interface GeneratedSlide {
  slide_number: number;
  html: string;
}

// ─── Agendamento ─────────────────────────────────────────────────────────────

export interface AgendamentoConfig {
  id: string;
  nome_clinica: string;
  especialidade: string;
  descricao: string;
  cor_primaria: string;
  webhook_url: string | null;
  webhook_ativo: boolean;
  duracao_consulta: number;
  antecedencia_minima_horas: number;
  dias_antecedencia: number;
  created_at: string;
  updated_at: string;
}

export interface QuizPergunta {
  id: string;
  ordem: number;
  pergunta: string;
  tipo: "single_choice" | "text" | "boolean";
  opcoes: string[] | null;
  obrigatoria: boolean;
  ativo: boolean;
  created_at: string;
}

export interface AgendamentoSlot {
  id: string;
  dia_semana: number; // 0=Dom ... 6=Sáb
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
  created_at: string;
}

export interface AgendamentoPaciente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  created_at: string;
}

export type AgendamentoStatus = "pendente" | "confirmado" | "cancelado" | "concluido" | "no_show";

export interface Agendamento {
  id: string;
  paciente_id: string | null;
  data: string;
  hora: string;
  status: AgendamentoStatus;
  procedimento: string | null;
  quiz_respostas: Record<string, string> | null;
  observacoes: string | null;
  webhook_enviado: boolean;
  created_at: string;
  updated_at: string;
  paciente?: AgendamentoPaciente;
}

export interface AgendamentoWebhookEvent {
  id: string;
  agendamento_id: string;
  tipo: "novo_agendamento" | "cancelamento" | "lembrete_24h" | "lembrete_2h" | "avaliacao";
  payload: Record<string, unknown>;
  status: "pendente" | "enviado" | "erro";
  tentativas: number;
  erro: string | null;
  created_at: string;
  processado_at: string | null;
}

export interface NovoAgendamentoPayload {
  paciente: { nome: string; telefone: string; email?: string };
  data: string;
  hora: string;
  procedimento?: string;
  quiz_respostas: Record<string, string>;
}
