// Bumpa CACHE-versionen vid varje deploy som ändrar ohashade assets (public/assets/*) —
// cache-first servar annars gamla filer för evigt på enheter som redan besökt spelet.
const CACHE = 'ebbe-pokemon-v2'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
))

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone()
          caches.open(CACHE).then(c => c.put(e.request, copy))
          return res
        })
        .catch(() => caches.match(e.request))
    )
    return
  }

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(e.request)
      if (hit) return hit
      const res = await fetch(e.request)
      if (res.ok) cache.put(e.request, res.clone())
      return res
    })
  )
})
