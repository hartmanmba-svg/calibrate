'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from './actions'
import type { CareerStage } from '@/lib/supabase/types'

const CAREER_STAGES: { value: CareerStage; label: string }[] = [
  { value: 'student',    label: 'Student' },
  { value: 'candidate',  label: 'CNIM Candidate' },
  { value: 'certified',  label: 'Certified Practitioner' },
  { value: 'supervisor', label: 'Supervisory Neurophysiologist' },
]

interface Props {
  email: string
  fullName: string | null
  careerStage: CareerStage
}

export function ProfileForm({ email, fullName, careerStage }: Props) {
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [isPending, start]  = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(false)
    setError(null)
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const result = await updateProfile(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Email — read-only */}
      <div>
        <label className="block font-body text-sm text-muted mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full bg-dark border border-[rgba(255,255,255,0.10)] rounded-lg px-4 py-3
                     text-muted font-body text-sm cursor-not-allowed"
        />
      </div>

      {/* Full name */}
      <div>
        <label htmlFor="full_name" className="block font-body text-sm text-muted mb-1.5">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          defaultValue={fullName ?? ''}
          placeholder="Your full name"
          className="w-full bg-dark border border-[rgba(255,255,255,0.10)] rounded-lg px-4 py-3
                     text-white font-body text-sm placeholder-muted
                     focus:outline-none focus:ring-2 focus:ring-teal transition"
        />
      </div>

      {/* Career stage */}
      <div>
        <label htmlFor="career_stage" className="block font-body text-sm text-muted mb-1.5">
          Career stage
        </label>
        <select
          id="career_stage"
          name="career_stage"
          defaultValue={careerStage}
          className="w-full bg-dark border border-[rgba(255,255,255,0.10)] rounded-lg px-4 py-3
                     text-white font-body text-sm
                     focus:outline-none focus:ring-2 focus:ring-teal transition"
        >
          {CAREER_STAGES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Feedback */}
      {error && (
        <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3">
          <p className="text-red text-sm font-body">{error}</p>
        </div>
      )}
      {saved && (
        <div className="bg-green/10 border border-green/30 rounded-lg px-4 py-3">
          <p className="text-green text-sm font-body">Profile saved.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-orange hover:bg-orange/90 disabled:opacity-60 disabled:cursor-not-allowed
                   text-white font-heading text-base rounded-lg py-3 transition"
      >
        {isPending ? 'Saving…' : 'Save profile'}
      </button>

    </form>
  )
}
