import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * Browser (Client Component) Supabase client.
 * Uses the anon key — all queries respect RLS.
 * Call this inside Client Components or hooks.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
