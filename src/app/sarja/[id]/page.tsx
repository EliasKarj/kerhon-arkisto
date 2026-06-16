import Link from "next/link";
import { notFound } from "next/navigation";
import { BestPickBarChart } from "@/components/charts/best-pick-bar-chart";
import { MemberScoreRadar } from "@/components/charts/member-score-radar";
import { ReviewCard } from "@/components/review-card";
import {
  getBestPickImage,
  getCoverUrl,
  getRoomData,
  memberById,
  reviewsForSeries,
  seriesById,
} from "@/lib/data";
import { getInitials, seasonLabel, SERIES_TYPE_LABELS } from "@/lib/labels";
import { formatScore, getBestPickCounts, getSeriesScore } from "@/lib/stats";

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${Number(day)}.${Number(month)}.${year}`;
}

export async function generateStaticParams() {
  const { series } = await getRoomData();
  return series.map((entry) => ({ id: entry.id }));
}

export async function generateMetadata({ params }: PageProps<"/sarja/[id]">) {
  const { id } = await params;
  const { series } = await getRoomData();
  return { title: seriesById(series, id)?.title ?? "Sarja" };
}

export default async function SeriesPage({ params }: PageProps<"/sarja/[id]">) {
  const { id } = await params;
  const room = await getRoomData();
  const series = seriesById(room.series, id);
  if (!series) notFound();

  const reviews = reviewsForSeries(room.reviews, id);
  const score = getSeriesScore(room.series, id);
  const proposer = memberById(room.members, series.proposerId);
  const cover = getCoverUrl(series);
  const bestPickImage = getBestPickImage(series);

  const radarData = reviews.map((review) => ({
    member: memberById(room.members, review.memberId)?.name ?? review.memberId,
    score: review.score,
  }));
  const bestPickData = getBestPickCounts(reviews);

  return (
    <article className="flex flex-col gap-10">
      {/* Perustiedot */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex aspect-[2/3] w-28 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-background text-2xl font-bold text-muted sm:w-32">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={`${series.title} -kansikuva`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden>{getInitials(series.title)}</span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              {series.title}
            </h1>
            <p className="text-sm uppercase tracking-wide text-muted">
              {SERIES_TYPE_LABELS[series.type]} · {seasonLabel(series.clubSeason)} ·{" "}
              <time dateTime={series.watchedDate}>{formatDate(series.watchedDate)}</time>
            </p>
            {proposer && (
              <p className="text-sm text-muted">
                Ehdotti{" "}
                <Link
                  href={`/jasen/${proposer.id}`}
                  className="font-semibold text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {proposer.name}
                </Link>
              </p>
            )}
          </div>

          {series.genreTags.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Genretagit">
              {series.genreTags.map((tag) => (
                <li
                  key={tag}
                  className="border-2 border-foreground px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-bold text-accent">{formatScore(score)}</span>
            <span className="text-sm text-muted">/ 5</span>
          </div>
        </div>
      </header>

      {/* Kerhon lempihahmo */}
      {series.bestPick && (
        <section aria-label="Kerhon lempihahmo" className="surface flex items-center gap-4 p-4">
          <div className="flex aspect-[3/4] w-16 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-background text-lg font-bold text-muted">
            {bestPickImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bestPickImage}
                alt={`${series.bestPick} -hahmokuva`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden>{getInitials(series.bestPick)}</span>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Kerhon lempihahmo (Best character)
            </span>
            <span className="text-xl font-bold uppercase">{series.bestPick}</span>
          </div>
        </section>
      )}

      {reviews.length > 0 ? (
        <>
          {/* Kaaviot */}
          <div className="grid gap-8 md:grid-cols-2">
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold uppercase tracking-tight">Jäsenten pisteet</h2>
              <MemberScoreRadar data={radarData} />
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-bold uppercase tracking-tight">Best character -äänet</h2>
              <BestPickBarChart data={bestPickData} />
            </section>
          </div>

          {/* Kommentit */}
          <section className="flex flex-col gap-4">
            <h2 className="text-lg font-bold uppercase tracking-tight">Jäsenten kommentit</h2>
            <ul className="grid gap-5 sm:grid-cols-2">
              {reviews.map((review) => {
                const member = memberById(room.members, review.memberId);
                return (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    heading={{
                      label: member?.name ?? review.memberId,
                      href: `/jasen/${review.memberId}`,
                    }}
                  />
                );
              })}
            </ul>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted">
          {series.clubScore === null
            ? "Tätä sarjaa ei ole vielä arvioitu."
            : "Jäsenten yksityiskohtaisia kommentteja ei ole kirjattu tälle sarjalle."}
        </p>
      )}
    </article>
  );
}
