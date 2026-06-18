"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/admin/supabase-admin";
import { requireAdmin } from "@/lib/admin/auth";
import { getCurrentAccount } from "@/lib/auth/account";
import { createSeriesFromAniList } from "@/lib/admin/series-create";
import { reviewId } from "@/lib/admin/validation";
import { validateMyReview, sanitizeMyReview, type MyReviewInput } from "@/lib/member/review-validation";
import { validateSessionInput, canEnterReview, canJoinSession, presentMembers, redactReviews } from "./rules";
import type { ClubSession, RedactedReview, SessionReview } from "./types";
import { sendDiscordMessage, buildScheduledMessage, buildStartedMessage, roomUrl } from "./notify";

function mapSessionRow(r: Record<string, unknown>): ClubSession {
  return {
    id: r.id as string,
    seriesId: r.series_id as string,
    scheduledAt: (r.scheduled_at as string | null) ?? null,
    status: r.status as ClubSession["status"],
    reviewMode: r.review_mode as ClubSession["reviewMode"],
    scoreVisibility: r.score_visibility as ClubSession["scoreVisibility"],
    joinPolicy: r.join_policy as ClubSession["joinPolicy"],
    attendees: (r.attendees as string[] | null) ?? [],
    startedAt: (r.started_at as string | null) ?? null,
    endedAt: (r.ended_at as string | null) ?? null,
  };
}

async function seriesTitle(seriesId: string): Promise<string> {
  const { data } = await supabaseAdmin.from("series").select("title").eq("id", seriesId).maybeSingle();
  return (data?.title as string | undefined) ?? seriesId;
}

export interface CreateSessionInput {
  existingSeriesId: string | null;
  newSeries: { anilistId: number | null; manualTitle: string | null; clubSeason: number; watchedDate: string; proposerId: string } | null;
  scheduledAt: string | null;
  reviewMode: string;
  scoreVisibility: string;
  joinPolicy: string;
  attendees: string[];
}

export async function listSessions(): Promise<ClubSession[]> {
  await requireAdmin();
  const { data, error } = await supabaseAdmin.from("sessions").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSessionRow);
}

