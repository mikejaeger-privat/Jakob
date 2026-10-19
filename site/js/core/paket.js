// Pakete mit eigenen Inhalten (INHALTE.md): Lernwörter, zusätzliche Bildwörter, zusätzliche feste Deutsch-Inhalte.
// Prüfen beim Import (dieselben Regeln wie tools/pruefe_woerter.mjs und tools/pruefe_inhalte.mjs) und Einmischen in die Grundlagen.
import { pruefeWort } from './woerter-pruefen.js';
import { pruefeInhalte, INHALT_TEILE } from './inhalte-pruefen.js';
import { zerlege } from '../deutsch/lib.js';

export const PAKET_MAX_BYTES = 2 * 1024 * 1024;
const MAX_FEHLER = 12;
const ID = /^[A-Za-z0-9._-]{1,64}$/;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

// Basis der Grundlagen merken, damit Pakete beliebig oft neu eingemischt werden können
function basis(G) {
  if (!G._basis) G._basis = { W: G.W, IN: G.IN };
  return G._basis;
}

// p: geparstes JSON. Liefert { fehler: [...] } oder { fehler: [], paket } (bereinigt, mit id und Zählern)
export function pruefePaket(p, G, { jetzt = Date.now() } = {}) {
  const fehler = [];
  const F = (t) => { if (fehler.length < MAX_FEHLER) fehler.push(t); };
  if (!p || typeof p !== 'object' || Array.isArray(p)) return { fehler: ['Die Datei ist kein Paket (ein JSON-Objekt wird erwartet).'] };
  if (p.fach !== 'D') F('«fach» muss "D" sein (Pakete gibt es für Deutsch; Mathematik entsteht aus Generatoren).');
  if (p.id !== undefined && (typeof p.id !== 'string' || !ID.test(p.id))) F('«id»: nur Buchstaben, Ziffern, «.», «-», «_», höchstens 64 Zeichen.');
  if (p.titel !== undefined && (typeof p.titel !== 'string' || p.titel.length > 80)) F('«titel»: Text bis 80 Zeichen.');
  const bekannt = new Set(['id', 'titel', 'fach', 'hinweis', 'lernwoerter', 'woerter', 'inhalte']);
  for (const k of Object.keys(p)) if (!bekannt.has(k)) F(`unbekanntes Feld «${k}»`);
  const id = typeof p.id === 'string' && ID.test(p.id) ? p.id : `paket-${jetzt.toString(36)}`;
  const B = basis(G);

  // Lernwörter
  const lernwoerter = [];
  if (p.lernwoerter !== undefined && !Array.isArray(p.lernwoerter)) F('«lernwoerter» muss eine Liste sein.');
  for (const [i, x] of (Array.isArray(p.lernwoerter) ? p.lernwoerter : []).entries()) {
    const wort = typeof x === 'string' ? x : x?.wort;
    const test = typeof x === 'object' && x ? x.test : undefined;
    if (typeof wort !== 'string' || !/^[A-Za-zÄÖÜäöü]{2,16}$/.test(wort.trim())) { F(`Lernwort ${i + 1}: ein Wort aus 2 bis 16 Buchstaben (ohne ß)`); continue; }
    if (test !== undefined && test !== null && (typeof test !== 'string' || !DATUM.test(test))) { F(`Lernwort «${wort}»: «test» als Datum JJJJ-MM-TT`); continue; }
    lernwoerter.push({ wort: wort.trim(), test: test || null });
  }

  // Bildwörter (vollständiges Lexikon-Schema, siehe tools/SPEC-AUFGABEN.md)
  const woerter = [];
  if (p.woerter !== undefined && !Array.isArray(p.woerter)) F('«woerter» muss eine Liste sein.');
  const worte = new Set(B.W.woerter.map((w) => w.wort));
  const bilder = new Map(B.W.woerter.map((w) => [w.bild, w.wort]));
  const wIds = new Set(B.W.woerter.map((w) => w.id));
  const planIds = new Set(G.B.liste.map((b) => b.id));
  for (const w of Array.isArray(p.woerter) ? p.woerter : []) {
    if (w && wIds.has(w.id)) { F(`Wort ${w.id}: ID schon vergeben`); continue; }
    const f = pruefeWort(w, { merkstellen: B.W.merkstellen, planIds, worte, bilder });
    if (f.length) { f.forEach(F); continue; }
    wIds.add(w.id); worte.add(w.wort); bilder.set(w.bild, w.wort);
    woerter.push(w);
  }

  // Feste Inhalte (Sätze, Geschichten, Anweisungen, Gegenteile, Bildergeschichten)
  const inhalte = {};
  if (p.inhalte !== undefined && (typeof p.inhalte !== 'object' || Array.isArray(p.inhalte))) F('«inhalte» muss ein Objekt sein.');
  const teile = p.inhalte && typeof p.inhalte === 'object' ? p.inhalte : {};
  for (const k of Object.keys(teile)) if (!INHALT_TEILE.includes(k)) F(`inhalte: unbekannter Teil «${k}» (erlaubt: ${INHALT_TEILE.join(', ')})`);
  const vorhanden = new Set(INHALT_TEILE.flatMap((k) => (B.IN[k] || []).map((x) => x.id)));
  const W = { ...B.W, woerter: [...B.W.woerter, ...woerter] };
  const r = pruefeInhalte(teile, { W, B: G.B, K: G.k.D, alleIds: vorhanden, name: 'Paket' });
  r.fehler.forEach(F);
  for (const k of INHALT_TEILE) if (Array.isArray(teile[k]) && teile[k].length) inhalte[k] = teile[k];

  const zahl = lernwoerter.length + woerter.length + Object.values(inhalte).reduce((n, l) => n + l.length, 0);
  if (!zahl && !fehler.length) F('Das Paket ist leer (mindestens eine Liste mit Einträgen).');
  if (fehler.length) return { fehler };
  return {
    fehler: [],
    paket: { id, titel: typeof p.titel === 'string' && p.titel.trim() ? p.titel.trim() : id, fach: 'D', lernwoerter, woerter, inhalte,
      zaehler: { lernwoerter: lernwoerter.length, woerter: woerter.length, inhalte: Object.values(inhalte).reduce((n, l) => n + l.length, 0) } },
  };
}

