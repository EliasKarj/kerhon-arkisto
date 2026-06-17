export interface MyReviewInput {
  score: number;
  bestPick: string;
  bulletPoints: string[];
  tags: string[];
}

function inRange(n: number): boolean {
  return typeof n === "number" && !Number.isNaN(n) && n >= 0 && n <= 5;
}

/** Palauttaa virheviestit (tyhjä = kelvollinen). */
export function validateMyReview(input: MyReviewInput): string[] {
  const errors: string[] = [];
  if (!inRange(input.score)) errors.push("Pisteet 0–5.");
  return errors;
}

/** Siivoaa syötteen DB-riviä varten: trimmaa, pudottaa tyhjät bulletit/tagit. */
export function sanitizeMyReview(input: MyReviewInput): MyReviewInput {
  return {
    score: input.score,
    bestPick: input.bestPick.trim(),
    bulletPoints: input.bulletPoints.map((b) => b.trim()).filter(Boolean),
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
  };
}

/** Kirjautuneen linkitetyn jäsenen id, tai null jos ei oikeutta kirjoittaa. */
export function resolveReviewMemberId(account: { memberId: string | null } | null): string | null {
  return account?.memberId ?? null;
}
