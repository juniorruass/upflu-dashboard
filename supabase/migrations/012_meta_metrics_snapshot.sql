-- Snapshot do último resultado bem-sucedido das métricas do Meta por cliente/preset,
-- usado como fallback quando a Graph API falha (token expirado, rate limit, etc.)
CREATE TABLE IF NOT EXISTS meta_metrics_snapshot (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date_preset TEXT NOT NULL DEFAULT 'last_30d',
  payload     JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, date_preset)
);

CREATE INDEX IF NOT EXISTS idx_meta_snapshot_client ON meta_metrics_snapshot (client_id);
