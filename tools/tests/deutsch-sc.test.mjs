// Deutsch SC (Schreiben): jede Stufe mit 300 Startwerten. Die Lösung wird auf einem zweiten Weg aus «daten»,
// dem Lexikon und den festen Inhalten nachgeprüft (Wort, Laute, Lücke, Satz, Lernwort).
// Dazu: mit der kleinen Freigabe kein nicht eingeführter Buchstabe sichtbar, und «braucht» ist vollständig.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatoren } from '../../site/js/deutsch/sc.js';
import { fertigeAufgabe, stufeFrei } from '../../site/js/deutsch/index.js';
import { pruefe, richtigeEingabe } from '../../site/js/core/pruefen.js';
import { werkzeug, zerlege } from '../../site/js/deutsch/lib.js';
import { K, W, B, INHALTE, kontext, FREI_STANDARD, FREI_KLEIN, FREI_ALLE } from '../deutsch-kontext.mjs';

const F = Object.fromEntries(K.fertigkeiten.map((f) => [f.id, f]));
const nachWort = new Map(W.woerter.map((w) => [w.wort, w]));
const sicht = new Set(W.sichtwoerter.map((s) => s.wort.toLowerCase()));
const klein = (t) => String(t).toLowerCase();
const LERNWOERTER = ['Mama', 'Papa', 'Sofa', 'rot', 'malen', 'Schule', 'Haus', 'Wolke'];
const ctxStd = { ...kontext({ freigabe: FREI_STANDARD }), lernwoerter: LERNWOERTER };
const T = werkzeug(ctxStd);
function* aufgaben(id, stufe, ctx = ctxStd, n = 300) {
  for (let seed = 1; seed <= n; seed++) {
    const a = fertigeAufgabe(generatoren[id][stufe], F[id], String(stufe), seed * 104729 + 17, ctx);
    if (a) yield a;
  }
}
const alle = (id, stufe, ctx) => [...aufgaben(id, stufe, ctx)];
const genug = (liste, n = 250) => assert.ok(liste.length >= n, `nur ${liste.length} Aufgaben`);
function sichtbar(a) {
  const t = [];
  const add = (x) => { if (typeof x === 'string' && x.trim()) t.push(x); };
  [].concat(a.zeige ?? []).forEach(add);
  if (a.typ === 'wahl-wort') a.optionen.forEach(add);
  if (a.typ === 'legen') { a.kacheln.forEach(add); add(a.abschreiben); }
  if (a.typ === 'reihenfolge') { a.teile.forEach(add); (a.ablenker || []).forEach(add); }
  if (a.typ === 'nachspuren') add(a.wort);
  return t;
}
function noetig(texte) {
  const s = new Set();
  for (const t of texte) for (const w of t.split(/[\s.,!?«»]+/).filter(Boolean)) for (const e of (sicht.has(klein(w)) ? [...klein(w)] : zerlege(w))) s.add(e);
  return s;
}
const mehrfach = (liste) => liste.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
const STUFEN = Object.fromEntries(Object.keys(generatoren).map((id) => [id, Object.keys(F[id].stufen)]));
const lautgetreu = (w) => w && w.lautgetreu && w.merk.length === 0;

test('Alle Stufen: «braucht» vollständig und eingeführt (Standard, klein, alle)', () => {
  for (const [name, frei] of [['Standard', FREI_STANDARD], ['klein', FREI_KLEIN], ['alle', FREI_ALLE]]) {
    const ctx = { ...kontext({ freigabe: frei }), lernwoerter: LERNWOERTER };
    for (const [id, stufen] of Object.entries(STUFEN)) for (const s of stufen) {
      if (!stufeFrei(F[id], s, ctx)) continue;
      for (const a of aufgaben(id, s, ctx, 150)) {
        const b = new Set(a.braucht);
        for (const x of noetig(sichtbar(a))) assert.ok(b.has(x), `${id}/${s} (${name}): «braucht» fehlt «${x}»: ${sichtbar(a).join(' / ')}`);
        for (const x of b) assert.ok(frei.has(x), `${id}/${s} (${name}): nicht eingeführt «${x}»`);
      }
    }
  }
});

