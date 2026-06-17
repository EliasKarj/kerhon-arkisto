import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/auth/supabase-server";
import { supabaseAdmin } from "@/lib/admin/supabase-admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
        const username = (meta.user_name ?? meta.full_name ?? meta.name ?? null) as string | null;
        const avatar = (meta.avatar_url ?? meta.picture ?? null) as string | null;
        // Upsert vain discord-kentat + user_id -> EI ylikirjoita member_id/is_admin (eivat mukana).
        const { error: upsertError } = await supabaseAdmin
          .from("accounts")
          .upsert(
            { user_id: user.id, discord_username: username, discord_avatar: avatar },
            { onConflict: "user_id" },
          );
        if (upsertError) console.error("accounts upsert (callback):", upsertError.message);
      }
    }
  }
  return NextResponse.redirect(`${origin}/tili`);
}
