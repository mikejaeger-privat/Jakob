// Bausteine für die Wortgeneratoren (Deutsch). Regeln: tools/SPEC-AUFGABEN.md, Abschnitt 7 (Allgemeine Regeln 1 bis 6).
// Generatoren rufen nie Math.random auf. Ein Generator gibt null zurück, wenn mit der Freigabe keine gültige Aufgabe möglich ist.
export { A, sig, auswahl } from '../core/aufgabe.js';

// Namen für Geschichten und Sätze (AUFTRAG-INHALTE.md); keine Namen der Familie
export const NAMEN = [['Lea', 'sie'], ['Noah', 'er'], ['Mia', 'sie'], ['Luca', 'er'], ['Elena', 'sie'], ['Leon', 'er'], ['Nina', 'sie'], ['Jonas', 'er'], ['Sara', 'sie'], ['Elias', 'er']];
export const FARBEN = ['rot', 'blau', 'gelb', 'grün', 'orange', 'violett', 'braun', 'schwarz', 'weiss', 'rosa'];
export const FARBE_ID = { rot: 'rot', blau: 'blau', gelb: 'gelb', grün: 'gruen', orange: 'orange', violett: 'violett', braun: 'braun', schwarz: 'schwarz', weiss: 'weiss', rosa: 'rosa' };
export const WOCHENTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
// Jahreszeiten im Kreis (nach dem Winter kommt wieder der Frühling) und Monate (alle mit «der»: nach dem Oktober)
export const JAHRESZEITEN = ['Frühling', 'Sommer', 'Herbst', 'Winter'];
export const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const ZAHLWOERTER = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
export const HOERFARBEN = ['blau', 'gelb', 'gruen'];   // Farben der Hörkarten (nur zur Unterscheidung, nie gefragt)

// Verbindungen, die in der Schreibung eine Einheit sind (längste zuerst). st und sp nur am Wortanfang (Stern, Spiel).
const EINHEITEN = ['sch', 'chs', 'äu', 'eu', 'ei', 'au', 'ie', 'ch', 'ck', 'tz', 'pf', 'ng', 'nk', 'qu', 'st', 'sp'];
const VOKALE = 'aeiouäöüy';
const kleinWort = (t) => String(t).toLowerCase();

// Ein geschriebenes Wort in Buchstaben und Verbindungen zerlegen, wie sie im Buchstabenplan heissen.
// «Schaf» -> ['sch', 'a', 'f'], «Stern» -> ['st', 'e', 'r', 'n'], «Nest» -> ['n', 'e', 's', 't']. chs zählt als ch + s.
export function zerlege(wort) {
  const w = kleinWort(wort).replace(/[^a-zäöüß]/g, '');
  const aus = [];
  for (let i = 0; i < w.length;) {
    const e = EINHEITEN.find((x) => w.startsWith(x, i) && ((x !== 'st' && x !== 'sp') || i === 0));
    if (e === 'chs') { aus.push('ch', 's'); i += 3; continue; }
    if (e) { aus.push(e); i += e.length; continue; }
    aus.push(w[i]); i++;
  }
  return aus;
}
// Alle Einheiten eines Textes (mehrere Wörter, Satzzeichen werden übergangen), ohne Doppelte, in Reihenfolge des Vorkommens
export function brauchtText(text) {
  const s = new Set();
  for (const wort of String(text).split(/[\s.,!?«»:;-]+/).filter(Boolean)) for (const e of zerlege(wort)) s.add(e);
  return [...s];
}

// Reimteil (Regel 2): letzter betonter Vokal und alles danach, als Klang vereinheitlicht.
// Unbetontes Schluss-e (Rose, Hasen, Esel, Leiter) zählt nicht als letzter Vokal.
export function reimteil(wort) {
  let w = kleinWort(wort);
  const gruppen = [...w.matchAll(/(äu|eu|ei|ai|au|ie|aa|ee|oo|[aeiouäöüy])h?/g)];
  if (!gruppen.length) return w;
  let g = gruppen[gruppen.length - 1];
  if (gruppen.length > 1 && g[1] === 'e' && /^e[lnrs]?n?$|^e[lr]$/.test(w.slice(g.index))) g = gruppen[gruppen.length - 2];
  let t = w.slice(g.index);
  t = t.replace(/^(a|e|i|o|u|ä|ö|ü)h/, '$1').replace(/^aa/, 'a').replace(/^ee/, 'e').replace(/^oo/, 'o').replace(/^ai/, 'ei').replace(/^äu/, 'eu');
  t = t.replace(/(.)\1/g, '$1').replace(/tz/g, 'z').replace(/ck/g, 'k').replace(/d$/, 't').replace(/g$/, 'k').replace(/b$/, 'p');
  return t;
}
export const reimen = (a, b) => reimteil(a) === reimteil(b);

