// Deutsch LE (Lesen): jede Stufe mit 300 Startwerten. Die Lösung wird auf einem zweiten Weg aus «daten»,
// dem Lexikon und den festen Inhalten nachgeprüft (Silbe, Wort, Bild, Sichtwort, Satz, Geschichte).
// Dazu: mit der kleinen Freigabe kein nicht eingeführter Buchstabe sichtbar, und «braucht» ist vollständig.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatoren } from '../../site/js/deutsch/le.js';
import { fertigeAufgabe, stufeFrei } from '../../site/js/deutsch/index.js';
import { pruefe, richtigeEingabe } from '../../site/js/core/pruefen.js';
import { werkzeug, zerlege, FARBE_ID } from '../../site/js/deutsch/lib.js';
import { K, W, INHALTE, kontext, FREI_STANDARD, FREI_KLEIN, FREI_ALLE } from '../deutsch-kontext.mjs';

const F = Object.fromEntries(K.fertigkeiten.map((f) => [f.id, f]));
const nachBild = new Map(W.woerter.map((w) => [w.bild, w]));
const nachWort = new Map(W.woerter.map((w) => [w.wort, w]));
const sicht = new Set(W.sichtwoerter.map((s) => s.wort.toLowerCase()));
const klein = (t) => String(t).toLowerCase();
const ctxStd = kontext({ freigabe: FREI_STANDARD });
const T = werkzeug(ctxStd);
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
  assert.ok(pruefe(a, richtigeEingabe(a)).ok, 'richtige Eingabe');
  a.optionen.forEach((_, i) => assert.equal(pruefe(a, i).ok, i === a.richtig, `Option ${i}`));
}
// Sichtbare Texte und die nötigen Einheiten (Sichtwörter nur mit ihren Buchstaben, Regel 6)
function sichtbar(a) {
  const t = [];
  const add = (x) => { if (typeof x === 'string' && x.trim()) t.push(x); };
  [].concat(a.zeige ?? []).forEach(add);
  if (a.typ === 'wahl-wort') a.optionen.forEach(add);
  if (a.typ === 'silben') a.silben.forEach(add);
  return t;
}
function noetig(texte) {
  const s = new Set();
  for (const t of texte) for (const w of t.split(/[\s.,!?«»]+/).filter(Boolean)) for (const e of (sicht.has(klein(w)) ? [...klein(w)] : zerlege(w))) s.add(e);
  return s;
}
const unterschiede = (a, b) => { const x = a.laute.map(klein), y = b.laute.map(klein); return x.length === y.length ? x.filter((e, i) => e !== y[i]).length : 99; };
const STUFEN = Object.fromEntries(Object.keys(generatoren).map((id) => [id, Object.keys(F[id].stufen)]));

