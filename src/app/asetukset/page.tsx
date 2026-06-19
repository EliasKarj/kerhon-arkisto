import type { Metadata } from "next";
import { ThemePicker } from "@/components/theme-picker";

export const metadata: Metadata = { title: "Asetukset" };

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 py-4">
      <h1 className="text-3xl font-bold tracking-tight">Asetukset</h1>
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="sec-head text-lg">Ulkoasu</h2>
        </div>
        <p className="text-sm text-muted">Valitse väriteema. Valinta tallentuu selaimeesi.</p>
        <ThemePicker />
      </section>
    </div>
  );
}