test('Kleine Freigabe: nie ein nicht eingeführter Buchstabe im sichtbaren Text', () => {
  const ctx = { ...kontext({ freigabe: FREI_KLEIN }), lernwoerter: LERNWOERTER };
  for (const [id, stufen] of Object.entries(STUFEN)) for (const s of stufen) {
    if (!stufeFrei(F[id], s, ctx)) continue;
    for (const a of aufgaben(id, s, ctx)) for (const x of noetig(sichtbar(a))) assert.ok(FREI_KLEIN.has(x), `${id}/${s}: «${x}» in ${sichtbar(a).join(' / ')}`);
  }
});

test('D-SC-01: lautgetreues Wort nachspuren; Länge und Hilfen nach Stufe', () => {
  const regel = { 1: [(w) => w.wort.length <= 4, 'pfeile'], 2: [(w) => w.silben.length === 2 && w.wort.length <= 6, 'pfeile'], 3: [(w) => w.wort.length >= 5 && w.wort.length <= 7, 'start'] };
  for (const s of [1, 2, 3]) {
    const liste = alle('D-SC-01', s); genug(liste);
    for (const a of liste) {
      assert.equal(a.typ, 'nachspuren');
      const w = nachWort.get(a.wort);
      assert.ok(lautgetreu(w) && regel[s][0](w), `${s}: ${a.wort}`);
      assert.equal(a.hilfe, regel[s][1]);
      assert.deepEqual(a.braucht, w.laute.map(klein));
    }
  }
});

test('D-SC-02: gehörtes Wort legen; Lösung = Laute aus dem Lexikon, Zusatzbuchstaben passen nicht ins Wort', () => {
  const regel = { 1: [[3, 4], 0], 2: [[4, 5], 2], 3: [[5, 6], 3] };
  for (const s of [1, 2, 3]) {
    const liste = alle('D-SC-02', s); genug(liste);
    for (const a of liste) {
      assert.equal(a.typ, 'legen');
      const w = nachWort.get(a.daten.wort);
      assert.ok(lautgetreu(w));
      assert.equal(a.vorlesen, w.sprich || w.wort);
      assert.deepEqual(a.loesung, w.laute);
      assert.equal(a.loesung.join(''), w.wort);
      assert.equal(a.felder, w.laute.length);
      assert.ok(regel[s][0].includes(w.laute.length), `${s}: ${w.wort}`);
      if (s === 3) { assert.equal(w.silben.length, 2); assert.equal(a.anlauttabelle, true); }
      // Kacheln = Laute des Worts + Zusatzbuchstaben
      const k = mehrfach(a.kacheln);
      for (const [x, n] of mehrfach(a.loesung)) { assert.ok((k.get(x) || 0) >= n, x); k.set(x, k.get(x) - n); }
      const extra = [...k].flatMap(([x, n]) => Array(n).fill(x));
      assert.equal(extra.length, regel[s][1]);
      const imWort = w.laute.map(klein);
      for (const x of extra) {
        assert.ok(!imWort.includes(x), `${w.wort}: ${x}`);
        for (const e of imWort) { assert.ok(!T.klangKonflikt(e, x), `${w.wort}: ${e}/${x}`); assert.ok(!T.nieZusammen(e, x), `${w.wort}: ${e}/${x}`); }
      }
      assert.ok(pruefe(a, richtigeEingabe(a)).ok);
      if (new Set(a.loesung).size > 1) assert.ok(!pruefe(a, a.loesung.slice().reverse()).ok || a.loesung.join('') === a.loesung.slice().reverse().join(''));
    }
  }
});

