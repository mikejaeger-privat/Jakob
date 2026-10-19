// Mathematik ME (Mengen und Zahlen): jede Stufe mit 300 Startwerten, Lösung auf einem zweiten Weg nachgerechnet
// (Plättchen und Dinge zählen, Zeichen aus den Zahlen bestimmen, Zehner und Einer zusammensetzen).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generatoren } from '../../site/js/math/me.js';
import { fertigeAufgabe } from '../../site/js/math/index.js';
import { pruefe, richtigeEingabe } from '../../site/js/core/pruefen.js';

const katalog = JSON.parse(fs.readFileSync(new URL('../../site/data/katalog/mathe.json', import.meta.url), 'utf8'));
const P = JSON.parse(fs.readFileSync(new URL('../../site/data/parameter.json', import.meta.url), 'utf8'));
const F = Object.fromEntries(katalog.fertigkeiten.map((f) => [f.id, f]));
const ctx = { grenze: 100, begriffe: P.begriffe, stimme: true };
function* aufgaben(id, stufe, n = 300) {
  for (let seed = 1; seed <= n; seed++) yield fertigeAufgabe(generatoren[id][stufe], F[id], stufe, seed * 37 + 11, ctx);
}
// Zweiter Weg: eine Darstellung durchzählen
function zaehle(v) {
  switch (v.art) {
    case 'zehnerfeld': case 'zwanzigerfeld': case 'plaettchen': return (v.rot ?? 0) + (v.blau ?? 0) - (v.weg ?? 0);
    case 'dinge': return v.n - (v.weg ?? 0);
    case 'wuerfelbild': return [].concat(v.n).reduce((s, x) => s + x, 0);
    case 'fingerbild': return v.n;
    case 'zehnerstreifen': return v.zehner * 10 + v.einer;
    default: throw new Error('nicht zählbar: ' + v.art);
  }
}

test('M-ME-01: Bild und Zahl gehören zusammen', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-ME-01', s)) {
    if (a.typ === 'zahl') assert.equal(a.loesung[0], zaehle(a.visual));
    else {
      const n = Number(a.zeige);
      a.optionen.forEach((o, i) => assert.equal(zaehle(o.visual) === n, i === a.richtig, `Option ${i}`));
      if (s === 1) for (const o of a.optionen) assert.ok(o.visual.n >= 1 && o.visual.n <= 6);
    }
  }
});

test('M-ME-02: Lösung ist die Anzahl der Plättchen', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-ME-02', s)) {
    assert.equal(a.loesung[0], zaehle(a.visual));
    if (s === 3) { assert.equal(a.visual.anordnung, 'frei'); assert.ok(a.loesung[0] > 10); }
  }
});

test('M-ME-03: Menge legen, mit Fünferstruktur auf Stufe 3', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-ME-03', s)) {
    assert.equal(a.ziel, Number(a.zeige));
    assert.ok(pruefe(a, richtigeEingabe(a)).ok);
    assert.equal(pruefe(a, { zellen: Array.from({ length: a.ziel + 1 }, (_, i) => i) }).ok, false, 'eines zu viel');
    // gleiche Anzahl, aber mit einer Lücke im ersten Fünfer: nur ohne Struktur richtig
    const groesse = a.feld === 'zehner' ? 10 : 20;
    if (a.ziel < groesse) {   // ein volles Feld lässt sich nicht anders legen
      const luecke = [...Array.from({ length: a.ziel - 1 }, (_, i) => i), a.ziel];
      assert.equal(pruefe(a, { zellen: luecke }).ok, s !== 3);
    }
    assert.equal(a.struktur, s === 3);
  }
});

test('M-ME-04: gehörte Zahl ist genau eine Option, Ziffern zum Nachspuren', () => {
  for (const s of [1, 3]) for (const a of aufgaben('M-ME-04', s)) {
    assert.equal(a.optionen[a.richtig], a.vorlesen);
    assert.equal(a.optionen.filter((o) => o === a.vorlesen).length, 1);
    for (const o of a.optionen) assert.ok(Number(o) >= 0 && Number(o) <= (s === 1 ? 10 : 20));
    if (s === 3) assert.ok(Number(a.vorlesen) >= 11 && Number(a.vorlesen) <= 20);
  }
  const gesehen = new Set();
  for (const a of aufgaben('M-ME-04', 2)) { assert.match(a.zeichen, /^[0-9]$/); assert.equal(Number(a.zeichen), a.daten.ziffer); gesehen.add(a.zeichen); }
  assert.equal(gesehen.size, 10, 'alle Ziffern kommen vor');
});

