"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "./supabase-admin";
import { isAdmin, requireAdmin, setSessionCookie, clearSessionCookie } from "./auth";
import { passwordMatches } from "./auth-token";
import { checkRateLimit, resetRateLimit } from "./rate-limit";
import {
  fetchAnimeDetail, searchAnime, mediaToCover, mediaToMeta, mediaToType,
  mediaToWatchLinks, matchCharacterImage, type AnimeSearchResult,
} from "./anilist";
import {
  slugify, uniqueId, reviewId, validateClubNight, type ClubNightInput,
} from "./validation";

const PUBLIC_PATHS = ["/", "/sarjat", "/aikajana", "/tilastot", "/jasenet"];

function revalidatePublic(seriesId: string, proposerId: string) {
  for (const p of PUBLIC_PATHS) revalidatePath(p);
  revalidatePath(`/sarja/${seriesId}`);
  revalidatePath(`/jasen/${proposerId}`);
}

/** Käyttäjäystävällinen viesti AniList-/DB-virheelle (ei rumaa error boundarya). */
function actionErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.startsWith("AniList")) {
    return `Animen tietojen haku AniListista epäonnistui (${msg}). Yritä hetken päästä uudelleen.`;
  }
  return `Tallennus epäonnistui: ${msg}`;
}

export async function login(_prev: unknown, formData: FormData): Promise<{ error: string } | void> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { error: "ADMIN_PASSWORD puuttuu palvelimelta." };
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `login:${ip}`;
  const rl = checkRateLimit(key, Date.now());
  if (!rl.allowed) return { error: `Liikaa kirjautumisyrityksiä. Yritä ${rl.retryAfterS} s kuluttua.` };
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password, expected)) return { error: "Väärä salasana." };
  resetRateLimit(key);
  await setSessionCookie();
  redirect("/hallinta");
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect("/kirjaudu");
}

export async function searchAnimeAction(term: string): Promise<AnimeSearchResult[]> {
  if (!(await isAdmin())) return [];
  if (!term.trim()) return [];
  return searchAnime(term.trim());
}

/** Rakentaa sarja/arvio/guest-rivit ja derivoi AniList-datan palvelimella (ei luota clientiin). */
async function buildRows(
  input: ClubNightInput,
  ids: { series: Set<string>; members: Set<string> },
  fixedSeriesId?: string,
) {
  let title = input.manualTitle?.trim() ?? "";
  let type = input.manualType ?? "anime";
  let coverUrl = "";
  let genreTags: string[] = [];
  let meta: ReturnType<typeof mediaToMeta> | null = null;
  let watchLinks: ReturnType<typeof mediaToWatchLinks> | null = null;
  let bestPickImage: string | null = null;

  if (input.anilistId) {
    const media = await fetchAnimeDetail(input.anilistId);
    title = title || (media.title.english ?? media.title.romaji ?? "Nimetön");
    type = input.manualType ?? mediaToType(media.format);
    coverUrl = mediaToCover(media) ?? "";
    meta = mediaToMeta(media);
    genreTags = meta.genres;
    watchLinks = mediaToWatchLinks(media);
    bestPickImage = input.bestPick ? matchCharacterImage(input.bestPick, media.characters?.nodes ?? []) : null;
  }

  const seriesId = fixedSeriesId ?? uniqueId(slugify(title), ids.series);
  const memberPool = new Set(ids.members);

  const seriesRow = {
    id: seriesId, title, type, club_season: input.clubSeason, watched_date: input.watchedDate,
    proposer_id: input.proposerId, club_score: input.clubScore, best_pick: input.bestPick,
    genre_tags: genreTags, cover_url: coverUrl, meta, best_pick_image: bestPickImage,
    watch_links: watchLinks, anilist_id: input.anilistId,
  };

  const guestRows: { id: string; name: string; avatar_url: null; guest: true }[] = [];
  const reviewRows = input.reviews.map((r) => {
    let memberId = r.memberId;
    if (!memberId && r.guestName?.trim()) {
      memberId = uniqueId(slugify(r.guestName), memberPool);
      memberPool.add(memberId);
      guestRows.push({ id: memberId, name: r.guestName.trim(), avatar_url: null, guest: true });
    }
    return {
      id: reviewId(seriesId, memberId as string), series_id: seriesId, member_id: memberId as string,
      score: r.score, bullet_points: r.bulletPoints, best_pick: r.bestPick, tags: r.tags,
    };
  });

  return { seriesId, seriesRow, guestRows, reviewRows };
}

