"use client";

import { useState, useTransition } from "react";
import { searchAnimeAction } from "@/lib/admin/actions";
import type { AnimeSearchResult } from "@/lib/admin/anilist";

export interface ChosenAnime {
  anilistId: number | null;
  title: string;
  manual: boolean;
}

export function AnimeSearch({
  initial,
  onChoose,
}: {
  initial?: ChosenAnime;
  onChoose: (chosen: ChosenAnime) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<AnimeSearchResult[]>([]);
  const [chosen, setChosen] = useState<ChosenAnime | undefined>(initial);
  const [pending, startTransition] = useTransition();
  const [manualTitle, setManualTitle] = useState("");

  function runSearch() {
    if (!term.trim()) return;
    startTransition(async () => setResults(await searchAnimeAction(term)));
  }

  function pick(r: AnimeSearchResult) {
    const c = { anilistId: r.anilistId, title: r.title, manual: false };
    setChosen(c);
    setResults([]);
    onChoose(c);
  }

  function pickManual() {
    if (!manualTitle.trim()) return;
    const c = { anilistId: null, title: manualTitle.trim(), manual: true };
    setChosen(c);
    onChoose(c);
  }

  if (chosen) {
    return (
      <div className="surface-flat flex items-center justify-between p-3">
        <span className="font-bold">{chosen.title}{chosen.manual ? " (manuaalinen)" : ""}</span>
        <button type="button" onClick={() => setChosen(undefined)} className="font-mono text-sm hover:underline">[ vaihda ]</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runSearch(); } }}
          placeholder="Hae AniListista…"
          className="flex-1 border-2 border-foreground bg-background px-3 py-2"
        />
        <button type="button" onClick={runSearch} disabled={pending} className="border-2 border-foreground bg-panel px-3 py-2 font-bold disabled:opacity-50">
          {pending ? "…" : "Hae"}
        </button>
      </div>
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((r) => (
            <li key={r.anilistId}>
              <button type="button" onClick={() => pick(r)} className="surface-flat flex w-full items-center gap-3 p-2 text-left hover:bg-panel">
                {r.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.coverUrl} alt="" className="h-14 w-10 object-cover border-2 border-foreground" />
                ) : null}
                <span className="font-bold">{r.title}</span>
                <span className="ml-auto font-mono text-sm text-muted">{r.year ?? "?"} · {r.format ?? "?"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2 border-t-2 border-foreground/15 pt-3">
        <input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="…tai manuaalinen nimi (ei AniListissa)" className="flex-1 border-2 border-foreground bg-background px-3 py-2" />
        <button type="button" onClick={pickManual} className="border-2 border-foreground bg-panel px-3 py-2 font-bold">Käytä</button>
      </div>
    </div>
  );
}
