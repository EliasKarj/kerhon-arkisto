import { getRoomData } from "@/lib/data";
import { ClubNightForm } from "@/components/admin/club-night-form";

export default async function NewClubNightPage() {
  const { members, series } = await getRoomData();
  const latestSeason = series.length ? Math.max(...series.map((s) => s.clubSeason)) : 1;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Kirjaa kerhoilta</h1>
        <p className="text-sm text-muted">Tallenna jo pidetyn illan tulokset: kerhon pisteet ja jäsenten arviot kerralla. (Live-iltaa varten: Live-kerhoillat → Uusi live-kerhoilta.)</p>
      </div>
      <ClubNightForm members={members} defaultSeason={latestSeason} />
    </div>
  );
}
