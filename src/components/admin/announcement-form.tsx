"use client";

import { useEffect, useState, useTransition } from "react";
import { sendAnnouncement, fetchLinkPreview, type LinkPreview } from "@/lib/admin/actions";

const field = "border-2 border-foreground bg-background px-3 py-2";

export function AnnouncementForm() {
  const [message, setMessage] = useState("");
  const [href, setHref] = useState("");
  const [toSite, setToSite] = useState(true);
  const [toDiscord, setToDiscord] = useState(false);
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  // Hae linkistä kansi + otsikko (debounce), näytä esikatselussa.
  useEffect(() => {
    const h = href.trim();
    let active = true;
    const t = setTimeout(async () => {
      if (!h) { if (active) setPreview(null); return; }
      const res = await fetchLinkPreview(h);
      if (active) setPreview(res);
    }, 500);
    return () => { active = false; clearTimeout(t); };
  }, [href]);

  function submit() {
    setError(null);
    setDone(false);
    startTransition(async () => {
      const res = await sendAnnouncement({ message, href: href.trim() || null, toDiscord, toSite });
      if ("error" in res) { setError(res.error); return; }
      setDone(true);
      setMessage("");
      setHref("");
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Viesti
        <textarea value={message} onChange={(e) => { setMessage(e.target.value); setDone(false); }} maxLength={500} className={`${field} min-h-24`} placeholder="Esim. Tänään kerhoilta klo 19!" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-muted">Linkki (valinnainen)
        <input value={href} onChange={(e) => setHref(e.target.value)} className={field} placeholder="/sarja/witch-hat-atelier tai https://…" />
      </label>
      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <label className="flex items-center gap-2"><input type="checkbox" checked={toSite} onChange={(e) => setToSite(e.target.checked)} /> Sivuston toast</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={toDiscord} onChange={(e) => setToDiscord(e.target.checked)} /> Discord</label>
      </div>

      <AnnouncementPreview message={message} href={href.trim()} toSite={toSite} toDiscord={toDiscord} coverUrl={preview?.coverUrl ?? null} title={preview?.title ?? null} />

      {error ? <p className="font-mono text-sm text-red-500">{error}</p> : null}
      {done ? <p className="font-mono text-sm text-accent">Ilmoitus lähetetty. ✓</p> : null}
      <button type="button" onClick={submit} disabled={pending || !message.trim()} className="w-fit border-2 border-foreground bg-accent px-4 py-3 font-bold tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] disabled:opacity-50">
        {pending ? "Lähetetään…" : "Lähetä ilmoitus"}
      </button>
      <p className="text-xs text-muted">Sivuston toast näkyy vain niille, jotka ovat sivulla lähetyshetkellä (nousee oikeasta alakulmasta ~15 s sisällä).</p>
    </div>
  );
}

function AnnouncementPreview({
  message, href, toSite, toDiscord, coverUrl, title,
}: {
  message: string; href: string; toSite: boolean; toDiscord: boolean; coverUrl: string | null; title: string | null;
}) {
  const text = message.trim() || "Viestin esikatselu…";

  return (
    <section className="flex flex-col gap-3" aria-label="Esikatselu">
      <h2 className="sec-title w-fit text-sm">Esikatselu</h2>
      {!toSite && !toDiscord ? (
        <p className="text-sm text-muted">Valitse vähintään yksi kanava nähdäksesi esikatselun.</p>
      ) : null}

      {href && title ? (
        <p className="text-xs text-muted">Linkki tunnistettu: <span className="font-semibold text-foreground">{title}</span>{coverUrl ? " (kansikuva liitetään)" : ""}</p>
      ) : null}

      {toSite ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Sivuston toast</span>
          <div className="flex w-[min(100%,22rem)] items-start gap-3 rounded-[13px] border-2 border-ink bg-panel p-3 shadow-[4px_4px_0_rgba(0,0,0,.5)]">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="h-14 w-10 shrink-0 rounded border-2 border-ink object-cover" />
            ) : (
              <span aria-hidden className="mt-1 inline-block size-2 shrink-0 rounded-full bg-accent" />
            )}
            <span className="flex-1 text-sm font-semibold">{text}</span>
            <span aria-hidden className="shrink-0 text-muted">✕</span>
          </div>
        </div>
      ) : null}

      {toDiscord ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Discord</span>
          <div className="flex flex-col gap-1 rounded-md border border-line bg-panel p-3 text-sm">
            <span>📣 {text}</span>
            {href ? <span className="break-all text-muted">{href}</span> : null}
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt="" className="mt-1 aspect-[3/4] w-20 rounded border-2 border-ink object-cover" />
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
