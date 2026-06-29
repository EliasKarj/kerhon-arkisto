"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { Member } from "@/lib/types";
import { getInitials } from "@/lib/labels";
import type { RoomState } from "@/lib/session/session-actions";
import type { MyReviewInput } from "@/lib/member/review-validation";
import {
  startSession, endSession, saveSessionReview, saveSessionReviewAsChairman,
} from "@/lib/session/session-actions";
import { useRoomPolling } from "@/lib/session/use-room-polling";
import { CharacterPicker } from "@/components/character-picker";
import { formatScore } from "@/lib/stats";

const field = "border-2 border-foreground bg-background px-3 py-2";

const MODE_LABEL: Record<string, string> = { both: "Jäsenet + pj", chairman: "Vain puheenjohtaja", members: "Vain jäsenet" };
const VIS_LABEL: Record<string, string> = { live: "Pisteet näkyvät heti", hidden: "Pisteet piilossa loppuun" };
const JOIN_LABEL: Record<string, string> = { all: "Kaikki jäsenet", invited: "Vain kutsutut" };

/** Tikittävä laskuri kerhoillan alkuun. Mountin jälkeen (ei hydraatiomismatchia). */
function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelAnimationFrame(raf); clearInterval(t); };
  }, []);
  if (now === null) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return <p className="font-mono text-xl font-bold text-accent">Alkamassa…</p>;
  const parts: [number, string][] = [
    [Math.floor(diff / 86_400_000), "pv"],
    [Math.floor(diff / 3_600_000) % 24, "t"],
    [Math.floor(diff / 60_000) % 60, "min"],
    [Math.floor(diff / 1_000) % 60, "s"],
  ];
  return (
    <div className="flex gap-2">
      {parts.map(([v, l]) => (
        <div key={l} className="flex flex-col items-center rounded-md border-2 border-ink bg-ink px-3 py-1.5 font-mono text-accent">
          <span className="text-2xl font-bold leading-none tabular-nums">{String(v).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase opacity-70">{l}</span>
        </div>
      ))}
    </div>
  );
}

type ReviewInitial = { score: number | null; bestPick: string; bestPickImage: string | null; bulletPoints: string[]; tags: string[] };

function ReviewFields({ onSubmit, pending, initial, anilistId }: { onSubmit: (input: MyReviewInput) => void; pending: boolean; initial?: ReviewInitial; anilistId: number | null }) {
  const [score, setScore] = useState(initial?.score != null ? String(initial.score) : "4");
  const [bestPick, setBestPick] = useState(initial?.bestPick ?? "");
  const [bestPickImage, setBestPickImage] = useState<string | null>(initial?.bestPickImage ?? null);
  const [bullets, setBullets] = useState((initial?.bulletPoints ?? []).join("\n"));
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  return (
    <div className="flex flex-col gap-2">
      <input type="number" step="0.1" min={0} max={5} value={score} onChange={(e) => setScore(e.target.value)} placeholder="Pisteet 0–5" className={field} />
      <CharacterPicker anilistId={anilistId} value={bestPick} image={bestPickImage} onChange={(name, img) => { setBestPick(name); setBestPickImage(img); }} />
      <textarea value={bullets} onChange={(e) => setBullets(e.target.value)} placeholder="Kommentit (yksi/rivi)" className={`${field} min-h-20`} />
      <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tagit (pilkulla)" className={field} />
      <button type="button" disabled={pending} onClick={() => onSubmit({ score: Number(score), bestPick, bestPickImage, bulletPoints: bullets.split("\n"), tags: tags.split(/[,\n]/) })}
        className="w-fit border-2 border-foreground bg-accent px-4 py-2 font-bold tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] disabled:opacity-50">
        {pending ? "Tallennetaan…" : "Tallenna arvio"}
      </button>
    </div>
  );
}

