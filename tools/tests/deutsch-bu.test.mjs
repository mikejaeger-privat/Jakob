// Deutsch BU (Buchstaben): jede Stufe mit 300 Startwerten. Die Lösung wird auf einem zweiten Weg nachgeprüft
// (Schreibung und Laute des Lexikons, Buchstabenplan, ABC-Reihe, Stellen im Wort selbst gesucht).
// Dazu: mit der kleinen Freigabe kein nicht eingeführter Buchstabe sichtbar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatoren } from '../../site/js/deutsch/bu.js';
import { fertigeAufgabe } from '../../site/js/deutsch/index.js';
import { pruefe, richtigeEingabe, passt } from '../../site/js/core/pruefen.js';
import { grundlaut, werkzeug, zerlege } from '../../site/js/deutsch/lib.js';
import { K, W, B, kontext, FREI_STANDARD, FREI_KLEIN, FREI_ALLE } from '../deutsch-kontext.mjs';

const F = Object.fromEntries(K.fertigkeiten.map((f) => [f.id, f]));
const nachBild = new Map(W.woerter.map((w) => [w.bild, w]));
const nachWort = new Map(W.woerter.map((w) => [w.wort, w]));
const buchstabe = new Map(B.liste.map((b) => [b.id, b]));
const ctxStd = kontext({ freigabe: FREI_STANDARD });
const ctxAlle = kontext({ freigabe: FREI_ALLE });
const T = werkzeug(ctxStd);
const ABC = 'abcdefghijklmnopqrstuvwxyz';
function* aufgaben(id, stufe, ctx = ctxStd, n = 300) {
  for (let seed = 1; seed <= n; seed++) {
    const a = fertigeAufgabe(generatoren[id][stufe], F[id], String(stufe), seed * 104729 + 17, ctx);
    if (a) yield a;
  }
}
const alle = (id, stufe, ctx) => [...aufgaben(id, stufe, ctx)];
const genug = (liste, n = 250) => assert.ok(liste.length >= n, `nur ${liste.length} Aufgaben`);
const wortVon = (o) => { const w = nachBild.get(o.bild); assert.ok(w, `Bild ${o.bild} nicht im Lexikon`); return w; };
function nurRichtig(a) {
  assert.ok(pruefe(a, richtigeEingabe(a)).ok);
  a.optionen.forEach((_, i) => assert.equal(pruefe(a, i).ok, i === a.richtig, `Option ${i}`));
  assert.equal(new Set(a.optionen.map((o) => JSON.stringify(o))).size, a.optionen.length, 'doppelte Optionen');
}
const aehnlichForm = (a, b) => (buchstabe.get(a).aehnlichForm || []).includes(b) || (buchstabe.get(b).aehnlichForm || []).includes(a);
const aehnlichLaut = (a, b) => (buchstabe.get(a).aehnlichLaut || []).includes(b) || (buchstabe.get(b).aehnlichLaut || []).includes(a);

test('D-BU-01: Anfangsbuchstabe aus Schreibung und erstem Laut des Worts', () => {
  for (const s of [1, 2, 3]) {
    const liste = alle('D-BU-01', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      const w = nachWort.get(a.daten.wort);
      const opt = a.optionen.map((o) => o.toLowerCase());
      const ziel = w.wort[0].toLowerCase();
      assert.equal(opt[a.richtig], ziel);
      assert.equal(grundlaut(w.laute[0]), ziel, `${w.wort}: Anfang anders gehört als geschrieben`);
      assert.equal(a.vorlesen, w.sprich || w.wort);
      assert.equal(a.optionen.length, s === 1 ? 3 : 4);
      for (const o of a.optionen) assert.equal(o, s === 1 ? o.toUpperCase() : o.toLowerCase());
      for (let i = 0; i < opt.length; i++) for (let j = i + 1; j < opt.length; j++) {
        assert.ok(!T.klangKonflikt(opt[i], opt[j]) && !T.nieZusammen(opt[i], opt[j]), `${opt[i]} / ${opt[j]}`);
      }
      const falsche = opt.filter((_, i) => i !== a.richtig);
      if (s < 3) for (const x of falsche) assert.ok(!aehnlichForm(ziel, x) && !aehnlichLaut(ziel, x), `${ziel} / ${x}`);
      else assert.ok(falsche.some((x) => aehnlichForm(ziel, x) || aehnlichLaut(ziel, x)), `Stufe 3 ohne ähnlichen Ablenker: ${ziel} / ${falsche}`);
      assert.deepEqual([...a.braucht].sort(), [...opt].sort());
    }
  }
});

