// Abgleich der Lernstände zwischen den Geräten einer Familie (Cloudflare Pages Function + D1).
// Ein Datenstand pro Installation (ein Kind). Ein Gerät darf einen Schlüssel nur überschreiben, wenn es die aktuelle
// Fassung kennt (basis = Laufnummer der Fassung, die es zuletzt gesehen hat). Sonst bekommt es die aktuelle Fassung
// zurück, führt zusammen und schickt erneut. Antworten werden gesammelt (eindeutige ID). Der Name wird nie gespeichert.
//
// POST /api/abgleich        { geraet, epoche, seit, cursor?, daten: { k: { wert, ts, basis } }, antworten: [{ id, tag, e }] }
//   Antwort: { epoche, seit, daten: { k: { wert, ts, seq } }, angenommen: { k: seq }, antworten, mehr, cursor }
// POST /api/zuruecksetzen   {}  löscht alle Daten online und vergibt eine neue Epoche
//
// Grenzen von D1 (Free): höchstens 50 Abfragen pro Aufruf, Zeilen bis 2 MB. Darum: ein Statement pro Schlüssel,
// Antworten gebündelt über json_each.

export const SCHLUESSEL = ['profil', 'einstellungen', 'buchstaben', 'stand', 'kasten', 'gesehen', 'messung', 'tage', 'lernwoerter',
  'meldungen', 'tagesplan', 'sammelbild', 'schatzkarten', 'entdecker', 'einfuehrung', 'laufend', 'imports'];
const MAX_BODY = 12 * 1024 * 1024, MAX_WERT = 1900 * 1024, MAX_ANTWORTEN = 2000, PAKET = 400, SEITE = 2000;

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS lp_meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS lp_daten (k TEXT PRIMARY KEY, wert TEXT NOT NULL, ts INTEGER NOT NULL, seq INTEGER NOT NULL, geraet TEXT, wer TEXT)',
  'CREATE TABLE IF NOT EXISTS lp_antworten (id TEXT PRIMARY KEY, tag INTEGER, eintrag TEXT NOT NULL, geraet TEXT, seq INTEGER NOT NULL)',
  'CREATE INDEX IF NOT EXISTS lp_antworten_seq ON lp_antworten (seq, id)',
];
const SEQ = "(SELECT CAST(v AS INTEGER) FROM lp_meta WHERE k = 'seq')";
let schemaBereit = new WeakSet();

function antwort(status, obj) {
  return new Response(JSON.stringify(obj), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  } });
}
const fehler = (status, code, text) => antwort(status, { fehler: code, text });

async function schema(DB) {
  if (schemaBereit.has(DB)) return;
  await DB.batch(SCHEMA.map((s) => DB.prepare(s)));
  schemaBereit.add(DB);
}

const zufallsId = () => [...crypto.getRandomValues(new Uint8Array(12))].map((x) => x.toString(16).padStart(2, '0')).join('');

async function epoche(DB) {
  const r = await DB.prepare("SELECT v FROM lp_meta WHERE k = 'epoche'").first();
  if (r) return r.v;
  await DB.prepare("INSERT OR IGNORE INTO lp_meta (k, v) VALUES ('epoche', ?1)").bind(zufallsId()).run();
  return (await DB.prepare("SELECT v FROM lp_meta WHERE k = 'epoche'").first()).v;
}

const istGanz = (x) => Number.isSafeInteger(x) && x >= 0;
const istText = (x, max) => typeof x === 'string' && x.length > 0 && x.length <= max;

