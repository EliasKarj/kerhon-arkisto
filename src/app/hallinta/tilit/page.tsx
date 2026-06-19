import { listAccounts } from "@/lib/admin/account-actions";
import { getRoomData, memberById } from "@/lib/data";
import { AccountRow } from "@/components/admin/account-row";

export default async function AccountsAdminPage() {
  const accounts = await listAccounts();
  const { members } = await getRoomData();
  const linkedMemberIds = new Set(accounts.map((a) => a.memberId).filter(Boolean) as string[]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Tilit & linkitys</h1>
      <p className="text-sm text-muted">
        Liitä kirjautunut Discord-tili kerhon jäseneen. Yksi jäsen ↔ yksi tili.
      </p>
      {accounts.length === 0 ? (
        <p className="text-muted">Ei vielä kirjautuneita tilejä.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map((a) => {
            const availableMembers = members.filter(
              (m) => !linkedMemberIds.has(m.id) || m.id === a.memberId,
            );
            return (
              <AccountRow
                key={a.userId}
                account={a}
                linkedMemberName={a.memberId ? (memberById(members, a.memberId)?.name ?? null) : null}
                availableMembers={availableMembers}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
