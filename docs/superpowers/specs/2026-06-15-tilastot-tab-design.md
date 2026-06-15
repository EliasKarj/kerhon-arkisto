# Tilastot-välilehti — suunnitelma

- **Päivä:** 2026-06-15
- **Tila:** Hyväksytty (odottaa spec-katselmusta ennen toteutusplaania)
- **Projekti:** Kerhon Arkisto (`in-development/kerhon-arkisto`)

## Tavoite

Uusi ylätason **Tilastot**-välilehti (`/tilastot`), joka kokoaa "turhaa ja
hauskaa" trivia-dataa kaikista 64 sarjasta sekä niiden **yhteyksistä**. Tarkoitus
on viihdyttää kerhoa ja toimia portfolio-näytteenä datavisualisoinnista. Erottuu
Hall of Famesta: HoF näyttää vakavat leaderboardit, Tilastot näyttää quirky-faktat.

Kaikki lasketaan **build-aikana** (SSG), linjassa nykyisen arkkitehtuurin kanssa.
Ei ajonaikaista API:a, ei tietokantaa.

## Laajuus

**Mukana:**
- Uusi AniList-metadatan haku (genre, studio, vuosi, jaksot/kesto, formaatti,
  lähde, tekijä, relaatiot).
- Build-aikainen verkkolayout (d3-force) → staattinen SVG-verkkokaavio.
- Joukko fun-stat-funktioita ja niiden esitys brutalist-korteilla + Recharts-kaavioilla.
- Termin **"best girl/boy" → "Best character"** vaihto koko sivustolla.

**Ei tavoitteena (YAGNI):**
- Ei henkilökunta-/ääninäyttelijädataa (staff/seiyuu) — rajattu pois hakukuormasta.
- Ei ajonaikaista graafimoottoria (react-force-graph yms.).
- Ei uutta testi-infraa (repo ei sisällä testejä; verifiointi build+lint+manuaalinen).
- Ei multi-room/V2-asioita.

## Datakerros (build-time)

### 1. `scripts/fetch-meta.mjs` → `data/meta.json`

Hakee AniListista per sarja samalla nimihaku- + override-logiikalla kuin
`fetch-covers.mjs` (julkinen GraphQL, ei avainta). `npm run fetch:meta`.

Skeema (`Record<seriesId, SeriesMeta>`):

```jsonc
{
  "<seriesId>": {
    "genres": ["Action", "Drama"],   // AniList genres[]
    "studio": "Madhouse",            // päästudio (isMain), tai null
    "year": 2004,                    // seasonYear, tai null
    "episodes": 74,                  // episodes (elokuvilla 1), tai null
    "duration": 23,                  // minuuttia/jakso, tai null
    "format": "TV",                  // TV/MOVIE/OVA/ONA/...
    "source": "MANGA",               // MANGA/ORIGINAL/LIGHT_NOVEL/NOVEL/VISUAL_NOVEL/VIDEO_GAME/OTHER, tai null
    "author": "Naoki Urasawa",       // staff role ~ "Original Creator"/"Story", tai null
    "relations": ["<title>", ...]    // liittyvät mediat (nimet), voi olla tyhjä
  }
}
```

Puuttuva osuma → kyseinen sarja jätetään `meta.json`:sta pois (kuten kansihaussa
ne, joita ei löydy). Override-taulukko tricky-nimille (sama lista kuin
fetch-covers, esim. food-wars, monster y2004, ranma 2024 jne.).

### 2. `scripts/build-graph.mjs` → `data/graph.json`

Build-aikainen, lisää **`d3-force`** kehitysriippuvuudeksi (devDependency — ei
mene clientille). `npm run build:graph` (ajetaan `fetch:meta`:n jälkeen).

- **Solmut:** kaikki sarjat joilla on `meta`-tieto.
- **Reunat** (kukin tagattu `kind`-kentällä):
  - `studio`: pari jakaa saman päästudion.
  - `author`: pari jakaa saman tekijän.
  - `genre`: pari jakaa **vähintään 2 genreä** (kynnys vähentää tiheyttä, ettei
    kaaviosta tule "hiuspallo").
- **Layout:** yksi deterministinen voimasimulaatio kaikkien reunojen **unionilla**
  (kiinteä siemen → toistettava). Solmukoordinaatit normalisoidaan kiinteään
  viewBoxiin (esim. 0–1000 × 0–1000).
