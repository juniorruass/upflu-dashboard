-- ─────────────────────────────────────────────
-- UPFLU · WhatsApp Logs — histórico de disparos WA
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────

create table if not exists whatsapp_logs (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid references prospects(id) on delete set null,
  nome         text not null,
  telefone     text not null,
  template     text not null,
  status       text not null default 'enviado',
  sent_at      timestamptz default now()
);

alter table whatsapp_logs enable row level security;
create policy "service role all" on whatsapp_logs for all using (true);
