"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export interface TimelineItem {
  id: string;
  title: string;
  /** Esim. "Kausi 10 · 14.6.2026". */
  meta: string;
  watchedDate: string;
  typeLabel: string;
  score: string;
  proposer: string | null;
  bestPick: string | null;
}

/** Vaakasuora aikajana, jota voi vetää hiirellä (grab-to-scroll). */
export function Timeline({ items }: { items: TimelineItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [grabbing, setGrabbing] = useState(false);

  function onPointerDown(event: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    drag.current = { active: true, startX: event.clientX, scrollLeft: el.scrollLeft, moved: false };
    setGrabbing(true);
    el.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    const el = ref.current;
    if (!drag.current.active || !el) return;
    const dx = event.clientX - drag.current.startX;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.scrollLeft - dx;
  }

  function endDrag(event: React.PointerEvent) {
    drag.current.active = false;
    setGrabbing(false);
    ref.current?.releasePointerCapture?.(event.pointerId);
  }

  // Estä vahinkonavigointi: jos osoitinta raahattiin, jätä linkin klikkaus huomiotta.
  function onClickCapture(event: React.MouseEvent) {
    if (drag.current.moved) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Vedä hiirellä sivuttain ↔
      </p>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className={`select-none overflow-x-auto pb-4 ${grabbing ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <ol className="flex min-w-max items-start pt-6">
          {items.map((item) => (
            <li
              key={item.id}
              className="relative w-60 shrink-0 border-t-2 border-foreground pr-4"
            >
              <span
                className="absolute -top-[7px] left-0 size-3 border-2 border-foreground bg-accent"
                aria-hidden
              />
              <time
                dateTime={item.watchedDate}
                className="block pt-3 font-mono text-xs font-bold uppercase tracking-wide text-muted"
              >
                {item.meta}
              </time>
              <div className="surface mt-2 flex flex-col gap-1 p-3">
                <h2 className="text-base font-bold uppercase tracking-tight">
                  <Link
                    href={`/sarja/${item.id}`}
                    draggable={false}
                    className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {item.title}
                  </Link>
                </h2>
                <p className="text-sm text-muted">
                  {item.typeLabel} ·{" "}
                  <span className="font-mono font-bold text-accent">{item.score}</span>/5
                  {item.proposer ? ` · ${item.proposer}` : ""}
                </p>
                {item.bestPick ? (
                  <p className="text-xs uppercase tracking-wide text-muted">
                    <span className="text-accent">★</span> {item.bestPick}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
