'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  FSRS,
  generatorParameters,
  createEmptyCard,
  Rating,
  State,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs'
import { totalXpForLevel } from '@/lib/xp'

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const RATING_MAP: Record<1 | 2 | 3, Grade> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
}

const STRING_TO_STATE: Record<string, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
}

const STATE_TO_STRING: Record<number, string> = {
  [State.New]: 'new',
  [State.Learning]: 'learning',
  [State.Review]: 'review',
  [State.Relearning]: 'relearning',
}

const XP_BASE: Record<1 | 2 | 3, number> = { 1: 5, 2: 10, 3: 15 }

function streakMultiplier(streak: number): number {
  if (streak >= 30) return 2
  if (streak >= 15) return 1.5
  if (streak >= 8) return 1.2
  return 1
}

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export type ProcessReviewResult = {
  xpEarned: number
  newLevel: number
  oldLevel: number
  newStreak: number
  scheduledDays: number
  dueAt: string
}

// ----------------------------------------------------------------
// Action
// ----------------------------------------------------------------

export async function processReview(
  cardId: string,
  calibrateRating: 1 | 2 | 3
): Promise<ProcessReviewResult> {
  const supabase = createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const f = new FSRS(generatorParameters())
  const now = new Date()

  // Fetch existing FSRS state for this card (null = brand new card)
  const { data: existing } = await admin
    .from('card_reviews')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_id', cardId)
    .maybeSingle()

  const fsrsCard: FsrsCard = existing
    ? {
        due: new Date(existing.due),
        stability: existing.stability,
        difficulty: existing.difficulty,
        elapsed_days: existing.elapsed_days,
        scheduled_days: existing.scheduled_days,
        reps: existing.reps,
        lapses: existing.lapses,
        learning_steps: 0,
        state: STRING_TO_STATE[existing.state] ?? State.New,
        last_review: existing.last_review
          ? new Date(existing.last_review)
          : undefined,
      }
    : createEmptyCard(now)

  // Run FSRS
  const scheduling = f.repeat(fsrsCard, now)
  const { card: next, log } = scheduling[RATING_MAP[calibrateRating]]
  const nextState = (STATE_TO_STRING[next.state] ?? 'learning') as 'new' | 'learning' | 'review' | 'relearning'

  // Upsert card_reviews
  await admin.from('card_reviews').upsert(
    {
      user_id: user.id,
      card_id: cardId,
      due: next.due.toISOString(),
      stability: next.stability,
      difficulty: next.difficulty,
      elapsed_days: next.elapsed_days,
      scheduled_days: next.scheduled_days,
      reps: next.reps,
      lapses: next.lapses,
      state: nextState,
      last_review: now.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: 'user_id,card_id' }
  )

  // Append to review_log (insert-only table)
  await admin.from('review_log').insert({
    user_id: user.id,
    card_id: cardId,
    rating: calibrateRating,
    fsrs_state: nextState,
    scheduled_days: next.scheduled_days,
    elapsed_days: log.elapsed_days,
    reviewed_at: now.toISOString(),
  })

  // ── Profile: XP + streak ──────────────────────────────────────

  const { data: profile } = await admin
    .from('profiles')
    .select('xp, level, streak, streak_shield, last_review_date')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const today = now.toISOString().slice(0, 10)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  let newStreak = profile.streak
  let newShield = profile.streak_shield

  if (profile.last_review_date !== today) {
    if (!profile.last_review_date || profile.last_review_date === yesterdayStr) {
      // First review ever, or reviewed yesterday — extend streak
      newStreak = profile.streak + 1
    } else {
      // Missed at least one day
      if (profile.streak_shield) {
        // Shield absorbs the missed day
        newStreak = profile.streak
        newShield = false
      } else {
        // No shield — reset
        newStreak = 1
      }
    }
  }

  const multiplier = streakMultiplier(newStreak)
  const xpEarned = Math.round(XP_BASE[calibrateRating] * multiplier)
  const newXp = profile.xp + xpEarned

  // Recompute level from total XP
  let newLevel = profile.level
  while (newXp >= totalXpForLevel(newLevel + 1)) {
    newLevel++
  }

  await admin
    .from('profiles')
    .update({
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      streak_shield: newShield,
      last_review_date: today,
      updated_at: now.toISOString(),
    })
    .eq('id', user.id)

  return {
    xpEarned,
    newLevel,
    oldLevel: profile.level,
    newStreak,
    scheduledDays: next.scheduled_days,
    dueAt: next.due.toISOString(),
  }
}