- **Tärkeä valinta:** layout lasketaan kerran. Käyttöliittymän toggle (studio/
  genre/tekijä) **vain suodattaa piirrettävät reunat** — solmut eivät hyppää
  ulottuvuutta vaihdettaessa.

Skeema:

```jsonc
{
  "nodes": [{ "id": "monster", "title": "Monster", "x": 812, "y": 244, "degree": 5 }],
  "edges": [{ "source": "monster", "target": "pluto", "kind": "author" }]
}
```

`degree` = solmun kokonaisaste kaikkien reunojen yli (käytetään
"eniten yhteyksiä"/"eristäytynein"-faktoissa).

## Sovelluskerros

### `src/lib/data.ts` — lisätään tyypitetyt lataajat
- `getMeta(seriesId): SeriesMeta | null`
- `meta: Record<string, SeriesMeta>` (tai `getAllMeta()`)
- `graph: { nodes: GraphNode[]; edges: GraphEdge[] }`
- Tyypit `SeriesMeta`, `GraphNode`, `GraphEdge` → `src/lib/types.ts`.

### `src/lib/fun-stats.ts` — puhtaat laskentafunktiot
Erillinen moduuli (vakava `stats.ts` säilyy ennallaan). Funktiot ja määritelmät:

1. `getTotalWatchTime()` → `{ minutes, hours, days }`. Summa `episodes * (duration ?? 24)`
   yli sarjojen joilla on meta. Näytetään ~likiarvona.
2. `getGenreDistribution()` → `CountEntry[]` kaikista genreistä; UI näyttää top ~8 +
   yleisimmän.
3. `getDecadeDistribution()` → `CountEntry[]` (`year` → vuosikymmen
   `Math.floor(year/10)*10`). Lisäksi `getOldestSeries()` / `getNewestSeries()`.
4. `getSourceDistribution()` → `CountEntry[]` normalisoiduin labelein (MANGA→"Manga",
   ORIGINAL→"Originaali", LIGHT_NOVEL→"Light novel", VISUAL_NOVEL→"Visual novel",
   VIDEO_GAME→"Peli", NOVEL→"Romaani", muut→"Muu").
5. `getStudioCounts()` → `CountEntry[]` päästudioittain.
6. `getMostConnectedAnime()` / `getMostIsolatedAnime()` → graafin `degree`-kentästä
   (eristäytynein = pienin aste, 0 = täysin yksin).
7. `getControversyRanking()` → sarjoille joilla on **≥2** jäsenkohtaista arviota:
   hajonta = `max(score) − min(score)`. `getMostControversial()` (suurin) ja
   `getMostAgreed()` (pienin).
8. `getAgreementPairs()` → jäsenpareille, joilla on **≥3** yhdessä arvioitua sarjaa,
   keskimääräinen itseisarvoero pisteistä. `soulmates` = pienin ero, `opposites` =
   suurin ero; palauttaa myös otoskoon (jaettujen sarjojen määrä).
9. `getHottestTake()` → arvio, jonka piste on kauimpana sarjan kerhokeskiarvosta
   (`clubScore`, tai jäsenarvioiden keskiarvo jos `clubScore` puuttuu). Palauttaa
   jäsenen, sarjan, arvion ja keskiarvon.
10. Best character: käytetään olemassa olevaa `getBestPickLeaderboard()`:a (stats.ts).

Reunaehdot funktioissa: null-suojaukset puuttuvalle metalle; jäsenstatistiikka
(7–9) lasketaan vain niistä ~25 sarjasta joilla on jäsenkohtaiset arviot, ja UI
merkitsee otoskoon ("perustuu N sarjaan").

### Komponentit
- `src/components/stats/connections-graph.tsx` — **client**-komponentti. SSR
  renderöi staattisen SVG:n (neliösolmut, paksut brutalist-reunat); hydraatio
  lisää hover-korostuksen (solmu → korosta sen reunat + naapurit + näytä nimi) ja
  ulottuvuus-togglen (studio/genre/tekijä, suodattaa reunat). Ei tarvitse
  mount-gatea (SVG renderöityy palvelimella; vain interaktio on clientillä).
