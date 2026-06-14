// Build-time-skripti: hakee kullekin sarjalle kuvan kerhon valitsemasta
// lempihahmosta (best girl/boy). Tarkkuuden vuoksi haetaan animen oma
// hahmolista AniListista ja täsmätään kerhon valinta (series.bestPick) hahmon
// nimeen. Kirjoittaa data/characters.json:iin muodossa { seriesId: kuvaUrl }.
//
// Aja projektin juuresta:  npm run fetch:characters

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");
const series = JSON.parse(readFileSync(join(DATA_DIR, "series.json"), "utf8"));

// Sama median valinta kuin kansikuvissa, jotta osutaan oikeaan animeen.
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
      title{ romaji english } format seasonYear
      characters(sort:[ROLE,RELEVANCE], perPage:25){
        nodes{ name{ full native alternative } image{ large } }
      }
    }
  }
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clean(s) {
  return (s ?? "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchMedia(searchTerm) {
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { s: searchTerm } }),
  });
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after") ?? "5");
    console.warn(`  rate limited, odotetaan ${retry}s…`);
    await sleep((retry + 1) * 1000);
    return fetchMedia(searchTerm);
  }
  const json = await res.json();
  return json?.data?.Page?.media ?? [];
}

function pickMedia(entry, candidates) {
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

function matchCharacter(bestPick, nodes) {
  const tokens = clean(bestPick).split(" ").filter((t) => t.length >= 3);
  if (tokens.length === 0) return null;
  let best = null;
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

async function main() {
  const characters = {};
  for (const entry of series) {
    if (!entry.bestPick) continue;
    const term = OVERRIDES[entry.id]?.search ?? entry.title;
    process.stdout.write(`${entry.id.padEnd(28)} "${entry.bestPick}" `);
    try {
      const media = pickMedia(entry, await fetchMedia(term));
      const url = media ? matchCharacter(entry.bestPick, media.characters?.nodes ?? []) : null;
      if (url) {
        characters[entry.id] = url;
        console.log("-> kuva löytyi");
      } else {
        console.log("-> ei täsmäystä");
      }
    } catch (err) {
      console.log(`-> VIRHE: ${err.message}`);
    }
    await sleep(1500);
  }

  const outPath = join(DATA_DIR, "characters.json");
  writeFileSync(outPath, JSON.stringify(characters, null, 2) + "\n", "utf8");
  console.log(`\nKirjoitettu ${Object.keys(characters).length} hahmokuvaa -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
