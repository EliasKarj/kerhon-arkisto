import { getRoomData } from "@/lib/data";
import { NewSeriesForm } from "@/components/admin/new-series-form";

export default async function NewWatchingSeriesPage() {
  const { members, series } = await getRoomData();
  const latestSeason = series.length ? Math.max(...series.map((s) => s.clubSeason)) : 1;
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Lisää nyt katselussa</h1>
      <p className="text-sm text-muted">Sarja lisätään ilman arvosanaa (näkyy etusivun &quot;Nyt katselussa&quot; -kohdassa). Arviot kirjataan myöhemmin kerhoillassa tai jäsenten toimesta.</p>
      <NewSeriesForm members={members} defaultSeason={latestSeason} />
    </div>
  );
}
