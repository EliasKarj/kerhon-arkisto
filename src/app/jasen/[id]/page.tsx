import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/review-card";
import {
  getRoomData,
  memberById,
  reviewsForMember,
  seriesById,
  seriesProposedBy,
} from "@/lib/data";
import { getInitials, seasonLabel, seriesCountLabel } from "@/lib/labels";
import {
  formatScore,
  getClubAverageScore,
  getMemberProposedAverage,
  getTagCounts,
} from "@/lib/stats";

export async function generateStaticParams() {
  const { members } = await getRoomData();
  return members.map((member) => ({ id: member.id }));
}

export async function generateMetadata({ params }: PageProps<"/jasen/[id]">) {
  const { id } = await params;
  const { members } = await getRoomData();
  return { title: memberById(members, id)?.name ?? "Jäsen" };
}

export default async function MemberPage({ params }: PageProps<"/jasen/[id]">) {
  const { id } = await params;
  const room = await getRoomData();
  const member = memberById(room.members, id);
  if (!member) notFound();

  const proposed = seriesProposedBy(room.series, id);
  const reviews = reviewsForMember(room.reviews, id);
  const proposedAverage = getMemberProposedAverage(room.series, id);
  const clubAverage = getClubAverageScore(room.series);
  const tagCounts = getTagCounts(reviews);

  const diff =
    proposedAverage !== null && clubAverage !== null ? proposedAverage - clubAverage : null;
  const diffLabel =
    diff === null ? "–" : `${diff >= 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)}`;

  return (
    <article className="flex flex-col gap-10">
      {/* Perustiedot */}
      <header className="flex items-center gap-4 sm:gap-6">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-background text-xl font-bold text-muted sm:size-20">
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
          <h1 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">
            {member.name}
            {member.guest ? (
              <span className="ml-2 align-middle text-sm font-normal text-muted">(vieras)</span>
            ) : null}
          </h1>
          <p className="text-sm text-muted">ehdotti {seriesCountLabel(proposed.length)}</p>
        </div>
      </header>

      {/* Ehdotusten keskiarvo vs. kerho */}
      <section className="grid gap-5 sm:grid-cols-3" aria-label="Keskiarvot">
        <div className="surface flex flex-col gap-1 p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Ehdotusten keskiarvo
          </span>
          <span className="font-mono text-3xl font-bold text-accent">
            {formatScore(proposedAverage)}
          </span>
        </div>
        <div className="surface flex flex-col gap-1 p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Kerhon keskiarvo
          </span>
          <span className="font-mono text-3xl font-bold">{formatScore(clubAverage)}</span>
        </div>
        <div className="surface flex flex-col gap-1 p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Ero kerhoon
          </span>
          <span className="font-mono text-3xl font-bold">{diffLabel}</span>
        </div>
      </section>

      {/* Ehdottamat sarjat */}
      {proposed.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="sec-title w-fit text-lg">Ehdottamat sarjat</h2>
          <ul className="surface-flat flex flex-col divide-y-2 divide-foreground/15">
            {proposed.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 px-4 py-2">
                <div className="flex min-w-0 flex-col">
                  <Link
                    href={`/sarja/${entry.id}`}
                    className="truncate text-sm font-bold uppercase tracking-tight hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {entry.title}
                  </Link>
                  <span className="text-xs uppercase tracking-wide text-muted">
                    {seasonLabel(entry.clubSeason)}
                    {entry.bestPick ? ` · ${entry.bestPick}` : ""}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-sm font-bold text-accent">
                  {formatScore(entry.clubScore)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Suosikkitagit (detaljiarvioista) */}
      {tagCounts.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="sec-title w-fit text-lg">Suosikkitagit</h2>
          <ul className="flex flex-wrap gap-2">
            {tagCounts.map((tag) => (
              <li
                key={tag.label}
                className="border-2 border-foreground px-3 py-1 text-sm font-medium text-muted"
              >
                #{tag.label}
                <span className="ml-1 font-mono text-accent">{tag.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Arviot (detaljidatasta) */}
      {reviews.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="sec-title w-fit text-lg">Arviot</h2>
          <ul className="grid gap-5 sm:grid-cols-2">
            {reviews.map((review) => {
              const series = seriesById(room.series, review.seriesId);
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
      )}
    </article>
  );
}
