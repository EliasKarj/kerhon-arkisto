"use client";

import { useState } from "react";
import { SeriesCard, type SeriesCardVM } from "@/components/series-card";
import { seasonLabel } from "@/lib/labels";

export interface BrowserItem {
  card: SeriesCardVM;
  clubSeason: number;
  watchedDate: string;
  genres: string[];
}

interface SeasonGroup {
  season: number;
  items: BrowserItem[];
}

/** Ryhmittelee suodatetut sarjat kausittain, uusin kausi ensin. */
function groupBySeason(items: BrowserItem[]): SeasonGroup[] {
  const bySeason = new Map<number, BrowserItem[]>();
  for (const item of items) {
    const list = bySeason.get(item.clubSeason) ?? [];
    list.push(item);
    bySeason.set(item.clubSeason, list);
  }
  return [...bySeason.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([season, list]) => ({
      season,
      items: list.sort((a, b) => b.watchedDate.localeCompare(a.watchedDate)),
    }));
}

/** Sarjaselain: genre-suodatin + kausittain ryhmitellyt sarjakortit. */
export function SeriesBrowser({ items, allGenres }: { items: BrowserItem[]; allGenres: string[] }) {
  const [genre, setGenre] = useState<string | null>(null);

  const filtered = genre ? items.filter((item) => item.genres.includes(genre)) : items;
  const groups = groupBySeason(filtered);

  function chipClass(active: boolean): string {
    return `border-2 border-foreground px-3 py-1 text-sm font-bold uppercase tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
      active ? "bg-accent text-background" : "bg-panel hover:bg-foreground/10"
    }`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Suodata genrellä ({filtered.length}/{items.length})
        </span>
        <div role="group" aria-label="Suodata genrellä" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={genre === null} onClick={() => setGenre(null)} className={chipClass(genre === null)}>
            Kaikki
          </button>
          {allGenres.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={genre === g}
              onClick={() => setGenre(genre === g ? null : g)}
              className={chipClass(genre === g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted">Ei sarjoja tällä genrellä.</p>
      ) : (
        groups.map((group) => (
          <div key={group.season} className="flex flex-col gap-3">
            <h2 className="sec-title w-fit text-sm">{seasonLabel(group.season)}</h2>
            <ul className="grid gap-4 sm:grid-cols-2">
              {group.items.map((item) => (
                <li key={item.card.id}>
                  <SeriesCard item={item.card} />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
