-- Tabela de propostas UPFLU Dashboard
-- Rodar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS proposals (
  id                      UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id               UUID          REFERENCES clients(id) ON DELETE SET NULL,
  title                   TEXT          NOT NULL,
  description             TEXT,
  services                JSONB         DEFAULT '[]',
  total_value             NUMERIC(10,2) DEFAULT 0,
  valid_until             DATE,
  status                  TEXT          DEFAULT 'draft',  -- draft | sent | signed | rejected
  autentique_document_id  TEXT,
  autentique_short_link   TEXT,
  signer_name             TEXT,
  signer_email            TEXT,
  signed_at               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   DEFAULT NOW(),
  updated_at              TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status    ON proposals(status);

NOTIFY pgrst, 'reload schema';
