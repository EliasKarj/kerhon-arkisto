import type { ReactNode } from "react";

type PagePlaceholderProps = {
  title: string;
  description: string;
  /** Optional extra detail, e.g. a resolved dynamic route param. */
  children?: ReactNode;
};

/**
 * Temporary placeholder used during V1 phase 1 while routes are wired up.
 * Real content (charts, data from JSON) lands in later phases.
 */
export function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="max-w-prose text-foreground/70">{description}</p>
      </div>
      {children}
      <p className="inline-flex w-fit rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-foreground/60 dark:border-white/15">
        Tulossa — sisältö rakennetaan myöhemmässä vaiheessa
      </p>
    </section>
  );
}
