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

## Lisenssi

[MIT](./LICENSE)
