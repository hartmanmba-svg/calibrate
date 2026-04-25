import { createClient } from '@/lib/supabase/server'
import type { SubscriptionStatus, SubscriptionPlan } from '@/lib/supabase/types'

export type SubInfo = {
  plan: SubscriptionPlan | null
  status: SubscriptionStatus | null
  isActive: boolean   // status === 'active' || 'trialing'
  isFree: boolean     // no active subscription
}

export async function getSubscription(userId: string): Promise<SubInfo> {
  const supabase = createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle()

  const status = data?.status ?? null
  const plan = data?.plan ?? null
  const isActive = status === 'active' || status === 'trialing'
  return { plan, status, isActive, isFree: !isActive }
}
