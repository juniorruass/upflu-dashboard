-- Seguidores do Instagram para exibição no portal (entrada manual pelo ADM)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS instagram_followers integer DEFAULT NULL;
