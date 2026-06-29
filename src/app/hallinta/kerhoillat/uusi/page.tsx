import { getRoomData, seriesByDateDesc } from "@/lib/data";
import { SessionForm } from "@/components/admin/session-form";

export default async function NewSessionPage() {
  const { members, series } = await getRoomData();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Uusi live-kerhoilta</h1>
        <p className="text-sm text-muted">Ajasta live-ilta jota ajetaan huoneessa (aloita/päätä, jäsenet arvioivat reaaliajassa). Tässä valitaan puheenjohtaja.</p>
      </div>
      <SessionForm members={members} series={seriesByDateDesc(series)} />
    </div>
  );
}
