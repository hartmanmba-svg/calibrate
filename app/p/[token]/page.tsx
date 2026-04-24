import { createAdminClient } from '@/lib/supabase/admin'
import type { CareerStage, CredentialType } from '@/lib/supabase/types'
import { BADGE_DEFINITIONS } from '@/lib/badges'

// This page is OUTSIDE (app)/ — no auth required, no app layout.

interface Props {
  params: Promise<{ token: string }>
}

const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  student:    'Student',
  candidate:  'CNIM Candidate',
  certified:  'Certified Practitioner',
  supervisor: 'Supervisory Neurophysiologist',
}

const CREDENTIAL_LABELS: Record<CredentialType, string> = {
  trainer:  'Trainer',
  educator: 'Educator',
  fellow:   'Fellow',
}

const CREDENTIAL_COLORS: Record<CredentialType, string> = {
  trainer:  'text-gold border-gold/30 bg-gold/10',
  educator: 'text-teal border-teal/30 bg-teal/10',
  fellow:   'text-orange border-orange/30 bg-orange/10',
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#5DCAA5' : score >= 60 ? '#F4C430' : '#E24B4A'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize="20" fontFamily="Oswald, sans-serif" fontWeight="600">
          {score}
        </text>
      </svg>
      <p className="font-body text-xs text-muted">OR Readiness</p>
    </div>
  )
}

export default async function PublicProfilePage({ params }: Props) {
  const { token } = await params
  const admin = createAdminClient()

  // Fetch share link by token (admin bypasses RLS)
  const { data: shareLink } = await admin
    .from('share_links')
    .select('user_id, show_name, show_scores, show_credentials, show_badges')
    .eq('token', token)
    .maybeSingle()

  if (!shareLink) {
    return (
      <main className="min-h-screen bg-[#1A252F] flex items-center justify-center px-5">
        <div className="text-center space-y-4 max-w-sm">
          <p className="font-heading text-3xl text-white">Profile not found</p>
          <p className="font-body text-sm text-muted">
            This profile link may have expired or been removed.
          </p>
          <a
            href="https://calibrate.app"
            className="inline-block mt-4 font-heading text-sm text-orange hover:underline"
          >
            calibrate. — Sharpen your edge.
          </a>
        </div>
      </main>
    )
  }

  const userId = shareLink.user_id

  // Fetch profile
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, career_stage, level, xp, streak')
    .eq('id', userId)
    .maybeSingle()

  // Fetch OR Readiness score
  const { data: scoreRow } = shareLink.show_scores
    ? await admin
        .from('readiness_scores')
        .select('score, percentile')
        .eq('user_id', userId)
        .eq('score_type', 'or_readiness')
        .maybeSingle()
    : { data: null }

  // Fetch active credentials
  const { data: credentialRows } = shareLink.show_credentials
    ? await admin
        .from('credentials')
        .select('credential_type')
        .eq('user_id', userId)
        .eq('status', 'active')
    : { data: null }

  // Fetch badges
  const { data: badgeRows } = shareLink.show_badges
    ? await admin
        .from('badges')
        .select('badge_key')
        .eq('user_id', userId)
    : { data: null }

  const careerStage = (profile?.career_stage ?? 'student') as CareerStage
  const displayName = shareLink.show_name
    ? (profile?.full_name ?? 'Anonymous Practitioner')
    : 'Anonymous Practitioner'

  const earnedBadgeKeys = new Set((badgeRows ?? []).map((b) => b.badge_key))
  const earnedBadgeDefs = BADGE_DEFINITIONS.filter((d) => earnedBadgeKeys.has(d.key))

  return (
    <main className="min-h-screen bg-[#1A252F] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* ── Brand header ── */}
        <div className="text-center">
          <p className="font-heading text-xl text-orange tracking-tight">calibrate.</p>
          <p className="font-body text-xs text-muted">Sharpen your edge.</p>
        </div>

        {/* ── Profile card ── */}
        <div className="bg-[#2C3E50] border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 space-y-6">

          {/* Name + career stage */}
          <div className="text-center space-y-1">
            <p className="font-heading text-2xl text-white">{displayName}</p>
            <p className="font-body text-sm text-muted">{CAREER_STAGE_LABELS[careerStage]}</p>
          </div>

          {/* OR Readiness ring */}
          {shareLink.show_scores && scoreRow && (
            <div className="flex flex-col items-center gap-2">
              <ScoreRing score={scoreRow.score} />
              {scoreRow.percentile !== null && (
                <p className="font-body text-xs text-muted text-center">
                  {scoreRow.percentile >= 50
                    ? `Top ${100 - scoreRow.percentile}% in peer group`
                    : `${scoreRow.percentile}th percentile`}
                </p>
              )}
            </div>
          )}

          {/* Credentials */}
          {shareLink.show_credentials && credentialRows && credentialRows.length > 0 && (
            <div>
              <p className="font-body text-xs text-muted uppercase tracking-widest mb-3 text-center">
                Credentials
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {credentialRows.map((c) => {
                  const type = c.credential_type as CredentialType
                  return (
                    <span
                      key={type}
                      className={`font-heading text-xs px-3 py-1 rounded-full border ${CREDENTIAL_COLORS[type]}`}
                    >
                      {CREDENTIAL_LABELS[type]}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Badges */}
          {shareLink.show_badges && earnedBadgeDefs.length > 0 && (
            <div>
              <p className="font-body text-xs text-muted uppercase tracking-widest mb-3 text-center">
                Badges
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {earnedBadgeDefs.map((def) => (
                  <div
                    key={def.key}
                    title={def.description}
                    className="flex flex-col items-center gap-1 w-16 p-2 rounded-xl border border-teal/20 bg-teal/5 text-center"
                  >
                    <span className="text-xl" role="img" aria-label={def.label}>{def.icon}</span>
                    <span className="font-body text-[9px] text-muted leading-tight">{def.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="text-center">
          <a
            href={process.env.NEXT_PUBLIC_APP_URL ?? '/'}
            className="font-body text-xs text-muted hover:text-orange transition"
          >
            Join Calibrate →
          </a>
        </div>

      </div>
    </main>
  )
}
