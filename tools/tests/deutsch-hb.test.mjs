// Deutsch HB (Hören und Bewusstheit): jede Stufe mit 300 Startwerten. Die Lösung wird auf einem zweiten Weg
// aus dem Lexikon nachgeprüft (Reim, Anlaut, Endlaut, Silben, Laute, Stelle des Lauts, Wörter im Satz).
// Dazu: mit der kleinen Freigabe kein nicht eingeführter Buchstabe sichtbar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatoren } from '../../site/js/deutsch/hb.js';
import { fertigeAufgabe } from '../../site/js/deutsch/index.js';
import { pruefe, richtigeEingabe, passt } from '../../site/js/core/pruefen.js';
import { grundlaut, reimteil, werkzeug, zerlege } from '../../site/js/deutsch/lib.js';
import { K, W, B, kontext, FREI_STANDARD, FREI_KLEIN } from '../deutsch-kontext.mjs';

const F = Object.fromEntries(K.fertigkeiten.map((f) => [f.id, f]));
const nachBild = new Map(W.woerter.map((w) => [w.bild, w]));
const nachWort = new Map(W.woerter.map((w) => [w.wort, w]));
const buchstabe = new Map(B.liste.map((b) => [b.id, b]));
const ctxStd = kontext({ freigabe: FREI_STANDARD });
const T = werkzeug(ctxStd);
function* aufgaben(id, stufe, ctx = ctxStd, n = 300) {
  for (let seed = 1; seed <= n; seed++) {
    const a = fertigeAufgabe(generatoren[id][stufe], F[id], String(stufe), seed * 104729 + 17, ctx);
    if (a) yield a;
  }
}
const alle = (id, stufe, ctx) => [...aufgaben(id, stufe, ctx)];
const wortVon = (o) => { const w = nachBild.get(o.bild); assert.ok(w, `Bild ${o.bild} nicht im Lexikon`); return w; };
// Auswahl: genau die richtige Option wird akzeptiert
function nurRichtig(a) {
  assert.ok(pruefe(a, richtigeEingabe(a)).ok);
  a.optionen.forEach((_, i) => assert.equal(pruefe(a, i).ok, i === a.richtig, `Option ${i}`));
}
const genug = (liste, n = 250) => assert.ok(liste.length >= n, `nur ${liste.length} Aufgaben`);

test('D-HB-01: Reim aus dem Lexikon (Feld reim); Ablenker reimen weder gehört noch geschrieben', () => {
  for (const s of [1, 2]) {
    const liste = alle('D-HB-01', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      assert.equal(a.optionen.length, s + 1);
      const g = nachWort.get(a.daten.gesprochen);
      const ws = a.optionen.map(wortVon);
      assert.equal(ws[a.richtig].reim, g.reim, `${g.wort} – ${ws[a.richtig].wort}`);
      ws.forEach((w, i) => { if (i !== a.richtig) { assert.notEqual(reimteil(w.wort), reimteil(g.wort), w.wort); assert.notEqual(w.reim, g.reim); } });
      if (s === 2) assert.ok(ws.some((w, i) => i !== a.richtig && w.anlaut === g.anlaut), 'ein Ablenker fängt gleich an');
      assert.deepEqual(a.braucht, []);
    }
  }
  const liste = alle('D-HB-01', 3); genug(liste);
  for (const a of liste) {
    nurRichtig(a);
    assert.equal(a.optionen.length, 4);
    const ws = a.optionen.map(wortVon);
    const andere = ws.filter((_, i) => i !== a.richtig);
    assert.equal(new Set(andere.map((w) => w.reim)).size, 1, andere.map((w) => w.wort).join());
    assert.notEqual(ws[a.richtig].reim, andere[0].reim);
    for (const w of andere) assert.notEqual(reimteil(ws[a.richtig].wort), reimteil(w.wort));
  }
});

test('D-HB-02: Silbenzahl aus dem Lexikon, Trommel nimmt nur die richtige Zahl', () => {
  const max = { 1: 2, 2: 3, 3: 4 };
  for (const s of [1, 2, 3]) {
    const liste = alle('D-HB-02', s); genug(liste);
    const zahlen = new Set();
    for (const a of liste) {
      const w = nachWort.get(a.daten.wort);
      assert.equal(a.modus, 'zaehlen');
      assert.equal(a.silben.length, w.silben.length);
      assert.equal(a.silben.join('').toLowerCase(), w.wort.toLowerCase());
      assert.ok(!w.silbenUnsicher);
      assert.ok(pruefe(a, w.silben.length).ok);
      assert.ok(!pruefe(a, w.silben.length + 1).ok && !pruefe(a, w.silben.length - 1).ok);
      assert.ok(w.silben.length <= max[s]);
      assert.deepEqual(a.braucht, []);
      zahlen.add(w.silben.length);
    }
    assert.equal(zahlen.size, max[s], `alle Silbenzahlen bis ${max[s]} kommen vor`);
  }
});

