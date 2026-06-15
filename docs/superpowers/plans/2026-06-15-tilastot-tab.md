# Tilastot-välilehti Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/tilastot` tab with fun/trivia stats across all 64 series plus a build-time network graph of their connections.

**Architecture:** Two new build-time scripts fetch AniList metadata (`data/meta.json`) and precompute a d3-force graph layout (`data/graph.json`). Pure functions in `src/lib/fun-stats.ts` derive the stats; an SSG page renders them as brutalist cards + Recharts charts + one client-side SVG network graph. Includes a site-wide "best girl/boy" → "Best character" rename.

**Tech Stack:** Next.js 16 (App Router, SSG), TypeScript, Tailwind v4, Recharts (existing), `d3-force` (new build-time devDependency), AniList GraphQL (public, no key).

**Verification model (READ FIRST):** This repo has **no test framework** (only `lint` + `build` scripts) and the spec excludes adding one. Do **NOT** scaffold pytest/vitest/jest. Each task is verified by: generating data and inspecting the JSON, then `npm run build` (which type-checks all TS via tsc) + `npm run lint`, plus a manual `npm run dev` check for UI tasks. Commit after each task.

**Conventions:**
- Commands are PowerShell (Windows). Build with `$env:CI='1'; npm run build`.
- Commit message footer line: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Avoid double quotes inside commit messages (PowerShell here-string breaks on them).
- Before writing any Next.js component, skim `node_modules/next/dist/docs/` per `AGENTS.md` (params is a Promise, client/server boundaries).

---

### Task 1: AniList metadata fetch script

**Files:**
- Create: `scripts/fetch-meta.mjs`
- Modify: `package.json` (add `fetch:meta` script)
- Generates: `data/meta.json`

- [ ] **Step 1: Create the fetch script**

Create `scripts/fetch-meta.mjs` (mirrors `scripts/fetch-covers.mjs`'s search + override + format-ranking, with an extended query):

```js
// Build-time-skripti: hakee kullekin sarjalle metatiedot AniListista (genre,
// studio, vuosi, jaksot, kesto, formaatti, lähde, tekijä, relaatiot) ja kirjoittaa
// ne data/meta.json:iin muodossa { seriesId: SeriesMeta }. Staattista, commitoidaan.
//
// Aja projektin juuresta:  npm run fetch:meta

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");
const series = JSON.parse(readFileSync(join(DATA_DIR, "series.json"), "utf8"));

// Sama override-lista kuin fetch-covers.mjs:ssä (tarkempi haku / kohdevuosi).
const OVERRIDES = {
  "food-wars": { search: "Shokugeki no Souma", year: 2015 },
  "space-dandy": { search: "Space Dandy" },
  "master-of-diabolism": { search: "Mo Dao Zu Shi" },
  "ranma-half-2024": { search: "Ranma ½", year: 2024 },
  "ghost-in-the-shell": { search: "Ghost in the Shell", year: 1995 },
  "ossan-newbie-adventurer": {
    search: "The Ossan Newbie Adventurer, Trained to Death by the Most Powerful Party",
  },
  "memories": { search: "Memories", year: 1995 },
  "kurokos-basketball": { search: "Kuroko no Basket" },
  "demon-slayer": { search: "Kimetsu no Yaiba" },
  "frieren": { search: "Sousou no Frieren" },
  "monster": { search: "Monster", year: 2004 },
};

const NON_MOVIE_RANK = { TV: 0, ONA: 1, TV_SHORT: 2, OVA: 3, SPECIAL: 4, MOVIE: 5, MUSIC: 9 };
const MOVIE_RANK = { MOVIE: 0, SPECIAL: 1, ONA: 2, OVA: 3, TV: 4, TV_SHORT: 5, MUSIC: 9 };

const QUERY = `query($s:String){
  Page(perPage:10){
    media(search:$s, type:ANIME){
      id
      title{ romaji english }
      format
      seasonYear
      episodes
      duration
      source
      genres
      studios{ edges { isMain node { name } } }
      staff(perPage:8){ edges { role node { name { full } } } }
      relations{ edges { node { title { romaji english } type } } }
    }
  }
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchAniList(searchTerm) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { s: searchTerm } }),
  });
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after") ?? "5");
    console.warn(`  rate limited, odotetaan ${retry}s…`);
    await sleep((retry + 1) * 1000);
    return searchAniList(searchTerm);
  }
  const json = await res.json();
  return json?.data?.Page?.media ?? [];
}

function pickBest(entry, candidates) {
  if (candidates.length === 0) return null;
  const override = OVERRIDES[entry.id] ?? {};
  let pool = candidates;
  if (override.year) {
    const byYear = pool.filter((m) => m.seasonYear === override.year);
    if (byYear.length) pool = byYear;
  }
  const rank = entry.type === "movie" ? MOVIE_RANK : NON_MOVIE_RANK;
  return [...pool].sort((a, b) => (rank[a.format] ?? 8) - (rank[b.format] ?? 8))[0];
}