test('D-BU-02: Bild zum Buchstaben aus der Schreibung; Stufe 3 Laut irgendwo im Wort', () => {
  for (const s of [1, 2]) {
    const liste = alle('D-BU-02', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      assert.equal(a.optionen.length, s === 1 ? 3 : 4);
      assert.equal(a.namenSprechen, false);
      const z = a.zeige.toLowerCase();
      assert.equal(a.zeige, s === 1 ? z.toUpperCase() : z);
      const ws = a.optionen.map(wortVon);
      for (const w of ws) assert.ok(!w.nameUnsicher, w.wort);
      assert.equal(ws[a.richtig].wort[0].toLowerCase(), z);
      assert.equal(grundlaut(ws[a.richtig].laute[0]), z);
      ws.forEach((w, i) => {
        if (i === a.richtig) return;
        assert.notEqual(w.wort[0].toLowerCase(), z, w.wort);
        const g = grundlaut(w.laute[0]);
        assert.ok(!T.klangKonflikt(g, z) && !T.nieZusammen(g, z) && !aehnlichLaut(g, z), `${w.wort} / ${z}`);
      });
      assert.deepEqual(a.braucht, [z]);
    }
  }
  const liste = alle('D-BU-02', 3, ctxAlle); genug(liste);
  for (const a of liste) {
    nurRichtig(a);
    const laut = a.daten.laut;
    assert.equal(a.zeige, buchstabe.get(laut).anzeige);
    const ws = a.optionen.map(wortVon);
    const einheiten = (w) => w.laute.map((e) => e.toLowerCase());
    assert.equal(einheiten(ws[a.richtig]).filter((e) => grundlaut(e) === laut).length, 1, ws[a.richtig].wort);
    ws.forEach((w, i) => { if (i !== a.richtig) { assert.ok(!einheiten(w).some((e) => e.includes(laut)), w.wort); assert.ok(!w.wort.toLowerCase().includes(laut), w.wort); } });
    assert.ok(!['ck', 'tz'].includes(laut));
    assert.deepEqual(a.braucht, [laut]);
  }
});

test('D-BU-03: Paare gross und klein, Auswahl nach Katalog', () => {
  const menge = { 1: 'oswuzvxpc', 2: 'aegrhbd' };
  const gruppen = [['b', 'd', 'p', 'q'], ['n', 'm', 'u']];
  for (const s of [1, 2, 3]) {
    const liste = alle('D-BU-03', s); genug(liste);
    for (const a of liste) {
      const ids = a.paare.map(([x, y]) => { assert.equal(x.buchstabe, y.buchstabe.toUpperCase()); assert.notEqual(x.buchstabe, y.buchstabe); return y.buchstabe; });
      assert.equal(a.paare.length, s === 3 ? 4 : 3);
      assert.equal(new Set(ids).size, ids.length);
      if (menge[s]) for (const x of ids) assert.ok(menge[s].includes(x), `${x} auf Stufe ${s}`);
      const inGruppe = gruppen.map((g) => ids.filter((x) => g.includes(x)).length);
      if (s < 3) assert.ok(inGruppe.every((n) => n <= 1), ids.join());
      else assert.ok(inGruppe.some((n) => n >= 2), ids.join());
      assert.ok(!(ids.includes('i') && ids.includes('l')), 'I und l zusammen');
      for (let i = 0; i < a.paare.length; i++) for (let j = 0; j < a.paare.length; j++) assert.equal(passt(a, i, j), i === j);
      assert.deepEqual([...a.braucht].sort(), [...ids].sort());
    }
  }
});

test('D-BU-04: Zeichen und Hilfe je Stufe', () => {
  for (const s of [1, 2, 3]) {
    const liste = alle('D-BU-04', s); genug(liste);
    for (const a of liste) {
      const z = a.zeichen;
      assert.equal([...z].length, 1);
      assert.ok(buchstabe.has(z.toLowerCase()));
      if (s === 1) { assert.equal(z, z.toUpperCase()); assert.ok(!'ÄÖÜ'.includes(z)); assert.equal(a.hilfe, 'pfeile'); }
      if (s === 2) { assert.equal(z, z.toLowerCase()); assert.ok(!'äöü'.includes(z)); assert.equal(a.hilfe, 'pfeile'); }
      if (s === 3) { assert.ok('bdpqäöüÄÖÜ'.includes(z)); assert.equal(a.hilfe, 'start'); }
      assert.deepEqual(a.braucht, [z.toLowerCase()]);
    }
  }
});

