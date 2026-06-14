import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-col items-start gap-4 py-12">
      <p className="font-mono text-sm font-bold uppercase tracking-wide text-accent">404</p>
      <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">Sivua ei löytynyt</h1>
      <p className="max-w-prose text-muted">
        Etsimääsi sivua ei ole olemassa. Tarkista osoite tai palaa etusivulle.
      </p>
      <Link
        href="/"
        className="surface surface-link px-4 py-2 text-sm font-bold uppercase tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        ← Takaisin etusivulle
      </Link>
    </section>
  );
}
