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
        emailRedirectTo: `https://calibrate-ashy.vercel.app/onboarding`,
      },
    })

   if (error) {
      setServerError(error.message)
      return
    }

    if (!authData.user) {
      setServerError('Signup failed. Please try again.')
      return
    }

    // Explicitly create profile, stats, and subscription
    // (database trigger is disabled on this Supabase tier)
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: '',
      })

    if (profileError) {
      setServerError(profileError.message)
      return
    }

    await supabase
      .from('user_stats')
      .insert({ user_id: authData.user.id })

    await supabase
      .from('subscriptions')
      .insert({
        user_id: authData.user.id,
        plan: 'free',
        status: 'active',
      })

    // Session exists → go straight to onboarding
    if (authData.session) {
      router.push('/onboarding')
      return
    }

    // No session → email confirmation required
    setCheckEmail(true)
  }
