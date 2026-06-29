const HELSINKI = "Europe/Helsinki";
const DEFAULT_SITE = "https://kerhon-arkisto.vercel.app";

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE).replace(/\/$/, "");
}

export function roomUrl(sessionId: string): string {
  return `${siteBase()}/kerhoilta/${sessionId}`;
}

/** Tekee suhteellisesta polusta absoluuttisen URL:n (Discord-viesteihin). */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${siteBase()}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function seriesUrl(seriesId: string): string {
  return `${siteBase()}/sarja/${seriesId}`;
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

export function buildEndedMessage(input: {
  title: string;
  scores: { name: string; score: number }[];
  topPick: { name: string; votes: number } | null;
  seriesUrl: string;
}): string {
  const lines = [`🏁 Kerhoilta päättyi: ${input.title}`];
  if (input.scores.length > 0) {
    const avg = input.scores.reduce((total, s) => total + s.score, 0) / input.scores.length;
    lines.push(`Keskiarvo: ${avg.toFixed(1)}/5 (${input.scores.length} arviota)`);
    lines.push(`Pisteet: ${input.scores.map((s) => `${s.name} ${s.score}`).join(" · ")}`);
  } else {
    lines.push("Ei arvioita.");
  }
  if (input.topPick) lines.push(`Best character: ${input.topPick.name} (${input.topPick.votes} ääntä)`);
  lines.push(`Tulokset: ${input.seriesUrl}`);
  return lines.join("\n");
}

/** Best-effort: lähettää viestin Discord-webhookiin. Ei koskaan heitä; ohittaa jos env puuttuu.
 *  imageUrl lisää sarjan kuvan embediin (esim. AniList-kansi). */
export async function sendDiscordMessage(content: string, opts?: { imageUrl?: string | null }): Promise<void> {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  const body: Record<string, unknown> = { content };
  if (opts?.imageUrl) {
    body.embeds = [{ image: { url: opts.imageUrl }, color: 0xc6f000 }];
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error(`Discord webhook ${res.status}`);
  } catch (e) {
    console.error("Discord webhook failed:", e instanceof Error ? e.message : String(e));
  }
}
