import Link from "next/link";
import { formatScore } from "@/lib/stats";
import type { Review } from "@/lib/types";

/**
 * Yksittäinen arvio korttina. Otsikko on konteksti­riippuvainen linkki:
 * sarjasivulla jäsenen nimi, jäsenprofiilissa sarjan nimi. Renderöi `<li>`,
 * joten käyttäjä antaa ympäröivän `<ul>`:n.
 */
export function ReviewCard({
  review,
  heading,
}: {
  review: Review;
  heading: { label: string; href: string };
}) {
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-medium">
          <Link
            href={heading.href}
            className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {heading.label}
          </Link>
        </h3>
        <span className="text-sm font-semibold tabular-nums text-foreground/80">
          {formatScore(review.score)}/5
        </span>
      </div>

      <p className="text-sm">
        <span className="text-foreground/60">Best pick: </span>
        <span className="font-medium">{review.bestPick}</span>
      </p>

      <ul className="list-disc pl-5 text-sm text-foreground/80 marker:text-foreground/40">
        {review.bulletPoints.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>

      {review.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Tagit">
          {review.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs text-foreground/60"
            >
              #{tag}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
