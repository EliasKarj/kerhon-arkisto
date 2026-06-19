"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "@/lib/feedback/actions";

const field = "border-2 border-foreground bg-background px-3 py-2";

export function FeedbackForm() {
  const [loadedAt] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitFeedback(formData);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="surface flex flex-col gap-2 border-l-8 border-l-accent p-5">
        <h2 className="text-lg font-bold tracking-tight">Kiitos palautteesta! 🙌</h2>
        <p className="text-sm text-muted">Viesti meni perille. Voit sulkea sivun tai jatkaa selailua.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Hunajapurkki: piilossa oikealta käyttäjältä, bottiansaksi. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden" tabIndex={-1}>
        <label>
          Älä täytä tätä
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="loadedAt" value={loadedAt} />

      <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
        Nimi (vapaaehtoinen)
        <input name="name" maxLength={80} autoComplete="off" className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-semibold text-muted">
        Viesti
        <textarea name="message" required minLength={3} maxLength={2000} className={`${field} min-h-32`} />
      </label>

      {error ? <p className="font-mono text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-fit border-2 border-foreground bg-accent px-4 py-2 font-bold tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50"
      >
        {pending ? "Lähetetään…" : "Lähetä palaute"}
      </button>
    </form>
  );
}