// Prüft und bereinigt die Anfrage. Wirft { status, code, text } bei Fehlern.
export function pruefeAnfrage(b) {
  const weg = (text) => { throw { status: 400, code: 'ungueltig', text }; };
  if (!b || typeof b !== 'object' || Array.isArray(b)) weg('Anfrage ist kein Objekt.');
  if (!istText(b.geraet, 40) || !/^[a-z0-9-]+$/i.test(b.geraet)) weg('Geräte-ID fehlt.');
  if (b.epoche !== null && b.epoche !== undefined && !istText(b.epoche, 64)) weg('Epoche ungültig.');
  if (!istGanz(b.seit ?? 0)) weg('«seit» ungültig.');
  if (b.angelegt !== undefined && b.angelegt !== null && !istGanz(b.angelegt)) weg('«angelegt» ungültig.');
  const cursor = b.cursor ?? null;
  if (cursor !== null && (typeof cursor !== 'object' || !istGanz(cursor.seq) || !istText(cursor.id, 120))) weg('Cursor ungültig.');
  const daten = [];
  if (b.daten !== undefined) {
    if (typeof b.daten !== 'object' || b.daten === null || Array.isArray(b.daten)) weg('«daten» ungültig.');
    for (const [k, v] of Object.entries(b.daten)) {
      if (!SCHLUESSEL.includes(k)) weg(`Unbekannter Schlüssel «${k}».`);
      if (!v || typeof v !== 'object' || !istGanz(v.ts) || !istGanz(v.basis ?? 0) || !('wert' in v)) weg(`Eintrag «${k}» ungültig.`);
      let wert = v.wert;
      if (k === 'profil' && wert && typeof wert === 'object') { wert = { ...wert }; delete wert.name; }   // Name bleibt auf dem Gerät
      const text = JSON.stringify(wert ?? null);
      if (new TextEncoder().encode(text).length > MAX_WERT) throw { status: 413, code: 'zu-gross', text: `«${k}» ist zu gross für den Abgleich.` };
      daten.push({ k, text, ts: v.ts, basis: v.basis ?? 0 });
    }
  }
  const antworten = [];
  if (b.antworten !== undefined) {
    if (!Array.isArray(b.antworten) || b.antworten.length > MAX_ANTWORTEN) weg('«antworten» ungültig oder zu viele.');
    for (const a of b.antworten) {
      if (!a || !istText(a.id, 120) || !Number.isSafeInteger(a.tag) || !a.e || typeof a.e !== 'object' || Array.isArray(a.e)) weg('Antwort ungültig.');
      antworten.push({ id: a.id, tag: a.tag, e: a.e });
    }
  }
  return { geraet: b.geraet, epoche: b.epoche ?? null, angelegt: b.angelegt ?? null, seit: b.seit ?? 0, cursor, daten, antworten };
}

const EP = "(SELECT v FROM lp_meta WHERE k = 'epoche')";

async function abgleich(DB, a, zugang) {
  const ep = await epoche(DB);
  if (a.epoche && a.epoche !== ep) return antwort(200, { zurueckgesetzt: true, epoche: ep, wer: zugang.email });
  // Ein Gerät, das noch nie abgeglichen hat und dessen Daten älter sind als das letzte Zurücksetzen, folgt dem Zurücksetzen
  if (!a.epoche && a.angelegt) {
    const z = await DB.prepare("SELECT v FROM lp_meta WHERE k = 'zurueckgesetzt'").first();
    if (z && a.angelegt < Number(z.v)) return antwort(200, { zurueckgesetzt: true, epoche: ep, wer: zugang.email });
  }

  // 1. Schreiben (ein Durchgang, eine neue Laufnummer)
  if (a.daten.length || a.antworten.length) {
    const st = [DB.prepare("INSERT INTO lp_meta (k, v) VALUES ('seq', '1') ON CONFLICT (k) DO UPDATE SET v = CAST(v AS INTEGER) + 1")];
    for (const d of a.daten) {
      // Nur überschreiben, wenn das Gerät die aktuelle Fassung kennt (sonst gingen Änderungen anderer Geräte verloren)
      // Nur in der Epoche schreiben, die das Gerät kennt (ein gleichzeitiges Zurücksetzen gewinnt)
      st.push(DB.prepare(`INSERT INTO lp_daten (k, wert, ts, seq, geraet, wer) SELECT ?1, ?2, ?3, ${SEQ}, ?4, ?5 WHERE ${EP} = ?7
        ON CONFLICT (k) DO UPDATE SET wert = excluded.wert, ts = excluded.ts, seq = excluded.seq, geraet = excluded.geraet, wer = excluded.wer
        WHERE lp_daten.seq = ?6`).bind(d.k, d.text, d.ts, a.geraet, zugang.email, d.basis, ep));
    }
    for (let i = 0; i < a.antworten.length; i += PAKET) {
      st.push(DB.prepare(`INSERT OR IGNORE INTO lp_antworten (id, tag, eintrag, geraet, seq)
        SELECT json_extract(value, '$.id'), json_extract(value, '$.tag'), json(json_extract(value, '$.e')), ?1, ${SEQ} FROM json_each(?2) WHERE ${EP} = ?3`)
        .bind(a.geraet, JSON.stringify(a.antworten.slice(i, i + PAKET)), ep));
    }
    await DB.batch(st);
  }

  // 2. Lesen in einem Durchgang (gleicher Stand für Laufnummer, Daten und Antworten)
  const gesendet = new Map(a.daten.map((d) => [d.k, d.ts]));
  const ab = a.cursor || { seq: a.seit, id: '' };
  const lesen = [
    DB.prepare("SELECT v FROM lp_meta WHERE k = 'seq'"),
    DB.prepare(`SELECT id, tag, eintrag, seq FROM lp_antworten
      WHERE (seq > ?1 OR (seq = ?1 AND id > ?2)) AND seq > ?3 AND (geraet IS NULL OR geraet <> ?4) ORDER BY seq, id LIMIT ${SEITE}`).bind(ab.seq, ab.id, a.seit, a.geraet),
  ];
  if (!a.cursor) lesen.push(DB.prepare(`SELECT k, wert, ts, seq, geraet FROM lp_daten
      WHERE (seq > ?1 AND (geraet IS NULL OR geraet <> ?2)) OR k IN (SELECT value FROM json_each(?3))`).bind(a.seit, a.geraet, JSON.stringify([...gesendet.keys()])));
  const [rSeq, rAnt, rDaten] = await DB.batch(lesen);
  const jetzt = Number(rSeq.results?.[0]?.v || 0);
  const daten = {}, angenommen = {};
  for (const r of rDaten?.results || []) {
    if (gesendet.has(r.k) && r.geraet === a.geraet && r.ts === gesendet.get(r.k)) angenommen[r.k] = r.seq;   // geschrieben
    else daten[r.k] = { wert: JSON.parse(r.wert), ts: r.ts, seq: r.seq };                                        // neuer von anderswo oder abgelehnt
  }
  const zeilen = rAnt.results || [];
  const antworten = zeilen.map((r) => ({ id: r.id, tag: r.tag, e: JSON.parse(r.eintrag) }));
  const mehr = zeilen.length === SEITE;
  const letzte = zeilen[zeilen.length - 1];
  return antwort(200, { epoche: ep, seit: jetzt, daten, angenommen, antworten, mehr, cursor: mehr ? { seq: letzte.seq, id: letzte.id } : null, wer: zugang.email });
}