test('Alle Stufen: «braucht» vollständig und eingeführt (Standard, klein, alle)', () => {
  for (const [name, frei] of [['Standard', FREI_STANDARD], ['klein', FREI_KLEIN], ['alle', FREI_ALLE]]) {
    const ctx = kontext({ freigabe: frei });
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
  const ctx = kontext({ freigabe: FREI_KLEIN });
  for (const [id, stufen] of Object.entries(STUFEN)) for (const s of stufen) {
    if (!stufeFrei(F[id], s, ctx)) continue;
    for (const a of aufgaben(id, s, ctx)) for (const x of noetig(sichtbar(a))) assert.ok(FREI_KLEIN.has(x), `${id}/${s}: «${x}» in ${sichtbar(a).join(' / ')}`);
  }
});

test('D-LE-01: Silbe hören bzw. lesen; Lösung aus dem Lexikon nachgeprüft', () => {
  assert.equal(stufeFrei(F['D-LE-01'], '1', kontext({ silben: false })), false, 'Stufe 1 nur mit «Silben einzeln vorsprechen»');
  const s1 = alle('D-LE-01', 1); genug(s1);
  for (const a of s1) {
    nurRichtig(a);
    assert.equal(a.typ, 'wahl-wort');
    assert.equal(a.optionen.length, 3);
    assert.equal(klein(a.optionen[a.richtig]), a.vorlesen);
    assert.match(a.vorlesen, /^[bdfghklmnprstwz][aiou]$/, 'offene Silbe mit vollem Vokal');
    const q = nachWort.get(a.daten.quelle);
    assert.ok(q.lautgetreu && q.silbenSprechbar && q.silben.map(klein).includes(a.vorlesen), `${a.vorlesen} in ${q.wort}`);
    for (const o of a.optionen) assert.equal(klein(o)[1], a.vorlesen[1], 'gleicher Vokal');
    a.optionen.forEach((o, i) => { if (i !== a.richtig) assert.ok(!T.klangKonflikt(klein(o)[0], a.vorlesen[0])); });
  }
  for (const s of [2, 3]) {
    const liste = alle('D-LE-01', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      assert.equal(a.typ, 'bild-wort');
      assert.equal(a.namenSprechen, false);
      const ws = a.optionen.map(wortVon);
      assert.equal(ws[a.richtig].silben[0], a.zeige, 'das Wort beginnt mit der Silbe');
      ws.forEach((w, i) => { assert.ok(!w.nameUnsicher, w.wort); if (i !== a.richtig) assert.ok(!klein(w.wort).startsWith(klein(a.zeige)), w.wort); });
      if (s === 2) assert.match(klein(a.zeige), /^(sch|[bdfghklmnprstwz])(ei|au|[aeiouäöü])$/);
      if (s === 3) assert.ok(/(sch|ei|au)/.test(klein(a.zeige)) || !/^(sch|[bdfghklmnprstwz])(ei|au|[aeiouäöü])$/.test(klein(a.zeige)), a.zeige);
    }
  }
});

test('D-LE-02: Silben verbinden ergibt das Wort aus dem Lexikon', () => {
  const anzahl = { 1: [2], 2: [3], 3: [2, 3] };
  for (const s of [1, 2, 3]) {
    const liste = alle('D-LE-02', s); genug(liste);
    for (const a of liste) {
      assert.equal(a.typ, 'silben'); assert.equal(a.modus, 'verbinden');
      const w = nachWort.get(a.daten.wort);
      assert.deepEqual(a.silben, w.silben);
      assert.equal(a.silben.join(''), w.wort);
      assert.ok(anzahl[s].includes(a.silben.length));
      assert.ok(pruefe(a, richtigeEingabe(a)).ok);
      assert.ok(!pruefe(a, a.silben.map((_, i) => i).reverse()).ok, 'umgekehrte Reihenfolge');
      if (s < 3) { assert.equal(a.bild, w.bild); assert.ok(!w.nameUnsicher); } else { assert.equal(a.bild, undefined); assert.equal(a.vorlesen, w.wort); }
      if (s === 1) assert.ok(w.lautgetreu);
    }
  }
});

// Zusammengesetzte Wörter im Lexikon (D-LE-04 Stufe 3), von Hand bestimmt
const ZUSAMMENGESETZT = ['Einhorn', 'Nashorn', 'Lastwagen', 'Regenbogen', 'Sonnenblume', 'Schneemann', 'Fledermaus', 'Wildschwein', 'Seilbahn', 'Handschuh', 'Sanduhr', 'Zahnbürste', 'Erdbeere', 'Erdnuss', 'Schildkröte', 'Motorrad', 'Kokosnuss', 'Nilpferd', 'Eichhörnchen', 'Spiegelei', 'Feuerwehr', 'Flugzeug', 'Rucksack', 'Faultier', 'Dreieck'];
test('D-LE-03/04/05: Wort lesen, das Bild des Worts ist die Lösung', () => {
  const regeln = {
    'D-LE-03': { 1: [3, (w) => w.lautgetreu && w.silben.length === 2, true], 2: [4, (w) => w.silben.length === 2, false], 3: [3, (w) => w.silben.length === 2, false] },
    'D-LE-04': { 1: [3, (w) => w.lautgetreu && w.silben.length === 3, true], 2: [4, (w) => w.silben.length === 3, false], 3: [3, (w) => w.silben.length >= 4 || ZUSAMMENGESETZT.includes(w.wort), false] },
    'D-LE-05': { 1: [3, (w) => w.lautgetreu && w.silben.length === 1, false], 2: [4, (w) => w.lautgetreu && w.silben.length === 1, false], 3: [4, (w) => w.silben.length === 1 && w.merk.some((m) => ['doppel', 'dehnung-h'].includes(m)), false] },
  };
  for (const [id, stufen] of Object.entries(regeln)) for (const [s, [n, passt, boegen]] of Object.entries(stufen)) {
    const liste = alle(id, s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      assert.equal(a.optionen.length, n, `${id}/${s}`);
      const w = nachWort.get(a.zeige);
      assert.ok(w && passt(w), `${id}/${s}: ${a.zeige}`);
      const ws = a.optionen.map(wortVon);
      assert.equal(ws[a.richtig].wort, w.wort);
      assert.equal(new Set(ws.map((x) => x.wort)).size, n);
      assert.ok(T.zusammenOk(ws), ws.map((x) => x.wort).join());
      assert.equal(Boolean(a.silbenboegen), boegen);
      assert.equal(a.sprichNachher, w.wort);
      if (id === 'D-LE-03' && s === '3') assert.ok(ws.some((x, i) => i !== a.richtig && unterschiede(x, w) === 1), `Minimalpaar zu ${w.wort}: ${ws.map((x) => x.wort)}`);
    }
  }
});

test('D-LE-06: gehörtes Wort unter geschriebenen; Anfang und Ende nach Stufe', () => {
  for (const s of [1, 2, 3]) {
    const liste = alle('D-LE-06', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      assert.equal(a.optionen.length, s === 3 ? 4 : 3);
      const w = nachWort.get(a.optionen[a.richtig]);
      assert.equal(w.wort, a.daten.wort);
      assert.equal(a.vorlesen, w.sprich || w.wort);
      const ws = a.optionen.map((o) => nachWort.get(o));
      const erste = (x) => klein(x.laute[0]), letzte = (x) => klein(x.laute[x.laute.length - 1]);
      ws.forEach((x, i) => {
        if (i === a.richtig) return;
        if (s === 1) assert.notEqual(erste(x), erste(w));
        if (s >= 2) assert.equal(erste(x), erste(w));
        if (s === 3) assert.equal(letzte(x), letzte(w));
      });
      if (s === 1) assert.ok(ws.every((x) => x.lautgetreu));
    }
  }
});

test('D-LE-07: Sichtwörter der Gruppe; im Satz genau das gesuchte Wort', () => {
  for (const s of [1, 2, 3]) {
    const liste = alle('D-LE-07', s); genug(liste);
    const gruppe = new Set(W.sichtwoerter.filter((x) => x.gruppe === s).map((x) => x.wort));
    let imSatz = 0;
    for (const a of liste) {
      assert.ok(gruppe.has(a.daten.wort), a.daten.wort);
      if (a.typ === 'antippen') {
        imSatz++;
        assert.equal(a.einheit, 'wort');
        const woerter = a.zeige.split(' ');
        assert.equal(woerter[Number(a.loesung[0])].replace(/[.!?]/g, '').toLowerCase(), a.daten.wort.toLowerCase());
        assert.equal(woerter.filter((x) => klein(x.replace(/[.!?]/g, '')) === klein(a.daten.wort)).length, 1);
        assert.ok(INHALTE.saetze.some((x) => x.satz === a.zeige && (x.stufen['D-LE-08'] || x.stufen['D-SC-05'])), 'Satz aus den Lesesätzen');
        assert.ok(pruefe(a, richtigeEingabe(a)).ok);
      } else {
        nurRichtig(a);
        assert.equal(a.optionen[a.richtig], a.vorlesen);
        assert.equal(a.vorlesen, a.daten.wort);
        for (const o of a.optionen) assert.ok(sicht.has(klein(o)), o);
        assert.equal(a.optionen.length, s === 1 ? 3 : 4);
      }
    }
    assert.ok(imSatz > 20 && imSatz < liste.length - 100, `Satz-Variante ${imSatz} von ${liste.length}`);
  }
});

test('D-LE-08: Satz lesen; das Bild des gezeigten Satzes aus den Inhalten ist die Lösung', () => {
  const art = { 1: ['nomen'], 2: ['verb', 'farbe'], 3: ['lage'] };
  for (const s of [1, 2, 3]) {
    const liste = alle('D-LE-08', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      const e = INHALTE.saetze.find((x) => x.id === a.daten.id);
      assert.equal(e.stufen['D-LE-08'], s);
      assert.ok(art[s].includes(e.unterschied));
      const varianten = [{ satz: e.satz, bild: e.bild }, ...e.ablenker];
      const v = varianten.find((x) => x.satz === a.zeige);
      assert.ok(v, a.zeige);
      const opt = (b) => (typeof b === 'string' ? { bild: b } : { szene: b });
      assert.deepEqual(a.optionen[a.richtig], opt(v.bild));
      assert.equal(a.optionen.length, varianten.length);
      for (const x of varianten) assert.ok(a.optionen.some((o) => JSON.stringify(o) === JSON.stringify(opt(x.bild))));
      assert.equal(a.sprichNachher, a.zeige);
    }
  }
  // Inhalte: Stufe 1 nur lautgetreue Wörter und Sichtwörter; Bildpaare nicht verwechselbar; Bilder verschieden
  // lautgetreu, aber nicht im Lexikon
  const VERBEN = ['schläft', 'zwei'];
  for (const e of INHALTE.saetze.filter((x) => x.stufen['D-LE-08'])) {
    const varianten = [{ satz: e.satz, bild: e.bild }, ...e.ablenker];
    assert.equal(new Set(varianten.map((v) => JSON.stringify(v.bild))).size, varianten.length, e.id);
    for (const v of varianten) if (v.bild.art === 'farbe') assert.ok(Object.values(FARBE_ID).includes(v.bild.farbe), `${e.id}: Farbe ${v.bild.farbe}`);
    const ws = varianten.map((v) => (typeof v.bild === 'string' ? v.bild : v.bild.bild)).map((b) => nachBild.get(b)).filter(Boolean);
    const verschieden = [...new Map(ws.map((w) => [w.wort, w])).values()];
    if (verschieden.length > 1) assert.ok(T.zusammenOk(verschieden), `${e.id}: ${verschieden.map((w) => w.wort)}`);
    if (e.stufen['D-LE-08'] === 1) for (const v of varianten) for (const wort of v.satz.replace(/[.!?]$/, '').split(' ')) {
      const lex = W.woerter.find((w) => w.wort === wort || w.mehrzahl === wort);
      assert.ok(sicht.has(klein(wort)) || VERBEN.includes(wort) || (lex && lex.lautgetreu), `${e.id}: «${wort}» ist nicht lautgetreu`);
    }
  }
});

test('D-LE-09: Verbindung aus der Auswahl der Stufe; nur das Zielwort enthält sie', () => {
  const ctx = kontext({ freigabe: FREI_ALLE });
  for (const s of [1, 2, 3]) {
    const liste = alle('D-LE-09', s, ctx); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      assert.ok(F['D-LE-09'].stufen[s].auswahl.includes(a.daten.verbindung));
      const ws = a.optionen.map(wortVon);
      assert.equal(ws[a.richtig].wort, a.zeige);
      ws.forEach((w, i) => assert.equal(w.laute.map(klein).includes(a.daten.verbindung), i === a.richtig, w.wort));
    }
  }
  // Mit der Standard-Freigabe (ch, eu, ie … nicht eingeführt) nur Stufe 1
  assert.equal(stufeFrei(F['D-LE-09'], '2', ctxStd), false);
});

