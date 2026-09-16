-- Rode este SQL no Supabase: SQL Editor > New query > Run

create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "anon_read_write_app_state" on public.app_state;

create policy "anon_read_write_app_state"
on public.app_state
for all
to anon, authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.app_state to anon, authenticated;
