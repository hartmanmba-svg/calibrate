import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentWeeklyCase } from '@/lib/weekly-case'
import { WeeklyCaseQuiz } from './components/WeeklyCaseQuiz'
import type { PriorAnswer } from './components/WeeklyCaseQuiz'

// ----------------------------------------------------------------
// Resource card config
// ----------------------------------------------------------------

type ResourceCard = {
  title: string
  description: string
  icon: string
  tag: string
}

const RESOURCE_CARDS: ResourceCard[] = [
  {
    title: 'IONM Guidelines',
    description: 'Evidence-based protocols and alert criteria for all major modalities.',
    icon: '📋',
    tag: 'Coming soon',
  },
  {
    title: 'Case Library',
    description: 'Curated intraoperative cases with waveform analysis and discussion.',
    icon: '🗂️',
    tag: 'Coming soon',
  },
  {
    title: 'Video Library',
    description: 'Procedural walkthroughs, electrode placement guides, and lectures.',
    icon: '🎬',
    tag: 'Coming soon',
  },
]

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function ResourcesPage() {
  const weeklyCase = getCurrentWeeklyCase()

  // Check if the current user has already answered this week's case
  let priorAnswer: PriorAnswer | undefined
  try {
    const supabase = createClient()
    const admin = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (admin.from('weekly_case_answers') as any)
        .select('selected_index, is_correct, xp_earned')
        .eq('user_id', user.id)
        .eq('case_id', weeklyCase.id)
        .maybeSingle()

      if (data) {
        priorAnswer = {
          selectedIndex: data.selected_index,
          isCorrect: data.is_correct,
          xpEarned: data.xp_earned,
        }
      }
    }
  } catch {
    // Non-fatal: missing table or auth error — show unanswered state
  }

  return (
    <div className="flex flex-col gap-10 max-w-3xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white">Resources</h1>
        <p className="font-body text-sm text-muted mt-1">
          Weekly case drops, guidelines, and reference materials.
        </p>
      </div>

      {/* Weekly Case Drop */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <p className="font-body text-xs text-muted uppercase tracking-widest">Weekly case drop</p>
          <span className="font-heading text-[10px] px-2 py-0.5 rounded-full bg-orange/20 text-orange border border-orange/30">
            {weeklyCase.week}
          </span>
        </div>

        <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col gap-5">
          {/* Case header */}
          <div className="flex flex-col gap-1">
            <p className="font-heading text-xl text-white">{weeklyCase.title}</p>
            <p className="font-body text-xs text-teal">{weeklyCase.specialty}</p>
          </div>

          {/* Interactive quiz */}
          <WeeklyCaseQuiz weeklyCase={weeklyCase} priorAnswer={priorAnswer} />
        </div>
      </section>

      {/* Resource cards */}
      <section>
        <p className="font-body text-xs text-muted uppercase tracking-widest mb-4">
          Reference library
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {RESOURCE_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-navy border border-[rgba(255,255,255,0.08)] rounded-xl p-5 flex flex-col gap-3 opacity-70"
            >
              <span className="text-2xl">{card.icon}</span>
              <div className="flex flex-col gap-1">
                <p className="font-heading text-sm text-white">{card.title}</p>
                <p className="font-body text-xs text-muted leading-relaxed">{card.description}</p>
              </div>
              <span className="self-start font-heading text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-muted border border-[rgba(255,255,255,0.08)]">
                {card.tag}
              </span>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
