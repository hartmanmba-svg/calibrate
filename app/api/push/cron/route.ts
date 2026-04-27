// Vercel Cron handler — runs daily at 19:00 UTC.
// Sends streak reminders to subscribed users who haven't reviewed today.
// On Mondays also sends a weekly case nudge to all subscribers.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'
import { getISOWeekKey } from '@/lib/weekly-case'
import type { StoredSubscription } from '@/lib/push'

type SubscriptionRow = StoredSubscription & { user_id: string }

export async function GET(request: Request): Promise<NextResponse> {
  // Validate Vercel cron secret when set (prevents unauthorized triggers)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const isMonday = new Date().getUTCDay() === 1

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subs } = await (admin.from('push_subscriptions') as any)
    .select('user_id, endpoint, p256dh, auth')

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Fetch last_review_date for all subscribed users in one query
  const userIds = Array.from(new Set((subs as SubscriptionRow[]).map((s) => s.user_id)))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (admin.from('profiles') as any)
    .select('id, last_review_date, streak')
    .in('id', userIds)

  const profileMap = new Map(
    ((profiles as { id: string; last_review_date: string | null; streak: number }[]) ?? [])
      .map((p) => [p.id, p])
  )

  let sent = 0
  const expired: string[] = []

  for (const sub of subs as SubscriptionRow[]) {
    const profile = profileMap.get(sub.user_id)

    // ── Streak reminder: user hasn't reviewed today ──────────────
    const hasReviewedToday = profile?.last_review_date === today
    if (!hasReviewedToday) {
      const streak = profile?.streak ?? 0
      const streakText = streak > 1 ? ` Keep your ${streak}-day streak alive!` : ''
      const ok = await sendPush(sub, {
        title: 'Time to review 🧠',
        body: `Cards are waiting for you.${streakText}`,
        url: '/study/flashcards',
      })
      if (ok) sent++
      else { expired.push(sub.endpoint); continue }
    }

    // ── Monday: weekly case drop nudge ──────────────────────────
    if (isMonday) {
      const weekKey = getISOWeekKey()
      const ok = await sendPush(sub, {
        title: 'New case drop 📋',
        body: `This week's IONM case is live — ${weekKey}. Can you get it right?`,
        url: '/resources',
      })
      if (ok) sent++
      else expired.push(sub.endpoint)
    }
  }

  // Remove subscriptions the push service says are gone
  if (expired.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('push_subscriptions') as any)
      .delete()
      .in('endpoint', Array.from(new Set(expired)))
  }

  return NextResponse.json({ ok: true, sent, expired: expired.length })
}
