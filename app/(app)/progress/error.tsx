'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function ProgressError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[progress] page error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <p className="font-heading text-xl text-white">Could not load progress data</p>
      <p className="font-body text-sm text-muted max-w-sm">
        There was a problem fetching your scores. Your study history is safe — this is a temporary display issue.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="font-body text-sm text-orange border border-orange/40 rounded-lg px-4 py-2 hover:bg-orange/10 transition"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="font-body text-sm text-muted border border-[rgba(255,255,255,0.12)] rounded-lg px-4 py-2 hover:text-white transition"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
