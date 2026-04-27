// Calibrate Service Worker — Phase 4 PWA
const CACHE_NAME = 'calibrate-v1'

const PRECACHE_URLS = ['/study/flashcards', '/offline']

// ── Push notifications ───────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'Calibrate', body: 'Time to study!', url: '/study/flashcards' }
  try {
    if (event.data) Object.assign(data, JSON.parse(event.data.text()))
  } catch { /* malformed payload — use defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin))
      if (existing) return existing.focus().then((c) => c.navigate(url))
      return self.clients.openWindow(url)
    })
  )
})

// ── Install: pre-cache known pages ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Ignore pre-cache failures (e.g. page not reachable at install time)
      })
    })
  )
  self.skipWaiting()
})

// ── Activate: clean old caches ───────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first for API/navigation, cache-first for static ──
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle same-origin GET requests — POSTs (server actions, forms) must
  // always hit the network directly; caching their responses makes no sense and
  // serving the offline page for a failed POST breaks the client action handler.
  if (url.origin !== self.location.origin) return
  if (request.method !== 'GET') return

  // API calls — network only (never cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request))
    return
  }

  // Static assets — cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Navigation / HTML pages — network-first, fall back to cache then /offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached || caches.match('/offline')
        )
      )
  )
})
