// App-Zustand: lädt alle Daten aus IndexedDB, hält sie im Speicher und speichert Änderungen (Muster der Lernplattform).
import { db } from './db.js';
import { heuteNr } from '../core/util.js';

export const SCHEMA = 1;
export const Z = {
  profil: null,          // { name, erstellt, pin: { salz, hash } | null, schema }
  einstellungen: null,   // siehe standardEinstellungen()
  buchstaben: null,      // { frei: { a: true, … }, reihenfolge: ['a', 'm', …] }
  stand: {},             // Lernstand je Fertigkeit und Stufe
  kasten: {},            // Karteikasten
  gesehen: {},           // Signaturen gezeigter Aufgaben (gegen Wiederholungen)
  messung: {},           // Sekunden pro Aufgabe (gleitender Mittelwert)
  tage: {},              // Lernzeit und Aufgaben pro Tag
  lernwoerter: [],       // [{ id, wort, test, angelegt }]
  meldungen: [],         // [{ tag, aid, f, text, erledigt }]
  tagesplan: null,       // { tag, steine, erledigt }
  sammelbild: null,      // { szene, teile: [{ id, art, tag }], album: [{ id, szene, teile }] }
  schatzkarten: [],      // Berichte der Schatzkarten
  entdecker: null,       // Entdeckerrunde { tage, fertig }
  einfuehrung: null,     // { gesehen: true, typen: { 'wahl-bild': true, … } }
  laufend: null,         // unterbrochene Sitzung (gilt am selben Tag)
  backup: { letztes: null, erinnertAm: null },
  imports: { pakete: [] },
};
const SCHLUESSEL = Object.keys(Z);

// Abgleich zwischen Geräten: welche Schlüssel mitgehen (backup bleibt pro Gerät).
export const ABGLEICH = SCHLUESSEL.filter((k) => k !== 'backup');
const neueGeraeteId = () => [...crypto.getRandomValues(new Uint8Array(6))].map((x) => x.toString(16).padStart(2, '0')).join('');
const neuerSync = () => ({ geraet: neueGeraeteId(), angelegt: Date.now(), epoche: null, seit: 0, ts: {}, basis: {}, offen: [], antwortenBis: 0, letzter: null, wer: null });
export let S = neuerSync();

export async function ladeZustand() {
  const d = await db.alleDaten();
  for (const k of SCHLUESSEL) if (d[k] !== undefined) Z[k] = d[k];
  if (d._sync && typeof d._sync === 'object' && d._sync.geraet) S = { ...neuerSync(), ...d._sync };
  else { S = neuerSync(); await db.setze('_sync', S); }
  return !!Z.profil;
}

// Schreibt Werte vom Abgleich, ohne sie als lokale Änderung zu markieren
export function speichereAbgleich(keys = []) {
  const obj = { _sync: S };
  for (const k of keys) obj[k] = Z[k];
  warteschlange = warteschlange.then(() => db.setzeViele(obj)).then(() => true, (e) => {
    console.error('Speichern (Abgleich)', e);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('speicherfehler', { detail: e }));
    return false;
  });
  return warteschlange;
}
export async function antwortenVomAbgleich(liste) {
  if (!liste.length) return;
  await imSchlange(() => db.antwortenHinzu(liste));
}

export function standardEinstellungen(P) {
  return {
    gewichtung: { ...P.gewichtung }, minuten: P.lernzeit.minuten, lernTage: [...P.lernzeit.lernTage],
    stimme: null, tempo: P.sprache.tempo, dehnlaute: P.sprache.dehnlaute, silben: P.sprache.silbenEinzeln, hoertest: null,
    ton: true, belohnung: P.belohnung.aktiv, vorlesen: P.vorlesen.aktiv, zahlenraum: P.plan.zahlenraumFreigabe,
    kapitel: null, begriffe: {},
  };
}
export function standardBuchstaben(B) {
  return { frei: Object.fromEntries(B.liste.map((b) => [b.id, !!b.eingefuehrt])), reihenfolge: B.liste.map((b) => b.id) };
}

export async function neuesProfil(name, P, B) {
  const heute = heuteNr();
  Z.profil = { name: name.trim(), erstellt: heute, pin: null, schema: SCHEMA };
  Z.einstellungen = standardEinstellungen(P);
  Z.buchstaben = standardBuchstaben(B);
  Z.einfuehrung = { gesehen: false, typen: {} };
  Z.sammelbild = { szene: P.belohnung.szenen[0], teile: [], album: [] };
  await speichere(...SCHLUESSEL);
}