function toMeta(media) {
  const studioEdge =
    media.studios?.edges?.find((e) => e.isMain) ?? media.studios?.edges?.[0] ?? null;
  const authorEdge = media.staff?.edges?.find((e) =>
    /original creator|^story$|creator|original story/i.test(e.role ?? ""),
  );
  const relations = (media.relations?.edges ?? [])
    .map((e) => e.node?.title?.english ?? e.node?.title?.romaji)
    .filter(Boolean)
    .slice(0, 8);
  return {
    genres: media.genres ?? [],
    studio: studioEdge?.node?.name ?? null,
    year: media.seasonYear ?? null,
    episodes: media.episodes ?? null,
    duration: media.duration ?? null,
    format: media.format ?? null,
    source: media.source ?? null,
    author: authorEdge?.node?.name?.full ?? null,
    relations,
  };
}

async function main() {
  const meta = {};
  for (const entry of series) {
    const term = OVERRIDES[entry.id]?.search ?? entry.title;
    process.stdout.write(`${entry.id.padEnd(28)} `);
    try {
      const candidates = await searchAniList(term);
      const best = pickBest(entry, candidates);
      if (best) {
        meta[entry.id] = toMeta(best);
        const name = best.title.english ?? best.title.romaji;
        console.log(`-> ${name} (${best.seasonYear ?? "?"}, ${meta[entry.id].studio ?? "?"})`);
      } else {
        console.log("-> EI OSUMAA");
      }
    } catch (err) {
      console.log(`-> VIRHE: ${err.message}`);
    }
    await sleep(1500);
  }

  const outPath = join(DATA_DIR, "meta.json");
  writeFileSync(outPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
  console.log(`\nKirjoitettu ${Object.keys(meta).length}/${series.length} meta -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `scripts` after the `fetch:links` line:

```json
    "fetch:links": "node scripts/fetch-links.mjs",
    "fetch:meta": "node scripts/fetch-meta.mjs",
    "build:graph": "node scripts/build-graph.mjs"
```

(Adds both scripts now; `build:graph` is used in Task 3.)

- [ ] **Step 3: Run the fetch**

Run: `npm run fetch:meta`
Expected: ~60+ lines like `monster  -> Monster (2004, Madhouse)`, ending with `Kirjoitettu N/64 meta -> .../meta.json`. Takes ~1.5 min (rate-limited).

- [ ] **Step 4: Inspect the generated data**

Run: `node -e "const m=require('./data/meta.json'); console.log(m.monster); console.log('count', Object.keys(m).length)"`
Expected: `monster` has `studio: 'Madhouse'`, `source: 'MANGA'`, `year: 2004`, non-empty `genres`; count is ~60–64.

- [ ] **Step 5: Commit**

```powershell
git add scripts/fetch-meta.mjs package.json data/meta.json
git commit -m "Lisaa AniList-metahaku (fetch-meta) ja meta.json"
```

---

### Task 2: Domain types for meta + graph

**Files:**
- Modify: `src/lib/types.ts` (append)

- [ ] **Step 1: Append the new types**

Add to the end of `src/lib/types.ts`:

```ts
/** AniListista haettu sarjan metatieto (build-time, `data/meta.json`). */
export interface SeriesMeta {
  genres: string[];
  studio: string | null;
  year: number | null;
  episodes: number | null;
  /** Minuuttia per jakso. */
  duration: number | null;
  format: string | null;
  /** Lähde, esim. MANGA/ORIGINAL/LIGHT_NOVEL. */
  source: string | null;
  author: string | null;
  relations: string[];
}

export type GraphEdgeKind = "studio" | "genre" | "author";

export interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  /** Kokonaisaste kaikkien reunatyyppien yli. */
  degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: GraphEdgeKind;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
```

- [ ] **Step 2: Type-check**

Run: `npm run lint`
Expected: no errors (types unused so far is fine).

- [ ] **Step 3: Commit**

```powershell
git add src/lib/types.ts
git commit -m "Lisaa SeriesMeta- ja graafityypit"
```

---

### Task 3: Build-time graph layout

**Files:**
- Create: `scripts/build-graph.mjs`
- Modify: `package.json` (add `d3-force` devDependency — script already added in Task 1)
- Generates: `data/graph.json`

- [ ] **Step 1: Install d3-force (build-time only)**

Run: `npm install --save-dev d3-force`
Expected: `d3-force` added to `devDependencies` in `package.json`.

- [ ] **Step 2: Create the build-graph script**

Create `scripts/build-graph.mjs`:

```js
// Build-time-skripti: laskee animeiden yhteysverkon layoutin d3-forcella ja
// kirjoittaa solmukoordinaatit + reunat data/graph.json:iin. Reunat: jaettu
// studio / tekijä / >=2 yhteistä genreä. Yksi layout (reunojen unioni); UI
// suodattaa piirrettävät reunat. Deterministinen (siemennetty Math.random).
//
// Aja:  npm run build:graph   (fetch:meta:n jälkeen)

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DATA_DIR = join(process.cwd(), "data");
const series = JSON.parse(readFileSync(join(DATA_DIR, "series.json"), "utf8"));
const meta = JSON.parse(readFileSync(join(DATA_DIR, "meta.json"), "utf8"));

const ids = series.filter((s) => meta[s.id]).map((s) => s.id);
const titleById = Object.fromEntries(series.map((s) => [s.id, s.title]));

const edges = [];
for (let i = 0; i < ids.length; i++) {
  for (let j = i + 1; j < ids.length; j++) {
    const a = ids[i];
    const b = ids[j];
    const ma = meta[a];
    const mb = meta[b];
    if (ma.studio && ma.studio === mb.studio) edges.push({ source: a, target: b, kind: "studio" });
    if (ma.author && ma.author === mb.author) edges.push({ source: a, target: b, kind: "author" });
    const shared = (ma.genres || []).filter((g) => (mb.genres || []).includes(g));
    if (shared.length >= 2) edges.push({ source: a, target: b, kind: "genre" });
  }
}

const degree = Object.fromEntries(ids.map((id) => [id, 0]));
for (const e of edges) {
  degree[e.source]++;
  degree[e.target]++;
}

// Deterministinen simulaatio: korvataan Math.random ajon ajaksi.
const origRandom = Math.random;
Math.random = mulberry32(42);

const nodes = ids.map((id, i) => ({ id, x: Math.cos(i) * 120, y: Math.sin(i) * 120 }));
const links = edges.map((e) => ({ source: e.source, target: e.target }));

const sim = forceSimulation(nodes)
  .force("link", forceLink(links).id((d) => d.id).distance(70).strength(0.25))
  .force("charge", forceManyBody().strength(-130))
  .force("center", forceCenter(0, 0))
  .force("collide", forceCollide(20))
  .stop();
for (let i = 0; i < 400; i++) sim.tick();

Math.random = origRandom;

const xs = nodes.map((n) => n.x);
const ys = nodes.map((n) => n.y);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);
const M = 60;
const S = 1000 - 2 * M;
const norm = (v, min, max) => (max === min ? 500 : Math.round(M + ((v - min) / (max - min)) * S));

const outNodes = nodes.map((n) => ({
  id: n.id,
  title: titleById[n.id],
  x: norm(n.x, minX, maxX),
  y: norm(n.y, minY, maxY),
  degree: degree[n.id],
}));

const graph = { nodes: outNodes, edges };
const outPath = join(DATA_DIR, "graph.json");
writeFileSync(outPath, JSON.stringify(graph, null, 2) + "\n", "utf8");
console.log(`Kirjoitettu ${outNodes.length} solmua, ${edges.length} reunaa -> ${outPath}`);
```

- [ ] **Step 3: Run it**

Run: `npm run build:graph`
Expected: `Kirjoitettu ~60 solmua, N reunaa -> .../graph.json`.

- [ ] **Step 4: Inspect the graph**

Run: `node -e "const g=require('./data/graph.json'); console.log('nodes',g.nodes.length,'edges',g.edges.length); console.log('kinds',[...new Set(g.edges.map(e=>e.kind))]); console.log('x range',Math.min(...g.nodes.map(n=>n.x)),Math.max(...g.nodes.map(n=>n.x)))"`
Expected: nodes ~60; kinds includes `studio`/`genre`/`author`; x range within 60–940.

- [ ] **Step 5: Commit**

```powershell
git add scripts/build-graph.mjs package.json package-lock.json data/graph.json
git commit -m "Lisaa build-aikainen d3-force-verkkolayout (graph.json)"
```

---

### Task 4: Data loaders for meta + graph

**Files:**
- Modify: `src/lib/data.ts`

- [ ] **Step 1: Add imports**

In `src/lib/data.ts`, after the `import linksData ...` line (around line 19), add:

```ts
// AniListista haettu metatieto (build-time, `npm run fetch:meta`).
import metaData from "../../data/meta.json";
// Build-aikainen yhteysverkko (`npm run build:graph`).
import graphData from "../../data/graph.json";
```

- [ ] **Step 2: Add typed accessors**

In `src/lib/data.ts`, update the type import on line 1 and add accessors. Change:

```ts
import type { Member, Review, Series } from "./types";
```
to:
```ts
import type { GraphData, Member, Review, Series, SeriesMeta } from "./types";
```

Then add after the `const watchLinks = ...` line (around line 38):

```ts
const meta = metaData as Record<string, SeriesMeta>;
export const graph = graphData as GraphData;
```

And add at the end of the file:

```ts
/** Sarjan AniList-metatieto, tai null jos ei haettu. */
export function getMeta(seriesId: string): SeriesMeta | null {
  return meta[seriesId] ?? null;
}

/** Kaikki metatieto (seriesId -> SeriesMeta). */
export function getAllMeta(): Record<string, SeriesMeta> {
  return meta;
}
```

- [ ] **Step 3: Type-check**

Run: `$env:CI='1'; npm run build`
Expected: `Compiled successfully`, all pages generated. (Confirms the JSON imports type-check against `SeriesMeta`/`GraphData`.)

- [ ] **Step 4: Commit**

```powershell
git add src/lib/data.ts
git commit -m "Lisaa meta- ja graafilataajat data.ts:aan"
```

---

### Task 5: Fun-stats functions

**Files:**
- Modify: `src/lib/stats.ts` (export `countBy`)
- Create: `src/lib/fun-stats.ts`

- [ ] **Step 1: Export `countBy` from stats.ts**

In `src/lib/stats.ts`, change line 54 from:

```ts
function countBy(values: string[]): CountEntry[] {
```
to:
```ts
export function countBy(values: string[]): CountEntry[] {
```

- [ ] **Step 2: Create fun-stats.ts**

Create `src/lib/fun-stats.ts`:

```ts
import { countBy, getBestPickLeaderboard, type CountEntry } from "./stats";
import { getMeta, graph, members, reviews, series } from "./data";
import type { GraphNode, Member, Review, Series } from "./types";

const AVG_EP_MINUTES = 24;
const MIN_SHARED = 3;

export interface WatchTime {
  minutes: number;
  hours: number;
  days: number;
}

/** Arvioitu kokonaiskatseluaika kaikista metatiedon sisältävistä sarjoista. */
export function getTotalWatchTime(): WatchTime {
  let minutes = 0;
  for (const s of series) {
    const m = getMeta(s.id);
    if (!m || m.episodes == null) continue;
    minutes += m.episodes * (m.duration ?? AVG_EP_MINUTES);
  }
  return {
    minutes,
    hours: Math.round(minutes / 60),
    days: Math.round((minutes / 1440) * 10) / 10,
  };
}

/** Genrejakauma (yleisin ensin). */
export function getGenreDistribution(): CountEntry[] {
  const all: string[] = [];
  for (const s of series) {
    const m = getMeta(s.id);
    if (m) all.push(...m.genres);
  }
  return countBy(all);
}

/** Vuosikymmenjakauma, vanhimmasta uusimpaan. */
export function getDecadeDistribution(): CountEntry[] {
  const counts = new Map<number, number>();
  for (const s of series) {
    const m = getMeta(s.id);
    if (m?.year != null) {
      const decade = Math.floor(m.year / 10) * 10;
      counts.set(decade, (counts.get(decade) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, count]) => ({ label: `${decade}-luku`, count }));
}

function seriesByYear(pick: "min" | "max"): Series | null {
  let best: { series: Series; year: number } | null = null;
  for (const s of series) {
    const m = getMeta(s.id);
    if (m?.year == null) continue;
    if (!best || (pick === "min" ? m.year < best.year : m.year > best.year)) {
      best = { series: s, year: m.year };
    }
  }
  return best?.series ?? null;
}

export function getOldestSeries(): Series | null {
  return seriesByYear("min");
}

export function getNewestSeries(): Series | null {
  return seriesByYear("max");
}

const SOURCE_LABELS: Record<string, string> = {
  MANGA: "Manga",
  ORIGINAL: "Originaali",
  LIGHT_NOVEL: "Light novel",
  NOVEL: "Romaani",
  VISUAL_NOVEL: "Visual novel",
  VIDEO_GAME: "Peli",
  WEB_NOVEL: "Web-romaani",
  OTHER: "Muu",
};

/** Lähdejakauma (manga/originaali/...). */
export function getSourceDistribution(): CountEntry[] {
  const labels: string[] = [];
  for (const s of series) {
    const m = getMeta(s.id);
    if (m?.source) labels.push(SOURCE_LABELS[m.source] ?? "Muu");
  }
  return countBy(labels);
}

/** Studiojakauma (eniten esiintynyt ensin). */
export function getStudioCounts(): CountEntry[] {
  const studios: string[] = [];
  for (const s of series) {
    const m = getMeta(s.id);
    if (m?.studio) studios.push(m.studio);
  }
  return countBy(studios);
}

export function getMostConnectedAnime(): GraphNode | null {
  return [...graph.nodes].sort((a, b) => b.degree - a.degree)[0] ?? null;
}

export function getMostIsolatedAnime(): GraphNode | null {
  return [...graph.nodes].sort((a, b) => a.degree - b.degree)[0] ?? null;
}

export interface SeriesSpread {
  series: Series;
  spread: number;
  high: number;
  low: number;
  count: number;
}

/** Sarjat joilla on >=2 jäsenkohtaista arviota, pistehajonta laskettuna. */
function seriesSpreads(): SeriesSpread[] {
  const out: SeriesSpread[] = [];
  for (const s of series) {
    const rs = reviews.filter((r) => r.seriesId === s.id);
    if (rs.length < 2) continue;
    const scores = rs.map((r) => r.score);
    const high = Math.max(...scores);
    const low = Math.min(...scores);
    out.push({ series: s, spread: high - low, high, low, count: rs.length });
  }
  return out;
}

export function getMostControversial(): SeriesSpread | null {
  return [...seriesSpreads()].sort((a, b) => b.spread - a.spread)[0] ?? null;
}

export function getMostAgreed(): SeriesSpread | null {
  return [...seriesSpreads()].sort((a, b) => a.spread - b.spread || b.count - a.count)[0] ?? null;
}

export interface MemberPair {
  a: Member;
  b: Member;
  meanDiff: number;
  shared: number;
}

/** Jäsenparit, joilla on >=MIN_SHARED yhdessä arvioitua sarjaa. */
function memberPairs(): MemberPair[] {
  const officials = members.filter((m) => !m.guest);
  const byMember = new Map<string, Map<string, number>>();
  for (const r of reviews) {
    if (!byMember.has(r.memberId)) byMember.set(r.memberId, new Map());
    byMember.get(r.memberId)!.set(r.seriesId, r.score);
  }
  const pairs: MemberPair[] = [];
  for (let i = 0; i < officials.length; i++) {
    for (let j = i + 1; j < officials.length; j++) {
      const a = officials[i];
      const b = officials[j];
      const ma = byMember.get(a.id);
      const mb = byMember.get(b.id);
      if (!ma || !mb) continue;
      let sum = 0;
      let n = 0;
      for (const [seriesId, scoreA] of ma) {
        const scoreB = mb.get(seriesId);
        if (scoreB != null) {
          sum += Math.abs(scoreA - scoreB);
          n++;
        }
      }
      if (n >= MIN_SHARED) pairs.push({ a, b, meanDiff: sum / n, shared: n });
    }
  }
  return pairs;
}

/** Useimmin samaa mieltä oleva pari (pienin keskimääräinen pistero). */
export function getSoulmates(): MemberPair | null {
  return [...memberPairs()].sort((a, b) => a.meanDiff - b.meanDiff || b.shared - a.shared)[0] ?? null;
}

/** Useimmin eri mieltä oleva pari (suurin keskimääräinen pistero). */
export function getOpposites(): MemberPair | null {
  return [...memberPairs()].sort((a, b) => b.meanDiff - a.meanDiff || b.shared - a.shared)[0] ?? null;
}

export interface HottestTake {
  review: Review;
  member: Member;
  series: Series;
  clubScore: number;
  diff: number;
}

/** Yksittäinen arvio kauimpana sarjan kerhokeskiarvosta. */
export function getHottestTake(): HottestTake | null {
  let best: HottestTake | null = null;
  for (const s of series) {
    const rs = reviews.filter((r) => r.seriesId === s.id);
    if (rs.length === 0) continue;
    const base = s.clubScore ?? rs.reduce((total, r) => total + r.score, 0) / rs.length;
    for (const r of rs) {
      const diff = Math.abs(r.score - base);
      if (!best || diff > best.diff) {
        const member = members.find((m) => m.id === r.memberId);
        if (member) best = { review: r, member, series: s, clubScore: base, diff };
      }
    }
  }
  return best;
}

/** Eniten ääniä kerännyt best character (yhteisvalinnoista). */
export function getTopCharacter(): CountEntry | null {
  return getBestPickLeaderboard()[0] ?? null;
}
```

- [ ] **Step 3: Type-check**

Run: `$env:CI='1'; npm run build`
Expected: `Compiled successfully` (tsc validates fun-stats.ts even before it's imported by a page).

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```powershell
git add src/lib/stats.ts src/lib/fun-stats.ts
git commit -m "Lisaa fun-stats-funktiot ja vie countBy"
```

---

### Task 6: Generic count bar chart

**Files:**
- Create: `src/components/charts/count-bar-chart.tsx`

- [ ] **Step 1: Create the generic chart** (mirrors `best-pick-bar-chart.tsx`, parameterized by `CountEntry[]`)

```tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CountEntry } from "@/lib/stats";
import { ChartFrame } from "./chart-frame";

const ACCENT = "var(--accent)";

/** Yleinen pylväskaavio CountEntry-datalle (genre/vuosikymmen/lähde). */
export function CountBarChart({
  data,
  caption,
  valueLabel,
}: {
  data: CountEntry[];
  caption: string;
  valueLabel: string;
}) {
  return (
    <ChartFrame caption={caption}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.15} />
          <XAxis
            dataKey="label"
            tick={{ fill: "currentColor", fontSize: 12 }}
            axisLine={{ stroke: "currentColor", strokeOpacity: 0.2 }}
            tickLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "currentColor", fontSize: 12, opacity: 0.6 }}
            axisLine={false}
            tickLine={false}
            width={24}
          />
          <Tooltip
            cursor={{ fillOpacity: 0.08 }}
            formatter={(value) => [value, valueLabel]}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="count" fill={ACCENT} radius={[0, 0, 0, 0]}>
            <LabelList dataKey="count" position="top" className="fill-foreground" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
```

- [ ] **Step 2: Type-check + lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add src/components/charts/count-bar-chart.tsx
git commit -m "Lisaa yleinen CountBarChart"
```

---

### Task 7: Connections network graph (client)

**Files:**
- Create: `src/components/stats/connections-graph.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import type { GraphData, GraphEdgeKind } from "@/lib/types";

const KINDS: { id: GraphEdgeKind; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "genre", label: "Genre" },
  { id: "author", label: "Tekijä" },
];

/** Build-aikana laskettu yhteysverkko staattisena SVG:nä + hover-korostus. */
export function ConnectionsGraph({ data }: { data: GraphData }) {
  const [kind, setKind] = useState<GraphEdgeKind>("studio");
  const [hovered, setHovered] = useState<string | null>(null);

  const edges = data.edges.filter((e) => e.kind === kind);
  const nodeById = new Map(data.nodes.map((n) => [n.id, n]));

  const neighbors = new Set<string>();
  if (hovered) {
    for (const e of edges) {
      if (e.source === hovered) neighbors.add(e.target);
      if (e.target === hovered) neighbors.add(e.source);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Yhteyden tyyppi" className="flex gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={k.id === kind}
            onClick={() => setKind(k.id)}
            className={`border-2 border-foreground px-3 py-1 text-sm font-bold uppercase tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              k.id === kind ? "bg-accent text-background" : "bg-panel hover:bg-foreground/10"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="surface-flat bg-panel p-2">
        <svg viewBox="0 0 1000 1000" className="h-auto w-full" role="img" aria-label="Animeiden yhteysverkko">
          {edges.map((e, i) => {
            const a = nodeById.get(e.source);
            const b = nodeById.get(e.target);
            if (!a || !b) return null;
            const active = hovered != null && (e.source === hovered || e.target === hovered);
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={active ? "var(--accent)" : "currentColor"}
                strokeOpacity={hovered == null ? 0.25 : active ? 0.9 : 0.06}
                strokeWidth={active ? 3 : 1.5}
              />
            );
          })}
          {data.nodes.map((n) => {
            const isHovered = n.id === hovered;
            const isNeighbor = neighbors.has(n.id);
            const dim = hovered != null && !isHovered && !isNeighbor;
            const size = 10 + Math.min(n.degree, 8) * 1.5;
            return (
              <g
                key={n.id}
                opacity={dim ? 0.25 : 1}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                className="cursor-pointer"
              >
                <rect
                  x={n.x - size / 2}
                  y={n.y - size / 2}
                  width={size}
                  height={size}
                  fill={isHovered ? "var(--accent)" : "var(--color-foreground)"}
                  stroke="var(--color-foreground)"
                  strokeWidth={2}
                />
                {(isHovered || isNeighbor) && (
                  <text
                    x={n.x + size / 2 + 4}
                    y={n.y + 4}
                    fontSize={isHovered ? 18 : 14}
                    fontWeight={700}
                    fill="var(--color-foreground)"
                  >
                    {n.title}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-xs text-muted">Vie kursori animen päälle nähdäksesi sen yhteydet.</p>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add src/components/stats/connections-graph.tsx
git commit -m "Lisaa ConnectionsGraph-verkkokaavio"
```

---

### Task 8: Stat presentation cards

**Files:**
- Create: `src/components/stats/stat-cards.tsx`

- [ ] **Step 1: Create the cards module**

```tsx
import type { ReactNode } from "react";

/** Iso brutalist hero-numero. */
export function StatHero({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="surface flex flex-col gap-1 p-5">
      <span className="font-mono text-5xl font-bold text-accent">{value}</span>
      <span className="text-sm font-bold uppercase tracking-tight">{label}</span>
      {sub ? <span className="text-sm text-muted">{sub}</span> : null}
    </div>
  );
}

/** Pieni faktakortti otsikolla + sisällöllä. */
export function FunFactCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="surface flex flex-col gap-1 p-4">
      <span className="font-mono text-xs font-bold uppercase tracking-wide text-muted">{title}</span>
      <div className="text-base font-bold uppercase tracking-tight">{children}</div>
    </div>
  );
}

/** Jäsenparikortti (sielunkumppanit / vastakohdat). */
export function PairCard({
  title,
  nameA,
  nameB,
  detail,
}: {
  title: string;
  nameA: string;
  nameB: string;
  detail: string;
}) {
  return (
    <div className="surface flex flex-col gap-2 p-4">
      <span className="font-mono text-xs font-bold uppercase tracking-wide text-muted">{title}</span>
      <div className="flex items-center gap-2 text-lg font-bold uppercase tracking-tight">
        <span>{nameA}</span>
        <span className="text-accent">+</span>
        <span>{nameB}</span>
      </div>
      <span className="text-sm text-muted">{detail}</span>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```powershell
git add src/components/stats/stat-cards.tsx
git commit -m "Lisaa tilastokortit (hero/fakta/pari)"
```

---

### Task 9: The /tilastot page

**Files:**
- Create: `src/app/tilastot/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/tilastot/page.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CountBarChart } from "@/components/charts/count-bar-chart";
import { ConnectionsGraph } from "@/components/stats/connections-graph";
import { FunFactCard, PairCard, StatHero } from "@/components/stats/stat-cards";
import { getMeta, graph } from "@/lib/data";
import {
  getDecadeDistribution,
  getGenreDistribution,
  getHottestTake,
  getMostAgreed,
  getMostConnectedAnime,
  getMostControversial,
  getMostIsolatedAnime,
  getNewestSeries,
  getOldestSeries,
  getOpposites,
  getSoulmates,
  getSourceDistribution,
  getStudioCounts,
  getTopCharacter,
  getTotalWatchTime,
} from "@/lib/fun-stats";
import { formatScore } from "@/lib/stats";

export const metadata: Metadata = { title: "Tilastot" };

function seriesLink(id: string, title: string) {
  return (
    <Link href={`/sarja/${id}`} className="underline decoration-accent decoration-2 underline-offset-2">
      {title}
    </Link>
  );
}

export default function StatsPage() {
  const watch = getTotalWatchTime();
  const controversial = getMostControversial();
  const agreed = getMostAgreed();
  const mostConnected = getMostConnectedAnime();
  const isolated = getMostIsolatedAnime();
  const genres = getGenreDistribution().slice(0, 8);
  const decades = getDecadeDistribution();
  const sources = getSourceDistribution();
  const studios = getStudioCounts().slice(0, 6);
  const oldest = getOldestSeries();
  const newest = getNewestSeries();
  const soulmates = getSoulmates();
  const opposites = getOpposites();
  const hottest = getHottestTake();
  const topCharacter = getTopCharacter();

  const sampleNote = "Perustuu sarjoihin, joissa on jäsenkohtaiset arviot.";

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">Tilastot</h1>
        <p className="max-w-prose text-muted">
          Turhaa ja hauskaa dataa kerhon animeista ja niiden yhteyksistä.
        </p>
      </section>

      {/* Hero */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatHero
          value={`${watch.hours} h`}
          label="Kokonaiskatseluaika"
          sub={`≈ ${watch.days} päivää putkeen`}
        />
        {controversial ? (
          <FunFactCard title="Kiistellyin anime">
            {seriesLink(controversial.series.id, controversial.series.title)}{" "}
            <span className="text-muted">
              (hajonta {formatScore(controversial.spread)})
            </span>
          </FunFactCard>
        ) : null}
        {mostConnected ? (
          <FunFactCard title="Eniten yhteyksiä">
            {seriesLink(mostConnected.id, mostConnected.title)}{" "}
            <span className="text-muted">({mostConnected.degree})</span>
          </FunFactCard>
        ) : null}
      </section>

      {/* Yhteyksien verkko */}
      <section className="flex flex-col gap-4">
        <h2 className="sec-title w-fit text-lg">Yhteyksien verkko</h2>
        <ConnectionsGraph data={graph} />
        <div className="grid gap-4 sm:grid-cols-2">
          {mostConnected ? (
            <FunFactCard title="Verkostoitunein">
              {seriesLink(mostConnected.id, mostConnected.title)} — {mostConnected.degree} yhteyttä
            </FunFactCard>
          ) : null}
          {isolated ? (
            <FunFactCard title="Eristäytynein">
              {seriesLink(isolated.id, isolated.title)} — {isolated.degree} yhteyttä
            </FunFactCard>
          ) : null}
        </div>
      </section>

      {/* Animet numeroina */}
      <section className="flex flex-col gap-4">
        <h2 className="sec-title w-fit text-lg">Animet numeroina</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="surface-flat p-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-tight">Genret</h3>
            <CountBarChart data={genres} caption={`Genret: ${genres.map((g) => `${g.label} ${g.count}`).join(", ")}.`} valueLabel="Sarjoja" />
          </div>
          <div className="surface-flat p-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-tight">Vuosikymmenet</h3>
            <CountBarChart data={decades} caption={`Vuosikymmenet: ${decades.map((d) => `${d.label} ${d.count}`).join(", ")}.`} valueLabel="Sarjoja" />
          </div>
          <div className="surface-flat p-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-tight">Lähde</h3>
            <CountBarChart data={sources} caption={`Lähteet: ${sources.map((s) => `${s.label} ${s.count}`).join(", ")}.`} valueLabel="Sarjoja" />
          </div>
          <div className="surface-flat flex flex-col gap-2 p-4">
            <h3 className="text-sm font-bold uppercase tracking-tight">Studiot</h3>
            <ul className="flex flex-col divide-y-2 divide-foreground/15">
              {studios.map((s) => (
                <li key={s.label} className="flex items-center justify-between py-1.5">
                  <span className="font-bold uppercase tracking-tight">{s.label}</span>
                  <span className="font-mono font-bold text-accent">{s.count}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted">
              {oldest ? <span>Vanhin: {seriesLink(oldest.id, oldest.title)} ({getMeta(oldest.id)?.year})</span> : null}
              {newest ? <span>Uusin: {seriesLink(newest.id, newest.title)} ({getMeta(newest.id)?.year})</span> : null}
            </div>
          </div>
        </div>
      </section>

      {/* Kerho erimielisinä */}
      <section className="flex flex-col gap-4">
        <h2 className="sec-title w-fit text-lg">Kerho erimielisinä</h2>
        <p className="text-xs text-muted">{sampleNote}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {soulmates ? (
            <PairCard
              title="Sielunkumppanit"
              nameA={soulmates.a.name}
              nameB={soulmates.b.name}
              detail={`Keskim. pistero ${formatScore(soulmates.meanDiff)} (${soulmates.shared} yhteistä sarjaa)`}
            />
          ) : null}
          {opposites ? (
            <PairCard
              title="Vastakohdat"
              nameA={opposites.a.name}
              nameB={opposites.b.name}
              detail={`Keskim. pistero ${formatScore(opposites.meanDiff)} (${opposites.shared} yhteistä sarjaa)`}
            />
          ) : null}
          {controversial ? (
            <FunFactCard title="Kiistellyin">
              {seriesLink(controversial.series.id, controversial.series.title)} — pisteet {formatScore(controversial.low)}–{formatScore(controversial.high)}
            </FunFactCard>
          ) : null}
          {agreed ? (
            <FunFactCard title="Yksimielisin">
              {seriesLink(agreed.series.id, agreed.series.title)} — hajonta {formatScore(agreed.spread)}
            </FunFactCard>
          ) : null}
          {hottest ? (
            <FunFactCard title="Rohkein mielipide">
              {hottest.member.name} antoi {seriesLink(hottest.series.id, hottest.series.title)}: {formatScore(hottest.review.score)} (kerho {formatScore(hottest.clubScore)})
            </FunFactCard>
          ) : null}
        </div>
      </section>

      {/* Best character */}
      <section className="flex flex-col gap-4">
        <h2 className="sec-title w-fit text-lg">Best character</h2>
        {topCharacter ? (
          <FunFactCard title="Eniten ääniä kerännyt hahmo">
            {topCharacter.label} — {topCharacter.count} ääntä
          </FunFactCard>
        ) : (
          <p className="text-muted">Ei vielä valintoja.</p>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Build + lint**

Run: `$env:CI='1'; npm run build`
Expected: `Compiled successfully`; the static pages count increases by 1 (new `/tilastot`).

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open `http://localhost:3000/tilastot`.
Expected: hero numbers, a hoverable network graph (toggle studio/genre/tekijä), genre/decade/source charts, studio list, soulmates/opposites/controversy cards, top character. Hovering a node highlights its edges + shows titles.

- [ ] **Step 4: Commit**

```powershell
git add src/app/tilastot/page.tsx
git commit -m "Lisaa Tilastot-sivu"
```

---

### Task 10: Add Tilastot to nav

**Files:**
- Modify: `src/components/site-header.tsx:12-18`

- [ ] **Step 1: Add the nav item**

In `src/components/site-header.tsx`, change the `NAV_ITEMS` array to add a Tilastot entry after Hall of Fame:

```ts
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Etusivu" },
  { href: "/sarjat", label: "Sarjat", matchPrefix: "/sarja" },
  { href: "/jasenet", label: "Jäsenet", matchPrefix: "/jasen" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/aikajana", label: "Aikajana" },
  { href: "/tilastot", label: "Tilastot" },
];
```

- [ ] **Step 2: Build + lint**

Run: `$env:CI='1'; npm run build` then `npm run lint`
Expected: success; nav shows Tilastot.

- [ ] **Step 3: Commit**

```powershell
git add src/components/site-header.tsx
git commit -m "Lisaa Tilastot navigaatioon"
```

---

### Task 11: Rename "best girl/boy" → "Best character" (site-wide)

**Files (user-facing strings only):**
- Modify: `src/app/aikajana/page.tsx:56`
- Modify: `src/components/charts/best-pick-bar-chart.tsx:21`
- Modify: `src/app/layout.tsx:33`
- Modify: `src/app/page.tsx:162`
- Modify: `src/app/sarjat/page.tsx:18`
- Modify: `src/app/jasenet/page.tsx:18`
- Modify: `src/app/sarja/[id]/page.tsx:128,160`

- [ ] **Step 1: Apply the edits**

Make these exact replacements (left → right):

1. `src/app/aikajana/page.tsx` — ` · best girl/boy: ${entry.bestPick}` → ` · Best character: ${entry.bestPick}`
2. `src/components/charts/best-pick-bar-chart.tsx` — `"Best girl/boy -äänet: "` → `"Best character -äänet: "`
3. `src/app/layout.tsx` — `arkisto: arvostelut, best girl/boy -äänet ja tilastot.` → `arkisto: arvostelut, Best character -äänet ja tilastot.`
4. `src/app/page.tsx` — `Best girl/boy — {latestRated.title}` → `Best character — {latestRated.title}`
5. `src/app/sarjat/page.tsx` — `best girl/boy -valinnan` → `Best character -valinnan`
6. `src/app/jasenet/page.tsx` — `best girl/boy` → `Best character` (the line ending `...arvionsa ja best girl/boy`)
7. `src/app/sarja/[id]/page.tsx` line 128 — `Kerhon lempihahmo (best girl/boy)` → `Kerhon lempihahmo (Best character)`
8. `src/app/sarja/[id]/page.tsx` line 160 — `Best girl/boy -äänet` → `Best character -äänet`

(Code identifiers like `bestPick`, `getBestPickLeaderboard`, and `// Best girl/boy` *comments* are left unchanged — only user-visible text changes.)

- [ ] **Step 2: Verify no user-facing occurrences remain**

Run: `npm run lint`
Expected: no errors.

Then visually confirm via grep that remaining `girl/boy` hits are only code comments / identifiers:
Run: `node -e "console.log('grep manually')"` — instead use your editor's search for `girl/boy`; acceptable remaining hits: `stats.ts` comments (lines ~64,74), `data.ts` comment (~85), `types.ts` comments (~6,34,49). No `.tsx` rendered-string hits should remain.

- [ ] **Step 3: Build + commit**

Run: `$env:CI='1'; npm run build`
Expected: `Compiled successfully`.

```powershell
git add src/app src/components
git commit -m "Vaihda best girl/boy -> Best character koko sivustolla"
```

---

## Self-Review

**Spec coverage:**
- AniList meta fetch (genres, studio, year, episodes, duration, format, source, author, relations) → Task 1 ✓
- d3-force build-time layout, union edges, deterministic, viewBox-normalized, degree → Task 3 ✓
- Types + loaders → Tasks 2, 4 ✓
- Fun-stats (watch time, genre, decade, source, studio, controversy, agreement pairs ≥3, hottest take, most/least connected, top character) → Task 5 ✓
- Generic charts via ChartFrame → Task 6 ✓
- Connections graph client component with toggle + hover → Task 7 ✓
- Cards → Task 8 ✓
- Page with all five sections + sample-size note → Task 9 ✓
- Nav item → Task 10 ✓
- Site-wide rename → Task 11 ✓
- Genre-edge ≥2 threshold → Task 3 ✓; pair ≥3 / controversy ≥2 → Task 5 ✓

**Placeholder scan:** All steps contain complete code. No TBD/TODO/stubs remain. Task 9 creates the page directly from its full implementation.

**Type consistency:** `CountEntry` (from stats.ts) used by `CountBarChart` and fun-stats ✓. `GraphData`/`GraphEdgeKind`/`GraphNode` defined in Task 2, consumed in Tasks 4/7/9 ✓. `getTotalWatchTime`/`getMostControversial`/`getSoulmates`/`getTopCharacter` etc. names match between Task 5 definitions and Task 9 imports ✓. `graph` exported from data.ts (Task 4) and imported in Task 9 ✓. `getMeta` imported in Task 9 is defined in Task 4 ✓.
