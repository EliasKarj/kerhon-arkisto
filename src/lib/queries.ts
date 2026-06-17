import type { Review, Series } from "./types";

/** Kaikki tietyn jäsenen kirjaamat arviot. */
export function reviewsForMember(reviews: Review[], memberId: string): Review[] {
  return reviews.filter((r) => r.memberId === memberId);
}

/** Jäsenen ehdottamat sarjat, uusin ensin. */
export function seriesProposedBy(series: Series[], memberId: string): Series[] {
  return series
    .filter((s) => s.proposerId === memberId)
    .sort((a, b) => b.watchedDate.localeCompare(a.watchedDate));
}
