import type { Metadata } from "next";
import { SeriesCard } from "@/components/series-card";
import { getSeriesByDateDesc } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sarjat",
};

export default function SeriesIndexPage() {
  const series = getSeriesByDateDesc();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sarjat</h1>
        <p className="max-w-prose text-foreground/70">
          Kaikki kerhon arvioimat {series.length} sarjaa ja elokuvaa, uusin ensin. Avaa sarja
          nähdäksesi pisteet, best girl/boy -valinnan ja jäsenten kommentit.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {series.map((entry) => (
          <li key={entry.id}>
            <SeriesCard series={entry} />
          </li>
        ))}
      </ul>
    </section>
  );
}
