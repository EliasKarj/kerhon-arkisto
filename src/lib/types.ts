/**
 * Domain-tyypit Kerhon Arkistolle.
 *
 * Data on staattisissa JSON-tiedostoissa (`/data`):
 * - `series.json`  — kaikki katsotut animet/leffat aggregaattidatalla
 *   (kerhon yhteisarvosana, best girl, ehdottaja, kausi, kokouspäivä)
 * - `reviews.json` — yksityiskohtaiset jäsenkohtaiset arviot niille sarjoille,
 *   joista sellaiset on kirjattu (bulletit, henkilökohtaiset pisteet, best pick)
 */

export type SeriesType = "anime" | "movie" | "series";

export interface Member {
  id: string;
  name: string;
  /** Polku/URL avatariin, tai null jos ei kuvaa. */
  avatarUrl: string | null;
  /** true jos vieras (esiintyy datassa muttei ole virallinen jäsen). */
  guest?: boolean;
}

export interface Series {
  id: string;
  title: string;
  type: SeriesType;
  /** Kerhon kausi 1–10. */
  clubSeason: number;
  /** Kokouspäivä ISO-muodossa (YYYY-MM-DD). */
  watchedDate: string;
  /** Animen ehdottaneen jäsenen id. */
  proposerId: Member["id"];
  /** Kerhon yhteisarvosana asteikolla 0–5, tai null jos ei vielä arvioitu. */
  clubScore: number | null;
  /** Best girl/hahmo ("best pick"), tai null. */
  bestPick: string | null;
  genreTags: string[];
  /** Kansikuvan URL; tyhjä merkkijono jos ei kuvaa. */
  coverUrl: string;
}

export interface Review {
  id: string;
  seriesId: Series["id"];
  memberId: Member["id"];
  /** Jäsenen henkilökohtaiset pisteet asteikolla 0–5. */
  score: number;
  /** Jäsenen kommentit alkuperäisessä bullet-muodossa (osa "tyyliä"). */
  bulletPoints: string[];
  /** Jäsenen suosikkihahmo/-valinta ("best girl/boy"). */
  bestPick: string;
  tags: string[];
}
