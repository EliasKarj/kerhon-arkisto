-- Kerhon Arkisto: KOKO skeema yhdessä tiedostossa.
-- Aja tämä kerran UUDEN (testi) Supabase-projektin SQL-editorissa.
-- Luotu automaattisesti db/*.sql -tiedostoista oikeassa riippuvuusjärjestyksessä.

-- ============================================================
-- schema.sql
-- ============================================================
-- V2 Layer 1: ydindatan skeema (members, series, reviews). PK:t merkkijonoja
-- (säilyttää johdetun JSON-datan join seriesId:llä).

create table if not exists members (
  id         text primary key,
  name       text not null,
  avatar_url text,
  guest      boolean not null default false
);

create table if not exists series (
  id           text primary key,
  title        text not null,
  type         text not null,
  club_season  integer not null,
  watched_date date not null,
  proposer_id  text not null references members(id),
  club_score   numeric,
  best_pick    text,
  genre_tags   text[] not null default '{}',
  cover_url    text not null default ''
);

create table if not exists reviews (
  id            text primary key,
  series_id     text not null references series(id),
  member_id     text not null references members(id),
  score         numeric not null,
  bullet_points text[] not null default '{}',
  best_pick     text not null default '',
  tags          text[] not null default '{}'
);

-- RLS: data on jo julkista (V1-sivusto), joten public SELECT. Kirjoitukset vain
-- service-role-avaimella (ohittaa RLS:n).
alter table members enable row level security;
alter table series  enable row level security;
alter table reviews enable row level security;

create policy "public read members" on members for select using (true);
create policy "public read series"  on series  for select using (true);
create policy "public read reviews" on reviews for select using (true);

-- ============================================================
-- schema-layer2.sql
-- ============================================================
-- V2 Layer 2: johdettu per-sarja-data kantaan, jotta uudet sarjat ovat heti
-- valmiita ilman build-aikaista JSONia. Aja Supabase SQL editorissa.

alter table series add column if not exists meta            jsonb;
alter table series add column if not exists best_pick_image text;
alter table series add column if not exists watch_links     jsonb;
alter table series add column if not exists anilist_id      integer;

-- ============================================================
-- schema-layer3a.sql
-- ============================================================
-- V2 Layer 3a: tilit (Supabase auth -> jasen). Aja Supabase SQL editorissa.
create table if not exists accounts (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  member_id        text references members(id),
  is_admin         boolean not null default false,
  discord_username text,
  discord_avatar   text,
  created_at       timestamptz not null default now()
);

alter table accounts enable row level security;

-- Kayttaja lukee vain oman rivinsa. Kirjoitukset vain service_rolella (server actionit).
create policy "read own account" on accounts for select using (auth.uid() = user_id);

-- ============================================================
-- schema-developer.sql
-- ============================================================
-- Developer-rooli adminin yläpuolelle. Aja Supabase SQL editorissa.
-- Developer = kaikki admin-oikeudet + yksinoikeus roolien (admin/developer) hallintaan.
alter table accounts add column if not exists is_developer boolean not null default false;

-- BOOTSTRAP: anna itsellesi developer-rooli (vaihda käyttäjänimi tarvittaessa).
-- update accounts set is_developer = true where discord_username = 'elijass';

-- ============================================================
-- schema-layer3c1.sql
-- ============================================================
-- V2 Layer 3c-1: live-kerhoilta sessiot. Aja Supabase SQL editorissa.
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  series_id text not null references series(id),
  scheduled_at timestamptz,
  status text not null default 'scheduled',       -- scheduled | live | ended
  review_mode text not null default 'both',       -- chairman | members | both
  score_visibility text not null default 'live',  -- live | hidden
  join_policy text not null default 'all',         -- all | invited
  attendees text[] not null default '{}',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
alter table sessions enable row level security;
create policy "public read sessions" on sessions for select using (true);

create table if not exists session_reviews (
  session_id uuid not null references sessions(id) on delete cascade,
  member_id  text not null references members(id),
  score numeric,
  best_pick text not null default '',
  bullet_points text[] not null default '{}',
  tags text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (session_id, member_id)
);
alter table session_reviews enable row level security;  -- ei policyä → vain service_role

create table if not exists session_presence (
  session_id uuid not null references sessions(id) on delete cascade,
  member_id  text not null references members(id),
  last_seen timestamptz not null default now(),
  primary key (session_id, member_id)
);
alter table session_presence enable row level security; -- ei policyä → vain service_role

-- ============================================================
-- schema-session-chairman.sql
-- ============================================================
-- Kerhoillan puheenjohtaja (saa aloittaa/päättää illan ja syöttää arvioita). Aja Supabase SQL editorissa.
alter table sessions add column if not exists chairman_id text references members(id);

-- ============================================================
-- schema-feedback.sql
-- ============================================================
-- Palaute. Aja Supabase SQL editorissa.
-- RLS päällä eikä yhtään policyä → vain service_role (server actionit / hallinta) lukee & kirjoittaa.
create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  name text,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table feedback enable row level security;

-- ============================================================
-- schema-announcements.sql
-- ============================================================
-- Sivuston ilmoitukset (toast). Aja Supabase SQL editorissa.
-- Julkinen luku (toast näkyy kaikille); kirjoitukset vain service_rolella (admin).
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  href       text,
  created_at timestamptz not null default now()
);
alter table announcements enable row level security;
create policy "public read announcements" on announcements for select using (true);

-- ============================================================
-- schema-announcement-image.sql
-- ============================================================
-- Ilmoituksen kuva (esim. linkistä haettu AniList-kansi). Aja Supabase SQL editorissa.
alter table announcements add column if not exists image_url text;

-- ============================================================
-- schema-character-images.sql
-- ============================================================
-- Best character -hahmokuva per arvio. Aja Supabase SQL editorissa.
-- (series.best_pick_image on jo olemassa Layer 2:sta.)
alter table reviews         add column if not exists best_pick_image text;
alter table session_reviews add column if not exists best_pick_image text;

