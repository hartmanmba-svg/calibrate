'use client'

import { useState } from 'react'

type Plan = 'monthly' | 'annual' | 'lifetime'

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

  async function handleClick() {
    setLoading(true)
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

      if (!res.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {loading ? 'Loading…' : label}
    </button>
  )
}
