// Mathematik ZE (Zerlegen): jede Stufe mit 300 Startwerten, Lösung auf einem zweiten Weg nachgerechnet
// (Gleichung aus «zeige» lösen, Zahlenhaus Zeile für Zeile, Plättchen zählen, gerade und ungerade über Paare).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generatoren } from '../../site/js/math/ze.js';
import { fertigeAufgabe } from '../../site/js/math/index.js';
import { pruefe, richtigeEingabe } from '../../site/js/core/pruefen.js';

const katalog = JSON.parse(fs.readFileSync(new URL('../../site/data/katalog/mathe.json', import.meta.url), 'utf8'));
const P = JSON.parse(fs.readFileSync(new URL('../../site/data/parameter.json', import.meta.url), 'utf8'));
const F = Object.fromEntries(katalog.fertigkeiten.map((f) => [f.id, f]));
const ctx = { grenze: 100, begriffe: P.begriffe, stimme: true };
function* aufgaben(id, stufe, n = 300) {
  for (let seed = 1; seed <= n; seed++) yield fertigeAufgabe(generatoren[id][stufe], F[id], stufe, seed * 41 + 3, ctx);
}
function zaehle(v) {
  switch (v.art) {
    case 'zehnerfeld': case 'zwanzigerfeld': case 'plaettchen': return (v.rot ?? 0) + (v.blau ?? 0) - (v.weg ?? 0);
    case 'dinge': return v.n;
    case 'wuerfelbild': return [].concat(v.n).reduce((s, x) => s + x, 0);
    case 'fingerbild': return v.n;
    default: throw new Error('nicht zählbar: ' + v.art);
  }
}
// Gleichung mit einem «_» lösen, nur Plus: «7 = 5 + _», «_ + 5 = 8», «3 + 3 = _»
function loese(zeige) {
  const [l, r] = zeige.split(' = ').map((seite) => seite.split(' + '));
  const summe = (t) => t.filter((x) => x !== '_').reduce((s, x) => s + Number(x), 0);
  if (l.includes('_')) return summe(r) - summe(l);
  return summe(l) - summe(r);
}
// Zahlenhaus Zeile für Zeile: fehlende Zahlen in Lesereihenfolge
function hausLoesung(v) {
  const aus = [];
  if (v.dach === '?') aus.push(v.zeilen[0][0] + v.zeilen[0][1]);
  for (const [x, y] of v.zeilen) {
    if (x === '?' && y === '?') { aus.push(v.dach / 2, v.dach / 2); continue; }
    if (x === '?') aus.push(v.dach - y);
    if (y === '?') aus.push(v.dach - x);
  }
  return aus;
}

test('M-ZE-01: Farben, Schüttelbox, Zahlenhaus bis 5', () => {
  for (const a of aufgaben('M-ZE-01', 1)) {
    const gesucht = a.daten.gesucht === 'blau' ? a.visual.blau : a.visual.rot;
    assert.equal(a.loesung[0], gesucht);
    assert.ok(a.visual.rot >= 1 && a.visual.blau >= 1 && zaehle(a.visual) <= 5);
  }
  for (const a of aufgaben('M-ZE-01', 2)) {
    assert.equal(a.loesung[0], a.visual.n - a.visual.sichtbar);
    assert.ok(a.visual.n <= 5 && a.loesung[0] >= 1);
  }
  for (const a of aufgaben('M-ZE-01', 3)) {
    assert.deepEqual(a.loesung, hausLoesung(a.visual));
    assert.equal(a.visual.zeilen.length, a.visual.dach - 1, 'alle Zerlegungen ohne 0');
    assert.ok(a.visual.dach <= 5);
  }
});

