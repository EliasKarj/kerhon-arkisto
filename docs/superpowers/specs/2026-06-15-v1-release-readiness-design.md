# V1-julkaisuvalmius — suunnitelma

- **Päivä:** 2026-06-15
- **Tila:** Hyväksytty (odottaa spec-katselmusta ennen toteutusplaania)
- **Projekti:** Kerhon Arkisto (`in-development/kerhon-arkisto`), julkinen repo,
  deployattu GitHub Pagesiin (https://eliaskarj.github.io/kerhon-arkisto/)

## Tavoite

Valmistella repo ja tiedostot V1-julkaisua varten: siivota boilerplate ja kuollut
koodi, poistaa käyttämätön AI-yhteenveto-ominaisuus, piilottaa kehitys-/AI-
työnkulun tiedostot, lisätä oma favicon ja **kirjoittaa README ajan tasalle**
portfolio-tasoisena. Ei uusia tuoteominaisuuksia.

## Laajuus

**Mukana:** repo-siivous, AI-yhteenveto-ominaisuuden poisto, favicon, README-
uusinta, loppu-QA.

**Ei mukana (rajattu pois):**
- Ei some-/OG-esikatselua (ei `opengraph-image`, ei OG/Twitter-metatageja, ei
  `metadataBase`-lisäystä tätä varten) — käyttäjä ei halua some-jakoa.
- Ei kuvakaappaus-placeholdereita READMEen (vain live-demolinkki; käyttäjä voi
  lisätä kuvat myöhemmin).
- Ei git-historian uudelleenkirjoitusta (piilotettavat tiedostot jäävät
  historiaan; vain seuranta poistetaan). Tämä on tietoinen valinta —
  force-push/historian skrubbaus on tuhoavampi ja jätetään pois.
- Ei uusia tuoteominaisuuksia, ei datan muutoksia.

## Työvaiheet

### 1. Repo-siivous

**1a. Poista boilerplate-assetit.** `git rm` käyttämättömät create-next-app-SVG:t,
joihin ei viitata koodissa (varmistettu greppaamalla):
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`,
  `public/window.svg`

**1b. Poista kuollut koodi.**
- `getAllMeta` (`src/lib/data.ts`) — käyttämätön export (varmistettu).
- Dead-code-sweep: tarkista muut käyttämättömät exportit (esim. mahdolliset
  `labels.ts`:n funktiot) greppaamalla ja poista vain ne, joihin ei ole yhtään
  viittausta `src/`:ssä. Älä poista mitään, johon on viittaus.

**1c. Poista AI-yhteenveto-ominaisuus kokonaan.** Poistettavat:
- `scripts/generate-summaries.mjs`
- `data/summaries.json`
- `src/lib/data.ts`: `import summariesData`, `const summaries`,
  `getSummaryForSeries`-funktio + siihen liittyvä kommentti
- `src/app/sarja/[id]/page.tsx`: AI-yhteenvetokortti (`getSummaryForSeries`-import,
  `const summary = ...`, koko `{/* AI-yhteenveto */}` -sektio)
- `package.json`: `generate:summaries`-skripti **ja** `@anthropic-ai/sdk`
  devDependency (sen ainoa käyttäjä oli poistettava skripti)
- `src/lib/types.ts` / muut kommentit, jotka viittaavat AI-yhteenvetoon
- README:n "AI-yhteenveto"-osio (käsitellään vaiheessa 3)

Lopputulos: `npm run build` + `npm run lint` vihreät, ei jäljelle jääviä
viittauksia `summaries`/`getSummaryForSeries`/`@anthropic-ai/sdk`:hen.

**1d. Piilota kehitys-/AI-artefaktit.** `git rm --cached` (säilytä levyllä) +
lisää `.gitignore`en:
- `AGENTS.md`, `CLAUDE.md` (agentti-ohjeet — pidetään paikallisesti
  jatkokehitystä varten)
- `docs/superpowers/` (spec- ja plan-dokumentit, ml. tämä tiedosto)

Huom: nämä jäävät git-historiaan; vain seuranta poistetaan tästä eteenpäin.

### 2. Favicon

- Lisää oma **brutalist-favicon** `src/app/icon.svg` (Next App Router tukee
  `app/icon.svg`:tä automaattisesti `<link rel="icon">`-tagina). Sisältö: tumma
  tausta + aksenttivärinen kehys + "KA"-monogrammi (Space Grotesk -henkinen,
  paksu, UPPERCASE) — vastaa sivuston brutalist-ilmettä. Värit kovakoodataan
  SVG:hen (favicon ei lue CSS-muuttujia): tausta `#0f0f12`, kehys/teksti
  `#f3efe2`, aksentti `#c6f000` (oletusteema "Yö").
- Poista oletus-`src/app/favicon.ico` (Nextin generoima).
- Varmista että `app/icon.svg` toimii myös GitHub Pagesin alipolun (basePath)
  kanssa — App Routerin metadata-ikonit saavat basePathin automaattisesti.

### 3. README-uusinta

Korvaa `README.md` ajantasaisella, portfolio-tasoisella versiolla. Sisältö:

- **Otsikko + 1–2 lauseen kuvaus** ja näkyvä **live-demolinkki**
  (https://eliaskarj.github.io/kerhon-arkisto/).
- **Ominaisuudet** — tarkka kierros nykytilan mukaan:
  - Etusivu: "Nyt katselussa" -banneri suoratoistolinkkeineen, kerhon
    kokonaiskeskiarvo, **katseluaika/henkilö**, viimeksi katsotut (best character
    korteissa)
  - Sarjat: **kausiryhmittely + genre-suodatin**
  - Sarjasivu: radar-kaavio, **Best character** -äänten pylväskaavio, lempihahmon
    kuva, kommenttikortit
  - Jäsenet / jäsenprofiili
  - Hall of Fame
  - **Tilastot**: fun/trivia-statsit + **animeiden yhteysverkko** (build-aikainen
    d3-force-layout, kannet solmuina)
  - **Aikajana**: vaakasuora, raahattava (inertia, reunafade)
  - **Teemavalitsin**: 6 väriteemaa (tumma neo-brutalist -oletus); termi
    **"Best character"** (ei enää "best girl/boy")
- **Tech stack** — Next.js 16 (App Router, **static export**), TypeScript,
  Tailwind v4, Recharts, **d3-force** (build-aikana), **AniList GraphQL**
  (build-aikainen data, ei ajonaikaista API:a).
- **Arkkitehtuuri** — päivitetty puu: `src/lib/` (data, stats, **fun-stats**,
  labels, **themes**, types), `src/components/` (+ `stats/`, `charts/`),
  `scripts/` (fetch-covers/characters/links/**meta**, **build-graph**), `data/`
  (members, series, reviews, covers, characters, links, **meta**, **graph**).
  Selitä SSG + client-saarekkeet (kaaviot, verkkokaavio, teemavalitsin,
  sarjaselain, aikajana).
- **Data & build-skriptit** — listaa JSON-tiedostot ja niitä päivittävät
  npm-skriptit (`fetch:covers`, `fetch:characters`, `fetch:links`, `fetch:meta`,
  `build:graph`).
- **Deploy** — **GitHub Pages** GitHub Actionsilla (`.github/workflows/
  nextjs.yml`): `output: export`, `basePath`/`trailingSlash`,
  `images.unoptimized`; konfiguraatio hallitaan itse `next.config.ts`:ssä.
- **Saavutettavuus** — semanttinen HTML, "Siirry sisältöön" -hyppylinkki, näkyvät
  focus-tilat, kaavioiden `figcaption`-yhteenvedot, sr-only-otsikot. **Korjaa**
  vanha "prefers-color-scheme" → pakotettu tumma + teemavalitsin.
- **Kehitys** — `npm install`, `npm run dev`, `build`, `lint`.
- **Lisenssi** — MIT (linkki säilyy).

Poistettavat/korjattavat vanhat väitteet: "best girl/boy" → "Best character",
"Deploy: Vercel" → GitHub Pages, "kolme JSON-tiedostoa" → todellinen lista,
AI-yhteenveto-osio pois, "prefers-color-scheme" → teemat.

### 4. Loppu-QA

- `npm run build` (CI=1) + `npm run lint` vihreät poistojen jälkeen.
- Verkkohaku: ei jäljelle jääviä viittauksia poistettuihin symboleihin/tiedostoihin
  (`summaries`, `getSummaryForSeries`, `getAllMeta`, poistetut SVG:t).
- Tarkista live-reitit deployn jälkeen (etusivu + jokainen välilehti 200, ei
  rikkinäisiä sisäisiä linkkejä), favicon näkyy selainvälilehdellä.

## Reunatapaukset / riskit
- AI-yhteenvedon poisto koskettaa `data.ts`:ää ja sarjasivua — varmistettava
  ettei muu sarjasivun logiikka rikkoudu (build + lint kattavat tyypit).
- `@anthropic-ai/sdk`-poisto: aja `npm install` lukituksen päivittämiseksi;
  varmista ettei mikään muu importtaa sitä (vain poistettu skripti käytti).
- `docs/superpowers/` untrackaus poistaa myös tämän spec-tiedoston seurannasta —
  se on tietoista (työnkulun artefaktit muuttuvat paikallisiksi).
- `app/icon.svg` + basePath: varmista että ikoni latautuu Pagesin alipolusta.

## Verifiointi
Repo ei käytä testikehystä → `npm run build` (CI=1) + `npm run lint` + manuaalinen
live-tarkistus, kuten muutkin tämän projektin muutokset.
