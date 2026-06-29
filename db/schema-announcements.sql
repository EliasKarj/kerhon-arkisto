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
