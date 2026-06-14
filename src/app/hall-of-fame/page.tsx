import type { Metadata } from "next";
import Link from "next/link";
import { formatScore, getBestPickLeaderboard, getReviewerExtremes } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Hall of Fame",
};

export default function HallOfFamePage() {
  const leaderboard = getBestPickLeaderboard();
  const extremes = getReviewerExtremes();
  const maxVotes = leaderboard[0]?.count ?? 0;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Hall of Fame</h1>
        <p className="max-w-prose text-foreground/70">
          Kaikkien aikojen best girl/boy -äänet ja kerhon arviointitilastoja.
        </p>
      </section>

      {/* Leaderboard */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Best girl/boy -leaderboard</h2>
        {leaderboard.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {leaderboard.map((entry, index) => (
              <li
                key={entry.label}
                className="flex items-center gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10"
              >
                <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-foreground/50">
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{entry.label}</span>
                    <span className="text-sm text-foreground/60">
                      {entry.count} {entry.count === 1 ? "ääni" : "ääntä"}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10" aria-hidden>
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${maxVotes > 0 ? (entry.count / maxVotes) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-foreground/60">Ei vielä ääniä.</p>
        )}
      </section>

      {/* Tilastokulma */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Tilastokulma</h2>
        {extremes ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 rounded-lg border border-black/10 p-5 dark:border-white/10">
              <span className="text-sm text-foreground/60">Tiukin arvioija</span>
              <Link
                href={`/jasen/${extremes.strictest.member.id}`}
                className="w-fit rounded text-xl font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {extremes.strictest.member.name}
              </Link>
              <span className="text-sm text-foreground/50">
                keskiarvo {formatScore(extremes.strictest.average)}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-black/10 p-5 dark:border-white/10">
              <span className="text-sm text-foreground/60">Löysin arvioija</span>
              <Link
                href={`/jasen/${extremes.loosest.member.id}`}
                className="w-fit rounded text-xl font-semibold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {extremes.loosest.member.name}
              </Link>
              <span className="text-sm text-foreground/50">
                keskiarvo {formatScore(extremes.loosest.average)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/60">Ei vielä tarpeeksi dataa.</p>
        )}
      </section>
    </div>
  );
}