let warteschlange = Promise.resolve();
export function speichere(...keys) {
  const obj = {};
  for (const k of keys) obj[k] = Z[k];
  // Solange dieses Gerät noch nie abgeglichen hat, gelten seine Änderungen als alt: Ein vorhandener Stand
  // anderer Geräte gewinnt dann, statt von einem neu angelegten Profil überschrieben zu werden.
  const jetzt = S.epoche ? Date.now() : 1;
  let geaendert = false;
  for (const k of keys) if (ABGLEICH.includes(k)) {
    S.ts[k] = Math.max(jetzt, (S.ts[k] || 0) + 1);
    if (!S.offen.includes(k)) S.offen.push(k);
    geaendert = true;
  }
  if (geaendert) obj._sync = S;
  warteschlange = warteschlange.then(() => db.setzeViele(obj)).then(() => true, (e) => {
    console.error('Speichern', e);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('speicherfehler', { detail: e }));
    return false;
  });
  if (geaendert && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lokal-geaendert'));
  return warteschlange;
}
const imSchlange = (fn) => (warteschlange = warteschlange.then(fn, fn));

let antwortZaehler = 0;
export async function protokolliere(eintrag) {
  if (!eintrag.id) eintrag.id = `${S.geraet}:${Date.now().toString(36)}:${(antwortZaehler++).toString(36)}`;
  try { await db.antwort(eintrag); if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lokal-geaendert')); } catch (e) { console.error('Protokoll', e); if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('speicherfehler', { detail: e })); }
}

// --- PIN (nur Kindersicherung) ---
async function sha(text) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
export async function setzePin(pin) {
  if (!pin) { Z.profil.pin = null; return speichere('profil'); }
  const salz = [...crypto.getRandomValues(new Uint8Array(8))].map((x) => x.toString(16).padStart(2, '0')).join('');
  Z.profil.pin = { salz, hash: await sha(salz + pin) };
  return speichere('profil');
}
export async function pruefePin(pin) {
  if (!Z.profil.pin) return true;
  return (await sha(Z.profil.pin.salz + pin)) === Z.profil.pin.hash;
}

// --- Export und Import ---
export async function exportiere() {
  const daten = await db.alleDaten();
  for (const k of Object.keys(daten)) if (k.startsWith('_')) delete daten[k];   // Abgleich-Verwaltung gehört nicht in die Sicherung
  const antworten = await db.antworten();
  return { format: 'lernwelt-sicherung', version: SCHEMA, exportiert: new Date().toISOString(), daten, antworten };
}
export function pruefeSicherung(obj) {
  if (!obj || typeof obj !== 'object' || obj.format !== 'lernwelt-sicherung' || !obj.daten || typeof obj.daten !== 'object' || !obj.daten.profil) throw new Error('Das ist keine Sicherungsdatei der Lernwelt.');
  if (obj.version > SCHEMA) throw new Error('Die Sicherung stammt aus einer neueren Version. Bitte zuerst die App aktualisieren.');
  const d = obj.daten;
  const LISTE = ['lernwoerter', 'meldungen', 'schatzkarten'];
  const OBJ = ['profil', 'einstellungen', 'buchstaben', 'stand', 'kasten', 'gesehen', 'messung', 'tage', 'sammelbild', 'entdecker', 'einfuehrung', 'imports', 'backup'];
  for (const k of Object.keys(d)) if (!SCHLUESSEL.includes(k) && !k.startsWith('_')) throw new Error(`Sicherung: unbekannter Eintrag «${k}».`);
  for (const k of LISTE) if (k in d && !Array.isArray(d[k])) throw new Error(`Sicherung: «${k}» ist ungültig.`);
  for (const k of OBJ) if (k in d && d[k] !== null && (typeof d[k] !== 'object' || Array.isArray(d[k]))) throw new Error(`Sicherung: «${k}» ist ungültig.`);
  if (!Array.isArray(obj.antworten ?? [])) throw new Error('Sicherung: «antworten» ist keine Liste.');
  if (typeof d.profil.name !== 'string') throw new Error('Sicherung: Profil ungültig.');
}
export async function importiere(obj) {
  pruefeSicherung(obj);
  const daten = Object.fromEntries(Object.entries(obj.daten).filter(([k]) => !k.startsWith('_')));
  const antworten = (obj.antworten || []).map((a) => { const { fern, ...rest } = a; void fern; return rest; });
  const geraet = S.geraet, epoche = S.epoche, seit = S.seit, basis = S.basis;
  await imSchlange(() => db.ersetzeAlles(daten, antworten));
  // Eingespielte Daten gelten als neu und gehen beim nächsten Abgleich an die anderen Geräte
  const jetzt = Date.now();
  S = { ...neuerSync(), geraet, epoche, seit, basis, antwortenBis: 0 };
  for (const k of ABGLEICH) if (daten[k] !== undefined) { S.ts[k] = jetzt; S.offen.push(k); }
  await imSchlange(() => db.setze('_sync', S));
  await ladeZustand();
}
// Löscht alles auf diesem Gerät. epoche: neue Epoche vom Server (nach einem Zurücksetzen überall)
export async function zuruecksetzen(epoche = null) {
  await imSchlange(() => db.allesLoeschen());
  for (const k of SCHLUESSEL) Z[k] = Array.isArray(Z[k]) ? [] : (typeof Z[k] === 'object' && Z[k] !== null ? {} : null);
  Z.profil = null;
  Z.backup = { letztes: null, erinnertAm: null };
  Z.imports = { pakete: [] };
  S = { ...neuerSync(), epoche };
  await imSchlange(() => db.setze('_sync', S));
}
