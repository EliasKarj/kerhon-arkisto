-- V2 Layer 2: johdettu per-sarja-data kantaan, jotta uudet sarjat ovat heti
-- valmiita ilman build-aikaista JSONia. Aja Supabase SQL editorissa.

alter table series add column if not exists meta            jsonb;
alter table series add column if not exists best_pick_image text;
alter table series add column if not exists watch_links     jsonb;
alter table series add column if not exists anilist_id      integer;
