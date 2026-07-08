import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface DatabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export async function createClient(config?: DatabaseConfig) {
  const cookieStore = await cookies();

  // Fallback to env vars if no explicit config is provided (for local testing)
  const url = config?.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = config?.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase configuration keys.");
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if handled by middleware refreshing user sessions
          }
        },
      },
    }
  );
}