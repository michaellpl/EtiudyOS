// EtiudyOS Service Worker — KILL SWITCH
// This SW immediately unregisters itself. Caching is handled by the browser natively.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
  );
});
