import { createClient } from '@/lib/supabase/server'
import {
  FSRS,
  generatorParameters,
  createEmptyCard,
  Rating,
  State,
  type Card as FsrsCard,
} from 'ts-fsrs'
import { FlashcardSession } from './FlashcardSession'
import { getSubscription } from '@/lib/subscription'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import type { SessionCard } from './FlashcardSession'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

const STRING_TO_STATE: Record<string, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
}

/** Format a future Date relative to now into a human-readable label. */
function formatDue(due: Date, now: Date): string {
  const diffMs = due.getTime() - now.getTime()
  const mins = Math.round(diffMs / 60_000)
  if (mins < 1) return '< 1 min'
  if (mins < 60) return `${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hr`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`
  const months = Math.round(days / 30.4)
  if (months < 12) return `${months} mo`
  return `${Math.round(days / 365)} yr`
}

function computeIntervalLabels(
  fsrsCard: FsrsCard,
  now: Date
): SessionCard['intervalLabels'] {
  const f = new FSRS(generatorParameters())
  const scheduling = f.repeat(fsrsCard, now)
  return {
    again: formatDue(scheduling[Rating.Again].card.due, now),
    hard: formatDue(scheduling[Rating.Hard].card.due, now),
    good: formatDue(scheduling[Rating.Good].card.due, now),
  }
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function FlashcardsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  // No redirect — middleware handles unauthenticated users.
  const uid = user?.id ?? ''

  // ── Free plan gate: 20-card limit ────────────────────────────
  const sub = await getSubscription(uid)
  if (sub.isFree) {
    const { count: reviewCount } = await supabase
      .from('card_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)

    const totalReviewed = reviewCount ?? 0
    if (totalReviewed >= 20) {
      return (
        <div className="flex flex-col items-center gap-6 py-16 max-w-md mx-auto text-center">
          <p className="font-body text-sm text-muted">
            You&apos;ve reviewed {totalReviewed} cards on the free plan.
          </p>
          <UpgradePrompt
            feature="Unlimited flashcards"
            description="You've reached the 20-card limit on the free plan. Upgrade to unlock all flashcards across every modality and case type."
          />
        </div>
      )
    }
  }

  const now = new Date()
  const SESSION_SIZE = 20

  // ── 1. Due cards (card_reviews joined to cards) ───────────────

  const { data: dueRows } = await supabase
    .from('card_reviews')
    .select(
      'card_id, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review, cards(id, front, back, explanation, modality, case_type, card_type)'
    )
    .eq('user_id', uid)
    .lte('due', now.toISOString())
    .order('due', { ascending: true })
    .limit(SESSION_SIZE)

  type DueRow = {
    card_id: string
    due: string
    stability: number
    difficulty: number
    elapsed_days: number
    scheduled_days: number
    reps: number
    lapses: number
    state: string
    last_review: string | null
    cards: {
      id: string
      front: string
      back: string
      explanation: string | null
      modality: string
      case_type: string
      card_type: string
    } | null
  }

  const dueCards: SessionCard[] = ((dueRows ?? []) as unknown as DueRow[])
    .filter((r) => r.cards !== null)
    .map((r) => {
      const fsrsCard: FsrsCard = {
        due: new Date(r.due),
        stability: r.stability,
        difficulty: r.difficulty,
        elapsed_days: r.elapsed_days,
        scheduled_days: r.scheduled_days,
        reps: r.reps,
        lapses: r.lapses,
        learning_steps: 0,
        state: STRING_TO_STATE[r.state] ?? State.New,
        last_review: r.last_review ? new Date(r.last_review) : undefined,
      }
      return {
        cardId: r.card_id,
        front: r.cards!.front,
        back: r.cards!.back,
        explanation: r.cards!.explanation,
        modality: r.cards!.modality,
        caseType: r.cards!.case_type,
        cardType: r.cards!.card_type,
        isNew: false,
        intervalLabels: computeIntervalLabels(fsrsCard, now),
      }
    })

  // ── 2. New cards (never reviewed) to fill out the session ─────

  const needed = SESSION_SIZE - dueCards.length
  let newCards: SessionCard[] = []

  if (needed > 0) {
    // IDs the user has already seen
    const { data: reviewedIds } = await supabase
      .from('card_reviews')
      .select('card_id')
      .eq('user_id', uid)

    const seen = (reviewedIds ?? []).map((r) => r.card_id)

    let query = supabase
      .from('cards')
      .select('id, front, back, explanation, modality, case_type, card_type')
      .limit(needed)

    if (seen.length > 0) {
      query = query.not('id', 'in', `(${seen.join(',')})`)
    }

    const { data: rawNew } = await query
    const emptyFsrs = createEmptyCard(now)
    const emptyIntervals = computeIntervalLabels(emptyFsrs, now)

    newCards = (rawNew ?? []).map((c) => ({
      cardId: c.id,
      front: c.front,
      back: c.back,
      explanation: c.explanation,
      modality: c.modality,
      caseType: c.case_type,
      cardType: c.card_type,
      isNew: true,
      intervalLabels: emptyIntervals,
    }))
  }

  const session: SessionCard[] = [...dueCards, ...newCards]

  // ── 3. Study-ahead fallback (nothing due, nothing new) ────────

  if (session.length === 0) {
    const { data: upcomingRows } = await supabase
      .from('card_reviews')
      .select(
        'card_id, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review, cards(id, front, back, explanation, modality, case_type, card_type)'
      )
      .eq('user_id', uid)
      .gt('due', now.toISOString())
      .order('due', { ascending: true })
      .limit(SESSION_SIZE)

    const upcomingDue = ((upcomingRows ?? []) as unknown as DueRow[])
      .filter((r) => r.cards !== null)
      .map((r) => {
        const fsrsCard: FsrsCard = {
          due: new Date(r.due),
          stability: r.stability,
          difficulty: r.difficulty,
          elapsed_days: r.elapsed_days,
          scheduled_days: r.scheduled_days,
          reps: r.reps,
          lapses: r.lapses,
          learning_steps: 0,
          state: STRING_TO_STATE[r.state] ?? State.New,
          last_review: r.last_review ? new Date(r.last_review) : undefined,
        }
        return {
          cardId: r.card_id,
          front: r.cards!.front,
          back: r.cards!.back,
          explanation: r.cards!.explanation,
          modality: r.cards!.modality,
          caseType: r.cards!.case_type,
          cardType: r.cards!.card_type,
          isNew: false,
          intervalLabels: computeIntervalLabels(fsrsCard, now),
        }
      })

    return (
      <FlashcardSession
        cards={upcomingDue}
        studyAhead={true}
        dueCount={0}
      />
    )
  }

  return (
    <FlashcardSession
      cards={session}
      studyAhead={false}
      dueCount={dueCards.length}
    />
  )
}
