'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { processReview } from '@/app/actions/review'
import {
  enqueueReview,
  getAllQueuedReviews,
  clearQueuedReview,
} from '@/lib/idb'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

export type SessionCard = {
  cardId: string
  front: string
  back: string
  explanation: string | null
  tags: string[]
  difficulty: number
  isNew: boolean
  intervalLabels: { again: string; hard: string; good: string }
}

type XpToast = { id: number; xp: number; leveledUp: boolean }

type RatingResult = { rating: 1 | 2 | 3; xpEarned: number }

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const RATING_CONFIG = [
  {
    rating: 1 as const,
    label: 'Missed it',
    intervalKey: 'again' as const,
    classes: 'bg-red/15 border-red/40 hover:bg-red/25 text-red',
  },
  {
    rating: 2 as const,
    label: 'Almost',
    intervalKey: 'hard' as const,
    classes: 'bg-gold/10 border-gold/40 hover:bg-gold/20 text-gold',
  },
  {
    rating: 3 as const,
    label: 'Got it',
    intervalKey: 'good' as const,
    classes: 'bg-green/15 border-green/40 hover:bg-green/25 text-green',
  },
]

const XP_OPTIMISTIC: Record<1 | 2 | 3, number> = { 1: 5, 2: 10, 3: 15 }

// ----------------------------------------------------------------
// Empty state
// ----------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <span className="text-6xl">🎉</span>
      <h2 className="font-heading text-2xl text-white">All caught up!</h2>
      <p className="font-body text-muted text-sm max-w-xs">
        No cards are due right now. Come back later or try a different study mode.
      </p>
      <Link
        href="/dashboard"
        className="mt-4 bg-orange hover:bg-orange/90 text-white font-heading px-6 py-3 rounded-xl transition"
      >
        Back to dashboard
      </Link>
    </div>
  )
}

// ----------------------------------------------------------------
// Completion screen
// ----------------------------------------------------------------

