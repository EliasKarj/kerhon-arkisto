"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Member } from "@/lib/types";
import { setSessionChairman } from "@/lib/session/session-actions";

export function ChairmanSelect({
  sessionId, current, members,
}: {
  sessionId: string; current: string | null; members: Member[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(value: string) {
    startTransition(async () => {
      const res = await setSessionChairman(sessionId, value || null);
      if ("error" in res) { window.alert(res.error); return; }
      router.refresh();
    });
  }

  return (
    <select
      value={current ?? ""}
      disabled={pending}
      onChange={(e) => change(e.target.value)}
      aria-label="Puheenjohtaja"
      className="border-2 border-foreground bg-background px-2 py-1 text-sm disabled:opacity-50"
    >
      <option value="">pj: vain adminit</option>
      {members.map((m) => <option key={m.id} value={m.id}>pj: {m.name}</option>)}
    </select>
  );
}
