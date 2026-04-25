import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { JoinButton } from './JoinButton'

export const dynamic = 'force-dynamic'

interface Props {
  params: { employerId: string }
}

export default async function JoinPage({ params }: Props) {
  const { employerId } = params

  const admin = createAdminClient()

  // Look up the employer first (unauthenticated — public invite link)
  const { data: employer } = await admin
    .from('employers')
    .select('id, name')
    .eq('id', employerId)
    .maybeSingle()

  if (!employer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="font-heading text-2xl text-white">Organisation not found</p>
        <p className="font-body text-sm text-muted">
          This invite link is invalid or has expired.
        </p>
        <a href="/dashboard" className="font-body text-sm text-orange hover:underline">
          Go to dashboard
        </a>
      </div>
    )
  }

  // Check auth
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/join/${employerId}`)
  }

  // Fetch the practitioner's current profile to check employer_id
  const { data: profile } = await admin
    .from('profiles')
    .select('employer_id')
    .eq('id', user.id)
    .maybeSingle()

  const alreadyHasEmployer = profile?.employer_id !== null && profile?.employer_id !== undefined

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 space-y-6 text-center">

          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-teal/10 border border-teal/20 flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>

          {/* Heading */}
          <div>
            <h1 className="font-heading text-2xl text-white">
              Join {employer.name}&apos;s team on Calibrate
            </h1>
            <p className="font-body text-sm text-muted mt-2">
              Your readiness scores will be visible to your employer&apos;s account administrator.
              You can leave the team at any time from your profile settings.
            </p>
          </div>

          {alreadyHasEmployer ? (
            <div className="bg-red/10 border border-red/25 rounded-xl px-5 py-4 text-left">
              <p className="font-body text-sm text-red font-semibold">Already on a team</p>
              <p className="font-body text-xs text-muted mt-1">
                You are already part of a team. Leave your current team to join a new one.
              </p>
            </div>
          ) : (
            <JoinButton employerId={employer.id} />
          )}

        </div>

      </div>
    </div>
  )
}
