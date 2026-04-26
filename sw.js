// EtiudyOS Service Worker
// VERSION is bumped on every deploy — triggers update detection in Chrome
const VERSION = '2026-04-26T19-10';
const CACHE_NAME = 'etiudyos-' + VERSION;

// Install: skip waiting so new SW activates immediately
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate: delete old caches, claim clients, then notify them to reload
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // Tell all open tabs there's a new version
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'APP_UPDATED', version: VERSION }));
        });
      })
  );
});

// Network-first: always try network, fall back to cache for the shell
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Don't intercept Google APIs, OAuth, weather, AI, or non-GET
  if (
    url.hostname.includes('google') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('open-meteo') ||
    url.hostname.includes('generativelanguage') ||
    url.hostname.includes('accounts.google') ||
    url.hostname.includes('airly') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Allow client to tell a waiting SW to take over immediately
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
