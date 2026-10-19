// Mathematik RE (Rechnen): jede Stufe mit 300 Startwerten, Lösung auf einem zweiten Weg nachgerechnet
// (Durchzählen in Einerschritten, Plättchen-Arrays, Umkehraufgabe, Einsetzen in die Rechnung).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generatoren } from '../../site/js/math/re.js';
import { fertigeAufgabe } from '../../site/js/math/index.js';
import { pruefe, richtigeEingabe, passt } from '../../site/js/core/pruefen.js';

const katalog = JSON.parse(fs.readFileSync(new URL('../../site/data/katalog/mathe.json', import.meta.url), 'utf8'));
const P = JSON.parse(fs.readFileSync(new URL('../../site/data/parameter.json', import.meta.url), 'utf8'));
const F = Object.fromEntries(katalog.fertigkeiten.map((f) => [f.id, f]));
const ctx = { grenze: 100, begriffe: P.begriffe, stimme: true };
function* aufgaben(id, stufe, n = 300) {
  for (let seed = 1; seed <= n; seed++) {
    const a = fertigeAufgabe(generatoren[id][stufe], F[id], stufe, seed * 37 + 11, ctx);
    if (a) yield a;
  }
}
const alle = function* () { for (const id of Object.keys(generatoren)) for (const s of [1, 2, 3]) for (const a of aufgaben(id, s, 150)) yield [id, s, a]; };

// --- zweiter Rechenweg: Durchzählen in Einerschritten ---
function zaehle(a, op, b) {
  let x = a;
  for (let i = 0; i < b; i++) x += op === '+' ? 1 : -1;
  return x;
}
// Rechnung auswerten («3 + 4 − 2»), Lücken mit den Werten füllen; true, wenn alle Seiten gleich sind
function seite(t) {
  let x = Number(t[0]);
  for (let i = 1; i < t.length; i += 2) {
    const z = Number(t[i + 1]);
    if (t[i] === '+') x = zaehle(x, '+', z); else if (t[i] === '−') x = zaehle(x, '−', z); else return NaN;
  }
  return x;
}
function stimmt(zeile, werte) {
  const t = zeile.split(' ').map((x) => (x === '_' ? String(werte.shift()) : x));
  const seiten = [[]];
  for (const x of t) { if (x === '=') seiten.push([]); else seiten.at(-1).push(x); }
  const v = seiten.map(seite);
  return v.length >= 2 && v.every((x) => !Number.isNaN(x) && x === v[0]);
}
const zeilen = (a) => (Array.isArray(a.zeige) ? a.zeige : typeof a.zeige === 'string' ? [a.zeige] : []);
const zahlenIn = (t) => (String(t).match(/\d+/g) || []).map(Number);

test('Eingesetzte Lösung macht jede gezeigte Rechnung wahr', () => {
  for (const [id, s, a] of alle()) {
    if (a.typ !== 'zahl' || !a.zeige) continue;
    const werte = a.loesung.slice();
    for (const z of zeilen(a)) assert.ok(stimmt(z, werte), `${id}/${s}: ${zeilen(a).join(' | ')} mit ${a.loesung}`);
    assert.equal(werte.length, 0, `${id}/${s}: zu viele Lösungen für ${zeilen(a)}`);
  }
});

test('Zahlenraum, keine negativen Zahlen, keine 0 ausser M-RE-04 Stufe 3, kein «+ 0» oder «− 0»', () => {
  for (const [id, s, a] of alle()) {
    const bis = F[id].stufen[s].raum;
    const texte = [...zeilen(a), ...(a.optionen || []).map(String), ...(a.kacheln || []), ...(a.paare || []).flat().map((e) => e.text)];
    const zahlen = [...texte.flatMap(zahlenIn), ...(a.typ === 'zahl' ? a.loesung : [])];
    for (const z of zahlen) {
      assert.ok(z >= 0 && z <= bis, `${id}/${s}: Zahl ${z} ausserhalb 0 bis ${bis}`);
      if (!(id === 'M-RE-04' && s === 3)) assert.ok(z !== 0, `${id}/${s}: 0 in ${texte.join(' | ')} / ${a.loesung}`);
    }
    for (const t of texte) assert.ok(!/[+−] 0( |$)/.test(t), `${id}/${s}: «+ 0» oder «− 0» in ${t}`);
    for (const t of texte) assert.ok(!/(^|\s)-(\s|$)/.test(t), `${id}/${s}: Bindestrich statt Minus in ${t}`);
    assert.ok(a.typ === 'zuordnen' || pruefe(a, richtigeEingabe(a)).ok, `${id}/${s}: richtige Eingabe nicht akzeptiert`);
  }
});

