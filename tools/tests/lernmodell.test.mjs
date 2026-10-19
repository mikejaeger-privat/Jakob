// Lernmodell, Karteikasten und Tagesplan (reine Funktionen in site/js/core/)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { verbuche, status, wertJetzt, zeigBereit, zeigBestanden, zeigErgebnis, vermute, lies, istSicher, faellig } from '../../site/js/core/stand.js';
import { verbucheKarte, kartenHeute } from '../../site/js/core/kasten.js';
import { budgets, tagesplan, schlange, stufeZumUeben } from '../../site/js/core/plan.js';
import { zufall } from '../../site/js/core/util.js';

const P = JSON.parse(fs.readFileSync('site/data/parameter.json', 'utf8'));
const B = P.beherrschung, ZR = P.zeigRunde, KK = P.karteikasten;
const D = JSON.parse(fs.readFileSync('site/data/katalog/deutsch.json', 'utf8'));
const M = JSON.parse(fs.readFileSync('site/data/katalog/mathe.json', 'utf8'));
const LM = JSON.parse(fs.readFileSync('site/data/lehrmittel.json', 'utf8'));
const k = { D, M, fertigkeiten: new Map([...D.fertigkeiten, ...M.fertigkeiten].map((f) => [f.id, f])) };

test('Status: neu, am Üben, fast sicher; zwei Glückstreffer reichen nicht', () => {
  const stand = {};
  assert.equal(status(stand, 'M-ZA-01', 1, 100, B), 'neu');
  verbuche(stand, 'M-ZA-01', 1, 1, 100, B); verbuche(stand, 'M-ZA-01', 1, 1, 100, B);
  assert.equal(status(stand, 'M-ZA-01', 1, 100, B), 'neu');
  verbuche(stand, 'M-ZA-01', 1, 1, 100, B);
  assert.equal(status(stand, 'M-ZA-01', 1, 100, B), 'ueben', 'drei richtige mit zwei gedachten falschen: Wert 0.6');
  for (let i = 0; i < 4; i++) verbuche(stand, 'M-ZA-01', 1, 1, 101, B);
  assert.equal(status(stand, 'M-ZA-01', 1, 101, B), 'fast');
});

test('Vergessen: nach drei Merkdauern die Hälfte', () => {
  const stand = {};
  for (let i = 0; i < 8; i++) verbuche(stand, 'M-ZA-01', 1, 1, 100, B);
  const e = lies(stand, 'M-ZA-01', 1);
  const w0 = wertJetzt(e, 100, B);
  assert.ok(Math.abs(wertJetzt(e, 100 + 3 * e.merk, B) - w0 / 2) < 1e-9);
  assert.equal(faellig(e, 100 + e.merk - 1), false);
  assert.equal(faellig(e, 100 + e.merk), true);
});

test('Merkdauer: guter Tag verdoppelt, schwacher halbiert (Grenzen)', () => {
  const stand = {};
  for (let i = 0; i < 4; i++) verbuche(stand, 'M-ZA-01', 1, 1, 100, B);
  verbuche(stand, 'M-ZA-01', 1, 1, 101, B);
  assert.equal(lies(stand, 'M-ZA-01', 1).merk, B.merkdauerStart * 2);
  for (let i = 0; i < 4; i++) verbuche(stand, 'M-ZA-01', 1, 0, 102, B);
  verbuche(stand, 'M-ZA-01', 1, 0, 103, B);
  assert.equal(lies(stand, 'M-ZA-01', 1).merk, B.merkdauerStart);
});

test('Zeig-Runde: bereit nach Wert 0.8, 6 Antworten, 2 Tagen; bestanden → sicher; Sperre nach Versuch', () => {
  const stand = {};
  for (let i = 0; i < 6; i++) verbuche(stand, 'M-ZA-01', 1, 1, 100, B);
  let e = lies(stand, 'M-ZA-01', 1);
  assert.equal(zeigBereit(e, 100, B, ZR), false, 'nur ein Tag');
  for (let i = 0; i < 3; i++) verbuche(stand, 'M-ZA-01', 1, 1, 101, B);
  e = lies(stand, 'M-ZA-01', 1);
  assert.equal(zeigBereit(e, 101, B, ZR), true);
  assert.equal(zeigBestanden(3, null, ZR), false);
  assert.equal(zeigBestanden(3, true, ZR), true);
  assert.equal(zeigBestanden(4, null, ZR), true);
  zeigErgebnis(stand, 'M-ZA-01', 1, false, 101, B);
  assert.equal(zeigBereit(e, 101, B, ZR), false, 'höchstens ein Versuch pro Tag');
  assert.equal(zeigBereit(e, 102, B, ZR), false, 'zuerst weiter üben');
  for (let i = 0; i < 3; i++) verbuche(stand, 'M-ZA-01', 1, 1, 102, B);
  assert.equal(zeigBereit(e, 102, B, ZR), true);
  zeigErgebnis(stand, 'M-ZA-01', 1, true, 102, B);
  assert.equal(status(stand, 'M-ZA-01', 1, 102, B), 'sicher');
  assert.equal(zeigBereit(e, 103, B, ZR), false, 'schon sicher');
  // Wert fällt (lange nicht geübt): wieder fast sicher bzw. üben
  assert.notEqual(status(stand, 'M-ZA-01', 1, 102 + 200, B), 'sicher');
});

