"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/types";
import type { ClubNightInput, ReviewInput } from "@/lib/admin/validation";
import { saveClubNight, updateClubNight } from "@/lib/admin/actions";
import { AnimeSearch, type ChosenAnime } from "./anime-search";
import { CharacterPicker } from "@/components/character-picker";

const emptyReview = (): ReviewInput => ({ memberId: null, guestName: null, score: 4, bulletPoints: [], bestPick: "", bestPickImage: null, tags: [] });

export interface ClubNightFormProps {
  members: Member[];
  editSeriesId?: string;
  /** Uuden kerhoillan oletuskausi (yleensä uusin kausi). */
  defaultSeason?: number;
  initial?: {
    chosen: ChosenAnime;
    clubSeason: number;
    watchedDate: string;
    proposerId: string;
    clubScore: number | null;
    bestPick: string;
    bestPickImage: string | null;
    reviews: ReviewInput[];
  };
}

export function ClubNightForm({ members, editSeriesId, defaultSeason, initial }: ClubNightFormProps) {
  const router = useRouter();
  const [chosen, setChosen] = useState<ChosenAnime | undefined>(initial?.chosen);
  const [clubSeason, setClubSeason] = useState(initial?.clubSeason ?? defaultSeason ?? 1);
  const [watchedDate, setWatchedDate] = useState(initial?.watchedDate ?? "");
  const [proposerId, setProposerId] = useState(initial?.proposerId ?? "");
  const [clubScore, setClubScore] = useState<string>(initial?.clubScore != null ? String(initial.clubScore) : "");
  const [bestPick, setBestPick] = useState(initial?.bestPick ?? "");
  const [bestPickImage, setBestPickImage] = useState<string | null>(initial?.bestPickImage ?? null);
  const [reviews, setReviews] = useState<ReviewInput[]>(initial?.reviews ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateReview(i: number, patch: Partial<ReviewInput>) {
    setReviews((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  function submit() {
    setError(null);
    const input: ClubNightInput = {
      anilistId: chosen?.anilistId ?? null,
      manualTitle: chosen?.manual ? chosen.title : null,
      manualType: null,
      clubSeason,
      watchedDate,
      proposerId,
      clubScore: clubScore.trim() === "" ? null : Number(clubScore),
      bestPick: bestPick.trim() || null,
      bestPickImage: bestPick.trim() ? bestPickImage : null,
      reviews,
    };
    startTransition(async () => {
      const res = editSeriesId ? await updateClubNight(editSeriesId, input) : await saveClubNight(input);
      if ("error" in res) { setError(res.error); return; }
      router.push(`/sarja/${res.seriesId}`);
    });
  }

  const field = "border-2 border-foreground bg-background px-3 py-2";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="sec-title w-fit text-lg">Anime / sarja</h2>
        <AnimeSearch initial={initial?.chosen} onChoose={setChosen} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Kausi
          <input type="number" min={1} value={clubSeason} onChange={(e) => setClubSeason(Number(e.target.value))} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Kokouspäivä
          <input type="date" value={watchedDate} onChange={(e) => setWatchedDate(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Ehdottaja
          <select value={proposerId} onChange={(e) => setProposerId(e.target.value)} className={field}>
            <option value="">— valitse —</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Kerhon pisteet (tyhjä = nyt katselussa)
          <input type="number" step="0.1" min={0} max={5} value={clubScore} onChange={(e) => setClubScore(e.target.value)} className={field} />
        </label>
        <div className="flex flex-col gap-1 text-sm font-semibold text-muted sm:col-span-2">Best character / best pick
          <CharacterPicker
            anilistId={chosen?.anilistId ?? null}
            value={bestPick}
            image={bestPickImage}
            onChange={(name, img) => { setBestPick(name); setBestPickImage(img); }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="sec-title w-fit text-lg">Arviot</h2>
        {reviews.map((r, i) => (
          <div key={i} className="surface-flat flex flex-col gap-2 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <select value={r.memberId ?? ""} onChange={(e) => updateReview(i, { memberId: e.target.value || null })} className={field}>
                <option value="">— jäsen tai vieras alla —</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input placeholder="…tai uuden vieraan nimi" value={r.guestName ?? ""} onChange={(e) => updateReview(i, { guestName: e.target.value || null })} className={field} />
              <input type="number" step="0.1" min={0} max={5} placeholder="Pisteet 0–5" value={r.score} onChange={(e) => updateReview(i, { score: Number(e.target.value) })} className={field} />
              <CharacterPicker
                anilistId={chosen?.anilistId ?? null}
                value={r.bestPick}
                image={r.bestPickImage}
                onChange={(name, img) => updateReview(i, { bestPick: name, bestPickImage: img })}
                placeholder="Henkilökohtainen best pick"
              />
            </div>
            <textarea placeholder="Bulletit (yksi per rivi)" value={r.bulletPoints.join("\n")} onChange={(e) => updateReview(i, { bulletPoints: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} className={`${field} min-h-20`} />
            <button type="button" onClick={() => setReviews((rs) => rs.filter((_, j) => j !== i))} className="self-end font-mono text-sm hover:underline">[ poista arvio ]</button>
          </div>
        ))}
        <button type="button" onClick={() => setReviews((rs) => [...rs, emptyReview()])} className="border-2 border-foreground bg-panel px-3 py-2 font-bold">+ Lisää arvio</button>
      </section>

      {error ? <p className="font-mono text-sm text-red-500">{error}</p> : null}
      <button type="button" onClick={submit} disabled={pending} className="border-2 border-foreground bg-accent px-4 py-3 font-bold tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] disabled:opacity-50">
        {pending ? "Tallennetaan…" : editSeriesId ? "Tallenna muutokset" : "Tallenna kerhoilta"}
      </button>
    </div>
  );
}
