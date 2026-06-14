import Link from "next/link";
import { getCoverUrl, getMemberById } from "@/lib/data";
import { getInitials, seasonLabel, SERIES_TYPE_LABELS } from "@/lib/labels";
import { formatScore, getSeriesAverageScore } from "@/lib/stats";
import type { Series } from "@/lib/types";

/** Sarjakortti listoihin ja dashboardiin. Koko kortti on yksi linkki sarjasivulle. */
export function SeriesCard({ series }: { series: Series }) {
  const score = getSeriesAverageScore(series.id);
  const proposer = getMemberById(series.proposerId);
  const cover = getCoverUrl(series);

  return (
    <Link
      href={`/sarja/${series.id}`}
      className="group flex gap-4 rounded-lg border border-black/10 p-3 transition-colors hover:border-black/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:border-white/10 dark:hover:border-white/25"
    >
      <div className="flex aspect-[2/3] w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-sm font-bold text-foreground/70">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={`${series.title} -kansikuva`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden>{getInitials(series.title)}</span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="truncate font-medium group-hover:underline">{series.title}</h3>
        <p className="text-xs text-foreground/60">
          {SERIES_TYPE_LABELS[series.type]} · {seasonLabel(series.clubSeason)}
        </p>
        <p className="mt-auto pt-1 text-sm text-foreground/80">
          <span className="font-semibold tabular-nums">{formatScore(score)}</span>
          <span className="text-foreground/50">
            /5{proposer ? ` · ehdotti ${proposer.name}` : ""}
          </span>
        </p>
      </div>
    </Link>
  );
}
