import Link from "next/link";
import { SeriesCard } from "@/components/series-card";
import {
  getBestPickImage,
  getCoverUrl,
  getMemberById,
  getSeriesByDateDesc,
  getWatchLinks,
} from "@/lib/data";
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

export default function HomePage() {
  const seriesByRecency = getSeriesByDateDesc();
  const clubAverage = getClubAverageScore();

  // Nyt katselussa = uusin sarja, jota ei ole vielä arvioitu.
  const current = seriesByRecency.find((entry) => entry.clubScore === null) ?? null;
  const currentProposer = current ? getMemberById(current.proposerId) : null;
  const currentCover = current ? getCoverUrl(current) : null;
  const currentLinks = current ? getWatchLinks(current.id) : null;

  const recent = seriesByRecency.filter((entry) => entry.id !== current?.id).slice(0, 4);

  const latestRated = seriesByRecency.find(
    (entry) => entry.clubScore !== null && entry.bestPick !== null,
  );
  const latestRatedImage = latestRated ? getBestPickImage(latestRated.id) : null;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Kerhon Arkisto</h1>
        <p className="max-w-prose text-foreground/70">
          Kaveriporukan anime- ja elokuva-arvioiden arkisto: {seriesByRecency.length} sarjaa,
          best girl/boy -valinnat ja tilastot yhdessä paikassa.
        </p>
      </section>

      {/* Nyt katselussa */}
      {current && (
        <section
          aria-label="Nyt katselussa"
          className="flex flex-col gap-5 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
        >
          <Link
            href={`/sarja/${current.id}`}
            aria-label={current.title}
            className="flex aspect-[2/3] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-xl font-bold text-foreground/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:w-28"
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
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
              <span className="inline-block size-2 animate-pulse rounded-full bg-indigo-500" aria-hidden />
              Nyt katselussa
            </span>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              <Link
                href={`/sarja/${current.id}`}
                className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {current.title}
              </Link>
            </h2>
            <p className="text-sm text-foreground/60">
              {SERIES_TYPE_LABELS[current.type]} · {seasonLabel(current.clubSeason)} ·{" "}
              <time dateTime={current.watchedDate}>{formatDate(current.watchedDate)}</time>
              {currentProposer ? ` · ehdotti ${currentProposer.name}` : ""}
            </p>
            <span className="w-fit rounded-full border border-indigo-500/30 bg-background/40 px-3 py-1 text-xs font-medium text-foreground/70">
              Ei vielä arvioitu
            </span>

            {currentLinks && (currentLinks.streaming.length > 0 || currentLinks.anilist) && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-xs font-medium text-foreground/50">Katso:</span>
                <ul className="flex flex-wrap gap-2">
                  {currentLinks.streaming.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-background/60 py-1 pl-1.5 pr-3 text-xs font-medium transition-colors hover:border-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:border-white/15 dark:hover:border-white/30"
                      >
                        {link.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={link.icon}
                            alt=""
                            className="size-4 rounded-[3px] object-contain"
                          />
                        ) : link.color ? (
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: link.color }}
                            aria-hidden
                          />
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
                        className="inline-flex items-center rounded-full border border-black/10 bg-background/60 px-3 py-1 text-xs font-medium text-foreground/60 transition-colors hover:border-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:border-white/15 dark:hover:border-white/30"
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
      <section className="grid gap-4 sm:grid-cols-2" aria-label="Yleiskatsaus">
        <div className="flex flex-col gap-1 rounded-lg border border-black/10 p-5 dark:border-white/10">
          <span className="text-sm text-foreground/60">Kerhon kokonaiskeskiarvo</span>
          <span className="text-4xl font-bold tabular-nums">{formatScore(clubAverage)}</span>
          <span className="text-sm text-foreground/50">
            kaikkien arvioitujen sarjojen keskiarvo asteikolla 0–5
          </span>
        </div>

        {latestRated && (
          <Link
            href={`/sarja/${latestRated.id}`}
            className="group flex items-center gap-4 rounded-lg border border-black/10 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-5 transition-colors hover:border-black/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:border-white/10 dark:hover:border-white/25"
          >
            <div className="flex aspect-[3/4] w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-base font-bold text-foreground/70">
              {latestRatedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={latestRatedImage}
                  alt={`${latestRated.bestPick} -hahmokuva`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden>{getInitials(latestRated.bestPick ?? latestRated.title)}</span>
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm text-foreground/60">
                Best girl/boy — {latestRated.title}
              </span>
              <span className="text-2xl font-bold group-hover:underline">
                {latestRated.bestPick}
              </span>
              <span className="text-sm text-foreground/50">
                viimeisimmästä arvioidusta sarjasta
              </span>
            </div>
          </Link>
        )}
      </section>

      {/* Viimeksi katsotut */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Viimeksi katsotut</h2>
          <Link
            href="/sarjat"
            className="rounded text-sm text-foreground/60 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Kaikki sarjat →
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {recent.map((series) => (
            <li key={series.id}>
              <SeriesCard series={series} />
            </li>
          ))}
        </ul>
      </section>

      {/* Pikalinkit */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Selaa</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="flex h-full flex-col gap-1 rounded-lg border border-black/10 p-4 transition-colors hover:border-black/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:border-white/10 dark:hover:border-white/25"
              >
                <span className="font-medium">{link.label}</span>
                <span className="text-sm text-foreground/60">{link.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
