"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/auth/supabase-browser";

interface NavUser {
  name: string | null;
  avatar: string | null;
}

export function AuthNav() {
  const [user, setUser] = useState<NavUser | null | undefined>(undefined); // undefined = lataa

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return setUser(null);
      const meta = (data.user.user_metadata ?? {}) as Record<string, string>;
      setUser({ name: meta.user_name ?? meta.full_name ?? meta.name ?? "Tili", avatar: meta.avatar_url ?? meta.picture ?? null });
    });
  }, []);

  if (user === undefined) return null; // ei välähdystä
  if (user === null) {
    return (
      <Link href="/tili" className="text-sm font-semibold uppercase tracking-wide text-muted hover:text-foreground">
        Kirjaudu
      </Link>
    );
  }
  return (
    <Link href="/tili" className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted hover:text-foreground">
      {user.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar} alt="" className="size-6 border-2 border-foreground object-cover" />
      ) : null}
      {user.name}
    </Link>
  );
}
