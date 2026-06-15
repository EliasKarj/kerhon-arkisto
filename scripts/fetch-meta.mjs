// Build-time-skripti: hakee kullekin sarjalle metatiedot AniListista (genre,
// studio, vuosi, jaksot, kesto, formaatti, lähde, tekijä, relaatiot) ja kirjoittaa
// ne data/meta.json:iin muodossa { seriesId: SeriesMeta }. Staattista, commitoidaan.
//
// Aja projektin juuresta:  npm run fetch:meta

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");
const series = JSON.parse(readFileSync(join(DATA_DIR, "series.json"), "utf8"));

// Sama override-lista kuin fetch-covers.mjs:ssä (tarkempi haku / kohdevuosi).
const OVERRIDES = {
  "food-wars": { search: "Shokugeki no Souma", year: 2015 },
  "space-dandy": { search: "Space Dandy" },
  "master-of-diabolism": { search: "Mo Dao Zu Shi" },
  "ranma-half-2024": { search: "Ranma ½", year: 2024 },
  "ghost-in-the-shell": { search: "Ghost in the Shell", year: 1995 },
  "ossan-newbie-adventurer": {
    search: "The Ossan Newbie Adventurer, Trained to Death by the Most Powerful Party",
  },
  "memories": { search: "Memories", year: 1995 },
  "kurokos-basketball": { search: "Kuroko no Basket" },
  "demon-slayer": { search: "Kimetsu no Yaiba" },
  "frieren": { search: "Sousou no Frieren" },
  "monster": { search: "Monster", year: 2004 },
};

const NON_MOVIE_RANK = { TV: 0, ONA: 1, TV_SHORT: 2, OVA: 3, SPECIAL: 4, MOVIE: 5, MUSIC: 9 };
const MOVIE_RANK = { MOVIE: 0, SPECIAL: 1, ONA: 2, OVA: 3, TV: 4, TV_SHORT: 5, MUSIC: 9 };

const QUERY = `query($s:String){
  Page(perPage:10){
    media(search:$s, type:ANIME){
      id
      title{ romaji english }
      format
      seasonYear
      episodes
      duration
      source
      genres
      studios{ edges { isMain node { name } } }
      staff(perPage:8){ edges { role node { name { full } } } }
      relations{ edges { node { title { romaji english } type } } }
    }
  }
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchAniList(searchTerm) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { s: searchTerm } }),
  });
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after") ?? "5");
    console.warn(`  rate limited, odotetaan ${retry}s…`);
    await sleep((retry + 1) * 1000);
    return searchAniList(searchTerm);
  }
  const json = await res.json();
  return json?.data?.Page?.media ?? [];
}

function pickBest(entry, candidates) {
  if (candidates.length === 0) return null;
  const override = OVERRIDES[entry.id] ?? {};
  let pool = candidates;
  if (override.year) {
    const byYear = pool.filter((m) => m.seasonYear === override.year);
    if (byYear.length) pool = byYear;
  }
  const rank = entry.type === "movie" ? MOVIE_RANK : NON_MOVIE_RANK;
  return [...pool].sort((a, b) => (rank[a.format] ?? 8) - (rank[b.format] ?? 8))[0];
}

function toMeta(media) {
  const studioEdge =
    media.studios?.edges?.find((e) => e.isMain) ?? media.studios?.edges?.[0] ?? null;
  const authorEdge = media.staff?.edges?.find((e) =>
    /original creator|^story$|creator|original story/i.test(e.role ?? ""),
  );
  const relations = (media.relations?.edges ?? [])
    .map((e) => e.node?.title?.english ?? e.node?.title?.romaji)
    .filter(Boolean)
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

async function main() {
  const meta = {};
  for (const entry of series) {
    const term = OVERRIDES[entry.id]?.search ?? entry.title;
    process.stdout.write(`${entry.id.padEnd(28)} `);
    try {
      const candidates = await searchAniList(term);
      const best = pickBest(entry, candidates);
      if (best) {
        meta[entry.id] = toMeta(best);
        const name = best.title.english ?? best.title.romaji;
        console.log(`-> ${name} (${best.seasonYear ?? "?"}, ${meta[entry.id].studio ?? "?"})`);
      } else {
        console.log("-> EI OSUMAA");
      }
    } catch (err) {
      console.log(`-> VIRHE: ${err.message}`);
    }
    await sleep(1500);
  }

  const outPath = join(DATA_DIR, "meta.json");
  writeFileSync(outPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
  console.log(`\nKirjoitettu ${Object.keys(meta).length}/${series.length} meta -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
