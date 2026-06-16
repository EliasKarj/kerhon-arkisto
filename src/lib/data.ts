import { cache } from "react";
import { supabase } from "./supabase";
import { rowToSeries } from "./series-mapper";
import type { GraphData, Member, Review, RoomData, Series, SeriesMeta, WatchLinks } from "./types";
export type { StreamingLink, WatchLinks } from "./types";

// Ydindata (members/series/reviews) luetaan Supabasesta per pyyntö (getRoomData).
// Johdettu data (kannet, hahmot, linkit, meta, graph) on edelleen build-aikaista
// staattista JSONia, yhdistetään seriesId:llä.
// AniListista haetut kansikuvat (`npm run fetch:covers`). Avain = seriesId.
import coversData from "../../data/covers.json";
// AniListista haetut lempihahmojen kuvat (`npm run fetch:characters`).
import charactersData from "../../data/characters.json";
// AniListista haetut katselulinkit (`npm run fetch:links`).
import linksData from "../../data/links.json";
// AniListista haettu metatieto (`npm run fetch:meta`).
import metaData from "../../data/meta.json";
// Build-aikainen yhteysverkko (`npm run build:graph`).
import graphData from "../../data/graph.json";

const covers = coversData as Record<string, string>;
const characterImages = charactersData as Record<string, string>;
const watchLinks = linksData as Record<string, WatchLinks>;
const meta = metaData as Record<string, SeriesMeta>;
export const graph = graphData as GraphData;

/** Lataa ydindatan Supabasesta kerran per pyyntö (React cache dedupaa). */
export const getRoomData = cache(async (): Promise<RoomData> => {
  const [membersRes, seriesRes, reviewsRes] = await Promise.all([
    supabase.from("members").select("*"),
    supabase.from("series").select("*"),
    supabase.from("reviews").select("*"),
  ]);
  for (const res of [membersRes, seriesRes, reviewsRes]) {
    if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  }
  const members: Member[] = (membersRes.data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    avatarUrl: m.avatar_url,
    guest: m.guest,
  }));
  const series: Series[] = (seriesRes.data ?? []).map(rowToSeries);
  const reviews: Review[] = (reviewsRes.data ?? []).map((r) => ({
    id: r.id,
    seriesId: r.series_id,
    memberId: r.member_id,
    score: Number(r.score),
    bulletPoints: r.bullet_points ?? [],
    bestPick: r.best_pick ?? "",
    tags: r.tags ?? [],
  }));
  return { members, series, reviews };
});

// --- Puhtaat haut tilannekuvan datalle (ei moduulitason globaaleja) ---

export function memberById(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

/** Viralliset jäsenet (ei vieraat). */
export function officialMembers(members: Member[]): Member[] {
  return members.filter((m) => !m.guest);
}

export function seriesById(series: Series[], id: string): Series | undefined {
  return series.find((s) => s.id === id);
}

/** Kaikki tietyn sarjan jäsenkohtaiset arviot. */
export function reviewsForSeries(reviews: Review[], seriesId: string): Review[] {
  return reviews.filter((r) => r.seriesId === seriesId);
}

/** Kaikki tietyn jäsenen kirjaamat arviot. */
export function reviewsForMember(reviews: Review[], memberId: string): Review[] {
  return reviews.filter((r) => r.memberId === memberId);
}

/** Jäsenen ehdottamat sarjat, uusin ensin. */
export function seriesProposedBy(series: Series[], memberId: string): Series[] {
  return series
    .filter((s) => s.proposerId === memberId)
    .sort((a, b) => b.watchedDate.localeCompare(a.watchedDate));
}

/** Sarjat kokouspäivän mukaan, uusin ensin. */
export function seriesByDateDesc(series: Series[]): Series[] {
  return [...series].sort((a, b) => b.watchedDate.localeCompare(a.watchedDate));
}

// --- Johdettu data (staattinen JSON, yhdistetään seriesId:llä) ---

/** Sarjan kansikuvan URL: ensisijaisesti datassa annettu, muuten haettu. */
export function getCoverUrl(series: Series): string | null {
  return series.coverUrl || covers[series.id] || null;
}

/** Sarjan lempihahmon kuva: DB-first, fallback JSONiin. */
export function getBestPickImage(series: Series): string | null {
  return series.bestPickImage ?? characterImages[series.id] ?? null;
}

/** Sarjan katselulinkit: DB-first, fallback JSONiin. */
export function getWatchLinks(series: Series): WatchLinks | null {
  return series.watchLinks ?? watchLinks[series.id] ?? null;
}

/** Sarjan AniList-metatieto: DB-first, fallback build-aikaiseen JSONiin. */
export function getMeta(series: Series): SeriesMeta | null {
  return series.meta ?? meta[series.id] ?? null;
}
