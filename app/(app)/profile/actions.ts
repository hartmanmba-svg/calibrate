'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CareerStage } from '@/lib/supabase/types'

const VALID_STAGES: CareerStage[] = ['student', 'candidate', 'certified', 'supervisor']

export async function updateProfile(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fullName    = (formData.get('full_name')    as string | null)?.trim() || null
  const careerStage = formData.get('career_stage')  as string | null

  if (careerStage && !VALID_STAGES.includes(careerStage as CareerStage)) {
    return { error: 'Invalid career stage' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name:    fullName,
      career_stage: (careerStage as CareerStage) ?? undefined,
      updated_at:   new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { error: null }
}
