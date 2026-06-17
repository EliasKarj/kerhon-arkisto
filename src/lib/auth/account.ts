import "server-only";
import { createSupabaseServer } from "./supabase-server";

export interface CurrentAccount {
  userId: string;
  memberId: string | null;
  isAdmin: boolean;
  discordUsername: string | null;
  discordAvatar: string | null;
}

/** Kirjautuneen kayttajan tili (oma accounts-rivi, RLS sallii oman). null jos ei kirjautunut. */
export async function getCurrentAccount(): Promise<CurrentAccount | null> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("accounts").select("*").eq("user_id", user.id).maybeSingle();
  if (!data) {
    return { userId: user.id, memberId: null, isAdmin: false, discordUsername: null, discordAvatar: null };
  }
  return {
    userId: data.user_id as string,
    memberId: (data.member_id as string | null) ?? null,
    isAdmin: Boolean(data.is_admin),
    discordUsername: (data.discord_username as string | null) ?? null,
    discordAvatar: (data.discord_avatar as string | null) ?? null,
  };
}
