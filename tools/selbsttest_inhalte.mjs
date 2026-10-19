// Selbsttest der festen Deutsch-Inhalte: Kommt jede Inhaltseinheit in den Aufgaben ihrer Stufen wirklich vor?
// Erzeugt je Fertigkeit und Stufe viele Aufgaben (alle Buchstaben freigegeben und mit der Standard-Freigabe) und
// sammelt die Inhalts-IDs (daten.id / daten.ids). Eine Einheit, die nie vorkommt, ist tot oder durch «braucht» gesperrt.
// Aufruf: node tools/selbsttest_inhalte.mjs [--n 3000]
import { fertigeAufgabe, ladeGruppe } from '../site/js/deutsch/index.js';
import { K, INHALTE, kontext, FREI_ALLE, FREI_STANDARD } from './deutsch-kontext.mjs';

const args = process.argv.slice(2);
const iN = args.indexOf('--n');
const N = iN >= 0 ? Number(args[iN + 1]) : 3000;
const F = new Map(K.fertigkeiten.map((f) => [f.id, f]));

// Alle Einheiten mit Stufenzuordnung
const einheiten = [];
for (const [teil, liste] of Object.entries(INHALTE)) {
  if (!Array.isArray(liste)) continue;
  for (const x of liste) if (x && x.id && x.stufen) einheiten.push({ teil, id: x.id, stufen: x.stufen, braucht: x.braucht || [] });
}
const gesehen = { alle: new Set(), standard: new Set() };
const paare = new Set(einheiten.flatMap((e) => Object.entries(e.stufen).map(([f, s]) => `${f}|${s}`)));
for (const p of paare) {
  const [fid, s] = p.split('|');
  const f = F.get(fid);
  if (!f) continue;
  const gen = (await ladeGruppe(f.gruppe.toLowerCase()))[fid]?.[s];
  if (!gen) { console.log(`FEHLER: kein Generator für ${p}`); continue; }
  for (const [name, frei] of [['alle', FREI_ALLE], ['standard', FREI_STANDARD]]) {
    const ctx = kontext({ freigabe: frei });
    for (let seed = 1; seed <= N; seed++) {
      const a = fertigeAufgabe(gen, f, s, seed * 104729 + 11, ctx);
      if (!a?.daten) continue;
      if (a.daten.id) gesehen[name].add(a.daten.id);
      for (const id of a.daten.ids || []) gesehen[name].add(id);
    }
  }
}
// Einheiten ohne ID-Rückmeldung im Generator (z. B. Gegenteile in Paaren) zählen über «ids»
let fehler = 0, gesperrt = 0;
for (const e of einheiten) {
  if (!gesehen.alle.has(e.id)) { fehler++; console.log(`FEHLER ${e.teil} ${e.id}: kommt in keiner Aufgabe vor (${Object.entries(e.stufen).map(([f, s]) => f + '/' + s).join(', ')})`); }
  else if (!gesehen.standard.has(e.id)) { gesperrt++; console.log(`Hinweis ${e.teil} ${e.id}: mit der Standard-Freigabe gesperrt (braucht ${e.braucht.filter((b) => !FREI_STANDARD.has(b)).join(', ') || '?'})`); }
}
console.log(`${einheiten.length} Inhalte mit Stufen, ${einheiten.length - fehler} kommen vor, ${gesperrt} davon erst mit weiteren Verbindungen, ${fehler} nie.`);
process.exit(fehler ? 1 : 0);
