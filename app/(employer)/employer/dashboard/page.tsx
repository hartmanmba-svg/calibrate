import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function EmployerDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? ''

  const admin = createAdminClient()

  // Fetch employer where current user is the admin
  const { data: employer } = await admin
    .from('employers')
    .select('id, name, seat_count')
    .eq('admin_user_id', uid)
    .maybeSingle()

  if (!employer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <p className="font-heading text-2xl text-white">Not an employer account</p>
        <p className="font-body text-sm text-muted max-w-sm">
          Your account is not linked to an employer organisation. Contact support if you believe this is an error.
        </p>
        <a href="/dashboard" className="font-body text-sm text-orange hover:underline">
          Go to practitioner dashboard
        </a>
      </div>
    )
  }

  // Fetch all staff profiles
  const { data: staffProfiles } = await admin
    .from('profiles')
    .select('id, full_name, email, career_stage, level, streak')
    .eq('employer_id', employer.id)

  const staff = staffProfiles ?? []
  const activeStaffCount = staff.length

  // Fetch OR Readiness scores for all staff
  const staffIds = staff.map((s) => s.id)
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

  const scoresArray = Array.from(scoreMap.values())
  const avgScore = scoresArray.length > 0
    ? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length)
    : null

  const countAbove80 = scoresArray.filter((s) => s > 80).length
  const countBelow60 = scoresArray.filter((s) => s < 60).length

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white">{employer.name}</h1>
        <p className="font-body text-sm text-muted mt-1">Employer dashboard</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-xl p-5 text-center">
          <p className="font-heading text-3xl text-white">{activeStaffCount}</p>
          <p className="font-body text-xs text-muted mt-1">Active staff</p>
        </div>
        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-xl p-5 text-center">
          <p className="font-heading text-3xl text-white">{employer.seat_count}</p>
          <p className="font-body text-xs text-muted mt-1">Seats</p>
        </div>
        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-xl p-5 text-center">
          <p className={`font-heading text-3xl ${avgScore !== null ? (avgScore >= 80 ? 'text-green' : avgScore >= 60 ? 'text-gold' : 'text-red') : 'text-muted'}`}>
            {avgScore !== null ? avgScore : '\u2014'}
          </p>
          <p className="font-body text-xs text-muted mt-1">Avg OR Readiness</p>
        </div>
        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-xl p-5 text-center">
          <p className="font-heading text-3xl text-green">{countAbove80}</p>
          <p className="font-body text-xs text-muted mt-1">Score above 80</p>
        </div>
      </div>

      {/* Needs attention */}
      {countBelow60 > 0 && (
        <div className="bg-red/10 border border-red/25 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z" />
            </svg>
          </div>
          <div>
            <p className="font-body text-sm text-red font-semibold">
              {countBelow60} staff member{countBelow60 !== 1 ? 's' : ''} with score below 60
            </p>
            <p className="font-body text-xs text-muted mt-0.5">Consider additional training support.</p>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-4">
        <a
          href="/employer/team"
          className="bg-orange hover:bg-orange/90 text-white font-heading text-sm px-6 py-3 rounded-lg transition"
        >
          View team
        </a>
        <a
          href="/employer/reports"
          className="border border-[rgba(255,255,255,0.15)] text-muted hover:text-white font-heading text-sm px-6 py-3 rounded-lg transition"
        >
          Reports
        </a>
      </div>

    </div>
  )
}
