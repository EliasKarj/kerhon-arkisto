"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Member, Series } from "@/lib/types";
import { createSession } from "@/lib/session/session-actions";
import { AnimeSearch, type ChosenAnime } from "@/components/admin/anime-search";

const field = "border-2 border-foreground bg-background px-3 py-2";

export function SessionForm({ members, series }: { members: Member[]; series: Series[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [existingSeriesId, setExistingSeriesId] = useState("");
  const [chosen, setChosen] = useState<ChosenAnime | undefined>();
  const [clubSeason, setClubSeason] = useState(series.length ? Math.max(...series.map((s) => s.clubSeason)) : 1);
  const [proposerId, setProposerId] = useState("");
  const [watchedDate, setWatchedDate] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [reviewMode, setReviewMode] = useState("both");
  const [scoreVisibility, setScoreVisibility] = useState("live");
  const [joinPolicy, setJoinPolicy] = useState("all");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleAttendee(id: string) {
    setAttendees((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createSession({
        existingSeriesId: mode === "existing" ? existingSeriesId || null : null,
        newSeries: mode === "new"
          ? { anilistId: chosen?.anilistId ?? null, manualTitle: chosen?.manual ? chosen.title : (chosen?.title ?? null), clubSeason, watchedDate: watchedDate || new Date().toISOString().slice(0, 10), proposerId }
          : null,
        scheduledAt: scheduledAt || null,
        reviewMode, scoreVisibility, joinPolicy,
        attendees: joinPolicy === "invited" ? attendees : [],
      });
      if ("error" in res) { setError(res.error); return; }
      router.push("/hallinta/kerhoillat");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="sec-title w-fit text-lg">Sarja</h2>
        <div className="flex gap-4 text-sm font-semibold">
          <label className="flex items-center gap-1"><input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} /> Olemassa oleva</label>
          <label className="flex items-center gap-1"><input type="radio" checked={mode === "new"} onChange={() => setMode("new")} /> Luo uusi</label>
        </div>
        {mode === "existing" ? (
          <select value={existingSeriesId} onChange={(e) => setExistingSeriesId(e.target.value)} className={field}>
            <option value="">— valitse sarja —</option>
            {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimeSearch onChoose={setChosen} />
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-sm text-muted">Kausi
                <input type="number" min={1} value={clubSeason} onChange={(e) => setClubSeason(Number(e.target.value))} className={field} />
              </label>
              <label className="flex flex-col gap-1 text-sm text-muted">Ehdottaja
                <select value={proposerId} onChange={(e) => setProposerId(e.target.value)} className={field}>
                  <option value="">— valitse —</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-muted">Katselupäivä
                <input type="date" value={watchedDate} onChange={(e) => setWatchedDate(e.target.value)} className={field} />
              </label>
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted sm:col-span-2">Ajankohta
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Syöttötapa
          <select value={reviewMode} onChange={(e) => setReviewMode(e.target.value)} className={field}>
            <option value="both">Molemmat</option>
            <option value="chairman">Vain puheenjohtaja</option>
            <option value="members">Vain jäsenet itse</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Pisteiden paljastus
          <select value={scoreVisibility} onChange={(e) => setScoreVisibility(e.target.value)} className={field}>
            <option value="live">Livenä</option>
            <option value="hidden">Piilotettu loppuun asti</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-muted sm:col-span-2">Kuka voi liittyä
          <select value={joinPolicy} onChange={(e) => setJoinPolicy(e.target.value)} className={field}>
            <option value="all">Kaikki linkitetyt jäsenet</option>
            <option value="invited">Vain valitut osallistujat</option>
          </select>
        </label>
        {joinPolicy === "invited" && (
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            {members.map((m) => (
              <label key={m.id} className={`cursor-pointer border-2 border-foreground px-2 py-1 text-sm ${attendees.includes(m.id) ? "bg-accent text-background" : "bg-panel"}`}>
                <input type="checkbox" className="sr-only" checked={attendees.includes(m.id)} onChange={() => toggleAttendee(m.id)} />
                {m.name}
              </label>
            ))}
          </div>
        )}
      </section>

      {error ? <p className="font-mono text-sm text-red-500">{error}</p> : null}
      <button type="button" onClick={submit} disabled={pending} className="border-2 border-foreground bg-accent px-4 py-3 font-bold uppercase tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] disabled:opacity-50">
        {pending ? "Tallennetaan…" : "Ajasta kerhoilta"}
      </button>
    </div>
  );
}
