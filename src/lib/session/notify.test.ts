import { test } from "node:test";
import assert from "node:assert/strict";
import { buildScheduledMessage, buildStartedMessage, buildEndedMessage, roomUrl, seriesUrl, sendDiscordMessage } from "./notify.ts";

test("buildScheduledMessage includes title, link, Helsinki time, and NO @here", () => {
  const msg = buildScheduledMessage({ title: "Cowboy Bebop", scheduledAtIso: "2026-06-18T18:25:00Z", roomUrl: "https://x/kerhoilta/1" });
  assert.ok(msg.includes("Cowboy Bebop"));
  assert.ok(msg.includes("https://x/kerhoilta/1"));
  assert.ok(msg.includes("2026"));
  assert.ok(msg.includes("21"), "18:25Z should render as 21:xx Helsinki (UTC+3 summer)");
  assert.ok(!msg.includes("@here"));
});

test("buildScheduledMessage with null time says 'ajankohta avoin'", () => {
  const msg = buildScheduledMessage({ title: "X", scheduledAtIso: null, roomUrl: "https://x/kerhoilta/1" });
  assert.ok(msg.includes("ajankohta avoin"));
});

test("buildStartedMessage includes @here, title and link", () => {
  const msg = buildStartedMessage({ title: "Monster", roomUrl: "https://x/kerhoilta/2" });
  assert.ok(msg.includes("@here"));
  assert.ok(msg.includes("Monster"));
  assert.ok(msg.includes("https://x/kerhoilta/2"));
});

test("roomUrl uses NEXT_PUBLIC_SITE_URL or the default, no double slash", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
  assert.equal(roomUrl("abc"), "https://example.com/kerhoilta/abc");
  delete process.env.NEXT_PUBLIC_SITE_URL;
  assert.equal(roomUrl("abc"), "https://kerhon-arkisto.vercel.app/kerhoilta/abc");
  if (prev !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prev;
});

test("buildEndedMessage includes title, average, per-member scores, top pick, link; no @here", () => {
  const msg = buildEndedMessage({
    title: "Monster",
    scores: [{ name: "Aki", score: 4 }, { name: "Eetu", score: 3 }],
    topPick: { name: "Dieter", votes: 2 },
    seriesUrl: "https://x/sarja/monster",
  });
  assert.ok(msg.includes("Monster"));
  assert.ok(msg.includes("3.5/5"));
  assert.ok(msg.includes("2 arviota"));
  assert.ok(msg.includes("Aki 4"));
  assert.ok(msg.includes("Eetu 3"));
  assert.ok(msg.includes("Dieter"));
  assert.ok(msg.includes("https://x/sarja/monster"));
  assert.ok(!msg.includes("@here"));
});

test("buildEndedMessage with no scores says 'Ei arvioita.' and omits top pick", () => {
  const msg = buildEndedMessage({ title: "X", scores: [], topPick: null, seriesUrl: "https://x/sarja/x" });
  assert.ok(msg.includes("Ei arvioita."));
  assert.ok(!msg.includes("Best character"));
});

test("seriesUrl builds a /sarja link from the base", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  assert.equal(seriesUrl("monster"), "https://kerhon-arkisto.vercel.app/sarja/monster");
  if (prev !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prev;
});

test("sendDiscordMessage does not throw when DISCORD_WEBHOOK_URL is unset", async () => {
  const prev = process.env.DISCORD_WEBHOOK_URL;
  delete process.env.DISCORD_WEBHOOK_URL;
  await assert.doesNotReject(sendDiscordMessage("hei"));
  if (prev !== undefined) process.env.DISCORD_WEBHOOK_URL = prev;
});
