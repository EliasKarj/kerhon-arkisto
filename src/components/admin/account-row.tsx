"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/types";
import type { AccountListItem } from "@/lib/admin/account-actions";
import { linkAccount, unlinkAccount, setAccountAdmin } from "@/lib/admin/account-actions";

export function AccountRow({
  account,
  linkedMemberName,
  availableMembers,
}: {
  account: AccountListItem;
  linkedMemberName: string | null;
  availableMembers: Member[];
}) {
  const router = useRouter();
  const [memberId, setMemberId] = useState("");
  const [useAvatar, setUseAvatar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error: string } | { ok: true }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if ("error" in res) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="surface-flat flex flex-col gap-3 p-3">
      <div className="flex items-center gap-3">
        {account.discordAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={account.discordAvatar} alt="" className="size-8 border-2 border-foreground object-cover" />
        ) : null}
        <span className="font-bold">{account.discordUsername ?? account.userId.slice(0, 8)}</span>
        {account.isAdmin ? <span className="font-mono text-xs text-accent">ADMIN</span> : null}
        <span className="ml-auto font-mono text-sm text-muted">
          {linkedMemberName ? `→ ${linkedMemberName}` : "linkittämätön"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {account.memberId ? (
          <button type="button" disabled={pending} onClick={() => run(() => unlinkAccount(account.userId))} className="border-2 border-foreground bg-panel px-3 py-1.5 text-sm font-bold disabled:opacity-50">
            Poista linkitys
          </button>
        ) : (
          <>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="border-2 border-foreground bg-background px-2 py-1.5 text-sm">
              <option value="">— valitse jäsen —</option>
              {availableMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <label className="flex items-center gap-1 text-sm text-muted">
              <input type="checkbox" checked={useAvatar} onChange={(e) => setUseAvatar(e.target.checked)} />
              Discord-avatar
            </label>
            <button type="button" disabled={pending || !memberId} onClick={() => run(() => linkAccount(account.userId, memberId, useAvatar))} className="border-2 border-foreground bg-accent px-3 py-1.5 text-sm font-bold text-background disabled:opacity-50">
              Linkitä
            </button>
          </>
        )}
        <button type="button" disabled={pending} onClick={() => run(() => setAccountAdmin(account.userId, !account.isAdmin))} className="border-2 border-foreground bg-panel px-3 py-1.5 text-sm font-bold disabled:opacity-50">
          {account.isAdmin ? "Poista admin" : "Tee admin"}
        </button>
      </div>
      {error ? <p className="font-mono text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
