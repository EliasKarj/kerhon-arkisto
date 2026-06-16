import Link from "next/link";
import { getInitials, seriesCountLabel } from "@/lib/labels";
import { formatScore } from "@/lib/stats";

/** Valmiiksi laskettu näkymämalli jäsenkortille (server rakentaa). */
export interface MemberCardVM {
  id: string;
  name: string;
  avatarUrl: string | null;
  guest?: boolean;
  proposedCount: number;
  proposedAverage: number | null;
}

/** Jäsenkortti listaan. Koko kortti on yksi linkki jäsenprofiiliin. */
export function MemberCard({ item }: { item: MemberCardVM }) {
  return (
    <Link
      href={`/jasen/${item.id}`}
      className="surface surface-link group flex items-center gap-4 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-background text-sm font-bold text-muted">
        {item.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.avatarUrl}
            alt={`${item.name} -avatar`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden>{getInitials(item.name)}</span>
        )}
      </div>

      <div className="flex flex-col">
        <span className="font-bold uppercase tracking-tight group-hover:underline">
          {item.name}
          {item.guest ? <span className="ml-1 text-xs font-normal text-muted">(vieras)</span> : null}
        </span>
        <span className="text-sm text-muted">
          {seriesCountLabel(item.proposedCount)} · ka{" "}
          <span className="font-mono font-bold text-accent">{formatScore(item.proposedAverage)}</span>
        </span>
      </div>
    </Link>
  );
}
