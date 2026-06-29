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
  /** Näytettävä pistemäärä: jäsenarvioiden keskiarvo, tai clubScore jos ei arvioita. Laskettu getRoomDatassa. */
  displayScore: number | null;
  /** Best girl/hahmo ("best pick"), tai null. */
  bestPick: string | null;
  genreTags: string[];
  /** Kansikuvan URL; tyhjä merkkijono jos ei kuvaa. */
  coverUrl: string;
  /** AniList-meta DB:stä, tai null (fallback data/meta.json). */
  meta: SeriesMeta | null;
  /** Lempihahmon kuva-URL DB:stä, tai null (fallback data/characters.json). */
  bestPickImage: string | null;
  /** Katselulinkit DB:stä, tai null (fallback data/links.json). */
  watchLinks: WatchLinks | null;
  /** AniList media-id, tai null. */
  anilistId: number | null;
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
  /** Valitun hahmon kuva-URL (AniList), tai null. */
  bestPickImage: string | null;
  tags: string[];
}

export interface StreamingLink {
  site: string;
  url: string;
  color: string | null;
  icon: string | null;
}
export interface WatchLinks {
  anilist: string | null;
  streaming: StreamingLink[];
}

/** AniListista haettu sarjan metatieto (build-time, `data/meta.json`). */
export interface SeriesMeta {
  genres: string[];
  studio: string | null;
  year: number | null;
  episodes: number | null;
  /** Minuuttia per jakso. */
  duration: number | null;
  format: string | null;
  /** Lähde, esim. MANGA/ORIGINAL/LIGHT_NOVEL. */
  source: string | null;
  author: string | null;
  relations: string[];
}

export type GraphEdgeKind = "studio" | "genre" | "author";

export interface GraphNode {
  id: string;
  title: string;
  x: number;
  y: number;
  /** Kokonaisaste kaikkien reunatyyppien yli. */
  degree: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: GraphEdgeKind;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Yhden pyynnön ydindatan tilannekuva (Supabasesta ladattu). */
export interface RoomData {
  members: Member[];
  series: Series[];
  reviews: Review[];
}
