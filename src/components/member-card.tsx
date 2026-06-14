import Link from "next/link";
import { getSeriesProposedBy } from "@/lib/data";
import { getInitials, seriesCountLabel } from "@/lib/labels";
import { formatScore, getMemberProposedAverage } from "@/lib/stats";
import type { Member } from "@/lib/types";

/** Jäsenkortti listaan. Koko kortti on yksi linkki jäsenprofiiliin. */
export function MemberCard({ member }: { member: Member }) {
  const proposedCount = getSeriesProposedBy(member.id).length;
  const proposedAverage = getMemberProposedAverage(member.id);

  return (
    <Link
      href={`/jasen/${member.id}`}
      className="surface surface-link group flex items-center gap-4 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-background text-sm font-bold text-muted">
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatarUrl}
            alt={`${member.name} -avatar`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden>{getInitials(member.name)}</span>
        )}
      </div>

      <div className="flex flex-col">
        <span className="font-bold uppercase tracking-tight group-hover:underline">
          {member.name}
          {member.guest ? <span className="ml-1 text-xs font-normal text-muted">(vieras)</span> : null}
        </span>
        <span className="text-sm text-muted">
          {seriesCountLabel(proposedCount)} · ka{" "}
          <span className="font-mono font-bold text-accent">{formatScore(proposedAverage)}</span>
        </span>
      </div>
    </Link>
  );
}
