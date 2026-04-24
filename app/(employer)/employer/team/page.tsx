import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CareerStage } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  student:    'Student',
  candidate:  'CNIM Candidate',
  certified:  'Certified Practitioner',
  supervisor: 'Supervisory Neurophysiologist',
}

export default async function TeamPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? ''

  const admin = createAdminClient()

  // Verify employer
  const { data: employer } = await admin
    .from('employers')
    .select('id, name')
    .eq('admin_user_id', uid)
    .maybeSingle()

  if (!employer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="font-heading text-2xl text-white">Not an employer account</p>
        <a href="/employer/dashboard" className="font-body text-sm text-orange hover:underline">
          Back to dashboard
        </a>
      </div>
    )
  }

  // Fetch staff profiles
  const { data: staffProfiles } = await admin
    .from('profiles')
    .select('id, full_name, email, career_stage, level, streak')
    .eq('employer_id', employer.id)
    .order('full_name')

  const staff = staffProfiles ?? []
  const staffIds = staff.map((s) => s.id)

  // Fetch OR Readiness scores for all staff
  const { data: scoreRows } = staffIds.length > 0
    ? await admin
        .from('readiness_scores')
        .select('user_id, score')
        .in('user_id', staffIds)
        .eq('score_type', 'or_readiness')
    : { data: [] }

  const scoreMap = new Map<string, number>(
    (scoreRows ?? []).map((r) => [r.user_id, r.score])
  )

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white">Team</h1>
        <p className="font-body text-sm text-muted mt-1">
          {employer.name} &mdash; {staff.length} member{staff.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Staff table */}
      {staff.length === 0 ? (
        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
          <p className="font-body text-sm text-muted">No staff members yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {staff.map((member) => {
            const score = scoreMap.get(member.id) ?? null
            const careerStage = member.career_stage as CareerStage
            return (
              <div
                key={member.id}
                className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-xl px-5 py-4 flex items-center gap-4"
              >
                {/* Name + stage */}
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-white truncate">
                    {member.full_name ?? member.email}
                  </p>
                  <p className="font-body text-xs text-muted mt-0.5">
                    {CAREER_STAGE_LABELS[careerStage]}
                  </p>
                </div>

                {/* Level */}
                <div className="text-center hidden sm:block">
                  <p className="font-heading text-lg text-teal">{member.level}</p>
                  <p className="font-body text-[10px] text-muted">Level</p>
                </div>

                {/* Streak */}
                <div className="text-center hidden sm:block">
                  <p className="font-heading text-lg text-orange">{member.streak}</p>
                  <p className="font-body text-[10px] text-muted">Streak</p>
                </div>

                {/* OR Readiness score */}
                <div className="text-center w-20">
                  {score !== null ? (
                    <>
                      <p className={`font-heading text-xl ${score >= 80 ? 'text-green' : score >= 60 ? 'text-gold' : 'text-red'}`}>
                        {score}
                      </p>
                      <p className="font-body text-[10px] text-muted">OR Score</p>
                    </>
                  ) : (
                    <>
                      <p className="font-heading text-xl text-muted">—</p>
                      <p className="font-body text-[10px] text-muted">No data</p>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
