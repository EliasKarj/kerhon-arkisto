-- Best character -hahmokuva per arvio. Aja Supabase SQL editorissa.
-- (series.best_pick_image on jo olemassa Layer 2:sta.)
alter table reviews         add column if not exists best_pick_image text;
alter table session_reviews add column if not exists best_pick_image text;
