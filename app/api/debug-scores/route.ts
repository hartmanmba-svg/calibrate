import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('uid')
  if (!userId) return NextResponse.json({ error: 'uid required' }, { status: 400 })

  const admin = createAdminClient()
  const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const { data: logRows, error: logError } = await admin
    .from('review_log')
    .select('rating, card_id, reviewed_at')
    .eq('user_id', userId)
    .gte('reviewed_at', windowStart.toISOString())

  const cardIds = logRows ? Array.from(new Set(logRows.map((r) => r.card_id).filter(Boolean))) : []

  const { data: cardRows, error: cardError } = cardIds.length > 0
    ? await admin.from('cards').select('id, tags').in('id', cardIds)
    : { data: [], error: null }

  // Check review_log schema by fetching one row with *
  const { data: rlSchema, error: rlSchemaError } = await admin
    .from('review_log')
    .select('*')
    .limit(1)

  // Try inserting a test to see the real error
  const { error: insertError } = await admin
    .from('review_log')
    .insert({
      user_id: userId,
      card_id: '00000000-0000-0000-0000-000000000000',
      rating: 3,
      fsrs_state: 'learning',
      scheduled_days: 1,
      elapsed_days: 0,
      reviewed_at: new Date().toISOString(),
    })

  return NextResponse.json({
    logRowCount: logRows?.length ?? 0,
    logError: logError?.message ?? null,
    rlSchemaColumns: rlSchema ? Object.keys(rlSchema[0] ?? {}) : [],
    rlSchemaError: rlSchemaError?.message ?? null,
    insertError: insertError?.message ?? null,
  })
}
