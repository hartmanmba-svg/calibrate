'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function startModule(moduleId: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('ce_completions')
    .upsert(
      { user_id: user.id, module_id: moduleId, progress: 0.5 },
      { onConflict: 'user_id,module_id', ignoreDuplicates: false }
    )

  if (error) return { error: error.message }
  revalidatePath('/ce-credits')
  return { error: null }
}

export async function completeModule(moduleId: string): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('ce_completions')
    .upsert(
      {
        user_id: user.id,
        module_id: moduleId,
        progress: 1.0,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,module_id', ignoreDuplicates: false }
    )

  if (error) return { error: error.message }
  revalidatePath('/ce-credits')
  return { error: null }
}
