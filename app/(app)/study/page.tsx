import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { seedCards } from '@/app/actions/seed'

// ----------------------------------------------------------------
// Deck icon lookup (matches names stored in the decks table)
// ----------------------------------------------------------------

const DECK_ICONS: Record<string, string> = {
  'ssep':                 '🧠',
  'mep':                  '⚡',
  'emg':                  '📈',
  'eeg':                  '🌊',
  'abr':                  '👂',
  'baep':                 '👂',
  'vep':                  '👁️',
  'd-wave':               '📡',
  'dwave':                '📡',
  'ionm fundamentals':    '📚',
  'neuroanatomy':         '🔬',
}

function deckIcon(name: string): string {
  return DECK_ICONS[name.toLowerCase()] ?? '🗂️'
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function StudyPage() {
  // Ensure seed cards exist — no-op if the table already has rows.
  try { await seedCards() } catch { /* ignore */ }

  // User session (for due-card counts only)
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? ''

  // Global content — use admin client to bypass RLS
  const admin = createAdminClient()

  // Fetch all decks
  const { data: decks } = await admin
    .from('decks')
    .select('id, name, description')
    .order('name')

  // Fetch card counts per deck
  const { data: allCards } = await admin
    .from('cards')
    .select('id, deck_id')

  const countByDeck = (allCards ?? []).reduce<Record<string, number>>((acc, c) => {
    if (c.deck_id) acc[c.deck_id] = (acc[c.deck_id] ?? 0) + 1
    return acc
  }, {})

  // Due cards for this user
  const { data: dueReviews } = await supabase
    .from('card_reviews')
    .select('card_id')
    .eq('user_id', uid)
    .lte('due', new Date().toISOString())

  const dueCardIds = new Set((dueReviews ?? []).map((r) => r.card_id))

  // Due count per deck — join in-memory against allCards
  const dueByDeck: Record<string, number> = {}
  if (dueCardIds.size > 0) {
    ;(allCards ?? []).forEach((c) => {
      if (c.deck_id && dueCardIds.has(c.id)) {
        dueByDeck[c.deck_id] = (dueByDeck[c.deck_id] ?? 0) + 1
      }
    })
  }

  const totalDue = dueCardIds.size
  const deckList = decks ?? []

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

      {/* ── Deck grid ── */}
      <section>
        <h2 className="font-heading text-sm text-teal uppercase tracking-wider mb-4">
          Browse by deck
        </h2>

        {deckList.length === 0 ? (
          <p className="font-body text-sm text-muted">No decks found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {deckList.map((deck) => {
              const total = countByDeck[deck.id] ?? 0
              const due   = dueByDeck[deck.id]   ?? 0
              return (
                <a
                  key={deck.id}
                  href="/study/flashcards"
                  className="bg-navy border border-[rgba(255,255,255,0.10)] hover:border-teal/50 rounded-xl p-4 flex flex-col gap-2 transition"
                >
                  <span className="text-2xl">{deckIcon(deck.name)}</span>
                  <p className="font-heading text-white text-base leading-tight">{deck.name}</p>
                  {deck.description && (
                    <p className="font-body text-muted text-[11px] leading-snug line-clamp-2">
                      {deck.description}
                    </p>
                  )}
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
        )}
      </section>

    </div>
  )
}
