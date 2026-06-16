import Link from "next/link";
import { SeriesCard } from "@/components/series-card";
import {
  getCoverUrl,
  getRoomData,
  getWatchLinks,
  memberById,
  seriesByDateDesc,
} from "@/lib/data";
import { getTotalWatchTime } from "@/lib/fun-stats";
import { getInitials, seasonLabel, SERIES_TYPE_LABELS } from "@/lib/labels";
import { formatScore, getClubAverageScore } from "@/lib/stats";

const QUICK_LINKS = [
  { href: "/sarjat", label: "Sarjat", description: "Kaikki arvioidut sarjat" },
  { href: "/jasenet", label: "Jäsenet", description: "Kerhon arvioijat" },
  { href: "/hall-of-fame", label: "Hall of Fame", description: "Parhaat, huonoimmat ja tilastot" },
  { href: "/aikajana", label: "Aikajana", description: "Katsotut kronologisesti" },
];

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${Number(day)}.${Number(month)}.${year}`;
}

export default async function HomePage() {
  const { members, series } = await getRoomData();
  const seriesByRecency = seriesByDateDesc(series);
  const clubAverage = getClubAverageScore(series);

  const current = seriesByRecency.find((entry) => entry.clubScore === null) ?? null;
  const currentProposer = current ? memberById(members, current.proposerId) : null;
  const currentCover = current ? getCoverUrl(current) : null;
  const currentLinks = current ? getWatchLinks(current.id) : null;

  const recent = seriesByRecency.filter((entry) => entry.id !== current?.id).slice(0, 4);

  const watchTime = getTotalWatchTime(series);

  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">Kerhon Arkisto</h1>

      {/* Nyt katselussa */}
      {current && (
        <section
          aria-label="Nyt katselussa"
          className="flex flex-col gap-5 border-2 border-foreground bg-panel p-5 shadow-[8px_8px_0_var(--color-accent)] sm:flex-row sm:items-center sm:gap-6 sm:p-6"
        >
          <Link
            href={`/sarja/${current.id}`}
            aria-label={current.title}
            className="flex aspect-[2/3] w-24 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-background text-xl font-bold text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-28"
          >
            {currentCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentCover}
                alt={`${current.title} -kansikuva`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden>{getInitials(current.title)}</span>
            )}
          </Link>

          <div className="flex flex-1 flex-col gap-2">
            <span className="flex w-fit -rotate-1 items-center gap-2 border-2 border-foreground bg-accent px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-background">
              <span className="inline-block size-2 animate-pulse rounded-full bg-background" aria-hidden />
              Nyt katselussa
            </span>
            <h2 className="text-2xl font-bold uppercase tracking-tight sm:text-3xl">
              <Link
                href={`/sarja/${current.id}`}
                className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {current.title}
              </Link>
            </h2>
            <p className="text-sm text-muted">
              {SERIES_TYPE_LABELS[current.type]} · {seasonLabel(current.clubSeason)} ·{" "}
              <time dateTime={current.watchedDate}>{formatDate(current.watchedDate)}</time>
              {currentProposer ? ` · ehdotti ${currentProposer.name}` : ""}
            </p>
            <span className="w-fit border-2 border-foreground bg-background px-2.5 py-0.5 font-mono text-xs font-semibold">
              EI VIELÄ ARVIOITU
            </span>

            {currentLinks && (currentLinks.streaming.length > 0 || currentLinks.anilist) && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Katso:</span>
                <ul className="flex flex-wrap gap-2">
                  {currentLinks.streaming.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border-2 border-foreground bg-background py-1 pl-1.5 pr-3 text-xs font-semibold shadow-[3px_3px_0_var(--color-foreground)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        {link.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={link.icon} alt="" className="size-4 object-contain" />
                        ) : link.color ? (
                          <span className="size-2" style={{ backgroundColor: link.color }} aria-hidden />
                        ) : null}
                        {link.site}
                      </a>
                    </li>
                  ))}
                  {currentLinks.anilist && (
                    <li>
                      <a
                        href={currentLinks.anilist}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center border-2 border-foreground bg-background px-3 py-1 text-xs font-semibold text-muted shadow-[3px_3px_0_var(--color-foreground)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                      >
                        AniList
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tilastonostot */}
      <section className="grid gap-5 sm:grid-cols-2" aria-label="Yleiskatsaus">
        <div className="surface flex flex-col gap-1 p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Kerhon kokonaiskeskiarvo
          </span>
          <span className="font-mono text-5xl font-bold text-accent">{formatScore(clubAverage)}</span>
          <span className="text-sm text-muted">
            kaikkien arvioitujen sarjojen keskiarvo asteikolla 0–5
          </span>
        </div>

        <div className="surface flex flex-col gap-1 p-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Katseluaika / henkilö
          </span>
          <span className="font-mono text-5xl font-bold text-accent">{watchTime.hours} h</span>
          <span className="text-sm text-muted">
            ≈ {watchTime.days} vrk animea putkeen tässä kerhossa
          </span>
        </div>
      </section>

      {/* Viimeksi katsotut */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="sec-title text-lg">Viimeksi katsotut</h2>
          <Link
            href="/sarjat"
            className="font-mono text-sm font-bold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            [ kaikki → ]
          </Link>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2">
          {recent.map((s) => (
            <li key={s.id}>
              <SeriesCard
                item={{
                  id: s.id,
                  title: s.title,
                  type: s.type,
                  clubSeason: s.clubSeason,
                  score: s.clubScore,
                  proposerName: memberById(members, s.proposerId)?.name ?? null,
                  cover: getCoverUrl(s),
                  bestPick: s.bestPick,
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* Pikalinkit */}
      <section className="flex flex-col gap-4">
        <h2 className="sec-title w-fit text-lg">Selaa</h2>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="surface surface-link flex h-full flex-col gap-1 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="font-bold uppercase tracking-tight">{link.label}</span>
                <span className="text-sm text-muted">{link.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
