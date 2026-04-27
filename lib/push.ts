// Shared web-push delivery helper used by /api/push/send and /api/push/cron.
// Throws if VAPID env vars are missing.

import webpush from 'web-push'

let configured = false

function configure() {
  if (configured) return
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subj = process.env.VAPID_SUBJECT
  if (!pub || !priv || !subj) {
    throw new Error('VAPID env vars not set (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT)')
  }
  webpush.setVapidDetails(subj, pub, priv)
  configured = true
}

export type PushPayload = {
  title: string
  body: string
  url?: string
}

export type StoredSubscription = {
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Send a push notification to a single stored subscription.
 * Returns true on success, false if the subscription is expired/invalid (410).
 * Re-throws on unexpected errors.
 */
export async function sendPush(
  sub: StoredSubscription,
  payload: PushPayload
): Promise<boolean> {
  configure()
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    )
    return true
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    // 404 / 410 means the subscription is gone — caller should delete it
    if (status === 404 || status === 410) return false
    throw err
  }
}
