import Link from "next/link";
import { requireAuth } from "@/lib/admin/auth";
import { logout } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function HallintaLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between border-b-2 border-foreground pb-3">
        <Link href="/hallinta" className="font-bold uppercase tracking-tight">Hallinta</Link>
        <form action={logout}>
          <button type="submit" className="font-mono text-sm font-bold hover:underline">[ kirjaudu ulos ]</button>
        </form>
      </div>
      {children}
    </div>
  );
}
