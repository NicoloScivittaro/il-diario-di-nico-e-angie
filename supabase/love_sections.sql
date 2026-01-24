-- Create love_sections table
create table if not exists public.love_sections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  emoji text,
  theme_color text default 'rose', -- 'rose', 'pink', 'lavender', 'amber', etc.
  content text,
  cover_image_url text,
  created_at timestamptz not null default timezone('utc', now())
);

-- Enable RLS
alter table public.love_sections enable row level security;

-- Policies for RLS
create policy "Users can view love_sections"
  on public.love_sections for select
  using (auth.role() = 'authenticated'); -- Or restrict to specific users if needed

create policy "Users can insert own love_sections"
  on public.love_sections for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own love_sections"
  on public.love_sections for update
  using (auth.uid() = owner_id);

create policy "Users can delete own love_sections"
  on public.love_sections for delete
  using (auth.uid() = owner_id);

-- Storage bucket 'love-sections' setup
insert into storage.buckets (id, name, public)
values ('love-sections', 'love-sections', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Authenticated users can upload to love-sections"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'love-sections' );

create policy "Public can view files in love-sections"
  on storage.objects for select
  to public
  using ( bucket_id = 'love-sections' );

create policy "Users can update own files in love-sections"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'love-sections' and auth.uid() = owner );

create policy "Users can delete own files in love-sections"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'love-sections' and auth.uid() = owner );