async function zuruecksetzen(DB) {
  const neu = zufallsId();
  await DB.batch([
    DB.prepare('DELETE FROM lp_daten'),
    DB.prepare('DELETE FROM lp_antworten'),
    DB.prepare("INSERT INTO lp_meta (k, v) VALUES ('epoche', ?1) ON CONFLICT (k) DO UPDATE SET v = excluded.v").bind(neu),
    DB.prepare("INSERT INTO lp_meta (k, v) VALUES ('zurueckgesetzt', ?1) ON CONFLICT (k) DO UPDATE SET v = excluded.v").bind(String(Date.now())),
  ]);
  return antwort(200, { epoche: neu });
}

// Einstieg: zugang = { email } aus der geprüften Access-Anmeldung
export async function bearbeite(request, env, zugang) {
  const url = new URL(request.url);
  const pfad = url.pathname.replace(/\/+$/, '');
  if (request.method !== 'POST') return fehler(405, 'methode', 'Nur POST.');
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return fehler(403, 'herkunft', 'Fremde Herkunft.');
  if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) return fehler(415, 'typ', 'JSON erwartet.');
  if (!env.DB) return antwort(200, { aus: true, text: 'Die Datenbank (D1, Variable DB) ist nicht verbunden.' });   // 200: kein Fehler in der Konsole
  const laenge = Number(request.headers.get('Content-Length') || 0);
  if (laenge > MAX_BODY) return fehler(413, 'zu-gross', 'Anfrage zu gross.');
  let roh;
  try { roh = await request.text(); } catch { return fehler(400, 'ungueltig', 'Anfrage nicht lesbar.'); }
  if (roh.length > MAX_BODY) return fehler(413, 'zu-gross', 'Anfrage zu gross.');
  let body;
  try { body = roh ? JSON.parse(roh) : {}; } catch { return fehler(400, 'ungueltig', 'Kein gültiges JSON.'); }
  try {
    await schema(env.DB);
    if (pfad === '/api/abgleich') return await abgleich(env.DB, pruefeAnfrage(body), zugang);
    if (pfad === '/api/zuruecksetzen') return await zuruecksetzen(env.DB);
    return fehler(404, 'pfad', 'Unbekannter Pfad.');
  } catch (e) {
    if (e && e.status) return fehler(e.status, e.code, e.text);
    console.error('Abgleich', e);
    return fehler(500, 'server', 'Interner Fehler beim Abgleich.');
  }
}

export function _schemaVergessen() { schemaBereit = new WeakSet(); }
