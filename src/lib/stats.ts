import {
  getReviewsForMember,
  getSeriesById,
  getSeriesProposedBy,
  members,
  series as allSeries,
} from "./data";
import type { Member, Review, Series } from "./types";

/** Keskiarvo pisteistä, tai null jos arvioita ei ole. */
export function getAverageScore(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, review) => total + review.score, 0);
  return sum / reviews.length;
}

/** Sarjan kerhon yhteisarvosana (tilastodatasta), tai null jos ei arvioitu. */
export function getSeriesScore(seriesId: string): number | null {
  return getSeriesById(seriesId)?.clubScore ?? null;
}

/** Kaikki arvioidut sarjat (joilla on yhteisarvosana). */
export function getRatedSeries(): Series[] {
  return allSeries.filter((entry) => entry.clubScore !== null);
}

/** Koko kerhon keskiarvo kaikista arvioiduista sarjoista. */
export function getClubAverageScore(): number | null {
  const rated = getRatedSeries();
  if (rated.length === 0) return null;
  const sum = rated.reduce((total, entry) => total + (entry.clubScore ?? 0), 0);
  return sum / rated.length;
}

/** Jäsenen kirjaamien arvioiden keskiarvo (vain detaljiarvioista). */
export function getMemberReviewAverage(memberId: string): number | null {
  return getAverageScore(getReviewsForMember(memberId));
}

/** Jäsenen ehdottamien arvioitujen sarjojen keskiarvo. */
export function getMemberProposedAverage(memberId: string): number | null {
  const rated = getSeriesProposedBy(memberId).filter((entry) => entry.clubScore !== null);
  if (rated.length === 0) return null;
  const sum = rated.reduce((total, entry) => total + (entry.clubScore ?? 0), 0);
  return sum / rated.length;
}

export interface CountEntry {
  label: string;
  count: number;
}

/** Yleinen laskuri: ryhmittelee arvot ja lajittelee yleisimmästä harvinaisimpaan. */
function countBy(values: string[]): CountEntry[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fi"));
}

/** Best girl/boy -äänten jakauma annetuista (jäsenkohtaisista) arvioista. */
export function getBestPickCounts(reviews: Review[]): CountEntry[] {
  return countBy(reviews.map((review) => review.bestPick));
}

/** Tagien esiintymät annetuista arvioista. */
export function getTagCounts(reviews: Review[]): CountEntry[] {
  return countBy(reviews.flatMap((review) => review.tags));
}

/** Kaikkien aikojen best girl/boy -leaderboard sarjojen yhteisvalinnoista. */
export function getBestPickLeaderboard(): CountEntry[] {
  const picks = allSeries
    .map((entry) => entry.bestPick)
    .filter((pick): pick is string => pick !== null);
  return countBy(picks);
}

/** Korkeimmin arvioidut sarjat (Top). */
export function getTopSeries(limit: number): Series[] {
  return getRatedSeries()
    .slice()
    .sort((a, b) => (b.clubScore ?? 0) - (a.clubScore ?? 0))
    .slice(0, limit);
}

/** Matalimmin arvioidut sarjat (Bottom). */
export function getBottomSeries(limit: number): Series[] {
  return getRatedSeries()
    .slice()
    .sort((a, b) => (a.clubScore ?? 0) - (b.clubScore ?? 0))
    .slice(0, limit);
}

export interface SeasonAverage {
  season: number;
  average: number;
}

/** Kausien keskiarvot (kuten tilaston "Kausien keskiarvot" -kaavio). */
export function getSeasonAverages(): SeasonAverage[] {
  const bySeason = new Map<number, number[]>();
  for (const entry of getRatedSeries()) {
    const list = bySeason.get(entry.clubSeason) ?? [];
    list.push(entry.clubScore ?? 0);
    bySeason.set(entry.clubSeason, list);
  }
  return [...bySeason.entries()]
    .map(([season, scores]) => ({
      season,
      average: scores.reduce((total, score) => total + score, 0) / scores.length,
    }))
    .sort((a, b) => a.season - b.season);
}

export interface ReviewerStanding {
  member: Member;
  average: number;
}

export interface ReviewerExtremes {
  /** Matalin keskiarvo = tiukin arvioija. */
  strictest: ReviewerStanding;
  /** Korkein keskiarvo = löysin arvioija. */
  loosest: ReviewerStanding;
}

/** Tiukin ja löysin arvioija kirjattujen detaljiarvioiden keskiarvon perusteella. */
export function getReviewerExtremes(): ReviewerExtremes | null {
  const standings: ReviewerStanding[] = members
    .map((member) => ({ member, average: getMemberReviewAverage(member.id) }))
    .filter((standing): standing is ReviewerStanding => standing.average !== null);

  if (standings.length === 0) return null;

  let strictest = standings[0];
  let loosest = standings[0];
  for (const standing of standings) {
    if (standing.average < strictest.average) strictest = standing;
    if (standing.average > loosest.average) loosest = standing;
  }
  return { strictest, loosest };
}

/** Pisteiden muotoilu UI:hin, esim. 4.6. Tyhjälle (null) palautetaan viiva. */
export function formatScore(value: number | null, digits = 1): string {
  if (value === null) return "–";
  return value.toFixed(digits);
}

// Käytetään edelleen alias-nimellä sarjan pistemäärälle.
export { getSeriesScore as getSeriesAverageScore };
