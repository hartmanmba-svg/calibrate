import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET() {
  const admin = createAdminClient()

  // Check share_links table exists
  const { error: selectErr } = await admin
    .from('share_links')
    .select('id', { count: 'exact', head: true })

  // Try an insert with a bogus user_id to see the exact error
  const fakeUserId = '00000000-0000-0000-0000-000000000000'
  const token = randomBytes(16).toString('hex')
  const { error: insertErr } = await admin
    .from('share_links')
    .insert({ user_id: fakeUserId, token })

  // Also check if profiles table has any rows
  const { data: profileSample, error: profileErr } = await admin
    .from('profiles')
    .select('id, career_stage')
    .limit(2)

  return NextResponse.json({
    share_links_exists: !selectErr,
    select_error: selectErr?.message ?? null,
    insert_error: insertErr?.message ?? null,
    insert_error_code: insertErr?.code ?? null,
    profiles: profileSample ?? null,
    profile_error: profileErr?.message ?? null,
  })
}
