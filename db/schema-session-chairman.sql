-- Kerhoillan puheenjohtaja (saa aloittaa/päättää illan ja syöttää arvioita). Aja Supabase SQL editorissa.
alter table sessions add column if not exists chairman_id text references members(id);