test('D-SC-03: Wort abschreiben; Vorlage = Wort, Lösung = Laute', () => {
  for (const s of [1, 2, 3]) {
    const liste = alle('D-SC-03', s); genug(liste);
    for (const a of liste) {
      const w = nachWort.get(a.abschreiben);
      assert.ok(lautgetreu(w));
      assert.deepEqual(a.loesung, w.laute);
      assert.deepEqual(a.kacheln.slice().sort(), w.laute.slice().sort());
      assert.equal(Boolean(a.verdecken), s === 3);
      assert.ok((s === 1 ? [3, 4] : s === 2 ? [5, 6] : [4, 5, 6]).includes(a.kacheln.length));
      assert.ok(pruefe(a, richtigeEingabe(a)).ok);
    }
  }
});

test('D-SC-04: fehlender Buchstabe; nur die Lösung ergibt das Wort zum Bild', () => {
  const woerter = new Set([...W.woerter.flatMap((w) => [w.wort, w.mehrzahl]).filter(Boolean).map(klein), ...sicht]);
  for (const s of [1, 2, 3]) {
    const liste = alle('D-SC-04', s); genug(liste);
    for (const a of liste) {
      assert.equal(a.typ, 'wahl-wort');
      assert.ok(pruefe(a, richtigeEingabe(a)).ok);
      a.optionen.forEach((_, i) => assert.equal(pruefe(a, i).ok, i === a.richtig));
      const w = nachWort.get(a.daten.wort);
      assert.ok(lautgetreu(w) && !w.nameUnsicher, w.wort);
      assert.equal(a.bild, w.bild);
      assert.equal(a.namenSprechen, false);
      for (const t of [a.frage, a.sprich, a.hinweis].filter(Boolean)) assert.ok(!t.includes(w.wort), `Name vor der Antwort gesprochen: ${t}`);
      assert.equal((a.zeige.match(/_/g) || []).length, 1);
      const i = a.zeige.indexOf('_');
      if (s === 1) assert.equal(i, 0);
      if (s === 2) assert.equal(i, a.zeige.length - 1);
      if (s === 3) assert.ok(i > 0 && i < a.zeige.length - 1);
      assert.equal(a.zeige.replace('_', a.optionen[a.richtig]), w.wort);
      a.optionen.forEach((o, j) => { if (j !== a.richtig) assert.ok(!woerter.has(klein(a.zeige.replace('_', o))), `${a.zeige} + ${o}`); });
    }
  }
});

