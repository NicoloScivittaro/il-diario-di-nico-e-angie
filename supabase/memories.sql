-- Create memories table
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_role text,
  title text not null,
  memory_date date not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Create memory_images table
create table if not exists public.memory_images (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Enable RLS
alter table public.memories enable row level security;
alter table public.memory_images enable row level security;

-- Policies for memories
create policy "Authenticated users can read memories"
  on public.memories for select
  using (auth.role() = 'authenticated');

create policy "Authors can insert memories"
  on public.memories for insert
  with check (auth.uid() = author_id);

create policy "Authors can update own memories"
  on public.memories for update
  using (auth.uid() = author_id);

create policy "Authors can delete own memories"
  on public.memories for delete
  using (auth.uid() = author_id);

-- Policies for memory_images
create policy "Authenticated users can read memory images"
  on public.memory_images for select
  using (auth.role() = 'authenticated');

create policy "Authors can insert memory images"
  on public.memory_images for insert
  with check (
    exists (
      select 1 from public.memories
      where id = memory_images.memory_id
      and author_id = auth.uid()
    )
  );

create policy "Authors can delete memory images"
  on public.memory_images for delete
  using (
    exists (
      select 1 from public.memories
      where id = memory_images.memory_id
      and author_id = auth.uid()
    )
  );

-- Storage bucket 'memories' setup (Run this in Supabase Storage UI if CLI is not used)
-- Ensure a bucket named 'memories' exists and it's public.
-- Policies:
-- SELECT: Give public access or authenticated access
-- INSERT: Give authenticated access
