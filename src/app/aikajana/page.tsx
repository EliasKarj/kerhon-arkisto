import type { Metadata } from "next";
import Link from "next/link";
import { getReviewsForSeries, getSeriesByYearDesc } from "@/lib/data";
import { reviewCountLabel, SERIES_TYPE_LABELS } from "@/lib/labels";
import { formatScore, getSeriesAverageScore } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Aikajana",
};

export default function TimelinePage() {
  const series = getSeriesByYearDesc();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Aikajana</h1>
        <p className="max-w-prose text-foreground/70">
          Kerhon katsomat sarjat aikajärjestyksessä, uusin ensin.
        </p>
      </div>

      {series.length > 0 ? (
        <ol className="ml-1.5 flex flex-col border-l border-black/10 dark:border-white/10">
          {series.map((entry) => {
            const average = getSeriesAverageScore(entry.id);
            const reviewCount = getReviewsForSeries(entry.id).length;
            return (
              <li key={entry.id} className="relative py-3 pl-6">
                <span
                  className="absolute -left-[6.5px] top-5 size-3 rounded-full bg-indigo-500 ring-4 ring-background"
                  aria-hidden
                />
                <time
                  dateTime={String(entry.year)}
                  className="text-xs font-medium uppercase tracking-wide text-foreground/50"
                >
                  {entry.year}
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
                  {SERIES_TYPE_LABELS[entry.type]} · {entry.season} ·{" "}
                  <span className="font-medium text-foreground/80 tabular-nums">
                    {formatScore(average)}
                  </span>
                  /5 · {reviewCountLabel(reviewCount)}
                </p>
                {entry.genreTags.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Genretagit">
                    {entry.genreTags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-black/10 px-2 py-0.5 text-xs text-foreground/60 dark:border-white/15"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="text-sm text-foreground/60">Ei vielä katsottuja sarjoja.</p>
      )}
    </section>
  );
}