test('Rechnungen aus «daten» durch Durchzählen nachgerechnet', () => {
  for (const [id, s, a] of alle()) {
    const d = a.daten;
    if (a.typ !== 'zahl' || !d || !['+', '−'].includes(d.op) || d.a === undefined) continue;
    const e = zaehle(d.a, d.op, d.b);
    if (d.luecke === 'a') assert.equal(a.loesung.at(-1), d.a, `${id}/${s}`);
    else if (d.luecke === 'b') assert.equal(a.loesung.at(-1), d.b, `${id}/${s}`);
    else assert.equal(a.loesung.at(-1), e, `${id}/${s}: ${d.a} ${d.op} ${d.b}`);
  }
});

test('M-RE-01/02: Plättchen und Dinge zählen ergibt die Lösung', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-RE-01', s)) {
    const v = a.visual;
    const anzahl = v.art === 'dinge' ? v.gruppen.reduce((x, y) => x + y, 0) : Array.from({ length: v.rot + v.blau }).length;
    assert.equal(anzahl, a.loesung[0]);
    if (v.art === 'dinge') assert.equal(v.n, anzahl);
    assert.ok(a.loesung[0] <= (s === 1 ? 5 : 10));
  }
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-RE-02', s)) {
    const v = a.visual;
    const plaettchen = Array.from({ length: v.art === 'dinge' ? v.n : v.rot }, (_, i) => i);
    const uebrig = plaettchen.slice(0, plaettchen.length - v.weg).length;   // durchgestrichen von hinten
    assert.equal(uebrig, a.loesung[0]);
    assert.ok(v.weg >= 1 && uebrig >= 1);
  }
});

test('M-RE-05/06/07/14: Zehnerübergang genau dort, wo er verlangt ist', () => {
  for (const s of [1, 2]) for (const a of aufgaben('M-RE-05', s)) {
    const { a: x, b, op } = a.daten;
    if (op === '+') assert.ok((x % 10) + b <= 9 && x >= 11, `ohne Übergang: ${x} + ${b}`);
    else assert.ok(b <= x % 10 && x >= 11, `ohne Übergang: ${x} − ${b}`);
  }
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-RE-06', s)) {
    const { a: x, b } = a.daten;
    assert.ok(x <= 9 && b <= 9 && x + b > 10, `mit Übergang: ${x} + ${b}`);
    if (s === 1) { assert.equal(a.visual.rot, x); assert.equal(a.visual.blau, b); }
    if (s === 2) { assert.equal(x + a.loesung[0], 10); assert.equal(a.loesung[0] + a.loesung[1], b); }
  }
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-RE-07', s)) {
    const { a: x, b } = a.daten;
    assert.ok(x > 10 && x % 10 < b && b <= 9 && x - b < 10, `mit Übergang: ${x} − ${b}`);
    if (s === 1) { assert.equal(a.visual.rot - a.visual.weg, a.loesung[0]); assert.ok(a.visual.weg > a.visual.rot - 10); }
    if (s === 2) { assert.equal(x - a.loesung[0], 10); assert.equal(a.loesung[0] + a.loesung[1], b); }
    // typischer Fehler 13 − 5 = 12 hat ein Fehlerbild
    if (s !== 2) assert.ok(a.fehlerbilder.some((f) => Number(f.eingabe) === 10 + (b - (x % 10))));
  }
  for (const a of aufgaben('M-RE-14', 3)) {
    const { a: x, b, op } = a.daten;
    if (op === '+') assert.ok(x + b > 10 && x <= 9 && b <= 9); else assert.ok(x % 10 < b && x > 10);
    assert.equal(a.daten.karte, `${x}${op === '+' ? '+' : '−'}${b}`);
  }
});

