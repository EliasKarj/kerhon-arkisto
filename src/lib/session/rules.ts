import type { JoinPolicy, ReviewMode, ScoreVisibility, SessionReview, SessionStatus, RedactedReview } from "./types";

export function canJoinSession(
  session: { joinPolicy: JoinPolicy; attendees: string[] },
  memberId: string | null,
): boolean {
  if (!memberId) return false;
  if (session.joinPolicy === "all") return true;
  return session.attendees.includes(memberId);
}

export function canEnterReview(
  session: { reviewMode: ReviewMode; status: SessionStatus },
  opts: { asChairman: boolean },
): boolean {
  if (session.status !== "live") return false;
  if (opts.asChairman) return session.reviewMode === "chairman" || session.reviewMode === "both";
  return session.reviewMode === "members" || session.reviewMode === "both";
}

export function presentMembers(
  rows: { memberId: string; lastSeen: number }[],
  nowMs: number,
  windowMs = 30_000,
): string[] {
  return rows.filter((r) => nowMs - r.lastSeen <= windowMs).map((r) => r.memberId);
}

export function redactReviews(
  reviews: SessionReview[],
  ctx: { scoreVisibility: ScoreVisibility; status: SessionStatus; viewerIsChairman: boolean; viewerMemberId: string | null },
): RedactedReview[] {
  const globalReveal = ctx.viewerIsChairman || ctx.status === "ended" || ctx.scoreVisibility === "live";
  return reviews.map((r) => {
    const reveal = globalReveal || r.memberId === ctx.viewerMemberId;
    if (reveal) {
      return { memberId: r.memberId, hasReviewed: true, score: r.score, bestPick: r.bestPick, bulletPoints: r.bulletPoints, tags: r.tags, redacted: false };
    }
    return { memberId: r.memberId, hasReviewed: true, score: null, bestPick: null, bulletPoints: [], tags: [], redacted: true };
  });
}

const MODES = new Set(["chairman", "members", "both"]);
const VIS = new Set(["live", "hidden"]);
const POLICIES = new Set(["all", "invited"]);

export interface SessionInput {
  seriesId: string;
  reviewMode: string;
  scoreVisibility: string;
  joinPolicy: string;
  attendees: string[];
}

export function validateSessionInput(input: SessionInput): string[] {
  const errors: string[] = [];
  if (!input.seriesId) errors.push("Sarja vaaditaan.");
  if (!MODES.has(input.reviewMode)) errors.push("Virheellinen syöttötapa.");
  if (!VIS.has(input.scoreVisibility)) errors.push("Virheellinen pisteiden paljastus.");
  if (!POLICIES.has(input.joinPolicy)) errors.push("Virheellinen liittymiskäytäntö.");
  if (input.joinPolicy === "invited" && input.attendees.length === 0) errors.push("Valitse vähintään yksi osallistuja.");
  return errors;
}
