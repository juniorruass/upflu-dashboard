ALTER TABLE agenda_events ADD COLUMN IF NOT EXISTS notify_instance TEXT;
ALTER TABLE agenda_events ADD COLUMN IF NOT EXISTS notify_admin_phone TEXT;
