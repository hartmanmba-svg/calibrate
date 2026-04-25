import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function BenchmarksPage() {
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
        <p className="font-body text-sm text-muted max-w-sm">
          Your account is not linked to an employer organisation. Contact support if you believe this is an error.
        </p>
        <a href="/dashboard" className="font-body text-sm text-orange hover:underline">
          Go to practitioner dashboard
        </a>
      </div>
    )
  }

  // Fetch all staff profiles for this employer
  const { data: staffProfiles } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .eq('employer_id', employer.id)
    .order('full_name')

  const staff = staffProfiles ?? []
  const staffIds = staff.map((s) => s.id)

  // Fetch OR Readiness scores for all staff
  const { data: staffScoreRows } = staffIds.length > 0
    ? await admin
        .from('readiness_scores')
        .select('user_id, score')
        .in('user_id', staffIds)
        .eq('score_type', 'or_readiness')
    : { data: [] }

  const staffScoreMap = new Map<string, number>(
    (staffScoreRows ?? []).map((r) => [r.user_id, r.score])
  )

  const staffScoresArray = Array.from(staffScoreMap.values())
  const teamAvg = staffScoresArray.length > 0
    ? Math.round(staffScoresArray.reduce((a, b) => a + b, 0) / staffScoresArray.length)
    : null

  // Fetch national average
  const { data: nationalRows } = await admin
    .from('readiness_scores')
    .select('score')
    .eq('score_type', 'or_readiness')

  const nationalScores = (nationalRows ?? []).map((r) => r.score)
  const nationalAvg = nationalScores.length > 0
    ? Math.round(nationalScores.reduce((a, b) => a + b, 0) / nationalScores.length)
    : null

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white">Benchmarks</h1>
        <p className="font-body text-sm text-muted mt-1">
          How {employer.name} compares to national averages
        </p>
      </div>

      {/* Team vs national avg */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 text-center">
          <p className="font-heading text-xs text-teal uppercase tracking-wide mb-3">Team average</p>
          {teamAvg !== null ? (
            <>
              <p className={`font-heading text-5xl ${teamAvg >= 80 ? 'text-green' : teamAvg >= 60 ? 'text-gold' : 'text-red'}`}>
                {teamAvg}
              </p>
              <p className="font-body text-xs text-muted mt-2">OR Readiness</p>
            </>
          ) : (
            <>
              <p className="font-heading text-5xl text-muted">—</p>
              <p className="font-body text-xs text-muted mt-2">No scores yet</p>
            </>
          )}
        </div>

        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 text-center">
          <p className="font-heading text-xs text-teal uppercase tracking-wide mb-3">National average</p>
          {nationalAvg !== null ? (
            <>
              <p className="font-heading text-5xl text-white">{nationalAvg}</p>
              <p className="font-body text-xs text-muted mt-2">OR Readiness</p>
            </>
          ) : (
            <>
              <p className="font-heading text-5xl text-muted">—</p>
              <p className="font-body text-xs text-muted mt-2">Building benchmark data</p>
            </>
          )}
        </div>
      </div>

      {/* Comparison delta */}
      {teamAvg !== null && nationalAvg !== null && (
        <div className={`rounded-xl px-5 py-4 flex items-center gap-3 ${
          teamAvg >= nationalAvg
            ? 'bg-green/10 border border-green/25'
            : 'bg-red/10 border border-red/25'
        }`}>
          <p className={`font-body text-sm font-semibold ${teamAvg >= nationalAvg ? 'text-green' : 'text-red'}`}>
            {teamAvg >= nationalAvg
              ? `Your team scores ${teamAvg - nationalAvg} points above the national average.`
              : `Your team scores ${nationalAvg - teamAvg} points below the national average.`
            }
          </p>
        </div>
      )}

      {/* Staff breakdown table */}
      <div className="space-y-3">
        <h2 className="font-heading text-sm text-teal uppercase tracking-wide">Staff breakdown</h2>

        {staff.length === 0 ? (
          <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
            <p className="font-body text-sm text-muted">
              No staff members yet. Share your invite link to get started.
            </p>
            <a href="/employer/dashboard" className="font-body text-sm text-orange hover:underline mt-2 inline-block">
              Go to dashboard
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {staff.map((member) => {
              const score = staffScoreMap.get(member.id) ?? null
              const aboveNational = score !== null && nationalAvg !== null && score >= nationalAvg

              return (
                <div
                  key={member.id}
                  className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-xl px-5 py-4 flex items-center gap-4"
                >
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-white truncate">
                      {member.full_name ?? member.email}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    {score !== null ? (
                      <div className="flex items-center gap-2">
                        {/* Above/below indicator */}
                        <span className={`font-body text-xs px-2 py-0.5 rounded-full ${
                          aboveNational
                            ? 'bg-green/10 text-green'
                            : 'bg-red/10 text-red'
                        }`}>
                          {aboveNational ? 'Above avg' : 'Below avg'}
                        </span>
                        <p className={`font-heading text-xl w-10 text-right ${
                          score >= 80 ? 'text-green' : score >= 60 ? 'text-gold' : 'text-red'
                        }`}>
                          {score}
                        </p>
                      </div>
                    ) : (
                      <p className="font-heading text-xl text-muted">—</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
