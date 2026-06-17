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
