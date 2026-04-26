import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createAdminClient()

  const { data: cardSample } = await admin.from('cards').select('*').limit(1)
  const { data: reviewSample } = await admin.from('card_reviews').select('*').limit(1)
  const { data: deckSample } = await admin.from('decks').select('*').limit(2)

  return NextResponse.json({ cardSample, reviewSample, deckSample })
}
