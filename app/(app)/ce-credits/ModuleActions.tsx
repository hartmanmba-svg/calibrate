'use client'

import { useState, useTransition } from 'react'
import { startModule, completeModule } from './actions'

interface Props {
  moduleId: string
  isStarted: boolean
  isCompleted: boolean
}

export function ModuleActions({ moduleId, isStarted, isCompleted }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  if (isCompleted) return null

  async function handleStart() {
    setError(null)
    start(async () => {
      const result = await startModule(moduleId)
      if (result.error) setError(result.error)
    })
  }

  async function handleComplete() {
    setError(null)
    start(async () => {
      const result = await completeModule(moduleId)
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {!isStarted && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleStart}
          className="font-body text-xs px-4 py-1.5 rounded-lg border border-teal/30 text-teal
                     hover:bg-teal/10 disabled:opacity-50 transition"
        >
          {isPending ? 'Saving…' : 'Start module'}
        </button>
      )}
      {isStarted && !isCompleted && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleComplete}
          className="font-body text-xs px-4 py-1.5 rounded-lg border border-orange/30 text-orange
                     hover:bg-orange/10 disabled:opacity-50 transition"
        >
          {isPending ? 'Saving…' : 'Mark as complete'}
        </button>
      )}
      {error && <p className="font-body text-xs text-red">{error}</p>}
    </div>
  )
}
