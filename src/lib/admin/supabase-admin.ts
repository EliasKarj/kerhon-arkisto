import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Admin-Supabase puuttuu (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
}

/** KIRJOITUSKÄYTTÖ: service_role ohittaa RLS:n. VAIN palvelimella, vain server actioneissa. */
export const supabaseAdmin = createClient(url, serviceKey, { auth: { persistSession: false } });
