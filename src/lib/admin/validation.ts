export interface ReviewInput {
  memberId: string | null;
  guestName: string | null;
  score: number;
  bulletPoints: string[];
  bestPick: string;
  tags: string[];
}

export interface ClubNightInput {
  anilistId: number | null;
  manualTitle: string | null;
  manualType: "anime" | "movie" | "series" | null;
  clubSeason: number;
  watchedDate: string;
  proposerId: string;
  clubScore: number | null;
  bestPick: string | null;
  reviews: ReviewInput[];
}

export function slugify(title: string): string {
  const s = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "sarja";
}

export function uniqueId(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function reviewId(seriesId: string, memberId: string): string {
  return `${seriesId}-${memberId}`;
}

function inRange(n: number): boolean {
  return n >= 0 && n <= 5;
}

/** Palauttaa virheviestit (tyhjä = kelvollinen). */
export function validateClubNight(input: ClubNightInput): string[] {
  const errors: string[] = [];
  if (!input.anilistId && !input.manualTitle?.trim()) {
    errors.push("Anime (AniList) tai manuaalinen nimi vaaditaan.");
  }
  if (!input.clubSeason || input.clubSeason < 1) errors.push("Kausi vaaditaan.");
  if (!input.watchedDate) errors.push("Kokouspäivä vaaditaan.");
  if (!input.proposerId) errors.push("Ehdottaja vaaditaan.");
  if (input.clubScore != null && !inRange(input.clubScore)) errors.push("Kerhon pisteet 0–5.");
  input.reviews.forEach((r, i) => {
    if (!r.memberId && !r.guestName?.trim()) errors.push(`Arvio ${i + 1}: valitse arvioija tai anna vieraan nimi.`);
    if (!inRange(r.score)) errors.push(`Arvio ${i + 1}: pisteet 0–5.`);
  });
  return errors;
}
