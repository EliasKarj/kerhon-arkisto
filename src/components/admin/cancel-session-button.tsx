"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSession } from "@/lib/session/session-actions";

export function CancelSessionButton({ sessionId, title }: { sessionId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(`Perutaanko kerhoilta "${title}"?`)) return;
    startTransition(async () => {
      const res = await deleteSession(sessionId);
      if ("error" in res) { window.alert(res.error); return; }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="font-mono text-sm font-bold text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? "perutaan…" : "[ peru ]"}
    </button>
  );
}
