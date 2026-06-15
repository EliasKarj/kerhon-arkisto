"use client";

import { useEffect, useRef, useState } from "react";
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

/** Vaakasuora aikajana, jota voi vetää hiirellä (grab-to-scroll + inertia). */
export function Timeline({ items }: { items: TimelineItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastT = useRef(0);
  const raf = useRef<number | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  // Pysäytä mahdollinen inertia komponentin poistuessa.
  useEffect(() => () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
  }, []);

  function stopMomentum() {
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  }

  function onPointerDown(event: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    stopMomentum();
    drag.current = { active: true, startX: event.clientX, scrollLeft: el.scrollLeft, moved: false };
    velocity.current = 0;
    lastX.current = event.clientX;
    lastT.current = performance.now();
    setGrabbing(true);
    el.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    const el = ref.current;
    if (!drag.current.active || !el) return;
    const dx = event.clientX - drag.current.startX;
    if (Math.abs(dx) > 3) drag.current.moved = true;
    el.scrollLeft = drag.current.scrollLeft - dx;

    const now = performance.now();
    const dt = now - lastT.current;
    if (dt > 0) velocity.current = (event.clientX - lastX.current) / dt; // px / ms
    lastX.current = event.clientX;
    lastT.current = now;
  }

  function startMomentum() {
    const el = ref.current;
    if (!el) return;
    let v = velocity.current * 16; // ~px per frame
    if (Math.abs(v) < 1) return;
    const step = () => {
      if (!ref.current || Math.abs(v) < 0.4) {
        raf.current = null;
        return;
      }
      ref.current.scrollLeft -= v;
      v *= 0.92;
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }

  function endDrag(event: React.PointerEvent) {
    if (drag.current.active) startMomentum();
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
        className={`no-scrollbar select-none overflow-x-auto pb-2 ${grabbing ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <ol className="flex min-w-max items-start pt-10">
          {items.map((item) => (
            <li
              key={item.id}
              className="relative w-80 shrink-0 border-t-2 border-foreground pr-5"
            >
              <span
                className="absolute -top-[9px] left-0 size-4 border-2 border-foreground bg-accent"
                aria-hidden
              />
              <time
                dateTime={item.watchedDate}
                className="block pt-4 font-mono text-sm font-bold uppercase tracking-wide text-muted"
              >
                {item.meta}
              </time>
              <div className="surface mt-3 flex flex-col gap-1.5 p-4">
                <h2 className="text-xl font-bold uppercase tracking-tight">
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
                  <span className="font-mono text-base font-bold text-accent">{item.score}</span>/5
                  {item.proposer ? ` · ${item.proposer}` : ""}
                </p>
                {item.bestPick ? (
                  <p className="text-sm uppercase tracking-wide text-muted">
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
