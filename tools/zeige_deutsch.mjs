// Gibt Beispielaufgaben der Deutsch-Stufen lesbar aus, zum Gegenlesen wie eine Lehrperson.
// Aufruf: node tools/zeige_deutsch.mjs [gruppe|fertigkeit ...] [anzahl] [--klein]
import { loesungText } from '../site/js/core/pruefen.js';
import { erzeuge } from '../site/js/deutsch/index.js';
import { K, kontext, FREI_KLEIN } from './deutsch-kontext.mjs';

const args = process.argv.slice(2);
const anzahl = Number(args.find((a) => /^\d+$/.test(a)) || 3);
const filter = args.filter((a) => !/^\d+$/.test(a) && !a.startsWith('--')).map((a) => a.toLowerCase());
const ctx = args.includes('--klein') ? kontext({ freigabe: FREI_KLEIN }) : kontext();
const kurz = (v) => (v ? JSON.stringify(v).replace(/"(\w+)":/g, '$1:').replace(/"/g, '') : '');
for (const f of K.fertigkeiten) {
  if (filter.length && !filter.includes(f.gruppe.toLowerCase()) && !filter.includes(f.id.toLowerCase())) continue;
  console.log(`\n=== ${f.id} ${f.name}`);
  for (const s of Object.keys(f.stufen)) {
    console.log(`  --- Stufe ${s}: ${f.stufen[s].text}`);
    for (let i = 1; i <= anzahl; i++) {
      let a;
      try { a = await erzeuge(f, s, i * 104729 + 17, ctx); } catch (e) { console.log('    Ausnahme:', e.message); continue; }
      if (!a) { console.log('    (keine Aufgabe)'); continue; }
      let z = `    [${a.typ}] ${a.sprich || a.frage}`;
      if (a.auftrag && a.auftrag !== a.frage) z += ` | AUFTRAG ${a.auftrag}`;
      if (a.zeige) z += ` | ZEIGE ${[].concat(a.zeige).join(' / ')}`;
      if (a.vorlesen) z += ` | VORLESEN ${a.vorlesen}`;
      console.log(z);
      if (a.optionen) console.log(`      Auswahl: ${a.optionen.map((o, j) => (j === a.richtig ? '*' : '') + (typeof o === 'object' ? kurz(o) : o)).join(' | ')}`);
      if (a.teile) console.log(`      Teile: ${a.teile.map((t) => (typeof t === 'object' ? kurz(t) : t)).join(' | ')}${a.ablenker ? ' + ' + a.ablenker.join(' ') : ''}`);
      if (a.kacheln) console.log(`      Kacheln: ${a.kacheln.join(' ')}${a.vorlage ? ' | Vorlage ' + kurz(a.vorlage) : ''}`);
      if (a.paare) console.log(`      Paare: ${a.paare.map(([x, y]) => kurz(x) + '–' + kurz(y)).join(' ; ')}`);
      if (a.silben && a.typ === 'silben') console.log(`      Silben: ${a.silben.join(' ')} (${a.modus})`);
      if (a.szene) console.log(`      Szene: ${kurz(a.szene)}`);
      if (a.wort && a.typ === 'lautplatz') console.log(`      Wort: ${a.wort} ${a.bild || ''} Laut: ${a.laut}`);
      console.log(`      Lösung: ${loesungText(a) || kurz(a.loesung ?? a.ziehen ?? '')} | braucht: ${(a.braucht || []).join(' ')}`);
      console.log(`      Hinweis: ${a.hinweis}`);
      console.log(`      Erklärung: ${a.erklaerung}`);
    }
  }
}
