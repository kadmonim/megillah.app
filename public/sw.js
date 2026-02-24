const CACHE_NAME = 'megillah-v1';

const PRECACHE_URLS = [
  '/',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Cache sounds and translations on first use
const RUNTIME_CACHE_PATTERNS = [
  /\/sounds\//,
  /\/translations\//,
  /\/illustrations\//,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and Supabase calls
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase')) return;

  // HTML pages: network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets with hashed filenames (Astro bundles): cache-first
  if (url.pathname.match(/\/_astro\//)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetchAndCache(event.request))
    );
    return;
  }

  // Sounds, translations, illustrations, fonts: cache-first
  if (RUNTIME_CACHE_PATTERNS.some((pattern) => pattern.test(event.request.url))) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetchAndCache(event.request))
    );
    return;
  }

  // Everything else: network-first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

function fetchAndCache(request) {
  return fetch(request).then((response) => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
    }
    return response;
  });
}
