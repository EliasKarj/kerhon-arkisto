import type { Metadata } from "next";
import Link from "next/link";
import { getMemberById, getSeriesByDateDesc } from "@/lib/data";
import { seasonLabel, SERIES_TYPE_LABELS } from "@/lib/labels";
import { formatScore, getSeriesAverageScore } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Aikajana",
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${Number(day)}.${Number(month)}.${year}`;
}

export default function TimelinePage() {
  const series = getSeriesByDateDesc();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">Aikajana</h1>
        <p className="max-w-prose text-muted">
          Kerhon katsomat sarjat kokousjärjestyksessä, uusin ensin.
        </p>
      </div>

      <ol className="ml-1.5 flex flex-col border-l-2 border-foreground">
        {series.map((entry) => {
          const score = getSeriesAverageScore(entry.id);
          const proposer = getMemberById(entry.proposerId);
          return (
            <li key={entry.id} className="relative py-3 pl-6">
              <span
                className="absolute -left-[7px] top-5 size-3 border-2 border-foreground bg-accent"
                aria-hidden
              />
              <time
                dateTime={entry.watchedDate}
                className="font-mono text-xs font-bold uppercase tracking-wide text-muted"
              >
                {seasonLabel(entry.clubSeason)} · {formatDate(entry.watchedDate)}
              </time>
              <h2 className="mt-0.5 text-lg font-bold uppercase tracking-tight">
                <Link
                  href={`/sarja/${entry.id}`}
                  className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {entry.title}
                </Link>
              </h2>
              <p className="text-sm text-muted">
                {SERIES_TYPE_LABELS[entry.type]} ·{" "}
                <span className="font-mono font-bold text-accent">{formatScore(score)}</span>/5
                {proposer ? ` · ehdotti ${proposer.name}` : ""}
                {entry.bestPick ? ` · best girl/boy: ${entry.bestPick}` : ""}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
