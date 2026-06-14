import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-col items-start gap-4 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-foreground/50">404</p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sivua ei löytynyt</h1>
      <p className="max-w-prose text-foreground/70">
        Etsimääsi sivua ei ole olemassa. Tarkista osoite tai palaa etusivulle.
      </p>
      <Link
        href="/"
        className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:border-black/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground dark:border-white/10 dark:hover:border-white/25"
      >
        ← Takaisin etusivulle
      </Link>
    </section>
  );
}