test('M-RE-08: Tauschaufgaben', () => {
  for (const a of aufgaben('M-RE-08', 1)) {
    const summen = new Set();
    for (const [l, r] of a.paare) {
      const [x, , y] = l.text.split(' '), [u, , v] = r.text.split(' ');
      assert.equal(x, v); assert.equal(y, u); assert.notEqual(x, y);
      summen.add(Number(x) + Number(y));
    }
    assert.equal(summen.size, a.paare.length, 'verschiedene Ergebnisse');
    for (let i = 0; i < a.paare.length; i++) for (let j = 0; j < a.paare.length; j++) assert.equal(passt(a, i, j), i === j);
  }
  for (const a of aufgaben('M-RE-08', 2)) {
    const [x, , y] = a.zeige.split(' ');
    const tausch = a.optionen.filter((o) => o === `${y} + ${x}`);
    assert.equal(tausch.length, 1);
    assert.equal(a.optionen[a.richtig], `${y} + ${x}`);
  }
  for (const a of aufgaben('M-RE-08', 3)) assert.ok(a.daten.a <= 3 && a.daten.b > a.daten.a + 2);
});

test('M-RE-09: Umkehraufgaben, Rechenfamilien, Probe', () => {
  const menge = (t) => zahlenIn(t).sort((p, q) => p - q).join(',');
  for (const a of aufgaben('M-RE-09', 1)) {
    const { a: x, b, s } = a.daten;
    for (const o of a.optionen) assert.ok(stimmt(o, []), `wahre Rechnung: ${o}`);
    const familie = a.optionen.filter((o) => o.includes('−') && menge(o) === menge(`${x} ${b} ${s}`));
    assert.equal(familie.length, 1);
    assert.equal(a.optionen[a.richtig], familie[0]);
  }
  for (const a of aufgaben('M-RE-09', 2)) {
    const voll = (l) => { const t = l.slice(); return a.vorlage.map((v) => (v === null ? t.shift() : v)).join(' '); };
    for (const l of [a.loesung, ...a.alternativen]) {
      assert.ok(stimmt(voll(l), []), voll(l));
      assert.equal(menge(voll(l)), menge(`${a.daten.a} ${a.daten.b} ${a.daten.s}`));
      assert.ok(voll(l).includes(a.daten.op));
    }
    assert.deepEqual([...a.kacheln].sort(), [...a.loesung].sort());
  }
  for (const a of aufgaben('M-RE-09', 3)) {
    const { a: x, b, c, gegeben } = a.daten;
    assert.ok(stimmt(a.zeige, []));
    for (const o of a.optionen) assert.ok(stimmt(o, []), `wahre Rechnung: ${o}`);
    const gegenteil = gegeben === '−' ? '+' : '−';
    const probe = a.optionen.filter((o) => o.includes(gegenteil) && menge(o) === menge(`${x} ${b} ${c}`));
    assert.equal(probe.length, 1, a.optionen.join(' | '));
    assert.equal(a.optionen[a.richtig], probe[0]);
  }
});

test('M-RE-10: Nachbaraufgaben weichen um eins vom Verdoppeln ab', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-RE-10', s)) {
    const { a: x, b, doppel: d } = a.daten;
    assert.equal(Math.abs(x - b), 1);
    assert.ok(x === d || b === d);
    assert.equal(a.loesung[0], zaehle(zaehle(d, '+', d), x + b > 2 * d ? '+' : '−', 1));
    if (s < 3) assert.equal(a.zeige[0], `${d} + ${d} = ${2 * d}`);
    const bild = a.visual || a.visualNachFehler;
    assert.equal(bild.rot + bild.blau, a.loesung[0]);
    assert.ok(bild.rot <= 10 && bild.blau <= 10, 'zwei Reihen');
  }
});

test('M-RE-11: Platzhalter, Bild der Schüttelbox passt', () => {
  for (const a of aufgaben('M-RE-11', 1)) {
    const v = a.visual;
    assert.equal(v.art, 'schuettelbox');
    assert.equal(v.n - v.sichtbar, a.loesung[0], 'verdeckt = gesucht');
  }
  for (const s of [2, 3]) for (const a of aufgaben('M-RE-11', s)) assert.ok(a.zeige.includes('_'));
});

