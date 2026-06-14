import Link from "next/link";
import { SeriesCard } from "@/components/series-card";
import { getSeriesByDateDesc } from "@/lib/data";
import { formatScore, getClubAverageScore } from "@/lib/stats";

const QUICK_LINKS = [
  { href: "/sarjat", label: "Sarjat", description: "Kaikki arvioidut sarjat" },
  { href: "/jasenet", label: "Jäsenet", description: "Kerhon arvioijat" },
  { href: "/hall-of-fame", label: "Hall of Fame", description: "Parhaat, huonoimmat ja tilastot" },
  { href: "/aikajana", label: "Aikajana", description: "Katsotut kronologisesti" },
];

export default function HomePage() {
  const seriesByRecency = getSeriesByDateDesc();
  const clubAverage = getClubAverageScore();

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
          {seriesByRecency.slice(0, 4).map((series) => (
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
