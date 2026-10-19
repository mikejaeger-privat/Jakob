// Aufgaben bauen (beide Fächer): setzen den Typ und prüfen Pflichtfelder beim Entwickeln. Regeln: tools/SPEC-AUFGABEN.md.
export const LUECKE = '_';

const PFLICHT = {
  zahl: ['loesung'], 'wahl-bild': ['optionen', 'richtig'], 'wahl-wort': ['optionen', 'richtig'], zuordnen: ['paare'],
  legen: ['kacheln', 'loesung'], reihenfolge: ['teile'], muster: ['folge', 'optionen', 'richtig'], zaehlen: ['dinge', 'anzahl'],
  'menge-legen': ['ziel', 'feld'], antippen: ['loesung'], 'hoeren-tippen': ['szene'], nachspuren: [],
  'wahl-hoeren': ['optionen', 'richtig'], 'bild-wort': ['zeige', 'optionen', 'richtig'], silben: ['modus', 'silben'],
  lautplatz: ['wort', 'laut', 'plaetze', 'loesung'], vorlesen: ['zeige'],
};
function fertig(typ, o) {
  const a = { typ, ...o };
  for (const feld of ['frage', 'hinweis', 'erklaerung', 'sig']) {
    if (typeof a[feld] !== 'string' || !a[feld].trim()) throw new Error(`Generator: Feld «${feld}» fehlt (${a.frage || typ})`);
  }
  for (const feld of PFLICHT[typ] || []) if (a[feld] === undefined || a[feld] === null) throw new Error(`Generator: Feld «${feld}» fehlt (${a.frage})`);
  if (!a.daten || typeof a.daten !== 'object') throw new Error(`Generator: «daten» fehlt (${a.frage})`);
  if (typ === 'zahl') {
    // Antwortfelder: jedes «_» in zeige oder jedes «?» in der Darstellung ist ein Feld, sonst eines unter der Darstellung
    const n = Array.isArray(a.loesung) ? a.loesung.length : 1;
    if (!Array.isArray(a.loesung)) a.loesung = [a.loesung];
    const zeilen = Array.isArray(a.zeige) ? a.zeige : typeof a.zeige === 'string' ? [a.zeige] : [];
    const imText = zeilen.reduce((n, z) => n + z.split(' ').filter((t) => t === LUECKE).length, 0);
    if (imText && imText !== n) throw new Error(`Generator: ${imText} Lücken, aber ${n} Lösungen (${a.zeige})`);
    if (!a.bis) throw new Error(`Generator: «bis» (Zahlenraum der Stufe) fehlt (${a.frage})`);
    a.zahlenfeld = a.zahlenfeld ?? (a.bis <= 10 ? 10 : a.bis <= 20 ? 20 : 'ziffern');
  }
  if (typ === 'antippen' || typ === 'hoeren-tippen') { if (a.loesung && !Array.isArray(a.loesung)) a.loesung = [a.loesung]; }
  if (typ === 'nachspuren' && !a.zeichen && !a.wort) throw new Error(`Generator: «zeichen» oder «wort» fehlt (${a.frage})`);
  if (typ === 'hoeren-tippen' && !a.loesung && !a.ziehen) throw new Error(`Generator: «loesung» oder «ziehen» fehlt (${a.frage})`);
  return a;
}
export const A = Object.fromEntries(Object.keys(PFLICHT).map((typ) => {
  const name = typ.replace(/-(\w)/g, (_, c) => c.toUpperCase());
  return [name, (o) => fertig(typ, o)];
}));

export function sig(...teile) { return teile.map((t) => (typeof t === 'object' ? JSON.stringify(t) : String(t))).join('_'); }

// Auswahl: richtige Antwort plus falsche, ohne Doppelte, richtige Position zufällig. Werte als Text vergleichen.
export function auswahl(r, richtig, falsche, anzahl = 3) {
  const schluessel = (x) => (typeof x === 'object' ? JSON.stringify(x) : String(x));
  const rs = schluessel(richtig);
  const gesehen = new Set([rs]);
  const f = [];
  for (const x of falsche) {
    const k = schluessel(x);
    if (x === null || x === undefined || gesehen.has(k)) continue;
    gesehen.add(k); f.push(x);
    if (f.length >= anzahl - 1) break;
  }
  if (f.length < 1) throw new Error('Generator: keine falsche Option für ' + rs);
  const alle = r.shuffle([richtig, ...f]);
  return { optionen: alle, richtig: alle.findIndex((x) => schluessel(x) === rs) };
}

// Gezielte Erklärung zu einer typischen falschen Antwort (nur wenn sie sich von der Lösung unterscheidet und im Zahlenraum liegt)
export function fehlerbilder(loesung, bis, ...paare) {
  const aus = [], gesehen = new Set([String(loesung)]);
  for (const [eingabe, text] of paare) {
    if (eingabe === null || eingabe === undefined || Number.isNaN(eingabe) || eingabe < 0 || eingabe > bis) continue;
    const s = String(eingabe);
    if (gesehen.has(s)) continue;
    gesehen.add(s); aus.push({ eingabe: s, text });
  }
  return aus;
}

