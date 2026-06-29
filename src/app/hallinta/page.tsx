import Link from "next/link";
import { getRoomData, seriesByDateDesc } from "@/lib/data";
import { seasonLabel } from "@/lib/labels";
import { supabaseAdmin } from "@/lib/admin/supabase-admin";
import { DeleteSeriesButton } from "@/components/admin/delete-series-button";

export const dynamic = "force-dynamic";

export default async function HallintaDashboard() {
  const [room, sessionsRes, feedbackRes, accountsRes] = await Promise.all([
    getRoomData(),
    supabaseAdmin.from("sessions").select("*", { count: "exact", head: true }).neq("status", "ended"),
    supabaseAdmin.from("feedback").select("*", { count: "exact", head: true }).eq("handled", false),
    supabaseAdmin.from("accounts").select("*", { count: "exact", head: true }),
  ]);
  const sessionsActive = sessionsRes.count ?? 0;
  const feedbackOpen = feedbackRes.count ?? 0;
  const accountsCount = accountsRes.count ?? 0;
  const { members, series, reviews } = room;
  const list = seriesByDateDesc(series);
  const watching = series.filter((s) => s.displayScore === null).length;

  const reviewCount = new Map<string, number>();
  for (const r of reviews) reviewCount.set(r.seriesId, (reviewCount.get(r.seriesId) ?? 0) + 1);

  const stats: { label: string; value: number | string; sub: string; href?: string; alert?: boolean }[] = [
    { label: "Sarjat", value: series.length, sub: `${watching} nyt katselussa`, href: "/sarjat" },
    { label: "Arviot", value: reviews.length, sub: "jäsenarviota" },
    { label: "Jäsenet", value: members.length, sub: "kerholaista", href: "/jasenet" },
    { label: "Kerhoillat", value: sessionsActive, sub: "live / tulossa", href: "/hallinta/kerhoillat" },
    { label: "Palaute", value: feedbackOpen, sub: "käsittelemättä", href: "/hallinta/palaute", alert: feedbackOpen > 0 },
    { label: "Tilit", value: accountsCount, sub: "kirjautunutta", href: "/hallinta/tilit" },
  ];

  const action = "border-2 border-foreground bg-panel px-4 py-2 font-bold tracking-tight";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Kojelauta</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/hallinta/ilmoitus" className={action}>+ Ilmoitus</Link>
          <Link href="/hallinta/sarja/uusi" className={action}>+ Nyt katselussa</Link>
          <Link href="/hallinta/kerhoillat/uusi" className={action}>+ Live-kerhoilta</Link>
          <Link href="/hallinta/kerhoilta" className="border-2 border-foreground bg-accent px-4 py-2 font-bold tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)]">+ Kirjaa kerhoilta</Link>
        </div>
      </div>

      {/* Tunnusluvut */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Tunnusluvut">
        {stats.map((s) => {
          const inner = (
            <>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">{s.label}</span>
              <span className="font-mono text-3xl font-bold text-accent">{s.value}</span>
              <span className="text-xs text-muted">{s.sub}</span>
            </>
          );
          const cls = `surface flex flex-col gap-0.5 p-4 ${s.alert ? "border-l-4 border-l-accent" : ""}`;
          return s.href ? (
            <Link key={s.label} href={s.href} className={`${cls} surface-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}>
              {inner}
            </Link>
          ) : (
            <div key={s.label} className={cls}>{inner}</div>
          );
        })}
      </section>

      {/* Sarjat */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="sec-title w-fit text-lg">Sarjat</h2>
          <span className="font-mono text-sm text-muted">{series.length} kpl</span>
        </div>
        <p className="text-sm text-muted">Uudet sarjat näkyvät yhteysverkossa (Tilastot) vasta seuraavan deployn jälkeen.</p>
        <ul className="flex flex-col divide-y divide-line">
          {list.map((s) => {
            const n = reviewCount.get(s.id) ?? 0;
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0 truncate font-bold">
                  {s.title}{" "}
                  <span className="font-mono text-sm font-normal text-muted">
                    · {seasonLabel(s.clubSeason)}
                    {s.displayScore === null ? " · nyt katselussa" : ` · ${n} arvio${n === 1 ? "" : "ta"}`}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <Link href={`/hallinta/sarja/${s.id}`} className="font-mono text-sm font-bold hover:underline">[ muokkaa ]</Link>
                  <DeleteSeriesButton seriesId={s.id} title={s.title} />
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
