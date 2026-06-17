import { test } from "node:test";
import assert from "node:assert/strict";
import { getSeriesScore, getRatedSeries, getTopSeries, getClubAverageScore } from "./stats.ts";
import type { Series } from "./types.ts";

const s = (id: string, clubScore: number | null, displayScore: number | null): Series => ({
  id, title: id, type: "anime", clubSeason: 1, watchedDate: "2025-01-01", proposerId: "a",
  clubScore, displayScore, bestPick: null, genreTags: [], coverUrl: "",
  meta: null, bestPickImage: null, watchLinks: null, anilistId: null,
});

const series = [s("a", 3, 4.5), s("b", 5, 2), s("c", 4, null)];

test("getSeriesScore returns displayScore", () => {
  assert.equal(getSeriesScore(series, "a"), 4.5);
});
test("getRatedSeries excludes null displayScore", () => {
  assert.deepEqual(getRatedSeries(series).map((x) => x.id), ["a", "b"]);
});
test("getTopSeries ranks by displayScore", () => {
  assert.deepEqual(getTopSeries(series, 2).map((x) => x.id), ["a", "b"]);
});
test("getClubAverageScore averages displayScore of rated", () => {
  assert.equal(getClubAverageScore(series), (4.5 + 2) / 2);
});
