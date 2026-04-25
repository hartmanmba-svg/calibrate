'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createEmployer(formData: FormData): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  const name = formData.get('name') as string
  const seatCountRaw = formData.get('seat_count') as string

  if (!name || name.trim().length === 0) {
    return { error: 'Company name is required' }
  }

  const seatCount = parseInt(seatCountRaw, 10)
  if (isNaN(seatCount) || seatCount < 1) {
    return { error: 'Invalid seat count' }
  }

  const admin = createAdminClient()

  // Check if user is already an employer admin
  const { data: existing } = await admin
    .from('employers')
    .select('id')
    .eq('admin_user_id', user.id)
    .maybeSingle()

  if (existing) {
    return { error: 'You already have an employer account' }
  }

  const { error: insertError } = await admin
    .from('employers')
    .insert({
      name: name.trim(),
      seat_count: seatCount,
      admin_user_id: user.id,
    })

  if (insertError) {
    return { error: insertError.message }
  }

  return { error: null }
}
