import { createClient } from '@supabase/supabase-js'

// ⚠️ SERVER-ONLY. Never import this file into a Client Component or expose
// SUPABASE_SERVICE_ROLE_KEY to the browser — it bypasses all RLS policies.
// Only use inside app/api/**/route.ts files or other server-only code.

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}