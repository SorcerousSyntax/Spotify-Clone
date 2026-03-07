-- Run this in Supabase SQL Editor to align schema with frontend persistence.

create table if not exists public.liked_songs (
  id bigserial primary key,
  song_id text not null unique,
  title text,
  artist text,
  album_art text,
  url text,
  liked_by text,
  liked_at timestamptz not null default now()
);

alter table public.liked_songs add column if not exists title text;
alter table public.liked_songs add column if not exists artist text;
alter table public.liked_songs add column if not exists album_art text;
alter table public.liked_songs add column if not exists url text;
alter table public.liked_songs add column if not exists liked_by text;
alter table public.liked_songs add column if not exists liked_at timestamptz default now();

create table if not exists public.play_history (
  id bigserial primary key,
  song_id text not null unique,
  title text,
  artist text,
  album_art text,
  url text,
  played_at timestamptz not null default now()
);

alter table public.play_history add column if not exists title text;
alter table public.play_history add column if not exists artist text;
alter table public.play_history add column if not exists album_art text;
alter table public.play_history add column if not exists url text;
alter table public.play_history add column if not exists played_at timestamptz default now();

create table if not exists public.playlists (
  id text primary key,
  name text not null,
  songs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Optional but recommended for anon access if RLS is enabled.
alter table public.liked_songs enable row level security;
alter table public.play_history enable row level security;
alter table public.playlists enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='liked_songs' and policyname='Allow anon full access liked_songs'
  ) then
    create policy "Allow anon full access liked_songs" on public.liked_songs for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='play_history' and policyname='Allow anon full access play_history'
  ) then
    create policy "Allow anon full access play_history" on public.play_history for all using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='playlists' and policyname='Allow anon full access playlists'
  ) then
    create policy "Allow anon full access playlists" on public.playlists for all using (true) with check (true);
  end if;
end $$;
