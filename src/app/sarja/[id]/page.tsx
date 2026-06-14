import Link from "next/link";
import { notFound } from "next/navigation";
import { BestPickBarChart } from "@/components/charts/best-pick-bar-chart";
import { MemberScoreRadar } from "@/components/charts/member-score-radar";
import {
  getMemberById,
  getReviewsForSeries,
  getSeriesById,
  series as allSeries,
} from "@/lib/data";
import { formatScore, getBestPickCounts, getSeriesAverageScore } from "@/lib/stats";
import type { SeriesType } from "@/lib/types";

const TYPE_LABELS: Record<SeriesType, string> = {
  anime: "Anime",
  movie: "Elokuva",
  series: "Sarja",
};

export function generateStaticParams() {
  return allSeries.map((entry) => ({ id: entry.id }));
}

export async function generateMetadata({ params }: PageProps<"/sarja/[id]">) {
  const { id } = await params;
  const series = getSeriesById(id);
  return { title: series ? series.title : "Sarja" };
}

export default async function SeriesPage({ params }: PageProps<"/sarja/[id]">) {
  const { id } = await params;
  const series = getSeriesById(id);
  if (!series) notFound();

  const reviews = getReviewsForSeries(id);
  const average = getSeriesAverageScore(id);
  const radarData = reviews.map((review) => ({
    member: getMemberById(review.memberId)?.name ?? review.memberId,
    score: review.score,
  }));
  const bestPickData = getBestPickCounts(reviews);

  const initials = series.title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <article className="flex flex-col gap-10">
      {/* Perustiedot */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex aspect-[2/3] w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-2xl font-bold text-foreground/70 sm:w-32">
          {series.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={series.coverUrl}
              alt={`${series.title} -kansikuva`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden>{initials}</span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{series.title}</h1>
            <p className="text-sm text-foreground/60">
              {TYPE_LABELS[series.type]} · {series.season} · {series.year}
            </p>
          </div>

          <ul className="flex flex-wrap gap-2" aria-label="Genretagit">
            {series.genreTags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-black/10 px-2.5 py-0.5 text-xs text-foreground/70 dark:border-white/15"
              >
                {tag}
              </li>
            ))}
          </ul>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums">{formatScore(average)}</span>
            <span className="text-sm text-foreground/60">
              / 5 · {reviews.length} {reviews.length === 1 ? "arvio" : "arviota"}
            </span>
          </div>
        </div>
      </header>

      {/* Kaaviot */}
      <div className="grid gap-8 md:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Jäsenten pisteet</h2>
          <MemberScoreRadar data={radarData} />
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Best girl/boy -äänet</h2>
          <BestPickBarChart data={bestPickData} />
        </section>
      </div>

      {/* Kommentit */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Jäsenten kommentit</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => {
            const member = getMemberById(review.memberId);
            return (
              <li
                key={review.id}
                className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-medium">
                    <Link
                      href={`/jasen/${review.memberId}`}
                      className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    >
                      {member?.name ?? review.memberId}
                    </Link>
                  </h3>
                  <span className="text-sm font-semibold tabular-nums text-foreground/80">
                    {formatScore(review.score)}/5
                  </span>
                </div>

                <p className="text-sm">
                  <span className="text-foreground/60">Best pick: </span>
                  <span className="font-medium">{review.bestPick}</span>
                </p>

                <ul className="list-disc pl-5 text-sm text-foreground/80 marker:text-foreground/40">
                  {review.bulletPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>

                {review.tags.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5" aria-label="Tagit">
                    {review.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/60"
                      >
                        #{tag}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </article>
  );
}
