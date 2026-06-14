# Kerhon Arkisto

Kaveriporukan anime- ja elokuva-arvioiden arkisto: pisteet, "best girl/boy"
-äänet ja tilastot yhdessä paikassa. Portfolioprojekti, joka esittelee
frontend-osaamista — TypeScript, Next.js App Router, datavisualisoinnit ja
saavutettavuus.

> **V1** on staattinen demo, joka toimii kolmesta JSON-tiedostosta ilman
> tietokantaa tai kirjautumista. Tietorakenne on suunniteltu niin, että V2:n
> ominaisuudet (käyttäjätilit, useat "huoneet") voi lisätä ilman isoa
> uudelleenkirjoitusta.

## Ominaisuudet

- **Dashboard** (`/`) — kerhon kokonaiskeskiarvo, viimeisimmän sarjan best
  girl/boy -nosto, viimeksi katsotut ja pikalinkit
- **Sarjan sivu** (`/sarja/[id]`) — perustiedot, **radar-kaavio** jäsenten
  pisteistä, best girl/boy -äänten **pylväskaavio** ja jäsenten kommenttikortit
- **Jäsenprofiili** (`/jasen/[id]`) — keskiarvo vs. kerhon keskiarvo,
  suosikkitagit, best pick -historia ja kaikki arviot
- **Hall of Fame** (`/hall-of-fame`) — best girl/boy -leaderboard sekä tiukin ja
  löysin arvioija
- **Aikajana** (`/aikajana`) — katsotut sarjat aikajärjestyksessä
- **Jäsen- ja sarjalistat** (`/jasenet`, `/sarjat`)

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Recharts](https://recharts.org) datavisualisointeihin
- Data: kolme staattista JSON-tiedostoa `data/`-kansiossa
- Deploy: [Vercel](https://vercel.com)

## Arkkitehtuuri

```
data/                      # members, series, reviews (JSON, V1:n "tietokanta")
src/
├─ app/                    # App Router -reitit (server-komponentit)
├─ components/             # SeriesCard, MemberCard, ReviewCard, charts/…
└─ lib/
   ├─ types.ts            # Member, Series, Review
   ├─ data.ts             # JSON-lataus ja perushaut
   ├─ stats.ts            # keskiarvot, ääntenlasku, leaderboard…
   └─ labels.ts           # jaetut tekstit/formatoinnit
```

Sivut ovat server-komponentteja, jotka lukevat datan ja laskevat tilastot
palvelimella; vain kaaviot (Recharts) ovat client-komponentteja. Dynaamiset
reitit esirenderöidään `generateStaticParams`-funktiolla.

## Saavutettavuus

- Semanttinen HTML (`header`, `nav`, `main`, `section`, `ol`/`ul`, `time`)
- "Siirry sisältöön" -hyppylinkki ja näkyvät focus-tilat
- Kaavioilla tekstimuotoinen `figcaption`-yhteenveto (ruudunlukija + no-JS)
- Toimii sekä vaaleassa että tummassa tilassa (`prefers-color-scheme`)

## Kehitys

```bash
npm install
npm run dev      # http://localhost:3000
```

Muut skriptit:

```bash
npm run build    # tuotantobuild
npm run start    # tuotantopalvelin
npm run lint     # ESLint
```

## Data

V1:n data on `data/`-kansiossa kolmessa tiedostossa: `members.json`,
`series.json` ja `reviews.json`. Uuden sarjan tai arvion lisääminen onnistuu
muokkaamalla näitä tiedostoja — tyypit (`src/lib/types.ts`) pitävät rakenteen
kasassa.

## AI-yhteenveto

Sarjasivulla voi näkyä lyhyt tekoälyn tiivistämä yhteenveto kerhon arvioista.
Yhteenvedot generoidaan **build-aikana** erillisellä skriptillä (Anthropic
Claude, `claude-opus-4-8`) ja tallennetaan `data/summaries.json`:iin — sovellus
ei kutsu mallia ajon aikana, joten sivusto pysyy täysin staattisena eikä
API-avainta tarvita tuotannossa.

> Generointi on **täysin valinnainen**. Ilman sitä `data/summaries.json` on
> tyhjä, yhteenvetokortti ei näy ja kaikki muu toimii normaalisti. Koodi
> demonstroi Claude API -integraation; aja skripti vain jos haluat yhteenvedot.

Generointi vaatii Anthropic API -avaimen ympäristömuuttujana. Aja projektin
juuresta:

```powershell
# PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
npm run generate:summaries
```

```bash
# bash
ANTHROPIC_API_KEY=sk-ant-... npm run generate:summaries
```

Skripti lukee `data/`-tiedostot, kirjoittaa yhteenvedot ja `data/summaries.json`
commitoidaan staattisena datana. Avainta ei koskaan tallenneta repoon
(`.env*`-tiedostot ovat `.gitignore`ssa).

## Kansikuvat

Sarjojen kansikuvat haetaan **build-aikana** [AniList](https://anilist.co)-rajapinnasta
(GraphQL, ilmainen, ei API-avainta) ja tallennetaan `data/covers.json`:iin
(`{ seriesId: kuvaUrl }`). Sovellus ei hae kuvia ajon aikana — kuvat ladataan
AniListin CDN:stä (`s4.anilist.co`) suoraan selaimeen.

Päivitä kuvat tarvittaessa projektin juuresta:

```bash
npm run fetch:covers
```

Skripti hakee jokaiselle `series.json`:n sarjalle parhaan osuman (leffat suosivat
MOVIE-muotoa, hankalille nimille on tarkemmat hakusanat) ja tulostaa osumat
tarkistettavaksi. `data/covers.json` commitoidaan staattisena datana.

## Lisenssi

[MIT](./LICENSE)
