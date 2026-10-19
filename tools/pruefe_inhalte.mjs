// Prüft feste Deutsch-Inhalte (site/data/inhalte/deutsch/*.json): Schema, IDs, Bilder, «braucht», Satzlänge, Schreibweise.
// Die Regeln stehen in site/js/core/inhalte-pruefen.js (auch für den Paket-Import im Elternbereich).
// Aufruf: node tools/pruefe_inhalte.mjs [datei ...]   (ohne Angabe: alle Dateien in site/data/inhalte/deutsch)
import fs from 'node:fs';
import path from 'node:path';
import { pruefeInhalte } from '../site/js/core/inhalte-pruefen.js';

const ORDNER = 'site/data/inhalte/deutsch';
const dateien = process.argv.slice(2).length ? process.argv.slice(2) : (fs.existsSync(ORDNER) ? fs.readdirSync(ORDNER).filter((d) => d.endsWith('.json')).map((d) => path.join(ORDNER, d)) : []);
const W = JSON.parse(fs.readFileSync('site/data/woerter.json', 'utf8'));
const B = JSON.parse(fs.readFileSync('site/data/buchstaben.json', 'utf8'));
const K = JSON.parse(fs.readFileSync('site/data/katalog/deutsch.json', 'utf8'));

let fehler = 0, warnungen = 0;
const alleIds = new Set();
for (const datei of dateien) {
  let d;
  try { d = JSON.parse(fs.readFileSync(datei, 'utf8')); } catch (e) { fehler++; console.log(`FEHLER ${datei}: kein gültiges JSON: ${e.message}`); continue; }
  if (d.fach !== 'D' || !d.teil) { fehler++; console.log(`FEHLER ${datei}: «fach» oder «teil» fehlt`); }
  const r = pruefeInhalte(d, { W, B, K, alleIds, name: path.basename(datei) });
  for (const t of r.warnungen) console.log(`Warnung ${t}`);
  for (const t of r.fehler) console.log(`FEHLER ${t}`);
  fehler += r.fehler.length; warnungen += r.warnungen.length;
}
console.log(`${dateien.length} Dateien, ${alleIds.size} Inhalte, ${fehler} Fehler, ${warnungen} Warnungen.`);
process.exit(fehler ? 1 : 0);
