-- Tabela de pagamentos UPFLU Dashboard
-- Rodar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS payments (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id  UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount     NUMERIC(10,2) NOT NULL,
  due_date   DATE        NOT NULL,
  paid_date  DATE,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_due_date  ON payments(due_date);

NOTIFY pgrst, 'reload schema';
