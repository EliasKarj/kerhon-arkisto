import type { ReactNode } from "react";

/** Iso brutalist hero-numero. */
export function StatHero({
  value,
  label,
  sub,
}: {
  value: string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="surface flex flex-col gap-1 p-5">
      <span className="font-mono text-5xl font-bold text-accent">{value}</span>
      <span className="text-sm font-bold tracking-tight">{label}</span>
      {sub ? <span className="text-sm text-muted">{sub}</span> : null}
    </div>
  );
}

/** Pieni faktakortti otsikolla + sisällöllä. */
export function FunFactCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="surface flex flex-col gap-1 p-4">
      <span className="font-mono text-xs font-bold uppercase tracking-wide text-muted">{title}</span>
      <div className="text-base font-bold tracking-tight">{children}</div>
    </div>
  );
}

/** Jäsenparikortti (sielunkumppanit / vastakohdat). */
export function PairCard({
  title,
  nameA,
  nameB,
  detail,
}: {
  title: string;
  nameA: string;
  nameB: string;
  detail: string;
}) {
  return (
    <div className="surface flex flex-col gap-2 p-4">
      <span className="font-mono text-xs font-bold uppercase tracking-wide text-muted">{title}</span>
      <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <span>{nameA}</span>
        <span className="text-accent">+</span>
        <span>{nameB}</span>
      </div>
      <span className="text-sm text-muted">{detail}</span>
    </div>
  );
}
