'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { totalXpForLevel } from '@/lib/xp'

const XP_CORRECT   = 100
const XP_INCORRECT = 25

export type SubmitWeeklyCaseResult = {
  xpEarned: number
  newLevel: number
  oldLevel: number
  alreadyAnswered: boolean
}

export async function submitWeeklyCaseAnswer(
  caseId: string,
  selectedIndex: number,
  isCorrect: boolean
): Promise<SubmitWeeklyCaseResult> {
  const supabase = createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Idempotency: return early if user already answered this case
  const { data: existing } = await admin
    .from('weekly_case_answers')
    .select('id, xp_earned, is_correct')
    .eq('user_id', user.id)
    .eq('case_id', caseId)
    .maybeSingle()

  if (existing) {
    return { xpEarned: 0, newLevel: 1, oldLevel: 1, alreadyAnswered: true }
  }

  const xpEarned = isCorrect ? XP_CORRECT : XP_INCORRECT

  // Record the answer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('weekly_case_answers') as any).insert({
    user_id: user.id,
    case_id: caseId,
    selected_index: selectedIndex,
    is_correct: isCorrect,
    xp_earned: xpEarned,
  })

  // Award XP
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await admin
    .from('profiles')
    .select('xp, level')
    .eq('id', user.id)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profileRaw as any
  const oldXp    = (p?.xp    ?? 0) as number
  const oldLevel = (p?.level ?? 1) as number
  const newXp    = oldXp + xpEarned

  let newLevel = oldLevel
  while (newXp >= totalXpForLevel(newLevel + 1)) newLevel++

  await admin
    .from('profiles')
    .update({ xp: newXp, level: newLevel, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  return { xpEarned, newLevel, oldLevel, alreadyAnswered: false }
}
