"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileMenu } from "@/components/auth/profile-menu";

type NavItem = { href: string; label: string; matchPrefix?: string };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Etusivu" },
  { href: "/sarjat", label: "Sarjat", matchPrefix: "/sarja" },
  { href: "/jasenet", label: "Jäsenet", matchPrefix: "/jasen" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/aikajana", label: "Aikajana" },
  { href: "/tilastot", label: "Tilastot" },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/") return pathname === "/";
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return true;
  if (item.matchPrefix && pathname.startsWith(item.matchPrefix)) return true;
  return false;
}

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1640px] items-center gap-6 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <span aria-hidden className="grid size-7 -rotate-3 place-items-center rounded-lg border-2 border-ink bg-accent text-[13px] font-bold text-ink shadow-[2px_2px_0_rgba(0,0,0,.5)]">KA</span>
          <span className="hidden sm:inline">Kerhon Arkisto</span>
        </Link>
        <nav aria-label="Päänavigaatio" className="flex min-w-0 flex-1 overflow-x-auto no-scrollbar">
          <ul className="flex items-center gap-1 text-sm font-medium">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative whitespace-nowrap rounded-lg px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                      active
                        ? "text-foreground after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-accent"
                        : "text-muted hover:bg-panel hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto shrink-0">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
