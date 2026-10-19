// Kontext für die Generatoren (Zahlenraum, Freigabe, Stimme), Spielbarkeit einer Stufe und die Vorschau der Eltern.
// Den Tagesplan spielt ui/sitzung.js.
import { erzeuge as erzeugeM, stufeFrei as raumFrei } from '../math/index.js';
import { erzeuge as erzeugeD, stufeFrei as deutschFrei } from '../deutsch/index.js';
import { spieleAufgabe } from './aufgabe.js';
import { Z, protokolliere } from '../app/zustand.js';
import { G, heute } from '../app/steuerung.js';
import { stimmeDa } from '../app/sprache.js';
import { neuerSeed } from '../core/util.js';
import { setzeSpielbar } from '../app/lernen.js';

export function matheCtx() {
  return { grenze: Z.einstellungen.zahlenraum || 20, begriffe: { ...G.P.begriffe, ...(Z.einstellungen.begriffe || {}) }, stimme: stimmeDa() };
}
// Deutsch: Freigabe aus dem Buchstabenplan der Eltern, Hörtest-Ergebnis für Silben und Dehnlaute
let deutschCache = null;
export function deutschCtx({ vorschau = false } = {}) {
  const freigabe = new Set(Object.entries(Z.buchstaben?.frei || {}).filter(([, v]) => v).map(([k]) => k));
  const schluessel = [[...freigabe].sort().join(','), stimmeDa(), Z.einstellungen.silben, Z.einstellungen.dehnlaute, vorschau, (Z.lernwoerter || []).filter((x) => !x.geloescht).map((x) => x.wort).join(','), G.stand || 0].join('|');
  if (deutschCache?.schluessel === schluessel) return deutschCache.ctx;
  const ctx = {
    lexikon: G.W, buchstaben: G.B, freigabe, inhalte: G.IN, dehnlautText: G.P.sprache.dehnlautText,
    stimme: vorschau || stimmeDa(), silben: vorschau || Z.einstellungen.silben !== false, dehnlaute: vorschau || Z.einstellungen.dehnlaute !== false,
    lernwoerter: (Z.lernwoerter || []).filter((x) => !x.geloescht).map((x) => (typeof x === 'string' ? x : x.wort)).filter(Boolean), zuletzt: new Set(),
  };
  deutschCache = { schluessel, ctx };
  return ctx;
}
const istMathe = (f) => f.id.startsWith('M-');

// Spielbar mit Zahlenraum, Freigabe, Stimme und Hörtest?
export function spielbar(f, s, { vorschau = false } = {}) {
  if (!f) return false;
  const st = f.stufen[s];
  if (!st) return false;
  if (istMathe(f)) {
    if (!raumFrei(st, matheCtx().grenze)) return false;
    return vorschau || (st.stimme ?? f.stimme) !== 'noetig' || stimmeDa();
  }
  return deutschFrei(f, s, deutschCtx({ vorschau }));
}

export async function spieleFolge(wurzel, auswahl, { modus = 'normal' } = {}) {
  document.body.classList.add('in-sitzung');
  const ergebnisse = [];
  const vorschau = modus === 'vorschau';
  try {
    for (let i = 0; i < auswahl.length; i++) {
      const { f, s } = auswahl[i];
      let a = null;
      // In der Vorschau auch Aufgaben zeigen, die eine Stimme brauchen (die Eltern sollen sie sehen können)
      const ctx = istMathe(f) ? (vorschau ? { ...matheCtx(), stimme: true } : matheCtx()) : deutschCtx({ vorschau });
      const erzeuge = istMathe(f) ? erzeugeM : erzeugeD;
      for (let v = 0; v < 6 && !a; v++) a = await erzeuge(f, s, neuerSeed(), ctx);
      if (!a) continue;
      const r = await spieleAufgabe(wurzel, a, { modus, fortschritt: { jetzt: i, von: auswahl.length } });
      if (r.abbruch) { ergebnisse.abbruch = true; break; }
      ergebnisse.push(r);
      if (!vorschau) protokolliere({ tag: heute(), fach: a.fach, f: a.f, s: a.s, wert: r.wert, versuche: r.versuche, hilfe: r.hilfe, ms: r.ms, typ: a.typ, sig: a.sig });
    }
  } finally {
    document.body.classList.remove('in-sitzung');
  }
  return ergebnisse;
}

// Vorschau für die Eltern: drei Aufgaben einer Stufe, nichts wird gespeichert
export async function zeigeVorschau(wurzel, id, s) {
  const f = G.k.fertigkeiten.get(id);
  if (!f || !f.stufen[s]) { location.hash = '#/eltern/aufgaben'; return; }
  await spieleFolge(wurzel, [{ f, s }, { f, s }, { f, s }], { modus: 'vorschau' });
  location.hash = '#/eltern/aufgaben';
}

setzeSpielbar(spielbar);
