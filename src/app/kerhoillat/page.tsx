import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentAccount } from "@/lib/auth/account";
import { listJoinableSessions } from "@/lib/session/session-actions";
import { getCoverUrl, getRoomData, memberById, seriesById } from "@/lib/data";
import { getInitials } from "@/lib/labels";

export const metadata: Metadata = { title: "Kerhoillat" };
export const dynamic = "force-dynamic";

function formatTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString("fi-FI") : "ajankohta avoin";
}

function SessionCard({
  href, title, cover, when, chairman, live,
}: {
  href: string; title: string; cover: string | null; when: string; chairman: string | null; live: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 rounded-[var(--radius)] border-2 p-4 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        live ? "border-ink bg-panel shadow-[6px_6px_0_var(--color-accent)]" : "border-line bg-panel hover:border-line-strong"
      }`}
    >
      <div className="flex aspect-[2/3] w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-ink bg-background text-xs font-bold text-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden>{getInitials(title)}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {live ? (
          <span className="sticker w-fit -rotate-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
            <span className="inline-block size-1.5 animate-pulse rounded-full bg-ink" aria-hidden /> Käynnissä
          </span>
        ) : (
          <span className="chip w-fit text-[11px] uppercase tracking-wide text-muted">Tulossa</span>
        )}
        <h3 className="truncate font-bold tracking-tight group-hover:underline">{title}</h3>
        <p className="truncate text-xs text-muted">{when}{chairman ? ` · pj ${chairman}` : ""}</p>
      </div>
      <span className="shrink-0 font-mono text-sm font-bold">[ {live ? "liity" : "huone"} → ]</span>
    </Link>
  );
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

  const [sessions, { series, members }] = await Promise.all([listJoinableSessions(), getRoomData()]);
  const live = sessions.filter((s) => s.status === "live");
  const upcoming = sessions.filter((s) => s.status === "scheduled");

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Kerhoillat</h1>

      {sessions.length === 0 && (
        <div className="panel halftone flex flex-col items-center gap-2 px-6 py-16 text-center">
          <span className="text-4xl" aria-hidden>🍿</span>
          <p className="font-bold tracking-tight">Ei käynnissä olevia tai tulevia kerhoiltoja</p>
          <p className="text-sm text-muted">Kun puheenjohtaja ajastaa illan, se ilmestyy tähän.</p>
        </div>
      )}

      {live.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="sec-title w-fit text-lg">Käynnissä</h2>
          {live.map((s) => {
            const so = seriesById(series, s.seriesId);
            return (
              <SessionCard
                key={s.id}
                href={`/kerhoilta/${s.id}`}
                title={so?.title ?? s.seriesId}
                cover={so ? getCoverUrl(so) : null}
                when="Käynnissä nyt"
                chairman={s.chairmanId ? memberById(members, s.chairmanId)?.name ?? null : null}
                live
              />
            );
          })}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="sec-title w-fit text-lg">Tulevat</h2>
          {upcoming.map((s) => {
            const so = seriesById(series, s.seriesId);
            return (
              <SessionCard
                key={s.id}
                href={`/kerhoilta/${s.id}`}
                title={so?.title ?? s.seriesId}
                cover={so ? getCoverUrl(so) : null}
                when={formatTime(s.scheduledAt)}
                chairman={s.chairmanId ? memberById(members, s.chairmanId)?.name ?? null : null}
                live={false}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
