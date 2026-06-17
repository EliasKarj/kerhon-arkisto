import { countBy, getBestPickLeaderboard, type CountEntry } from "./stats";
import { getMeta, graph } from "./data";
import type { GraphNode, Member, Review, Series } from "./types";

const AVG_EP_MINUTES = 24;
const MIN_SHARED = 3;
// Kerho katsoo sarjasta tyypillisesti ~yhden kauden (enintään tämän verran
// jaksoja); lyhyemmät sarjat lasketaan kokonaan. Elokuvilla episodes = 1, joten
// niihin tämä ei vaikuta (täysi kesto duration-kentästä).
const EPISODE_CAP = 12;

export interface WatchTime {
  minutes: number;
  hours: number;
  days: number;
}

/**
 * Arvioitu kokonaiskatseluaika: sarjoista lasketaan enintään {@link EPISODE_CAP}
 * jaksoa (kerho katsoo yleensä ~yhden kauden), elokuvat täydellä kestolla.
 */
export function getTotalWatchTime(series: Series[]): WatchTime {
  let minutes = 0;
  for (const s of series) {
    const m = getMeta(s);
    if (!m || m.episodes == null) continue;
    const episodes = Math.min(m.episodes, EPISODE_CAP);
    minutes += episodes * (m.duration ?? AVG_EP_MINUTES);
  }
  return {
    minutes,
    hours: Math.round(minutes / 60),
    days: Math.round((minutes / 1440) * 10) / 10,
  };
}

/** Yksi kaavion pylväs: otsikko, määrä ja siihen kuuluvat animet (hover-tooltipiin). */
export interface CountBucket {
  label: string;
  count: number;
  titles: string[];
}

/** Ryhmittelee (otsikko, animenimi) -parit pylväiksi; suurin ensin. */
function bucketBy(entries: { label: string; title: string }[]): CountBucket[] {
  const map = new Map<string, string[]>();
  for (const entry of entries) {
    const list = map.get(entry.label) ?? [];
    list.push(entry.title);
    map.set(entry.label, list);
  }
  return [...map.entries()]
    .map(([label, titles]) => ({ label, count: titles.length, titles }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fi"));
}

/** Genrejakauma (yleisin ensin), kukin pylväs sisältää animet. */
export function getGenreDistribution(series: Series[]): CountBucket[] {
  const entries: { label: string; title: string }[] = [];
  for (const s of series) {
    const m = getMeta(s);
    if (m) for (const g of m.genres) entries.push({ label: g, title: s.title });
  }
  return bucketBy(entries);
}

/** Vuosikymmenjakauma, vanhimmasta uusimpaan, kukin pylväs sisältää animet. */
export function getDecadeDistribution(series: Series[]): CountBucket[] {
  const entries: { label: string; title: string }[] = [];
  for (const s of series) {
    const m = getMeta(s);
    if (m?.year != null) {
      entries.push({ label: `${Math.floor(m.year / 10) * 10}-luku`, title: s.title });
    }
  }
  return bucketBy(entries).sort((a, b) => parseInt(a.label, 10) - parseInt(b.label, 10));
}

function seriesByYear(series: Series[], pick: "min" | "max"): Series | null {
  let best: { series: Series; year: number } | null = null;
  for (const s of series) {
    const m = getMeta(s);
    if (m?.year == null) continue;
    if (!best || (pick === "min" ? m.year < best.year : m.year > best.year)) {
      best = { series: s, year: m.year };
    }
  }
  return best?.series ?? null;
}

export function getOldestSeries(series: Series[]): Series | null {
  return seriesByYear(series, "min");
}

export function getNewestSeries(series: Series[]): Series | null {
  return seriesByYear(series, "max");
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

/** Lähdejakauma (manga/originaali/...), kukin pylväs sisältää animet. */
export function getSourceDistribution(series: Series[]): CountBucket[] {
  const entries: { label: string; title: string }[] = [];
  for (const s of series) {
    const m = getMeta(s);
    if (m?.source) entries.push({ label: SOURCE_LABELS[m.source] ?? "Muu", title: s.title });
  }
  return bucketBy(entries);
}

/** Studiojakauma (eniten esiintynyt ensin). */
export function getStudioCounts(series: Series[]): CountEntry[] {
  const studios: string[] = [];
  for (const s of series) {
    const m = getMeta(s);
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
function seriesSpreads(series: Series[], reviews: Review[]): SeriesSpread[] {
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

export function getMostControversial(series: Series[], reviews: Review[]): SeriesSpread | null {
  return [...seriesSpreads(series, reviews)].sort((a, b) => b.spread - a.spread)[0] ?? null;
}

export function getMostAgreed(series: Series[], reviews: Review[]): SeriesSpread | null {
  return (
    [...seriesSpreads(series, reviews)].sort((a, b) => a.spread - b.spread || b.count - a.count)[0] ??
    null
  );
}

export interface MemberPair {
  a: Member;
  b: Member;
  meanDiff: number;
  shared: number;
}

/** Jäsenparit, joilla on >=MIN_SHARED yhdessä arvioitua sarjaa. */
function memberPairs(members: Member[], reviews: Review[]): MemberPair[] {
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

/** Useimmin samaa mieltä oleva pari (pienin keskimääräinen piste-ero). */
export function getSoulmates(members: Member[], reviews: Review[]): MemberPair | null {
  return (
    [...memberPairs(members, reviews)].sort((a, b) => a.meanDiff - b.meanDiff || b.shared - a.shared)[0] ??
    null
  );
}

/** Useimmin eri mieltä oleva pari (suurin keskimääräinen piste-ero). */
export function getOpposites(members: Member[], reviews: Review[]): MemberPair | null {
  return (
    [...memberPairs(members, reviews)].sort((a, b) => b.meanDiff - a.meanDiff || b.shared - a.shared)[0] ??
    null
  );
}

export interface HottestTake {
  review: Review;
  member: Member;
  series: Series;
  clubScore: number;
  diff: number;
}

/** Yksittäinen arvio kauimpana sarjan kerhokeskiarvosta. */
export function getHottestTake(
  series: Series[],
  reviews: Review[],
  members: Member[],
): HottestTake | null {
  let best: HottestTake | null = null;
  for (const s of series) {
    const rs = reviews.filter((r) => r.seriesId === s.id);
    if (rs.length === 0) continue;
    const base = s.displayScore ?? rs.reduce((total, r) => total + r.score, 0) / rs.length;
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
export function getTopCharacter(series: Series[]): CountEntry | null {
  return getBestPickLeaderboard(series)[0] ?? null;
}
