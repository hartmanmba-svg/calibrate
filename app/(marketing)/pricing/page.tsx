import { createClient } from '@/lib/supabase/server'
import { CheckoutButton } from './CheckoutButton'
import Link from 'next/link'

// ----------------------------------------------------------------
// Feature lists
// ----------------------------------------------------------------

const TEAM_FEATURES = [
  'Everything in the individual plan',
  'Centralized employer dashboard',
  'Team readiness scores & benchmarks',
  'Staff progress tracking across all modalities',
  'Bulk seat management & invitations',
  'Priority support',
]

const FREE_FEATURES = [
  '20 flashcards total',
  'Basic spaced repetition (FSRS)',
  'XP & streak tracking',
]

const PAID_FEATURES = [
  'Unlimited flashcards across all 8 modalities',
  'OR Readiness score + all specialty scores',
  'National benchmark percentiles',
  'CE credit tracking & certificates',
  'Badge system & daily missions',
  'All case types (cervical, lumbar, cranial…)',
]

// ----------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-teal flex-shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5 mt-6">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <CheckIcon />
          <span className="font-body text-sm text-muted">{f}</span>
        </li>
      ))}
    </ul>
  )
}

// ----------------------------------------------------------------
// Page
// ----------------------------------------------------------------

export default async function PricingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    <div className="flex flex-col items-center gap-12">
      {/* Header */}
      <div className="text-center max-w-xl">
        <h1 className="font-heading text-4xl text-white">
          Simple, transparent pricing
        </h1>
        <p className="font-body text-muted mt-3">
          Start free. Upgrade when you&apos;re ready to go all-in on your IONM career.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">

        {/* Free */}
        <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col">
          <div>
            <p className="font-body text-xs text-muted uppercase tracking-widest mb-3">Free</p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl text-white">$0</span>
              <span className="font-body text-muted text-sm mb-1">/mo</span>
            </div>
            <p className="font-body text-xs text-muted mt-1">No credit card required</p>
          </div>
          <FeatureList features={FREE_FEATURES} />
          <div className="mt-auto pt-6">
            {user ? (
              <Link
                href="/dashboard"
                className="block w-full text-center font-heading py-3 rounded-xl
                  bg-dark border border-[rgba(255,255,255,0.10)] text-muted
                  hover:border-white/20 hover:text-white transition text-sm"
              >
                {currentPlan ? 'Dashboard' : 'Current plan'}
              </Link>
            ) : (
              <Link
                href="/signup"
                className="block w-full text-center font-heading py-3 rounded-xl
                  bg-dark border border-[rgba(255,255,255,0.10)] text-muted
                  hover:border-white/20 hover:text-white transition text-sm"
              >
                Get started free
              </Link>
            )}
          </div>
        </div>

        {/* Monthly */}
        <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col">
          <div>
            <p className="font-body text-xs text-muted uppercase tracking-widest mb-3">Monthly</p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl text-white">$12.99</span>
              <span className="font-body text-muted text-sm mb-1">/mo</span>
            </div>
            <p className="font-body text-xs text-muted mt-1">Billed monthly</p>
          </div>
          <FeatureList features={PAID_FEATURES} />
          <div className="mt-auto pt-6">
            {currentPlan === 'monthly' ? (
              <div className="w-full text-center font-heading py-3 rounded-xl
                bg-teal/10 border border-teal/30 text-teal text-sm">
                Current plan
              </div>
            ) : (
              <CheckoutButton
                plan="monthly"
                label="Get started"
                className="w-full font-heading py-3 rounded-xl text-sm
                  bg-dark border border-[rgba(255,255,255,0.10)] text-white
                  hover:border-white/20 transition"
              />
            )}
          </div>
        </div>

        {/* Annual — highlighted */}
        <div className="bg-navy border-2 border-orange rounded-2xl p-6 flex flex-col relative">
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="font-heading text-xs bg-orange text-white px-3 py-1 rounded-full whitespace-nowrap">
              Most popular
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="font-body text-xs text-muted uppercase tracking-widest">Annual</p>
              <span className="font-body text-[10px] text-gold bg-gold/10 border border-gold/30
                px-2 py-0.5 rounded-full">
                7-day free trial
              </span>
            </div>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl text-white">$8.99</span>
              <span className="font-body text-muted text-sm mb-1">/mo</span>
            </div>
            <p className="font-body text-xs text-muted mt-1">
              $107.88 billed annually — save 40%
            </p>
          </div>
          <FeatureList features={PAID_FEATURES} />
          <div className="mt-auto pt-6">
            {currentPlan === 'annual' ? (
              <div className="w-full text-center font-heading py-3 rounded-xl
                bg-teal/10 border border-teal/30 text-teal text-sm">
                Current plan
              </div>
            ) : (
              <CheckoutButton
                plan="annual"
                label="Start free trial"
                className="w-full font-heading py-3 rounded-xl text-sm
                  bg-orange hover:bg-orange/90 text-white transition"
              />
            )}
          </div>
        </div>

      </div>

      {/* Teams */}
      <div className="w-full max-w-3xl">
        <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1">
            <p className="font-body text-xs text-muted uppercase tracking-widest mb-3">Teams</p>
            <div className="flex items-end gap-1 mb-1">
              <span className="font-heading text-4xl text-white">$9.99</span>
              <span className="font-body text-muted text-sm mb-1">/seat/mo</span>
            </div>
            <p className="font-body text-xs text-muted">Billed monthly per practitioner</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6">
              {TEAM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckIcon />
                  <span className="font-body text-sm text-muted">{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:w-48 flex flex-col gap-3">
            {currentPlan === 'team' ? (
              <div className="w-full text-center font-heading py-3 rounded-xl
                bg-teal/10 border border-teal/30 text-teal text-sm">
                Current plan
              </div>
            ) : (
              <CheckoutButton
                plan="team"
                label="Get started"
                className="w-full font-heading py-3 rounded-xl text-sm
                  bg-orange hover:bg-orange/90 text-white transition"
              />
            )}
            <p className="font-body text-[11px] text-muted text-center">
              Minimum 2 seats. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="font-body text-xs text-muted text-center max-w-md">
        All plans include a 30-day money-back guarantee. Cancel anytime.
        Annual plan starts with a 7-day free trial — no charge until the trial ends.
      </p>
    </div>
  )
}
