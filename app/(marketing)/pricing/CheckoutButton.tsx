'use client'

import { useState } from 'react'

type Plan = 'monthly' | 'annual' | 'team'

export function CheckoutButton({
  plan,
  label,
  className,
}: {
  plan: Plan
  label: string
  className: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })

      if (res.status === 401) {
        window.location.href = '/signup'
        return
      }

      let data: { url?: string; error?: string } = {}
      try {
        data = await res.json()
      } catch {
        setError(`Server error ${res.status} — check Vercel logs`)
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`)
        setLoading(false)
        return
      }

      window.location.href = data.url!
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error — please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {loading ? 'Loading…' : label}
      </button>
      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  )
}
