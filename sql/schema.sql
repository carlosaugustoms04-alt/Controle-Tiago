-- Cole TODO este conteúdo no SQL Editor do Supabase e clique em Run.
-- Não cole o caminho do arquivo.

-- 1) Tabela de estado do app
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

-- 2) Bucket de arquivos (backup alternativo)
insert into storage.buckets (id, name, public)
values ('financas-data', 'financas-data', true)
on conflict (id) do update set public = true;

drop policy if exists "financas_public_read" on storage.objects;
drop policy if exists "financas_public_write" on storage.objects;
drop policy if exists "financas_public_update" on storage.objects;
drop policy if exists "financas_public_delete" on storage.objects;

create policy "financas_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'financas-data');

create policy "financas_public_write"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'financas-data');

create policy "financas_public_update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'financas-data')
with check (bucket_id = 'financas-data');

create policy "financas_public_delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'financas-data');

-- 3) Se a API ainda disser "schema cache", rode também:
-- notify pgrst, 'reload schema';
