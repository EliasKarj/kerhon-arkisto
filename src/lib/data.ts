import type { GraphData, Member, Review, Series, SeriesMeta } from "./types";

// Data luetaan suoraan staattisista JSON-tiedostoista (`/data`).
// JSON-importin päättelemät tyypit ovat laveampia (esim. `type: string`),
// joten kavennetaan ne domain-tyyppeihin tässä yhdessä paikassa.
import membersData from "../../data/members.json";
import seriesData from "../../data/series.json";
import reviewsData from "../../data/reviews.json";
// AniListista haetut kansikuvat (build-time, `npm run fetch:covers`).
// Avain = seriesId, arvo = kuvan URL.
import coversData from "../../data/covers.json";
// AniListista haetut lempihahmojen kuvat (build-time, `npm run fetch:characters`).
// Avain = seriesId, arvo = hahmokuvan URL.
import charactersData from "../../data/characters.json";
// AniListista haetut katselulinkit (build-time, `npm run fetch:links`).
import linksData from "../../data/links.json";
// AniListista haettu metatieto (build-time, `npm run fetch:meta`).
import metaData from "../../data/meta.json";
// Build-aikainen yhteysverkko (`npm run build:graph`).
import graphData from "../../data/graph.json";

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

export const members: Member[] = membersData as Member[];
export const series: Series[] = seriesData as Series[];
export const reviews: Review[] = reviewsData as Review[];
const covers = coversData as Record<string, string>;
const characterImages = charactersData as Record<string, string>;
const watchLinks = linksData as Record<string, WatchLinks>;
const meta = metaData as Record<string, SeriesMeta>;
export const graph = graphData as GraphData;

export function getMemberById(id: string): Member | undefined {
  return members.find((member) => member.id === id);
}

/** Viralliset jäsenet (ei vieraat). */
export function getOfficialMembers(): Member[] {
  return members.filter((member) => !member.guest);
}

export function getSeriesById(id: string): Series | undefined {
  return series.find((entry) => entry.id === id);
}

/** Kaikki tietyn sarjan jäsenkohtaiset arviot (vain niillä joista kirjattu). */
export function getReviewsForSeries(seriesId: string): Review[] {
  return reviews.filter((review) => review.seriesId === seriesId);
}

/** Kaikki tietyn jäsenen kirjaamat arviot. */
export function getReviewsForMember(memberId: string): Review[] {
  return reviews.filter((review) => review.memberId === memberId);
}

/** Jäsenen ehdottamat sarjat, uusin ensin. */
export function getSeriesProposedBy(memberId: string): Series[] {
  return series
    .filter((entry) => entry.proposerId === memberId)
    .sort((a, b) => b.watchedDate.localeCompare(a.watchedDate));
}

/** Sarjat kokouspäivän mukaan, uusin ensin (aikajana, "viimeksi katsottu"). */
export function getSeriesByDateDesc(): Series[] {
  return [...series].sort((a, b) => b.watchedDate.localeCompare(a.watchedDate));
}

/** Sarjan kansikuvan URL: ensisijaisesti datassa annettu, muuten haettu. */
export function getCoverUrl(series: Series): string | null {
  return series.coverUrl || covers[series.id] || null;
}

/** Sarjan lempihahmon (best girl/boy) kuvan URL, tai null jos ei löytynyt. */
export function getBestPickImage(seriesId: string): string | null {
  return characterImages[seriesId] ?? null;
}

/** Sarjan katselulinkit (suoratoistopalvelut + AniList-sivu), tai null. */
export function getWatchLinks(seriesId: string): WatchLinks | null {
  return watchLinks[seriesId] ?? null;
}

/** Sarjan AniList-metatieto, tai null jos ei haettu. */
export function getMeta(seriesId: string): SeriesMeta | null {
  return meta[seriesId] ?? null;
}
