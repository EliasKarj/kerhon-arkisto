export type SessionStatus = "scheduled" | "live" | "ended";
export type ReviewMode = "chairman" | "members" | "both";
export type ScoreVisibility = "live" | "hidden";
export type JoinPolicy = "all" | "invited";

export interface ClubSession {
  id: string;
  seriesId: string;
  scheduledAt: string | null;
  status: SessionStatus;
  reviewMode: ReviewMode;
  scoreVisibility: ScoreVisibility;
  joinPolicy: JoinPolicy;
  attendees: string[];
  startedAt: string | null;
  endedAt: string | null;
}

export interface SessionReview {
  memberId: string;
  score: number | null;
  bestPick: string;
  bestPickImage: string | null;
  bulletPoints: string[];
  tags: string[];
}

export interface RedactedReview {
  memberId: string;
  hasReviewed: boolean;
  score: number | null;
  bestPick: string | null;
  bestPickImage: string | null;
  bulletPoints: string[];
  tags: string[];
  redacted: boolean;
}
