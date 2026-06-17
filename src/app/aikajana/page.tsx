import type { Metadata } from "next";
import { Timeline, type TimelineItem } from "@/components/timeline";
import { getRoomData, memberById, seriesByDateDesc } from "@/lib/data";
import { seasonLabel, SERIES_TYPE_LABELS } from "@/lib/labels";
import { formatScore } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Aikajana",
};

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${Number(day)}.${Number(month)}.${year}`;
}

export default async function TimelinePage() {
  const { members, series } = await getRoomData();
  const items: TimelineItem[] = seriesByDateDesc(series).map((entry) => {
    const proposer = memberById(members, entry.proposerId);
    return {
      id: entry.id,
      title: entry.title,
      meta: `${seasonLabel(entry.clubSeason)} · ${formatDate(entry.watchedDate)}`,
      watchedDate: entry.watchedDate,
      typeLabel: SERIES_TYPE_LABELS[entry.type],
      score: formatScore(entry.displayScore),
      proposer: proposer ? proposer.name : null,
      bestPick: entry.bestPick,
    };
  });

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">Aikajana</h1>
        <p className="max-w-prose text-muted">
          Kerhon katsomat sarjat aikajärjestyksessä, uusin vasemmalla. Vedä aikajanaa
          sivuttain selataksesi vanhempiin.
        </p>
      </div>

      <Timeline items={items} />
    </section>
  );
}
