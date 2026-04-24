import { createClient } from '@/lib/supabase/server'
import { seedCards } from '@/app/actions/seed'
import type { Modality } from '@/lib/supabase/types'

// ----------------------------------------------------------------
// Modality display config
// ----------------------------------------------------------------

const MODALITY_META: Record<Modality, { label: string; description: string; icon: string }> = {
  ssep:          { label: 'SSEP',         description: 'Somatosensory Evoked Potentials', icon: '🧠' },
  mep:           { label: 'MEP',          description: 'Motor Evoked Potentials',          icon: '⚡' },
  emg_free:      { label: 'EMG Free',     description: 'Free-Running EMG',                 icon: '📈' },
  emg_triggered: { label: 'EMG Trig.',    description: 'Triggered EMG',                    icon: '🔌' },
  eeg:           { label: 'EEG',          description: 'Electroencephalography',            icon: '🌊' },
  baep:          { label: 'BAEP',         description: 'Brainstem Auditory Evoked',         icon: '👂' },
  vep:           { label: 'VEP',          description: 'Visual Evoked Potentials',          icon: '👁️' },
  dwave:         { label: 'D-Wave',       description: 'Direct Wave Monitoring',            icon: '📡' },
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function StudyPage() {
  // Ensure seed cards exist — no-op if the table already has rows.
  // Silently swallows errors (missing env vars in local dev, etc.)
  try { await seedCards() } catch { /* ignore */ }

  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  // No redirect — middleware handles unauthenticated users.
  const uid = user?.id ?? ''

  // Total card count per modality
  const { data: allCards } = await supabase
    .from('cards')
    .select('modality')

  const totalByModality = (allCards ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.modality] = (acc[c.modality] ?? 0) + 1
    return acc
  }, {})

  // Due card_ids for this user
  const { data: dueReviews } = await supabase
    .from('card_reviews')
    .select('card_id')
    .eq('user_id', uid)
    .lte('due', new Date().toISOString())

  const dueCardIds = new Set((dueReviews ?? []).map((r) => r.card_id))

  // Due cards per modality — need to know modality of each due card
  // Query the cards for the due card_ids to get their modality
  let dueByModality: Record<string, number> = {}
  if (dueCardIds.size > 0) {
    const { data: dueCardRows } = await supabase
      .from('cards')
      .select('id, modality')
      .in('id', Array.from(dueCardIds))

    dueByModality = (dueCardRows ?? []).reduce<Record<string, number>>((acc, c) => {
      acc[c.modality] = (acc[c.modality] ?? 0) + 1
      return acc
    }, {})
  }

  const modalities = Object.keys(MODALITY_META) as Modality[]
  const totalDue = dueCardIds.size

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="font-heading text-3xl text-white">Study</h1>
        <p className="font-body text-sm text-muted mt-1">
          {totalDue > 0
            ? `${totalDue} card${totalDue === 1 ? '' : 's'} due across all decks`
            : 'All caught up — no cards due right now'}
        </p>
      </div>

      {/* ── Start session CTA ── */}
      <a
        href="/study/flashcards"
        className="block bg-orange hover:bg-orange/90 text-white font-heading text-lg text-center rounded-2xl py-5 transition"
      >
        {totalDue > 0 ? `Start Review Session (${totalDue} due)` : 'Study Ahead'}
      </a>

      {/* ── Modality deck grid ── */}
      <section>
        <h2 className="font-heading text-sm text-teal uppercase tracking-wider mb-4">
          Browse by modality
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {modalities.map((mod) => {
            const total = totalByModality[mod] ?? 0
            const due   = dueByModality[mod]   ?? 0
            const meta  = MODALITY_META[mod]
            if (total === 0) return null
            return (
              <a
                key={mod}
                href="/study/flashcards"
                className="bg-navy border border-[rgba(255,255,255,0.10)] hover:border-teal/50 rounded-xl p-4 flex flex-col gap-2 transition"
              >
                <span className="text-2xl">{meta.icon}</span>
                <p className="font-heading text-white text-base leading-tight">{meta.label}</p>
                <p className="font-body text-muted text-[11px] leading-snug">{meta.description}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-body text-xs text-muted">{total} cards</span>
                  {due > 0 && (
                    <span className="font-body text-[10px] bg-orange/15 text-orange px-2 py-0.5 rounded-full">
                      {due} due
                    </span>
                  )}
                </div>
              </a>
            )
          })}
        </div>
      </section>

    </div>
  )
}
