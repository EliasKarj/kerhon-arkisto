-- Developer-rooli adminin yläpuolelle. Aja Supabase SQL editorissa.
-- Developer = kaikki admin-oikeudet + yksinoikeus roolien (admin/developer) hallintaan.
alter table accounts add column if not exists is_developer boolean not null default false;

-- BOOTSTRAP: anna itsellesi developer-rooli (vaihda käyttäjänimi tarvittaessa).
-- update accounts set is_developer = true where discord_username = 'elijass';
