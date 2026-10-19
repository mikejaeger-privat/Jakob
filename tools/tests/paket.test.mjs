// Pakete mit eigenen Inhalten (site/js/core/paket.js): Prüfen, Einmischen, Lernwörter
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pruefePaket, wendePaketeAn, lernwoerterAusPaket } from '../../site/js/core/paket.js';
import { mischeInhalte } from '../../site/js/deutsch/lib.js';
import { tagNr } from '../../site/js/core/util.js';

const lies = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
function grundlagen() {
  const index = lies('site/data/inhalte/index.json');
  const D = lies('site/data/katalog/deutsch.json'), M = lies('site/data/katalog/mathe.json');
  return {
    k: { D, M, fertigkeiten: new Map([...D.fertigkeiten, ...M.fertigkeiten].map((f) => [f.id, f])) },
    B: lies('site/data/buchstaben.json'), W: lies('site/data/woerter.json'),
    IN: mischeInhalte((index.D || []).map((d) => lies('site/data/inhalte/' + d))),
  };
}
const BEISPIEL = lies('tools/beispiele/paket-beispiel.json');

test('Beispielpaket ist gültig', () => {
  const r = pruefePaket(BEISPIEL, grundlagen());
  assert.deepEqual(r.fehler, []);
  assert.deepEqual(r.paket.zaehler, { lernwoerter: 3, woerter: 1, inhalte: 2 });
});

test('Fehler werden erkannt und das Paket nicht übernommen', () => {
  const G = grundlagen();
  const fall = (aend) => pruefePaket({ ...structuredClone(BEISPIEL), ...aend }, G).fehler;
  assert.ok(fall({ fach: 'M' }).some((f) => /fach/.test(f)));
  assert.ok(fall({ id: 'mit Leerzeichen' }).some((f) => /id/.test(f)));
  assert.ok(fall({ lernwoerter: ['Strasse!'] }).length);
  assert.ok(fall({ lernwoerter: [{ wort: 'Sonne', test: '6.11.2026' }] }).some((f) => /Datum/.test(f)));
  const wort = structuredClone(BEISPIEL.woerter[0]);
  assert.ok(fall({ woerter: [{ ...wort, wort: 'Hase', silben: ['Ha', 'se'], laute: ['H', 'a', 's', 'e'] }] }).some((f) => /schon vorhanden|braucht/.test(f)));
  assert.ok(fall({ woerter: [{ ...wort, braucht: ['w', 'o'] }] }).some((f) => /braucht/.test(f)));
  assert.ok(fall({ woerter: [{ ...wort, bild: '🐇' }] }).some((f) => /Bild/.test(f)));
  const g = structuredClone(BEISPIEL.inhalte.geschichten[0]);
  assert.ok(fall({ inhalte: { geschichten: [{ ...g, stufen: { 'D-XX-99': 1 } }] } }).some((f) => /unbekannt/.test(f)));
  assert.ok(fall({ inhalte: { geschichten: [{ ...g, id: 'HG-101' }] } }).some((f) => /doppelt/.test(f)));
  assert.ok(fall({ inhalte: { geschichten: [{ ...g, frage: 'Was ist falsch?' }] } }).some((f) => /Kinderbereich/.test(f)));
  assert.ok(fall({ inhalte: { witze: [] } }).some((f) => /unbekannter Teil/.test(f)));
  assert.ok(pruefePaket({ fach: 'D' }, G).fehler.some((f) => /leer/.test(f)));
  assert.ok(fall({ unbekannt: 1 }).some((f) => /unbekanntes Feld/.test(f)));
});

test('Einmischen: Wörter und Inhalte kommen dazu, Entfernen nimmt sie wieder weg', () => {
  const G = grundlagen();
  const n0 = G.W.woerter.length, g0 = G.IN.geschichten.length;
  const p = pruefePaket(BEISPIEL, G).paket;
  wendePaketeAn(G, [p]);
  assert.equal(G.W.woerter.length, n0 + 1);
  assert.equal(G.IN.geschichten.length, g0 + 1);
  assert.ok(G.IN.bildergeschichten.some((x) => x.id === 'P1-BG-01'));
  wendePaketeAn(G, []);
  assert.equal(G.W.woerter.length, n0);
  assert.equal(G.IN.geschichten.length, g0);
});

test('Lernwörter: gleiches Wort nur einmal, Testdatum als Tag', () => {
  const p = pruefePaket(BEISPIEL, grundlagen()).paket;
  const liste = lernwoerterAusPaket([{ id: 'lw-1', wort: 'Mama', test: null, angelegt: 1 }], p, 100, tagNr);
  assert.deepEqual(liste.map((x) => x.wort), ['Mama', 'Sonne', 'rot']);
  assert.equal(liste.find((x) => x.wort === 'Sonne').test, tagNr('2026-11-06'));
  assert.equal(liste.find((x) => x.wort === 'Sonne').paket, 'beispiel');
});
