import { supabaseAdmin } from "@/lib/admin/supabase-admin";
import { setFeedbackHandled, deleteFeedback } from "@/lib/feedback/actions";

export const dynamic = "force-dynamic";

type FeedbackRow = {
  id: string;
  message: string;
  name: string | null;
  handled: boolean;
  created_at: string;
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fi-FI", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminFeedbackPage() {
  const { data } = await supabaseAdmin
    .from("feedback")
    .select("id,message,name,handled,created_at")
    .order("created_at", { ascending: false });
  const items = (data ?? []) as FeedbackRow[];
  const openCount = items.filter((i) => !i.handled).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Palaute</h1>
        <span className="font-mono text-sm text-muted">
          {items.length} kpl{openCount > 0 ? ` · ${openCount} käsittelemättä` : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted">Ei palautetta vielä.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className={`surface flex flex-col gap-2 p-4 ${item.handled ? "opacity-55" : "border-l-8 border-l-accent"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">
                  {item.name?.trim() ? item.name : <span className="text-muted">Nimetön</span>}
                  {item.handled ? (
                    <span className="ml-2 font-mono text-[11px] font-bold text-muted">KÄSITELTY</span>
                  ) : null}
                </span>
                <time className="shrink-0 font-mono text-xs text-muted" dateTime={item.created_at}>
                  {formatDateTime(item.created_at)}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm">{item.message}</p>
              <div className="flex gap-3 pt-1">
                <form action={setFeedbackHandled.bind(null, item.id, !item.handled)}>
                  <button type="submit" className="font-mono text-sm font-bold hover:underline">
                    {item.handled ? "[ avaa uudelleen ]" : "[ merkitse käsitellyksi ]"}
                  </button>
                </form>
                <form action={deleteFeedback.bind(null, item.id)}>
                  <button type="submit" className="font-mono text-sm font-bold text-red-500 hover:underline">
                    [ poista ]
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
