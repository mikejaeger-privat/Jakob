// Abgleich der Lernstände zwischen Geräten über /api/abgleich (Cloudflare Pages Function + D1 hinter Access).
// Lokal bleibt alles wie bisher; der Abgleich läuft im Hintergrund. Ohne Server (lokal, nicht eingerichtet)
// bleibt die App einfach beim lokalen Speichern.
import { db } from './db.js';
import { Z, S, ABGLEICH, speichereAbgleich, antwortenVomAbgleich, zuruecksetzen } from './zustand.js';
import { wendeAn, fuerVersand, vomServer, nachVersand, zumVersand } from '../core/abgleich.js';

const MAX_ANTWORTEN = 2000;
// zustand: 'unbekannt' | 'aktiv' | 'aus' | 'offline' | 'anmeldung' | 'fehler'
export const status = { zustand: 'unbekannt', text: '', wer: null, letzter: null };
const melde = (zustand, text = '') => {
  Object.assign(status, { zustand, text });
  window.dispatchEvent(new CustomEvent('abgleich-status', { detail: { ...status } }));
};
// Nicht mitten in einer Übung und nicht in einem offenen Formular des Elternbereichs übernehmen
const inSitzung = () => document.body.classList.contains('in-sitzung');
const nichtJetzt = (erzwingen) => inSitzung() || (!erzwingen && location.hash.startsWith('#/eltern'));
const pfad = (p) => new URL(p, document.baseURI).href;

async function sende(p, body) {
  let r;
  try {
    r = await fetch(pfad(p), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      credentials: 'same-origin', redirect: 'manual', cache: 'no-store' });
  } catch { throw Object.assign(new Error('Keine Verbindung.'), { zustand: 'offline' }); }
  if (r.type === 'opaqueredirect' || r.status === 302 || r.status === 401) throw Object.assign(new Error('Die Anmeldung ist abgelaufen.'), { zustand: 'anmeldung' });
  if (r.status === 404 || r.status === 405) throw Object.assign(new Error('Auf diesem Server gibt es keinen Abgleich.'), { zustand: 'aus' });
  let j = null;
  try { j = await r.json(); } catch { /* kein JSON */ }
  if (j?.aus) throw Object.assign(new Error(j.text || 'Der Abgleich ist nicht eingerichtet.'), { zustand: 'aus' });
  if (r.status === 413) throw Object.assign(new Error((j?.text || 'Zu viele Daten auf einmal.') + ' Bitte eine Sicherung herunterladen und melden.'), { zustand: 'fehler' });
  if (!r.ok || !j) throw Object.assign(new Error(j?.text || `Fehler ${r.status}`), { zustand: 'fehler' });
  return j;
}

let laeuft = null, nochmal = false;
// Ein Durchgang: Änderungen hochladen, Neues holen und übernehmen. Gibt { geaendert, antworten } zurück.
export function gleicheAb({ erzwingen = false } = {}) {
  if (laeuft) { nochmal = true; return laeuft; }
  laeuft = (async () => {
    let ergebnis = { geaendert: [], antworten: 0 };
    try {
      for (let runde = 0; runde < 6; runde++) {
        nochmal = false;
        const r = await durchgang(erzwingen);
        ergebnis = { geaendert: [...new Set([...ergebnis.geaendert, ...r.geaendert])], antworten: ergebnis.antworten + r.antworten };
        if (!nochmal) break;
      }
      status.letzter = Date.now(); S.letzter = status.letzter;
      melde('aktiv');
    } catch (e) {
      melde(e.zustand || 'fehler', e.message);
    } finally { laeuft = null; }
    if (ergebnis.geaendert.length || ergebnis.antworten) window.dispatchEvent(new CustomEvent('fernaenderung', { detail: ergebnis }));
    return ergebnis;
  })();
  return laeuft;
}

