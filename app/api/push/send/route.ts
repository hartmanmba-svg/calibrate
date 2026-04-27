// Internal-only route for sending a push to the current authenticated user.
// Useful for testing; production sends go through /api/push/cron.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPush } from '@/lib/push'
import type { PushPayload, StoredSubscription } from '@/lib/push'

export async function POST(request: Request): Promise<NextResponse> {
  let payload: PushPayload | null = null
  try {
    const raw = await request.json()
    if (typeof raw?.title === 'string' && typeof raw?.body === 'string') {
      payload = { title: raw.title, body: raw.body, url: raw.url }
    }
  } catch {
    // fall through
  }

  if (!payload) {
    return NextResponse.json({ error: 'Body must include title: string and body: string' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subs } = await (admin.from('push_subscriptions') as any)
    .select('endpoint, p256dh, auth')
    .eq('user_id', user.id)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: 'No subscriptions for this user' })
  }

  let sent = 0
  const expired: string[] = []

  for (const sub of subs as StoredSubscription[]) {
    const ok = await sendPush(sub, payload)
    if (ok) sent++
    else expired.push(sub.endpoint)
  }

  // Remove expired subscriptions
  if (expired.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('push_subscriptions') as any)
      .delete()
      .in('endpoint', expired)
  }

  return NextResponse.json({ ok: true, sent, expired: expired.length })
}
