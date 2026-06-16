import type { Series, SeriesMeta, WatchLinks } from "./types";

export function rowToSeries(s: Record<string, unknown>): Series {
  return {
    id: s.id as string,
    title: s.title as string,
    type: s.type as Series["type"],
    clubSeason: s.club_season as number,
    watchedDate: s.watched_date as string,
    proposerId: s.proposer_id as string,
    clubScore: s.club_score === null || s.club_score === undefined ? null : Number(s.club_score),
    bestPick: (s.best_pick as string | null) ?? null,
    genreTags: (s.genre_tags as string[] | null) ?? [],
    coverUrl: (s.cover_url as string | null) ?? "",
    meta: (s.meta as SeriesMeta | null) ?? null,
    bestPickImage: (s.best_pick_image as string | null) ?? null,
    watchLinks: (s.watch_links as WatchLinks | null) ?? null,
    anilistId: (s.anilist_id as number | null) ?? null,
  };
}
