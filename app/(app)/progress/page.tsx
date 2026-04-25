import { createClient } from '@/lib/supabase/server'
import { computeAndCacheScores } from '@/app/actions/scores'
import { computeXpProgress } from '@/lib/xp'
import { ReadinessRing } from './ReadinessRing'
import { BADGE_DEFINITIONS } from '@/lib/badges'
import { getSubscription } from '@/lib/subscription'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import type { CareerStage, CredentialType, CredentialStatus } from '@/lib/supabase/types'

// ----------------------------------------------------------------
// Career path stepper config
// 5 display stages — "Trainee" is display-only (no DB value)
// ----------------------------------------------------------------

type StepperStage = {
  label: string
  dbValue: CareerStage | null // null = display-only
}

const STEPPER_STAGES: StepperStage[] = [
  { label: 'Student',   dbValue: 'student' },
  { label: 'Trainee',   dbValue: null },       // display-only intermediate
  { label: 'Candidate', dbValue: 'candidate' },
  { label: 'CNIM',      dbValue: 'certified' },
  { label: 'Expert',    dbValue: 'supervisor' },
]

// Map DB career_stage → which stepper index is "active"
function stepperIndex(stage: CareerStage): number {
  switch (stage) {
    case 'student':    return 0
    case 'candidate':  return 2
    case 'certified':  return 3
    case 'supervisor': return 4
    default:           return 0
  }
}

const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  student:    'Student',
  candidate:  'CNIM Candidate',
  certified:  'Certified Practitioner',
  supervisor: 'Supervisory Neurophysiologist',
}

// ----------------------------------------------------------------
// Specialty grid config (7 cells)
// ----------------------------------------------------------------

type SpecialtyScoreKey = 'spinal' | 'vascular' | 'cranial' | 'pediatrics' | 'extremity' | 'spinalTumor' | null

type SpecialtyCell = {
  label: string
  scoreKey: SpecialtyScoreKey
  locked: boolean
  lockedLabel: string | null
}

// ----------------------------------------------------------------
// Credential icons
// ----------------------------------------------------------------

const CREDENTIAL_ICONS: Record<CredentialType, string> = {
  trainer: '🏆',
  educator: '📚',
  fellow: '🎓',
}

const CREDENTIAL_STATUS_STYLES: Record<CredentialStatus, { text: string; color: string }> = {
  active:  { text: 'Active',  color: 'text-green' },
  warning: { text: 'Warning', color: 'text-gold' },
  paused:  { text: 'Paused',  color: 'text-red' },
}

// ----------------------------------------------------------------
// Sub-components (server-rendered)
// ----------------------------------------------------------------