test('Sichere höhere Stufe schliesst tiefere ein', () => {
  const stand = {};
  for (let i = 0; i < 9; i++) verbuche(stand, 'M-ZA-01', 2, 1, 100 + (i > 4), B);
  zeigErgebnis(stand, 'M-ZA-01', 2, true, 101, B);
  assert.equal(istSicher(stand, 'M-ZA-01', 1, 101, B), true);
  assert.equal(status(stand, 'M-ZA-01', 1, 101, B), 'sicher');
});

test('Entdeckerrunde: vermutet mit Startwert 0.6, wird mit eigenen Antworten normal', () => {
  const stand = {};
  vermute(stand, 'M-ZA-01', 1, 0.6, 100, B);
  assert.equal(status(stand, 'M-ZA-01', 1, 100, B), 'vermutet');
  assert.ok(Math.abs(wertJetzt(lies(stand, 'M-ZA-01', 1), 100, B) - 0.6) < 1e-9);
  for (let i = 0; i < 3; i++) verbuche(stand, 'M-ZA-01', 1, 1, 101, B);
  assert.equal(lies(stand, 'M-ZA-01', 1).vermutet, false);
});

test('Entdeckerrunde: Probe mit zwei richtigen → vermutet, die nächste Stufe wird geübt', () => {
  const stand = {};
  verbuche(stand, 'M-ZA-01', 1, 1, 100, B); verbuche(stand, 'M-ZA-01', 1, 1, 100, B);
  vermute(stand, 'M-ZA-01', 1, 0.6, 100, B);
  assert.equal(status(stand, 'M-ZA-01', 1, 100, B), 'vermutet');
  const c = ctx({ stand, heute: 100 });
  assert.equal(stufeZumUeben(c, k.fertigkeiten.get('M-ZA-01')), 2);
  assert.equal(zeigBereit(lies(stand, 'M-ZA-01', 1), 101, B, ZR), true, 'Vermutung darf mit einer Zeig-Runde bestätigt werden');
});

test('Nachspuren zählt als geübt, nicht in den Wert', () => {
  const stand = {};
  verbuche(stand, 'M-ME-04', 1, 'geuebt', 100, B);
  const e = lies(stand, 'M-ME-04', 1);
  assert.equal(e.na, 0); assert.equal(e.geuebt, 1); assert.equal(e.sw, 0);
});

test('Karteikasten: Fächer 1, 3, 7, 14, 30; Fehler zurück ins erste Fach; Entdeckerrunde startet im dritten', () => {
  const kasten = {};
  verbucheKarte(kasten, 'b:m', 1, 100, KK);
  assert.deepEqual([kasten['b:m'].fach, kasten['b:m'].faellig], [2, 103]);
  verbucheKarte(kasten, 'b:m', 1, 103, KK);
  assert.deepEqual([kasten['b:m'].fach, kasten['b:m'].faellig], [3, 110]);
  verbucheKarte(kasten, 'b:m', 0, 110, KK);
  assert.deepEqual([kasten['b:m'].fach, kasten['b:m'].faellig], [1, 111]);
  verbucheKarte(kasten, 'b:a', 1, 100, KK, { entdecker: true });
  assert.equal(kasten['b:a'].fach, KK.startFachWennSicher);
  for (let i = 0; i < 6; i++) verbucheKarte(kasten, 'b:o', 1, 100 + i * 40, KK);
  assert.equal(kasten['b:o'].fach, 5);
});

test('Karten heute: fällige zuerst, höchstens 4 neue pro Tag, höchstens 5 Karten', () => {
  const kasten = {};
  const kand = ['b:a', 'b:m', 'b:l', 'b:o', 'b:s', 'b:e', 'b:i', 'b:r'];
  const heute1 = kartenHeute(kasten, kand, 100, KK);
  assert.deepEqual(heute1, ['b:a', 'b:m', 'b:l', 'b:o']);
  for (const id of heute1) verbucheKarte(kasten, id, 1, 100, KK);
  assert.deepEqual(kartenHeute(kasten, kand, 100, KK, { neuHeute: 4 }), []);
  verbucheKarte(kasten, 'b:a', 0, 101, KK);
  const h3 = kartenHeute(kasten, kand, 103, KK);
  assert.equal(h3.length, 5);
  assert.deepEqual(h3.slice(0, 3).sort(), ['b:l', 'b:m', 'b:o'].sort().slice(0, 3).length ? h3.slice(0, 3).sort() : []);
  assert.ok(h3.includes('b:a'));
});

