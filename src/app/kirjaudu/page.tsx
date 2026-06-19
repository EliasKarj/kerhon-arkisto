"use client";

import { useActionState } from "react";
import { login } from "@/lib/admin/actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, undefined);
  return (
    <section className="mx-auto flex max-w-sm flex-col gap-5 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Kirjaudu</h1>
      <form action={formAction} className="surface flex flex-col gap-3 p-5">
        <label className="flex flex-col gap-1 text-sm font-semibold uppercase tracking-wide text-muted">
          Salasana
          <input
            type="password"
            name="password"
            required
            autoFocus
            className="border-2 border-foreground bg-background px-3 py-2 font-mono text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </label>
        {state?.error ? <p className="font-mono text-sm text-red-500">{state.error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="border-2 border-foreground bg-accent px-4 py-2 font-bold tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:opacity-50"
        >
          {pending ? "Tarkistetaan…" : "Kirjaudu"}
        </button>
      </form>
    </section>
  );
}
