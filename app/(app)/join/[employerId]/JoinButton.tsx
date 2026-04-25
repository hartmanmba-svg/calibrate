'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinEmployer } from './actions'

interface Props {
  employerId: string
}

export function JoinButton({ employerId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setLoading(true)
    setError(null)

    const result = await joinEmployer(employerId)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="font-body text-sm text-red">{error}</p>
      )}
      <button
        type="button"
        onClick={handleJoin}
        disabled={loading}
        className="w-full bg-orange hover:bg-orange/90 disabled:opacity-50 text-white font-heading text-sm px-6 py-3 rounded-lg transition"
      >
        {loading ? 'Joining…' : 'Confirm and join'}
      </button>
    </div>
  )
}
