import { test } from "node:test";
import assert from "node:assert/strict";
import { rowToSeries } from "./data.ts";

test("rowToSeries maps snake_case columns incl. new derived fields", () => {
  const row = {
    id: "x", title: "X", type: "anime", club_season: 3,
    watched_date: "2025-01-02", proposer_id: "aki", club_score: "4.2",
    best_pick: "Power", genre_tags: ["Action"], cover_url: "c.jpg",
    meta: { genres: ["Action"], studio: "MAPPA", year: 2022, episodes: 12,
            duration: 24, format: "TV", source: "MANGA", author: null, relations: [] },
    best_pick_image: "char.jpg",
    watch_links: { anilist: "https://a", streaming: [] },
    anilist_id: 999,
  };
  const s = rowToSeries(row);
  assert.equal(s.clubScore, 4.2);
  assert.equal(s.meta?.studio, "MAPPA");
  assert.equal(s.bestPickImage, "char.jpg");
  assert.equal(s.watchLinks?.anilist, "https://a");
  assert.equal(s.anilistId, 999);
});

test("rowToSeries tolerates null derived fields", () => {
  const s = rowToSeries({
    id: "y", title: "Y", type: "movie", club_season: 1, watched_date: "2024-01-01",
    proposer_id: "aki", club_score: null, best_pick: null, genre_tags: null,
    cover_url: null, meta: null, best_pick_image: null, watch_links: null, anilist_id: null,
  });
  assert.equal(s.clubScore, null);
  assert.equal(s.meta, null);
  assert.equal(s.genreTags.length, 0);
  assert.equal(s.coverUrl, "");
});
