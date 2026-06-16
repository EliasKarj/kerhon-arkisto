// Build-time-skripti: laskee animeiden yhteysverkon layoutin d3-forcella ja
// kirjoittaa solmukoordinaatit + reunat data/graph.json:iin. Reunat: jaettu
// studio / tekijä / >=2 yhteistä genreä. Yksi layout (reunojen unioni); UI
// suodattaa piirrettävät reunat. Deterministinen (siemennetty Math.random).
//
// Aja:  npm run build:graph   (backfill:derived-n jälkeen)

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } },
);

async function loadSeriesWithMeta() {
  const { data, error } = await db.from("series").select("id,title,type,meta");
  if (error) throw new Error(error.message);
  return data.map((s) => ({ id: s.id, title: s.title, type: s.type, meta: s.meta }));
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DATA_DIR = join(process.cwd(), "data");

async function main() {
  const series = await loadSeriesWithMeta();

  const ids = series.map((s) => s.id);
  const titleById = Object.fromEntries(series.map((s) => [s.id, s.title]));
  const metaById = Object.fromEntries(
    series.map((s) => [s.id, s.meta ?? {}]),
  );

  const edges = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const ma = metaById[a];
      const mb = metaById[b];
      if (ma.studio && ma.studio === mb.studio) edges.push({ source: a, target: b, kind: "studio" });
      if (ma.author && ma.author === mb.author) edges.push({ source: a, target: b, kind: "author" });
      const shared = (ma.genres || []).filter((g) => (mb.genres || []).includes(g));
      if (shared.length >= 2) edges.push({ source: a, target: b, kind: "genre" });
    }
  }

  const degree = Object.fromEntries(ids.map((id) => [id, 0]));
  for (const e of edges) {
    degree[e.source]++;
    degree[e.target]++;
  }

  // Deterministinen simulaatio: korvataan Math.random ajon ajaksi.
  const origRandom = Math.random;
  Math.random = mulberry32(42);

  const nodes = ids.map((id, i) => ({ id, x: Math.cos(i) * 120, y: Math.sin(i) * 120 }));
  const links = edges.map((e) => ({ source: e.source, target: e.target }));

  const sim = forceSimulation(nodes)
    .force("link", forceLink(links).id((d) => d.id).distance(70).strength(0.25))
    .force("charge", forceManyBody().strength(-130))
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide(20))
    .stop();
  for (let i = 0; i < 400; i++) sim.tick();

  Math.random = origRandom;

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const M = 60;
  const S = 1000 - 2 * M;
  const norm = (v, min, max) => (max === min ? 500 : Math.round(M + ((v - min) / (max - min)) * S));

  const outNodes = nodes.map((n) => ({
    id: n.id,
    title: titleById[n.id],
    x: norm(n.x, minX, maxX),
    y: norm(n.y, minY, maxY),
    degree: degree[n.id],
  }));

  const graph = { nodes: outNodes, edges };
  const outPath = join(DATA_DIR, "graph.json");
  writeFileSync(outPath, JSON.stringify(graph, null, 2) + "\n", "utf8");
  console.log(`Kirjoitettu ${outNodes.length} solmua, ${edges.length} reunaa -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