test('M-ME-05: mehr, weniger, gleich viele, Unterschied', () => {
  for (const s of [1, 2]) for (const a of aufgaben('M-ME-05', s)) {
    const werte = a.optionen.map((o) => zaehle(o.visual));
    if (a.daten.frageArt === 'gleich') {
      const n = zaehle(a.visual);
      werte.forEach((w, i) => assert.equal(w === n, i === a.richtig));
    } else {
      const ziel = a.daten.frageArt === 'mehr' ? Math.max(...werte) : Math.min(...werte);
      assert.equal(werte[a.richtig], ziel);
      assert.notEqual(werte[0], werte[1]);
    }
  }
  for (const a of aufgaben('M-ME-05', 3)) {
    const [x, y] = a.visual.spalten.map((sp) => sp.n);
    assert.equal(a.loesung[0], Math.abs(x - y));
    assert.ok(a.loesung[0] >= 1 && a.loesung[0] <= 5);
    assert.notEqual(a.visual.spalten[0].bild, a.visual.spalten[1].bild);
  }
});

test('M-ME-06: grösser, Vergleichszeichen, Zahl dazwischen', () => {
  for (const a of aufgaben('M-ME-06', 1)) {
    const z = a.optionen.map(Number);
    assert.equal(z[a.richtig], Math.max(...z));
  }
  for (const a of aufgaben('M-ME-06', 2)) {
    const [x, , y] = a.zeige.split(' ').map((t) => (t === '○' ? t : Number(t)));
    assert.equal(a.optionen[a.richtig], x < y ? '<' : x > y ? '>' : '=');
    assert.deepEqual(a.optionen, ['<', '=', '>']);
  }
  for (const a of aufgaben('M-ME-06', 3)) {
    const [u, o] = a.visual.marken.map((m) => m.x);
    const passend = a.optionen.map(Number).map((x) => x > u && x < o);
    assert.equal(passend.filter(Boolean).length, 1, 'genau eine Zahl liegt dazwischen');
    assert.ok(passend[a.richtig]);
  }
});

test('M-ME-07: Zehner und Einer', () => {
  for (const a of aufgaben('M-ME-07', 1)) assert.equal(a.loesung[0], zaehle(a.visual));
  for (const a of aufgaben('M-ME-07', 2)) {
    const e = richtigeEingabe(a);
    assert.equal(e.zehner * 10 + e.einer, Number(a.zeige));
    assert.ok(pruefe(a, e).ok);
    assert.equal(pruefe(a, { zehner: 0, einer: Number(a.zeige) }).ok, false, 'nur Einer gilt nicht');
  }
  for (const a of aufgaben('M-ME-07', 3)) {
    const n = Number(a.zeige);
    assert.equal(a.loesung[0], a.daten.frage === 'einer' ? n % 10 : Math.floor(n / 10));
    assert.ok(a.loesung[0] > 0, 'kein Ergebnis 0');
  }
});

test('M-ME-08: Zahlenstrahl ablesen und antippen', () => {
  for (const s of [1, 2]) for (const a of aufgaben('M-ME-08', s)) {
    const v = a.visual, x = v.marken[0].x;
    assert.equal(a.loesung[0], x);
    const beschriftet = v.beschrift === 'enden' ? [v.von, v.bis] : v.beschrift === 'fuenfer' ? [0, 5, 10, 15, 20] : v.beschrift;
    assert.ok(!beschriftet.includes(x), 'die gesuchte Zahl ist nicht angeschrieben');
    assert.ok(x > v.von && x < v.bis);
  }
  for (const a of aufgaben('M-ME-08', 3)) {
    assert.deepEqual(a.loesung, [a.zeige]);
    assert.notEqual(Number(a.zeige) % 5, 0);
    assert.equal(pruefe(a, [String(Number(a.zeige) + 1)]).ok, false);
  }
});
