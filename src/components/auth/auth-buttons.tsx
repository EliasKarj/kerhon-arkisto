"use client";

import { createSupabaseBrowser } from "@/lib/auth/supabase-browser";

const btn =
  "border-2 border-foreground bg-accent px-4 py-2 font-bold tracking-tight text-background shadow-[4px_4px_0_var(--color-foreground)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5";

export function DiscordLoginButton() {
  async function login() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
  return (
    <button type="button" onClick={login} className={btn}>
      Kirjaudu Discordilla
    </button>
  );
}

export function LogoutButton() {
  async function logout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = "/tili";
  }
  return (
    <button type="button" onClick={logout} className="font-mono text-sm font-bold hover:underline">
      [ kirjaudu ulos ]
    </button>
  );
}
