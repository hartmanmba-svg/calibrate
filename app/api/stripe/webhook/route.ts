import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/supabase/types'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/** Map Stripe subscription status → our DB enum (best-effort) */
function toSubStatus(stripeStatus: string): SubscriptionStatus {
  const valid: SubscriptionStatus[] = ['active', 'trialing', 'past_due', 'canceled', 'incomplete']
  return valid.includes(stripeStatus as SubscriptionStatus)
    ? (stripeStatus as SubscriptionStatus)
    : 'incomplete'
}

// ----------------------------------------------------------------
// POST /api/stripe/webhook
// ----------------------------------------------------------------

export async function POST(request: NextRequest) {
  const rawBody = Buffer.from(await request.arrayBuffer())
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  // ── Event handlers ────────────────────────────────────────────

  switch (event.type) {

    // ── Checkout completed ──────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      const plan = (session.metadata?.plan ?? 'monthly') as SubscriptionPlan

      if (!userId) break

      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? null

      const subId = typeof session.subscription === 'string'
        ? session.subscription
        : null

      if (!subId) break

      const sub = await stripe.subscriptions.retrieve(subId, {
        expand: ['items'],
      })
      const periodEnd = sub.items.data[0]?.current_period_end ?? null

      await admin.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          plan,
          status: toSubStatus(sub.status),
          current_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: now,
        },
        { onConflict: 'user_id' }
      )
      break
    }

    // ── Subscription updated ────────────────────────────────────
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const plan = (sub.metadata?.plan ?? 'monthly') as SubscriptionPlan
      // current_period_end lives on the item in API 2026+
      const periodEnd = sub.items.data[0]?.current_period_end ?? null

      await admin
        .from('subscriptions')
        .update({
          plan,
          status: toSubStatus(sub.status),
          current_period_end: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: now,
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    // ── Subscription canceled ───────────────────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription

      await admin
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: now,
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    // ── Payment failed ──────────────────────────────────────────
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice

      // In Stripe API 2026+, subscription moved to invoice.parent.subscription_details.subscription
      const rawSub = invoice.parent?.subscription_details?.subscription ?? null
      const subId = typeof rawSub === 'string' ? rawSub : rawSub?.id ?? null

      if (subId) {
        await admin
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: now })
          .eq('stripe_subscription_id', subId)
      }

      // Send warning email — look up user by customer ID
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : null

      if (customerId) {
        const { data: existingSub } = await admin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (existingSub?.user_id) {
          const { data: profile } = await admin
            .from('profiles')
            .select('email')
            .eq('id', existingSub.user_id)
            .maybeSingle()

          if (profile?.email) {
            // Lazy import so missing RESEND_API_KEY doesn't break unrelated routes at build time
            const { resend } = await import('@/lib/resend')
            await resend.emails.send({
              from: 'Calibrate <no-reply@calibrateapp.com>',
              to: profile.email,
              subject: 'Action required: your Calibrate payment failed',
              text: [
                'Hi,',
                '',
                'We were unable to process your Calibrate subscription payment.',
                'Please update your payment method to keep full access:',
                '',
                `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
                '',
                'If you need help, just reply to this email.',
                '',
                '— The Calibrate team',
              ].join('\n'),
            })
          }
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
