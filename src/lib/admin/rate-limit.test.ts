import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit, resetRateLimit, __clearAll } from "./rate-limit.ts";

test("allows attempts up to the limit then blocks", () => {
  __clearAll();
  const key = "login:1.2.3.4";
  const now = 1_000_000;
  // 10 sallittua yritystä
  for (let i = 0; i < 10; i++) {
    assert.equal(checkRateLimit(key, now).allowed, true, `yritys ${i + 1} pitäisi sallia`);
  }
  // 11. estetään
  const blocked = checkRateLimit(key, now);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterS > 0);
});

test("window resets after it expires", () => {
  __clearAll();
  const key = "login:5.6.7.8";
  const now = 2_000_000;
  for (let i = 0; i < 10; i++) checkRateLimit(key, now);
  assert.equal(checkRateLimit(key, now).allowed, false);
  // ikkunan (15 min) jälkeen sallitaan taas
  const later = now + 15 * 60 * 1000 + 1;
  assert.equal(checkRateLimit(key, later).allowed, true);
});

test("resetRateLimit clears a key (onnistunut kirjautuminen)", () => {
  __clearAll();
  const key = "login:9.9.9.9";
  const now = 3_000_000;
  for (let i = 0; i < 10; i++) checkRateLimit(key, now);
  assert.equal(checkRateLimit(key, now).allowed, false);
  resetRateLimit(key);
  assert.equal(checkRateLimit(key, now).allowed, true);
});

test("separate keys have independent buckets", () => {
  __clearAll();
  const now = 4_000_000;
  for (let i = 0; i < 10; i++) checkRateLimit("login:a", now);
  assert.equal(checkRateLimit("login:a", now).allowed, false);
  assert.equal(checkRateLimit("login:b", now).allowed, true);
});
