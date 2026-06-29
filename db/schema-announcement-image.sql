-- Ilmoituksen kuva (esim. linkistä haettu AniList-kansi). Aja Supabase SQL editorissa.
alter table announcements add column if not exists image_url text;
