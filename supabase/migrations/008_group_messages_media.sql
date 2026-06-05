ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS media_type TEXT;       -- image | video | null
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS media_data TEXT;       -- base64
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS media_filename TEXT;   -- nome original do arquivo
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS media_caption TEXT;    -- legenda separada da mensagem de texto
