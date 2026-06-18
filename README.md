# Kerhon Arkisto

Kaveriporukan kerhosovellus animejen ja elokuvien yhteiseen arviointiin:
julkinen **arkisto** (arviot, Best character -äänet, tilastot, yhteysverkko),
jäsenten **omat arviot**, **live-kerhoillat** ja **Discord-ilmoitukset** — kaikki
yhdessä paikassa.

**▶ Live:** https://kerhon-arkisto.vercel.app

Täysstack-projekti: TypeScript, Next.js App Router (server-komponentit + Server
Actions), Supabase (Postgres + Auth), build-aikainen datavisualisointi ja
saavutettavuus.

## Mitä se tekee

**Julkinen arkisto** (ei kirjautumista):

- **Etusivu** — "Nyt katselussa", kerhon kokonaiskeskiarvo, katseluaika/henkilö, viimeksi katsotut
- **Sarjat** — kausittain ryhmiteltynä + genre-suodatin
- **Sarjasivu** — radar-kaavio jäsenten pisteistä, Best character -äänet, lempihahmon kuva, kommentit
- **Jäsenet / jäsenprofiili** — keskiarvo vs. kerho, suosikkitagit, best pick -historia
- **Hall of Fame** — parhaat/huonoimmat sarjat, tiukin/löysin arvioija, best character -leaderboard
- **Tilastot** — trivia-dataa + animeiden **yhteysverkko** (build-aikainen d3-force-layout)
- **Aikajana** — vaakasuora, raahattava aikajana
- **Teemavalitsin** — 6 väriteemaa (tumma neo-brutalist -oletus)

**Jäsenet** (Discord-kirjautuminen):

- Kirjautuminen Discordilla; admin linkittää tilin kerhon jäseneen
- **Oma arvio** suoraan sarjasivulla (lisää/muokkaa/poista) — sarjan pistemäärä on jäsenarvioiden keskiarvo
- **Live-kerhoillat:** liity huoneeseen, näe läsnäolo ja arviot reaaliajassa

**Admin** (jäsentili tai jaettu salasana):

- Kerhoiltojen kirjaus (sarja + kaikkien arviot) AniList-haulla
- Tilien linkitys jäseniin
- **Live-sessioiden ajastus** (per-sessio-asetukset: kuka syöttää, pisteiden paljastus, ketkä liittyvät) ja puheenjohtajana ajaminen

**Live-kerhoilta** (`/kerhoilta/[id]`): puheenjohtaja aloittaa session, jäsenet
syöttävät arviot huoneessa (pollaus ~3 s), pisteet voivat olla piilossa
paljastukseen asti (palvelinpuolen redaktio), ja päättyessä arviot julkaistaan
arkistoon. Ajastuksesta, alkamisesta ja päättymisestä lähtee **Discord-ilmoitus**.

## Tech stack