test('M-ZE-02: Schüttelbox und Zahlenhaus bis 10', () => {
  for (const a of aufgaben('M-ZE-02', 1)) assert.equal(a.loesung[0], a.visual.n - a.visual.sichtbar);
  for (const a of aufgaben('M-ZE-02', 2)) {
    assert.deepEqual(a.loesung, hausLoesung(a.visual));
    assert.ok(a.loesung[0] >= 1, 'keine Zerlegung mit 0');
  }
  for (const a of aufgaben('M-ZE-02', 3)) {
    const n = a.visual.dach;
    assert.deepEqual(a.visual.zeilen.map((z) => z[0]), Array.from({ length: n - 1 }, (_, i) => i + 1));
    assert.deepEqual(a.loesung, hausLoesung(a.visual));
    assert.ok(!a.loesung.includes(0));
  }
});

test('M-ZE-03: Kraft der Fünf', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-ZE-03', s)) {
    if (a.zeige) assert.equal(a.loesung[0], loese(a.zeige));
    else assert.equal(a.loesung[0], zaehle(a.visual));
    if (a.visual?.art === 'zehnerfeld') assert.equal(a.visual.rot, 5);
    if (a.visual?.art === 'zwanzigerfeld') assert.equal(a.visual.rot, 15);
    if (s === 3) assert.equal(a.visual, undefined, 'ohne Bild');
  }
});

test('M-ZE-04: Ergänzen bis 10 und 20', () => {
  for (const a of aufgaben('M-ZE-04', 1)) assert.equal(a.loesung[0], 10 - zaehle(a.visual));
  for (const s of [2, 3]) for (const a of aufgaben('M-ZE-04', s)) {
    assert.equal(a.loesung[0], loese(a.zeige));
    assert.ok(a.zeige.endsWith(s === 2 ? '= 10' : '= 20'));
    assert.equal(zaehle(a.visualNachFehler) + a.loesung[0], s === 2 ? 10 : 20);
  }
});

test('M-ZE-05: Verdoppeln und Halbieren', () => {
  for (const s of [1, 2]) for (const a of aufgaben('M-ZE-05', s)) {
    assert.equal(a.loesung[0], loese(a.zeige));
    const bild = a.visual || a.visualNachFehler;
    if (bild) assert.equal(zaehle(bild), a.loesung[0]);
  }
  for (const a of aufgaben('M-ZE-05', 3)) {
    const [x, y] = a.loesung;
    assert.equal(x, y);
    const n = a.zeige ? Number(a.zeige.split(' = ')[1]) : a.visual.dach;
    assert.equal(x + y, n);
    assert.equal(zaehle(a.visualNachFehler), n);
    assert.equal(pruefe(a, [x - 1, y + 1]).ok, false, 'ungleiche Teile gelten nicht');
  }
});

test('M-ZE-06: gerade und ungerade', () => {
  for (const a of aufgaben('M-ZE-06', 1)) {
    const ungerade = a.optionen.map((o) => {
      const v = o.visual;
      assert.equal(v.gruppen.reduce((s, x) => s + x, 0), v.n);
      return v.gruppen.includes(1);   // eines ohne Partner
    });
    const gesucht = ungerade.map((u) => u === a.daten.uebrig);
    assert.equal(gesucht.filter(Boolean).length, 1);
    assert.ok(gesucht[a.richtig]);
    a.optionen.forEach((o) => assert.equal(o.visual.gruppen.includes(1), o.visual.n % 2 === 1));
  }
  for (const a of aufgaben('M-ZE-06', 2)) {
    const passt = a.optionen.map((o) => (Number(o.text) % 2 === 0) === a.daten.gerade);
    assert.equal(passt.filter(Boolean).length, 1);
    assert.ok(passt[a.richtig]);
  }
  for (const a of aufgaben('M-ZE-06', 3)) {
    const { zahlen, luecke } = a.daten;
    for (let i = 1; i < zahlen.length; i++) assert.equal(zahlen[i] - zahlen[i - 1], 2);
    assert.equal(a.folge[luecke], '?');
    assert.equal(a.optionen[a.richtig], zahlen[luecke]);
    assert.equal(a.optionen.filter((o) => o === zahlen[luecke]).length, 1);
    assert.ok(pruefe(a, richtigeEingabe(a)).ok);
    assert.ok(Math.max(...zahlen) <= 20);
  }
});
