import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDisplayScore } from "./score.ts";
import type { Review } from "./types.ts";

const rev = (score: number): Review => ({ id: "x", seriesId: "s", memberId: "m", score, bulletPoints: [], bestPick: "", tags: [] });

test("computeDisplayScore averages when reviews exist", () => {
  assert.equal(computeDisplayScore([rev(4), rev(2)], 5), 3);
});
test("computeDisplayScore falls back to clubScore when no reviews", () => {
  assert.equal(computeDisplayScore([], 4.2), 4.2);
});
test("computeDisplayScore is null with no reviews and no clubScore", () => {
  assert.equal(computeDisplayScore([], null), null);
});
