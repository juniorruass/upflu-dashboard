-- ─────────────────────────────────────────────
-- UPFLU · Prospects Phase 1 — CRM melhorado
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────

-- Novos campos para CRM avançado
alter table prospects add column if not exists cnae             text;
alter table prospects add column if not exists cnae_descricao   text;
alter table prospects add column if not exists proximo_contato  date;
alter table prospects add column if not exists anotacoes        text;

-- Campos para fase 2 (busca por CNPJ/CNAE via Receita Federal)
-- situacao_cadastral padrão ATIVA pois registros atuais vêm do Google Maps
alter table prospects add column if not exists cnpj                 text;
alter table prospects add column if not exists situacao_cadastral   text default 'ATIVA';
