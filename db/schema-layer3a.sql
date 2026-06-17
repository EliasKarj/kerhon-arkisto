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
