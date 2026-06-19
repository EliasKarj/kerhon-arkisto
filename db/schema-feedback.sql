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
