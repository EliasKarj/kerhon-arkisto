import { createHmac, timingSafeEqual } from "node:crypto";

/** Allekirjoittaa "kirjautunut" -tokenin: `${expiresAtMs}.${hmac}`. */
export function signToken(expiresAtMs: number, secret: string): string {
  const payload = String(expiresAtMs);
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** Tarkistaa allekirjoituksen (vakioaika) ja vanhenemisen. */
export function verifyToken(token: string, secret: string, nowMs: number): boolean {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && nowMs < expiresAt;
}

/** Vakioaika-merkkijonovertailu salasanalle. */
export function passwordMatches(input: string, expected: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
