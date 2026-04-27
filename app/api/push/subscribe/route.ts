import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type PushSubscriptionBody = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: { subscription: PushSubscriptionBody } | null = null
  try {
    const raw = await request.json()
    if (
      typeof raw?.subscription?.endpoint === 'string' &&
      typeof raw?.subscription?.keys?.p256dh === 'string' &&
      typeof raw?.subscription?.keys?.auth === 'string'
    ) {
      body = raw
    }
  } catch {
    // fall through to 400
  }

  if (!body) {
    return NextResponse.json({ error: 'Invalid subscription payload' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { endpoint, keys: { p256dh, auth } } = body.subscription

  // Upsert — if user re-subscribes on the same endpoint the keys are refreshed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin.from('push_subscriptions') as any).upsert(
    { user_id: user.id, endpoint, p256dh, auth },
    { onConflict: 'user_id,endpoint' }
  )

  if (error) {
    console.error('push_subscriptions upsert error', error)
    return NextResponse.json({ error: 'Failed to store subscription' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
