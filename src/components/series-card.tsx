import Link from "next/link";
import { getInitials, seasonLabel, SERIES_TYPE_LABELS } from "@/lib/labels";
import { formatScore } from "@/lib/stats";
import type { SeriesType } from "@/lib/types";

/** Valmiiksi laskettu näkymämalli sarjakortille (server rakentaa). */
export interface SeriesCardVM {
  id: string;
  title: string;
  type: SeriesType;
  clubSeason: number;
  score: number | null;
  proposerName: string | null;
  cover: string | null;
  bestPick: string | null;
}

/** Sarjakortti listoihin ja dashboardiin. Koko kortti on yksi linkki sarjasivulle. */
export function SeriesCard({ item }: { item: SeriesCardVM }) {
  return (
    <Link
      href={`/sarja/${item.id}`}
      className="surface surface-link group flex gap-4 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex aspect-[2/3] w-14 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-background text-sm font-bold text-muted">
        {item.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.cover}
            alt={`${item.title} -kansikuva`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden>{getInitials(item.title)}</span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="truncate font-bold uppercase leading-tight tracking-tight group-hover:underline">
          {item.title}
        </h3>
        <p className="text-xs uppercase tracking-wide text-muted">
          {SERIES_TYPE_LABELS[item.type]} · {seasonLabel(item.clubSeason)}
        </p>
        <p className="mt-auto pt-1 text-sm">
          <span className="font-mono text-lg font-bold text-accent">{formatScore(item.score)}</span>
          <span className="text-muted">
            /5{item.proposerName ? ` · ${item.proposerName}` : ""}
          </span>
        </p>
        {item.bestPick ? (
          <p className="truncate text-xs uppercase tracking-wide text-muted">
            <span className="text-accent">★</span> {item.bestPick}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
