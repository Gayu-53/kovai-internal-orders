import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Server-only Supabase client using the service role key. Bypasses RLS —
 * safe because this is never imported into client components and every
 * table has RLS enabled with no policies, so this key is the only path in.
 */
export function getSupabaseAdmin() {
  return createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export const ORDER_FILES_BUCKET = "order-files";
