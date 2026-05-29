-- ============================================================
-- SISTEMA DE AGENDAMENTO COM QUIZ
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- Configuração geral da clínica
CREATE TABLE IF NOT EXISTS agendamento_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_clinica text NOT NULL DEFAULT 'Clínica Demo',
  especialidade text NOT NULL DEFAULT 'Geral',
  descricao text DEFAULT 'Agende sua consulta de forma rápida e fácil.',
  cor_primaria text DEFAULT '#00CFFF',
  webhook_url text,
  webhook_ativo boolean DEFAULT false,
  duracao_consulta integer DEFAULT 30,
  antecedencia_minima_horas integer DEFAULT 2,
  dias_antecedencia integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir config padrão
INSERT INTO agendamento_config (nome_clinica, especialidade, descricao)
VALUES ('Clínica Demo', 'Saúde & Bem-estar', 'Agende sua consulta em segundos, sem ligação.')
ON CONFLICT DO NOTHING;

-- Perguntas do quiz (configuráveis pelo admin)
CREATE TABLE IF NOT EXISTS agendamento_quiz_perguntas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem integer NOT NULL DEFAULT 0,
  pergunta text NOT NULL,
  tipo text NOT NULL DEFAULT 'single_choice', -- single_choice | text | boolean
  opcoes jsonb, -- ["Opção A", "Opção B"]
  obrigatoria boolean DEFAULT true,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Perguntas padrão de demo
INSERT INTO agendamento_quiz_perguntas (ordem, pergunta, tipo, opcoes) VALUES
  (1, 'Qual é o motivo da sua consulta?', 'single_choice', '["Consulta de rotina", "Dúvida ou sintoma específico", "Retorno / acompanhamento", "Procedimento estético", "Outro"]'),
  (2, 'Você já foi atendido aqui antes?', 'single_choice', '["Sim, sou paciente", "Não, é minha primeira vez"]'),
  (3, 'Qual período prefere para o atendimento?', 'single_choice', '["Manhã (8h–12h)", "Tarde (13h–17h)", "Qualquer horário"]')
ON CONFLICT DO NOTHING;

-- Horários disponíveis por dia da semana
CREATE TABLE IF NOT EXISTS agendamento_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dia_semana integer NOT NULL, -- 0=Dom 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sáb
  hora_inicio text NOT NULL DEFAULT '09:00',
  hora_fim text NOT NULL DEFAULT '18:00',
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Slots padrão: seg–sex, 09:00–18:00
INSERT INTO agendamento_slots (dia_semana, hora_inicio, hora_fim, ativo) VALUES
  (1, '09:00', '18:00', true),
  (2, '09:00', '18:00', true),
  (3, '09:00', '18:00', true),
  (4, '09:00', '18:00', true),
  (5, '09:00', '18:00', true),
  (6, '09:00', '13:00', true),
  (0, '09:00', '13:00', false)
ON CONFLICT DO NOTHING;

-- Pacientes
CREATE TABLE IF NOT EXISTS agendamento_pacientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  telefone text NOT NULL,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES agendamento_pacientes(id) ON DELETE SET NULL,
  data date NOT NULL,
  hora text NOT NULL,
  status text NOT NULL DEFAULT 'pendente', -- pendente | confirmado | cancelado | concluido | no_show
  procedimento text,
  quiz_respostas jsonb,
  observacoes text,
  webhook_enviado boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fila de webhooks para automação futura (n8n)
CREATE TABLE IF NOT EXISTS agendamento_webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agendamento_id uuid REFERENCES agendamentos(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- novo_agendamento | cancelamento | lembrete_24h | lembrete_2h | avaliacao
  payload jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'pendente', -- pendente | enviado | erro
  tentativas integer DEFAULT 0,
  erro text,
  created_at timestamptz DEFAULT now(),
  processado_at timestamptz
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente ON agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON agendamento_webhook_events(status);

-- RLS: desabilitar para uso com service_role no dashboard
ALTER TABLE agendamento_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamento_quiz_perguntas DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamento_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamento_pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE agendamento_webhook_events DISABLE ROW LEVEL SECURITY;
