"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const emptySubscribe = () => () => {};

/** false palvelimella ja ensirenderissä, true hydraation jälkeen clientillä. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

/**
 * Yhteinen kehys kaavioille:
 * - varaa kiinteän korkeuden (ei layout-hyppyä),
 * - renderöi kaavion vasta clientillä (Recharts ResponsiveContainer ei osaa
 *   mitata kokoa SSR:ssä → muuten "width(-1)/height(-1)" -varoitus),
 * - tarjoaa tekstimuotoisen `figcaption`-yhteenvedon ruudunlukijoille ja
 *   no-JS-tilanteeseen.
 */
export function ChartFrame({ caption, children }: { caption: string; children: ReactNode }) {
  const hydrated = useHydrated();

  return (
    <figure className="flex flex-col gap-2">
      <div className="h-72 w-full text-foreground" aria-hidden>
        {hydrated ? children : null}
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}
