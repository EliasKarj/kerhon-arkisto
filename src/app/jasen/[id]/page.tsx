import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/review-card";
import {
  getMemberById,
  getReviewsForMember,
  getSeriesById,
  members as allMembers,
} from "@/lib/data";
import { getInitials, reviewCountLabel } from "@/lib/labels";
import {
  formatScore,
  getClubAverageScore,
  getMemberAverageScore,
  getTagCounts,
} from "@/lib/stats";

export function generateStaticParams() {
  return allMembers.map((member) => ({ id: member.id }));
}

export async function generateMetadata({ params }: PageProps<"/jasen/[id]">) {
  const { id } = await params;
  const member = getMemberById(id);
  return { title: member ? member.name : "Jäsen" };
}

export default async function MemberPage({ params }: PageProps<"/jasen/[id]">) {
  const { id } = await params;
  const member = getMemberById(id);
  if (!member) notFound();

  const reviews = getReviewsForMember(id);
  const memberAverage = getMemberAverageScore(id);
  const clubAverage = getClubAverageScore();
  const tagCounts = getTagCounts(reviews);

  const diff =
    memberAverage !== null && clubAverage !== null ? memberAverage - clubAverage : null;
  const diffLabel =
    diff === null ? "–" : `${diff >= 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)}`;

  return (
    <article className="flex flex-col gap-10">
      {/* Perustiedot */}
      <header className="flex items-center gap-4 sm:gap-6">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-xl font-bold text-foreground/70 sm:size-20">
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatarUrl}
              alt={`${member.name} -avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden>{getInitials(member.name)}</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{member.name}</h1>
          <p className="text-sm text-foreground/60">{reviewCountLabel(reviews.length)}</p>
        </div>
      </header>

      {/* Keskiarvo vs. kerho */}
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Keskiarvot">
        <div className="flex flex-col gap-1 rounded-lg border border-black/10 p-4 dark:border-white/10">
          <span className="text-sm text-foreground/60">Keskiarvo</span>
          <span className="text-3xl font-bold tabular-nums">{formatScore(memberAverage)}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-black/10 p-4 dark:border-white/10">
          <span className="text-sm text-foreground/60">Kerhon keskiarvo</span>
          <span className="text-3xl font-bold tabular-nums">{formatScore(clubAverage)}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-black/10 p-4 dark:border-white/10">
          <span className="text-sm text-foreground/60">Ero kerhoon</span>
          <span className="text-3xl font-bold tabular-nums">{diffLabel}</span>
        </div>
      </section>

      {/* Suosikkitagit */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Suosikkitagit</h2>
        {tagCounts.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {tagCounts.map((tag) => (
              <li
                key={tag.label}
                className="rounded-full bg-foreground/5 px-3 py-1 text-sm text-foreground/70"
              >
                #{tag.label}
                <span className="ml-1 text-foreground/40 tabular-nums">{tag.count}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground/60">Ei vielä tageja.</p>
        )}
      </section>

      {/* Best pick -historia */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Best girl/boy -valinnat</h2>
        <ul className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
          {reviews.map((review) => {
            const series = getSeriesById(review.seriesId);
            return (
              <li key={review.id} className="flex items-center justify-between gap-2 py-2">
                <Link
                  href={`/sarja/${review.seriesId}`}
                  className="rounded text-sm text-foreground/70 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  {series?.title ?? review.seriesId}
                </Link>
                <span className="text-sm font-medium">{review.bestPick}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Arviot */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Arviot</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => {
            const series = getSeriesById(review.seriesId);
            return (
              <ReviewCard
                key={review.id}
                review={review}
                heading={{
                  label: series?.title ?? review.seriesId,
                  href: `/sarja/${review.seriesId}`,
                }}
              />
            );
          })}
        </ul>
      </section>
    </article>
  );
}
