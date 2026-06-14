import Link from "next/link";
import { SeriesCard } from "@/components/series-card";
import { getCoverUrl, getMemberById, getSeriesByDateDesc } from "@/lib/data";
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

  const recent = seriesByRecency.filter((entry) => entry.id !== current?.id).slice(0, 4);

  const latestRated = seriesByRecency.find(
    (entry) => entry.clubScore !== null && entry.bestPick !== null,
  );

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
          className="overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10"
        >
          <Link
            href={`/sarja/${current.id}`}
            className="group flex flex-col gap-5 p-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground sm:flex-row sm:items-center sm:gap-6 sm:p-6"
          >
            <div className="flex aspect-[2/3] w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-xl font-bold text-foreground/70 sm:w-28">
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
            </div>

            <div className="flex flex-1 flex-col gap-2">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400">
                <span className="inline-block size-2 animate-pulse rounded-full bg-indigo-500" aria-hidden />
                Nyt katselussa
              </span>
              <h2 className="text-2xl font-semibold tracking-tight group-hover:underline sm:text-3xl">
                {current.title}
              </h2>
              <p className="text-sm text-foreground/60">
                {SERIES_TYPE_LABELS[current.type]} · {seasonLabel(current.clubSeason)} ·{" "}
                <time dateTime={current.watchedDate}>{formatDate(current.watchedDate)}</time>
                {currentProposer ? ` · ehdotti ${currentProposer.name}` : ""}
              </p>
              <span className="w-fit rounded-full border border-indigo-500/30 bg-background/40 px-3 py-1 text-xs font-medium text-foreground/70">
                Ei vielä arvioitu
              </span>
            </div>
          </Link>
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
          <div className="flex flex-col gap-1 rounded-lg border border-black/10 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-5 dark:border-white/10">
            <span className="text-sm text-foreground/60">
              Best girl/boy — {latestRated.title}
            </span>
            <span className="text-3xl font-bold">{latestRated.bestPick}</span>
            <span className="text-sm text-foreground/50">viimeisimmästä arvioidusta sarjasta</span>
          </div>
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
