import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, uniqueId, reviewId, validateClubNight, type ClubNightInput } from "./validation.ts";

test("slugify lowercases, strips accents and punctuation", () => {
  assert.equal(slugify("Ranma ½ (2024)"), "ranma-2024");
  assert.equal(slugify("Mushoku Tensei: Jobless Reincarnation"), "mushoku-tensei-jobless-reincarnation");
  assert.equal(slugify("   "), "sarja");
});

test("uniqueId appends a counter on collision", () => {
  const existing = new Set(["frieren", "frieren-2"]);
  assert.equal(uniqueId("frieren", existing), "frieren-3");
  assert.equal(uniqueId("monster", existing), "monster");
});

test("reviewId combines series and member", () => {
  assert.equal(reviewId("chainsaw-man", "aki"), "chainsaw-man-aki");
});

const valid: ClubNightInput = {
  anilistId: 5, manualTitle: null, manualType: null,
  clubSeason: 10, watchedDate: "2026-06-01", proposerId: "aki",
  clubScore: 4.2, bestPick: "Power",
  reviews: [{ memberId: "aki", guestName: null, score: 4, bulletPoints: ["hyvä"], bestPick: "Power", tags: [] }],
};

test("validateClubNight accepts a valid club night", () => {
  assert.deepEqual(validateClubNight(valid), []);
});

test("validateClubNight requires anime or manual title", () => {
  const errs = validateClubNight({ ...valid, anilistId: null, manualTitle: null });
  assert.ok(errs.some((e) => e.includes("Anime")));
});

test("validateClubNight rejects out-of-range scores", () => {
  const errs = validateClubNight({ ...valid, clubScore: 9 });
  assert.ok(errs.some((e) => e.includes("0–5")));
});

test("validateClubNight rejects a review with no member and no guest", () => {
  const errs = validateClubNight({ ...valid, reviews: [{ memberId: null, guestName: null, score: 3, bulletPoints: [], bestPick: "", tags: [] }] });
  assert.ok(errs.some((e) => e.toLowerCase().includes("arvioija")));
});