test('D-SC-05: Satz legen; Lösung = Satz aus den Inhalten, überzählige Karte passt nicht in den Satz', () => {
  for (const s of [1, 2, 3]) {
    const liste = alle('D-SC-05', s); genug(liste);
    for (const a of liste) {
      assert.equal(a.typ, 'reihenfolge'); assert.equal(a.art, 'text');
      const e = INHALTE.saetze.find((x) => x.id === a.daten.id);
      assert.equal(e.stufen['D-SC-05'], s);
      assert.equal(a.vorlesen, e.satz);
      const n = e.woerter.length - 1;
      if (s === 1) assert.equal(n, 3);
      if (s === 2) assert.ok(n >= 4 && n <= 5);
      if (s < 3) { assert.equal(a.teile.join(' ') + a.ende, e.satz); assert.equal(a.ablenker, undefined); }
      else {
        assert.equal(a.ende, undefined);
        assert.equal(a.teile.slice(0, -1).join(' ') + a.teile[a.teile.length - 1], e.satz);
        assert.equal(a.ablenker.length, 1);
        const x = nachWort.get(a.ablenker[0]);
        assert.ok(lautgetreu(x) && !e.woerter.includes(x.wort), x.wort);
        // Das Geschlecht der Karte passt zu keinem Nomen und keinem Begleiter im Satz (zweiter Weg: Artikel ausgeschrieben)
        const art = new Set(e.woerter.flatMap((t) => ({ der: ['der', 'die'], die: ['die'], das: ['das'], den: ['der'], dem: ['der', 'das'], im: ['der', 'das'], ein: ['der', 'das'], eine: ['die'], einen: ['der'] })[klein(t)] || []));
        for (const t of e.woerter) { const l = W.woerter.find((w) => w.wort === t || w.mehrzahl === t); if (l) art.add(l.artikel); }
        assert.ok(!art.has(x.artikel), `${e.satz} + ${x.wort}`);
        assert.ok(!pruefe(a, [a.teile.length, ...a.teile.map((_, i) => i).slice(1)]).ok, 'mit der überzähligen Karte');
      }
      assert.ok(pruefe(a, richtigeEingabe(a)).ok);
      assert.ok(!pruefe(a, a.teile.map((_, i) => i).reverse()).ok, 'umgekehrt');
    }
  }
  // Inhalte: nur lautgetreue Wörter und Sichtwörter (Namen und Verben von Hand geprüft), kein Wort doppelt
  const OHNE_LEXIKON = ['schläft', 'malt', 'kauft', 'schaut', 'badet', 'tanzt', 'holt', 'hupt', 'malen', 'bauen', 'baut', 'gemalt', 'müde', 'klein', 'braun', 'grün', 'rosa', 'rot', 'rote', 'blau', 'blauen', 'gern', 'wir', 'einen',
    'Lea', 'Mia', 'Nina', 'Jonas', 'Elias', 'Sara', 'Leon', 'Elefanten'];
  for (const e of INHALTE.saetze.filter((x) => x.stufen['D-SC-05'])) {
    const ws = e.woerter.slice(0, -1);
    assert.equal(new Set(ws.map(klein)).size, ws.length, e.id);
    for (const t of ws) {
      const l = W.woerter.find((w) => w.wort === t || w.mehrzahl === t);
      assert.ok(sicht.has(klein(t)) || OHNE_LEXIKON.includes(t) || OHNE_LEXIKON.includes(klein(t)) || lautgetreu(l), `${e.id}: «${t}»`);
    }
    assert.ok(e.bild, e.id);
  }
});

test('D-SC-06: Lernwörter der Eltern; ohne Lernwörter keine Aufgabe', () => {
  for (const s of [1, 2, 3]) {
    assert.equal(generatoren['D-SC-06'][s](() => 0, { ...kontext(), lernwoerter: [] }), null);
    assert.equal(fertigeAufgabe(generatoren['D-SC-06'][s], F['D-SC-06'], String(s), 5, kontext({ lernwoerter: [] })), null);
    const liste = alle('D-SC-06', s); genug(liste);
    for (const a of liste) {
      assert.equal(a.typ, 'legen');
      const wort = a.daten.wort;
      assert.ok(LERNWOERTER.includes(wort));
      assert.equal(a.loesung.join(''), wort);
      assert.deepEqual(a.loesung.map(klein), zerlege(wort));
      if (s === 1) assert.equal(a.abschreiben, wort); else assert.equal(a.vorlesen, wort);
      assert.equal(a.kacheln.length - a.loesung.length, s === 3 ? 2 : 0);
      assert.ok(pruefe(a, richtigeEingabe(a)).ok);
    }
  }
  // «Schule» braucht sch, u, l, e: mit der kleinen Freigabe (ohne sch) nie als Lernwort
  const ctx = { ...kontext({ freigabe: FREI_KLEIN }), lernwoerter: ['Schule'] };
  for (const s of [1, 2, 3]) assert.equal(fertigeAufgabe(generatoren['D-SC-06'][s], F['D-SC-06'], String(s), 9, ctx), null);
});

test('Buchstabenplan: Zusatzkacheln nie c, q, x, y', () => {
  const ids = new Set(B.liste.map((b) => b.id));
  for (const s of [2, 3]) for (const a of alle('D-SC-02', s)) for (const k of a.kacheln) { assert.ok(ids.has(klein(k))); assert.ok(!['c', 'q', 'x', 'y'].includes(klein(k)) || a.loesung.includes(k)); }
});
