import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? null

  // Check profile with all fields the review action needs
  const { data: profile, error: profileError } = uid
    ? await admin.from('profiles').select('xp, level, streak, streak_shield, last_review_date, consecutive_got_it').eq('id', uid).maybeSingle()
    : { data: null, error: { message: 'not authed' } }

  // Check review_log exists
  const { count: rlCount, error: rlError } = await admin
    .from('review_log').select('*', { count: 'exact', head: true })

  // Check card_reviews schema
  const { data: crSample, error: crError } = await admin
    .from('card_reviews').select('*').limit(1)

  return NextResponse.json({
    uid,
    profile,
    profileError: profileError?.message ?? null,
    reviewLog: { count: rlCount, error: rlError?.message ?? null },
    cardReviewSample: crSample,
    cardReviewError: crError?.message ?? null,
  })
}
