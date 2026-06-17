"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeMenu } from "@/components/theme-menu";
import { AuthNav } from "@/components/auth/auth-nav";

type NavItem = {
  href: string;
  label: string;
  matchPrefix?: string;
};

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
    <header className="border-b-2 border-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link
          href="/"
          className="w-fit bg-foreground px-2.5 py-1 text-lg font-bold uppercase tracking-tight text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          Kerhon Arkisto
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <nav aria-label="Päänavigaatio">
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold uppercase tracking-wide">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                        active
                          ? "text-foreground underline decoration-accent decoration-2"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <ThemeMenu />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
