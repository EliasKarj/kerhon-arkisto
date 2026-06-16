import { test } from "node:test";
import assert from "node:assert/strict";
import { mediaToMeta, mediaToCover, mediaToType, mediaToWatchLinks, matchCharacterImage } from "./anilist.ts";

const media = {
  id: 5,
  title: { romaji: "Kimetsu no Yaiba", english: "Demon Slayer" },
  format: "TV",
  seasonYear: 2019,
  episodes: 26,
  duration: 24,
  source: "MANGA",
  genres: ["Action", "Fantasy"],
  studios: { edges: [{ isMain: true, node: { name: "ufotable" } }] },
  staff: { edges: [{ role: "Original Creator", node: { name: { full: "Koyoharu Gotouge" } } }] },
  relations: { edges: [{ node: { title: { english: "Mugen Train" }, type: "MOVIE" } }] },
  coverImage: { extraLarge: "xl.jpg", large: "l.jpg" },
  siteUrl: "https://anilist.co/anime/5",
  externalLinks: [
    { url: "https://crunchyroll.com/x", site: "Crunchyroll", type: "STREAMING", color: "#f47521", icon: "i.png" },
    { url: "https://twitter.com/x", site: "Twitter", type: "SOCIAL", color: null, icon: null },
  ],
  characters: { nodes: [
    { name: { full: "Nezuko Kamado", native: null, alternative: [] }, image: { large: "nezuko.jpg" } },
    { name: { full: "Tanjiro Kamado", native: null, alternative: [] }, image: { large: "tanjiro.jpg" } },
  ] },
};

test("mediaToMeta extracts studio, year, author, relations", () => {
  const m = mediaToMeta(media);
  assert.equal(m.studio, "ufotable");
  assert.equal(m.year, 2019);
  assert.equal(m.episodes, 26);
  assert.equal(m.author, "Koyoharu Gotouge");
  assert.deepEqual(m.relations, ["Mugen Train"]);
});

test("mediaToCover prefers extraLarge", () => {
  assert.equal(mediaToCover(media), "xl.jpg");
});

test("mediaToType maps MOVIE to movie, else anime", () => {
  assert.equal(mediaToType("MOVIE"), "movie");
  assert.equal(mediaToType("TV"), "anime");
});

test("mediaToWatchLinks keeps only STREAMING links + siteUrl", () => {
  const w = mediaToWatchLinks(media);
  assert.equal(w.anilist, "https://anilist.co/anime/5");
  assert.equal(w.streaming.length, 1);
  assert.equal(w.streaming[0].site, "Crunchyroll");
});

test("matchCharacterImage finds the picked character", () => {
  assert.equal(matchCharacterImage("Nezuko", media.characters.nodes), "nezuko.jpg");
  assert.equal(matchCharacterImage("Ei ketään", media.characters.nodes), null);
});
