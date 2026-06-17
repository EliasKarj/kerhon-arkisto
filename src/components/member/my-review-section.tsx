"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveMyReview, deleteMyReview } from "@/lib/member/review-actions";
import type { MyReviewInput } from "@/lib/member/review-validation";
import { formatScore } from "@/lib/stats";

const field = "border-2 border-foreground bg-background px-3 py-2";

export function MyReviewSection({
  seriesId,
  initialReview,
}: {
  seriesId: string;
  initialReview: MyReviewInput | null;
}) {
  const router = useRouter();
  const [review, setReview] = useState<MyReviewInput | null>(initialReview);
  const [editing, setEditing] = useState(false);
  const [score, setScore] = useState(initialReview ? String(initialReview.score) : "4");
  const [bestPick, setBestPick] = useState(initialReview?.bestPick ?? "");
  const [bullets, setBullets] = useState((initialReview?.bulletPoints ?? []).join("\n"));
  const [tags, setTags] = useState((initialReview?.tags ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openEdit() {
    setError(null);
    setScore(review ? String(review.score) : "4");
    setBestPick(review?.bestPick ?? "");
    setBullets((review?.bulletPoints ?? []).join("\n"));
    setTags((review?.tags ?? []).join(", "));
    setEditing(true);
  }

  function submit() {
    setError(null);
    const input: MyReviewInput = {
      score: Number(score),
      bestPick,
      bulletPoints: bullets.split("\n"),
      tags: tags.split(/[,\n]/),
    };
    startTransition(async () => {
      const res = await saveMyReview(seriesId, input);
      if ("error" in res) { setError(res.error); return; }
      setReview({
        score: Number(score),
        bestPick: bestPick.trim(),
        bulletPoints: bullets.split("\n").map((s) => s.trim()).filter(Boolean),
        tags: tags.split(/[,\n]/).map((s) => s.trim()).filter(Boolean),
      });
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Poistetaanko arviosi?")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteMyReview(seriesId);
      if ("error" in res) { setError(res.error); return; }
      setReview(null);
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <section className="surface flex flex-col gap-3 border-l-8 border-l-accent p-4" aria-label="Sinun arviosi">
      <h2 className="text-lg font-bold uppercase tracking-tight">Sinun arviosi</h2>

      {!editing && review && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-accent">{formatScore(review.score)}/5</span>
            <div className="flex gap-2">
              <button type="button" onClick={openEdit} className="font-mono text-sm font-bold hover:underline">[ muokkaa ]</button>
              <button type="button" onClick={remove} disabled={pending} className="font-mono text-sm font-bold text-red-500 hover:underline disabled:opacity-50">[ poista ]</button>
            </div>
          </div>
          {review.bestPick ? <p className="text-sm"><span className="text-muted">Best pick: </span><span className="font-semibold">{review.bestPick}</span></p> : null}
          {review.bulletPoints.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-foreground/80 marker:text-accent">
              {review.bulletPoints.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
        </div>
      )}

      {!editing && !review && (
        <button type="button" onClick={openEdit} className="w-fit border-2 border-foreground bg-accent px-4 py-2 font-bold uppercase tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)]">
          Lisää arvio
        </button>
      )}

      {editing && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Pisteet (0–5)
            <input type="number" step="0.1" min={0} max={5} value={score} onChange={(e) => setScore(e.target.value)} className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Best character
            <input value={bestPick} onChange={(e) => setBestPick(e.target.value)} className={field} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Kommentit (yksi per rivi)
            <textarea value={bullets} onChange={(e) => setBullets(e.target.value)} className={`${field} min-h-24`} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Tagit (pilkulla eroteltuna)
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={field} />
          </label>
          {error ? <p className="font-mono text-sm text-red-500">{error}</p> : null}
          <div className="flex gap-2">
            <button type="button" onClick={submit} disabled={pending} className="border-2 border-foreground bg-accent px-4 py-2 font-bold uppercase tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] disabled:opacity-50">
              {pending ? "Tallennetaan…" : "Tallenna"}
            </button>
            <button type="button" onClick={() => { setEditing(false); setError(null); }} className="border-2 border-foreground bg-panel px-4 py-2 font-bold uppercase tracking-tight">Peruuta</button>
          </div>
        </div>
      )}
      {!editing && error ? <p className="font-mono text-sm text-red-500">{error}</p> : null}
    </section>
  );
}
