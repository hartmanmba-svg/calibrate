import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Admin Supabase client — uses the SERVICE ROLE key.
 * Bypasses RLS entirely. NEVER import this in Client Components
 * or expose it to the browser. Server-only: Route Handlers,
 * Server Actions, Edge Functions.
 *
 * Use cases: Stripe webhooks, score computation, certificate
 * generation, seeding cards.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. ' +
      'Admin client must only be used server-side.'
    )
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
