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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Aikajana</h1>
        <p className="max-w-prose text-foreground/70">
          Kerhon katsomat sarjat kokousjärjestyksessä, uusin ensin.
        </p>
      </div>

      <ol className="ml-1.5 flex flex-col border-l border-black/10 dark:border-white/10">
        {series.map((entry) => {
          const score = getSeriesAverageScore(entry.id);
          const proposer = getMemberById(entry.proposerId);
          return (
            <li key={entry.id} className="relative py-3 pl-6">
              <span
                className="absolute -left-[6.5px] top-5 size-3 rounded-full bg-indigo-500 ring-4 ring-background"
                aria-hidden
              />
              <time
                dateTime={entry.watchedDate}
                className="text-xs font-medium uppercase tracking-wide text-foreground/50"
              >
                {seasonLabel(entry.clubSeason)} · {formatDate(entry.watchedDate)}
              </time>
              <h2 className="mt-0.5 text-lg font-semibold">
                <Link
                  href={`/sarja/${entry.id}`}
                  className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {entry.title}
                </Link>
              </h2>
              <p className="text-sm text-foreground/60">
                {SERIES_TYPE_LABELS[entry.type]} ·{" "}
                <span className="font-medium text-foreground/80 tabular-nums">
                  {formatScore(score)}
                </span>
                /5
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
