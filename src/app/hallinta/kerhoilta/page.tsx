import { getRoomData } from "@/lib/data";
import { ClubNightForm } from "@/components/admin/club-night-form";

export default async function NewClubNightPage() {
  const { members } = await getRoomData();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold uppercase tracking-tight">Uusi kerhoilta</h1>
      <ClubNightForm members={members} />
    </div>
  );
}