/** Jäsenelle: ei-päättyneet sessiot joihin viewer voi liittyä (käynnissä + tulevat). */
export async function listJoinableSessions(): Promise<ClubSession[]> {
  const account = await getCurrentAccount();
  const memberId = account?.memberId ?? null;
  const isAdmin = account?.isAdmin === true;
  if (!memberId && !isAdmin) return [];
  const { data, error } = await supabaseAdmin.from("sessions").select("*").neq("status", "ended").order("scheduled_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSessionRow).filter((s) => isAdmin || canJoinSession(s, memberId));
}

export async function createSession(input: CreateSessionInput): Promise<{ error: string } | { ok: true; id: string }> {
  await requireAdmin();

  let seriesId = input.existingSeriesId;
  if (!seriesId) {
    if (!input.newSeries) return { error: "Valitse sarja tai luo uusi." };
    const res = await createSeriesFromAniList(input.newSeries);
    if ("error" in res) return res;
    seriesId = res.seriesId;
  }

  const errors = validateSessionInput({
    seriesId, reviewMode: input.reviewMode, scoreVisibility: input.scoreVisibility,
    joinPolicy: input.joinPolicy, attendees: input.attendees,
  });
  if (errors.length) return { error: errors.join(" ") };

  const { data, error } = await supabaseAdmin.from("sessions").insert({
    series_id: seriesId, scheduled_at: input.scheduledAt, status: "scheduled",
    review_mode: input.reviewMode, score_visibility: input.scoreVisibility,
    join_policy: input.joinPolicy, attendees: input.attendees,
  }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/hallinta/kerhoillat");
  await sendDiscordMessage(
    buildScheduledMessage({
      title: await seriesTitle(seriesId),
      scheduledAtIso: input.scheduledAt,
      roomUrl: roomUrl(data.id as string),
    }),
  );
  return { ok: true, id: data.id as string };
}

export async function updateSession(
  id: string,
  patch: { scheduledAt: string | null; reviewMode: string; scoreVisibility: string; joinPolicy: string; attendees: string[] },
): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const { data: existing, error: gErr } = await supabaseAdmin.from("sessions").select("series_id,status").eq("id", id).maybeSingle();
  if (gErr) return { error: gErr.message };
  if (!existing) return { error: "Sessiota ei löydy." };
  if (existing.status !== "scheduled") return { error: "Vain ajastettua sessiota voi muokata." };
  const errors = validateSessionInput({
    seriesId: existing.series_id as string, reviewMode: patch.reviewMode, scoreVisibility: patch.scoreVisibility,
    joinPolicy: patch.joinPolicy, attendees: patch.attendees,
  });
  if (errors.length) return { error: errors.join(" ") };
  const { error } = await supabaseAdmin.from("sessions").update({
    scheduled_at: patch.scheduledAt, review_mode: patch.reviewMode, score_visibility: patch.scoreVisibility,
    join_policy: patch.joinPolicy, attendees: patch.attendees,
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/hallinta/kerhoillat");
  return { ok: true };
}

export async function deleteSession(id: string): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  // Vain ajastetun session voi perua (ei käynnissä olevaa eikä päättynyttä).
  const { data: existing, error: gErr } = await supabaseAdmin.from("sessions").select("status").eq("id", id).maybeSingle();
  if (gErr) return { error: gErr.message };
  if (!existing) return { error: "Sessiota ei löydy." };
  if (existing.status !== "scheduled") return { error: "Vain ajastetun kerhoillan voi perua." };
  const { error } = await supabaseAdmin.from("sessions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/hallinta/kerhoillat");
  return { ok: true };
}

const PUBLIC_PATHS = ["/", "/sarjat", "/tilastot", "/hall-of-fame", "/jasenet"];

function revalidateAfterCommit(seriesId: string) {
  for (const p of PUBLIC_PATHS) revalidatePath(p);
  revalidatePath(`/sarja/${seriesId}`);
}

export async function startSession(id: string): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const { data: live, error: lErr } = await supabaseAdmin.from("sessions").select("id").eq("status", "live").limit(1);
  if (lErr) return { error: lErr.message };
  if (live && live.length > 0 && live[0].id !== id) return { error: "Toinen kerhoilta on jo käynnissä." };
  const { data: updated, error } = await supabaseAdmin.from("sessions")
    .update({ status: "live", started_at: new Date().toISOString() })
    .eq("id", id).eq("status", "scheduled")
    .select("series_id");
  if (error) return { error: error.message };
  revalidatePath(`/kerhoilta/${id}`);
  revalidatePath("/hallinta/kerhoillat");
  if (updated && updated.length > 0) {
    await sendDiscordMessage(
      buildStartedMessage({ title: await seriesTitle(updated[0].series_id as string), roomUrl: roomUrl(id) }),
    );
  }
  return { ok: true };
}

export async function endSession(id: string): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const { data: session, error: sErr } = await supabaseAdmin.from("sessions").select("*").eq("id", id).maybeSingle();
  if (sErr) return { error: sErr.message };
  if (!session) return { error: "Sessiota ei löydy." };
  if (session.status === "ended") return { ok: true };
  const seriesId = session.series_id as string;

  const { data: staged, error: stErr } = await supabaseAdmin.from("session_reviews").select("*").eq("session_id", id);
  if (stErr) return { error: stErr.message };
  const rows = (staged ?? [])
    .filter((r) => r.score !== null && r.score !== undefined)
    .map((r) => ({
      id: reviewId(seriesId, r.member_id as string),
      series_id: seriesId, member_id: r.member_id as string,
      score: Number(r.score), bullet_points: (r.bullet_points as string[]) ?? [],
      best_pick: (r.best_pick as string) ?? "", tags: (r.tags as string[]) ?? [],
    }));
  if (rows.length) {
    const { error: upErr } = await supabaseAdmin.from("reviews").upsert(rows, { onConflict: "id" });
    if (upErr) return { error: upErr.message };
  }
  const { error } = await supabaseAdmin.from("sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/kerhoilta/${id}`);
  revalidatePath("/hallinta/kerhoillat");
  revalidateAfterCommit(seriesId);
  return { ok: true };
}

async function loadSessionForWrite(id: string) {
  const { data, error } = await supabaseAdmin.from("sessions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapSessionRow(data) : null;
}

async function upsertStagedReview(sessionId: string, memberId: string, input: MyReviewInput) {
  const errors = validateMyReview(input);
  if (errors.length) return { error: errors.join(" ") };
  const clean = sanitizeMyReview(input);
  const { error } = await supabaseAdmin.from("session_reviews").upsert({
    session_id: sessionId, member_id: memberId, score: clean.score,
    best_pick: clean.bestPick, bullet_points: clean.bulletPoints, tags: clean.tags,
    updated_at: new Date().toISOString(),
  }, { onConflict: "session_id,member_id" });
  if (error) return { error: error.message };
  revalidatePath(`/kerhoilta/${sessionId}`);
  return { ok: true as const };
}

export async function saveSessionReview(sessionId: string, input: MyReviewInput): Promise<{ error: string } | { ok: true }> {
  const account = await getCurrentAccount();
  const memberId = account?.memberId ?? null;
  if (!memberId) return { error: "Sinun täytyy olla linkitetty jäsen." };
  const session = await loadSessionForWrite(sessionId);
  if (!session) return { error: "Sessiota ei löydy." };
  if (!canJoinSession(session, memberId)) return { error: "Et ole tämän kerhoillan osallistuja." };
  if (!canEnterReview(session, { asChairman: false })) return { error: "Arvioiden syöttö ei ole käytössä." };
  return upsertStagedReview(sessionId, memberId, input);
}

export async function saveSessionReviewAsChairman(sessionId: string, memberId: string, input: MyReviewInput): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const session = await loadSessionForWrite(sessionId);
  if (!session) return { error: "Sessiota ei löydy." };
  if (!canEnterReview(session, { asChairman: true })) return { error: "Puheenjohtajan syöttö ei ole käytössä." };
  return upsertStagedReview(sessionId, memberId, input);
}

export interface RoomState {
  allowed: boolean;
  session: ClubSession | null;
  viewerMemberId: string | null;
  viewerIsChairman: boolean;
  present: string[];
  reviews: RedactedReview[];
}

export async function getRoomState(sessionId: string): Promise<RoomState> {
  const account = await getCurrentAccount();
  const memberId = account?.memberId ?? null;
  const viewerIsChairman = account?.isAdmin === true;

  const { data: row, error } = await supabaseAdmin.from("sessions").select("*").eq("id", sessionId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return { allowed: false, session: null, viewerMemberId: memberId, viewerIsChairman, present: [], reviews: [] };
  const session = mapSessionRow(row);

  const allowed = viewerIsChairman || canJoinSession(session, memberId);
  if (!allowed) return { allowed: false, session, viewerMemberId: memberId, viewerIsChairman, present: [], reviews: [] };

  if (memberId && session.status !== "ended") {
    await supabaseAdmin.from("session_presence").upsert(
      { session_id: sessionId, member_id: memberId, last_seen: new Date().toISOString() },
      { onConflict: "session_id,member_id" },
    );
  }

  const [presRes, revRes] = await Promise.all([
    supabaseAdmin.from("session_presence").select("member_id,last_seen").eq("session_id", sessionId),
    supabaseAdmin.from("session_reviews").select("*").eq("session_id", sessionId),
  ]);
  if (presRes.error) throw new Error(presRes.error.message);
  if (revRes.error) throw new Error(revRes.error.message);

  const now = Date.now();
  const present = presentMembers(
    (presRes.data ?? []).map((p) => ({ memberId: p.member_id as string, lastSeen: new Date(p.last_seen as string).getTime() })),
    now,
  );
  const reviews: SessionReview[] = (revRes.data ?? []).map((r) => ({
    memberId: r.member_id as string,
    score: r.score === null || r.score === undefined ? null : Number(r.score),
    bestPick: (r.best_pick as string) ?? "",
    bulletPoints: (r.bullet_points as string[]) ?? [],
    tags: (r.tags as string[]) ?? [],
  }));
  const redacted = redactReviews(reviews, {
    scoreVisibility: session.scoreVisibility, status: session.status, viewerIsChairman, viewerMemberId: memberId,
  });

  return { allowed: true, session, viewerMemberId: memberId, viewerIsChairman, present, reviews: redacted };
}
