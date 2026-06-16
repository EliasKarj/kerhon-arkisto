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
