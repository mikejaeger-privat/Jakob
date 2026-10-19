// Register der Mathematik-Generatoren. Die Gruppen werden beim ersten Gebrauch nachgeladen.
import { zufall } from '../core/util.js';

export const GRUPPEN = ['za', 'me', 'ze', 're', 'fo', 'gr'];
const geladen = new Map();

export async function ladeGruppe(g) {
  if (!geladen.has(g)) geladen.set(g, import(`./${g}.js`).then((m) => m.generatoren));
  return geladen.get(g);
}
export async function ladeAlle() {
  const alle = {};
  for (const g of GRUPPEN) Object.assign(alle, await ladeGruppe(g));
  return alle;
}

// Ist die Stufe mit dem freigegebenen Zahlenraum spielbar?
export const stufeFrei = (st, grenze) => (st.raum ?? 10) <= grenze;

// Erzeugt eine Aufgabe einer Stufe oder null (Zahlenraum nicht frei, keine gültige Aufgabe möglich).
// f: Fertigkeit aus dem Katalog; ctx: { grenze, begriffe, stimme }. Gleicher Startwert ergibt dieselbe Aufgabe.
export async function erzeuge(f, stufe, seed, ctx) {
  const st = f.stufen[stufe];
  if (!st || !stufeFrei(st, ctx.grenze)) return null;
  const gen = (await ladeGruppe(f.gruppe.toLowerCase()))[f.id]?.[stufe];
  if (!gen) return null;
  return fertigeAufgabe(gen, f, stufe, seed, ctx);
}
export function fertigeAufgabe(gen, f, stufe, seed, ctx) {
  const st = f.stufen[stufe];
  const a = gen(zufall(seed), { ...ctx, bis: st.raum ?? 10 });
  if (!a) return null;
  return { ...a, id: `${f.id}-${stufe}-${a.sig}`, f: f.id, s: Number(stufe), seed, stimme: st.stimme ?? f.stimme, fach: 'M' };
}
