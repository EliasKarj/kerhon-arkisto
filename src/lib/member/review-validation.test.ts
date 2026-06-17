import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMyReview, sanitizeMyReview, resolveReviewMemberId } from "./review-validation.ts";

test("validateMyReview accepts a score in 0-5", () => {
  assert.deepEqual(validateMyReview({ score: 3.5, bestPick: "", bulletPoints: [], tags: [] }), []);
});
test("validateMyReview rejects out-of-range / NaN", () => {
  assert.ok(validateMyReview({ score: 9, bestPick: "", bulletPoints: [], tags: [] }).length > 0);
  assert.ok(validateMyReview({ score: -1, bestPick: "", bulletPoints: [], tags: [] }).length > 0);
  assert.ok(validateMyReview({ score: Number.NaN, bestPick: "", bulletPoints: [], tags: [] }).length > 0);
});
test("sanitizeMyReview trims and drops empty bullets/tags", () => {
  const out = sanitizeMyReview({ score: 4, bestPick: "  Power  ", bulletPoints: [" hyvä ", "", "  "], tags: ["  a ", ""] });
  assert.equal(out.bestPick, "Power");
  assert.deepEqual(out.bulletPoints, ["hyvä"]);
  assert.deepEqual(out.tags, ["a"]);
});
test("resolveReviewMemberId returns memberId for a linked account, else null", () => {
  assert.equal(resolveReviewMemberId({ memberId: "elias" }), "elias");
  assert.equal(resolveReviewMemberId({ memberId: null }), null);
  assert.equal(resolveReviewMemberId(null), null);
});
