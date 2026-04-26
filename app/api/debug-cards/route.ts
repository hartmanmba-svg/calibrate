import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? 'none'

  // Fetch first card with all columns (wildcard) to see schema
  const { data: sample, error: sampleError } = await admin
    .from('cards')
    .select('*')
    .limit(1)

  // Count cards with user client
  const { count: userCount, error: userCountError } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })

  return NextResponse.json({
    uid,
    sample,
    sampleError: sampleError?.message ?? null,
    userCount,
    userCountError: userCountError?.message ?? null,
  })
}
