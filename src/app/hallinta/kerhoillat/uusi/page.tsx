import { getRoomData, seriesByDateDesc } from "@/lib/data";
import { SessionForm } from "@/components/admin/session-form";

export default async function NewSessionPage() {
  const { members, series } = await getRoomData();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold uppercase tracking-tight">Uusi kerhoilta</h1>
      <SessionForm members={members} series={seriesByDateDesc(series)} />
    </div>
  );
}
