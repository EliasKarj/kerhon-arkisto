import type { Member, Review, Series } from "./types";

// V1: data luetaan suoraan staattisista JSON-tiedostoista (`/data`).
// JSON-importin päättelemät tyypit ovat laveampia (esim. `type: string`),
// joten kavennetaan ne domain-tyyppeihin tässä yhdessä paikassa.
import membersData from "../../data/members.json";
import seriesData from "../../data/series.json";
import reviewsData from "../../data/reviews.json";

export const members: Member[] = membersData;
export const series: Series[] = seriesData as Series[];
export const reviews: Review[] = reviewsData as Review[];

export function getMemberById(id: string): Member | undefined {
  return members.find((member) => member.id === id);
}

export function getSeriesById(id: string): Series | undefined {
  return series.find((entry) => entry.id === id);
}

/** Kaikki tietyn sarjan arviot. */
export function getReviewsForSeries(seriesId: string): Review[] {
  return reviews.filter((review) => review.seriesId === seriesId);
}

/** Kaikki tietyn jäsenen arviot. */
export function getReviewsForMember(memberId: string): Review[] {
  return reviews.filter((review) => review.memberId === memberId);
}

/** Sarjat uusimmasta vanhimpaan (aikajanaa ja "viimeksi katsottua" varten). */
export function getSeriesByYearDesc(): Series[] {
  return [...series].sort((a, b) => b.year - a.year);
}
