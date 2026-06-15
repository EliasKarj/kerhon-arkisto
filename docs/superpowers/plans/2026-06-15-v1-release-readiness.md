# V1-julkaisuvalmius Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the Kerhon Arkisto repo release-ready for V1: remove boilerplate + dead code + the unused AI-summary feature, add a custom favicon, rewrite the README accurately, and hide dev/AI artifacts from the public repo.

**Architecture:** Pure cleanup + docs pass on an existing Next.js 16 static-export site. No new product features, no data changes. Each task is independent and ends green.

**Tech Stack:** Next.js 16 (App Router, static export), TypeScript, Tailwind v4. No test framework (verification is build + lint + grep).

**Verification model (READ FIRST):** This repo has **no test framework** and the spec excludes adding one. Do **NOT** scaffold pytest/vitest/jest. Each task is verified by `npm run build` (CI=1, which type-checks) + `npm run lint` + targeted `grep` to confirm removals are complete. Commit after each task.

**Conventions:**
- Repo root: `c:/Users/elkku/Documents/AABIGBOMBOCLAT/in-development/kerhon-arkisto` (the git repo is this subfolder).
- Branch: work on `main` (this project commits directly to main; the user authorizes pushes).
- Commands: Windows. Use the **Bash tool** (git/npm/node on PATH) or PowerShell (`npm` at `C:\Program Files\nodejs\npm.cmd`). Build with `CI=1 npm run build`. A dev server may run on port 3000 — do NOT start `npm run dev`.
- Commit message body must end with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Avoid double quotes inside commit messages (PowerShell here-string breaks on them); the Bash tool's `git commit -m "..."` is fine.

---

### Task 1: Remove the AI-summary feature

**Files:**
- Delete: `scripts/generate-summaries.mjs`
- Delete: `data/summaries.json`
- Modify: `src/lib/data.ts`
- Modify: `src/app/sarja/[id]/page.tsx`
- Modify: `package.json`

- [ ] **Step 1: Delete the script and data file**

```bash
git rm scripts/generate-summaries.mjs data/summaries.json
```

- [ ] **Step 2: Remove summaries from `src/lib/data.ts`**

Remove the import (these 3 lines, currently ~9–11):
```ts
// AI-generoidut yhteenvedot (build-time, `npm run generate:summaries`).
// Avain = seriesId, arvo = yhteenvetoteksti. Voi olla tyhjä.
import summariesData from "../../data/summaries.json";
```

Remove the const (currently ~39):
```ts
const summaries = summariesData as Record<string, string>;
```

Remove the accessor (currently ~81–84) including the blank line after it:
```ts
/** AI-generoitu yhteenveto sarjalle, tai null jos sitä ei ole vielä generoitu. */
export function getSummaryForSeries(seriesId: string): string | null {
  return summaries[seriesId] ?? null;
}
```

- [ ] **Step 3: Remove the AI card from `src/app/sarja/[id]/page.tsx`**

In the import block, remove the line `  getSummaryForSeries,` (so the `@/lib/data` import no longer lists it).

Remove the local variable (currently ~41):
```ts
  const summary = getSummaryForSeries(id);
```

Remove the entire AI-summary section (currently ~135–149) plus its trailing blank line:
```tsx
      {/* AI-yhteenveto */}
      {summary && (
        <section
          aria-label="AI-yhteenveto"
          className="flex flex-col gap-2 border-2 border-foreground bg-panel p-5 shadow-[6px_6px_0_var(--color-accent)]"
        >
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
            <span aria-hidden>✨</span> AI-yhteenveto
          </h2>
          <p className="text-foreground/90">{summary}</p>
          <p className="text-xs text-muted">
            Tekoälyn kerhon arvioista tiivistämä — voi sisältää epätarkkuuksia.
          </p>
        </section>
      )}
```

- [ ] **Step 4: Remove the script + dependency from `package.json`**

