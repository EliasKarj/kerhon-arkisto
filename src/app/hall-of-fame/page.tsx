import type { Metadata } from "next";
import Link from "next/link";
import { getRoomData } from "@/lib/data";
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
      <h2 className="sec-title w-fit text-lg">{title}</h2>
      <ol className="surface-flat flex flex-col divide-y-2 divide-foreground/15">
        {entries.map((entry, index) => (
          <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
            <span className="w-6 shrink-0 text-center font-mono text-sm font-bold text-muted">
              {index + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/sarja/${entry.id}`}
                className="truncate font-bold uppercase tracking-tight hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {entry.title}
              </Link>
              <span className="text-xs uppercase tracking-wide text-muted">
                {seasonLabel(entry.clubSeason)}
              </span>
            </div>
            <span className="shrink-0 font-mono text-lg font-bold text-accent">
              {formatScore(entry.displayScore)}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function HallOfFamePage() {
  const { members, series, reviews } = await getRoomData();
  const top = getTopSeries(series, 5);
  const bottom = getBottomSeries(series, 5);
  const extremes = getReviewerExtremes(members, reviews);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">Hall of Fame</h1>
        <p className="max-w-prose text-muted">
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
        <h2 className="sec-title w-fit text-lg">Tilastokulma</h2>
        {extremes ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="surface flex flex-col gap-1 p-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Tiukin arvioija
              </span>
              <Link
                href={`/jasen/${extremes.strictest.member.id}`}
                className="w-fit text-xl font-bold uppercase hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {extremes.strictest.member.name}
              </Link>
              <span className="text-sm text-muted">
                arvioiden ka{" "}
                <span className="font-mono text-accent">
                  {formatScore(extremes.strictest.average)}
                </span>
              </span>
            </div>
            <div className="surface flex flex-col gap-1 p-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Löysin arvioija
              </span>
              <Link
                href={`/jasen/${extremes.loosest.member.id}`}
                className="w-fit text-xl font-bold uppercase hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {extremes.loosest.member.name}
              </Link>
              <span className="text-sm text-muted">
                arvioiden ka{" "}
                <span className="font-mono text-accent">
                  {formatScore(extremes.loosest.average)}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">Ei vielä tarpeeksi dataa.</p>
        )}
        <p className="text-xs text-muted">
          Tiukin/löysin lasketaan niistä jäsenistä, joiden yksityiskohtaiset arviot on kirjattu.
        </p>
      </section>
    </div>
  );
}
