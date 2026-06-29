import type { SeriesMeta, SeriesType, WatchLinks } from "../types";

const ENDPOINT = "https://graphql.anilist.co";

export interface AnimeSearchResult {
  anilistId: number;
  title: string;
  year: number | null;
  format: string | null;
  coverUrl: string | null;
}

// AniList Media -muoto (vain käyttämämme kentät).
export interface AniListMedia {
  id: number;
  title: { romaji: string | null; english: string | null };
  format: string | null;
  seasonYear: number | null;
  episodes: number | null;
  duration: number | null;
  source: string | null;
  genres: string[] | null;
  studios?: { edges: { isMain: boolean; node: { name: string } }[] };
  staff?: { edges: { role: string | null; node: { name: { full: string | null } } }[] };
  relations?: { edges: { node: { title: { romaji?: string | null; english?: string | null }; type: string } }[] };
  coverImage?: { extraLarge: string | null; large: string | null };
  siteUrl?: string | null;
  externalLinks?: { url: string; site: string; type: string; color: string | null; icon: string | null }[];
  characters?: { nodes: { name: { full: string | null; native: string | null; alternative: string[] | null }; image: { large: string | null } }[] };
}

export function mediaToType(format: string | null): SeriesType {
  return format === "MOVIE" ? "movie" : "anime";
}

export function mediaToCover(media: AniListMedia): string | null {
  return media.coverImage?.extraLarge ?? media.coverImage?.large ?? null;
}

export function mediaToMeta(media: AniListMedia): SeriesMeta {
  const studioEdge = media.studios?.edges?.find((e) => e.isMain) ?? media.studios?.edges?.[0] ?? null;
  const authorEdge = media.staff?.edges?.find((e) =>
    /original creator|^story$|creator|original story/i.test(e.role ?? ""),
  );
  const relations = (media.relations?.edges ?? [])
    .map((e) => e.node?.title?.english ?? e.node?.title?.romaji)
    .filter((x): x is string => Boolean(x))
    .slice(0, 8);
  return {
    genres: media.genres ?? [],
    studio: studioEdge?.node?.name ?? null,
    year: media.seasonYear ?? null,
    episodes: media.episodes ?? null,
    duration: media.duration ?? null,
    format: media.format ?? null,
    source: media.source ?? null,
    author: authorEdge?.node?.name?.full ?? null,
    relations,
  };
}

export function mediaToWatchLinks(media: AniListMedia): WatchLinks {
  const streaming = (media.externalLinks ?? [])
    .filter((l) => l.type === "STREAMING" && l.url)
    .map((l) => ({ site: l.site, url: l.url, color: l.color ?? null, icon: l.icon ?? null }));
  return { anilist: media.siteUrl ?? null, streaming };
}

function clean(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

type CharNode = NonNullable<AniListMedia["characters"]>["nodes"][number];

export function matchCharacterImage(bestPick: string, nodes: CharNode[]): string | null {
  const tokens = clean(bestPick).split(" ").filter((t) => t.length >= 3);
  if (tokens.length === 0) return null;
  let best: CharNode | null = null;
  let bestScore = 0;
  for (const node of nodes) {
    const names = [node.name?.full, node.name?.native, ...(node.name?.alternative ?? [])];
    const haystack = clean(names.filter(Boolean).join(" "));
    const words = new Set(haystack.split(" "));
    const score = tokens.filter((t) => haystack.includes(t)).length;
    const hasLongMatch = tokens.some((t) => t.length >= 4 && haystack.includes(t));
    const hasWordMatch = tokens.some((t) => words.has(t));
    if (score > bestScore && (hasLongMatch || hasWordMatch)) {
      bestScore = score;
      best = node;
    }
  }
  return best?.image?.large ?? null;
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`AniList: ${json.errors[0]?.message ?? "tuntematon virhe"}`);
  return json.data as T;
}

const SEARCH_QUERY = `query($s:String){ Page(perPage:5){ media(search:$s, type:ANIME){
  id title{ romaji english } format seasonYear coverImage{ large } } } }`;

export async function searchAnime(term: string): Promise<AnimeSearchResult[]> {
  const data = await gql<{ Page: { media: AniListMedia[] } }>(SEARCH_QUERY, { s: term });
  return data.Page.media.map((m) => ({
    anilistId: m.id,
    title: m.title.english ?? m.title.romaji ?? "(nimetön)",
    year: m.seasonYear ?? null,
    format: m.format ?? null,
    coverUrl: m.coverImage?.large ?? null,
  }));
}

const DETAIL_QUERY = `query($id:Int){ Media(id:$id, type:ANIME){
  id title{ romaji english } format seasonYear episodes duration source genres
  studios{ edges { isMain node { name } } }
  staff(perPage:8){ edges { role node { name { full } } } }
  relations{ edges { node { title { romaji english } type } } }
  coverImage{ extraLarge large } siteUrl
  externalLinks{ url site type color icon }
  characters(sort:[ROLE,RELEVANCE], perPage:25){ nodes{ name{ full native alternative } image{ large } } }
} }`;

export async function fetchAnimeDetail(anilistId: number): Promise<AniListMedia> {
  const data = await gql<{ Media: AniListMedia }>(DETAIL_QUERY, { id: anilistId });
  return data.Media;
}

const BASIC_QUERY = `query($id:Int,$idMal:Int){ Media(id:$id, idMal:$idMal, type:ANIME){
  title{ romaji english } coverImage{ extraLarge large }
} }`;

/** Hakee perustiedot (otsikko + kansi) AniList- tai MAL-id:llä. Palauttaa null virheessä. */
export async function fetchMediaBasic(args: { id?: number; idMal?: number }): Promise<{ title: string; coverUrl: string | null } | null> {
  try {
    const data = await gql<{ Media: AniListMedia | null }>(BASIC_QUERY, { id: args.id ?? null, idMal: args.idMal ?? null });
    if (!data.Media) return null;
    return {
      title: data.Media.title.english ?? data.Media.title.romaji ?? "",
      coverUrl: mediaToCover(data.Media),
    };
  } catch {
    return null;
  }
}

export interface SeriesCharacter {
  name: string;
  image: string | null;
}

const CHARACTERS_QUERY = `query($id:Int){ Media(id:$id, type:ANIME){
  characters(sort:[ROLE,RELEVANCE], perPage:50){ nodes{ name{ full } image{ large } } }
} }`;

/** Hahmot kuvineen best character -valitsinta varten (kevyt kysely). */
export async function fetchCharacters(anilistId: number): Promise<SeriesCharacter[]> {
  const data = await gql<{ Media: { characters?: { nodes: { name: { full: string | null }; image: { large: string | null } }[] } } }>(
    CHARACTERS_QUERY,
    { id: anilistId },
  );
  return (data.Media.characters?.nodes ?? [])
    .map((n) => ({ name: n.name?.full ?? "", image: n.image?.large ?? null }))
    .filter((c) => c.name);
}
