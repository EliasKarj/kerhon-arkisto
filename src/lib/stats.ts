import { reviewsForMember, seriesProposedBy } from "./queries";
import type { Member, Review, Series } from "./types";

/** Keskiarvo pisteistä, tai null jos arvioita ei ole. */
export function getAverageScore(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, review) => total + review.score, 0);
  return sum / reviews.length;
}

/** Sarjan näytettävä arvosana (review-keskiarvo ?? clubScore), tai null jos ei arvioitu. */
export function getSeriesScore(series: Series[], seriesId: string): number | null {
  return series.find((s) => s.id === seriesId)?.displayScore ?? null;
}

/** Kaikki arvioidut sarjat (joilla on displayScore). */
export function getRatedSeries(series: Series[]): Series[] {
  return series.filter((entry) => entry.displayScore !== null);
}

/** Koko kerhon keskiarvo kaikista arvioiduista sarjoista. */
export function getClubAverageScore(series: Series[]): number | null {
  const rated = getRatedSeries(series);
  if (rated.length === 0) return null;
  const sum = rated.reduce((total, entry) => total + (entry.displayScore ?? 0), 0);
  return sum / rated.length;
}

/** Jäsenen kirjaamien arvioiden keskiarvo (vain detaljiarvioista). */
export function getMemberReviewAverage(reviews: Review[], memberId: string): number | null {
  return getAverageScore(reviewsForMember(reviews, memberId));
}

/** Jäsenen ehdottamien arvioitujen sarjojen keskiarvo. */
export function getMemberProposedAverage(series: Series[], memberId: string): number | null {
  const rated = seriesProposedBy(series, memberId).filter((entry) => entry.displayScore !== null);
  if (rated.length === 0) return null;
  const sum = rated.reduce((total, entry) => total + (entry.displayScore ?? 0), 0);
  return sum / rated.length;
}

export interface CountEntry {
  label: string;
  count: number;
}

/** Yleinen laskuri: ryhmittelee arvot ja lajittelee yleisimmästä harvinaisimpaan. */
export function countBy(values: string[]): CountEntry[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fi"));
}

/** Best character -äänten jakauma annetuista (jäsenkohtaisista) arvioista. */
export function getBestPickCounts(reviews: Review[]): CountEntry[] {
  return countBy(reviews.map((review) => review.bestPick));
}

/** Tagien esiintymät annetuista arvioista. */
export function getTagCounts(reviews: Review[]): CountEntry[] {
  return countBy(reviews.flatMap((review) => review.tags));
}

/** Kaikkien aikojen best character -leaderboard sarjojen yhteisvalinnoista. */
export function getBestPickLeaderboard(series: Series[]): CountEntry[] {
  const picks = series
    .map((entry) => entry.bestPick)
    .filter((pick): pick is string => pick !== null);
  return countBy(picks);
}

/** Korkeimmin arvioidut sarjat (Top). */
export function getTopSeries(series: Series[], limit: number): Series[] {
  return getRatedSeries(series)
    .slice()
    .sort((a, b) => (b.displayScore ?? 0) - (a.displayScore ?? 0))
    .slice(0, limit);
}

/** Matalimmin arvioidut sarjat (Bottom). */
export function getBottomSeries(series: Series[], limit: number): Series[] {
  return getRatedSeries(series)
    .slice()
    .sort((a, b) => (a.displayScore ?? 0) - (b.displayScore ?? 0))
    .slice(0, limit);
}

export interface SeasonAverage {
  season: number;
  average: number;
}

/** Kausien keskiarvot. */
export function getSeasonAverages(series: Series[]): SeasonAverage[] {
  const bySeason = new Map<number, number[]>();
  for (const entry of getRatedSeries(series)) {
    const list = bySeason.get(entry.clubSeason) ?? [];
    list.push(entry.displayScore ?? 0);
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
export function getReviewerExtremes(members: Member[], reviews: Review[]): ReviewerExtremes | null {
  const standings: ReviewerStanding[] = members
    .map((member) => ({ member, average: getMemberReviewAverage(reviews, member.id) }))
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