Remove this line from `"scripts"`:
```json
    "generate:summaries": "node scripts/generate-summaries.mjs",
```
Remove this line from `"devDependencies"`:
```json
    "@anthropic-ai/sdk": "^0.104.1",
```
(Watch trailing commas: after removing, the surrounding JSON must stay valid.)

- [ ] **Step 5: Sync lockfile and verify**

```bash
npm install
```
Then:
```bash
CI=1 npm run build
npm run lint
```
Expected: build "Compiled successfully" (82 static pages), lint clean.

Confirm no references remain:
```bash
grep -rn "summaries\|getSummaryForSeries\|anthropic" src scripts package.json | grep -v node_modules
```
Expected: **no output** (empty).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Poista kayttamaton AI-yhteenveto-ominaisuus"
```

---

### Task 2: Remove dead code

**Files:**
- Modify: `src/lib/data.ts` (remove `getAllMeta`)
- Modify: `src/lib/labels.ts` (remove `reviewCountLabel`)

- [ ] **Step 1: Verify both are unused**

```bash
grep -rn "getAllMeta" src | grep -v "export function getAllMeta"
grep -rn "reviewCountLabel" src | grep -v "export function reviewCountLabel"
```
Expected: **no output** for both (confirming zero references). If either prints a usage, do NOT remove that one — report it.

- [ ] **Step 2: Remove `getAllMeta` from `src/lib/data.ts`**

Remove these lines (currently the last function in the file, ~106–109) plus the blank line before the comment:
```ts
/** Kaikki metatieto (seriesId -> SeriesMeta). */
export function getAllMeta(): Record<string, SeriesMeta> {
  return meta;
}
```

- [ ] **Step 3: Remove `reviewCountLabel` from `src/lib/labels.ts`**

Remove these lines (currently ~18–21) plus the blank line before the comment:
```ts
/** "n arvio" / "n arviota" -taivutus. */
export function reviewCountLabel(count: number): string {
  return `${count} ${count === 1 ? "arvio" : "arviota"}`;
}
```

- [ ] **Step 4: Verify**

```bash
CI=1 npm run build
npm run lint
```
Expected: build compiles (82 pages), lint clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Poista kuollut koodi: getAllMeta ja reviewCountLabel"
```

---

### Task 3: Remove create-next-app boilerplate assets

**Files:**
- Delete: `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`

- [ ] **Step 1: Confirm none are referenced**

```bash
grep -rn "file.svg\|globe.svg\|next.svg\|vercel.svg\|window.svg" src
```
Expected: **no output**. (If any is referenced, do not delete that one — report it.)

- [ ] **Step 2: Delete the files**

```bash
git rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

- [ ] **Step 3: Verify**

```bash
CI=1 npm run build
```
Expected: compiles, 82 pages.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Poista create-next-app-boilerplate-SVGt public-kansiosta"
```

---

### Task 4: Custom brutalist favicon

**Files:**
- Create: `src/app/icon.svg`
- Delete: `src/app/favicon.ico`

- [ ] **Step 1: Create `src/app/icon.svg`**

Next App Router serves `app/icon.svg` automatically as the favicon. Brutalist "KA" monogram, colors hardcoded to the default "Yö" theme:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0f0f12" />
  <rect x="5" y="5" width="54" height="54" fill="none" stroke="#c6f000" stroke-width="4" />
  <text x="32" y="44" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#f3efe2">KA</text>
</svg>
```

- [ ] **Step 2: Delete the default favicon**

```bash
git rm src/app/favicon.ico
```

- [ ] **Step 3: Verify**

```bash
CI=1 npm run build
```
Expected: compiles. Confirm the icon is wired into the HTML:
```bash
grep -o 'rel="icon"[^>]*' .next/server/app/index.html | head -1
```
Expected: an icon link referencing `icon.svg` (or `/icon.svg`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Lisaa oma brutalist-favicon (icon.svg), poista oletus-favicon.ico"
```

---

### Task 5: Rewrite the README

**Files:**
- Modify: `README.md` (full replacement)

- [ ] **Step 1: Replace the entire contents of `README.md` with:**

