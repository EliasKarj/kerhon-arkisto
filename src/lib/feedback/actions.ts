"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/admin/supabase-admin";
import { requireAdmin } from "@/lib/admin/auth";

const MIN_FILL_MS = 2000; // bottiansa: ihminen ei ehdi täyttää näin nopeasti

export type SubmitResult = { ok: true } | { error: string };

/**
 * Julkinen palautteen lähetys. Kirjoittaa service_rolella (RLS:n ohi).
 * Roskasuojat: hunajapurkki (`company`) + aikaloukku (`loadedAt`) + pituusrajat.
 */
export async function submitFeedback(formData: FormData): Promise<SubmitResult> {
  // Hunajapurkki: oikea käyttäjä ei näe kenttää, botti täyttää → pudota hiljaa.
  const honeypot = String(formData.get("company") ?? "").trim();
  if (honeypot) return { ok: true };

  // Aikaloukku: liian nopea lähetys = botti → pudota hiljaa.
  const loadedAt = Number(formData.get("loadedAt") ?? 0);
  if (Number.isFinite(loadedAt) && loadedAt > 0 && Date.now() - loadedAt < MIN_FILL_MS) {
    return { ok: true };
  }

  const message = String(formData.get("message") ?? "").trim();
  const nameRaw = String(formData.get("name") ?? "").trim();

  if (message.length < 3) return { error: "Kirjoita hieman pidempi viesti." };
  if (message.length > 2000) return { error: "Viesti on liian pitkä (max 2000 merkkiä)." };
  if (nameRaw.length > 80) return { error: "Nimi on liian pitkä (max 80 merkkiä)." };

  const { error } = await supabaseAdmin
    .from("feedback")
    .insert({ message, name: nameRaw || null });

  if (error) return { error: "Lähetys epäonnistui. Yritä hetken päästä uudelleen." };
  return { ok: true };
}

/** Hallinta: merkitse käsitellyksi / käsittelemättömäksi. */
export async function setFeedbackHandled(id: string, handled: boolean): Promise<void> {
  await requireAdmin();
  await supabaseAdmin.from("feedback").update({ handled }).eq("id", id);
  revalidatePath("/hallinta/palaute");
}

/** Hallinta: poista palaute. */
export async function deleteFeedback(id: string): Promise<void> {
  await requireAdmin();
  await supabaseAdmin.from("feedback").delete().eq("id", id);
  revalidatePath("/hallinta/palaute");
}
