// Mathematik GR (Grössen und Daten): jede Stufe mit 300 Startwerten, Lösung auf einem zweiten Weg nachgeprüft
// (Längen vergleichen, Münzen summieren, Uhrzeit aus den Zeigern, Waagen auswerten, Striche zählen).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generatoren } from '../../site/js/math/gr.js';
import { fertigeAufgabe } from '../../site/js/math/index.js';
import { pruefe, richtigeEingabe } from '../../site/js/core/pruefen.js';

const katalog = JSON.parse(fs.readFileSync(new URL('../../site/data/katalog/mathe.json', import.meta.url), 'utf8'));
const P = JSON.parse(fs.readFileSync(new URL('../../site/data/parameter.json', import.meta.url), 'utf8'));
const F = Object.fromEntries(katalog.fertigkeiten.map((f) => [f.id, f]));
function* aufgaben(id, stufe, { n = 300, stimme = true } = {}) {
  const ctx = { grenze: 100, begriffe: P.begriffe, stimme };
  for (let seed = 1; seed <= n; seed++) yield fertigeAufgabe(generatoren[id][stufe], F[id], stufe, seed * 31 + 7, ctx);
}
const laenge = (o) => o.visual.staebe[0].laenge;

test('M-GR-01: Längen vergleichen und messen', () => {
  for (const stimme of [true, false]) for (const a of aufgaben('M-GR-01', 1, { stimme })) {
    const l = a.optionen.map(laenge);
    const z = laenge(a.optionen[a.richtig]);
    if (/längsten/.test(a.frage)) assert.equal(z, Math.max(...l));
    else if (/kürzesten/.test(a.frage)) assert.equal(z, Math.min(...l));
    else { assert.match(a.frage, /gleich lang/); assert.equal(z, a.visual.staebe[0].laenge); assert.equal(l.filter((x) => x === z).length, 1); }
    if (!stimme) assert.match(a.frage, /gleich lang/);
    for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) assert.ok(Math.abs(l[i] - l[j]) >= 2, 'deutlich verschieden');
  }
  for (const s of [2, 3]) for (const a of aufgaben('M-GR-01', s)) {
    assert.deepEqual(a.loesung, [a.visual.staebe[0].laenge]);
    assert.equal(a.visual.einheit, s === 2 ? 'kaestchen' : 'cm');
    assert.ok(a.loesung[0] <= 20);
  }
});

const wertAusText = (t) => { const m = t.match(/(\d+) (Franken|Rappen)/); return Number(m[1]) * (m[2] === 'Franken' ? 100 : 1); };

test('M-GR-02: Münzen erkennen und ordnen', () => {
  for (const [s, werte] of [[1, [100, 200, 500]], [2, [5, 10, 20, 50]]]) for (const a of aufgaben('M-GR-02', s)) {
    const w = a.optionen.map((o) => o.visual.stuecke[0].wert);
    assert.ok(w.every((x) => werte.includes(x)));
    assert.equal(w[a.richtig], wertAusText(a.frage));
    assert.equal(new Set(w).size, w.length);
  }
  for (const a of aufgaben('M-GR-02', 3)) {
    const w = a.teile.map((t) => t.visual.stuecke[0].wert);
    const sortiert = w.slice().sort((x, y) => (a.richtung === 'ab' ? y - x : x - y));
    assert.deepEqual(w, sortiert);
    assert.equal(new Set(w).size, w.length);
  }
});

test('M-GR-03: Geldbeträge durch Summieren nachgerechnet', () => {
  for (const [s, bis] of [[1, 10], [2, 20]]) for (const a of aufgaben('M-GR-03', s)) {
    const summe = a.visual.stuecke.reduce((x, st) => x + st.wert, 0);
    assert.equal(summe % 100, 0, 'ganze Franken');
    assert.deepEqual(a.loesung, [summe / 100]);
    assert.ok(summe / 100 <= bis);
    if (s === 1) assert.ok(a.visual.stuecke.every((st) => st.art === 'muenze' && [100, 200, 500].includes(st.wert)) && a.visual.stuecke.length >= 2);
    if (s === 2) assert.ok(a.visual.stuecke.some((st) => st.art === 'note') && summe >= 1100);
  }
  for (const a of aufgaben('M-GR-03', 3)) {
    assert.equal(a.ziel, Number(a.frage.match(/Lege (\d+) Franken/)[1]) * 100);
    assert.ok(a.ziel >= 300 && a.ziel <= 2000);
    assert.equal(a.daten.zerlegung.reduce((x, y) => x + y, 0), a.ziel);
    assert.ok(a.muenzen.every((m) => m <= 2000));
    assert.ok(pruefe(a, { summe: a.ziel }).ok && !pruefe(a, { summe: a.ziel + 100 }).ok);
  }
});