test('D-LE-10: Geschichte lesen; das Bild aus den Inhalten ist die Lösung', () => {
  for (const s of [1, 2, 3]) {
    const liste = alle('D-LE-10', s);
    assert.ok(liste.length >= 280, `nur ${liste.length}`);
    for (const a of liste) {
      nurRichtig(a);
      const g = INHALTE.geschichten.find((x) => x.id === a.daten.id);
      assert.equal(g.stufen['D-LE-10'], s);
      assert.equal(a.zeige, `${g.saetze.join(' ')} ${g.frage}`);
      assert.deepEqual(a.optionen[a.richtig], g.optionen[g.richtig]);
      assert.equal(a.optionen.length, g.optionen.length);
    }
  }
  const saetze = { 1: [2, 3], 2: [3, 4], 3: [4, 4] };
  for (const g of INHALTE.geschichten.filter((x) => x.stufen['D-LE-10'])) {
    const s = g.stufen['D-LE-10'];
    assert.ok(g.saetze.length >= saetze[s][0] && g.saetze.length <= saetze[s][1], `${g.id}: ${g.saetze.length} Sätze`);
    for (const t of [...g.saetze, g.frage]) assert.ok(t.replace(/[.!?]$/, '').split(' ').length <= 6, `${g.id}: ${t}`);
    if (s === 1) assert.match(g.frage, /^Wer /);
    if (s === 2) assert.match(g.frage, /^(Was|Wo) /);
    if (s === 3) assert.match(g.frage, /zuerst|am Schluss|Warum/);
    const ws = g.optionen.map((o) => nachBild.get(o.bild || o.szene?.bild)).filter(Boolean);
    const verschieden = [...new Map(ws.map((w) => [w.wort, w])).values()];
    if (verschieden.length > 1 && g.optionen.every((o) => o.bild)) assert.ok(T.zusammenOk(verschieden), `${g.id}: ${verschieden.map((w) => w.wort)}`);
    assert.equal(new Set(g.optionen.map((o) => JSON.stringify(o))).size, g.optionen.length);
  }
});