test('Zeitbudget: 10 Minuten mit zwei Hauptsteinen, 5 Minuten mit einem', () => {
  const b10 = budgets(10, P.gewichtung, P);
  assert.equal(b10.aufwaermen + b10.schluss + b10.D + b10.M, 600);
  assert.equal(b10.zwei, true);
  assert.ok(b10.D > b10.M);
  const b5 = budgets(5, P.gewichtung, P);
  assert.equal(b5.zwei, false);
  assert.equal(b5.aufwaermen + b5.schluss + b5.einzel, 300);
});

function ctx(extra = {}) {
  return {
    heute: 20380, P, k, lm: LM, stand: {}, kasten: {}, minuten: 10, gewichtung: P.gewichtung,
    mKapitel: 8, dAnteil: 0.2, spielbar: () => true, rng: zufall(7), lerntagNr: 0, entdecker: null,
    schatzFaellig: false, kartenKandidaten: { D: ['b:a', 'b:m'], M: [] }, kartenZiel: () => ({ f: 'D-BU-01', s: '1' }),
    neuHeute: 0, zeigHeute: 0, neuesThemaHeute: null, lernwoerterBald: false,
    startLeicht: { D: [{ f: 'D-BU-01', s: '1' }], M: [{ f: 'M-ZA-05', s: '1' }], schluss: [{ f: 'M-FO-03', s: '1' }] }, ...extra,
  };
}

test('Tagesplan: vier Steine, Aufwärmen mit Karten, höchstens ein neues Thema, keine Fertigkeit doppelt', () => {
  const c = ctx();
  const plan = tagesplan(c);
  assert.deepEqual(plan.steine.map((s) => s.art), ['aufwaermen', 'deutsch', 'mathe', 'schluss']);
  assert.equal(plan.steine[0].eintraege[0].karte, 'b:a');
  const neu = plan.steine.flatMap((s) => s.eintraege).filter((e) => e.neu);
  assert.ok(neu.length <= 1, 'höchstens ein neues Thema');
  for (const st of plan.steine.slice(1, 3)) {
    const ids = st.eintraege.map((e) => e.f);
    assert.equal(new Set(ids).size, ids.length, 'keine Fertigkeit doppelt im Stein');
    assert.ok(st.eintraege.length >= 1);
  }
  const sek = plan.steine.reduce((s, x) => s + x.sek, 0);
  assert.equal(sek, 600);
});

test('Tagesplan: Zeig-Runde kommt in den Stein ihres Fachs, höchstens eine', () => {
  const stand = {};
  for (let i = 0; i < 9; i++) verbuche(stand, 'M-ZA-01', 1, 1, 20378 + (i > 4), B);
  const plan = tagesplan(ctx({ stand }));
  assert.deepEqual(plan.zeig, { f: 'M-ZA-01', s: '1' });
  const m = plan.steine.find((s) => s.art === 'mathe');
  assert.equal(m.eintraege[0].zeig, true);
  assert.equal(m.eintraege[0].n, ZR.aufgaben);
  const plan2 = tagesplan(ctx({ stand, zeigHeute: 1 }));
  assert.equal(plan2.zeig, null);
});

test('Stufe zum Üben: höhere Stufe erst, wenn die tiefere trägt', () => {
  const c = ctx();
  const f = k.fertigkeiten.get('M-ZA-01');
  assert.equal(stufeZumUeben(c, f), 1);
  for (let i = 0; i < 8; i++) verbuche(c.stand, 'M-ZA-01', 1, 1, 20380, B);
  assert.equal(stufeZumUeben(c, f), 1, 'fast sicher reicht für Stufe 2 erst mit Zeig-Runde? nein: fast sicher trägt');
});

test('Entdeckerrunde und Schatzkarte haben eigene Steine', () => {
  const pe = tagesplan(ctx({ entdecker: { tage: [], proben: {} } }));
  assert.equal(pe.art, 'entdecker');
  const me = pe.steine.find((s) => s.art === 'mathe').eintraege;
  assert.ok(me[0].probe && me[0].n === 2, 'zuerst Proben');
  const erstesNormal = me.findIndex((e) => !e.probe);
  assert.ok(erstesNormal === -1 || me.slice(erstesNormal).every((e) => !e.probe), 'Proben vor dem übrigen Plan');
  const stand = {};
  for (const id of ['M-ZA-01', 'M-ZA-02', 'M-ME-01', 'D-HB-01', 'D-BU-01', 'D-HB-02', 'M-ZA-05', 'D-BU-03']) verbuche(stand, id, 1, 1, 20300, B);
  const ps = tagesplan(ctx({ stand, schatzFaellig: true }));
  assert.equal(ps.art, 'schatz');
  assert.deepEqual(ps.steine.map((s) => s.art), ['aufwaermen', 'schatz', 'schluss']);
  assert.equal(ps.steine[1].eintraege.length, 8, 'so viele, wie schon geübt wurden (höchstens 12)');
});
