'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { CareerStage } from '@/lib/supabase/types'

const STAGES: {
  value: CareerStage
  label: string
  description: string
  icon: string
}[] = [
  {
    value: 'student',
    label: 'Student',
    description: 'Learning IONM fundamentals for the first time',
    icon: '📖',
  },
  {
    value: 'candidate',
    label: 'CNIM Candidate',
    description: 'Actively preparing to sit the CNIM exam',
    icon: '🎯',
  },
  {
    value: 'certified',
    label: 'Certified (CNIM)',
    description: 'Board-certified and practicing independently',
    icon: '✅',
  },
  {
    value: 'supervisor',
    label: 'Supervisor',
    description: 'Leading and supervising IONM teams in the OR',
    icon: '🏆',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [selected, setSelected] = useState<CareerStage | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinue() {
    if (!selected) return
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ career_stage: selected })
      .eq('id', user.id)

    if (updateError) {
      setError('Something went wrong. Please try again.')
      setSaving(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <>
      <h1 className="font-heading text-2xl text-white mb-1">Where are you in your career?</h1>
      <p className="font-body text-muted text-sm mb-8">
        This helps Calibrate tailor your study plan and benchmarks.
      </p>

      <div className="space-y-3 mb-8">
        {STAGES.map((stage) => {
          const isSelected = selected === stage.value
          return (
            <button
              key={stage.value}
              type="button"
              onClick={() => setSelected(stage.value)}
              className={`w-full flex items-center gap-4 rounded-xl px-5 py-4 border text-left transition
                ${isSelected
                  ? 'border-orange bg-orange/10'
                  : 'border-[rgba(255,255,255,0.10)] bg-dark hover:border-[rgba(255,255,255,0.25)]'
                }`}
            >
              {/* Selection indicator */}
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition
                  ${isSelected ? 'border-orange' : 'border-muted'}`}
              >
                {isSelected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-orange block" />
                )}
              </span>

              {/* Icon + text */}
              <span className="text-2xl">{stage.icon}</span>
              <span className="flex flex-col">
                <span className="font-heading text-white text-base">{stage.label}</span>
                <span className="font-body text-muted text-xs mt-0.5">{stage.description}</span>
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3 mb-4">
          <p className="text-red text-sm font-body">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={!selected || saving}
        className="w-full bg-orange hover:bg-orange/90 disabled:opacity-40 disabled:cursor-not-allowed
          text-white font-heading text-base rounded-lg py-3 transition"
      >
        {saving ? 'Saving…' : 'Continue to dashboard'}
      </button>
    </>
  )
}
