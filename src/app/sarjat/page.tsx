import type { Metadata } from "next";
import { SeriesBrowser, type BrowserItem } from "@/components/series-browser";
import { getCoverUrl, getMeta, getRoomData, memberById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sarjat",
};

export default async function SeriesIndexPage() {
  const { members, series } = await getRoomData();
  const items: BrowserItem[] = series.map((s) => ({
    card: {
      id: s.id,
      title: s.title,
      type: s.type,
      clubSeason: s.clubSeason,
      score: s.clubScore,
      proposerName: memberById(members, s.proposerId)?.name ?? null,
      cover: getCoverUrl(s),
      bestPick: s.bestPick,
    },
    clubSeason: s.clubSeason,
    watchedDate: s.watchedDate,
    genres: getMeta(s)?.genres ?? [],
  }));
  const allGenres = [...new Set(items.flatMap((item) => item.genres))].sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">Sarjat</h1>
        <p className="max-w-prose text-muted">
          Kaikki kerhon arvioimat {items.length} sarjaa ja elokuvaa, ryhmiteltynä kausittain
          (uusin ensin). Suodata genrellä tai avaa sarja nähdäksesi pisteet, Best character
          -valinnan ja jäsenten kommentit.
        </p>
      </div>

      <SeriesBrowser items={items} allGenres={allGenres} />
    </section>
  );
}
