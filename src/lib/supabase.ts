import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL or env.SUPABASE_URL");
}

// Client for public access (anon)
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || "",
);

// Admin client for server-side operations (service role)
// We guard this to prevent crashes in the browser where the service key is missing.
export const supabaseAdmin = typeof window === 'undefined' && supabaseServiceKey
  ? createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null as any; // Cast to any to avoid type issues when null, but will error if used on client

