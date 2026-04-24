import { createClient } from '@/lib/supabase/server'
import { computeXpProgress } from '@/lib/xp'
import type { CareerStage, Json } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

type Mission = {
  key: string
  completed: boolean
  xp_reward: number
}

type DailyMissions = {
  date: string
  missions: Mission[]
}

const DEFAULT_MISSIONS: Mission[] = [
  { key: 'review_20',       completed: false, xp_reward: 30 },
  { key: 'drill_80',        completed: false, xp_reward: 50 },
  { key: 'maintain_streak', completed: false, xp_reward: 10 },
]

const MISSION_LABELS: Record<string, string> = {
  review_20:       'Review 20 cards',
  drill_80:        'Score 80%+ on a drill',
  maintain_streak: 'Maintain your streak',
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function greeting(name: string | null): string {
  const hour = new Date().getHours()
  const first = name?.split(' ')[0] ?? 'there'
  if (hour < 12) return `Good morning, ${first}.`
  if (hour < 17) return `Good afternoon, ${first}.`
  return `Good evening, ${first}.`
}

const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  student:    'Student',
  candidate:  'CNIM Candidate',
  certified:  'Certified Practitioner',
  supervisor: 'Supervisory Neurophysiologist',
}

function parseMissions(raw: Json | null, todayDate: string): Mission[] {
  if (!raw) return DEFAULT_MISSIONS.map((m) => ({ ...m }))
  const dm = raw as unknown as DailyMissions
  if (dm.date !== todayDate) return DEFAULT_MISSIONS.map((m) => ({ ...m }))
  return dm.missions
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  // No redirect — middleware handles unauthenticated users.
  const uid = user?.id ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, career_stage, xp, level, streak, daily_missions')
    .eq('id', uid)
    .maybeSingle()

  const fullName    = profile?.full_name    ?? null
  const careerStage = (profile?.career_stage ?? 'student') as CareerStage
  const xp          = profile?.xp          ?? 0
  const level       = profile?.level       ?? 1
  const streak      = profile?.streak      ?? 0

  const { progressPct, nextLevelXp, currentLevelXp } = computeXpProgress(xp, level)

  // Cards due
  const { count: dueCount } = await supabase
    .from('card_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid)
    .lte('due', new Date().toISOString())

  const due = dueCount ?? 0

  // 7-day activity (review_log)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: recentLogs } = await supabase
    .from('review_log')
    .select('reviewed_at')
    .eq('user_id', uid)
    .gte('reviewed_at', sevenDaysAgo.toISOString())

  // Build day-by-day activity map
  const activityMap: Record<string, number> = {}
  ;(recentLogs ?? []).forEach(({ reviewed_at }) => {
    const day = reviewed_at.slice(0, 10)
    activityMap[day] = (activityMap[day] ?? 0) + 1
  })

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    return {
      key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
      count: activityMap[key] ?? 0,
    }
  })

  const maxActivity = Math.max(...days.map((d) => d.count), 1)

  // Daily missions
  const todayDate = new Date().toISOString().slice(0, 10)
  const missions = parseMissions(profile?.daily_missions ?? null, todayDate)

  return (
    <div className="space-y-8">

      {/* ── Greeting ── */}
      <div>
        <h1 className="font-heading text-3xl text-white">{greeting(fullName)}</h1>
        <p className="font-body text-sm text-muted mt-1">
          {CAREER_STAGE_LABELS[careerStage]}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Level',  value: level,                color: 'text-teal' },
          { label: 'XP',     value: xp.toLocaleString(),  color: 'text-white' },
          { label: 'Streak', value: `${streak} 🔥`,        color: 'text-orange' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-xl p-4 text-center"
          >
            <p className={`font-heading text-2xl ${color}`}>{value}</p>
            <p className="font-body text-xs text-muted mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── XP progress bar ── */}
      <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-xl px-5 py-4">
        <div className="flex justify-between mb-2">
          <span className="font-body text-xs text-muted">
            {currentLevelXp.toLocaleString()} XP this level
          </span>
          <span className="font-body text-xs text-muted">
            {nextLevelXp.toLocaleString()} to level {level + 1}
          </span>
        </div>
        <div className="h-2 bg-dark rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Review CTA ── */}
      <a
        href="/study"
        className="block bg-orange hover:bg-orange/90 text-white font-heading text-xl text-center rounded-2xl py-6 transition"
      >
        {due > 0 ? `Review ${due} due card${due === 1 ? '' : 's'}` : "Study ahead — you're all caught up!"}
      </a>

      {/* ── Daily Missions ── */}
      <section>
        <p className="font-body text-xs text-muted uppercase tracking-widest mb-4">
          Daily missions
        </p>
        <div className="flex flex-col gap-3">
          {missions.map((mission) => (
            <div
              key={mission.key}
              className={`flex items-center justify-between rounded-xl border px-5 py-4
                ${mission.completed
                  ? 'border-green/25 bg-green/5'
                  : 'border-[rgba(255,255,255,0.08)] bg-navy'
                }`}
            >
              <div className="flex items-center gap-3">
                {/* Indicator */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                    ${mission.completed ? 'bg-green' : 'border-2 border-[rgba(255,255,255,0.20)]'}`}
                >
                  {mission.completed && (
                    <svg className="w-3 h-3 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`font-body text-sm ${mission.completed ? 'text-green' : 'text-white'}`}>
                  {MISSION_LABELS[mission.key] ?? mission.key}
                </span>
              </div>
              {/* XP badge */}
              <span
                className={`font-heading text-sm px-2.5 py-0.5 rounded-full
                  ${mission.completed
                    ? 'bg-green/20 text-green'
                    : 'bg-[rgba(255,255,255,0.06)] text-muted'
                  }`}
              >
                +{mission.xp_reward} XP
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7-day activity ── */}
      <section>
        <p className="font-body text-xs text-muted uppercase tracking-widest mb-4">
          Last 7 days
        </p>
        <div className="flex items-end gap-2 h-16">
          {days.map(({ key, label, count }) => (
            <div key={key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm bg-teal/30"
                style={{ height: `${Math.round((count / maxActivity) * 48) + 4}px` }}
              >
                <div
                  className="w-full h-full bg-teal rounded-t-sm"
                  style={{ opacity: count > 0 ? 1 : 0 }}
                />
              </div>
              <span className="font-body text-[10px] text-muted">{label}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
