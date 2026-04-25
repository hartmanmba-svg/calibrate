import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { CareerStage, CredentialType } from '@/lib/supabase/types'

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const admin = createAdminClient()

  const { data: shareLink } = await admin
    .from('share_links')
    .select('user_id, show_name, show_scores, show_credentials, show_badges')
    .eq('token', params.token)
    .maybeSingle()

  if (!shareLink) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, career_stage, level, xp')
    .eq('id', shareLink.user_id)
    .maybeSingle()

  const { data: scoreRow } = shareLink.show_scores
    ? await admin
        .from('readiness_scores')
        .select('score, percentile')
        .eq('user_id', shareLink.user_id)
        .eq('score_type', 'or_readiness')
        .maybeSingle()
    : { data: null }

  const { data: credentialRows } = shareLink.show_credentials
    ? await admin
        .from('credentials')
        .select('credential_type')
        .eq('user_id', shareLink.user_id)
        .eq('status', 'active')
    : { data: [] }

  const { data: badgeRows } = shareLink.show_badges
    ? await admin
        .from('badges')
        .select('badge_key')
        .eq('user_id', shareLink.user_id)
    : { data: [] }

  return NextResponse.json({
    name: shareLink.show_name ? (profile?.full_name ?? null) : null,
    career_stage: profile?.career_stage as CareerStage | null,
    level: profile?.level ?? 1,
    or_readiness: scoreRow ?? null,
    credentials: (credentialRows ?? []).map((c) => c.credential_type as CredentialType),
    badges: (badgeRows ?? []).map((b) => b.badge_key),
  })
}
