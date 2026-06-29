"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/types";
import { createWatchingSeries } from "@/lib/admin/actions";
import { AnimeSearch, type ChosenAnime } from "@/components/admin/anime-search";

const field = "border-2 border-foreground bg-background px-3 py-2";

export function NewSeriesForm({ members, defaultSeason }: { members: Member[]; defaultSeason: number }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<ChosenAnime | undefined>();
  const [clubSeason, setClubSeason] = useState(defaultSeason);
  const [proposerId, setProposerId] = useState("");
  const [watchedDate, setWatchedDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!chosen) { setError("Valitse sarja AniListista tai anna manuaalinen nimi."); return; }
    if (!proposerId) { setError("Valitse ehdottaja."); return; }
    startTransition(async () => {
      const res = await createWatchingSeries({
        anilistId: chosen.anilistId,
        manualTitle: chosen.manual ? chosen.title : null,
        clubSeason,
        watchedDate: watchedDate || new Date().toISOString().slice(0, 10),
        proposerId,
      });
      if ("error" in res) { setError(res.error); return; }
      router.push(`/sarja/${res.seriesId}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="sec-title w-fit text-lg">Sarja</h2>
        <AnimeSearch onChoose={setChosen} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Kausi
          <input type="number" min={1} value={clubSeason} onChange={(e) => setClubSeason(Number(e.target.value))} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Ehdottaja
          <select value={proposerId} onChange={(e) => setProposerId(e.target.value)} className={field}>
            <option value="">— valitse —</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Päivä (valinnainen)
          <input type="date" value={watchedDate} onChange={(e) => setWatchedDate(e.target.value)} className={field} />
        </label>
      </section>

      {error ? <p className="font-mono text-sm text-red-500">{error}</p> : null}
      <button type="button" onClick={submit} disabled={pending} className="w-fit border-2 border-foreground bg-accent px-4 py-3 font-bold tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] disabled:opacity-50">
        {pending ? "Lisätään…" : "Lisää nyt katselussa"}
      </button>
    </div>
  );
}
