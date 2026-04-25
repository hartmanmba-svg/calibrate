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
  const { error } = await admin
    .from('profiles')
    .upsert({ id: user.id, email: user.email ?? '', career_stage: stage })

  if (error) {
    return { error: `Failed to save: ${error.message}` }
  }

  return { error: null }
}
