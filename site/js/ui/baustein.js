// Bausteine spielen: eine Folge von Aufgaben, danach zurück zum Weg.
// Etappe 3: vorläufige Auswahl aus der Mathematik der 1. Klasse; Lernmodell und Tagesplan folgen in Etappe 5.
import { erzeuge, stufeFrei } from '../math/index.js';
import { spieleAufgabe } from './aufgabe.js';
import { Z, protokolliere } from '../app/zustand.js';
import { G, heute } from '../app/steuerung.js';
import { stimmeDa } from '../app/sprache.js';
import { neuerSeed, zufall } from '../core/util.js';

export function matheCtx() {
  return { grenze: Z.einstellungen.zahlenraum || 20, begriffe: { ...G.P.begriffe, ...(Z.einstellungen.begriffe || {}) }, stimme: stimmeDa() };
}

// Spielbar, wenn der Zahlenraum frei ist und eine nötige Stimme da ist
export function spielbar(f, s) {
  const st = f.stufen[s];
  if (!st || !stufeFrei(st, matheCtx().grenze)) return false;
  const stimme = st.stimme ?? f.stimme;
  return stimme !== 'noetig' || stimmeDa();
}

export async function spieleFolge(wurzel, auswahl, { modus = 'normal' } = {}) {
  document.body.classList.add('in-sitzung');
  const ergebnisse = [];
  try {
    for (let i = 0; i < auswahl.length; i++) {
      const { f, s } = auswahl[i];
      let a = null;
      // In der Vorschau auch Aufgaben zeigen, die eine Stimme brauchen (die Eltern sollen sie sehen können)
      const ctx = modus === 'vorschau' ? { ...matheCtx(), stimme: true } : matheCtx();
      for (let v = 0; v < 5 && !a; v++) a = await erzeuge(f, s, neuerSeed(), ctx);
      if (!a) continue;
      const r = await spieleAufgabe(wurzel, a, { modus, fortschritt: { jetzt: i, von: auswahl.length } });
      if (r.abbruch) { ergebnisse.abbruch = true; break; }
      ergebnisse.push(r);
      if (modus !== 'vorschau') protokolliere({ t: heute(), fach: 'M', f: a.f, s: a.s, wert: r.wert, versuche: r.versuche, hilfe: r.hilfe, ms: r.ms, typ: a.typ, sig: a.sig });
    }
  } finally {
    document.body.classList.remove('in-sitzung');
  }
  return ergebnisse;
}

// Vorläufige Auswahl (Etappe 3), bis der Tagesplan aus dem Lernmodell kommt
const AUFWAERMEN = [['M-ME-01', 1], ['M-ME-01', 2], ['M-RE-14', 1], ['M-ZA-05', 1], ['M-ZE-01', 1]];
const SCHLUSS = [['M-FO-03', 1], ['M-ZA-01', 1], ['M-ME-01', 1]];
export function probeAuswahl(art) {
  const r = zufall(neuerSeed());
  const F = G.k.fertigkeiten;
  const aus = (liste, n) => r.sample(liste.map(([id, s]) => ({ f: F.get(id), s })).filter((x) => x.f && spielbar(x.f, x.s)), n);
  if (art === 'aufwaermen') return aus(AUFWAERMEN, 3);
  if (art === 'schluss') return aus(SCHLUSS, 2);
  const kandidaten = G.k.M.fertigkeiten.filter((f) => f.kern === true && f.klasse === 1)
    .flatMap((f) => ['1', '2'].map((s) => ({ f, s }))).filter((x) => spielbar(x.f, x.s));
  const gewaehlt = [];
  for (const x of r.shuffle(kandidaten)) { if (!gewaehlt.some((g) => g.f.id === x.f.id)) gewaehlt.push(x); if (gewaehlt.length >= 5) break; }
  return gewaehlt;
}

// Vorschau für die Eltern: drei Aufgaben einer Stufe, nichts wird gespeichert
export async function zeigeVorschau(wurzel, id, s) {
  const f = G.k.fertigkeiten.get(id);
  if (!f || !f.stufen[s]) { location.hash = '#/eltern/aufgaben'; return; }
  await spieleFolge(wurzel, [{ f, s }, { f, s }, { f, s }], { modus: 'vorschau' });
  location.hash = '#/eltern/aufgaben';
}
