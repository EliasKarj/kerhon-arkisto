"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteSeries } from "@/lib/admin/actions";

export function DeleteSeriesButton({ seriesId, title }: { seriesId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm(`Poistetaanko "${title}" kokonaan? Tämä poistaa myös sen arviot ja kerhoillat.`)) return;
    startTransition(async () => {
      const res = await deleteSeries(seriesId);
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
      {pending ? "poistetaan…" : "[ poista ]"}
    </button>
  );
}
