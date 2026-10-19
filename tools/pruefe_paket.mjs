// Prüft ein Paket mit eigenen Inhalten (INHALTE.md) genau so wie der Import im Elternbereich, zeigt aber alle Fehler.
// Aufruf: node tools/pruefe_paket.mjs paket.json [...]
import fs from 'node:fs';
import { pruefePaket, PAKET_MAX_BYTES } from '../site/js/core/paket.js';
import { mischeInhalte } from '../site/js/deutsch/lib.js';

const lies = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const index = lies('site/data/inhalte/index.json');
const D = lies('site/data/katalog/deutsch.json'), M = lies('site/data/katalog/mathe.json');
const G = {
  k: { D, M, fertigkeiten: new Map([...D.fertigkeiten, ...M.fertigkeiten].map((f) => [f.id, f])) },
  B: lies('site/data/buchstaben.json'), W: lies('site/data/woerter.json'),
  IN: mischeInhalte((index.D || []).map((d) => lies('site/data/inhalte/' + d))),
};
let fehler = 0;
const dateien = process.argv.slice(2);
if (!dateien.length) { console.log('Aufruf: node tools/pruefe_paket.mjs paket.json'); process.exit(2); }
for (const datei of dateien) {
  const groesse = fs.statSync(datei).size;
  if (groesse > PAKET_MAX_BYTES) { console.log(`${datei}: zu gross (${groesse} Bytes, höchstens ${PAKET_MAX_BYTES})`); fehler++; continue; }
  let p;
  try { p = lies(datei); } catch (e) { console.log(`${datei}: kein gültiges JSON (${e.message})`); fehler++; continue; }
  const r = pruefePaket(p, G);
  if (r.fehler.length) { fehler += r.fehler.length; console.log(`${datei}: ${r.fehler.length} Fehler (höchstens zwölf werden gezeigt)`); r.fehler.forEach((f) => console.log('  ' + f)); continue; }
  const z = r.paket.zaehler;
  console.log(`${datei}: in Ordnung – «${r.paket.titel}» (id ${r.paket.id}): ${z.lernwoerter} Lernwörter, ${z.woerter} Bildwörter, ${z.inhalte} Inhalte.`);
}
process.exit(fehler ? 1 : 0);
