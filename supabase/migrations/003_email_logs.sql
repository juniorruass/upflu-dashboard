-- ─────────────────────────────────────────────
-- UPFLU · Email Logs — histórico de disparos
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────────

create table if not exists email_logs (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  uuid references prospects(id) on delete set null,
  nome         text not null,
  email        text not null,
  assunto      text not null,
  template     text not null,
  status       text not null default 'enviado',
  sent_at      timestamptz default now()
);

alter table email_logs enable row level security;
create policy "service role all" on email_logs for all using (true);