test('M-RE-12: Geschichten passen zu Bild und Rechnung', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-RE-12', s)) {
    const { a: x, b, op, art } = a.daten;
    const zahlenText = zahlenIn(a.frage);
    assert.ok(a.frage.split(/[.?]/).filter((t) => t.trim()).length <= 3 + (s === 2 ? 1 : 0), `höchstens drei Sätze: ${a.frage}`);
    if (art === 'dazu') {
      assert.ok(zahlenText.includes(x) && zahlenText.includes(b));
      assert.deepEqual(a.visual.gruppen, [x, b]);
      if (s === 2) {
        const voll = (l) => { const t = l.slice(); return a.vorlage.map((v) => (v === null ? t.shift() : v)).join(' '); };
        for (const l of [a.loesung, ...a.alternativen]) { assert.ok(stimmt(voll(l), [])); assert.ok(voll(l).includes('+')); }
        assert.equal(zaehle(x, '+', b), Number(a.loesung.at(-1)));
      } else assert.equal(a.loesung[0], zaehle(x, '+', b));
    } else if (art === 'weg') {
      assert.equal(a.visual.n, x); assert.equal(a.visual.weg, b);
      assert.equal(a.loesung[0], zaehle(x, '−', b));
    } else {
      // ergänzen: von a bis s zählen
      let schritte = 0; for (let y = x; y < a.daten.s; y++) schritte++;
      assert.equal(a.loesung[0], schritte);
      assert.equal(a.visual.n, x);
      assert.ok(zahlenText.includes(a.daten.s) && zahlenText.includes(x));
    }
    assert.ok(!/ß/.test(a.frage));
  }
});

test('M-RE-13: Zahlenmauer mit eingesetzter Lösung stimmt', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-RE-13', s)) {
    const werte = a.loesung.slice();
    const R = a.visual.reihen.map((reihe) => reihe.map((x) => (x === '?' ? werte.shift() : x)));
    assert.equal(werte.length, 0);
    for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < R[i].length; j++) assert.equal(R[i][j], zaehle(R[i + 1][j], '+', R[i + 1][j + 1]));
    assert.deepEqual(R, a.daten.reihen);
    assert.ok(R[0][0] <= (s === 3 ? 20 : 10));
  }
});

test('M-RE-14: Karteikarten-Schlüssel und Zahlenhaus', () => {
  for (const a of aufgaben('M-RE-14', 1)) {
    const { n, a: x, b } = a.daten;
    const zeile = a.visual.zeilen[0].map((z) => (z === '?' ? a.loesung[0] : z));
    assert.equal(zaehle(zeile[0], '+', zeile[1]), a.visual.dach);
    assert.equal(a.daten.karte, `${n}=${x}+${b}`);
  }
  for (const a of aufgaben('M-RE-14', 2)) assert.equal(a.daten.karte, a.zeige.replace(' = _', '').replace(/ /g, ''));
});

test('M-RE-15: Zeichen stimmt mit den ausgerechneten Seiten überein', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-RE-15', s)) {
    assert.deepEqual(a.optionen, ['<', '=', '>']);
    const [l, r] = a.zeige.split(' ○ ');
    const L = seite(l.split(' ')), R = seite(r.split(' '));
    const z = L < R ? '<' : L > R ? '>' : '=';
    assert.equal(a.optionen[a.richtig], z);
    if (s > 1) assert.ok(/[+−]/.test(l) && /[+−]/.test(r), 'zwei Rechnungen');
    assert.notEqual(l, r);
  }
});

test('Vielfalt: mindestens 15 verschiedene Aufgaben, wo möglich', () => {
  const ausnahmen = { 'M-RE-01/1': 10, 'M-RE-02/1': 10 };   // Ergebnis bis 5: nur 10 Aufgaben möglich
  for (const id of Object.keys(generatoren)) for (const s of [1, 2, 3]) {
    const sigs = new Set([...aufgaben(id, s, 300)].map((a) => a.sig));
    assert.ok(sigs.size >= (ausnahmen[`${id}/${s}`] ?? 15), `${id}/${s}: ${sigs.size}`);
  }
});
