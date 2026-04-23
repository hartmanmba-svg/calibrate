import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { computeXpProgress } from '@/lib/xp'
import { seedCards } from '@/app/actions/seed'

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
    href: '/study',
    title: 'Browse Decks',
    description: 'All topics by modality',
    icon: '📚',
    accent: 'border-teal/40 hover:border-teal',
    badge: null,
  },
  {
    href: '/progress',
    title: 'Readiness',
    description: 'OR readiness score + specialties',
    icon: '📊',
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

  // Seed starter cards on first load — no-op if cards already exist
  await seedCards().catch(() => {})

  // Fetch profile — maybeSingle so a missing row never throws
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, xp, level, streak, streak_shield, last_review_date, career_stage')
    .eq('id', user.id)
    .maybeSingle()

  const xp           = profile?.xp           ?? 0
  const level        = profile?.level        ?? 1
  const streak       = profile?.streak       ?? 0
  const streakShield = profile?.streak_shield ?? false
  const careerStage  = profile?.career_stage ?? 'student'
  const fullName     = profile?.full_name    ?? null

  // Due card count
  const { count: dueCount } = await supabase
    .from('card_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('due', new Date().toISOString())

  // Review activity for the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: recentReviews } = await supabase
    .from('review_log')
    .select('reviewed_at')
    .eq('user_id', user.id)
    .gte('reviewed_at', sevenDaysAgo.toISOString())

  const reviewedDates = new Set(
    (recentReviews ?? []).map((r) => r.reviewed_at.slice(0, 10))
  )

  const days = lastSevenDays()
  const { currentLevelXp, nextLevelXp, progressPct } = computeXpProgress(xp, level)

  const firstName = fullName?.split(' ')[0] ?? 'there'
  const greeting = getGreeting()
  const due = dueCount ?? 0

  return (
    <div className="space-y-8">

      {/* ── Greeting ── */}
      <div>
        <h1 className="font-heading text-3xl text-white">
          {greeting}, {firstName}!
        </h1>
        <p className="font-body text-muted text-sm mt-1 capitalize">
          {careerStage.replace('_', ' ')} · Keep sharpening your edge.
        </p>
      </div>

      {/* ── Due cards CTA ── */}
      <section className="bg-navy rounded-2xl p-6 border border-orange/25 flex items-center justify-between gap-4">
        <div>
          <p className="font-heading text-4xl text-white">{due}</p>
          <p className="font-body text-sm text-muted mt-1">
            {due === 1 ? 'card due for review' : 'cards due for review'}
          </p>
        </div>
        <a
          href="/study/flashcards"
          className="shrink-0 bg-orange hover:bg-orange/90 text-white font-heading text-sm px-5 py-3 rounded-xl transition"
        >
          Start Studying →
        </a>
      </section>

      {/* ── Streak & XP card ── */}
      <section className="bg-navy rounded-2xl p-6 border border-[rgba(255,255,255,0.10)]">
        <div className="flex items-center justify-between mb-5">
          {/* Streak */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="font-heading text-2xl text-white leading-none">{streak}</p>
              <p className="font-body text-xs text-muted mt-0.5">day streak</p>
            </div>
          </div>

          {/* Level */}
          <div className="text-right">
            <p className="font-heading text-sm text-teal uppercase tracking-wider">
              Level {level}
            </p>
            <p className="font-body text-xs text-muted mt-0.5">
              {xp.toLocaleString()} XP total
            </p>
          </div>
        </div>

        {/* XP bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="font-body text-xs text-muted">
              {currentLevelXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
            </span>
            <span className="font-body text-xs text-teal">
              {(nextLevelXp - currentLevelXp).toLocaleString()} XP to Level {level + 1}
            </span>
          </div>
          <div className="h-2.5 bg-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal to-teal/70 rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {streakShield && (
          <p className="font-body text-xs text-gold mt-4 flex items-center gap-1.5">
            <span>🛡️</span> Streak shield active — one missed day protected
          </p>
        )}
      </section>

      {/* ── Quick-access study modes ── */}
      <section>
        <h2 className="font-heading text-sm text-teal uppercase tracking-wider mb-4">
          Quick access
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STUDY_MODES.map((mode) => (
            <a
              key={mode.title}
              href={mode.href}
              className={`relative bg-navy rounded-xl p-5 border transition ${mode.accent}`}
            >
              {mode.badge && (
                <span className="absolute top-3 right-3 bg-muted/20 text-muted font-body text-[10px] px-1.5 py-0.5 rounded-full">
                  {mode.badge}
                </span>
              )}
              <div className="text-3xl mb-3">{mode.icon}</div>
              <p className="font-heading text-white text-base leading-tight">{mode.title}</p>
              <p className="font-body text-muted text-xs mt-1 leading-snug">{mode.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── 7-day activity row ── */}
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
                <span className="font-body text-[10px] text-muted uppercase">{dayLabel}</span>
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
      </section>

    </div>
  )
}
