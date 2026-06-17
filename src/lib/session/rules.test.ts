import { test } from "node:test";
import assert from "node:assert/strict";
import { canJoinSession, canEnterReview, presentMembers, redactReviews, validateSessionInput } from "./rules.ts";
import type { SessionReview } from "./types.ts";

test("canJoinSession: all lets any linked member; invited only attendees", () => {
  assert.equal(canJoinSession({ joinPolicy: "all", attendees: [] }, "aki"), true);
  assert.equal(canJoinSession({ joinPolicy: "all", attendees: [] }, null), false);
  assert.equal(canJoinSession({ joinPolicy: "invited", attendees: ["aki"] }, "aki"), true);
  assert.equal(canJoinSession({ joinPolicy: "invited", attendees: ["aki"] }, "eetu"), false);
});

test("canEnterReview: gated by status, mode and role", () => {
  assert.equal(canEnterReview({ reviewMode: "both", status: "live" }, { asChairman: false }), true);
  assert.equal(canEnterReview({ reviewMode: "both", status: "live" }, { asChairman: true }), true);
  assert.equal(canEnterReview({ reviewMode: "members", status: "live" }, { asChairman: true }), false);
  assert.equal(canEnterReview({ reviewMode: "chairman", status: "live" }, { asChairman: false }), false);
  assert.equal(canEnterReview({ reviewMode: "both", status: "scheduled" }, { asChairman: true }), false);
});

test("presentMembers: only those seen within the window", () => {
  const now = 100_000;
  const rows = [{ memberId: "aki", lastSeen: now - 5_000 }, { memberId: "eetu", lastSeen: now - 60_000 }];
  assert.deepEqual(presentMembers(rows, now, 30_000), ["aki"]);
});

const reviews: SessionReview[] = [
  { memberId: "aki", score: 4, bestPick: "Power", bulletPoints: ["hyvä"], tags: [] },
  { memberId: "eetu", score: 2, bestPick: "x", bulletPoints: [], tags: [] },
];

test("redactReviews: hidden+live hides OTHERS' scores from a non-chairman, keeps own", () => {
  const out = redactReviews(reviews, { scoreVisibility: "hidden", status: "live", viewerIsChairman: false, viewerMemberId: "aki" });
  const aki = out.find((r) => r.memberId === "aki")!;
  const eetu = out.find((r) => r.memberId === "eetu")!;
  assert.equal(aki.score, 4);
  assert.equal(eetu.redacted, true);
  assert.equal(eetu.score, null);
  assert.equal(eetu.hasReviewed, true);
});

test("redactReviews: chairman / ended / live-visibility reveal everything", () => {
  for (const ctx of [
    { scoreVisibility: "hidden", status: "live", viewerIsChairman: true, viewerMemberId: null },
    { scoreVisibility: "hidden", status: "ended", viewerIsChairman: false, viewerMemberId: "x" },
    { scoreVisibility: "live", status: "live", viewerIsChairman: false, viewerMemberId: "x" },
  ] as const) {
    const out = redactReviews(reviews, ctx);
    assert.ok(out.every((r) => r.redacted === false && r.score !== null));
  }
});

test("validateSessionInput: rejects bad enums and missing series / empty invited", () => {
  const ok = { seriesId: "s", reviewMode: "both", scoreVisibility: "live", joinPolicy: "all", attendees: [] };
  assert.deepEqual(validateSessionInput(ok), []);
  assert.ok(validateSessionInput({ ...ok, seriesId: "" }).length > 0);
  assert.ok(validateSessionInput({ ...ok, reviewMode: "x" }).length > 0);
  assert.ok(validateSessionInput({ ...ok, joinPolicy: "invited", attendees: [] }).length > 0);
});
