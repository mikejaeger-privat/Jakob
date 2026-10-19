// Nachspur-Prüfung: genaues und leicht zittriges Nachfahren wird angenommen, falsche Richtung, halbe Zeichen,
// Kritzeln und ein anderes Zeichen nicht.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bewerte, zittern } from '../../site/js/core/nachspur.js';
import { zufall } from '../../site/js/core/util.js';

const S = JSON.parse(fs.readFileSync(new URL('../../site/data/schrift/basisschrift.json', import.meta.url), 'utf8'));
const vorlage = (z) => S.zeichen[z].striche.map((s) => s.punkte);

test('genau nachgefahren: angenommen', () => {
  for (const z of Object.keys(S.zeichen)) assert.ok(bewerte(vorlage(z), vorlage(z)).ok, z);
});

test('zittrig, leicht verschoben und mit ausgelassenen Punkten: angenommen', () => {
  const r = zufall(7);
  for (const z of Object.keys(S.zeichen)) {
    const dx = (r.next() - 0.5) * 10, dy = (r.next() - 0.5) * 10;   // ganzer Strich bis 5 Einheiten daneben
    const spur = vorlage(z).map((st) => zittern(st, 3, r.next).map(([x, y]) => [x + dx, y + dy]).filter((_, i) => i % 3 !== 1));
    const e = bewerte(vorlage(z), spur);
    assert.ok(e.ok, `${z}: ${JSON.stringify(e)}`);
  }
});

test('falsche Richtung bei offenen Strichen: nicht angenommen', () => {
  for (const z of ['1', '2', '3', '4', '5', '6', '7', '9']) {
    const spur = vorlage(z).map((st) => st.slice().reverse());
    assert.equal(bewerte(vorlage(z), spur).ok, false, z);
  }
});

test('nur die Hälfte: nicht angenommen', () => {
  for (const z of Object.keys(S.zeichen)) {
    const spur = vorlage(z).map((st) => st.slice(0, Math.floor(st.length * 0.45)));
    assert.equal(bewerte(vorlage(z), spur).ok, false, z);
  }
});

test('Kritzeln über die ganze Fläche: nicht angenommen', () => {
  const kritzel = [];
  for (let y = 0; y <= 100; y += 8) { const zeile = []; for (let x = 0; x <= 64; x += 2) zeile.push([y % 16 ? 64 - x : x, y]); kritzel.push(...zeile); }
  for (const z of Object.keys(S.zeichen)) assert.equal(bewerte(vorlage(z), [kritzel]).ok, false, z);
});

test('ein anderes Zeichen: nicht angenommen', () => {
  for (const [a, b] of [['1', '7'], ['7', '1'], ['0', '1'], ['3', '4'], ['6', '9'], ['9', '6'], ['2', '5'], ['4', '7']]) assert.equal(bewerte(vorlage(a), vorlage(b)).ok, false, `${b} statt ${a}`);
});

test('Reihenfolge der Striche wird nur gemeldet', () => {
  const e = bewerte(vorlage('4'), vorlage('4').slice().reverse());
  assert.ok(e.ok);
  assert.equal(e.reihenfolge, false);
});
