'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEmployer } from './actions'

const SEAT_OPTIONS = [1, 5, 10, 25, 50]

export function CreateEmployerForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createEmployer(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/employer/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company name */}
      <div>
        <label
          htmlFor="name"
          className="block font-heading text-sm text-teal uppercase tracking-wide mb-2"
        >
          Company name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Neurovance IONM"
          className="w-full bg-[#1A252F] border border-[rgba(255,255,255,0.15)] rounded-lg px-4 py-3 font-body text-sm text-white placeholder:text-muted focus:outline-none focus:border-orange transition"
        />
      </div>

      {/* Seat count */}
      <div>
        <label
          htmlFor="seat_count"
          className="block font-heading text-sm text-teal uppercase tracking-wide mb-2"
        >
          Number of seats
        </label>
        <select
          id="seat_count"
          name="seat_count"
          defaultValue={5}
          className="w-full bg-[#1A252F] border border-[rgba(255,255,255,0.15)] rounded-lg px-4 py-3 font-body text-sm text-white focus:outline-none focus:border-orange transition"
        >
          {SEAT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'seat' : 'seats'}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <p className="font-body text-sm text-red">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange hover:bg-orange/90 disabled:opacity-50 text-white font-heading text-sm px-6 py-3 rounded-lg transition"
      >
        {loading ? 'Creating…' : 'Create employer account'}
      </button>
    </form>
  )
}
