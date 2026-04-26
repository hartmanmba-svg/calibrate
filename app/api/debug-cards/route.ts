import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()

  // Get one profile row to see actual schema
  const { data: profileSample, error: profileError } = await admin
    .from('profiles').select('*').limit(1)

  // Try selecting exactly what processReview needs
  const { data: profileFields, error: profileFieldsError } = await admin
    .from('profiles').select('xp, level, streak, streak_shield, last_review_date, consecutive_got_it').limit(1)

  // Check review_log schema
  const { data: rlSample, error: rlError } = await admin
    .from('review_log').select('*').limit(1)

  return NextResponse.json({
    profileSample,
    profileError: profileError?.message ?? null,
    profileFields,
    profileFieldsError: profileFieldsError?.message ?? null,
    rlSample,
    rlError: rlError?.message ?? null,
  })
}
