import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

/**
 * Creates a Supabase client with the Service Role key.
 * ONLY use this on the server-side in secure API routes.
 */
export function createAdminClient() {
  if (!config.supabase.serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  return createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
