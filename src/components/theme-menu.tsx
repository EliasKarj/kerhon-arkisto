"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  THEMES,
  type ThemeId,
} from "@/lib/themes";

const THEME_EVENT = "ka:themechange";

function subscribe(callback: () => void): () => void {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getSnapshot(): ThemeId {
  return (
    (document.documentElement.getAttribute("data-theme") as ThemeId | null) ??
    DEFAULT_THEME
  );
}

function getServerSnapshot(): ThemeId {
  return DEFAULT_THEME;
}

function applyTheme(id: ThemeId): void {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* localStorage voi olla estetty — teema pysyy silti istunnon ajan */
  }
  window.dispatchEvent(new Event(THEME_EVENT));
}

function Swatch({ id }: { id: ThemeId }) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  return (
    <span
      aria-hidden
      className="grid size-6 shrink-0 grid-cols-2 border-2 border-foreground"
      style={{ backgroundColor: t.swatch.bg }}
    >
      <span style={{ backgroundColor: t.swatch.accent }} />
      <span style={{ backgroundColor: t.swatch.accent2 }} />
      <span style={{ backgroundColor: t.swatch.fg }} />
      <span style={{ backgroundColor: t.swatch.bg }} />
    </span>
  );
}

export function ThemeMenu() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="chip surface-link bg-panel uppercase tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Swatch id={active.id} />
        <span className="font-semibold">Teema</span>
        <span aria-hidden className="text-muted">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Valitse teema"
          className="surface absolute right-0 z-50 mt-2 flex w-64 flex-col gap-1 bg-panel p-2"
        >
          {THEMES.map((t) => {
            const selected = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  applyTheme(t.id);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 border-2 px-2 py-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                  selected
                    ? "border-foreground bg-accent text-background"
                    : "border-transparent hover:border-foreground"
                }`}
              >
                <Swatch id={t.id} />
                <span className="flex flex-col">
                  <span className="text-sm font-bold uppercase tracking-tight">
                    {t.name}
                  </span>
                  <span
                    className={`text-xs ${selected ? "text-background/80" : "text-muted"}`}
                  >
                    {t.blurb}
                  </span>
                </span>
                {selected && (
                  <span aria-hidden className="ml-auto font-mono font-bold">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
