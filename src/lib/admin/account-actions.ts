"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "./supabase-admin";
import { requireAdmin } from "./auth";
import { canLinkMember, canRemoveAdmin, shouldCopyAvatar, type AccountLite } from "@/lib/auth/admin-rules";

export interface AccountListItem {
  userId: string;
  memberId: string | null;
  isAdmin: boolean;
  discordUsername: string | null;
  discordAvatar: string | null;
}

async function loadAccounts(): Promise<AccountListItem[]> {
  const { data, error } = await supabaseAdmin
    .from("accounts")
    .select("user_id,member_id,is_admin,discord_username,discord_avatar")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => ({
    userId: a.user_id as string,
    memberId: (a.member_id as string | null) ?? null,
    isAdmin: Boolean(a.is_admin),
    discordUsername: (a.discord_username as string | null) ?? null,
    discordAvatar: (a.discord_avatar as string | null) ?? null,
  }));
}

export async function listAccounts(): Promise<AccountListItem[]> {
  await requireAdmin();
  return loadAccounts();
}

export async function linkAccount(
  userId: string,
  memberId: string,
  useDiscordAvatar: boolean,
): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const accounts = await loadAccounts();
  const lite: AccountLite[] = accounts.map((a) => ({ userId: a.userId, memberId: a.memberId, isAdmin: a.isAdmin }));
  if (!canLinkMember(memberId, userId, lite)) {
    return { error: "Jäsen on jo linkitetty toiseen tiliin." };
  }
  const account = accounts.find((a) => a.userId === userId);
  const { data: member, error: mErr } = await supabaseAdmin
    .from("members").select("avatar_url").eq("id", memberId).maybeSingle();
  if (mErr) return { error: mErr.message };
  if (shouldCopyAvatar((member?.avatar_url as string | null) ?? null, account?.discordAvatar ?? null, useDiscordAvatar)) {
    const up = await supabaseAdmin.from("members").update({ avatar_url: account!.discordAvatar }).eq("id", memberId);
    if (up.error) return { error: up.error.message };
  }
  const { error } = await supabaseAdmin.from("accounts").update({ member_id: memberId }).eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/hallinta/tilit");
  revalidatePath("/jasenet"); // avatar saattoi muuttua
  return { ok: true };
}

export async function unlinkAccount(userId: string): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  const { error } = await supabaseAdmin.from("accounts").update({ member_id: null }).eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/hallinta/tilit");
  return { ok: true };
}

export async function setAccountAdmin(userId: string, isAdminFlag: boolean): Promise<{ error: string } | { ok: true }> {
  await requireAdmin();
  if (!isAdminFlag) {
    const accounts = await loadAccounts();
    const lite: AccountLite[] = accounts.map((a) => ({ userId: a.userId, memberId: a.memberId, isAdmin: a.isAdmin }));
    if (!canRemoveAdmin(userId, lite)) return { error: "Et voi poistaa viimeisen adminin oikeuksia." };
  }
  const { error } = await supabaseAdmin.from("accounts").update({ is_admin: isAdminFlag }).eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath("/hallinta/tilit");
  return { ok: true };
}
