import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client for TRUSTED SERVER CODE ONLY (Stripe webhook,
// dev simulate-upgrade). It bypasses RLS, so it must never be created from a
// request path that isn't already authorized. Never import this into a Client
// Component. Returns null when the service-role key isn't configured, so callers
// can degrade gracefully (billing simply stays unconfigured).
//
// Add SUPABASE_SERVICE_ROLE_KEY (Supabase dashboard → Project Settings → API →
// service_role secret) to .env.local and the Netlify environment to enable it.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isBillingConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