export function LiveRoom({
  sessionId, initial, seriesTitle, members, anilistId, coverUrl,
}: {
  sessionId: string; initial: RoomState; seriesTitle: string; members: Member[]; anilistId: number | null; coverUrl: string | null;
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
        <h1 className="text-3xl font-bold tracking-tight">{seriesTitle}</h1>
        <span className="font-mono text-sm text-muted">
          {session.status === "scheduled" ? "Ajastettu" : session.status === "live" ? "● Käynnissä" : "Päättynyt"}
        </span>
      </div>
      {session.chairmanId ? (
        <p className="-mt-3 text-sm text-muted">Puheenjohtaja: <span className="font-semibold text-foreground">{nameOf(session.chairmanId)}</span></p>
      ) : null}

      {session.status === "scheduled" && (
        <section className="ink-panel halftone flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex aspect-[2/3] w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border-2 border-ink bg-background text-2xl font-bold text-muted sm:w-40">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden>{getInitials(seriesTitle)}</span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <span className="sticker w-fit -rotate-2 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <span className="inline-block size-2 animate-pulse rounded-full bg-ink" aria-hidden />
              Odottaa aloitusta
            </span>

            {session.scheduledAt ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted">Alkaa {new Date(session.scheduledAt).toLocaleString("fi-FI")}</span>
                <Countdown target={session.scheduledAt} />
              </div>
            ) : (
              <p className="text-muted">Ajankohta avoin — puheenjohtaja aloittaa kun porukka on koossa.</p>
            )}

            <ul className="flex flex-wrap gap-2 text-xs font-semibold">
              <li className="chip">{MODE_LABEL[session.reviewMode] ?? session.reviewMode}</li>
              <li className="chip">{VIS_LABEL[session.scoreVisibility] ?? session.scoreVisibility}</li>
              <li className="chip">{JOIN_LABEL[session.joinPolicy] ?? session.joinPolicy}</li>
            </ul>

            {viewerIsChairman ? (
              <button type="button" disabled={pending} onClick={() => run(() => startSession(sessionId))} className="w-fit border-2 border-ink bg-accent px-5 py-2.5 font-bold tracking-tight text-ink shadow-[3px_3px_0_rgba(0,0,0,.5)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50">
                ▶ Aloita kerhoilta
              </button>
            ) : (
              <p className="text-sm text-muted">Puheenjohtaja aloittaa illan — pysy linjoilla.</p>
            )}
          </div>
        </section>
      )}

      {session.status !== "scheduled" && (
        <>
          <section className="surface-flat p-3">
            <span className="text-sm text-muted">Paikalla: </span>
            <span className="font-semibold">{present.length ? present.map(nameOf).join(", ") : "—"}</span>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="sec-title w-fit text-lg">Arviot</h2>
            <ul className="flex flex-col gap-3">
              {reviews.map((r) => (
                <li key={r.memberId} className="surface-flat flex flex-col gap-2 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold tracking-tight">{nameOf(r.memberId)}</span>
                    <span className="font-mono text-sm font-bold text-accent">
                      {r.redacted ? "✓ arvioinut" : r.score !== null ? `${formatScore(r.score)}/5` : "—"}
                    </span>
                  </div>
                  {!r.redacted && r.bestPick ? (
                    <p className="flex items-center gap-2 text-sm">
                      {r.bestPickImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.bestPickImage} alt="" className="size-8 rounded border-2 border-foreground object-cover" />
                      ) : null}
                      <span><span className="text-muted">Best pick: </span><span className="font-semibold">{r.bestPick}</span></span>
                    </p>
                  ) : null}
                  {!r.redacted && r.bulletPoints.length > 0 ? (
                    <ul className="list-disc pl-5 text-sm text-foreground/80 marker:text-accent">
                      {r.bulletPoints.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  ) : null}
                  {!r.redacted && r.tags.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Tagit">
                      {r.tags.map((t) => <li key={t} className="border-2 border-foreground px-2 py-0.5 text-xs font-medium text-muted">#{t}</li>)}
                    </ul>
                  ) : null}
                </li>
              ))}
              {reviews.length === 0 && <li className="text-muted">Ei vielä arvioita.</li>}
            </ul>
          </section>

          {canMemberEnter && (
            <section className="surface flex flex-col gap-3 border-l-8 border-l-accent p-4">
              <h2 className="text-lg font-bold tracking-tight">Sinun arviosi{myReview && !myReview.redacted && myReview.score !== null ? ` (${formatScore(myReview.score)}/5)` : myReview ? " (tallennettu)" : ""}</h2>
              <ReviewFields
                pending={pending}
                anilistId={anilistId}
                initial={myReview && !myReview.redacted ? { score: myReview.score, bestPick: myReview.bestPick ?? "", bestPickImage: myReview.bestPickImage, bulletPoints: myReview.bulletPoints, tags: myReview.tags } : undefined}
                onSubmit={(input) => run(() => saveSessionReview(sessionId, input))}
              />
            </section>
          )}

          {canChairmanEnter && (
            <section className="surface flex flex-col gap-3 p-4">
              <h2 className="text-lg font-bold tracking-tight">Puheenjohtaja: syötä jäsenen arvio</h2>
              <select value={chairmanTarget} onChange={(e) => setChairmanTarget(e.target.value)} className={field}>
                <option value="">— valitse jäsen —</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {chairmanTarget && (() => {
                const existing = reviews.find((r) => r.memberId === chairmanTarget);
                const initial = existing && !existing.redacted
                  ? { score: existing.score, bestPick: existing.bestPick ?? "", bestPickImage: existing.bestPickImage, bulletPoints: existing.bulletPoints, tags: existing.tags }
                  : undefined;
                return (
                  <ReviewFields key={chairmanTarget} pending={pending} anilistId={anilistId} initial={initial} onSubmit={(input) => run(() => saveSessionReviewAsChairman(sessionId, chairmanTarget, input))} />
                );
              })()}
            </section>
          )}

          {viewerIsChairman && session.status === "live" && (
            <button type="button" disabled={pending} onClick={() => { if (window.confirm("Päätetäänkö kerhoilta? Arviot julkaistaan.")) run(() => endSession(sessionId)); }}
              className="w-fit border-2 border-foreground bg-foreground px-4 py-2 font-bold tracking-tight text-background disabled:opacity-50">
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