async function durchgang(erzwingen) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw Object.assign(new Error('Keine Verbindung.'), { zustand: 'offline' });
  // 1. Was hochgeht
  const daten = {}, gesendet = {};
  for (const k of S.offen) {
    if (!ABGLEICH.includes(k) || Z[k] === undefined) continue;
    daten[k] = { wert: zumVersand(k, Z[k]), ts: S.ts[k] || 1, basis: S.basis?.[k] || 0 };
    gesendet[k] = S.ts[k];
  }
  const neue = await db.antwortenNach(S.antwortenBis || 0);
  const eigene = neue.filter((a) => !a.fern).slice(0, MAX_ANTWORTEN);
  const bis = eigene.length === MAX_ANTWORTEN ? eigene[eigene.length - 1].nr : (neue.length ? neue[neue.length - 1].nr : S.antwortenBis || 0);
  if (eigene.length === MAX_ANTWORTEN) nochmal = true;

  // 2. Senden und erste Seite holen
  let j = await sende('api/abgleich', { geraet: S.geraet, epoche: S.epoche, angelegt: S.epoche ? undefined : S.angelegt, seit: S.seit, daten, antworten: eigene.map(fuerVersand) });
  status.wer = j.wer || status.wer; S.wer = status.wer;
  if (j.zurueckgesetzt) {
    // Auf einem anderen Gerät wurde alles zurückgesetzt: hier auch
    await zuruecksetzen(j.epoche);
    window.dispatchEvent(new CustomEvent('fern-zurueckgesetzt'));
    return { geaendert: [], antworten: 0 };
  }
  S.epoche = j.epoche;
  nachVersand(S, gesendet, j.angenommen || {});
  S.antwortenBis = bis;
  const neuerStand = j.seit;   // gilt für alles, was diese erste Antwort und ihre Folgeseiten bringen
  if (nichtJetzt(erzwingen)) { await speichereAbgleich(); return { geaendert: [], antworten: 0 }; }   // später übernehmen
  if (S.offen.some((k) => k in gesendet)) nochmal = true;   // abgelehnt: aktuelle Fassung kommt mit, zusammenführen und erneut senden

  // 3. Weitere Seiten mit Antworten holen
  const fernDaten = j.daten || {};
  const fernAntworten = [...(j.antworten || [])];
  while (j.mehr && j.cursor) {
    j = await sende('api/abgleich', { geraet: S.geraet, epoche: S.epoche, seit: S.seit, cursor: j.cursor });
    if (j.zurueckgesetzt) { nochmal = true; return { geaendert: [], antworten: 0 }; }
    fernAntworten.push(...(j.antworten || []));
  }
  if (nichtJetzt(erzwingen)) { nochmal = false; await speichereAbgleich(); return { geaendert: [], antworten: 0 }; }   // inzwischen begonnen

  // 4. Übernehmen (Antworten zuerst; doppelte IDs werden übersprungen, falls die App dazwischen geschlossen wird)
  await antwortenVomAbgleich(fernAntworten.map(vomServer));
  const { geaendert, nochmal: mehr } = wendeAn(Z, S, fernDaten);
  if (mehr) nochmal = true;
  S.seit = neuerStand;
  await speichereAbgleich(geaendert);
  return { geaendert, antworten: fernAntworten.length };
}

// Wartet höchstens ms Millisekunden auf einen Abgleich (für den Start)
export function gleicheAbHoechstens(ms) {
  return Promise.race([gleicheAb(), new Promise((ok) => setTimeout(() => ok(null), ms))]);
}

// Löscht alles online und auf diesem Gerät; andere Geräte folgen beim nächsten Abgleich
export async function zuruecksetzenUeberall() {
  const j = await sende('api/zuruecksetzen', {});
  await zuruecksetzen(j.epoche);
}

export const abgleichAktiv = () => status.zustand === 'aktiv';
// Anmeldung bei Cloudflare Access erneuern (an der App vorbei, über das Netz)
export function neuAnmelden() { location.href = pfad('api/anmelden'); }
export const offeneAenderungen = () => S.offen.length;

// Auslöser: nach Änderungen (kurz gewartet), beim Zurückkehren in die App, wieder online, alle 5 Minuten
let timer = null;
export function starteAutomatik() {
  const bald = (ms = 4000) => { clearTimeout(timer); timer = setTimeout(() => { if (status.zustand !== 'aus') gleicheAb(); }, ms); };
  window.addEventListener('lokal-geaendert', () => bald());
  window.addEventListener('online', () => bald(500));
  document.addEventListener('visibilitychange', () => { if (status.zustand !== 'aus') gleicheAb(); });
  setInterval(() => { if (document.visibilityState === 'visible' && status.zustand !== 'aus') gleicheAb(); }, 5 * 60 * 1000);
}
