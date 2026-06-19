"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/auth/supabase-browser";

interface MenuUser {
  name: string;
  avatar: string | null;
  isAdmin: boolean;
  memberId: string | null;
}

export function ProfileMenu() {
  const [user, setUser] = useState<MenuUser | null | undefined>(undefined); // undefined = lataa
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return setUser(null);
      const meta = (data.user.user_metadata ?? {}) as Record<string, string>;
      const name = meta.user_name ?? meta.full_name ?? meta.name ?? "Tili";
      const avatar = meta.avatar_url ?? meta.picture ?? null;
      const { data: acc } = await supabase
        .from("accounts").select("is_admin,member_id").eq("user_id", data.user.id).maybeSingle();
      setUser({ name, avatar, isAdmin: Boolean(acc?.is_admin), memberId: (acc?.member_id as string | null) ?? null });
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onKey); };
  }, [open]);

  async function logout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = "/tili";
  }

  if (user === undefined) return <span className="w-20" aria-hidden />;

  if (user === null) {
    return (
      <Link href="/tili" className="text-sm font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        Kirjaudu
      </Link>
    );
  }

  const item = "flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-semibold transition-colors hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="size-7 rounded-full border-2 border-ink object-cover" />
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-bold text-ink">{user.name.slice(0, 1).toUpperCase()}</span>
        )}
        {user.name}
        <span aria-hidden className="text-muted">▾</span>
      </button>

      {open && (
        <div role="menu" aria-label="Profiili" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-[13px] border border-line-strong bg-panel shadow-[0_18px_40px_rgba(0,0,0,.5)]">
          <div className="border-b border-line px-4 py-3">
            <div className="font-semibold">{user.name}{user.isAdmin ? <span className="ml-2 font-mono text-[11px] font-bold text-accent">ADMIN</span> : null}</div>
            <div className="text-xs text-muted">Discord · kirjautunut</div>
          </div>
          <Link role="menuitem" href={user.memberId ? `/jasen/${user.memberId}` : "/tili"} className={item} onClick={() => setOpen(false)}>Oma profiili</Link>
          <Link role="menuitem" href="/asetukset" className={item} onClick={() => setOpen(false)}>Asetukset &amp; teema</Link>
          <Link role="menuitem" href="/kerhoillat" className={item} onClick={() => setOpen(false)}>Kerhoillat</Link>
          {user.isAdmin ? <Link role="menuitem" href="/hallinta" className={item} onClick={() => setOpen(false)}>Hallinta</Link> : null}
          <div className="h-px bg-line" />
          <button type="button" role="menuitem" onClick={logout} className={`${item} w-full text-left text-muted`}>Kirjaudu ulos</button>
        </div>
      )}
    </div>
  );
}
