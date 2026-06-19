import { notFound } from "next/navigation";
import { getRoomData, reviewsForSeries, seriesById } from "@/lib/data";
import { ClubNightForm } from "@/components/admin/club-night-form";
import type { ReviewInput } from "@/lib/admin/validation";

export default async function EditSeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { members, series, reviews } = await getRoomData();
  const s = seriesById(series, id);
  if (!s) notFound();
  const reviewInputs: ReviewInput[] = reviewsForSeries(reviews, id).map((r) => ({
    memberId: r.memberId, guestName: null, score: r.score,
    bulletPoints: r.bulletPoints, bestPick: r.bestPick, tags: r.tags,
  }));
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Muokkaa: {s.title}</h1>
      <ClubNightForm
        members={members}
        editSeriesId={s.id}
        initial={{
          chosen: { anilistId: s.anilistId, title: s.title, manual: s.anilistId === null },
          clubSeason: s.clubSeason,
          watchedDate: s.watchedDate,
          proposerId: s.proposerId,
          clubScore: s.clubScore,
          bestPick: s.bestPick ?? "",
          reviews: reviewInputs,
        }}
      />
    </div>
  );
}