- **[Next.js](https://nextjs.org) 16** — App Router, React Server Components, **Server Actions**, palvelinrenderöinti
- **TypeScript**
- **[Tailwind CSS](https://tailwindcss.com) v4** — neo-brutalist-teema, CSS-muuttujat, vaihdettavat teemat
- **[Supabase](https://supabase.com)** — Postgres (RLS) + **Auth (Discord OAuth)** `@supabase/ssr`:llä
- **[Recharts](https://recharts.org)** kaavioihin; **[d3-force](https://github.com/d3/d3-force)** verkkokaavion layoutiin (build-aikana)
- **[AniList](https://anilist.co) GraphQL** — kannet/hahmot/linkit/metadata (ilmainen, ei API-avainta)
- **Discord webhook** — kerhoilta-ilmoitukset
- Deploy: **[Vercel](https://vercel.com)**

## Arkkitehtuuri

- **Data** on Supabase Postgresissa (`members`, `series`, `reviews`, `accounts`, `sessions`, …). Sivut ovat async server-komponentteja jotka lukevat `getRoomData()`:lla (React `cache()` per pyyntö).
- **Johdettu data** (kannet, hahmot, linkit, AniList-meta) tallennetaan sarjan riville; vanhalle datalle on build-aikainen JSON-fallback. Yhteysverkko (`graph.json`) rakennetaan build-aikana d3-forcella kannasta.
- **Kirjoitukset** menevät Next **Server Actioneiden** kautta `service_role`-clientilla (palvelin-only). Identiteetti tulee aina palvelimelta (`getCurrentAccount()`), ei clientiltä. Julkinen luku on anon/publishable-avaimella + RLS public-SELECT.
- **Pistemäärä** = jäsenarvioiden keskiarvo, fallback tallennettuun yhteisarvosanaan kun arvioita ei ole (`displayScore`).
- **Live-sessiot:** session aikana arviot menevät erilliseen staging-tauluun (ei julkinen), näkyvyys redaktoidaan palvelimella, ja `endSession` commitoi ne julkiseen `reviews`-tauluun.

```
db/                   # SQL-skeemat (sovelletaan Supabasen SQL-editorissa)
src/
├─ app/               # App Router -reitit (server-komponentit, /hallinta, /kerhoilta, …)
├─ components/        # kortit, kaaviot, admin- ja sessio-UI
└─ lib/
   ├─ data.ts, stats.ts, fun-stats.ts, score.ts   # datakerros + tilastot (puhtaat funktiot)
   ├─ admin/          # write-UI server actionit, AniList, auth (jaettu salasana)
   ├─ auth/           # Supabase-auth-clientit + getCurrentAccount + säännöt
   ├─ member/         # jäsenten itsepalvelu-arvioiden actionit + validointi
   └─ session/        # live-kerhoilta: säännöt, actionit, pollaus, Discord-notify
scripts/              # build-aikaiset datahaut (AniList) + d3-force-graph + seed/backfill
```

Logiikka on puhtaina, testattavina funktioina (`node --test`); verkko/DB ovat ohuita kääreitä.

## Kehitys

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # yksikkötestit (node --test + tsx)
npm run build    # tuotantobuild
npm run lint     # ESLint
```

Datan/graafin skriptit (vaativat `.env.local`-ympäristömuuttujat):

```bash
npm run seed:db          # JSON -> Postgres (kertaluontoinen)
npm run backfill:derived # johdettu JSON -> kannan sarakkeet
npm run build:graph      # yhteysverkon layout kannasta -> data/graph.json
npm run fetch:meta       # (ja fetch:covers / fetch:characters / fetch:links) AniListista
```

### Ympäristömuuttujat

`.env.local`-tiedostoon (gitignored) + Vercelin Environment Variables -kohtaan:

| Muuttuja | Käyttö |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-projektin URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | julkinen luku (publishable/anon, RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **palvelin-only** kirjoitusavain (secret) |
| `ADMIN_PASSWORD` | jaettu admin-salasana (`/kirjaudu`) |
| `ADMIN_SESSION_SECRET` | admin-cookien HMAC-allekirjoitus |
| `DISCORD_WEBHOOK_URL` | (valinnainen) kerhoilta-ilmoitukset |
| `NEXT_PUBLIC_SITE_URL` | (valinnainen) absoluuttiset linkit ilmoituksissa |

Supabase Auth → Providers → **Discord** pitää olla päällä, ja `…/auth/callback` sallittuna redirect-URL:ina.

## Data

Oikeaa kaveriporukan dataa. Ainoa henkilötieto on jäsenten etunimi-lempinimet (tarkoituksella). Salaisuuksia ei ole koskaan commitoitu — kaikki avaimet ovat ympäristömuuttujissa.

## Saavutettavuus

Semanttinen HTML, "Siirry sisältöön" -hyppylinkki, näkyvät focus-tilat, kaavioiden tekstimuotoiset `figcaption`-yhteenvedot, `role="img"` + aria-label verkkokaaviolle.

## Lisenssi

[MIT](./LICENSE)
