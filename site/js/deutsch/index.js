// Register der Wortgeneratoren (Deutsch). Die Gruppen werden beim ersten Gebrauch nachgeladen.
import { zufall } from '../core/util.js';
import { werkzeug, brauchtText, zerlege } from './lib.js';

export const GRUPPEN = ['hb', 'bu', 'le', 'sc', 'ws', 'hv'];
const geladen = new Map();
export async function ladeGruppe(g) {
  if (!geladen.has(g)) geladen.set(g, import(`./${g}.js`).then((m) => m.generatoren));
  return geladen.get(g);
}

// Ist die Stufe mit Freigabe, Stimme und Hörtest spielbar? (ohne die Aufgabe zu bauen)
export function stufeFrei(f, stufe, ctx) {
  const st = f.stufen[stufe];
  if (!st) return false;
  const stimme = st.stimme ?? f.stimme;
  if (stimme === 'noetig' && !ctx.stimme) return false;
  if (st.bedingung === 'silben' && !ctx.silben) return false;
  if (st.bedingung === 'dehnlaute' && !ctx.dehnlaute) return false;
  const frei = ctx.freigabe instanceof Set ? ctx.freigabe : new Set(ctx.freigabe || []);
  if (st.braucht && !st.braucht.every((b) => frei.has(b))) return false;
  if (st.auswahl && !st.auswahl.some((b) => frei.has(b))) return false;
  // Lernwörter der Woche: nur mit mindestens einem eingetragenen Wort, dessen Buchstaben alle eingeführt sind
  if (f.quelle === 'eltern' && !(ctx.lernwoerter || []).some((w) => typeof w === 'string' && zerlege(w.trim()).every((e) => frei.has(e)))) return false;
  return true;
}

// Die Buchstaben, die eine Aufgabe zeigt, sind alle eingeführt? (Sichtwörter als Wortbilder: nur Einzelbuchstaben)
export function brauchtOk(a, ctx) {
  const T = werkzeug(ctx);
  return (a.braucht || []).every((b) => T.frei.has(b));
}

export async function erzeuge(f, stufe, seed, ctx) {
  if (!stufeFrei(f, stufe, ctx)) return null;
  const gen = (await ladeGruppe(f.gruppe.toLowerCase()))[f.id]?.[stufe];
  if (!gen) return null;
  return fertigeAufgabe(gen, f, stufe, seed, ctx);
}
export function fertigeAufgabe(gen, f, stufe, seed, ctx) {
  const st = f.stufen[stufe];
  const a = gen(zufall(seed), { ...ctx, stufe: st, _basis: ctx._basis || ctx });
  if (!a) return null;
  if (!brauchtOk(a, ctx)) return null;
  return { ...a, id: `${f.id}-${stufe}-${a.sig}`, f: f.id, s: Number(stufe), seed, stimme: st.stimme ?? f.stimme, fach: 'D' };
}
export { brauchtText };