test('M-GR-04: Tagesablauf und Uhrzeiten', () => {
  const ZEIT = { '⏰': 0, '🌅': 0, '🐓': 0, '🥣': 0, '☀️': 1, '🍝': 1, '🌙': 2, '🛌': 2 };
  for (const a of aufgaben('M-GR-04', 1)) assert.deepEqual(a.teile.map((t) => ZEIT[t.bild]), [0, 1, 2]);
  for (const a of aufgaben('M-GR-04', 2)) {
    if (a.visual) {   // Uhr ablesen: der kurze Zeiger zeigt die Stunde
      assert.equal(a.visual.m, 0);
      assert.equal(a.optionen[a.richtig].text, String(a.visual.h));
    } else {
      const h = Number(a.frage.match(/(\d+) Uhr/)[1]);
      assert.deepEqual(a.optionen[a.richtig].visual, { art: 'uhr', h, m: 0 });
      assert.equal(a.optionen.filter((o) => o.visual.h === h).length, 1);
    }
  }
  for (const a of aufgaben('M-GR-04', 2, { stimme: false })) assert.ok(a.visual, 'ohne Stimme nur ablesen');
  for (const a of aufgaben('M-GR-04', 3, { n: 5, stimme: false })) assert.equal(a, null);
  for (const a of aufgaben('M-GR-04', 3)) {
    if (a.visual) {   // «halb» sagt man die nächste Stunde
      assert.equal(a.visual.m, 30);
      assert.equal(Number(a.optionen[a.richtig].text), (a.visual.h % 12) + 1);
    } else {
      const halb = Number(a.frage.match(/halb (\d+)/)[1]);
      const v = a.optionen[a.richtig].visual;
      assert.equal(v.m, 30);
      assert.equal((v.h % 12) + 1, halb);
    }
  }
});

test('M-GR-05: Gewichte aus den Waagen abgeleitet', () => {
  const SCHWER = ['🐘', '🚗', '🐮', '🐴', '🚌', '🐻'];
  for (const a of aufgaben('M-GR-05', 1)) {
    const z = a.optionen[a.richtig].bild;
    assert.equal(SCHWER.includes(z), /schwerer/.test(a.frage));
  }
  for (const a of aufgaben('M-GR-05', 2)) {
    const { links, rechts, neigung } = a.visual;
    let erwartet;
    if (neigung === 'gleich') erwartet = { text: '=' };
    else {
      const schwer = neigung === 'links' ? links : rechts, leicht = neigung === 'links' ? rechts : links;
      erwartet = /schwerer\?/.test(a.frage) ? schwer : leicht;
    }
    const o = a.optionen[a.richtig];
    if (erwartet.text) assert.deepEqual(o, erwartet); else assert.equal(o.bild, erwartet);
  }
  for (const a of aufgaben('M-GR-05', 3)) {
    // aus beiden Wägungen «leichter als»-Paare bilden und die einzige passende Reihenfolge suchen
    const paare = [a.visual, a.visual.zweite].map((w) => (w.neigung === 'links' ? [w.rechts, w.links] : [w.links, w.rechts]));
    const dinge = a.teile.map((t) => t.bild);
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => p.map((i) => dinge[i]));
    const passend = perms.filter((p) => paare.every(([l, s]) => p.indexOf(l) < p.indexOf(s)));
    assert.equal(passend.length, 1, 'eindeutige Reihenfolge');
    const auf = passend[0];
    assert.deepEqual(dinge, a.richtung === 'ab' ? auf.slice().reverse() : auf);
  }
});

test('M-GR-06: Striche und Bilder gezählt', () => {
  for (const a of aufgaben('M-GR-06', 1)) {
    assert.deepEqual(a.loesung, [a.visual.zeilen[0].n]);
    assert.ok(a.zeige.startsWith(a.visual.zeilen[0].bild));
  }
  for (const a of aufgaben('M-GR-06', 2)) {
    const bild = a.zeige.split(' ')[0];
    const spalte = a.visual.spalten.find((s) => s.bild === bild);
    assert.deepEqual(a.loesung, [spalte.n]);
    assert.equal(new Set(a.visual.spalten.map((s) => s.bild)).size, a.visual.spalten.length);
  }
  for (const a of aufgaben('M-GR-06', 3)) {
    const [b1, , b2] = a.zeige.split(' ');
    const reihen = a.visual.zeilen || a.visual.spalten;
    const n1 = reihen.find((x) => x.bild === b1).n, n2 = reihen.find((x) => x.bild === b2).n;
    assert.ok(n1 > n2);
    assert.deepEqual(a.loesung, [n1 - n2]);
    assert.ok(pruefe(a, richtigeEingabe(a)).ok);
  }
});
