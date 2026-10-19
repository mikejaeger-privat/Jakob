// Gibt Beispielaufgaben aller Stufen lesbar aus, zum Gegenlesen wie eine Lehrperson.
// Aufruf: node tools/zeige_mathe.mjs [gruppe|fertigkeit ...] [anzahl] [--grenze 20]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loesungText } from '../site/js/core/pruefen.js';
import { erzeuge } from '../site/js/math/index.js';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const iG = args.indexOf('--grenze');
const grenze = iG >= 0 ? Number(args[iG + 1]) : 100;
const rest = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--grenze');
const anzahl = Number(rest.find((a) => /^\d+$/.test(a)) || 3);
const filter = rest.filter((a) => !/^\d+$/.test(a)).map((a) => a.toLowerCase());
const katalog = JSON.parse(fs.readFileSync(path.join(wurzel, 'site/data/katalog/mathe.json'), 'utf8'));
const P = JSON.parse(fs.readFileSync(path.join(wurzel, 'site/data/parameter.json'), 'utf8'));

const kurz = (v) => (v ? JSON.stringify(v).replace(/"(\w+)":/g, '$1:').replace(/"/g, '') : '');
for (const f of katalog.fertigkeiten) {
  if (filter.length && !filter.includes(f.gruppe.toLowerCase()) && !filter.includes(f.id.toLowerCase())) continue;
  console.log(`\n=== ${f.id} ${f.name}`);
  for (const stufe of Object.keys(f.stufen)) {
    console.log(`  --- Stufe ${stufe}: ${f.stufen[stufe].text}`);
    for (let i = 1; i <= anzahl; i++) {
      let a;
      try { a = await erzeuge(f, stufe, i * 104729, { grenze, begriffe: P.begriffe, stimme: true }); } catch (e) { console.log('    Ausnahme:', e.message); continue; }
      if (!a) { console.log('    (keine Aufgabe)'); continue; }
      console.log(`    [${a.typ}] ${a.sprich || a.frage}${a.zeige ? '   ZEIGE: ' + (Array.isArray(a.zeige) ? a.zeige.join(' ') : a.zeige) : ''}${a.vorlesen ? '   VORLESEN: ' + a.vorlesen : ''}${a.auftrag ? '   AUFTRAG: ' + a.auftrag : ''}`);
      if (a.visual) console.log(`      Bild: ${kurz(a.visual)}`);
      if (a.visualNachFehler) console.log(`      Bild nach Hinweis: ${kurz(a.visualNachFehler)}`);
      if (a.optionen) console.log(`      Auswahl: ${a.optionen.map((o, j) => (j === a.richtig ? '*' : '') + (typeof o === 'object' ? kurz(o) : o)).join(' | ')}`);
      if (a.teile) console.log(`      Teile: ${a.teile.map((t) => (typeof t === 'object' ? kurz(t) : t)).join(' | ')}`);
      if (a.kacheln) console.log(`      Kacheln: ${a.kacheln.join(' ')}`);
      if (a.szene) console.log(`      Szene: ${kurz(a.szene)}`);
      console.log(`      Lösung: ${loesungText(a)}`);
      console.log(`      Hinweis: ${a.hinweis}`);
      console.log(`      Erklärung: ${a.erklaerung}`);
      if (a.fehlerbilder?.length) console.log(`      Fehlerbilder: ${a.fehlerbilder.map((x) => x.eingabe + ' → ' + x.text).join(' / ')}`);
    }
  }
}
