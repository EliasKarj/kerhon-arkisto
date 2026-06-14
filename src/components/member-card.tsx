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
      className="group flex items-center gap-4 rounded-lg border border-black/10 p-4 transition-colors hover:border-black/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:border-white/10 dark:hover:border-white/25"
    >
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-sm font-bold text-foreground/70">
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
        <span className="font-medium group-hover:underline">
          {member.name}
          {member.guest ? <span className="ml-1 text-xs text-foreground/40">(vieras)</span> : null}
        </span>
        <span className="text-sm text-foreground/60">
          ehdotti {seriesCountLabel(proposedCount)} · ehdotusten ka{" "}
          <span className="font-semibold tabular-nums text-foreground/80">
            {formatScore(proposedAverage)}
          </span>
        </span>
      </div>
    </Link>
  );
}
