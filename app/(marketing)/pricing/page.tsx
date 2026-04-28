import { createClient } from '@/lib/supabase/server'
import { PricingCards } from './PricingCards'

export default async function PricingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentPlan: string | null = null
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .maybeSingle()
    if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
      currentPlan = sub.plan
    }
  }

  return (
    <div className="flex flex-col items-center gap-12 py-4">
      {/* Header */}
      <div className="text-center max-w-xl">
        <h1 className="font-heading text-4xl text-white">
          Simple, transparent pricing
        </h1>
        <p className="font-body text-muted mt-3">
          Start free. Upgrade when you&apos;re ready to go all-in on your IONM career.
        </p>
      </div>

      <PricingCards user={user} currentPlan={currentPlan} />

      <p className="font-body text-xs text-muted text-center max-w-md">
        All plans include a 30-day money-back guarantee. Cancel anytime.
      </p>
    </div>
  )
}
