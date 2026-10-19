// Angaben der Schule (Elternbrief zum 2. Quintal 2026) in lehrmittel.json und ziele.json: Kapitel, Deutsch-Themen, freie Tage
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { abschnittAm, kapitelAm, kapitelNachDatum, deutschJetzt, deutschBegonnen } from '../../site/js/core/schule.js';
import { schonDran, reihenfolgeD, aktuelleListe } from '../../site/js/core/plan.js';
import { kalender } from '../../site/js/core/kalender.js';
import { tagNr } from '../../site/js/core/util.js';

const lies = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const LM = lies('site/data/lehrmittel.json');
const Z = lies('site/data/ziele.json');
const P = lies('site/data/parameter.json');
const D = lies('site/data/katalog/deutsch.json'), M = lies('site/data/katalog/mathe.json');
const k = { D, M, fertigkeiten: new Map([...D.fertigkeiten, ...M.fertigkeiten].map((f) => [f.id, f])) };
const kap = LM.faecher.M.kapitel;
const name = (t) => kap[kapitelAm(LM, tagNr(t))].name;
const Q = LM.schule.abschnitte.find((a) => a.id === '2026-q2');

test('2. Quintal: Zeitraum und Inhalt wie im Elternbrief', () => {
  assert.equal(Q.von, '2026-10-19');
  assert.equal(Q.bis, '2026-12-18');
  assert.equal(abschnittAm(LM, tagNr('2026-10-16')), null, 'Herbstferien gehören nicht dazu');
  assert.equal(abschnittAm(LM, tagNr('2026-10-19')).id, '2026-q2');
  assert.equal(abschnittAm(LM, tagNr('2026-12-18')).id, '2026-q2');
  assert.equal(abschnittAm(LM, tagNr('2026-12-21')), null);
  assert.deepEqual(Q.M.kapitel, ['Ordnen', 'Zerlegen', 'Verdoppeln', 'Grundformen', 'Plusrechnen', 'Minusrechnen', 'Zahlenmauern']);
});

test('Mathematik: Kapitel des Briefs der Reihe nach über den Abschnitt verteilt, danach kein Rückfall', () => {
  assert.equal(name('2026-10-19'), 'Ordnen');
  assert.equal(name('2026-12-18'), 'Zahlenmauern');
  // Reihenfolge nie rückwärts, alle Kapitel kommen vor
  const gesehen = [];
  for (let t = tagNr(Q.von); t <= tagNr(Q.bis); t++) { const i = kapitelAm(LM, t); if (gesehen.at(-1) !== i) gesehen.push(i); }
  assert.deepEqual(gesehen.map((i) => kap[i].name), Q.M.kapitel);
  // Weihnachtsferien: die Schätzung nach Datum ergäbe «Minusrechnen»; das letzte Kapitel des Briefs bleibt
  assert.ok(kapitelNachDatum(kap, tagNr('2026-12-21')) < kap.findIndex((x) => x.name === 'Zahlenmauern'));
  assert.equal(name('2026-12-21'), 'Zahlenmauern');
  // Januar: wieder nach Jahresplanung, weiter vorne
  assert.ok(kapitelAm(LM, tagNr('2027-01-20')) > kap.findIndex((x) => x.name === 'Zahlenmauern'));
  // Vor dem Brief: Schätzung aus dem Datum wie bisher
  assert.equal(kapitelAm(LM, tagNr('2026-09-10')), kapitelNachDatum(kap, tagNr('2026-09-10')));
});

test('Mathematik: am 19.10. gelten Punktefeld und Rechengeschichten als schon dran, Zerlegen noch nicht', () => {
  const c = { lm: LM, heute: tagNr('2026-10-19'), mKapitel: kapitelAm(LM, tagNr('2026-10-19')), dAnteil: 0.18 };
  const dran = new Set(schonDran(c, 'M'));
  for (const id of ['M-ZE-03', 'M-RE-12', 'M-RE-01', 'M-RE-02', 'M-ZA-06', 'M-ME-06']) assert.ok(dran.has(id), id);
  assert.ok(!dran.has('M-ZE-02') && !dran.has('M-RE-13'));
});

test('Deutsch: Themen des Briefs zuerst und ab Beginn «schon dran»; nach dem Abschnitt bleiben sie dran', () => {
  const t = tagNr('2026-10-19');
  const c = { lm: LM, heute: t, dAnteil: 0.18, mKapitel: 9 };
  assert.deepEqual(reihenfolgeD(c).slice(0, Q.D.fertigkeiten.length), Q.D.fertigkeiten);
  const dran = schonDran(c, 'D');
  assert.deepEqual(dran.slice(0, Q.D.fertigkeiten.length), Q.D.fertigkeiten);
  // Was nach der Schätzung aus dem Schuljahr schon dran war, bleibt dran (z. B. Oberbegriffe)
  assert.ok(dran.includes('D-WS-01'));
  for (const id of ['D-WS-07', 'D-WS-10', 'D-BU-04', 'D-SC-02']) assert.ok(dran.includes(id), id);
  const nach = { lm: LM, heute: tagNr('2027-01-11'), dAnteil: 0.4, mKapitel: 16 };
  assert.deepEqual(deutschJetzt(LM, nach.heute), []);
  for (const id of Q.D.fertigkeiten) assert.ok(schonDran(nach, 'D').includes(id), id);
  assert.deepEqual(deutschBegonnen(LM, tagNr('2026-10-18')), []);
  // Ohne Tag (ältere Aufrufer) wie bisher
  assert.ok(!reihenfolgeD({ lm: LM, dAnteil: 0.18 }).slice(0, 3).includes('D-WS-07'));
});

test('Deutsch: aktueller Stoff kommt aus dem Brief, in seiner Reihenfolge', () => {
  const t = tagNr('2026-10-19');
  const c = { lm: LM, heute: t, dAnteil: 0.18, mKapitel: 9, k, P, stand: {}, spielbar: () => true };
  const akt = aktuelleListe(c, 'D');
  assert.equal(akt.length, P.plan.quoten.aktuell);
  akt.forEach((id) => assert.ok(Q.D.fertigkeiten.includes(id), id));
  assert.equal(akt[0], Q.D.fertigkeiten[0]);
});

test('Kalender: 9.11.2026 ist schulfrei (Weiterbildung), der Tag davor und danach nicht', () => {
  const K = kalender(Z);
  assert.ok(K.feiertagAm(tagNr('2026-11-09')));
  assert.equal(K.lerntag(tagNr('2026-11-09'), [1, 2, 3, 4, 5]), false);
  assert.equal(K.lerntag(tagNr('2026-11-10'), [1, 2, 3, 4, 5]), true);
  assert.equal(K.lerntag(tagNr('2026-11-06'), [1, 2, 3, 4, 5]), true);
});
