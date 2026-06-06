-- Sequências de follow-up configuráveis
CREATE TABLE IF NOT EXISTS followup_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_name TEXT NOT NULL DEFAULT 'Padrão',
  step_order   INT NOT NULL,
  day_offset   INT NOT NULL,  -- dias após contato inicial
  message      TEXT NOT NULL,
  active       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Progresso de cada prospect na sequência
CREATE TABLE IF NOT EXISTS followup_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id  UUID NOT NULL UNIQUE,
  sequence_name TEXT NOT NULL DEFAULT 'Padrão',
  current_step INT NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  completed    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead score nos prospects
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS score INT DEFAULT 0;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ;

-- Tickets de suporte
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES clients(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'open',   -- open | in_progress | resolved | closed
  priority    TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | urgent
  admin_notes TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followup_steps_seq   ON followup_steps (sequence_name, step_order);
CREATE INDEX IF NOT EXISTS idx_followup_progress_id ON followup_progress (prospect_id);
CREATE INDEX IF NOT EXISTS idx_tickets_client       ON support_tickets (client_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_status       ON support_tickets (status, created_at DESC);
