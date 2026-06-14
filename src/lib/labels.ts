import type { SeriesType } from "./types";

export const SERIES_TYPE_LABELS: Record<SeriesType, string> = {
  anime: "Anime",
  movie: "Elokuva",
  series: "Sarja",
};

/** Sarjan otsikon 1–2 ensimmäistä alkukirjainta kansiplaceholderia varten. */
export function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** "n arvio" / "n arviota" -taivutus. */
export function reviewCountLabel(count: number): string {
  return `${count} ${count === 1 ? "arvio" : "arviota"}`;
}
