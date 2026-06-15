import type { Metadata } from "next";
import { SeriesBrowser, type BrowserItem } from "@/components/series-browser";
import { getMeta, series as allSeries } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sarjat",
};

export default function SeriesIndexPage() {
  const items: BrowserItem[] = allSeries.map((series) => ({
    series,
    genres: getMeta(series.id)?.genres ?? [],
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
