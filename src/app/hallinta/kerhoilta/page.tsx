import { getRoomData } from "@/lib/data";
import { ClubNightForm } from "@/components/admin/club-night-form";

export default async function NewClubNightPage() {
  const { members, series } = await getRoomData();
  const latestSeason = series.length ? Math.max(...series.map((s) => s.clubSeason)) : 1;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Uusi kerhoilta</h1>
      <ClubNightForm members={members} defaultSeason={latestSeason} />
    </div>
  );
}
