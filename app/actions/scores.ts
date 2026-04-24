'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CaseType, ScoreType } from '@/lib/supabase/types'
import { CASE_TYPES } from '@/lib/case-types'

const MIN_REVIEWS = 10
const WINDOW_DAYS = 30

// Case types that constitute "spinal" specialty
const SPINAL_CASE_TYPES: CaseType[] = [
  'cervical',
  'lumbar',
  'scoliosis',
  'tethered_cord',
  'spinal_tumor',
]

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

type ReviewRow = {
  rating: number
  cards: { case_type: string } | null
}

export type ComputedScores = {
  orScore: number | null
  spinalScore: number | null
  specialtyScores: Partial<Record<CaseType, number>>
  reviewCount: number
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/**
 * Accuracy score from a set of reviews.
 * Returns null if fewer than MIN_REVIEWS reviews — not enough data.
 * "Correct" = rating >= 3 (Got it / Good).
 */
function scoreFromReviews(reviews: ReviewRow[]): number | null {
  if (reviews.length < MIN_REVIEWS) return null
  const correct = reviews.filter((r) => r.rating >= 3).length
  return Math.round((correct / reviews.length) * 100)
}

// ----------------------------------------------------------------
// Server action
// ----------------------------------------------------------------

/**
 * Compute OR Readiness + all specialty scores for the authenticated user.
 * Upserts results into readiness_scores and returns the computed values.
 * Called on-demand when the user opens the progress screen.
 */
export async function computeAndCacheScores(): Promise<ComputedScores> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)

  // Fetch last 30 days of reviews joined to cards for case_type.
  // card_reviews → cards FK exists in the DB; cast result because
  // our hand-written type file has Relationships: [] everywhere.
  const { data: raw } = await admin
    .from('review_log')
    .select('rating, cards(case_type)')
    .eq('user_id', user.id)
    .gte('reviewed_at', windowStart.toISOString())

  const reviews = ((raw ?? []) as unknown as ReviewRow[]).filter(
    (r) => r.cards !== null
  )

  // ── OR Readiness — all modalities combined ────────────────────
  const orScore = scoreFromReviews(reviews)

  // ── Specialty scores — per case_type ─────────────────────────
  const specialtyScores: Partial<Record<CaseType, number>> = {}
  for (const caseType of CASE_TYPES) {
    const filtered = reviews.filter((r) => r.cards?.case_type === caseType)
    const score = scoreFromReviews(filtered)
    if (score !== null) {
      specialtyScores[caseType] = score
    }
  }

  const nowIso = now.toISOString()

  // ── Upsert OR Readiness ───────────────────────────────────────
  if (orScore !== null) {
    await admin.from('readiness_scores').upsert(
      {
        user_id: user.id,
        score_type: 'or_readiness' as ScoreType,
        score: orScore,
        reviews_used: reviews.length,
        computed_at: nowIso,
      },
      { onConflict: 'user_id,score_type' }
    )
  }

  // ── Upsert specialty scores (batch) ──────────────────────────
  const specialtyUpserts = (Object.entries(specialtyScores) as [CaseType, number][]).map(
    ([scoreType, score]) => ({
      user_id: user.id,
      score_type: scoreType as ScoreType,
      score,
      reviews_used: reviews.filter((r) => r.cards?.case_type === scoreType).length,
      computed_at: nowIso,
    })
  )

  if (specialtyUpserts.length > 0) {
    await admin
      .from('readiness_scores')
      .upsert(specialtyUpserts, { onConflict: 'user_id,score_type' })
  }

  // ── Spinal score — combined across spinal case_types ────────
  const spinalReviews = reviews.filter(
    (r) => r.cards !== null && SPINAL_CASE_TYPES.includes(r.cards.case_type as CaseType)
  )
  const spinalScore = scoreFromReviews(spinalReviews)

  return { orScore, spinalScore, specialtyScores, reviewCount: reviews.length }
}

// ----------------------------------------------------------------
// Standalone spinal score server action
// ----------------------------------------------------------------

/**
 * Compute and return the spinal specialty score for the given user.
 * Spinal = combined reviews across cervical, lumbar, scoliosis, tethered_cord, spinal_tumor.
 * Returns null if fewer than MIN_REVIEWS (10) reviews exist.
 *
 * NOTE: 'spinal' is not a value in the DB score_type enum, so this score
 * is derived in-memory from the individual spinal case-type reviews and
 * is NOT separately cached in readiness_scores. It is returned alongside
 * the other scores from computeAndCacheScores().
 */
export async function computeSpinalScore(userId: string): Promise<number | null> {
  const admin = createAdminClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const { data: raw } = await admin
    .from('review_log')
    .select('rating, cards(case_type)')
    .eq('user_id', userId)
    .gte('reviewed_at', windowStart.toISOString())

  const reviews = ((raw ?? []) as unknown as ReviewRow[]).filter(
    (r) => r.cards !== null
  )

  const spinalReviews = reviews.filter(
    (r) => r.cards !== null && SPINAL_CASE_TYPES.includes(r.cards.case_type as CaseType)
  )

  return scoreFromReviews(spinalReviews)
}
