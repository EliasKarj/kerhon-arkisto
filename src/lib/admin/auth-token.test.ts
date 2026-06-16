import { test } from "node:test";
import assert from "node:assert/strict";
import { signToken, verifyToken, passwordMatches } from "./auth-token.ts";

const SECRET = "test-secret";

test("verifyToken accepts a fresh signed token", () => {
  const exp = Date.now() + 10_000;
  const token = signToken(exp, SECRET);
  assert.equal(verifyToken(token, SECRET, Date.now()), true);
});

test("verifyToken rejects an expired token", () => {
  const token = signToken(Date.now() - 1, SECRET);
  assert.equal(verifyToken(token, SECRET, Date.now()), false);
});

test("verifyToken rejects a tampered signature", () => {
  const token = signToken(Date.now() + 10_000, SECRET);
  const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
  assert.equal(verifyToken(tampered, SECRET, Date.now()), false);
});

test("verifyToken rejects a token signed with another secret", () => {
  const token = signToken(Date.now() + 10_000, "other");
  assert.equal(verifyToken(token, SECRET, Date.now()), false);
});

test("verifyToken rejects garbage", () => {
  assert.equal(verifyToken("nope", SECRET, Date.now()), false);
});

test("passwordMatches is true only on exact match", () => {
  assert.equal(passwordMatches("hunter2", "hunter2"), true);
  assert.equal(passwordMatches("hunter2", "hunter3"), false);
  assert.equal(passwordMatches("short", "longerpassword"), false);
});
