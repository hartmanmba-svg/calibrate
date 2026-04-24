import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CeModule, CeCompletion } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
      <div
        className="h-full bg-teal rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.round(pct * 100))}%` }}
      />
    </div>
  )
}

export default async function CECreditsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? ''

  // CE modules are global content — use admin client
  const admin = createAdminClient()
  const { data: modulesRaw } = await admin
    .from('ce_modules')
    .select('id, title, description, credits')
    .order('created_at')

  const modules: Pick<CeModule, 'id' | 'title' | 'description' | 'credits'>[] = modulesRaw ?? []

  // User completions — user-scoped server client
  const { data: completionsRaw } = await supabase
    .from('ce_completions')
    .select('module_id, progress, completed_at')
    .eq('user_id', uid)

  const completionMap = new Map<string, Pick<CeCompletion, 'progress' | 'completed_at'>>(
    (completionsRaw ?? []).map((c) => [c.module_id, { progress: c.progress, completed_at: c.completed_at }])
  )

  // Total earned credits
  const totalCredits = modules.reduce((sum, m) => {
    const c = completionMap.get(m.id)
    return sum + (c?.completed_at ? m.credits : 0)
  }, 0)

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white">CE Credits</h1>
        <p className="font-body text-sm text-muted mt-1">
          Track your continuing education progress.
        </p>
      </div>

      {/* Total credits earned */}
      <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex items-center gap-6">
        <div>
          <p className="font-heading text-5xl text-teal">{totalCredits.toFixed(1)}</p>
          <p className="font-body text-sm text-muted mt-1">Total CE credits earned</p>
        </div>
      </div>

      {/* Module list */}
      {modules.length === 0 ? (
        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 text-center">
          <p className="font-body text-sm text-muted">No CE modules available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-body text-xs text-muted uppercase tracking-widest">Modules</p>
          {modules.map((mod) => {
            const completion = completionMap.get(mod.id)
            const progress  = completion?.progress ?? 0
            const isCompleted = Boolean(completion?.completed_at)

            return (
              <div
                key={mod.id}
                className={`rounded-2xl border p-5 space-y-3
                  ${isCompleted
                    ? 'border-green/25 bg-green/5'
                    : 'border-[rgba(255,255,255,0.10)] bg-[#2C3E50]'
                  }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-body text-sm text-white font-semibold">{mod.title}</p>
                    {mod.description && (
                      <p className="font-body text-xs text-muted mt-1 leading-relaxed">{mod.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="font-heading text-sm text-teal whitespace-nowrap">
                      {mod.credits} credit{mod.credits !== 1 ? 's' : ''}
                    </span>
                    {isCompleted && (
                      <span className="font-body text-[10px] text-green px-2 py-0.5 rounded-full border border-green/30 bg-green/10">
                        Completed
                      </span>
                    )}
                  </div>
                </div>

                <ProgressBar pct={progress} />

                <div className="flex items-center justify-between">
                  <p className="font-body text-xs text-muted">
                    {Math.round(progress * 100)}% complete
                  </p>
                  {isCompleted && (
                    <a
                      href={`/api/certificates/generate?module_id=${mod.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-xs text-orange hover:underline"
                    >
                      Download certificate
                    </a>
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
