'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CareerStage } from '@/lib/supabase/types'

const VALID_STAGES: CareerStage[] = ['student', 'candidate', 'certified', 'supervisor']

export async function saveCareerStage(stage: CareerStage): Promise<{ error: string | null }> {
  if (!VALID_STAGES.includes(stage)) {
    return { error: 'Invalid career stage.' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const admin = createAdminClient()

  // Try UPDATE first — profile row likely already exists with career_stage null
  const { error: updateError, data: updated } = await admin
    .from('profiles')
    .update({ career_stage: stage })
    .eq('id', user.id)
    .select('id')

  if (updateError) {
    return { error: `Update failed: ${updateError.message}` }
  }

  // If no row was updated, INSERT a new one
  if (!updated || updated.length === 0) {
    const { error: insertError } = await admin
      .from('profiles')
      .insert({ id: user.id, email: user.email ?? '', career_stage: stage })

    if (insertError) {
      return { error: `Insert failed: ${insertError.message}` }
    }
  }

  return { error: null }
}
