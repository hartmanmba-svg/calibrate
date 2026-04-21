'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    // Email confirmation disabled → session exists → go straight to onboarding
    if (authData.session) {
      router.push('/onboarding')
      return
    }

    // Email confirmation enabled → ask user to check their inbox
    setCheckEmail(true)
  }

  if (checkEmail) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">✉️</div>
        <h2 className="font-heading text-2xl text-white">Check your email</h2>
        <p className="font-body text-muted text-sm leading-relaxed">
          We sent a confirmation link to your inbox. Click it to activate your account and continue to onboarding.
        </p>
        <Link href="/login" className="block text-teal text-sm font-body hover:underline mt-4">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="font-heading text-2xl text-white mb-1">Create your account</h1>
      <p className="font-body text-muted text-sm mb-8">Start sharpening your clinical edge.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {/* Email */}
        <div>
          <label className="block font-body text-sm text-muted mb-1.5" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`w-full bg-dark border rounded-lg px-4 py-3 text-white font-body text-sm placeholder-muted
              focus:outline-none focus:ring-2 focus:ring-teal transition
              ${errors.email ? 'border-red' : 'border-[rgba(255,255,255,0.10)]'}`}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red font-body">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block font-body text-sm text-muted mb-1.5" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className={`w-full bg-dark border rounded-lg px-4 py-3 text-white font-body text-sm placeholder-muted
              focus:outline-none focus:ring-2 focus:ring-teal transition
              ${errors.password ? 'border-red' : 'border-[rgba(255,255,255,0.10)]'}`}
            placeholder="Minimum 8 characters"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red font-body">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block font-body text-sm text-muted mb-1.5" htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={`w-full bg-dark border rounded-lg px-4 py-3 text-white font-body text-sm placeholder-muted
              focus:outline-none focus:ring-2 focus:ring-teal transition
              ${errors.confirmPassword ? 'border-red' : 'border-[rgba(255,255,255,0.10)]'}`}
            placeholder="Re-enter your password"
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red font-body">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Server error */}
        {serverError && (
          <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3">
            <p className="text-red text-sm font-body">{serverError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange hover:bg-orange/90 disabled:opacity-60 disabled:cursor-not-allowed
            text-white font-heading text-base rounded-lg py-3 transition"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-muted text-sm font-body mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-teal hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
