import {
  getReviewsForMember,
  getReviewsForSeries,
  members,
  reviews as allReviews,
} from "./data";
import type { Member, Review } from "./types";

/** Keskiarvo pisteistä, tai null jos arvioita ei ole. */
export function getAverageScore(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((total, review) => total + review.score, 0);
  return sum / reviews.length;
}

export function getSeriesAverageScore(seriesId: string): number | null {
  return getAverageScore(getReviewsForSeries(seriesId));
}

export function getMemberAverageScore(memberId: string): number | null {
  return getAverageScore(getReviewsForMember(memberId));
}

/** Koko kerhon keskiarvo kaikista arvioista. */
export function getClubAverageScore(): number | null {
  return getAverageScore(allReviews);
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

/** Best girl/boy -äänten jakauma annetuista arvioista. */
export function getBestPickCounts(reviews: Review[]): CountEntry[] {
  return countBy(reviews.map((review) => review.bestPick));
}

/** Tagien esiintymät annetuista arvioista (jäsenen suosikkigenret/-tagit). */
export function getTagCounts(reviews: Review[]): CountEntry[] {
  return countBy(reviews.flatMap((review) => review.tags));
}

/** Kaikkien aikojen best girl/boy -leaderboard (Hall of Fame). */
export function getBestPickLeaderboard(): CountEntry[] {
  return getBestPickCounts(allReviews);
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

/** Tiukin ja löysin arvioija keskiarvon perusteella (Hall of Famen tilastokulma). */
export function getReviewerExtremes(): ReviewerExtremes | null {
  const standings: ReviewerStanding[] = members
    .map((member) => ({ member, average: getMemberAverageScore(member.id) }))
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
