import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cards')
    .select('id, tags, difficulty')
    .limit(3)
  return NextResponse.json({ data, error: error?.message ?? null, ts: Date.now() })
}
