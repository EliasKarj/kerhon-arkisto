"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES, type ThemeId } from "@/lib/themes";

const THEME_EVENT = "ka:themechange";

function subscribe(cb: () => void) { window.addEventListener(THEME_EVENT, cb); return () => window.removeEventListener(THEME_EVENT, cb); }
function getSnapshot(): ThemeId { return (document.documentElement.getAttribute("data-theme") as ThemeId | null) ?? DEFAULT_THEME; }
function getServerSnapshot(): ThemeId { return DEFAULT_THEME; }

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  try { localStorage.setItem(THEME_STORAGE_KEY, id); } catch { /* estetty localStorage ok */ }
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function ThemePicker() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <div role="radiogroup" aria-label="Teema" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {THEMES.map((t) => {
        const selected = t.id === theme;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => applyTheme(t.id)}
            className={`panel flex items-center gap-3 p-3 text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${selected ? "ring-2 ring-accent" : ""}`}
          >
            <span aria-hidden className="grid size-10 shrink-0 grid-cols-2 overflow-hidden rounded-md border-2 border-ink" style={{ backgroundColor: t.swatch.bg }}>
              <span style={{ backgroundColor: t.swatch.accent }} />
              <span style={{ backgroundColor: t.swatch.accent2 }} />
              <span style={{ backgroundColor: t.swatch.fg }} />
              <span style={{ backgroundColor: t.swatch.bg }} />
            </span>
            <span className="flex flex-col">
              <span className="font-bold tracking-tight">{t.name}</span>
              <span className="text-xs text-muted">{t.blurb}</span>
            </span>
            {selected ? <span aria-hidden className="ml-auto font-mono font-bold text-accent">✓</span> : null}
          </button>
        );
      })}
    </div>
  );
}
