import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? 'none'

  // Count total cards with admin client
  const { count: adminCount, error: adminCountError } = await admin
    .from('cards')
    .select('*', { count: 'exact', head: true })

  // Fetch first 3 cards with admin client (with fields flashcard page selects)
  const { data: adminCards, error: adminCardsError } = await admin
    .from('cards')
    .select('id, front, modality, case_type, card_type, deck_id')
    .limit(3)

  // Count cards with user client
  const { count: userCount, error: userCountError } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })

  // Count card_reviews for this user
  const { count: reviewCount, error: reviewCountError } = await supabase
    .from('card_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', uid)

  return NextResponse.json({
    uid,
    admin: {
      totalCards: adminCount,
      error: adminCountError?.message ?? null,
      sample: adminCards,
      sampleError: adminCardsError?.message ?? null,
    },
    user: {
      totalCards: userCount,
      error: userCountError?.message ?? null,
    },
    reviews: {
      count: reviewCount,
      error: reviewCountError?.message ?? null,
    },
  })
}