function CareerPath({ current }: { current: CareerStage }) {
  const activeIdx = stepperIndex(current)
  return (
    <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6">
      <p className="font-body text-xs text-muted uppercase tracking-widest mb-5">Career path</p>
      <div className="flex items-center">
        {STEPPER_STAGES.map((stage, i) => {
          const active = i === activeIdx
          const past = i < activeIdx
          return (
            <div key={stage.label} className="flex items-center flex-1 last:flex-none">
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
                  {stage.label}
                </span>
              </div>
              {/* Connector */}
              {i < STEPPER_STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 -mt-5 ${i < activeIdx ? 'bg-teal' : 'bg-[rgba(255,255,255,0.10)]'}`}
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

function SpecialtyGrid({
  spinalScore,
  vascularScore,
  cranialScore,
  pediatricsScore,
  extremityScore,
  spinalTumorScore,
  careerStage,
}: {
  spinalScore: number | null
  vascularScore: number | null
  cranialScore: number | null
  pediatricsScore: number | null
  extremityScore: number | null
  spinalTumorScore: number | null
  careerStage: CareerStage
}) {
  const isAdvanced = careerStage === 'certified' || careerStage === 'supervisor'

  const cells: SpecialtyCell[] = [
    { label: 'Spinal',        scoreKey: 'spinal',      locked: false,      lockedLabel: null },
    { label: 'Vascular',      scoreKey: 'vascular',    locked: false,      lockedLabel: null },
    { label: 'Cranial',       scoreKey: 'cranial',     locked: false,      lockedLabel: null },
    { label: 'ENT',           scoreKey: null,           locked: false,      lockedLabel: null },
    { label: 'Pediatrics',    scoreKey: 'pediatrics',  locked: false,      lockedLabel: null },
    { label: 'Extremity',     scoreKey: 'extremity',   locked: false,      lockedLabel: null },
    {
      label: 'Spinal Tumors',
      scoreKey: 'spinalTumor',
      locked: !isAdvanced,
      lockedLabel: 'Unlocks at CNIM',
    },
  ]

  const scoreMap: Record<NonNullable<SpecialtyScoreKey>, number | null> = {
    spinal:      spinalScore,
    vascular:    vascularScore,
    cranial:     cranialScore,
    pediatrics:  pediatricsScore,
    extremity:   extremityScore,
    spinalTumor: spinalTumorScore,
  }

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

  return (
    <div>
      <p className="font-body text-xs text-muted uppercase tracking-widest mb-4">
        Specialty scores
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cells.map((cell) => {
          const score = cell.scoreKey !== null ? scoreMap[cell.scoreKey] : null

          if (cell.locked) {
            return (
              <div
                key={cell.label}
                className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-dark/50 p-4 flex flex-col gap-2 opacity-60"
              >
                <p className="font-body text-xs text-muted leading-tight">{cell.label}</p>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="font-body text-[11px] text-muted leading-tight">{cell.lockedLabel}</p>
                </div>
              </div>
            )
          }

          return (
            <div
              key={cell.label}
              className={`rounded-xl border p-4 flex flex-col gap-2
                ${score !== null ? scoreBg(score) : 'border-[rgba(255,255,255,0.08)] bg-navy'}`}
            >
              <p className="font-body text-xs text-muted leading-tight">{cell.label}</p>
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

  // Subscription check
  const sub = await getSubscription(uid)

  // Compute fresh scores — never throw; show empty state on any error
  let orScore: number | null = null
  let orPercentile: number | null = null
  let spinalScore: number | null = null
  let vascularScore: number | null = null
  let cranialScore: number | null = null
  let pediatricsScore: number | null = null
  let extremityScore: number | null = null
  let spinalTumorScore: number | null = null
  let reviewCount = 0
  try {
    ;({
      orScore,
      orPercentile,
      spinalScore,
      vascularScore,
      cranialScore,
      pediatricsScore,
      extremityScore,
      spinalTumorScore,
      reviewCount,
    } = await computeAndCacheScores())
  } catch {
    // DB error or env-var misconfiguration — render with empty data
  }

  // Profile: level, XP, streak, career stage (user-scoped RLS client)
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, streak, career_stage')
    .eq('id', uid)
    .maybeSingle()

  const xp = profile?.xp ?? 0
  const level = profile?.level ?? 1
  const streak = profile?.streak ?? 0
  const careerStage = (profile?.career_stage ?? 'student') as CareerStage

  // Fetch earned badges (user-scoped RLS client)
  const { data: earnedRows } = await supabase
    .from('badges')
    .select('badge_key')
    .eq('user_id', uid)

  const earnedKeys = new Set((earnedRows ?? []).map((r) => r.badge_key))

  // Fetch credentials (user-scoped RLS client)
  const { data: credentialRows } = await supabase
    .from('credentials')
    .select('credential_type, status, earned_at')
    .eq('user_id', uid)
    .order('earned_at', { ascending: true })

  const credentials = (credentialRows ?? []) as {
    credential_type: CredentialType
    status: CredentialStatus
    earned_at: string
  }[]

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white">Progress</h1>
        <p className="font-body text-sm text-muted mt-1">
          {CAREER_STAGE_LABELS[careerStage]} · scores updated just now
        </p>
      </div>

      {/* Section 1 — Career Path stepper */}
      <CareerPath current={careerStage} />

      {/* Section 2 — Score Rings: OR Readiness + Spinal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 flex flex-col items-center gap-2">
          <ReadinessRing score={orScore} reviewCount={reviewCount} label="OR Readiness" />
          {orScore !== null && (
            <p className="font-body text-xs text-muted text-center mt-1">
              {orPercentile !== null
                ? orPercentile >= 50
                  ? `Top ${100 - orPercentile}% in your peer group`
                  : `${orPercentile}th percentile in your peer group`
                : 'Building benchmark data'}
            </p>
          )}
          {orScore === null && (
            <a
              href="/study/flashcards"
              className="mt-2 font-body text-xs text-orange hover:underline"
            >
              Start studying to unlock →
            </a>
          )}
        </div>

        <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-8 flex flex-col items-center gap-2">
          <ReadinessRing score={spinalScore} reviewCount={reviewCount} label="Spinal" />
          {spinalScore === null && (
            <a
              href="/study/flashcards"
              className="mt-2 font-body text-xs text-orange hover:underline"
            >
              Study spinal cases to unlock →
            </a>
          )}
        </div>
      </div>

      {/* XP card */}
      <XpCard xp={xp} level={level} streak={streak} />

      {/* Section 3 — Specialty Score Grid (paywalled for free users) */}
      {sub.isFree ? (
        <UpgradePrompt
          feature="Specialty scores"
          description="Upgrade to see your specialty readiness scores and national benchmarks."
        />
      ) : (
        <SpecialtyGrid
          spinalScore={spinalScore}
          vascularScore={vascularScore}
          cranialScore={cranialScore}
          pediatricsScore={pediatricsScore}
          extremityScore={extremityScore}
          spinalTumorScore={spinalTumorScore}
          careerStage={careerStage}
        />
      )}

      {/* Section 4 — Credentials */}
      <div>
        <p className="font-body text-xs text-muted uppercase tracking-widest mb-4">Credentials</p>
        {credentials.length === 0 ? (
          <p className="font-body text-sm text-muted">No credentials earned yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {credentials.map((cred) => {
              const styleInfo = CREDENTIAL_STATUS_STYLES[cred.status] ?? { text: cred.status, color: 'text-muted' }
              return (
                <div
                  key={cred.credential_type}
                  className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.10)] bg-navy px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" role="img" aria-label={cred.credential_type}>
                      {CREDENTIAL_ICONS[cred.credential_type]}
                    </span>
                    <div>
                      <p className="font-heading text-sm text-white capitalize">{cred.credential_type}</p>
                      <p className="font-body text-[11px] text-muted">
                        Earned {new Date(cred.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-heading text-xs px-2.5 py-0.5 rounded-full border ${
                    cred.status === 'active'
                      ? 'border-green/30 bg-green/10 text-green'
                      : cred.status === 'paused'
                        ? 'border-red/30 bg-red/10 text-red'
                        : 'border-gold/30 bg-gold/10 text-gold'
                  }`}>
                    {styleInfo.text}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 5 — Badge Shelf */}
      <div>
        <p className="font-body text-xs text-muted uppercase tracking-widest mb-4">Badges</p>
        <div className="flex flex-wrap gap-3">
          {BADGE_DEFINITIONS.map((def) => {
            const earned = earnedKeys.has(def.key)
            return (
              <div
                key={def.key}
                title={def.description}
                className={`flex flex-col items-center gap-1.5 w-20 p-3 rounded-xl border text-center
                  ${earned
                    ? 'border-teal/30 bg-teal/5'
                    : 'border-[rgba(255,255,255,0.06)] bg-dark/40 opacity-50'
                  }`}
              >
                <span className="text-2xl" role="img" aria-label={def.label}>
                  {earned ? def.icon : '🔒'}
                </span>
                <span className={`font-body text-[10px] leading-tight ${earned ? 'text-white' : 'text-muted'}`}>
                  {def.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer note */}
      <p className="font-body text-xs text-muted text-center pb-4">
        Specialty benchmarks and percentiles unlock once enough practitioners complete each module.
        All scores refresh each time you open this page.
      </p>

    </div>
  )
}
