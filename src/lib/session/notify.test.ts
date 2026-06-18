import { test } from "node:test";
import assert from "node:assert/strict";
import { buildScheduledMessage, buildStartedMessage, roomUrl, sendDiscordMessage } from "./notify.ts";

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

test("sendDiscordMessage does not throw when DISCORD_WEBHOOK_URL is unset", async () => {
  const prev = process.env.DISCORD_WEBHOOK_URL;
  delete process.env.DISCORD_WEBHOOK_URL;
  await assert.doesNotReject(sendDiscordMessage("hei"));
  if (prev !== undefined) process.env.DISCORD_WEBHOOK_URL = prev;
});
