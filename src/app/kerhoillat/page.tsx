import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentAccount } from "@/lib/auth/account";
import { listJoinableSessions } from "@/lib/session/session-actions";
import { getRoomData, seriesById } from "@/lib/data";

export const metadata: Metadata = { title: "Kerhoillat" };
export const dynamic = "force-dynamic";

function formatTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("fi-FI") : "ajankohta avoin";
}

export default async function KerhoillatPage() {
  const account = await getCurrentAccount();

  if (!account) {
    return (
      <section className="mx-auto flex max-w-sm flex-col gap-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Kerhoillat</h1>
        <p className="text-muted">
          <Link href="/tili" className="font-semibold text-foreground hover:underline">Kirjaudu Discordilla</Link> nähdäksesi kerhoillat.
        </p>
      </section>
    );
  }
  if (!account.memberId) {
    return (
      <section className="mx-auto flex max-w-sm flex-col gap-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Kerhoillat</h1>
        <p className="text-muted">Tilisi odottaa linkitystä — <Link href="/tili" className="font-semibold text-foreground hover:underline">tili</Link>.</p>
      </section>
    );
  }

  const [sessions, { series }] = await Promise.all([listJoinableSessions(), getRoomData()]);
  const live = sessions.filter((s) => s.status === "live");
  const upcoming = sessions.filter((s) => s.status === "scheduled");

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Kerhoillat</h1>

      {sessions.length === 0 && <p className="text-muted">Ei käynnissä olevia tai tulevia kerhoiltoja.</p>}

      {live.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="sec-title w-fit text-lg">Käynnissä</h2>
          {live.map((s) => (
            <Link key={s.id} href={`/kerhoilta/${s.id}`} className="surface flex items-center justify-between p-4 shadow-[6px_6px_0_var(--color-accent)]">
              <span className="flex items-center gap-2 font-bold tracking-tight">
                <span className="inline-block size-2 animate-pulse rounded-full bg-accent" aria-hidden /> {seriesById(series, s.seriesId)?.title ?? s.seriesId}
              </span>
              <span className="font-mono text-sm font-bold">[ liity → ]</span>
            </Link>
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="sec-title w-fit text-lg">Tulevat</h2>
          <ul className="flex flex-col divide-y-2 divide-foreground/15">
            {upcoming.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span className="font-bold">{seriesById(series, s.seriesId)?.title ?? s.seriesId}
                  <span className="ml-2 font-mono text-sm text-muted">· {formatTime(s.scheduledAt)}</span>
                </span>
                <Link href={`/kerhoilta/${s.id}`} className="font-mono text-sm font-bold hover:underline">[ huone → ]</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
