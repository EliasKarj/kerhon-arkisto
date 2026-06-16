// Kertaluontoinen: lukee data/{meta,characters,links}.json ja kirjoittaa ne
// series-taulun johdettuihin sarakkeisiin. Idempotentti (UPDATE id:n perusteella).
// Aja: npm run backfill:derived

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

const meta = read("meta.json");
const characters = read("characters.json");
const links = read("links.json");

async function main() {
  const { data: rows, error } = await db.from("series").select("id");
  if (error) throw new Error(error.message);
  let updated = 0;
  for (const { id } of rows) {
    const patch = {
      meta: meta[id] ?? null,
      best_pick_image: characters[id] ?? null,
      watch_links: links[id] ?? null,
    };
    const { error: upErr } = await db.from("series").update(patch).eq("id", id);
    if (upErr) { console.log(`${id} -> VIRHE: ${upErr.message}`); continue; }
    if (patch.meta || patch.best_pick_image || patch.watch_links) updated++;
  }
  console.log(`Backfill valmis: ${updated}/${rows.length} sarjaa sai johdettua dataa.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
