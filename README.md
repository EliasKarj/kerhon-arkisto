# Kerhon Arkisto

Kaveriporukan anime- ja elokuva-arvioiden arkisto: pisteet, **Best character**
-äänet, tilastot ja animeiden yhteysverkko yhdessä paikassa. Portfolioprojekti,
joka esittelee frontend-osaamista — TypeScript, Next.js App Router, build-aikainen
datavisualisointi ja saavutettavuus.

**▶ Live-demo:** https://eliaskarj.github.io/kerhon-arkisto/

> V1 on staattinen sivusto, joka toimii `data/`-kansion JSON-tiedostoista ilman
> tietokantaa tai kirjautumista. Tietorakenne on suunniteltu niin, että V2:n
> ominaisuudet (käyttäjätilit, useat "huoneet") voi lisätä ilman isoa
> uudelleenkirjoitusta.

## Ominaisuudet

- **Etusivu** (`/`) — "Nyt katselussa" -banneri suoratoistolinkkeineen, kerhon
  kokonaiskeskiarvo, katseluaika/henkilö ja viimeksi katsotut (best character
  korteissa)
- **Sarjat** (`/sarjat`) — kaikki sarjat kausittain ryhmiteltynä + **genre-suodatin**
- **Sarjasivu** (`/sarja/[id]`) — **radar-kaavio** jäsenten pisteistä, **Best
  character** -äänten pylväskaavio, lempihahmon kuva ja kommenttikortit
- **Jäsenet / jäsenprofiili** (`/jasenet`, `/jasen/[id]`) — keskiarvo vs. kerho,
  suosikkitagit, best pick -historia ja arviot
- **Hall of Fame** (`/hall-of-fame`) — parhaat/huonoimmat sarjat, tiukin ja löysin
  arvioija sekä best character -leaderboard
- **Tilastot** (`/tilastot`) — "turhaa ja hauskaa" trivia-dataa ja **animeiden
  yhteysverkko** (build-aikainen d3-force-layout, solmuina animekannet)
- **Aikajana** (`/aikajana`) — vaakasuora, hiirellä raahattava aikajana
- **Teemavalitsin** — 6 väriteemaa (tumma neo-brutalist -oletus), valinta muistuu
  selaimessa

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, **staattinen export**) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4 (neo-brutalist -teema, CSS-muuttujat)
- [Recharts](https://recharts.org) kaavioihin
- [d3-force](https://github.com/d3/d3-force) — verkkokaavion layout **build-aikana**
- [AniList](https://anilist.co) GraphQL — kannet, hahmot, linkit ja metadata
  haetaan **build-aikana** staattiseksi dataksi (ei ajonaikaista API:a)
- Deploy: **GitHub Pages** (GitHub Actions)

## Arkkitehtuuri

```
data/                 # JSON-data (V1:n "tietokanta") + build-aikana haettu data
src/
├─ app/               # App Router -reitit (server-komponentit)
├─ components/
│  ├─ charts/         # Recharts-kaaviot (client) + ChartFrame
│  ├─ stats/          # ConnectionsGraph-verkkokaavio + tilastokortit
│  └─ …               # SeriesCard, ReviewCard, SeriesBrowser, Timeline, …
└─ lib/
   ├─ types.ts        # Member, Series, Review, SeriesMeta, Graph*
   ├─ data.ts         # JSON-lataus ja perushaut
   ├─ stats.ts        # keskiarvot, ääntenlasku, leaderboard
   ├─ fun-stats.ts    # Tilastot-välilehden trivia-funktiot
   ├─ themes.ts       # väriteemat
   └─ labels.ts       # jaetut tekstit/formatoinnit
scripts/              # build-aikaiset datahakuskriptit (AniList, d3-force)
```

Sivut ovat server-komponentteja, jotka lukevat datan ja laskevat tilastot
build-aikana. Vain interaktiiviset osat ovat client-komponentteja: kaaviot
(Recharts), verkkokaavio, teemavalitsin, sarjaselain (suodatin) ja aikajana
(raahaus). Dynaamiset reitit esirenderöidään `generateStaticParams`-funktiolla ja
koko sivusto viedään staattisena (`output: "export"`).

## Data ja build-skriptit

Perusdata on `data/`-kansiossa: `members.json`, `series.json`, `reviews.json`.
Loput haetaan build-aikana AniListista (tai lasketaan) ja commitoidaan staattisena
datana:

| Tiedosto | Sisältö | Skripti |
| --- | --- | --- |
| `covers.json` | kansikuvat | `npm run fetch:covers` |
| `characters.json` | lempihahmojen kuvat | `npm run fetch:characters` |
| `links.json` | suoratoistolinkit | `npm run fetch:links` |
| `meta.json` | genre, studio, vuosi, jaksot, lähde, … | `npm run fetch:meta` |
| `graph.json` | yhteysverkon layout (d3-force) | `npm run build:graph` |

Skriptit hakevat AniListin julkisesta GraphQL-rajapinnasta (ilmainen, ei
API-avainta) ja tulostavat osumat tarkistettavaksi. Uuden sarjan lisää
muokkaamalla `series.json`:ia ja ajamalla skriptit uudelleen.

## Kehitys

```bash
npm install
npm run dev      # http://localhost:3000
```

Muut skriptit:

```bash
npm run build    # staattinen export (out/)
npm run lint     # ESLint
```

## Deploy

Sivusto deployataan **GitHub Pagesiin** automaattisesti `main`-haaran pushista
(`.github/workflows/nextjs.yml`). Pages-konfiguraatio hallitaan suoraan
`next.config.ts`:ssä: `output: "export"`, `trailingSlash`, `images.unoptimized` ja
projektisivun `basePath` (vain CI:ssä `GITHUB_PAGES`-ympäristömuuttujalla).

## Saavutettavuus

- Semanttinen HTML (`header`, `nav`, `main`, `section`, `ol`/`ul`, `time`)
- "Siirry sisältöön" -hyppylinkki ja näkyvät focus-tilat
- Kaavioilla tekstimuotoinen `figcaption`-yhteenveto (ruudunlukija + no-JS)
- Verkkokaaviolla `role="img"` + aria-label; teemavalitsin tab-roolein
- Pakotettu tumma teema; käyttäjä voi vaihtaa väriteemaa teemavalitsimesta

## Lisenssi

[MIT](./LICENSE)