async function loadExistingIds(): Promise<{ series: Set<string>; members: Set<string> }> {
  const [s, m] = await Promise.all([
    supabaseAdmin.from("series").select("id"),
    supabaseAdmin.from("members").select("id"),
  ]);
  if (s.error) throw new Error(s.error.message);
  if (m.error) throw new Error(m.error.message);
  return {
    series: new Set((s.data ?? []).map((r) => r.id as string)),
    members: new Set((m.data ?? []).map((r) => r.id as string)),
  };
}

async function writeRows(rows: Awaited<ReturnType<typeof buildRows>>): Promise<{ error: string } | null> {
  if (rows.guestRows.length) {
    const { error } = await supabaseAdmin.from("members").upsert(rows.guestRows, { onConflict: "id" });
    if (error) return { error: `Vieras: ${error.message}` };
  }
  const seriesRes = await supabaseAdmin.from("series").upsert(rows.seriesRow, { onConflict: "id" });
  if (seriesRes.error) return { error: `Sarja: ${seriesRes.error.message}` };
  if (rows.reviewRows.length) {
    const { error } = await supabaseAdmin.from("reviews").upsert(rows.reviewRows, { onConflict: "id" });
    if (error) return { error: `Arviot: ${error.message}` };
  }
  return null;
}

export async function saveClubNight(input: ClubNightInput): Promise<{ error: string } | { ok: true; seriesId: string }> {
  await requireAdmin();
  const errors = validateClubNight(input);
  if (errors.length) return { error: errors.join(" ") };
  // Vain AniList-haku ja id-lataus voivat heittää → siisti virheviesti.
  let rows: Awaited<ReturnType<typeof buildRows>>;
  try {
    const ids = await loadExistingIds();
    rows = await buildRows(input, ids);
  } catch (e) {
    return { error: actionErrorMessage(e) };
  }
  const writeErr = await writeRows(rows);
  if (writeErr) return writeErr;
  revalidatePublic(rows.seriesId, input.proposerId);
  return { ok: true, seriesId: rows.seriesId };
}

export async function updateClubNight(seriesId: string, input: ClubNightInput): Promise<{ error: string } | { ok: true; seriesId: string }> {
  await requireAdmin();
  const errors = validateClubNight(input);
  if (errors.length) return { error: errors.join(" ") };
  let rows: Awaited<ReturnType<typeof buildRows>>;
  try {
    const ids = await loadExistingIds();
    rows = await buildRows(input, ids, seriesId);
  } catch (e) {
    return { error: actionErrorMessage(e) };
  }
  // Korvaa arviot kokonaan: poista vanhat, ettei lomakkeesta poistettu arvio jää kantaan.
  const del = await supabaseAdmin.from("reviews").delete().eq("series_id", seriesId);
  if (del.error) return { error: `Arviot (poisto): ${del.error.message}` };
  const writeErr = await writeRows(rows);
  if (writeErr) return writeErr;
  revalidatePublic(seriesId, input.proposerId);
  return { ok: true, seriesId };
}

/** Poistaa sarjan kokonaan: arviot, sitä koskevat sessiot (cascade) ja itse sarjan. */
export async function deleteSeries(seriesId: string): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  // FK-järjestys: sessiot ensin (session_reviews/presence poistuvat cascadella),
  // sitten julkiset arviot, sitten sarja.
  const delSessions = await supabaseAdmin.from("sessions").delete().eq("series_id", seriesId);
  if (delSessions.error) return { error: `Sessiot: ${delSessions.error.message}` };
  const delReviews = await supabaseAdmin.from("reviews").delete().eq("series_id", seriesId);
  if (delReviews.error) return { error: `Arviot: ${delReviews.error.message}` };
  const delSeries = await supabaseAdmin.from("series").delete().eq("id", seriesId);
  if (delSeries.error) return { error: `Sarja: ${delSeries.error.message}` };
  for (const p of PUBLIC_PATHS) revalidatePath(p);
  revalidatePath("/aikajana");
  revalidatePath("/hallinta");
  return { ok: true };
}
