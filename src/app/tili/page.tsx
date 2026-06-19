import type { Metadata } from "next";
import { getCurrentAccount } from "@/lib/auth/account";
import { getRoomData, memberById } from "@/lib/data";
import { DiscordLoginButton, LogoutButton } from "@/components/auth/auth-buttons";

export const metadata: Metadata = { title: "Tili" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const account = await getCurrentAccount();

  if (!account) {
    return (
      <section className="mx-auto flex max-w-sm flex-col gap-5 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Tili</h1>
        <p className="text-muted">Kirjaudu Discordilla nähdäksesi tilisi.</p>
        <DiscordLoginButton />
      </section>
    );
  }

  let memberName: string | null = null;
  if (account.memberId) {
    const { members } = await getRoomData();
    memberName = memberById(members, account.memberId)?.name ?? null;
  }

  return (
    <section className="mx-auto flex max-w-sm flex-col gap-5 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Tili</h1>
      <div className="surface flex flex-col gap-2 p-5">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted">
          Discord: {account.discordUsername ?? "—"}
        </span>
        {memberName ? (
          <p className="text-lg font-bold">
            Olet {memberName}
            {account.isAdmin ? <span className="ml-2 text-accent">(admin)</span> : null}
          </p>
        ) : (
          <p className="text-muted">
            Tilisi odottaa linkitystä — pyydä adminia liittämään sinut jäseneen.
          </p>
        )}
      </div>
      <LogoutButton />
    </section>
  );
}
