// Build-time-skripti: generoi AI-yhteenvedon kullekin sarjalle kerhon
// arvioiden pohjalta ja kirjoittaa ne data/summaries.json:iin.
//
// Aja projektin juuresta avaimen kanssa:
//   PowerShell:  $env:ANTHROPIC_API_KEY="sk-ant-..."; npm run generate:summaries
//   bash:        ANTHROPIC_API_KEY=sk-ant-... npm run generate:summaries
//
// Tulos on staattista dataa, joka commitoidaan — sovellus ei kutsu Claudea
// ajon aikana eikä avainta tarvita tuotannossa.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const DATA_DIR = join(process.cwd(), "data");

function readJson(name) {
  return JSON.parse(readFileSync(join(DATA_DIR, name), "utf8"));
}

const members = readJson("members.json");
const series = readJson("series.json");
const reviews = readJson("reviews.json");

const memberName = (id) => members.find((m) => m.id === id)?.name ?? id;

const SYSTEM_PROMPT = [
  "Olet kaveriporukan anime/elokuva-arviointikerhon kronikoitsija.",
  "Kirjoitat lyhyen, sujuvan suomenkielisen yhteenvedon siitä, mitä mieltä",
  "kerho oli annetusta sarjasta, kerhon omien arvioiden pohjalta.",
  "Vastaa VAIN yhteenvedolla: 2–4 virkettä, ei otsikkoa, ei johdantoa kuten",
  "'Tässä yhteenveto' eikä luettelomerkkejä. Kuvaa kerhon yhteinen näkemys:",
  "yleisarvio, mistä pidettiin, ja best girl/boy -konsensus jos sellainen on.",
  "Ammenna sävyä jäsenten kommenteista mutta kirjoita selkeää yleiskieltä —",
  "älä toista slangia sellaisenaan.",
].join(" ");

function buildPrompt(entry, entryReviews) {
  const lines = [];
  lines.push(`Sarja: ${entry.title} (${entry.type}, ${entry.season}, ${entry.year})`);
  if (entry.genreTags?.length) lines.push(`Genret: ${entry.genreTags.join(", ")}`);
  lines.push("");
  lines.push("Jäsenten arviot:");
  for (const review of entryReviews) {
    lines.push(`- ${memberName(review.memberId)} (${review.score}/5), best pick: ${review.bestPick}`);
    for (const point of review.bulletPoints) lines.push(`    • ${point}`);
    if (review.tags?.length) lines.push(`    tagit: ${review.tags.join(", ")}`);
  }
  return lines.join("\n");
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY puuttuu. Aseta se ympäristömuuttujaksi ja yritä uudelleen.");
    process.exit(1);
  }

  const client = new Anthropic();
  const summaries = {};

  for (const entry of series) {
    const entryReviews = reviews.filter((r) => r.seriesId === entry.id);
    if (entryReviews.length === 0) {
      console.warn(`Ohitetaan ${entry.id}: ei arvioita.`);
      continue;
    }

    process.stdout.write(`Generoidaan yhteenveto: ${entry.title}… `);
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(entry, entryReviews) }],
    });

    if (response.stop_reason === "refusal") {
      console.warn("malli kieltäytyi, ohitetaan.");
      continue;
    }

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (text) {
      summaries[entry.id] = text;
      console.log("valmis.");
    } else {
      console.warn("tyhjä vastaus, ohitetaan.");
    }
  }

  const outPath = join(DATA_DIR, "summaries.json");
  writeFileSync(outPath, JSON.stringify(summaries, null, 2) + "\n", "utf8");
  console.log(`\nKirjoitettu ${Object.keys(summaries).length} yhteenvetoa -> ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
