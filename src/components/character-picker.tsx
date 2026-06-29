"use client";

import { useEffect, useRef, useState } from "react";
import { seriesCharactersAction } from "@/lib/admin/actions";
import type { SeriesCharacter } from "@/lib/admin/anilist";

const FIELD = "border-2 border-foreground bg-background px-3 py-2";

/**
 * Best character -valitsin: lataa sarjan hahmot AniListista (anilistId),
 * suodattaa kirjoittaessa ja näyttää kuvat. Valinta tallentaa nimen + kuvan.
 * Ilman anilistId:tä putoaa pelkäksi tekstikentäksi (manuaalinen sarja).
 */
export function CharacterPicker({
  anilistId,
  value,
  image,
  onChange,
  placeholder = "Best character",
}: {
  anilistId: number | null;
  value: string;
  image: string | null;
  onChange: (name: string, image: string | null) => void;
  placeholder?: string;
}) {
  const [chars, setChars] = useState<SeriesCharacter[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function ensureLoaded() {
    if (chars !== null || loading || !anilistId) return;
    setLoading(true);
    const res = await seriesCharactersAction(anilistId);
    setChars(res);
    setLoading(false);
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  if (!anilistId) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value, null)}
        placeholder={placeholder}
        className={FIELD}
      />
    );
  }

  const q = value.trim().toLowerCase();
  const filtered = (chars ?? []).filter((c) => c.name.toLowerCase().includes(q)).slice(0, 24);

  return (
    <div ref={ref} className="relative flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-9 shrink-0 rounded border-2 border-foreground object-cover" />
        ) : null}
        <input
          value={value}
          onChange={(e) => { onChange(e.target.value, null); setOpen(true); }}
          onFocus={() => { setOpen(true); void ensureLoaded(); }}
          placeholder={placeholder}
          className={`flex-1 ${FIELD}`}
        />
      </div>
      {open && (
        <div className="absolute top-full z-30 mt-1 max-h-72 w-full overflow-auto border-2 border-foreground bg-background shadow-[4px_4px_0_var(--color-foreground)]">
          {loading ? (
            <p className="p-2 text-sm text-muted">Ladataan hahmoja…</p>
          ) : filtered.length === 0 ? (
            <p className="p-2 text-sm text-muted">Ei osumia — voit kirjoittaa nimen vapaasti.</p>
          ) : (
            <ul>
              {filtered.map((c) => (
                <li key={c.name}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onChange(c.name, c.image); setOpen(false); }}
                    className="flex w-full items-center gap-2 p-1.5 text-left hover:bg-panel"
                  >
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt="" className="size-9 shrink-0 rounded border-2 border-foreground object-cover" />
                    ) : (
                      <span className="size-9 shrink-0 rounded border-2 border-foreground bg-panel" />
                    )}
                    <span className="text-sm font-semibold">{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
