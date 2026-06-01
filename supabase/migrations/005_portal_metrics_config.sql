-- Configuração de métricas visíveis no portal por cliente
-- null = exibir todas as métricas (comportamento padrão)
-- array de strings = exibir apenas as métricas listadas

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS portal_metrics text[] DEFAULT NULL;
