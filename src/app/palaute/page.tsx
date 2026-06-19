import type { Metadata } from "next";
import { FeedbackForm } from "@/components/feedback/feedback-form";

export const metadata: Metadata = { title: "Palaute" };

export default function FeedbackPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Palaute</h1>
        <p className="text-sm text-muted">
          Bugi, idea tai risu? Kerro vapaasti — palaute menee suoraan ylläpidolle. Nimi on vapaaehtoinen.
        </p>
      </div>
      <FeedbackForm />
    </div>
  );
}
