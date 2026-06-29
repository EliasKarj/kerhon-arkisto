"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fetchAnnouncementsSince, type SiteAnnouncement } from "@/lib/admin/actions";

const POLL_MS = 15_000;
const TOAST_MS = 7_000;

/**
 * Pollaa uusia ilmoituksia (sivun latauksen jälkeen luodut) ja näyttää ne
 * toastina oikeassa alakulmassa hetken. Vain sivulla olevat näkevät.
 */
export function AnnouncementToaster() {
  const [toasts, setToasts] = useState<SiteAnnouncement[]>([]);
  const sinceRef = useRef<string>(new Date().toISOString());
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function tick() {
      if (!active) return;
      try {
        const items = await fetchAnnouncementsSince(sinceRef.current);
        for (const a of items) {
          if (a.createdAt > sinceRef.current) sinceRef.current = a.createdAt;
          if (shownRef.current.has(a.id)) continue;
          shownRef.current.add(a.id);
          setToasts((t) => [...t, a]);
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== a.id)), TOAST_MS);
        }
      } catch {
        // ohita ohimenevä virhe
      }
      const delay = typeof document !== "undefined" && document.hidden ? POLL_MS * 3 : POLL_MS;
      timer = setTimeout(tick, delay);
    }
    timer = setTimeout(tick, POLL_MS);
    return () => { active = false; clearTimeout(timer); };
  }, []);

  function dismiss(id: string) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-2">
      {toasts.map((a) => {
        const inner = (
          <div className="toast-in flex items-start gap-3 rounded-[13px] border-2 border-ink bg-panel p-3 shadow-[4px_4px_0_rgba(0,0,0,.5)]">
            {a.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.imageUrl} alt="" className="h-14 w-10 shrink-0 rounded border-2 border-ink object-cover" />
            ) : (
              <span aria-hidden className="mt-1 inline-block size-2 shrink-0 rounded-full bg-accent" />
            )}
            <span className="flex-1 text-sm font-semibold">{a.message}</span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); dismiss(a.id); }}
              aria-label="Sulje"
              className="shrink-0 text-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>
        );
        return a.href ? (
          <Link key={a.id} href={a.href} onClick={() => dismiss(a.id)} className="pointer-events-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
            {inner}
          </Link>
        ) : (
          <div key={a.id} className="pointer-events-auto" role="status">{inner}</div>
        );
      })}
    </div>
  );
}
