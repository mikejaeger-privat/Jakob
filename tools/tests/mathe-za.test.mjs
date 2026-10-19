// Mathematik ZA (Zählen): jede Stufe mit 300 Startwerten, Lösung auf einem zweiten Weg aus «daten» nachgerechnet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generatoren } from '../../site/js/math/za.js';
import { fertigeAufgabe } from '../../site/js/math/index.js';
import { pruefe, richtigeEingabe } from '../../site/js/core/pruefen.js';

const katalog = JSON.parse(fs.readFileSync(new URL('../../site/data/katalog/mathe.json', import.meta.url), 'utf8'));
const P = JSON.parse(fs.readFileSync(new URL('../../site/data/parameter.json', import.meta.url), 'utf8'));
const F = Object.fromEntries(katalog.fertigkeiten.map((f) => [f.id, f]));
const ctx = { grenze: 100, begriffe: P.begriffe, stimme: true };
function* aufgaben(id, stufe, n = 300) {
  for (let seed = 1; seed <= n; seed++) yield fertigeAufgabe(generatoren[id][stufe], F[id], stufe, seed * 31 + 7, ctx);
}

test('M-ZA-01/02: Anzahl gleich Zahl der Dinge, im Bereich der Stufe', () => {
  const bereich = { 'M-ZA-01': [[2, 5], [6, 10], [5, 10]], 'M-ZA-02': [[11, 15], [11, 20], [11, 20]] };
  for (const [id, b] of Object.entries(bereich)) for (const s of [1, 2, 3]) for (const a of aufgaben(id, s)) {
    assert.equal(a.dinge.length, a.anzahl);
    assert.ok(a.anzahl >= b[s - 1][0] && a.anzahl <= b[s - 1][1], `${id}/${s}: ${a.anzahl}`);
    // Dinge überlappen nicht (zweiter Weg: Abstände nachmessen)
    for (let i = 0; i < a.dinge.length; i++) for (let j = i + 1; j < a.dinge.length; j++) {
      const d = Math.hypot(a.dinge[i].x - a.dinge[j].x, (a.dinge[i].y - a.dinge[j].y) * 0.7);
      assert.ok(d > 0.05, `${id}/${s}: Dinge ${i} und ${j} liegen aufeinander`);
    }
    if (a.antwort === 'wahl') assert.equal(Number(a.optionen[a.richtig]), a.anzahl);
  }
});

test('M-ZA-03/04: Rück- und Weiterzählen durch Abzählen nachgerechnet', () => {
  for (const id of ['M-ZA-03', 'M-ZA-04']) for (const s of [1, 2, 3]) for (const a of aufgaben(id, s)) {
    const { start, schritt } = a.daten;
    const folge = a.visual.teile.map((_, i) => start + i * schritt);
    const erwartet = a.visual.teile.map((t, i) => (t === '?' ? folge[i] : null)).filter((x) => x !== null);
    assert.deepEqual(a.loesung, erwartet, `${id}/${s}`);
    a.visual.teile.forEach((t, i) => { if (t !== '?') assert.equal(t, folge[i]); });
    assert.ok(Math.min(...folge) >= 1 && Math.max(...folge) <= (s === 1 ? 10 : 20));
  }
});

test('M-ZA-05: Nachbarzahlen', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-ZA-05', s)) {
    const { n, art } = a.daten;
    const e = art === 'vor' ? [n - 1] : art === 'nach' ? [n + 1] : [n - 1, n + 1];
    assert.deepEqual(a.loesung, e);
  }
});

test('M-ZA-06/08: Lücken passen zur Reihe mit festem Schritt', () => {
  for (const [id, stufen] of [['M-ZA-06', [1, 2, 3]], ['M-ZA-08', [1, 2, 3]]]) for (const s of stufen) for (const a of aufgaben(id, s)) {
    const { zahlen, luecken, schritt } = a.daten;
    for (let i = 1; i < zahlen.length; i++) assert.equal(zahlen[i] - zahlen[i - 1], schritt);
    assert.deepEqual(a.loesung, luecken.map((i) => zahlen[i]));
    const sichtbar = a.visual.teile.filter((t) => t !== '?').length;
    assert.ok(sichtbar >= 2, 'mindestens zwei Zahlen sichtbar');
  }
});

test('M-ZA-07: Ordnen ergibt eine streng geordnete Folge', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-ZA-07', s)) {
    const z = a.teile.map(Number);
    for (let i = 1; i < z.length; i++) assert.ok(a.richtung === 'auf' ? z[i] > z[i - 1] : z[i] < z[i - 1]);
    if (s === 3) for (let i = 1; i < z.length; i++) assert.ok(Math.abs(z[i] - z[i - 1]) > 1, 'nicht nebeneinander');
    // gemischte Eingabe wird nicht akzeptiert
    assert.equal(pruefe(a, a.teile.map((_, i) => i).reverse()).ok, false);
  }
});

test('M-ZA-09: das gesuchte Tier steht an der genannten Stelle', () => {
  const zahl = { erste: 1, zweite: 2, dritte: 3, vierte: 4, fünfte: 5, sechste: 6, siebte: 7, achte: 8, neunte: 9, zehnte: 10 };
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-ZA-09', s)) {
    const m = a.auftrag.match(/das (\S+) Tier/);
    const n = a.szene.elemente.length;
    const stelle = m[1] === 'letzte' ? n : zahl[m[1]];
    assert.deepEqual(a.loesung, [a.szene.elemente[stelle - 1].id]);
    assert.ok(pruefe(a, richtigeEingabe(a)).ok);
    assert.equal(new Set(a.szene.elemente.map((e) => e.bild)).size, n, 'Tiere verschieden');
  }
});
