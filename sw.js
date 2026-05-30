const CACHE = 'biswas-fisheries-v2';
const ASSETS = ['./index.html', './', './sw.js'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never cache Google Apps Script API calls — always try network
  if (url.includes('script.google.com')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({status:'offline'}), {
        headers: {'Content-Type': 'application/json'}
      }))
    );
    return;
  }

  // Cache-first strategy for app shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
