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
