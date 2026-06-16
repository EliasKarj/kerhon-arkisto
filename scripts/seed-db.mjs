// Seed: lukee data/{members,series,reviews}.json ja upsertoi Postgresiin.
// Vaatii .env.local: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Aja: npm run seed:db

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Puuttuu NEXT_PUBLIC_SUPABASE_URL tai SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const DATA = join(process.cwd(), "data");
const read = (f) => JSON.parse(readFileSync(join(DATA, f), "utf8"));

const members = read("members.json").map((m) => ({
  id: m.id, name: m.name, avatar_url: m.avatarUrl ?? null, guest: m.guest ?? false,
}));
const series = read("series.json").map((s) => ({
  id: s.id, title: s.title, type: s.type, club_season: s.clubSeason,
  watched_date: s.watchedDate, proposer_id: s.proposerId, club_score: s.clubScore,
  best_pick: s.bestPick, genre_tags: s.genreTags ?? [], cover_url: s.coverUrl ?? "",
}));
const reviews = read("reviews.json").map((r) => ({
  id: r.id, series_id: r.seriesId, member_id: r.memberId, score: r.score,
  bullet_points: r.bulletPoints ?? [], best_pick: r.bestPick ?? "", tags: r.tags ?? [],
}));

async function upsert(table, rows) {
  const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`${table.padEnd(8)} -> ${rows.length} rivia`);
}

async function main() {
  await upsert("members", members);
  await upsert("series", series);
  await upsert("reviews", reviews);
  console.log("Seed valmis.");
}
main().catch((e) => { console.error(e); process.exit(1); });
