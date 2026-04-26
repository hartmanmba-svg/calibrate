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

  return NextResponse.json({
    logRowCount: logRows?.length ?? 0,
    logError: logError?.message ?? null,
    sampleLog: logRows?.slice(0, 3) ?? [],
    uniqueCardIds: cardIds.length,
    cardError: cardError?.message ?? null,
    sampleCards: cardRows?.slice(0, 3) ?? [],
  })
}
