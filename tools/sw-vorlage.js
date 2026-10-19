// Service Worker: speichert alle Dateien der App für den Offline-Betrieb. Wird von tools/baue.mjs erzeugt.
const VERSION = '__VERSION__';
const DATEIEN = __DATEIEN__;
const CACHE = 'lernwelt-' + VERSION;

self.addEventListener('install', (e) => {
  // cache: 'reload' umgeht den HTTP-Cache, damit wirklich die neue Version gespeichert wird.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN.map((d) => new Request(d, { cache: 'reload', credentials: 'same-origin' })))));
});
// Neue Version erst übernehmen, wenn die App es verlangt (nie mitten in einer Sitzung).
self.addEventListener('message', (e) => { if (e.data === 'aktivieren') self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('lernwelt-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const basis = new URL('./', self.registration.scope).pathname;
  if (url.pathname.startsWith(basis + 'api/')) return;   // Abgleich und Anmeldung immer übers Netz (Cloudflare Access)
  if (e.request.mode === 'navigate') {
    // Seitenaufruf: immer die gespeicherte Startseite, sonst Netz.
    e.respondWith(caches.match('./', { ignoreSearch: true }).then((r) => r || fetch(e.request)).catch(() => Response.error()));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((antwort) => {
    if (antwort.ok && !antwort.redirected && url.pathname.startsWith(basis)) {
      const kopie = antwort.clone();
      caches.open(CACHE).then((c) => c.put(e.request, kopie));
    }
    return antwort;
  })));
});
