import { createBrowserClient } from "@supabase/ssr";

interface DatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function createClient(config?: DatabaseConfig) {
  const url = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = config?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase browser configuration keys.");
  }

  return createBrowserClient(url, anonKey);
}