- Uudet Recharts-kaaviot olemassa olevan `ChartFrame`-kuoren kautta:
  genre-/vuosikymmen-/lähdepylväät (`src/components/charts/`).
- Brutalist-kortit: hero-numero, fun-fact-kortit, jäsenpari-kortit
  (`src/components/stats/`).
- `src/app/tilastot/page.tsx` — **server**-komponentti, koostaa osiot;
  `export const metadata = { title: "Tilastot" }`.
- `src/components/site-header.tsx` — lisää nav-kohta `{ href: "/tilastot",
  label: "Tilastot" }`.

### Termin vaihto: "best girl/boy" → "Best character"
Koko sivustolla. Tiedostot (vähintään): `src/lib/labels.ts`, sarjasivu
`src/app/sarja/[id]/page.tsx` ("Kerhon lempihahmo (best girl/boy)" → "Kerhon
lempihahmo (Best character)"), aikajana `src/app/aikajana/page.tsx`, Hall of Fame,
etusivu `src/app/page.tsx`, jäsensivut. Vain käyttäjälle näkyvä teksti muuttuu;
datakentät (`bestPick`) säilyvät ennallaan.

## Sivun rakenne

```
H1 "Tilastot" + lyhyt kuvaus
├─ 🏁 Hero-rivi
│   ├─ Kokonaiskatseluaika (iso numero)
│   ├─ Kiistellyin anime (fakta)
│   └─ Eniten yhteyksiä -anime (fakta)
├─ 🕸️ Yhteyksien verkko
│   ├─ ConnectionsGraph + ulottuvuus-toggle
│   └─ faktat: eniten yhteyksiä / eristäytynein
├─ 📊 Animet numeroina
│   ├─ Genrejakauma (pylväät) + yleisin genre
│   ├─ Vuosikymmenet (pylväät) + vanhin & uusin
│   ├─ Mangapohjaiset vs. originaalit (lähde)
│   └─ Studio-lista
├─ 🤝 Kerho erimielisinä   (merkintä: "perustuu N sarjaan jäsenkohtaisin arvioin")
│   ├─ Sielunkumppanit & vastakohdat (jäsenparit)
│   ├─ Kiistellyin / yksimielisin anime
│   └─ Rohkein mielipide
└─ 💖 Best character
    └─ Eniten ääniä kerännyt hahmo + valinnat
```

Kaikki brutalist-tyylillä (paksut reunat, offset-varjot, UPPERCASE-otsikot,
font-mono numeroille, aksenttiväri teemasta). Kaaviot seuraavat `var(--accent)`-
väriä kuten nykyiset.

## Reunatapaukset
- Meta puuttuu sarjalta → pois metadatakaavioista; graafisolmu silti näkyy (voi
  olla reunaton).
- `author`/`source` null AniListissa → "Tuntematon"/jätetään pois jakaumasta.
- Jäsenparit: vaaditaan ≥3 jaettua sarjaa; muuten paria ei huomioida; otoskoko
  näytetään.
- Vuosikymmen vaatii `year`:n; elokuvilla on myös.
- Graafin eristyneet solmut renderöidään silti.

## Riippuvuudet
- **`d3-force`** — uusi *devDependency*, vain build-skriptissä. Ei clientille.
- Recharts (jo olemassa), `ChartFrame` (jo olemassa).

## Verifiointi
Repo ei sisällä testikehystä, joten vakiintunut käytäntö:
- `npm run fetch:meta` + `npm run build:graph` (datan generointi; tarkista
  meta.json/graph.json järkevyys silmämääräisesti).
- `npm run build` (CI=1) + `npm run lint` puhtaina.
- Manuaalinen visuaalinen tarkistus `npm run dev`:ssä.

Fun-stat-funktiot ovat puhtaita; jos myöhemmin halutaan, niille voi lisätä kevyet
yksikkötestit, mutta tämä spec ei tuo uutta testi-infraa.

## AniList / Next 16 -huomiot
- `fetch-meta.mjs` mukailee `fetch-covers.mjs`:n nimihaku- ja override-logiikkaa.
- Ennen Next-koodin kirjoittamista luetaan `node_modules/next/dist/docs/`
  (AGENTS.md): `params` on Promise, `PageProps<'/route'>`, client/server-rajat.
  Tilastot-sivu on server-komponentti, verkkokaavio client-komponentti.