function CompletionScreen({
  results,
  totalXp,
  hadOfflineReviews,
}: {
  results: RatingResult[]
  totalXp: number
  hadOfflineReviews: boolean
}) {
  const counts = { 1: 0, 2: 0, 3: 0 }
  results.forEach((r) => counts[r.rating]++)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center gap-6 max-w-sm mx-auto"
    >
      <span className="text-6xl">🔥</span>
      <div>
        <h2 className="font-heading text-3xl text-white">Session complete!</h2>
        <p className="font-body text-muted text-sm mt-1">
          {results.length} card{results.length !== 1 ? 's' : ''} reviewed
        </p>
      </div>

      {hadOfflineReviews && (
        <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 w-full text-left">
          <p className="font-body text-xs text-gold">
            Some reviews were saved offline and will sync when you reconnect.
          </p>
        </div>
      )}

      {/* XP earned */}
      <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl px-8 py-5 w-full">
        <p className="font-heading text-4xl text-orange">+{totalXp} XP</p>
        <p className="font-body text-muted text-xs mt-1">earned this session</p>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {([
          { label: 'Missed it', key: 1, color: 'text-red' },
          { label: 'Almost', key: 2, color: 'text-gold' },
          { label: 'Got it', key: 3, color: 'text-green' },
        ] as const).map(({ label, key, color }) => (
          <div key={key} className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-xl py-3">
            <p className={`font-heading text-2xl ${color}`}>{counts[key]}</p>
            <p className="font-body text-muted text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        <Link
          href="/dashboard"
          className="flex-1 bg-navy border border-[rgba(255,255,255,0.10)] hover:border-white/20
            text-white font-heading py-3 rounded-xl transition text-center"
        >
          Dashboard
        </Link>
        <Link
          href="/study/flashcards"
          className="flex-1 bg-orange hover:bg-orange/90 text-white font-heading py-3 rounded-xl transition text-center"
        >
          Study more
        </Link>
      </div>
    </motion.div>
  )
}

// ----------------------------------------------------------------
// Main component
// ----------------------------------------------------------------

export function FlashcardSession({
  cards,
  studyAhead,
}: {
  cards: SessionCard[]
  studyAhead: boolean
  dueCount: number
}) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<'question' | 'answer'>('question')
  const [toasts, setToasts] = useState<XpToast[]>([])
  const [results, setResults] = useState<RatingResult[]>([])
  const [totalXp, setTotalXp] = useState(0)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isOffline, setIsOffline] = useState(false)
  const [hadOfflineReviews, setHadOfflineReviews] = useState(false)

  // ── Offline queue drain ──────────────────────────────────────
  const drainOfflineQueue = useCallback(async () => {
    try {
      const queued = await getAllQueuedReviews()
      if (queued.length === 0) return
      for (const review of queued) {
        if (!navigator.onLine) break
        try {
          await processReview(review.card_id, review.rating, review.nonce)
          await clearQueuedReview(review.id!)
        } catch {
          break
        }
      }
    } catch {
      // IDB unavailable (e.g. private browsing) — silently skip
    }
  }, [])

  // ── Online/offline listeners ─────────────────────────────────
  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const handleOnline = () => {
      setIsOffline(false)
      void drainOfflineQueue()
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Drain any reviews queued from a previous offline session
    if (navigator.onLine) void drainOfflineQueue()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [drainOfflineQueue])

  // ── Helpers ──────────────────────────────────────────────────
  function showToast(xp: number, leveledUp: boolean) {
    const toastId = Date.now()
    setToasts((prev) => [...prev, { id: toastId, xp, leveledUp }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 2000)
  }

  function advance() {
    if (index + 1 >= cards.length) {
      setDone(true)
    } else {
      setIndex(index + 1)
      setPhase('question')
    }
  }

  function recordOfflineRate(rating: 1 | 2 | 3, nonce: string, cardId: string) {
    setHadOfflineReviews(true)
    void enqueueReview({
      card_id: cardId,
      rating,
      reviewed_at: new Date().toISOString(),
      nonce,
    }).catch(() => {
      // IDB unavailable — review is lost but UI still advances
    })
    const xp = XP_OPTIMISTIC[rating]
    showToast(xp, false)
    setResults((prev) => [...prev, { rating, xpEarned: xp }])
    setTotalXp((prev) => prev + xp)
    advance()
  }

  if (cards.length === 0) return <EmptyState />
  if (done) return <CompletionScreen results={results} totalXp={totalXp} hadOfflineReviews={hadOfflineReviews} />

  const card = cards[index]
  const progress = Math.round((index / cards.length) * 100)

  function handleReveal() {
    setPhase('answer')
  }

  function handleRate(rating: 1 | 2 | 3) {
    if (isPending) return

    const nonce = crypto.randomUUID()

    // Offline path: skip the network call, queue for later sync
    if (!navigator.onLine) {
      recordOfflineRate(rating, nonce, card.cardId)
      return
    }

    startTransition(async () => {
      try {
        const result = await processReview(card.cardId, rating, nonce)
        showToast(result.xpEarned, result.newLevel > result.oldLevel)
        setResults((prev) => [...prev, { rating, xpEarned: result.xpEarned }])
        setTotalXp((prev) => prev + result.xpEarned)
        advance()
      } catch {
        // Network dropped mid-request: queue and advance
        if (!navigator.onLine) {
          recordOfflineRate(rating, nonce, card.cardId)
        } else {
          // Non-network server error: advance without XP to avoid blocking the session
          advance()
        }
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">

      {/* ── Offline banner ── */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-2.5 flex items-center gap-2"
          >
            <span className="text-gold text-sm">📶</span>
            <p className="font-body text-xs text-gold">
              Offline — reviews are saving locally and will sync when you reconnect.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header: progress + metadata ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {studyAhead && (
            <span className="font-body text-xs text-gold bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full">
              Study ahead
            </span>
          )}
          <span className="font-body text-xs text-muted">
            {index + 1} / {cards.length}
          </span>
        </div>
        <Link href="/dashboard" className="font-body text-xs text-muted hover:text-white transition">
          ✕ Exit
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-dark rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-teal rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* ── Card ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          className="bg-navy rounded-2xl border border-[rgba(255,255,255,0.10)] overflow-hidden"
        >
          {/* Tags + new badge */}
          <div className="flex gap-2 px-6 pt-5 pb-0 flex-wrap">
            {card.tags.map((tag) => (
              <span key={tag} className="font-body text-[11px] text-teal bg-teal/10 border border-teal/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {tag}
              </span>
            ))}
            {card.isNew && (
              <span className="font-body text-[11px] text-orange bg-orange/10 border border-orange/20 px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>

          {/* Question */}
          <div className="px-6 pt-6 pb-8">
            <p className="font-body text-sm text-muted uppercase tracking-widest mb-3">Question</p>
            <p className="font-heading text-xl text-white leading-snug">{card.front}</p>
          </div>

          {/* Answer section */}
          <AnimatePresence>
            {phase === 'answer' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.25 }}
              >
                <div className="border-t border-[rgba(255,255,255,0.10)] mx-6" />
                <div className="px-6 py-6">
                  <p className="font-body text-sm text-muted uppercase tracking-widest mb-3">Answer</p>
                  <p className="font-heading text-xl text-teal leading-snug">{card.back}</p>

                  {card.explanation && (
                    <p className="font-body text-sm text-muted mt-4 leading-relaxed">
                      {card.explanation}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* ── Action area ── */}
      {phase === 'question' ? (
        <button
          onClick={handleReveal}
          className="w-full bg-orange hover:bg-orange/90 text-white font-heading text-lg
            rounded-xl py-4 transition"
        >
          Reveal answer
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {RATING_CONFIG.map(({ rating, label, intervalKey, classes }) => (
            <button
              key={rating}
              onClick={() => handleRate(rating)}
              disabled={isPending}
              className={`flex flex-col items-center gap-1.5 border rounded-xl py-4 px-2
                transition disabled:opacity-50 disabled:cursor-not-allowed ${classes}`}
            >
              <span className="font-heading text-base">{label}</span>
              <span className="font-body text-xs opacity-70">
                {card.intervalLabels[intervalKey]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── XP Toasts ── */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-2 pointer-events-none z-50">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              className="bg-navy border border-orange/30 rounded-xl px-4 py-2.5 shadow-lg"
            >
              <p className="font-heading text-orange text-sm">+{toast.xp} XP</p>
              {toast.leveledUp && (
                <p className="font-body text-xs text-gold mt-0.5">Level up! 🎉</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
