import { createBrowserClient } from "@supabase/ssr";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;

export function getSupabaseProjectHost() {
  try {
    return url ? new URL(url).host : null;
  } catch {
    return null;
  }
}

export function getSupabaseClient() {
  if (!url || !anonKey) {
    console.warn("Supabase: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env");
    return null;
  }
  if (!client) {
    client = createBrowserClient(url, anonKey);
  }
  return client;
}
