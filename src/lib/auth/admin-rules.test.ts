import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdminFrom, canLinkMember, canRemoveAdmin, shouldCopyAvatar, type AccountLite } from "./admin-rules.ts";

test("isAdminFrom: shared password OR account.isAdmin", () => {
  assert.equal(isAdminFrom({ sharedPasswordValid: true, account: null }), true);
  assert.equal(isAdminFrom({ sharedPasswordValid: false, account: { isAdmin: true } }), true);
  assert.equal(isAdminFrom({ sharedPasswordValid: false, account: { isAdmin: false } }), false);
  assert.equal(isAdminFrom({ sharedPasswordValid: false, account: null }), false);
});

const accounts: AccountLite[] = [
  { userId: "u1", memberId: "aki", isAdmin: true },
  { userId: "u2", memberId: null, isAdmin: false },
];

test("canLinkMember: blocked if member already linked to another account", () => {
  assert.equal(canLinkMember("aki", "u2", accounts), false); // aki on jo u1:lla
  assert.equal(canLinkMember("mikko", "u2", accounts), true);
  assert.equal(canLinkMember("aki", "u1", accounts), true); // sama tili saa pitaa linkin
});

test("canRemoveAdmin: blocked if removing the last admin", () => {
  assert.equal(canRemoveAdmin("u1", accounts), false); // u1 on ainoa admin
  const two = [...accounts, { userId: "u3", memberId: "mikko", isAdmin: true }];
  assert.equal(canRemoveAdmin("u1", two), true);
});

test("shouldCopyAvatar: only when member has no avatar, discord avatar exists, and choice is on", () => {
  assert.equal(shouldCopyAvatar(null, "d.jpg", true), true);
  assert.equal(shouldCopyAvatar("has.jpg", "d.jpg", true), false);
  assert.equal(shouldCopyAvatar(null, null, true), false);
  assert.equal(shouldCopyAvatar(null, "d.jpg", false), false);
});
