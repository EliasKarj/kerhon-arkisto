import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error("Supabase-ympäristömuuttujat puuttuvat (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY).");
}

/** Lukukäyttöön (anon, RLS public SELECT). Käytetään server-komponenteissa. */
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
