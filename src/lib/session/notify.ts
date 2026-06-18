const HELSINKI = "Europe/Helsinki";
const DEFAULT_SITE = "https://kerhon-arkisto.vercel.app";

export function roomUrl(sessionId: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE).replace(/\/$/, "");
  return `${base}/kerhoilta/${sessionId}`;
}

export function buildScheduledMessage(input: { title: string; scheduledAtIso: string | null; roomUrl: string }): string {
  const time = input.scheduledAtIso
    ? new Intl.DateTimeFormat("fi-FI", { timeZone: HELSINKI, dateStyle: "short", timeStyle: "short" }).format(new Date(input.scheduledAtIso))
    : "ajankohta avoin";
  return `📅 Kerhoilta ajastettu: ${input.title} — ${time}\nLiity huoneeseen: ${input.roomUrl}`;
}

export function buildStartedMessage(input: { title: string; roomUrl: string }): string {
  return `🔴 @here Kerhoilta alkoi nyt: ${input.title}\nLiity: ${input.roomUrl}`;
}

/** Best-effort: lähettää viestin Discord-webhookiin. Ei koskaan heitä; ohittaa jos env puuttuu. */
export async function sendDiscordMessage(content: string): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) console.error(`Discord webhook ${res.status}`);
  } catch (e) {
    console.error("Discord webhook failed:", e instanceof Error ? e.message : String(e));
  }
}
