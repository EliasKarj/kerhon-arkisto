"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/admin/supabase-admin";
import { reviewId } from "@/lib/admin/validation";
import { getCurrentAccount } from "@/lib/auth/account";
import {
  validateMyReview, sanitizeMyReview, resolveReviewMemberId, type MyReviewInput,
} from "./review-validation";

function revalidateForReview(seriesId: string, memberId: string) {
  for (const p of ["/", "/sarjat", "/tilastot", "/hall-of-fame", "/jasenet"]) revalidatePath(p);
  revalidatePath(`/sarja/${seriesId}`);
  revalidatePath(`/jasen/${memberId}`);
}

export async function saveMyReview(
  seriesId: string,
  input: MyReviewInput,
): Promise<{ error: string } | { ok: true }> {
  const memberId = resolveReviewMemberId(await getCurrentAccount());
  if (!memberId) return { error: "Sinun täytyy olla linkitetty jäsen arvioidaksesi." };
  const errors = validateMyReview(input);
  if (errors.length) return { error: errors.join(" ") };

  const { data: series, error: sErr } = await supabaseAdmin
    .from("series").select("id").eq("id", seriesId).maybeSingle();
  if (sErr) return { error: sErr.message };
  if (!series) return { error: "Sarjaa ei löydy." };

  const clean = sanitizeMyReview(input);
  const row = {
    id: reviewId(seriesId, memberId),
    series_id: seriesId,
    member_id: memberId,
    score: clean.score,
    bullet_points: clean.bulletPoints,
    best_pick: clean.bestPick,
    best_pick_image: clean.bestPickImage,
    tags: clean.tags,
  };
  const { error } = await supabaseAdmin.from("reviews").upsert(row, { onConflict: "id" });
  if (error) return { error: error.message };
  revalidateForReview(seriesId, memberId);
  return { ok: true };
}

export async function deleteMyReview(
  seriesId: string,
): Promise<{ error: string } | { ok: true }> {
  const memberId = resolveReviewMemberId(await getCurrentAccount());
  if (!memberId) return { error: "Sinun täytyy olla linkitetty jäsen." };
  const { error } = await supabaseAdmin
    .from("reviews").delete().eq("id", reviewId(seriesId, memberId));
  if (error) return { error: error.message };
  revalidateForReview(seriesId, memberId);
  return { ok: true };
}
