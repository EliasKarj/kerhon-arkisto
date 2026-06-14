/**
 * Domain-tyypit Kerhon Arkistolle.
 *
 * V1: data on staattisissa JSON-tiedostoissa (`/data`). Rakenne on suunniteltu
 * niin, että V2:ssa (käyttäjätilit, useat huoneet) se laajenee ilman isoa
 * refaktorointia — siksi esim. `bestPick` on geneerinen nimi eikä `bestGirl`.
 */

export type SeriesType = "anime" | "movie" | "series";

export interface Member {
  id: string;
  name: string;
  /** Polku/URL avatariin, tai null jos ei kuvaa. */
  avatarUrl: string | null;
}

export interface Series {
  id: string;
  title: string;
  type: SeriesType;
  /** Vapaamuotoinen kausimerkintä, esim. "Kausi 1". */
  season: string;
  year: number;
  genreTags: string[];
  /** Kansikuvan URL; tyhjä merkkijono jos ei kuvaa. */
  coverUrl: string;
}

export interface Review {
  id: string;
  seriesId: Series["id"];
  memberId: Member["id"];
  /** Pisteet asteikolla 0–5. */
  score: number;
  /** Jäsenen kommentit alkuperäisessä bullet-muodossa (osa "tyyliä"). */
  bulletPoints: string[];
  /** Suosikkihahmo/-valinta ("best girl/boy"); geneerinen kenttä. */
  bestPick: string;
  tags: string[];
}
