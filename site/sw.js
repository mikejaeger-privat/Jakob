// Service Worker: speichert alle Dateien der App für den Offline-Betrieb. Wird von tools/baue.mjs erzeugt.
const VERSION = '20261019-f1c36c15';
const DATEIEN = ["./","./css/app.css","./data/buchstaben.json","./data/inhalte/deutsch/anweisungen.json","./data/inhalte/deutsch/bildergeschichten.json","./data/inhalte/deutsch/gegenteile.json","./data/inhalte/deutsch/geschichten.json","./data/inhalte/deutsch/hoersaetze.json","./data/inhalte/deutsch/lesetexte.json","./data/inhalte/deutsch/saetze.json","./data/inhalte/index.json","./data/katalog/deutsch.json","./data/katalog/mathe.json","./data/lehrmittel.json","./data/parameter.json","./data/schrift/basisschrift.json","./data/woerter.json","./data/ziele.json","./fonts/LIESMICH.txt","./fonts/OFL.txt","./fonts/lernwelt-schrift-bold.woff","./fonts/lernwelt-schrift-regular.woff","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512-maskable.png","./icons/icon-512.png","./icons/icon.svg","./js/app.js","./js/app/abgleich.js","./js/app/db.js","./js/app/inhalte.js","./js/app/klang.js","./js/app/lernen.js","./js/app/sprache.js","./js/app/steuerung.js","./js/app/zustand.js","./js/core/abgleich.js","./js/core/ablauf.js","./js/core/aufgabe.js","./js/core/kalender.js","./js/core/kasten.js","./js/core/lernen.js","./js/core/nachspur.js","./js/core/plan.js","./js/core/pruefen.js","./js/core/stand.js","./js/core/util.js","./js/deutsch/bu.js","./js/deutsch/hb.js","./js/deutsch/hv.js","./js/deutsch/index.js","./js/deutsch/le.js","./js/deutsch/lib.js","./js/deutsch/sc.js","./js/deutsch/ws.js","./js/math/fo.js","./js/math/gr.js","./js/math/index.js","./js/math/lib.js","./js/math/me.js","./js/math/re.js","./js/math/za.js","./js/math/ze.js","./js/ui/aufgabe.js","./js/ui/baustein.js","./js/ui/darstellung.js","./js/ui/dom.js","./js/ui/einfuehrung.js","./js/ui/einrichtung.js","./js/ui/eltern.js","./js/ui/figuren.js","./js/ui/kind.js","./js/ui/landschaft.js","./js/ui/sammelbild.js","./js/ui/schluss.js","./js/ui/sitzung.js","./js/ui/stimmtest.js","./js/ui/typen.js","./js/ui/zeigehand.js","./manifest.webmanifest"];
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