````markdown
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
````

- [ ] **Step 2: Verify there are no stale terms left**

```bash
grep -niE "best girl/boy|Vercel|prefses|prefers-color-scheme|AI-yhteenveto|kolme staattista" README.md
```
Expected: **no output** (none of the old/incorrect terms remain).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Kirjoita README ajan tasalle (V1)"
```

---

### Task 6: Hide dev/AI artifacts + final QA

**Files:**
- Modify: `.gitignore`
- Untrack (keep on disk): `AGENTS.md`, `CLAUDE.md`, `docs/superpowers/`

> Do this task LAST. It untracks this plan + the spec (they stay on disk; the executor does not need the files). It does not rewrite history — the files remain in past commits.

- [ ] **Step 1: Append ignore rules to `.gitignore`**

Add to the end of `.gitignore`:
```
# kehitys-/agentti-artefaktit (paikallisia, ei julkaista)
AGENTS.md
CLAUDE.md
docs/superpowers/
```

- [ ] **Step 2: Untrack them (keep the files on disk)**

```bash
git rm --cached AGENTS.md CLAUDE.md
git rm -r --cached docs/superpowers
```
Expected: the files still exist on disk (only the staged index removes them). Confirm:
```bash
ls AGENTS.md CLAUDE.md docs/superpowers/specs/ | head
```
Expected: files/dirs still listed on disk.

- [ ] **Step 3: Final QA — build, lint, and the full removal sweep**

```bash
CI=1 npm run build
npm run lint
```
Expected: build "Compiled successfully" (82 static pages), lint clean.

```bash
grep -rn "summaries\|getSummaryForSeries\|getAllMeta\|reviewCountLabel\|@anthropic-ai" src scripts package.json | grep -v node_modules
```
Expected: **no output**.

```bash
git status --short
```
Expected: shows the `.gitignore` modification and the removed (`D`) tracked artifacts, nothing unexpected.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "Piilota dev-/AI-artefaktit (AGENTS, CLAUDE, docs/superpowers) gitignorella"
```

- [ ] **Step 5: Post-merge manual check (after deploy)**

After this is pushed and the GitHub Pages deploy completes, manually confirm on the live site (https://eliaskarj.github.io/kerhon-arkisto/): the favicon shows in the browser tab, each tab route loads (Etusivu, Sarjat, Jäsenet, Hall of Fame, Tilastot, Aikajana), and the sarja page no longer shows an AI-summary card. (No code change — verification only.)

---

## Self-Review

**Spec coverage:**
- 1a remove boilerplate SVGs → Task 3 ✓
- 1b dead code (getAllMeta + sweep) → Task 2 (getAllMeta + reviewCountLabel) ✓
- 1c remove AI-summary feature (script, json, data.ts, sarja page, package.json script + sdk, README section) → Task 1 (+ README section handled by the full rewrite in Task 5) ✓
- 1d untrack + gitignore AGENTS.md/CLAUDE.md/docs/superpowers → Task 6 ✓
- 2 favicon (icon.svg + remove favicon.ico) → Task 4 ✓
- 3 README rewrite (all required content + corrected terms) → Task 5 ✓
- 4 final QA (build/lint/grep + live check) → Task 6 Steps 3 & 5 ✓

**Placeholder scan:** No TBD/TODO. Every code/file step shows exact content. The README is provided in full. ✓

**Consistency:** The AI-summary README section is removed by replacing the whole README in Task 5 (so Task 1 doesn't need to touch README). Task 1's grep sweep (`summaries|getSummaryForSeries|anthropic`) excludes README (README still mentions it until Task 5) — Task 1 greps only `src scripts package.json`, so it won't be tripped by the README. The final sweep in Task 6 also targets `src scripts package.json` (not README), and Task 5 Step 2 separately verifies the README. ✓

**Ordering:** Task 6 (untrack docs/superpowers) is last so the plan/spec stay tracked while the work proceeds; the executor uses task text provided by the controller, not the on-disk plan. ✓
