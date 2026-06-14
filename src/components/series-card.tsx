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
      className="surface surface-link group flex gap-4 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex aspect-[2/3] w-14 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-background text-sm font-bold text-muted">
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
        <h3 className="truncate font-bold uppercase leading-tight tracking-tight group-hover:underline">
          {series.title}
        </h3>
        <p className="text-xs uppercase tracking-wide text-muted">
          {SERIES_TYPE_LABELS[series.type]} · {seasonLabel(series.clubSeason)}
        </p>
        <p className="mt-auto pt-1 text-sm">
          <span className="font-mono text-lg font-bold text-accent">{formatScore(score)}</span>
          <span className="text-muted">
            /5{proposer ? ` · ${proposer.name}` : ""}
          </span>
        </p>
      </div>
    </Link>
  );
}
