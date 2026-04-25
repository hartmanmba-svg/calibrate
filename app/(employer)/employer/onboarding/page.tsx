import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreateEmployerForm } from './CreateEmployerForm'

export const dynamic = 'force-dynamic'

export default async function EmployerOnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/employer/onboarding')
  }

  const admin = createAdminClient()

  // If user already has an employer account, skip onboarding
  const { data: existing } = await admin
    .from('employers')
    .select('id')
    .eq('admin_user_id', user.id)
    .maybeSingle()

  if (existing) {
    redirect('/employer/dashboard')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl text-white">Create employer account</h1>
          <p className="font-body text-sm text-muted mt-2">
            Set up your organisation to start tracking your team&apos;s IONM readiness.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8">
          <CreateEmployerForm />
        </div>

      </div>
    </div>
  )
}
