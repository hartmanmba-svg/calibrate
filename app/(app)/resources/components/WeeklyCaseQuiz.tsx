'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitWeeklyCaseAnswer } from '@/app/actions/weekly-case'
import type { WeeklyCase } from '@/lib/weekly-case'

export type PriorAnswer = {
  selectedIndex: number
  isCorrect: boolean
  xpEarned: number
}

type XpToast = { xp: number; leveledUp: boolean }

export function WeeklyCaseQuiz({
  weeklyCase,
  priorAnswer,
}: {
  weeklyCase: WeeklyCase
  priorAnswer?: PriorAnswer
}) {
  const [selected, setSelected]     = useState<number | null>(priorAnswer?.selectedIndex ?? null)
  const [submitted, setSubmitted]   = useState(!!priorAnswer)
  const [toast, setToast]           = useState<XpToast | null>(null)
  const [isPending, startTransition] = useTransition()

  const isCorrect = selected === weeklyCase.correctIndex

  function handleSelect(idx: number) {
    if (submitted) return
    setSelected(idx)
  }

  function handleSubmit() {
    if (selected === null || submitted || isPending) return

    startTransition(async () => {
      const result = await submitWeeklyCaseAnswer(
        weeklyCase.id,
        selected,
        selected === weeklyCase.correctIndex
      )
      setSubmitted(true)
      if (!result.alreadyAnswered && result.xpEarned > 0) {
        setToast({ xp: result.xpEarned, leveledUp: result.newLevel > result.oldLevel })
        setTimeout(() => setToast(null), 3000)
      }
    })
  }

  function optionStyle(idx: number): string {
    if (!submitted) {
      return selected === idx
        ? 'border-teal bg-teal/10 text-white'
        : 'border-[rgba(255,255,255,0.10)] bg-navy text-white hover:border-teal/50 hover:bg-teal/5'
    }
    if (idx === weeklyCase.correctIndex) return 'border-green bg-green/10 text-green'
    if (idx === selected && idx !== weeklyCase.correctIndex) return 'border-red bg-red/10 text-red'
    return 'border-[rgba(255,255,255,0.06)] bg-navy/50 text-muted'
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Scenario */}
      <div className="bg-dark/60 border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
        <p className="font-body text-xs text-teal uppercase tracking-widest mb-2">Clinical scenario</p>
        <p className="font-body text-sm text-white leading-relaxed">{weeklyCase.scenario}</p>
      </div>

      {/* Question */}
      <p className="font-body text-base text-white font-semibold leading-snug">
        {weeklyCase.question}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {weeklyCase.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={submitted}
            className={`w-full text-left rounded-xl border px-4 py-3 font-body text-sm transition
              ${optionStyle(idx)}
              ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <span className="font-heading text-xs mr-2 opacity-60">
              {String.fromCharCode(65 + idx)}.
            </span>
            {option}
          </button>
        ))}
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null || isPending}
          className={`self-start font-heading text-sm px-6 py-2.5 rounded-xl transition
            ${selected !== null && !isPending
              ? 'bg-orange text-white hover:bg-orange/90 cursor-pointer'
              : 'bg-[rgba(255,255,255,0.08)] text-muted cursor-not-allowed'
            }`}
        >
          {isPending ? 'Submitting…' : 'Submit answer'}
        </button>
      )}

      {/* Result + Explanation */}
      {submitted && (
        <div
          className={`rounded-xl border p-5 flex flex-col gap-3
            ${isCorrect ? 'border-green/30 bg-green/5' : 'border-red/30 bg-red/5'}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{isCorrect ? '✅' : '❌'}</span>
            <p className={`font-heading text-base ${isCorrect ? 'text-green' : 'text-red'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </p>
            {priorAnswer && (
              <span className="ml-auto font-body text-xs text-muted">answered previously</span>
            )}
          </div>
          <p className="font-body text-xs text-teal uppercase tracking-widest">Explanation</p>
          <p className="font-body text-sm text-white leading-relaxed">{weeklyCase.explanation}</p>
        </div>
      )}

      {/* XP toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="self-start bg-navy border border-orange/30 rounded-xl px-4 py-2.5"
          >
            <p className="font-heading text-orange text-sm">+{toast.xp} XP</p>
            {toast.leveledUp && (
              <p className="font-body text-xs text-gold mt-0.5">Level up! 🎉</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
