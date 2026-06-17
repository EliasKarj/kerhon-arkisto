"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Member } from "@/lib/types";
import type { RoomState } from "@/lib/session/session-actions";
import type { MyReviewInput } from "@/lib/member/review-validation";
import {
  startSession, endSession, saveSessionReview, saveSessionReviewAsChairman,
} from "@/lib/session/session-actions";
import { useRoomPolling } from "@/lib/session/use-room-polling";
import { formatScore } from "@/lib/stats";

const field = "border-2 border-foreground bg-background px-3 py-2";

function ReviewFields({ onSubmit, pending }: { onSubmit: (input: MyReviewInput) => void; pending: boolean }) {
  const [score, setScore] = useState("4");
  const [bestPick, setBestPick] = useState("");
  const [bullets, setBullets] = useState("");
  const [tags, setTags] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <input type="number" step="0.1" min={0} max={5} value={score} onChange={(e) => setScore(e.target.value)} placeholder="Pisteet 0–5" className={field} />
      <input value={bestPick} onChange={(e) => setBestPick(e.target.value)} placeholder="Best character" className={field} />
      <textarea value={bullets} onChange={(e) => setBullets(e.target.value)} placeholder="Kommentit (yksi/rivi)" className={`${field} min-h-20`} />
      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tagit (pilkulla)" className={field} />
      <button type="button" disabled={pending} onClick={() => onSubmit({ score: Number(score), bestPick, bulletPoints: bullets.split("\n"), tags: tags.split(/[,\n]/) })}
        className="w-fit border-2 border-foreground bg-accent px-4 py-2 font-bold uppercase tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] disabled:opacity-50">
        {pending ? "Tallennetaan…" : "Tallenna arvio"}
      </button>
    </div>
  );
}

export function LiveRoom({
  sessionId, initial, seriesTitle, members,
}: {
  sessionId: string; initial: RoomState; seriesTitle: string; members: Member[];
}) {
  const state = useRoomPolling(sessionId, initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [chairmanTarget, setChairmanTarget] = useState("");

  const { session, viewerIsChairman, viewerMemberId, present, reviews } = state;
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? id;

  function run(fn: () => Promise<{ error: string } | { ok: true }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if ("error" in res) setError(res.error);
    });
  }

  if (!session) return <p className="text-muted">Kerhoiltaa ei löydy.</p>;
  if (!state.allowed) return <p className="text-muted">Et ole tämän kerhoillan osallistuja. <Link href="/tili" className="underline">Tili</Link></p>;

  const canMemberEnter = session.status === "live" && (session.reviewMode === "members" || session.reviewMode === "both") && !!viewerMemberId;
  const canChairmanEnter = session.status === "live" && viewerIsChairman && (session.reviewMode === "chairman" || session.reviewMode === "both");
  const myReview = reviews.find((r) => r.memberId === viewerMemberId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold uppercase tracking-tight">{seriesTitle}</h1>
        <span className="font-mono text-sm text-muted">
          {session.status === "scheduled" ? "Ajastettu" : session.status === "live" ? "● Käynnissä" : "Päättynyt"}
        </span>
      </div>

      {session.status === "scheduled" && (
        <div className="surface flex flex-col gap-3 p-5">
          <p className="text-muted">{session.scheduledAt ? `Alkaa ${new Date(session.scheduledAt).toLocaleString("fi-FI")}` : "Odottaa puheenjohtajaa."}</p>
          {viewerIsChairman && (
            <button type="button" disabled={pending} onClick={() => run(() => startSession(sessionId))} className="w-fit border-2 border-foreground bg-accent px-4 py-2 font-bold uppercase tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] disabled:opacity-50">
              Aloita kerhoilta
            </button>
          )}
        </div>
      )}

      {session.status !== "scheduled" && (
        <>
          <section className="surface-flat p-3">
            <span className="text-sm text-muted">Paikalla: </span>
            <span className="font-semibold">{present.length ? present.map(nameOf).join(", ") : "—"}</span>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="sec-title w-fit text-lg">Arviot</h2>
            <ul className="flex flex-col divide-y-2 divide-foreground/15">
              {reviews.map((r) => (
                <li key={r.memberId} className="flex items-center justify-between py-2">
                  <span className="font-bold">{nameOf(r.memberId)}</span>
                  <span className="font-mono text-sm">
                    {r.redacted ? "✓ arvioinut" : r.score !== null ? `${formatScore(r.score)}/5${r.bestPick ? ` · ${r.bestPick}` : ""}` : "—"}
                  </span>
                </li>
              ))}
              {reviews.length === 0 && <li className="py-2 text-muted">Ei vielä arvioita.</li>}
            </ul>
          </section>

          {canMemberEnter && (
            <section className="surface flex flex-col gap-3 border-l-8 border-l-accent p-4">
              <h2 className="text-lg font-bold uppercase tracking-tight">Sinun arviosi{myReview && !myReview.redacted && myReview.score !== null ? ` (${formatScore(myReview.score)}/5)` : myReview ? " (tallennettu)" : ""}</h2>
              <ReviewFields pending={pending} onSubmit={(input) => run(() => saveSessionReview(sessionId, input))} />
            </section>
          )}

          {canChairmanEnter && (
            <section className="surface flex flex-col gap-3 p-4">
              <h2 className="text-lg font-bold uppercase tracking-tight">Puheenjohtaja: syötä jäsenen arvio</h2>
              <select value={chairmanTarget} onChange={(e) => setChairmanTarget(e.target.value)} className={field}>
                <option value="">— valitse jäsen —</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {chairmanTarget && (
                <ReviewFields pending={pending} onSubmit={(input) => run(() => saveSessionReviewAsChairman(sessionId, chairmanTarget, input))} />
              )}
            </section>
          )}

          {viewerIsChairman && session.status === "live" && (
            <button type="button" disabled={pending} onClick={() => { if (window.confirm("Päätetäänkö kerhoilta? Arviot julkaistaan.")) run(() => endSession(sessionId)); }}
              className="w-fit border-2 border-foreground bg-foreground px-4 py-2 font-bold uppercase tracking-tight text-background disabled:opacity-50">
              Päätä kerhoilta
            </button>
          )}

          {session.status === "ended" && (
            <Link href={`/sarja/${session.seriesId}`} className="font-mono text-sm font-bold hover:underline">[ katso sarjasivu → ]</Link>
          )}
        </>
      )}

      {error ? <p className="font-mono text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
