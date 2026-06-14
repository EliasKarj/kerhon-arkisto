import type { Metadata } from "next";
import Link from "next/link";
import { seasonLabel } from "@/lib/labels";
import {
  formatScore,
  getBottomSeries,
  getReviewerExtremes,
  getTopSeries,
} from "@/lib/stats";
import type { Series } from "@/lib/types";

export const metadata: Metadata = {
  title: "Hall of Fame",
};

function SeriesRanking({ title, entries }: { title: string; entries: Series[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ol className="flex flex-col gap-2">
        {entries.map((entry, index) => (
          <li
            key={entry.id}
            className="flex items-center gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10"
          >
            <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-foreground/50">
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/sarja/${entry.id}`}
                className="truncate rounded font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {entry.title}
              </Link>
              <span className="text-xs text-foreground/50">{seasonLabel(entry.clubSeason)}</span>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {formatScore(entry.clubScore)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function HallOfFamePage() {
  const top = getTopSeries(5);
  const bottom = getBottomSeries(5);
  const extremes = getReviewerExtremes();

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hall of Fame</h1>
        <p className="max-w-prose text-foreground/70">
          Kerhon parhaat ja huonoimmat animet kaikkien aikojen yhteisarvosanojen mukaan, sekä
          arviointitilastoja.
        </p>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <SeriesRanking title="Parhaat" entries={top} />
        <SeriesRanking title="Huonoimmat" entries={bottom} />
      </div>

      {/* Tilastokulma */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Tilastokulma</h2>
        {extremes ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 rounded-lg border border-black/10 p-5 dark:border-white/10">
              <span className="text-sm text-foreground/60">Tiukin arvioija</span>
              <Link
                href={`/jasen/${extremes.strictest.member.id}`}
                className="w-fit rounded text-xl font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {extremes.strictest.member.name}
              </Link>
              <span className="text-sm text-foreground/50">
                arvioiden ka {formatScore(extremes.strictest.average)}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-black/10 p-5 dark:border-white/10">
              <span className="text-sm text-foreground/60">Löysin arvioija</span>
              <Link
                href={`/jasen/${extremes.loosest.member.id}`}
                className="w-fit rounded text-xl font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {extremes.loosest.member.name}
              </Link>
              <span className="text-sm text-foreground/50">
                arvioiden ka {formatScore(extremes.loosest.average)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/60">Ei vielä tarpeeksi dataa.</p>
        )}
        <p className="text-xs text-foreground/40">
          Tiukin/löysin lasketaan niistä jäsenistä, joiden yksityiskohtaiset arviot on kirjattu.
        </p>
      </section>
    </div>
  );
}
