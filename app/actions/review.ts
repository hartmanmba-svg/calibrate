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
import { BADGE_DEFINITIONS } from '@/lib/badges'
import { checkCredentials } from '@/app/actions/credentials'
import type { BadgeKey } from '@/lib/badges'
import type { Json } from '@/lib/supabase/types'

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
  earnedBadges: string[]
  completedMissions: string[]
  credentialsUpdated: boolean
}

export type ReviewContext = {
  totalReviews: number
  currentStreak: number
  consecutiveGotIt: number
  sessionCardCount: number
  reviewHour: number
  spinalScore: number | null
  orReadiness: number | null
  rating: 1 | 2 | 3
}

// ----------------------------------------------------------------
// Daily missions types
// ----------------------------------------------------------------

type Mission = {
  key: string
  completed: boolean
  xp_reward: number
}

export type DailyMissions = {
  date: string
  missions: Mission[]
}

const DEFAULT_MISSIONS: Mission[] = [
  { key: 'review_20', completed: false, xp_reward: 30 },
  { key: 'drill_80', completed: false, xp_reward: 50 },
  { key: 'maintain_streak', completed: false, xp_reward: 10 },
]

// ----------------------------------------------------------------
// Badge checking
// ----------------------------------------------------------------

async function checkAndAwardBadges(
  userId: string,
  context: ReviewContext
): Promise<string[]> {
  const admin = createAdminClient()

  // Fetch existing badge keys for this user
  const { data: existingRows } = await admin
    .from('badges')
    .select('badge_key')
    .eq('user_id', userId)

  const existingKeys = new Set((existingRows ?? []).map((r) => r.badge_key))

  const newBadges: { user_id: string; badge_key: BadgeKey }[] = []

  for (const def of BADGE_DEFINITIONS) {
    if (existingKeys.has(def.key)) continue

    let earned = false
    switch (def.key) {
      case 'first_review':
        earned = context.totalReviews >= 1
        break
      case 'streak_7':
        earned = context.currentStreak >= 7
        break
      case 'streak_30':
        earned = context.currentStreak >= 30
        break
      case 'speed_run':
        earned = context.sessionCardCount >= 20
        break
      case 'sharp_eye':
        earned = context.consecutiveGotIt >= 10
        break
      case 'night_owl':
        earned = context.reviewHour >= 22
        break
      case 'early_bird':
        earned = context.reviewHour < 7
        break
      case 'spinal_specialist':
        earned = context.spinalScore !== null && context.spinalScore > 80
        break
      case 'centurion':
        earned = context.totalReviews >= 100
        break
      case 'cnim_ready':
        earned = context.orReadiness !== null && context.orReadiness > 75
        break
    }

    if (earned) {
      newBadges.push({ user_id: userId, badge_key: def.key })
    }
  }

  if (newBadges.length > 0) {
    await admin.from('badges').insert(newBadges)
  }

  return newBadges.map((b) => b.badge_key)
}

// ----------------------------------------------------------------
// Daily missions
// ----------------------------------------------------------------

async function checkDailyMissions(
  userId: string,
  context: { todayDate: string; reviewCount: number; streak: number }
): Promise<string[]> {
  const admin = createAdminClient()

  const { data: profileRow } = await admin
    .from('profiles')
    .select('daily_missions, xp')
    .eq('id', userId)
    .single()

  if (!profileRow) return []

  // Parse or reset missions
  let dm: DailyMissions | null = null
  const raw = profileRow.daily_missions as DailyMissions | null

  if (raw && raw.date === context.todayDate) {
    dm = raw
  } else {
    dm = { date: context.todayDate, missions: DEFAULT_MISSIONS.map((m) => ({ ...m })) }
  }

  const completedKeys: string[] = []
  let xpBonus = 0

  const updatedMissions = dm.missions.map((mission) => {
    if (mission.completed) return mission

    let nowComplete = false
    if (mission.key === 'review_20' && context.reviewCount >= 20) nowComplete = true
    if (mission.key === 'maintain_streak' && context.streak >= 1) nowComplete = true
    // drill_80 is not auto-completable from processReview (requires a separate drill score)

    if (nowComplete) {
      completedKeys.push(mission.key)
      xpBonus += mission.xp_reward
      return { ...mission, completed: true }
    }
    return mission
  })

  dm.missions = updatedMissions

  const updatePayload: { daily_missions: Json; xp?: number } = {
    daily_missions: dm as unknown as Json,
  }

  if (xpBonus > 0) {
    updatePayload.xp = (profileRow.xp ?? 0) + xpBonus
  }

  await admin.from('profiles').update(updatePayload).eq('id', userId)

  return completedKeys
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

  // ── Profile: XP + streak + consecutive_got_it ────────────────

  const { data: profile } = await admin
    .from('profiles')
    .select('xp, level, streak, streak_shield, last_review_date, consecutive_got_it')
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

  // Track consecutive Got it
  const prevConsecutive = profile.consecutive_got_it ?? 0
  const newConsecutive = calibrateRating === 3 ? prevConsecutive + 1 : 0

  await admin
    .from('profiles')
    .update({
      xp: newXp,
      level: newLevel,
      streak: newStreak,
      streak_shield: newShield,
      last_review_date: today,
      consecutive_got_it: newConsecutive,
      updated_at: now.toISOString(),
    })
    .eq('id', user.id)

  // ── Fetch total review count ──────────────────────────────────
  const { count: totalReviews } = await admin
    .from('review_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // ── Fetch cached readiness scores for badge context ──────────
  const { data: scoreRows } = await admin
    .from('readiness_scores')
    .select('score_type, score')
    .eq('user_id', user.id)
    .in('score_type', ['or_readiness'])

  const orReadiness =
    scoreRows?.find((s) => s.score_type === 'or_readiness')?.score ?? null

  // ── Award badges ──────────────────────────────────────────────
  const earnedBadges = await checkAndAwardBadges(user.id, {
    totalReviews: totalReviews ?? 0,
    currentStreak: newStreak,
    consecutiveGotIt: newConsecutive,
    sessionCardCount: 1, // single-review context; session tracking is client-side
    reviewHour: now.getHours(),
    spinalScore: null, // expensive to compute on every review; null is safe
    orReadiness,
    rating: calibrateRating,
  })

  // ── Daily missions ────────────────────────────────────────────
  const completedMissions = await checkDailyMissions(user.id, {
    todayDate: today,
    reviewCount: totalReviews ?? 0,
    streak: newStreak,
  })

  // ── Credentials ───────────────────────────────────────────────
  let credentialsUpdated = false
  try {
    credentialsUpdated = await checkCredentials(user.id)
  } catch {
    // Non-fatal — credential check failure should not break review flow
  }

  return {
    xpEarned,
    newLevel,
    oldLevel: profile.level,
    newStreak,
    scheduledDays: next.scheduled_days,
    dueAt: next.due.toISOString(),
    earnedBadges,
    completedMissions,
    credentialsUpdated,
  }
}
