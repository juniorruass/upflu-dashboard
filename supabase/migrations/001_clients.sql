-- ─────────────────────────────────────────────
-- UPFLU · Clients Module Migration
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────

-- 1. Clients
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  segment       text not null,
  contact_name  text,
  contact_phone text,
  contact_email text,
  status        text not null default 'active'
                  check (status in ('active','onboarding','paused','ended')),
  monthly_value numeric(10,2) default 0,
  start_date    date,
  notes_count   integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. Services per client
create table if not exists client_services (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references clients(id) on delete cascade not null,
  service    text not null
               check (service in ('ai','automation','traffic','chatbot','crm','funnel','whatsapp','seo')),
  created_at timestamptz default now(),
  unique (client_id, service)
);

-- 3. Monthly metrics
create table if not exists client_metrics (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references clients(id) on delete cascade not null,
  month       date not null,
  leads       integer default 0,
  conversions integer default 0,
  revenue     numeric(10,2) default 0,
  ad_spend    numeric(10,2) default 0,
  created_at  timestamptz default now(),
  unique (client_id, month)
);

-- 4. Notes / timeline
create table if not exists client_notes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references clients(id) on delete cascade not null,
  content    text not null,
  author     text default 'Junior',
  created_at timestamptz default now()
);

-- Auto-update updated_at on clients
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists clients_updated_at on clients;
create trigger clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

-- RLS: service role bypasses, anon blocked
alter table clients        enable row level security;
alter table client_services enable row level security;
alter table client_metrics  enable row level security;
alter table client_notes    enable row level security;

-- Allow service role full access (used by Next.js admin client)
create policy "service role all" on clients        for all using (true);
create policy "service role all" on client_services for all using (true);
create policy "service role all" on client_metrics  for all using (true);
create policy "service role all" on client_notes    for all using (true);
