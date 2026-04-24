'use client'

import { useState, useTransition } from 'react'
import { updateShareSettings } from './actions'

interface Props {
  showName: boolean
  showScores: boolean
  showCredentials: boolean
  showBadges: boolean
}

interface ToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.06)] last:border-0">
      <div>
        <p className="font-body text-sm text-white">{label}</p>
        <p className="font-body text-xs text-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-1
          focus:ring-offset-dark
          ${checked ? 'bg-teal' : 'bg-[rgba(255,255,255,0.15)]'}`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

export function ProfilePrivacyForm({
  showName,
  showScores,
  showCredentials,
  showBadges,
}: Props) {
  const [values, setValues] = useState({
    show_name:        showName,
    show_scores:      showScores,
    show_credentials: showCredentials,
    show_badges:      showBadges,
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  function set(key: keyof typeof values, val: boolean) {
    setValues((prev) => ({ ...prev, [key]: val }))
    setSaved(false)
  }

  function handleSave() {
    setSaved(false)
    setError(null)
    const fd = new FormData()
    fd.append('show_name',        String(values.show_name))
    fd.append('show_scores',      String(values.show_scores))
    fd.append('show_credentials', String(values.show_credentials))
    fd.append('show_badges',      String(values.show_badges))
    start(async () => {
      const result = await updateShareSettings(fd)
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <Toggle
          label="Show name"
          description="Display your full name on the public profile"
          checked={values.show_name}
          onChange={(v) => set('show_name', v)}
        />
        <Toggle
          label="Show scores"
          description="Display your OR Readiness score"
          checked={values.show_scores}
          onChange={(v) => set('show_scores', v)}
        />
        <Toggle
          label="Show credentials"
          description="Display your earned credentials (Trainer, Educator, Fellow)"
          checked={values.show_credentials}
          onChange={(v) => set('show_credentials', v)}
        />
        <Toggle
          label="Show badges"
          description="Display your earned achievement badges"
          checked={values.show_badges}
          onChange={(v) => set('show_badges', v)}
        />
      </div>

      {error && (
        <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3">
          <p className="text-red text-sm font-body">{error}</p>
        </div>
      )}
      {saved && (
        <div className="bg-green/10 border border-green/30 rounded-lg px-4 py-3">
          <p className="text-green text-sm font-body">Privacy settings saved.</p>
        </div>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="w-full bg-orange hover:bg-orange/90 disabled:opacity-60 disabled:cursor-not-allowed
                   text-white font-heading text-base rounded-lg py-3 transition"
      >
        {isPending ? 'Saving…' : 'Save privacy settings'}
      </button>
    </div>
  )
}
