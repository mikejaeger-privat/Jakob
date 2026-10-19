// Antwortprüfung aller Aufgabentypen: richtige Eingaben werden angenommen, falsche nicht; Teilergebnisse stimmen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruefe, passt, hatFuenferstruktur, richtigeEingabe } from '../../site/js/core/pruefen.js';

test('zahl: ein und mehrere Felder, Fehlerbild', () => {
  const a = { typ: 'zahl', loesung: [7], fehlerbilder: [{ eingabe: '8', text: 'eins zu viel' }] };
  assert.equal(pruefe(a, [7]).ok, true);
  assert.equal(pruefe(a, [8]).ok, false);
  assert.equal(pruefe(a, [8]).fehlerbild, 'eins zu viel');
  const b = { typ: 'zahl', loesung: [2, 3, 13] };
  assert.deepEqual(pruefe(b, [2, 4, 13]).teile, [true, false, true]);
  assert.equal(pruefe(b, [2, 3, 13]).ok, true);
});

test('Auswahl: nur der richtige Index', () => {
  const a = { typ: 'wahl-wort', optionen: ['<', '=', '>'], richtig: 2, fehlerbilder: [{ eingabe: '<', text: 'umgekehrt' }] };
  assert.equal(pruefe(a, 2).ok, true);
  assert.equal(pruefe(a, 0).fehlerbild, 'umgekehrt');
  assert.equal(pruefe(a, 1).ok, false);
});

test('Reihenfolge: Lösung und Alternativen, richtige Karten von vorn', () => {
  const a = { typ: 'reihenfolge', teile: ['3', '7', '9'] };
  assert.equal(pruefe(a, [0, 1, 2]).ok, true);
  const r = pruefe(a, [0, 2, 1]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.teile, [true, false, false]);
});

test('Legen: Tauschaufgabe als Alternative', () => {
  const a = { typ: 'legen', loesung: ['3', '+', '6', '9'], alternativen: [['6', '+', '3', '9']] };
  assert.equal(pruefe(a, ['6', '+', '3', '9']).ok, true);
  assert.equal(pruefe(a, ['3', '−', '6', '9']).ok, false);
  assert.deepEqual(pruefe(a, ['3', '−', '6', '9']).teile, [true, false, true, true]);
});

test('Menge legen: Anzahl, Fünferstruktur, Münzen, Zehner und Einer', () => {
  assert.equal(hatFuenferstruktur([0, 1, 2, 3, 4, 5, 6], 'zwanziger'), true);
  assert.equal(hatFuenferstruktur([0, 1, 2, 3, 4, 10, 11], 'zwanziger'), true);
  assert.equal(hatFuenferstruktur([0, 1, 2, 5, 6, 7, 8], 'zwanziger'), false);   // zwei angefangene Fünfer
  assert.equal(hatFuenferstruktur([0, 1, 3], 'zehner'), false);                    // Lücke
  const a = { typ: 'menge-legen', feld: 'zwanziger', ziel: 7, struktur: true };
  assert.equal(pruefe(a, { zellen: [0, 1, 2, 3, 4, 5, 6] }).ok, true);
  assert.equal(pruefe(a, { zellen: [0, 1, 2, 5, 6, 7, 8] }).ok, false);
  assert.equal(pruefe(a, { zellen: [0, 1, 2] }).zuWenig, true);
  assert.equal(pruefe({ typ: 'menge-legen', feld: 'muenzen', ziel: 700 }, { summe: 700 }).ok, true);
  assert.equal(pruefe({ typ: 'menge-legen', feld: 'zehnereiner', ziel: 16 }, { zehner: 1, einer: 6 }).ok, true);
  assert.equal(pruefe({ typ: 'menge-legen', feld: 'zehnereiner', ziel: 16 }, { zehner: 0, einer: 16 }).ok, false);
  for (const a2 of [a, { typ: 'menge-legen', feld: 'zehner', ziel: 4 }]) assert.equal(pruefe(a2, richtigeEingabe(a2)).ok, true);
});

test('Antippen und Zuhören', () => {
  const a = { typ: 'antippen', loesung: ['4,0', '5,1'] };
  assert.equal(pruefe(a, ['5,1', '4,0']).ok, true);
  assert.deepEqual(pruefe(a, ['5,1', '3,0']).teile, [true, false]);
  const b = { typ: 'hoeren-tippen', loesung: ['ball', 'katze'] };
  assert.equal(pruefe(b, ['ball', 'katze']).ok, true);
  assert.equal(pruefe(b, ['katze', 'ball']).ok, false);
  assert.equal(pruefe({ ...b, reihenfolge: false }, ['katze', 'ball']).ok, true);
});

test('Zuordnen: gleiche Werte passen', () => {
  const a = { typ: 'zuordnen', paare: [[{ text: '3 + 2' }, { text: '2 + 3' }], [{ text: '4 + 1' }, { text: '1 + 4' }]] };
  assert.equal(passt(a, 0, 0), true);
  assert.equal(passt(a, 0, 1), false);
});