// Lauteinheit vereinheitlichen (Regel 3): ll = l, ck = k, tz = z, ie = i, uh = u, ee = e …
export function grundlaut(einheit) {
  let e = kleinWort(einheit);
  if (/^([bdfglmnprst])\1$/.test(e)) return e[0];
  if (e === 'ck') return 'k';
  if (e === 'tz') return 'z';
  if (e === 'ie' || e === 'ih' || e === 'ieh') return 'i';
  if (/^[aeiouäöü]h$/.test(e)) return e[0];
  if (/^(aa|ee|oo)$/.test(e)) return e[0];
  return e;
}
// Versteckte Laute in Einheiten (für diese Laute ist ein Wort mit der Einheit gesperrt)
const VERSTECKT = { pf: ['p', 'f'], x: ['k', 's'], chs: ['k', 's', 'ch'], qu: ['k', 'w'], nk: ['n', 'k'], ng: ['n', 'g'] };
// Wie oft kommt der Laut im Wort vor? null = gesperrt (versteckter Laut, r nach Vokal)
export function lautZahl(w, laut) {
  laut = grundlaut(laut);
  for (const e of w.laute.map(kleinWort)) if (VERSTECKT[e]?.includes(laut)) return null;
  if (laut === 'r') {
    const l = w.laute.map(kleinWort);
    for (let i = 0; i < l.length; i++) if (grundlaut(l[i]) === 'r' && !(l[i + 1] && VOKALE.includes(grundlaut(l[i + 1])[0]))) return null;
  }
  return w.laute.filter((e) => grundlaut(e) === laut).length;
}
// Stelle des Lauts: 'vorne' (erste Einheit), 'hinten' (letzte), 'mitte'; null wenn nicht genau einmal
export function lautStelle(w, laut) {
  if (lautZahl(w, laut) !== 1) return null;
  const i = w.laute.findIndex((e) => grundlaut(e) === grundlaut(laut));
  return i === 0 ? 'vorne' : i === w.laute.length - 1 ? 'hinten' : 'mitte';
}

// Werkzeug für einen Kontext: Freigabe, Lexikon, Regeln. Wird pro ctx einmal gebaut.
const CACHE = new WeakMap();
export function werkzeug(ctx) {
  const schluessel = ctx._basis || ctx;
  if (CACHE.has(schluessel)) return CACHE.get(schluessel);
  const W = ctx.lexikon, B = ctx.buchstaben;
  const frei = ctx.freigabe instanceof Set ? ctx.freigabe : new Set(ctx.freigabe || []);
  const woerter = W.woerter;
  const nachWort = new Map(woerter.map((w) => [w.wort, w]));
  const nachBild = new Map(woerter.map((w) => [w.bild, w]));
  const buchstabe = new Map(B.liste.map((b) => [b.id, b]));
  const klang = new Set(W.klangNieZusammen.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
  const verw = new Set(W.verwechselbar.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
  const T = {
    W, B, frei, woerter, ctx,
    wort: (t) => nachWort.get(t) || null,
    vonBild: (b) => nachBild.get(b) || null,
    buchstabe: (id) => buchstabe.get(id) || null,
    // Lesen und Schreiben: alle Buchstaben und Verbindungen eingeführt
    lesbar: (braucht) => braucht.every((b) => frei.has(b)),
    lesbaresWort: (w) => w.braucht.every((b) => frei.has(b)),
    // Sichtwörter gelten als Wortbilder: nur ihre Einzelbuchstaben müssen eingeführt sein (Regel 6)
    sichtwoerter: (gruppe = null) => W.sichtwoerter.filter((s) => (gruppe === null || s.gruppe === gruppe) && [...kleinWort(s.wort)].every((c) => frei.has(c))),
    istSichtwort: (t) => W.sichtwoerter.some((s) => kleinWort(s.wort) === kleinWort(t)),
    // Regel 1: Klänge, die gleich klingen oder von der Mundart abhängen
    klangKonflikt: (a, b) => a === b || klang.has(`${a}|${b}`),
    nieZusammen: (a, b) => a === b || !!buchstabe.get(a)?.nieZusammen?.includes(b) || !!buchstabe.get(b)?.nieZusammen?.includes(a),
    // Bilder (Abschnitt 6): verwechselbare Paare und Unterbegriffe nie zusammen
    verwechselbar: (a, b) => verw.has(`${a.wort}|${b.wort}`) || a.art === b.wort || b.art === a.wort,
    zusammenOk: (liste) => liste.every((a, i) => liste.every((b, j) => i >= j || (a.wort !== b.wort && a.bild !== b.bild && !T.verwechselbar(a, b)))),
    // Bild nur, wenn der Name sicher ist oder das Wort vor der Antwort gesprochen bzw. gezeigt wird (Regel 4)
    bildOk: (w, { gesprochen = false, zaehlen = false } = {}) => (!w.nameUnsicher || gesprochen) && !(zaehlen && w.bildMehrere),
    // Sprechen: Silben einzeln, Dehnlaut, mit oder ohne Artikel
    silbenSprich: (w) => w.silben.join(' … '),
    dehnlaut: (laut) => ctx.dehnlautText?.[laut] || null,
    mitArtikel: (w) => `${w.artikel} ${w.wort}`,
    gross: (t) => t.charAt(0).toUpperCase() + t.slice(1),
    // Kandidaten ziehen, die sich miteinander vertragen
    waehle(r, kandidaten, n, passt = () => true) {
      const gewaehlt = [];
      for (const k of r.shuffle(kandidaten)) {
        if (gewaehlt.length >= n) break;
        if (gewaehlt.every((g) => g.wort !== k.wort && g.bild !== k.bild && !T.verwechselbar(g, k) && passt(g, k))) gewaehlt.push(k);
      }
      return gewaehlt.length === n ? gewaehlt : null;
    },
  };
  CACHE.set(schluessel, T);
  return T;
}

// Option einer Bildwahl: { bild, wort } (wort wird vor der Antwort genannt, wenn namenSprechen)
export const bildOption = (w) => ({ bild: w.bild, wort: w.wort });

// Feste Inhalte mehrerer Dateien zusammenführen: { saetze: [...], geschichten: [...], anweisungen: [...], gegenteile: [...], bildergeschichten: [...] }
export const INHALT_ARTEN = ['saetze', 'geschichten', 'anweisungen', 'gegenteile', 'bildergeschichten'];
export function mischeInhalte(dateien) {
  const aus = Object.fromEntries(INHALT_ARTEN.map((k) => [k, []]));
  for (const d of dateien) for (const k of INHALT_ARTEN) if (Array.isArray(d?.[k])) aus[k].push(...d[k]);
  return aus;
}
