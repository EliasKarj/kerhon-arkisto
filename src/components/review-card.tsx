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
    <li className="surface flex flex-col gap-3 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-bold tracking-tight">
          <Link
            href={heading.href}
            className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {heading.label}
          </Link>
        </h3>
        <span className="font-mono text-sm font-bold text-accent">
          {formatScore(review.score)}/5
        </span>
      </div>

      {review.bestPick ? (
        <p className="flex items-center gap-2 text-sm">
          {review.bestPickImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.bestPickImage} alt="" className="size-9 shrink-0 rounded border-2 border-foreground object-cover" />
          ) : null}
          <span><span className="text-muted">Best pick: </span><span className="font-semibold">{review.bestPick}</span></span>
        </p>
      ) : null}

      <ul className="list-disc pl-5 text-sm text-foreground/80 marker:text-accent">
        {review.bulletPoints.map((point, index) => (
          <li key={index}>{point}</li>
        ))}
      </ul>

      {review.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Tagit">
          {review.tags.map((tag) => (
            <li
              key={tag}
              className="border-2 border-foreground px-2 py-0.5 text-xs font-medium text-muted"
            >
              #{tag}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