test('D-HB-03: Anfangslaut aus dem Lexikon, gleich geschrieben wie gehört', () => {
  for (const s of [1, 2]) {
    const liste = alle('D-HB-03', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      assert.equal(a.optionen.length, s + 1);
      const bezug = nachWort.get(a.daten.bezug);
      const ws = a.optionen.map(wortVon);
      assert.equal(ws[a.richtig].anlaut, bezug.anlaut);
      for (const w of [bezug, ws[a.richtig]]) assert.equal(grundlaut(w.laute[0]), w.anlaut, `${w.wort}: Anfang anders gehört als geschrieben`);
      ws.forEach((w, i) => { if (i !== a.richtig) assert.ok(!T.klangKonflikt(w.anlaut, bezug.anlaut), `${w.wort} / ${bezug.wort}`); });
      if (s === 1) assert.ok(['a', 'e', 'i', 'o', 'u', 'm', 'n', 'l', 's', 'f', 'sch'].includes(bezug.anlaut));
    }
  }
  const liste = alle('D-HB-03', 3); genug(liste);
  for (const a of liste) {
    assert.ok(a.paare.length >= 2 && a.paare.length <= 3);
    const laute = a.paare.map(([x, y]) => { const u = wortVon(x), v = wortVon(y); assert.equal(u.anlaut, v.anlaut); return u.anlaut; });
    for (let i = 0; i < laute.length; i++) for (let j = i + 1; j < laute.length; j++) assert.ok(!T.klangKonflikt(laute[i], laute[j]));
    for (let i = 0; i < a.paare.length; i++) for (let j = 0; j < a.paare.length; j++) assert.equal(passt(a, i, j), i === j);
  }
});

test('D-HB-04: Endlaut aus dem Lexikon, ohne Auslautverhärtung', () => {
  const laute = { 1: ['a', 'o', 'i', 'u'], 2: ['m', 'n', 'l', 's', 'f', 'sch', 'z'] };
  for (const s of [1, 2, 3]) {
    const liste = alle('D-HB-04', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      assert.equal(a.optionen.length, s === 3 ? 4 : 3);
      const bezug = nachWort.get(a.daten.bezug);
      const ws = a.optionen.map(wortVon);
      assert.equal(ws[a.richtig].endlaut, bezug.endlaut);
      for (const w of [bezug, ...ws]) assert.ok(!(w.merk || []).includes('auslaut'), `${w.wort} endet mit verhärtetem Laut`);
      ws.forEach((w, i) => { if (i !== a.richtig) assert.ok(!T.klangKonflikt(w.endlaut, bezug.endlaut), `${w.wort} / ${bezug.wort}`); });
      if (laute[s]) assert.ok(laute[s].includes(bezug.endlaut), bezug.endlaut);
    }
  }
});

test('D-HB-05: Stelle des Lauts aus den Lauten des Worts nachgezählt', () => {
  const stellen = { 1: ['vorne', 'hinten'], 2: ['vorne', 'mitte', 'hinten'], 3: ['vorne', 'mitte', 'hinten', 'nicht'] };
  for (const s of [1, 2, 3]) {
    const liste = alle('D-HB-05', s); genug(liste);
    const gesehen = new Set();
    for (const a of liste) {
      const w = nachWort.get(a.daten.wort);
      const laut = a.daten.laut;
      assert.equal(a.laut, buchstabe.get(laut).anzeige);
      assert.deepEqual(a.braucht, [laut]);
      const idx = w.laute.map((e, i) => (grundlaut(e) === laut ? i : -1)).filter((i) => i >= 0);
      // der Buchstabe steckt nicht in einer anderen Einheit (s in Sch, u in au)
      assert.ok(w.laute.every((e) => grundlaut(e) === laut || !e.toLowerCase().includes(laut)), `${w.wort}: ${laut} versteckt`);
      const erwartet = idx.length === 0 ? 'nicht' : idx[0] === 0 ? 'vorne' : idx[0] === w.laute.length - 1 ? 'hinten' : 'mitte';
      assert.ok(idx.length <= 1, `${w.wort}: ${laut} kommt mehrmals vor`);
      assert.equal(a.loesung, erwartet, `${w.wort} / ${laut}`);
      assert.ok(stellen[s].includes(a.loesung));
      assert.equal(a.plaetze, s === 1 ? 2 : 3);
      assert.equal(a.nicht, s === 3);
      if (['b', 'd', 'g'].includes(laut)) assert.notEqual(a.loesung, 'hinten');
      assert.ok(pruefe(a, erwartet).ok);
      for (const x of stellen[s]) if (x !== erwartet) assert.ok(!pruefe(a, x).ok);
      gesehen.add(a.loesung);
    }
    assert.equal(gesehen.size, stellen[s].length, 'alle Stellen kommen vor');
  }
});

