-- Mensagens agendadas para grupos do WhatsApp
CREATE TABLE IF NOT EXISTS group_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance    TEXT NOT NULL,
  group_jid   TEXT NOT NULL,
  group_name  TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'marketing', -- marketing | operational
  scheduled_at TIMESTAMPTZ NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | sent | failed
  sent_at     TIMESTAMPTZ,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agenda interna com notificações
CREATE TABLE IF NOT EXISTS agenda_events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL,
  description             TEXT,
  client_id               UUID REFERENCES clients(id) ON DELETE SET NULL,
  starts_at               TIMESTAMPTZ NOT NULL,
  ends_at                 TIMESTAMPTZ,
  notify_admin_whatsapp   BOOLEAN NOT NULL DEFAULT true,
  notify_admin_email      BOOLEAN NOT NULL DEFAULT false,
  notify_client_whatsapp  BOOLEAN NOT NULL DEFAULT false,
  notify_client_email     BOOLEAN NOT NULL DEFAULT false,
  status                  TEXT NOT NULL DEFAULT 'pending', -- pending | notified | done | cancelled
  notified_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_scheduled ON group_messages (scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_agenda_events_starts ON agenda_events (starts_at, status);
