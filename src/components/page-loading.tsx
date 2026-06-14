function Bar({ className }: { className?: string }) {
  return <div className={`animate-pulse border-2 border-foreground/30 bg-panel ${className ?? ""}`} />;
}

/** Yleinen latausnäkymä detail-sivuille (loading.tsx). */
export function PageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <span role="status" className="sr-only">
        Ladataan…
      </span>
      <div aria-hidden className="flex flex-col gap-6">
        <Bar className="h-8 w-2/3" />
        <Bar className="h-4 w-full max-w-prose" />
        <div className="grid gap-6 md:grid-cols-2">
          <Bar className="h-64" />
          <Bar className="h-64" />
        </div>
      </div>
    </div>
  );
}
