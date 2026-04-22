import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { computeXpProgress } from '@/lib/xp'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Returns the last 7 calendar dates as YYYY-MM-DD strings, oldest first. */
function lastSevenDays(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ----------------------------------------------------------------
// Study mode cards config
// ----------------------------------------------------------------

const STUDY_MODES = [
  {
    href: '/study/flashcards',
    title: 'Flashcards',
    description: 'Spaced repetition — your due cards',
    icon: '🃏',
    accent: 'border-orange/40 hover:border-orange',
    badge: null,
  },
  {
    href: '/study?mode=quiz',
    title: 'Timed Quiz',
    description: '10 questions, 60 seconds each',
    icon: '⏱️',
    accent: 'border-teal/40 hover:border-teal',
    badge: null,
  },
  {
    href: '/study?mode=drill',
    title: 'Topic Drill',
    description: 'Focus on one modality or case type',
    icon: '🎯',
    accent: 'border-green/40 hover:border-green',
    badge: null,
  },
  {
    href: '/progress',
    title: 'Leaderboard',
    description: 'See how you rank nationally',
    icon: '🏆',
    accent: 'border-gold/40 hover:border-gold',
    badge: 'Soon',
  },
] as const

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, xp, level, streak, streak_shield, last_review_date, career_stage')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Fetch review activity for the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: recentReviews } = await supabase
    .from('review_log')
    .select('reviewed_at')
    .eq('user_id', user.id)
    .gte('reviewed_at', sevenDaysAgo.toISOString())

  // Build set of dates that have at least one review
  const reviewedDates = new Set(
    (recentReviews ?? []).map((r) => r.reviewed_at.slice(0, 10))
  )

  const days = lastSevenDays()
  const { currentLevelXp, nextLevelXp, progressPct } = computeXpProgress(
    profile.xp,
    profile.level
  )

  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const greeting = getGreeting()

  return (
    <div className="space-y-8">

      {/* ── Greeting ── */}
      <div>
        <h1 className="font-heading text-3xl text-white">
          {greeting}, {firstName}!
        </h1>
        <p className="font-body text-muted text-sm mt-1 capitalize">
          {profile.career_stage.replace('_', ' ')} · Keep sharpening your edge.
        </p>
      </div>

      {/* ── Streak & XP card ── */}
      <section className="bg-navy rounded-2xl p-6 border border-[rgba(255,255,255,0.10)]">
        <div className="flex items-center justify-between mb-5">
          {/* Streak */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="font-heading text-2xl text-white leading-none">
                {profile.streak}
              </p>
              <p className="font-body text-xs text-muted mt-0.5">
                {profile.streak === 1 ? 'day streak' : 'day streak'}
              </p>
            </div>
          </div>

          {/* Level */}
          <div className="text-right">
            <p className="font-heading text-sm text-teal uppercase tracking-wider">
              Level {profile.level}
            </p>
            <p className="font-body text-xs text-muted mt-0.5">
              {profile.xp.toLocaleString()} XP total
            </p>
          </div>
        </div>

        {/* XP bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="font-body text-xs text-muted">
              {currentLevelXp} / {nextLevelXp} XP
            </span>
            <span className="font-body text-xs text-teal">
              {nextLevelXp - currentLevelXp} XP to Level {profile.level + 1}
            </span>
          </div>
          <div className="h-2.5 bg-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal to-teal/70 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── Study modes ── */}
      <section>
        <h2 className="font-heading text-lg text-teal uppercase tracking-wider mb-4">
          Study
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STUDY_MODES.map((mode) => (
            <Link
              key={mode.title}
              href={mode.href}
              className={`relative bg-navy rounded-xl p-5 border transition group ${mode.accent}`}
            >
              {mode.badge && (
                <span className="absolute top-3 right-3 bg-muted/20 text-muted font-body text-[10px] px-1.5 py-0.5 rounded-full">
                  {mode.badge}
                </span>
              )}
              <div className="text-3xl mb-3">{mode.icon}</div>
              <p className="font-heading text-white text-base leading-tight">
                {mode.title}
              </p>
              <p className="font-body text-muted text-xs mt-1 leading-snug">
                {mode.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 7-day streak row ── */}
      <section className="bg-navy rounded-2xl p-6 border border-[rgba(255,255,255,0.10)]">
        <h2 className="font-heading text-sm text-teal uppercase tracking-wider mb-5">
          This week
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {days.map((dateStr) => {
            const date = new Date(dateStr + 'T12:00:00')
            const dayLabel = DAY_LABELS[date.getDay()]
            const dayNum = date.getDate()
            const isToday = dateStr === new Date().toISOString().slice(0, 10)
            const hasReview = reviewedDates.has(dateStr)

            return (
              <div key={dateStr} className="flex flex-col items-center gap-1.5">
                <span className="font-body text-[10px] text-muted uppercase">
                  {dayLabel}
                </span>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg
                    ${hasReview ? 'bg-orange/15' : 'bg-dark'}
                    ${isToday ? 'ring-2 ring-orange/60' : ''}`}
                >
                  {hasReview ? '🔥' : (
                    <span className="font-body text-xs text-muted/50">{dayNum}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Streak shield badge if earned */}
        {profile.streak_shield && (
          <p className="font-body text-xs text-gold mt-4 flex items-center gap-1.5">
            <span>🛡️</span> Streak shield active — one missed day protected
          </p>
        )}
      </section>

    </div>
  )
}
