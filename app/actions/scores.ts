'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CaseType, ScoreType } from '@/lib/supabase/types'
import { CASE_TYPES } from '@/lib/case-types'

const MIN_PERCENTILE_COHORT = 50

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

// Case types for each grouped specialty score
const VASCULAR_CASE_TYPES: CaseType[] = ['carotid', 'vascular']
const CRANIAL_CASE_TYPES: CaseType[] = ['supratentorial', 'posterior_fossa', 'skull_base']
const PEDIATRICS_CASE_TYPES: CaseType[] = ['pediatric']
const EXTREMITY_CASE_TYPES: CaseType[] = ['peripheral_nerve']
const SPINAL_TUMOR_CASE_TYPES: CaseType[] = ['spinal_tumor']

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

type ReviewRow = {
  rating: number
  cards: { tags: string[] } | null
}

export type ComputedScores = {
  orScore: number | null
  orPercentile: number | null
  spinalScore: number | null
  vascularScore: number | null
  cranialScore: number | null
  pediatricsScore: number | null
  extremityScore: number | null
  spinalTumorScore: number | null
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
    .select('rating, cards(tags)')
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
    const filtered = reviews.filter((r) => r.cards?.tags?.includes(caseType))
    const score = scoreFromReviews(filtered)
    if (score !== null) {
      specialtyScores[caseType] = score
    }
  }

  const nowIso = now.toISOString()

  // ── Percentile — compare orScore against cohort (same career_stage) ──
  let orPercentile: number | null = null
  if (orScore !== null) {
    // Fetch profile to get career_stage for cohort filtering
    const { data: selfProfile } = await admin
      .from('profiles')
      .select('career_stage')
      .eq('id', user.id)
      .maybeSingle()

    if (selfProfile) {
      // Count users in same career_stage cohort who have an or_readiness score
      const { data: cohortRows } = await admin
        .from('readiness_scores')
        .select('score, profiles!inner(career_stage)')
        .eq('score_type', 'or_readiness' as ScoreType)
        .eq('profiles.career_stage', selfProfile.career_stage)

      type CohortRow = { score: number; profiles: { career_stage: string } | null }
      const cohort = ((cohortRows ?? []) as unknown as CohortRow[])
      const total = cohort.length

      if (total >= MIN_PERCENTILE_COHORT) {
        const countBelow = cohort.filter((r) => r.score <= orScore).length
        orPercentile = Math.round((countBelow / total) * 100)
      }
    }
  }

  // ── Upsert OR Readiness ───────────────────────────────────────
  if (orScore !== null) {
    await admin.from('readiness_scores').upsert(
      {
        user_id: user.id,
        score_type: 'or_readiness' as ScoreType,
        score: orScore,
        percentile: orPercentile,
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
      reviews_used: reviews.filter((r) => r.cards?.tags?.includes(scoreType)).length,
      computed_at: nowIso,
    })
  )

  if (specialtyUpserts.length > 0) {
    await admin
      .from('readiness_scores')
      .upsert(specialtyUpserts, { onConflict: 'user_id,score_type' })
  }

  // ── Grouped specialty scores — derived in application memory ─
  const spinalReviews = reviews.filter(
    (r) => r.cards !== null && SPINAL_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct))
  )
  const spinalScore = scoreFromReviews(spinalReviews)

  const vascularScore = scoreFromReviews(
    reviews.filter((r) => r.cards !== null && VASCULAR_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )

  const cranialScore = scoreFromReviews(
    reviews.filter((r) => r.cards !== null && CRANIAL_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )

  const pediatricsScore = scoreFromReviews(
    reviews.filter((r) => r.cards !== null && PEDIATRICS_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )

  const extremityScore = scoreFromReviews(
    reviews.filter((r) => r.cards !== null && EXTREMITY_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )

  const spinalTumorScore = scoreFromReviews(
    reviews.filter((r) => r.cards !== null && SPINAL_TUMOR_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )

  return {
    orScore,
    orPercentile,
    spinalScore,
    vascularScore,
    cranialScore,
    pediatricsScore,
    extremityScore,
    spinalTumorScore,
    specialtyScores,
    reviewCount: reviews.length,
  }
}

// ----------------------------------------------------------------
// Standalone specialty score helpers (used by credentials check)
// ----------------------------------------------------------------

/**
 * Fetch all reviews for a user in the 30-day window.
 * Returns array of ReviewRow with cards.case_type populated.
 */
async function fetchRecentReviews(userId: string): Promise<ReviewRow[]> {
  const admin = createAdminClient()
  const windowStart = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
  const { data: raw } = await admin
    .from('review_log')
    .select('rating, cards(tags)')
    .eq('user_id', userId)
    .gte('reviewed_at', windowStart.toISOString())
  return ((raw ?? []) as unknown as ReviewRow[]).filter((r) => r.cards !== null)
}

export async function computeSpinalScore(userId: string): Promise<number | null> {
  const reviews = await fetchRecentReviews(userId)
  return scoreFromReviews(
    reviews.filter((r) => r.cards !== null && SPINAL_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )
}

export async function computeVascularScore(userId: string): Promise<number | null> {
  const reviews = await fetchRecentReviews(userId)
  return scoreFromReviews(
    reviews.filter((r) => r.cards !== null && VASCULAR_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )
}

export async function computeCranialScore(userId: string): Promise<number | null> {
  const reviews = await fetchRecentReviews(userId)
  return scoreFromReviews(
    reviews.filter((r) => r.cards !== null && CRANIAL_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )
}

export async function computePediatricsScore(userId: string): Promise<number | null> {
  const reviews = await fetchRecentReviews(userId)
  return scoreFromReviews(
    reviews.filter((r) => r.cards !== null && PEDIATRICS_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )
}

export async function computeExtremityScore(userId: string): Promise<number | null> {
  const reviews = await fetchRecentReviews(userId)
  return scoreFromReviews(
    reviews.filter((r) => r.cards !== null && EXTREMITY_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )
}

export async function computeSpinalTumorScore(userId: string): Promise<number | null> {
  const reviews = await fetchRecentReviews(userId)
  return scoreFromReviews(
    reviews.filter((r) => r.cards !== null && SPINAL_TUMOR_CASE_TYPES.some((ct) => r.cards!.tags.includes(ct)))
  )
}