test('D-HB-06: Zahl der Laute aus dem Lexikon', () => {
  const zahlen = { 1: [2, 3], 2: [4], 3: [5, 6] };
  for (const s of [1, 2, 3]) {
    const liste = alle('D-HB-06', s); genug(liste);
    for (const a of liste) {
      const w = nachWort.get(a.daten.wort);
      assert.ok(w.lautzaehlbar, w.wort);
      assert.equal(a.feld, 'lautreihe');
      assert.equal(a.ziel, w.laute.length);
      assert.ok(zahlen[s].includes(a.ziel));
      assert.ok(pruefe(a, { anzahl: w.laute.length }).ok && !pruefe(a, { anzahl: w.laute.length + 1 }).ok);
      assert.deepEqual(a.braucht, []);
    }
  }
});

test('D-HB-07: die gesprochenen Teile ergeben das Wort des richtigen Bilds', () => {
  for (const s of [1, 2, 3]) {
    const liste = alle('D-HB-07', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      assert.equal(a.namenSprechen, false);
      const ws = a.optionen.map(wortVon);
      const w = ws[a.richtig];
      assert.equal(w.wort, a.daten.wort);
      const teile = a.daten.teile.split(' … ');
      if (s === 1) assert.equal(teile.join('').toLowerCase(), w.wort.toLowerCase());
      if (s === 2) { assert.equal(teile.length, 2); assert.equal(teile[1], w.wort.toLowerCase().slice(w.laute[0].length)); assert.equal(w.silben.length, 1); }
      if (s === 3) assert.equal(teile.length, w.laute.length);
      for (const x of ws) assert.ok(!x.nameUnsicher, x.wort);
      ws.forEach((x, i) => { if (i !== a.richtig) { assert.equal(x.silben.length, w.silben.length); assert.notEqual(x.anlaut, w.anlaut); } });
      assert.ok(a.sprich.includes(a.daten.teile));
    }
  }
});

test('D-HB-08: Wörter im Satz selbst gezählt', () => {
  const zahlen = { 1: [2, 3], 2: [4, 5], 3: [6] };
  for (const s of [1, 2, 3]) {
    const liste = alle('D-HB-08', s); genug(liste);
    const saetze = new Set();
    for (const a of liste) {
      const n = a.vorlesen.replace(/[.!?]$/, '').split(/\s+/).length;
      assert.equal(a.feld, 'wortreihe');
      assert.equal(a.ziel, n, a.vorlesen);
      assert.ok(zahlen[s].includes(n), `${n} Wörter auf Stufe ${s}`);
      assert.ok(pruefe(a, { anzahl: n }).ok && !pruefe(a, { anzahl: n - 1 }).ok);
      assert.deepEqual(a.braucht, []);
      assert.ok(!/ß/.test(a.vorlesen));
      saetze.add(a.daten.id);
    }
    assert.ok(saetze.size >= 12, `nur ${saetze.size} Sätze`);
  }
});

test('Kleine Freigabe: kein nicht eingeführter Buchstabe sichtbar', () => {
  const ctx = kontext({ freigabe: FREI_KLEIN });
  for (const id of Object.keys(generatoren)) for (const s of Object.keys(generatoren[id])) {
    for (const a of aufgaben(id, s, ctx, 150)) {
      for (const b of a.braucht) assert.ok(FREI_KLEIN.has(b), `${id}/${s}: ${b}`);
      const gezeigt = [a.zeige, a.typ === 'lautplatz' ? a.laut : null].flat().filter((x) => typeof x === 'string');
      for (const t of gezeigt) for (const wort of t.split(/\s+/).filter(Boolean)) for (const e of zerlege(wort.toLowerCase())) assert.ok(FREI_KLEIN.has(e), `${id}/${s}: «${t}» zeigt ${e}`);
    }
  }
});
