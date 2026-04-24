'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const bytes = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i)
  }
  return bytes.buffer
}

type NotifState = 'unsupported' | 'default' | 'denied' | 'granted' | 'loading'

export function PushNotificationToggle() {
  const [state, setState] = useState<NotifState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState('unsupported')
      return
    }
    setState(Notification.permission as NotifState)
  }, [])

  async function handleEnable() {
    setError(null)
    setState('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission as NotifState)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setState('granted')
        setError('VAPID key not configured — notifications enabled in browser but server delivery unavailable.')
        return
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })

      setState('granted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications')
      setState(Notification.permission as NotifState)
    }
  }

  if (state === 'unsupported') {
    return (
      <p className="font-body text-sm text-muted">
        Your browser doesn&apos;t support push notifications.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-sm text-white">Push notifications</p>
          <p className="font-body text-xs text-muted mt-0.5">
            {state === 'granted'
              ? 'Enabled — you\'ll receive streak reminders and study nudges.'
              : state === 'denied'
                ? 'Blocked — update your browser settings to allow notifications.'
                : 'Get reminded to maintain your streak and review due cards.'}
          </p>
        </div>

        {/* Toggle pill */}
        <button
          onClick={state === 'granted' || state === 'denied' ? undefined : handleEnable}
          disabled={state === 'loading' || state === 'denied'}
          aria-label="Toggle push notifications"
          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200
            ${state === 'granted' ? 'bg-green cursor-default' : 'bg-[rgba(255,255,255,0.12)] cursor-pointer'}
            ${state === 'denied' || state === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200
              ${state === 'granted' ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {state === 'loading' && (
        <p className="font-body text-xs text-muted">Requesting permission…</p>
      )}

      {error && (
        <p className="font-body text-xs text-red">{error}</p>
      )}

      {state === 'default' && (
        <button
          onClick={handleEnable}
          className="self-start font-heading text-sm px-5 py-2 rounded-xl bg-orange text-white hover:bg-orange/90 transition cursor-pointer"
        >
          Enable notifications
        </button>
      )}
    </div>
  )
}
