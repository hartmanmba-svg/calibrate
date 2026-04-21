'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/dashboard'
  const supabase = createClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setServerError('Invalid email or password.')
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <>
      <h1 className="font-heading text-2xl text-white mb-1">Welcome back</h1>
      <p className="font-body text-muted text-sm mb-8">Sign in to continue your practice.</p>

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
          <div className="flex justify-between items-center mb-1.5">
            <label className="font-body text-sm text-muted" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-teal font-body hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className={`w-full bg-dark border rounded-lg px-4 py-3 text-white font-body text-sm placeholder-muted
              focus:outline-none focus:ring-2 focus:ring-teal transition
              ${errors.password ? 'border-red' : 'border-[rgba(255,255,255,0.10)]'}`}
            placeholder="Your password"
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-red font-body">{errors.password.message}</p>
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
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-muted text-sm font-body mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-teal hover:underline">
          Create one
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
