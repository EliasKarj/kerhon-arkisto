import Link from "next/link";
import { getRoomData, seriesByDateDesc } from "@/lib/data";
import { seasonLabel } from "@/lib/labels";

export default async function HallintaDashboard() {
  const { series } = await getRoomData();
  const list = seriesByDateDesc(series);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold uppercase tracking-tight">Kojelauta</h1>
        <Link href="/hallinta/kerhoilta" className="border-2 border-foreground bg-accent px-4 py-2 font-bold uppercase tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)]">+ Uusi kerhoilta</Link>
      </div>
      <p className="text-sm text-muted">Uudet sarjat näkyvät yhteysverkossa (Tilastot) vasta seuraavan deployn jälkeen.</p>
      <ul className="flex flex-col divide-y-2 divide-foreground/15">
        {list.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-2">
            <span className="font-bold">{s.title} <span className="font-mono text-sm text-muted">· {seasonLabel(s.clubSeason)}{s.clubScore === null ? " · nyt katselussa" : ""}</span></span>
            <Link href={`/hallinta/sarja/${s.id}`} className="font-mono text-sm font-bold hover:underline">[ muokkaa ]</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
