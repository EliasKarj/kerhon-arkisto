import type { Metadata } from "next";
import { SeriesCard } from "@/components/series-card";
import { getSeriesByYearDesc } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sarjat",
};

export default function SeriesIndexPage() {
  const series = getSeriesByYearDesc();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sarjat</h1>
        <p className="max-w-prose text-foreground/70">
          Kaikki kerhon arvioimat sarjat ja elokuvat. Avaa sarja nähdäksesi
          pisteet, best girl/boy -äänet ja jäsenten kommentit.
        </p>
      </div>

      {series.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {series.map((entry) => (
            <li key={entry.id}>
              <SeriesCard series={entry} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-foreground/60">Ei vielä arvioituja sarjoja.</p>
      )}
    </section>
  );
}
