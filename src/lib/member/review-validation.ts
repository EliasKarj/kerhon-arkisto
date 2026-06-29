export interface MyReviewInput {
  score: number;
  bestPick: string;
  bestPickImage: string | null;
  bulletPoints: string[];
  tags: string[];
}

function inRange(n: number): boolean {
  return typeof n === "number" && !Number.isNaN(n) && n >= 0 && n <= 5;
}

// Kohtuulliset rajat (estävät vahingossa/tahallaan jättisyötteet kantaan).
const MAX_BEST_PICK = 120;
const MAX_BULLETS = 20;
const MAX_BULLET_LEN = 600;
const MAX_TAGS = 20;
const MAX_TAG_LEN = 50;

/** Palauttaa virheviestit (tyhjä = kelvollinen). */
export function validateMyReview(input: MyReviewInput): string[] {
  const errors: string[] = [];
  if (!inRange(input.score)) errors.push("Pisteet 0–5.");
  if (input.bestPick.length > MAX_BEST_PICK) errors.push(`Best pick liian pitkä (max ${MAX_BEST_PICK}).`);
  if (input.bulletPoints.length > MAX_BULLETS) errors.push(`Liikaa kommentteja (max ${MAX_BULLETS}).`);
  if (input.bulletPoints.some((b) => b.length > MAX_BULLET_LEN)) errors.push(`Kommentti liian pitkä (max ${MAX_BULLET_LEN}).`);
  if (input.tags.length > MAX_TAGS) errors.push(`Liikaa tageja (max ${MAX_TAGS}).`);
  if (input.tags.some((t) => t.length > MAX_TAG_LEN)) errors.push(`Tagi liian pitkä (max ${MAX_TAG_LEN}).`);
  return errors;
}

/** Siivoaa syötteen DB-riviä varten: trimmaa, pudottaa tyhjät bulletit/tagit. */
export function sanitizeMyReview(input: MyReviewInput): MyReviewInput {
  const bestPick = input.bestPick.trim();
  return {
    score: input.score,
    bestPick,
    // Säilytä kuva vain jos hahmolla on nimi (muuten roikkuva kuva ilman pickiä).
    bestPickImage: bestPick && input.bestPickImage?.trim() ? input.bestPickImage.trim() : null,
    bulletPoints: input.bulletPoints.map((b) => b.trim()).filter(Boolean),
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
  };
}

/** Kirjautuneen linkitetyn jäsenen id, tai null jos ei oikeutta kirjoittaa. */
export function resolveReviewMemberId(account: { memberId: string | null } | null): string | null {
  return account?.memberId ?? null;
}
