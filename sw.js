const CACHE_NAME = 'etiudyos-cache-v1';
// Lista podstawowych plików do działania offline
const ASSETS_TO_CACHE = [
  '/EtiudyOS/',
  '/EtiudyOS/index.html',
  '/EtiudyOS/manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// 1. Instalacja i buforowanie plików statycznych
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Buforowanie plików aplikacji');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Aktywacja i czyszczenie starych cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Usuwanie starego cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Przechwytywanie zapytań
self.addEventListener('fetch', event => {
  const requestUrl = event.request.url;

  // Ignorujemy zapytania do zewnętrznych API (Google, Pogoda) 
  // Chcemy, aby aplikacja zawsze próbowała pobrać najświeższe dane z sieci, jeśli to możliwe
  if (requestUrl.includes('googleapis.com') || requestUrl.includes('open-meteo.com') || requestUrl.includes('generativelanguage.googleapis.com')) {
    return;
  }

  // Strategia: Cache First (Najpierw pamięć, potem sieć) dla plików aplikacji
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse; // Zwróć plik z cache (działa offline!)
      }
      return fetch(event.request); // Pobierz z sieci
    })
  );
});
