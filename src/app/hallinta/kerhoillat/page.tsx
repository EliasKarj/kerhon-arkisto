import Link from "next/link";
import { listSessions } from "@/lib/session/session-actions";
import { getRoomData, seriesById } from "@/lib/data";
import { CancelSessionButton } from "@/components/admin/cancel-session-button";

const STATUS_LABEL: Record<string, string> = { scheduled: "Ajastettu", live: "Käynnissä", ended: "Päättynyt" };

export default async function SessionsAdminPage() {
  const [sessions, { series }] = await Promise.all([listSessions(), getRoomData()]);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Kerhoillat</h1>
        <Link href="/hallinta/kerhoillat/uusi" className="border-2 border-foreground bg-accent px-4 py-2 font-bold tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)]">+ Uusi kerhoilta</Link>
      </div>
      {sessions.length === 0 ? (
        <p className="text-muted">Ei vielä kerhoiltoja.</p>
      ) : (
        <ul className="flex flex-col divide-y-2 divide-foreground/15">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <span className="font-bold">{seriesById(series, s.seriesId)?.title ?? s.seriesId}
                <span className="ml-2 font-mono text-sm text-muted">· {STATUS_LABEL[s.status] ?? s.status}{s.scheduledAt ? ` · ${new Date(s.scheduledAt).toLocaleString("fi-FI")}` : ""}</span>
              </span>
              <span className="flex items-center gap-3">
                {s.status === "scheduled" ? (
                  <CancelSessionButton sessionId={s.id} title={seriesById(series, s.seriesId)?.title ?? s.seriesId} />
                ) : null}
                <Link href={`/kerhoilta/${s.id}`} className="font-mono text-sm font-bold hover:underline">[ huone → ]</Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
