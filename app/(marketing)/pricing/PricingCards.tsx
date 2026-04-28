'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckoutButton } from './CheckoutButton'

type BillingCycle = 'monthly' | 'annual'

const FREE_FEATURES = [
  '20 flashcards total',
  'Basic spaced repetition (FSRS)',
  'XP & streak tracking',
]

const INDIVIDUAL_FEATURES = [
  'Unlimited flashcards across all 8 modalities',
  'OR Readiness score + all specialty scores',
  'National benchmark percentiles',
  'CE credit tracking & certificates',
  'Badge system & daily missions',
  'All case types (cervical, lumbar, cranial…)',
  'Weekly case drop',
  'Web push reminders',
]

const TEAM_FEATURES = [
  'Everything in the Individual plan',
  'Centralized employer dashboard',
  'Team readiness scores & benchmarks',
  'Staff progress tracking',
  'Bulk seat management & invitations',
  'Volume discount from seat 6 onwards',
  'Priority support',
]

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

export function PricingCards({
  user,
  currentPlan,
}: {
  user: { id: string } | null
  currentPlan: string | null
}) {
  const [cycle, setCycle] = useState<BillingCycle>('annual')

  const isAnnual = cycle === 'annual'

  return (
    <div className="flex flex-col items-center gap-8 w-full">

      {/* Toggle */}
      <div className="flex items-center gap-3">
        <span className={`font-body text-sm transition ${!isAnnual ? 'text-white' : 'text-muted'}`}>
          Monthly
        </span>
        <button
          onClick={() => setCycle(isAnnual ? 'monthly' : 'annual')}
          aria-label="Toggle billing cycle"
          className={`relative inline-flex h-7 w-13 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer
            ${isAnnual ? 'bg-teal' : 'bg-[rgba(255,255,255,0.15)]'}`}
          style={{ width: '3.25rem' }}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 mt-0.5 transform rounded-full bg-white shadow transition duration-200
              ${isAnnual ? 'translate-x-6' : 'translate-x-0.5'}`}
          />
        </button>
        <div className="flex items-center gap-2">
          <span className={`font-body text-sm transition ${isAnnual ? 'text-white' : 'text-muted'}`}>
            Annually
          </span>
          <span className="font-body text-xs text-teal bg-teal/10 border border-teal/30 px-2 py-0.5 rounded-full">
            Save up to 17%
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">

        {/* Free */}
        <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col">
          <div>
            <p className="font-heading text-lg text-white mb-1">Free</p>
            <p className="font-body text-xs text-muted mb-4">Get started with the basics, no card needed.</p>
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
                className="block w-full text-center font-heading py-3 rounded-xl text-sm
                  bg-dark border border-[rgba(255,255,255,0.10)] text-muted
                  hover:border-white/20 hover:text-white transition"
              >
                {currentPlan ? 'Dashboard' : 'Current plan'}
              </Link>
            ) : (
              <Link
                href="/signup"
                className="block w-full text-center font-heading py-3 rounded-xl text-sm
                  bg-dark border border-[rgba(255,255,255,0.10)] text-muted
                  hover:border-white/20 hover:text-white transition"
              >
                Get started free
              </Link>
            )}
          </div>
        </div>

        {/* Individual — highlighted */}
        <div className="bg-navy border-2 border-orange rounded-2xl p-6 flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="font-heading text-xs bg-orange text-white px-3 py-1 rounded-full whitespace-nowrap">
              Most popular
            </span>
          </div>
          <div>
            <p className="font-heading text-lg text-white mb-1">Individual</p>
            <p className="font-body text-xs text-muted mb-4">
              {isAnnual ? 'Best value — billed once a year.' : 'Full access, billed monthly.'}
            </p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl text-white">
                {isAnnual ? '$8.99' : '$12.99'}
              </span>
              <span className="font-body text-muted text-sm mb-1">/mo</span>
            </div>
            <p className="font-body text-xs text-muted mt-1">
              {isAnnual ? '$107.88 billed annually — save 31%' : 'Billed monthly'}
            </p>
          </div>
          <FeatureList features={INDIVIDUAL_FEATURES} />
          <div className="mt-auto pt-6">
            {currentPlan === 'monthly' || currentPlan === 'annual' ? (
              <div className="w-full text-center font-heading py-3 rounded-xl
                bg-teal/10 border border-teal/30 text-teal text-sm">
                Current plan
              </div>
            ) : (
              <CheckoutButton
                plan={isAnnual ? 'annual' : 'monthly'}
                label={isAnnual ? 'Start free trial' : 'Get started'}
                className="w-full font-heading py-3 rounded-xl text-sm
                  bg-orange hover:bg-orange/90 text-white transition"
              />
            )}
            {isAnnual && (
              <p className="font-body text-[11px] text-muted text-center mt-2">
                7-day free trial — no charge until trial ends
              </p>
            )}
          </div>
        </div>

        {/* Teams */}
        <div className="bg-navy border border-[rgba(255,255,255,0.10)] rounded-2xl p-6 flex flex-col">
          <div>
            <p className="font-heading text-lg text-white mb-1">Teams</p>
            <p className="font-body text-xs text-muted mb-4">For employers managing IONM staff.</p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl text-white">
                {isAnnual ? '$99.99' : '$9.99'}
              </span>
              <span className="font-body text-muted text-sm mb-1">
                {isAnnual ? '/seat/yr' : '/seat/mo'}
              </span>
            </div>
            <p className="font-body text-xs text-muted mt-1">
              {isAnnual ? '$8.33/seat/mo — save 17%' : 'Billed monthly per seat'}
            </p>
          </div>
          <FeatureList features={TEAM_FEATURES} />
          <div className="mt-auto pt-6">
            {currentPlan === 'team_monthly' || currentPlan === 'team_annual' || currentPlan === 'team' ? (
              <div className="w-full text-center font-heading py-3 rounded-xl
                bg-teal/10 border border-teal/30 text-teal text-sm">
                Current plan
              </div>
            ) : (
              <CheckoutButton
                plan={isAnnual ? 'team_annual' : 'team_monthly'}
                label="Get started"
                className="w-full font-heading py-3 rounded-xl text-sm
                  bg-dark border border-[rgba(255,255,255,0.10)] text-white
                  hover:border-white/20 transition"
              />
            )}
            <p className="font-body text-[11px] text-muted text-center mt-2">
              Volume discount from seat 6 onwards
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
