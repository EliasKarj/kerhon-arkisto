// Kevyt muistinvarainen rate-limit kirjautumiselle (brute-force-suoja).
// HUOM: muisti on per palvelininstanssi (Vercelillä ei jaettu instanssien välillä
// eikä säily kylmäkäynnistyksen yli). Tämä on puolustusta syvyydessä vahvan
// jaetun salasanan rinnalla — ei korvaa sitä. Jaettu/pysyvä limitteri (Upstash ym.)
// vaatisi ulkoisen palvelun, jota ei haluta.

const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 10;

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  /** Sekunteja ikkunan nollautumiseen, kun estetty. */
  retryAfterS: number;
}

/** Kirjaa yrityksen avaimelle ja kertoo saako jatkaa. */
export function checkRateLimit(key: string, nowMs: number): RateLimitResult {
  const bucket = buckets.get(key);
  if (!bucket || nowMs >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: nowMs + WINDOW_MS });
    return { allowed: true, retryAfterS: 0 };
  }
  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterS: Math.ceil((bucket.resetAt - nowMs) / 1000) };
  }
  bucket.count++;
  return { allowed: true, retryAfterS: 0 };
}

/** Nollaa avaimen (esim. onnistuneen kirjautumisen jälkeen). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Vain testeille: tyhjentää kaikki ämpärit. */
export function __clearAll(): void {
  buckets.clear();
}