// Pakete in die Grundlagen einmischen (Wörter ins Lexikon, Inhalte zu den festen Inhalten). Nur gültige Teile.
export function wendePaketeAn(G, pakete = []) {
  const B = basis(G);
  const woerter = [...B.W.woerter];
  const IN = Object.fromEntries(INHALT_TEILE.map((k) => [k, [...(B.IN[k] || [])]]));
  const worte = new Set(woerter.map((w) => w.wort));
  const ids = new Set(INHALT_TEILE.flatMap((k) => IN[k].map((x) => x.id)));
  for (const p of pakete) {
    for (const w of p.woerter || []) if (!worte.has(w.wort)) { worte.add(w.wort); woerter.push(w); }
    for (const k of INHALT_TEILE) for (const x of p.inhalte?.[k] || []) if (!ids.has(x.id)) { ids.add(x.id); IN[k].push(x); }
  }
  G.W = { ...B.W, woerter };
  G.IN = { ...B.IN, ...IN };
  G.stand = (G.stand || 0) + 1;
  return G;
}

// Lernwörter eines Pakets in die Liste der Eltern übernehmen (gleiches Wort nur einmal); liefert die neue Liste
export function lernwoerterAusPaket(liste, paket, heuteNr, tagNr) {
  const aktiv = new Set(liste.filter((x) => !x.geloescht).map((x) => x.wort));
  const neu = [...liste];
  paket.lernwoerter.forEach((x, i) => {
    if (aktiv.has(x.wort)) return;
    aktiv.add(x.wort);
    neu.push({ id: `p-${paket.id}-${i}`, wort: x.wort, test: x.test ? tagNr(x.test) : null, angelegt: heuteNr, paket: paket.id });
  });
  return neu;
}
export const lernwortBuchstaben = (wort) => zerlege(wort);
