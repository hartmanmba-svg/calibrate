'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CareerStage, CaseType, CredentialType, Database } from '@/lib/supabase/types'

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const WINDOW_DAYS = 30
const PAUSE_WINDOW_DAYS = 14
const TRAINER_THRESHOLD = 0.9
const PAUSE_THRESHOLD = 0.8

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

type ReviewLogRow = {
  rating: number
  cards: { card_type: string } | null
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function accuracyFromReviews(reviews: ReviewLogRow[]): number | null {
  if (reviews.length === 0) return null
  const correct = reviews.filter((r) => r.rating >= 3).length
  return correct / reviews.length
}

// ----------------------------------------------------------------
// checkCredentials
// ----------------------------------------------------------------

/**
 * Evaluate credential eligibility for a user and upsert into credentials table.
 * Called after each review to keep credential status current.
 *
 * Rules (simplified — 30-day window approximation of "consecutive days"):
 *   Trainer:  90%+ clinical accuracy in last 30 days → active
 *             < 80% accuracy in last 14 days → paused
 *   Educator: same rules with didactic cards
 *   Fellow:   career_stage = 'certified' AND all specialty scores >= 80 → active (no decay)
 *
 * Returns true if any credential was created or updated.
 */
export async function checkCredentials(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const now = new Date()
  const window30Start = new Date(now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const window14Start = new Date(now.getTime() - PAUSE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Fetch 30-day reviews joined to cards for card_type
  const { data: raw30 } = await admin
    .from('review_log')
    .select('rating, cards(card_type)')
    .eq('user_id', userId)
    .gte('reviewed_at', window30Start)

  const reviews30 = ((raw30 ?? []) as unknown as ReviewLogRow[]).filter(
    (r) => r.cards !== null
  )

  // Fetch 14-day reviews for pause check
  const { data: raw14 } = await admin
    .from('review_log')
    .select('rating, cards(card_type)')
    .eq('user_id', userId)
    .gte('reviewed_at', window14Start)

  const reviews14 = ((raw14 ?? []) as unknown as ReviewLogRow[]).filter(
    (r) => r.cards !== null
  )

  // Fetch profile for career_stage
  const { data: profile } = await admin
    .from('profiles')
    .select('career_stage')
    .eq('id', userId)
    .maybeSingle()

  const careerStage = (profile?.career_stage ?? 'student') as CareerStage

  // Fetch existing credentials
  const { data: existingRows } = await admin
    .from('credentials')
    .select('credential_type, status')
    .eq('user_id', userId)

  const existing = new Map(
    (existingRows ?? []).map((r) => [r.credential_type as CredentialType, r.status])
  )

  let anyChange = false

  // ── Trainer credential ────────────────────────────────────────
  const clinicalReviews30 = reviews30.filter((r) => r.cards?.card_type === 'clinical')
  const clinicalReviews14 = reviews14.filter((r) => r.cards?.card_type === 'clinical')
  const clinicalAccuracy30 = accuracyFromReviews(clinicalReviews30)
  const clinicalAccuracy14 = accuracyFromReviews(clinicalReviews14)

  if (clinicalAccuracy30 !== null && clinicalAccuracy30 >= TRAINER_THRESHOLD) {
    // Eligible — award or keep active
    const changed = await upsertCredential(admin, userId, 'trainer', 'active', existing)
    if (changed) anyChange = true
  } else if (
    clinicalAccuracy14 !== null &&
    clinicalAccuracy14 < PAUSE_THRESHOLD &&
    existing.get('trainer') === 'active'
  ) {
    // Was active, now below pause threshold for 14 days — pause
    const changed = await upsertCredential(admin, userId, 'trainer', 'paused', existing)
    if (changed) anyChange = true
  }

  // ── Educator credential ───────────────────────────────────────
  const didacticReviews30 = reviews30.filter((r) => r.cards?.card_type === 'didactic')
  const didacticReviews14 = reviews14.filter((r) => r.cards?.card_type === 'didactic')
  const didacticAccuracy30 = accuracyFromReviews(didacticReviews30)
  const didacticAccuracy14 = accuracyFromReviews(didacticReviews14)

  if (didacticAccuracy30 !== null && didacticAccuracy30 >= TRAINER_THRESHOLD) {
    const changed = await upsertCredential(admin, userId, 'educator', 'active', existing)
    if (changed) anyChange = true
  } else if (
    didacticAccuracy14 !== null &&
    didacticAccuracy14 < PAUSE_THRESHOLD &&
    existing.get('educator') === 'active'
  ) {
    const changed = await upsertCredential(admin, userId, 'educator', 'paused', existing)
    if (changed) anyChange = true
  }

  // ── Fellow credential ─────────────────────────────────────────
  // Requires: certified career_stage + all specialty scores >= 80
  // Once earned, never decays.
  if (careerStage === 'certified' || careerStage === 'supervisor') {
    if (!existing.has('fellow')) {
      // Check all specialty scores from cached readiness_scores
      const { data: scoreRows } = await admin
        .from('readiness_scores')
        .select('score_type, score')
        .eq('user_id', userId)

      const scores = scoreRows ?? []

      // All specialty case types that must be covered
      const requiredTypes: CaseType[] = [
        'cervical', 'lumbar', 'scoliosis', 'carotid', 'vascular',
        'supratentorial', 'posterior_fossa', 'skull_base',
        'peripheral_nerve', 'spinal_tumor', 'tethered_cord', 'pediatric',
      ]

      const allAbove80 = requiredTypes.every((ct) => {
        const row = scores.find((s) => s.score_type === ct)
        return row !== undefined && row.score >= 80
      })

      if (allAbove80) {
        const changed = await upsertCredential(admin, userId, 'fellow', 'active', existing)
        if (changed) anyChange = true
      }
    }
    // If already has fellow — no decay, skip.
  }

  return anyChange
}

// ----------------------------------------------------------------
// Upsert helper
// ----------------------------------------------------------------

async function upsertCredential(
  admin: SupabaseClient<Database>,
  userId: string,
  credentialType: CredentialType,
  status: 'active' | 'paused',
  existing: Map<CredentialType, string>
): Promise<boolean> {
  const currentStatus = existing.get(credentialType)

  if (currentStatus === status) return false // no change needed

  const now = new Date().toISOString()

  if (!existing.has(credentialType)) {
    // Insert new credential
    await admin.from('credentials').insert({
      user_id: userId,
      credential_type: credentialType,
      status,
      earned_at: now,
      updated_at: now,
    })
  } else {
    // Update existing credential status
    await admin
      .from('credentials')
      .update({ status, updated_at: now })
      .eq('user_id', userId)
      .eq('credential_type', credentialType)
  }

  return true
}
