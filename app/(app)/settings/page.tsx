import { createClient } from '@/lib/supabase/server'
import { PushNotificationToggle } from './components/PushNotificationToggle'
import { BillingPortalButton } from './components/BillingPortalButton'
import { getSubscription } from '@/lib/subscription'
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/supabase/types'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const uid = user?.id ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', uid)
    .maybeSingle()

  const email = profile?.email ?? user?.email ?? '—'

  const sub = await getSubscription(uid)

  const PLAN_LABELS: Record<SubscriptionPlan, string> = {
    monthly: 'Monthly',
    annual: 'Annual',
    team: 'Team',
  }

  const STATUS_STYLES: Record<SubscriptionStatus, { label: string; classes: string }> = {
    active:     { label: 'Active',     classes: 'border-green/30 bg-green/10 text-green' },
    trialing:   { label: 'Trial',      classes: 'border-teal/30 bg-teal/10 text-teal' },
    past_due:   { label: 'Past due',   classes: 'border-gold/30 bg-gold/10 text-gold' },
    canceled:   { label: 'Canceled',   classes: 'border-red/30 bg-red/10 text-red' },
    incomplete: { label: 'Incomplete', classes: 'border-muted/30 bg-muted/10 text-muted' },
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl text-white">Settings</h1>
        <p className="font-body text-sm text-muted mt-1">Manage your account and preferences.</p>
      </div>

      {/* Account section */}
      <section className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col gap-4">
        <p className="font-body text-xs text-muted uppercase tracking-widest">Account</p>
        <div className="flex flex-col gap-1">
          <p className="font-body text-xs text-muted">Email</p>
          <p className="font-body text-sm text-white">{email}</p>
        </div>
        <div>
          <p className="font-body text-xs text-muted">Password</p>
          <p className="font-body text-sm text-muted mt-0.5">Change password — coming soon</p>
        </div>
      </section>

      {/* Notifications section */}
      <section className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col gap-4">
        <p className="font-body text-xs text-muted uppercase tracking-widest">Notifications</p>
        <PushNotificationToggle />
      </section>

      {/* Subscription section */}
      <section className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col gap-4">
        <p className="font-body text-xs text-muted uppercase tracking-widest">Subscription</p>

        <div className="flex items-center gap-3 flex-wrap">
          <p className="font-heading text-base text-white">
            {sub.plan ? PLAN_LABELS[sub.plan] : 'Free'}
          </p>
          {sub.status && (
            <span className={`font-heading text-xs px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[sub.status].classes}`}>
              {STATUS_STYLES[sub.status].label}
            </span>
          )}
          {!sub.status && (
            <span className="font-heading text-xs px-2.5 py-0.5 rounded-full border border-muted/30 bg-muted/10 text-muted">
              Free plan
            </span>
          )}
        </div>

        {sub.isActive ? (
          <BillingPortalButton />
        ) : (
          <a
            href="/pricing"
            className="self-start font-heading text-sm px-5 py-2 rounded-xl bg-orange hover:bg-orange/90 text-white transition"
          >
            Upgrade
          </a>
        )}
      </section>

      {/* Danger zone */}
      <section className="bg-navy border border-red/20 rounded-2xl p-6 flex flex-col gap-4">
        <p className="font-body text-xs text-red uppercase tracking-widest">Danger zone</p>
        <div className="flex flex-col gap-2">
          <p className="font-body text-sm text-muted">
            Signing out will end your session on this device.
          </p>
          <a
            href="/auth/signout"
            className="self-start font-heading text-sm px-5 py-2 rounded-xl border border-red/40 text-red hover:bg-red/10 transition"
          >
            Sign out
          </a>
        </div>
      </section>

    </div>
  )
}