test('D-BU-05: Stellen des Buchstabens im Wort selbst gesucht', () => {
  for (const s of [1, 2, 3]) {
    const liste = alle('D-BU-05', s); genug(liste);
    for (const a of liste) {
      const x = a.daten.buchstabe;
      const stellen = [...a.zeige].map((c, i) => (c.toLowerCase() === x ? String(i) : null)).filter((i) => i !== null);
      // alle Vorkommen zählen: der Buchstabe steckt nie zusätzlich in einer Verbindung
      assert.deepEqual([...a.loesung].sort(), stellen.sort(), `${a.zeige} / ${x}`);
      assert.ok(pruefe(a, richtigeEingabe(a)).ok);
      assert.ok(!pruefe(a, a.loesung.slice(1)).ok);
      assert.ok(zerlege(a.zeige).every((e) => e.length === 1 || !e.includes(x)), `${a.zeige}: ${x} in Verbindung`);
      const gross = a.loesung.filter((i) => a.zeige[i] !== x);
      if (s === 1) { assert.equal(a.loesung.length, 1); assert.ok(a.zeige.length <= 6); assert.equal(a.ziel, a.zeige[a.loesung[0]]); }
      if (s === 2) { assert.ok(a.loesung.length >= 2 && a.loesung.length <= 3); assert.equal(gross.length, 0); assert.equal(a.ziel, x); }
      if (s === 3) { assert.equal(gross.length, 1); assert.ok(a.loesung.length >= 2); assert.equal(a.ziel, `${x.toUpperCase()} ${x}`); }
      for (const e of zerlege(a.zeige)) assert.ok(a.braucht.includes(e), `braucht ${e}`);
      assert.equal(a.einheit, 'buchstabe');
    }
  }
});

test('D-BU-06: ABC-Reihe auf einem zweiten Weg', () => {
  const liste1 = alle('D-BU-06', 1); genug(liste1);
  for (const a of liste1) {
    nurRichtig(a);
    const teile = a.zeige.split(' ');
    assert.equal(teile.length, 4);
    const l = teile.indexOf('○');
    assert.ok(l >= 1 && l <= 3);
    const bekannt = teile.findIndex((t, i) => i !== l);
    const start = ABC.indexOf(teile[bekannt].toLowerCase()) - bekannt;
    teile.forEach((t, i) => { if (i !== l) assert.equal(t.toLowerCase(), ABC[start + i]); });
    assert.equal(a.optionen[a.richtig].toLowerCase(), ABC[start + l]);
  }
  for (const [s, n] of [[2, 3], [3, 5]]) {
    const liste = alle('D-BU-06', s); genug(liste);
    for (const a of liste) {
      assert.equal(a.teile.length, n);
      const pos = a.teile.map((t) => ABC.indexOf(t.toLowerCase()));
      assert.ok(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1])), a.teile.join());
      assert.ok(pruefe(a, richtigeEingabe(a)).ok);
      assert.ok(!pruefe(a, [...a.teile.keys()].reverse()).ok);
    }
  }
});

test('D-BU-07: Verbindung kommt genau einmal im Wort vor, Ablenker nicht', () => {
  for (const [s, ctx] of [[1, ctxStd], [2, ctxAlle], [3, ctxAlle]]) {
    const liste = alle('D-BU-07', s, ctx); genug(liste);
    const auswahl = F['D-BU-07'].stufen[String(s)].auswahl;
    for (const a of liste) {
      nurRichtig(a);
      const w = nachWort.get(a.daten.wort);
      const v = a.optionen[a.richtig];
      if (auswahl) assert.ok(auswahl.includes(v), v);
      assert.equal(zerlege(w.wort).filter((e) => e === v).length, 1, `${w.wort} / ${v}`);
      assert.ok(!/chs/i.test(w.wort));
      a.optionen.forEach((o, i) => { if (i !== a.richtig) assert.ok(!w.wort.toLowerCase().includes(o), `${w.wort} enthält ${o}`); });
      assert.equal(a.vorlesen, w.sprich || w.wort);
      assert.deepEqual([...a.braucht].sort(), [...a.optionen].sort());
    }
  }
});

test('Kleine Freigabe: kein nicht eingeführter Buchstabe sichtbar', () => {
  const ctx = kontext({ freigabe: FREI_KLEIN });
  for (const id of Object.keys(generatoren)) for (const s of Object.keys(generatoren[id])) {
    for (const a of aufgaben(id, s, ctx, 150)) {
      for (const b of a.braucht) assert.ok(FREI_KLEIN.has(b), `${id}/${s}: ${b}`);
      const gezeigt = [a.zeige, a.ziel, a.zeichen, a.typ === 'wahl-wort' ? a.optionen : null, a.typ === 'reihenfolge' ? a.teile : null,
        ...(a.paare || []).flat().map((p) => p.buchstabe)].flat().filter((x) => typeof x === 'string');
      for (const t of gezeigt) for (const wort of t.split(/\s+/).filter((x) => x && x !== '○')) {
        for (const e of zerlege(wort.toLowerCase())) assert.ok(FREI_KLEIN.has(e), `${id}/${s}: «${t}» zeigt ${e}`);
      }
    }
  }
});
