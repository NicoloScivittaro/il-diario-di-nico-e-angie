-- FIX TOTALE PER TABLE love_sections
-- Esegui questo script nell'SQL Editor di Supabase per allineare il DB al codice.

-- 1. Assicuriamoci che la tabella esista
create table if not exists public.love_sections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now())
);

-- 2. Aggiungi/Rinomina colonne per matchare lo schema frontend
-- user_id
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'user_id') then
    -- Se esiste owner_id, rinominalo, altrimenti crea user_id
    if exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'owner_id') then
      alter table public.love_sections rename column owner_id to user_id;
    else
      alter table public.love_sections add column user_id uuid references auth.users(id) on delete cascade;
    end if;
  end if;
end $$;

-- icon
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'icon') then
    if exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'emoji') then
      alter table public.love_sections rename column emoji to icon;
    else
      alter table public.love_sections add column icon text default '❤️';
    end if;
  end if;
end $$;

-- title
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'title') then
    alter table public.love_sections add column title text not null default 'Nuova Sezione';
  end if;
end $$;

-- description
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'description') then
    alter table public.love_sections add column description text;
  end if;
end $$;

-- content
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'content') then
    alter table public.love_sections add column content text;
  end if;
end $$;

-- theme (useremo 'theme' invece di 'theme_color' per semplicità)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'theme') then
    if exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'theme_color') then
      alter table public.love_sections rename column theme_color to theme;
    else
      alter table public.love_sections add column theme text default 'rose';
    end if;
  end if;
end $$;

-- cover_url (useremo 'cover_url' invece di 'cover_image_url')
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'cover_url') then
    if exists (select 1 from information_schema.columns where table_name = 'love_sections' and column_name = 'cover_image_url') then
      alter table public.love_sections rename column cover_image_url to cover_url;
    else
      alter table public.love_sections add column cover_url text;
    end if;
  end if;
end $$;

-- Policies di sicurezza (Idempotenti)
alter table public.love_sections enable row level security;

drop policy if exists "Love sections visible to everyone" on public.love_sections;
create policy "Love sections visible to everyone" on public.love_sections for select using (true);

drop policy if exists "Users can insert own sections" on public.love_sections;
create policy "Users can insert own sections" on public.love_sections for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own sections" on public.love_sections;
create policy "Users can update own sections" on public.love_sections for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own sections" on public.love_sections;
create policy "Users can delete own sections" on public.love_sections for delete using (auth.uid() = user_id);
