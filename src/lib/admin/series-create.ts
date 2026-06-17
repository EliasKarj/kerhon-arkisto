import "server-only";
import { supabaseAdmin } from "./supabase-admin";
import { fetchAnimeDetail, mediaToCover, mediaToMeta, mediaToType, mediaToWatchLinks } from "./anilist";
import { slugify, uniqueId } from "./validation";

export interface NewSeriesInput {
  anilistId: number | null;
  manualTitle: string | null;
  clubSeason: number;
  watchedDate: string;
  proposerId: string;
}

/** Luo uuden sarjan (AniList- tai manuaalinen), clubScore null (= nyt katselussa). Palauttaa seriesId:n. */
export async function createSeriesFromAniList(
  input: NewSeriesInput,
): Promise<{ seriesId: string } | { error: string }> {
  let title = input.manualTitle?.trim() ?? "";
  let type: "anime" | "movie" | "series" = "anime";
  let coverUrl = "";
  let genreTags: string[] = [];
  let meta: ReturnType<typeof mediaToMeta> | null = null;
  let watchLinks: ReturnType<typeof mediaToWatchLinks> | null = null;

  if (input.anilistId) {
    const media = await fetchAnimeDetail(input.anilistId);
    title = title || (media.title.english ?? media.title.romaji ?? "Nimetön");
    type = mediaToType(media.format);
    coverUrl = mediaToCover(media) ?? "";
    meta = mediaToMeta(media);
    genreTags = meta.genres;
    watchLinks = mediaToWatchLinks(media);
  }
  if (!title) return { error: "Sarjalla pitää olla nimi." };
  if (!input.proposerId) return { error: "Ehdottaja vaaditaan." };

  const { data: existing, error: exErr } = await supabaseAdmin.from("series").select("id");
  if (exErr) return { error: exErr.message };
  const seriesId = uniqueId(slugify(title), new Set((existing ?? []).map((r) => r.id as string)));

  const row = {
    id: seriesId, title, type, club_season: input.clubSeason, watched_date: input.watchedDate,
    proposer_id: input.proposerId, club_score: null, best_pick: null, genre_tags: genreTags,
    cover_url: coverUrl, meta, best_pick_image: null, watch_links: watchLinks, anilist_id: input.anilistId,
  };
  const { error } = await supabaseAdmin.from("series").insert(row);
  if (error) return { error: error.message };
  return { seriesId };
}
