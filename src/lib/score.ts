import type { Review } from "./types";

/** Näytettävä pistemäärä: arvioiden keskiarvo jos arvioita on, muuten tallennettu clubScore. */
export function computeDisplayScore(reviews: Review[], clubScore: number | null): number | null {
  if (reviews.length > 0) {
    const sum = reviews.reduce((total, r) => total + r.score, 0);
    return sum / reviews.length;
  }
  return clubScore;
}
