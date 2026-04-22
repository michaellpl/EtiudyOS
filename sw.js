// EtiudyOS Service Worker
const CACHE_NAME = 'etiudyos-v1';

// On install - cache nothing, just activate immediately
// (app pulls live data from APIs so we don't cache aggressively)
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first strategy: always try network, fall back to cache for the shell
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Don't intercept Google API calls, OAuth, or external resources
  if (
    url.hostname.includes('google') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('open-meteo') ||
    url.hostname.includes('generativelanguage') ||
    url.hostname.includes('accounts.google') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // For the main HTML shell — network first, cache fallback
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
