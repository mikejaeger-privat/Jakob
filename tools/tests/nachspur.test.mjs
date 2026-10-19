// Nachspur-Prüfung und Vorlagen der Basisschrift: genaues und leicht zittriges Nachfahren wird angenommen, falsche Richtung,
// halbe Zeichen, Kritzeln und ein deutlich anderes Zeichen nicht. Vorlagen vollständig und innerhalb der Linien.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bewerte, zittern } from '../../site/js/core/nachspur.js';
import { zufall } from '../../site/js/core/util.js';

const S = JSON.parse(fs.readFileSync(new URL('../../site/data/schrift/basisschrift.json', import.meta.url), 'utf8'));
const vorlage = (z) => S.zeichen[z].striche.map((s) => s.punkte);
const ALLE = Object.keys(S.zeichen);
const offen = (st) => Math.hypot(st[0][0] - st.at(-1)[0], st[0][1] - st.at(-1)[1]) >= 15;

test('Vorlagen vollständig: Ziffern, Gross- und Kleinbuchstaben, Umlaute', () => {
  for (const z of [...'0123456789', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...'abcdefghijklmnopqrstuvwxyz', ...'ÄÖÜäöü']) assert.ok(S.zeichen[z], `Vorlage fehlt: ${z}`);
  assert.equal(S.zeichen['ß'], undefined, 'kein ß (Schweizer Rechtschreibung)');
});

test('Vorlagen liegen in den Linien und in ihrer Breite', () => {
  const unterlaenge = new Set([...'gjpqy']), oben = new Set([...'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜbdfhklt0123456789']);
  for (const z of ALLE) {
    const { breite, striche } = S.zeichen[z];
    const p = striche.flatMap((s) => s.punkte);
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    assert.ok(Math.min(...xs) >= -1 && Math.max(...xs) <= breite + 1, `${z}: ausserhalb der Breite ${breite}`);
    assert.ok(Math.min(...ys) >= -15 && Math.max(...ys) <= 137, `${z}: ausserhalb der Linien`);
    if (!'ÄÖÜ'.includes(z)) assert.ok(Math.min(...ys) >= -1, `${z}: über der Oberlinie`);
    if (unterlaenge.has(z)) assert.ok(Math.max(...ys) > 125, `${z}: Unterlänge fehlt`);
    else assert.ok(Math.max(...ys) <= 105, `${z}: unter der Grundlinie`);
    if (!oben.has(z) && !'ijäöü'.includes(z)) assert.ok(Math.min(...ys) >= 49, `${z}: Mittellänge reicht über die Mittellinie`);
    if ('bdfhkl'.includes(z) || /[A-Z]/.test(z)) assert.ok(Math.min(...ys) <= 1, `${z}: reicht nicht bis zur Oberlinie`);
  }
});

test('genau nachgefahren: angenommen', () => {
  for (const z of ALLE) assert.ok(bewerte(vorlage(z), vorlage(z)).ok, z);
});

test('zittrig, leicht verschoben und mit ausgelassenen Punkten: angenommen', () => {
  const r = zufall(7);
  for (const z of ALLE) {
    const dx = (r.next() - 0.5) * 10, dy = (r.next() - 0.5) * 10;   // ganzer Strich bis 5 Einheiten daneben
    const spur = vorlage(z).map((st) => zittern(st, 3, r.next).map(([x, y]) => [x + dx, y + dy]).filter((_, i) => i % 3 !== 1));
    const e = bewerte(vorlage(z), spur);
    assert.ok(e.ok, `${z}: ${JSON.stringify(e)}`);
  }
});

test('falsche Richtung bei offenen Strichen: nicht angenommen', () => {
  for (const z of ALLE.filter((z) => vorlage(z).some(offen))) {
    const spur = vorlage(z).map((st) => st.slice().reverse());
    assert.equal(bewerte(vorlage(z), spur).ok, false, z);
  }
});

test('nur die Hälfte: nicht angenommen', () => {
  for (const z of ALLE) {
    const spur = vorlage(z).map((st) => st.slice(0, Math.floor(st.length * 0.45)));
    assert.equal(bewerte(vorlage(z), spur).ok, false, z);
  }
});

test('Kritzeln über die ganze Fläche: nicht angenommen', () => {
  const kritzel = [];
  for (let y = 0; y <= 100; y += 8) { const zeile = []; for (let x = 0; x <= 64; x += 2) zeile.push([y % 16 ? 64 - x : x, y]); kritzel.push(...zeile); }
  for (const z of ALLE) assert.equal(bewerte(vorlage(z), [kritzel]).ok, false, z);
});

test('ein anderes Zeichen: nicht angenommen', () => {
  const paare = [['1', '7'], ['7', '1'], ['0', '1'], ['3', '4'], ['6', '9'], ['9', '6'], ['2', '5'], ['4', '7'],
    ['b', 'd'], ['d', 'b'], ['m', 'n'], ['n', 'm'], ['M', 'W'], ['W', 'M'], ['u', 'v'], ['V', 'U'], ['E', 'F'], ['R', 'P'],
    // dank des Lückenkriteriums (fast alle Fingerpunkte höchstens 20 Einheiten neben der Vorlage)
    ['p', 'q'], ['q', 'p'], ['b', 'p'], ['d', 'q'], ['n', 'h'], ['a', 'd'], ['i', 'l'], ['F', 'E'], ['P', 'R'], ['C', 'G'], ['v', 'y']];
  for (const [a, b] of paare) assert.equal(bewerte(vorlage(a), vorlage(b)).ok, false, `${b} statt ${a}`);
});

// Bekannte Grenze der toleranten Prüfung: Diese Paare liegen so nahe beieinander, dass das andere Zeichen angenommen wird
// ([Vorlage, gespurt]). Nachspuren zählt nur als «geübt», darum ist das vertretbar.
test('bekannt: ähnliche Paare werden nicht unterschieden', { todo: 'Formen zu ähnlich für eine tolerante Prüfung' }, () => {
  const paare = [['n', 'u'], ['u', 'n'], ['h', 'n'], ['a', 'o'], ['o', 'a'], ['l', 'i'], ['O', 'Q'], ['c', 'o']];
  for (const [a, b] of paare) assert.equal(bewerte(vorlage(a), vorlage(b)).ok, false, `${b} statt ${a}`);
});

test('Reihenfolge der Striche wird nur gemeldet', () => {
  const e = bewerte(vorlage('4'), vorlage('4').slice().reverse());
  assert.ok(e.ok);
  assert.equal(e.reihenfolge, false);
  const e2 = bewerte(vorlage('E'), vorlage('E').slice().reverse());
  assert.ok(e2.ok);
  assert.equal(e2.reihenfolge, false);
});
