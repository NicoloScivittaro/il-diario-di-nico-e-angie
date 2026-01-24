-- Assicurati di eseguire questo script dalla dashboard SQL di Supabase
-- oppure tramite il Supabase CLI collegato al progetto corretto.

create extension if not exists "pgcrypto";

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text,
  author_role text check (
    author_role is null or author_role in ('nicolo', 'angelica')
  ),
  content text not null,
  image_url text,
  parent_id uuid references public.entries (id) on delete cascade,
  likes_count integer not null default 0,
  liked_by uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists entries_created_at_idx on public.entries (created_at desc);
create index if not exists entries_parent_id_idx on public.entries (parent_id);

alter table public.entries enable row level security;

create policy "Authenticated users can read entries"
  on public.entries
  for select
  using (auth.role() = 'authenticated');

create policy "Authors can insert entries"
  on public.entries
  for insert
  with check (auth.uid() = author_id);

create policy "Authors can delete entries"
  on public.entries
  for delete
  using (auth.uid() = author_id);

create policy "Authenticated users can like entries"
  on public.entries
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

grant update (likes_count, liked_by) on public.entries to authenticated;

