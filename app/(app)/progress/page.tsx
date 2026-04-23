import { createClient } from '@/lib/supabase/server'
import { computeAndCacheScores } from '@/app/actions/scores'
import { CASE_TYPES, CASE_TYPE_LABELS } from '@/lib/case-types'
import { computeXpProgress } from '@/lib/xp'
import { ReadinessRing } from './ReadinessRing'
import type { CaseType, CareerStage } from '@/lib/supabase/types'

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

const CAREER_STAGES: CareerStage[] = ['student', 'candidate', 'certified', 'supervisor']

const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  student:    'Student',
  candidate:  'CNIM Candidate',
  certified:  'Certified Practitioner',
  supervisor: 'Supervisory Neurophysiologist',
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green'
  if (score >= 60) return 'text-gold'
  return 'text-red'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'border-green/25 bg-green/5'
  if (score >= 60) return 'border-gold/25 bg-gold/5'
  return 'border-red/25 bg-red/5'
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green'
  if (score >= 60) return 'bg-gold'
  return 'bg-red'
}

// ----------------------------------------------------------------
// Sub-components (server-rendered)
// ----------------------------------------------------------------

function CareerPath({ current }: { current: CareerStage }) {
  const idx = CAREER_STAGES.indexOf(current)
  return (
    <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6">
      <p className="font-body text-xs text-muted uppercase tracking-widest mb-5">Career path</p>
      <div className="flex items-center">
        {CAREER_STAGES.map((stage, i) => {
          const active = stage === current
          const past = i < idx
          return (
            <div key={stage} className="flex items-center flex-1 last:flex-none">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5 z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2
                    ${active
                      ? 'bg-orange border-orange text-white'
                      : past
                        ? 'bg-teal/20 border-teal text-teal'
                        : 'bg-dark border-[rgba(255,255,255,0.15)] text-muted'
                    }`}
                >
                  {past ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-heading text-xs">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`font-body text-[10px] text-center leading-tight max-w-[60px]
                    ${active ? 'text-orange' : past ? 'text-teal' : 'text-muted'}`}
                >
                  {CAREER_STAGE_LABELS[stage]}
                </span>
              </div>
              {/* Connector */}
              {i < CAREER_STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 -mt-5 ${i < idx ? 'bg-teal' : 'bg-[rgba(255,255,255,0.10)]'}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function XpCard({ xp, level, streak }: { xp: number; level: number; streak: number }) {
  const { currentLevelXp, nextLevelXp, progressPct } = computeXpProgress(xp, level)
  return (
    <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body text-xs text-muted uppercase tracking-widest">Level</p>
          <p className="font-heading text-5xl text-white mt-1">{level}</p>
        </div>
        <div className="text-right">
          <p className="font-body text-xs text-muted uppercase tracking-widest">Streak</p>
          <p className="font-heading text-3xl text-orange mt-1">{streak} 🔥</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-1.5">
          <span className="font-body text-xs text-muted">{currentLevelXp.toLocaleString()} XP</span>
          <span className="font-body text-xs text-muted">
            {nextLevelXp.toLocaleString()} to level {level + 1}
          </span>
        </div>
        <div className="h-2 bg-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="font-body text-[11px] text-muted mt-1.5 text-right">
          {xp.toLocaleString()} total XP
        </p>
      </div>
    </div>
  )
}

function SpecialtyGrid({ specialtyScores }: { specialtyScores: Partial<Record<CaseType, number>> }) {
  return (
    <div>
      <p className="font-body text-xs text-muted uppercase tracking-widest mb-4">
        Specialty scores
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CASE_TYPES.map((caseType) => {
          const score = specialtyScores[caseType] ?? null
          return (
            <div
              key={caseType}
              className={`rounded-xl border p-4 flex flex-col gap-2
                ${score !== null ? scoreBg(score) : 'border-[rgba(255,255,255,0.08)] bg-navy'}`}
            >
              <p className="font-body text-xs text-muted leading-tight">
                {CASE_TYPE_LABELS[caseType]}
              </p>
              {score !== null ? (
                <>
                  <p className={`font-heading text-2xl ${scoreColor(score)}`}>{score}</p>
                  <div className="h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreBarColor(score)}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="font-body text-[11px] text-muted leading-tight">
                  Not enough data
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function ProgressPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // No redirect — middleware handles unauthenticated users.
  const uid = user?.id ?? ''

  // Compute fresh scores — never throw; show empty state on any error
  let orScore: number | null = null
  let specialtyScores: Partial<Record<CaseType, number>> = {}
  let reviewCount = 0
  try {
    ;({ orScore, specialtyScores, reviewCount } = await computeAndCacheScores())
  } catch {
    // DB error or env-var misconfiguration — render with empty data
  }

  // Profile: level, XP, streak, career stage
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, streak, career_stage')
    .eq('id', uid)
    .maybeSingle()

  // Use safe defaults when profile row doesn't exist yet
  const xp = profile?.xp ?? 0
  const level = profile?.level ?? 1
  const streak = profile?.streak ?? 0
  const careerStage = (profile?.career_stage ?? 'student') as CareerStage

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white">Progress</h1>
        <p className="font-body text-sm text-muted mt-1">
          {CAREER_STAGE_LABELS[careerStage]} · scores updated just now
        </p>
      </div>

      {/* Career path */}
      <CareerPath current={careerStage} />

      {/* OR Readiness + XP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 flex flex-col items-center gap-2">
          <ReadinessRing score={orScore} reviewCount={reviewCount} />
          {orScore === null && (
            <a
              href="/study/flashcards"
              className="mt-2 font-body text-xs text-orange hover:underline"
            >
              Start studying to unlock →
            </a>
          )}
        </div>

        <XpCard xp={xp} level={level} streak={streak} />
      </div>

      {/* Specialty scores */}
      <SpecialtyGrid specialtyScores={specialtyScores} />

      {/* Footer note */}
      <p className="font-body text-xs text-muted text-center pb-4">
        Specialty benchmarks and percentiles unlock once enough practitioners complete each module.
        All scores refresh each time you open this page.
      </p>

    </div>
  )
}
