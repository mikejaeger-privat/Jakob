// IndexedDB: ein Schlüssel-Wert-Speicher «daten» und ein Protokoll «antworten». Der Abgleich zwischen Geräten (app/abgleich.js) liest und schreibt nur hier.
const NAME = 'lernwelt', VERSION = 1;
let dbPromise = null;

function oeffne() {
  if (!dbPromise) {
    dbPromise = new Promise((ok, fehler) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('daten')) db.createObjectStore('daten');
        if (!db.objectStoreNames.contains('antworten')) {
          const st = db.createObjectStore('antworten', { keyPath: 'nr', autoIncrement: true });
          st.createIndex('tag', 'tag');
        }
        const ant = req.transaction.objectStore('antworten');
        if (!ant.indexNames.contains('id')) ant.createIndex('id', 'id');
      };
      req.onsuccess = () => {
        const d = req.result;
        d.onclose = () => { dbPromise = null; };            // Safari schliesst Verbindungen im Hintergrund
        d.onversionchange = () => { d.close(); dbPromise = null; };
        ok(d);
      };
      req.onerror = () => { dbPromise = null; fehler(req.error); };
      req.onblocked = () => { dbPromise = null; fehler(new Error('Die Datenbank ist blockiert. Schliesse andere Fenster der Lernwelt.')); };
    });
  }
  return dbPromise;
}

// Bei verlorener Verbindung einmal neu öffnen und wiederholen
async function tx(store, modus, fn) {
  try { return await txEinmal(store, modus, fn); } catch (e) {
    if (['InvalidStateError', 'UnknownError', 'TransactionInactiveError'].includes(e?.name)) { dbPromise = null; return txEinmal(store, modus, fn); }
    throw e;
  }
}
function txEinmal(store, modus, fn) {
  return oeffne().then((db) => new Promise((ok, fehler) => {
    const t = db.transaction(store, modus);
    const st = t.objectStore(store);
    let ergebnis;
    Promise.resolve(fn(st)).then((r) => { ergebnis = r; });
    t.oncomplete = () => ok(ergebnis);
    t.onerror = () => fehler(t.error);
    t.onabort = () => fehler(t.error || new Error('Abgebrochen'));
  }));
}
const anfrage = (req) => new Promise((ok, fehler) => { req.onsuccess = () => ok(req.result); req.onerror = () => fehler(req.error); });

export const db = {
  async hole(schluessel) { return tx('daten', 'readonly', (st) => anfrage(st.get(schluessel))); },
  async setze(schluessel, wert) { return tx('daten', 'readwrite', (st) => { st.put(wert, schluessel); }); },
  async setzeViele(obj) { return tx('daten', 'readwrite', (st) => { for (const [k, v] of Object.entries(obj)) st.put(v, k); }); },
  async alleDaten() {
    return tx('daten', 'readonly', async (st) => {
      const [keys, vals] = await Promise.all([anfrage(st.getAllKeys()), anfrage(st.getAll())]);
      return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
    });
  },
  async antwort(eintrag) { return tx('antworten', 'readwrite', (st) => { st.add(eintrag); }); },
  async antwortenNach(nr) { return tx('antworten', 'readonly', (st) => anfrage(st.getAll(IDBKeyRange.lowerBound(nr, true)))); },
  // Antworten vom Abgleich: jede ID nur einmal (auch wenn dieselbe Antwort zweimal ankommt)
  async antwortenHinzu(liste) {
    return tx('antworten', 'readwrite', (st) => new Promise((ok) => {
      const idx = st.index('id'), da = new Set();
      let offen = liste.length, neu = 0;
      if (!offen) { ok(0); return; }
      for (const a of liste) {
        const r = idx.getKey(a.id);
        r.onsuccess = () => { if (r.result === undefined && !da.has(a.id)) { da.add(a.id); st.add(a); neu++; } if (--offen === 0) ok(neu); };
        r.onerror = () => { if (--offen === 0) ok(neu); };
      }
    }));
  },
  async antworten(abTag = null) {
    return tx('antworten', 'readonly', (st) => anfrage(abTag === null ? st.getAll() : st.index('tag').getAll(IDBKeyRange.lowerBound(abTag))));
  },
  async allesLoeschen() {
    return oeffne().then((d) => new Promise((ok, fehler) => {
      const t = d.transaction(['daten', 'antworten'], 'readwrite');
      t.oncomplete = () => ok(); t.onerror = t.onabort = () => fehler(t.error || new Error('Abgebrochen'));
      t.objectStore('daten').clear(); t.objectStore('antworten').clear();
    }));
  },
  async ersetzeAlles(daten, antworten) {
    if (!Array.isArray(antworten)) throw new Error('Sicherung beschädigt: «antworten» ist keine Liste.');
    return oeffne().then((d) => new Promise((ok, fehler) => {
      const t = d.transaction(['daten', 'antworten'], 'readwrite');
      t.oncomplete = () => ok(); t.onerror = t.onabort = () => fehler(t.error || new Error('Abgebrochen'));
      try {
        const sd = t.objectStore('daten'), sa = t.objectStore('antworten');
        sd.clear(); sa.clear();
        for (const [k, v] of Object.entries(daten)) sd.put(v, k);
        for (const a of antworten) { const { nr, ...rest } = a; void nr; sa.add(rest); }
      } catch (e) { try { t.abort(); } catch { /* schon beendet */ } fehler(e); }
    }));
  },
};

// Bittet den Browser, die Daten nicht automatisch zu löschen (wichtig auf iPad/Safari).
export async function speicherStatus() {
  const installiert = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  let dauerhaft = false;
  try { dauerhaft = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false; } catch { /* egal */ }
  return { installiert, dauerhaft };
}

export async function dauerhaftSpeichern() {
  try { if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch { /* nicht unterstützt */ }
  return false;
}
