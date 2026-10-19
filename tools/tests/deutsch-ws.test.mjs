// Deutsch WS (Wortschatz): jede Stufe mit 300 Startwerten. Die Lösung wird auf einem zweiten Weg nachgeprüft:
// aus dem Lexikon (Oberbegriff, Mehrzahl, Reim, Artikel), aus den festen Inhalten (Gegenteile, Bildergeschichten)
// oder aus eigenen Tabellen (Farben der Dinge, Wochentage, Zahlwörter). Dazu: sichtbare Buchstaben sind eingeführt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatoren } from '../../site/js/deutsch/ws.js';
import { fertigeAufgabe } from '../../site/js/deutsch/index.js';
import { pruefe, richtigeEingabe, passt } from '../../site/js/core/pruefen.js';
import { reimteil, zerlege } from '../../site/js/deutsch/lib.js';
import { K, W, INHALTE, kontext, FREI_STANDARD, FREI_KLEIN } from '../deutsch-kontext.mjs';

const F = Object.fromEntries(K.fertigkeiten.map((f) => [f.id, f]));
const nachBild = new Map(W.woerter.map((w) => [w.bild, w]));
const nachWort = new Map(W.woerter.map((w) => [w.wort, w]));
const sicht = new Set(W.sichtwoerter.map((s) => s.wort.toLowerCase()));
const ctxStd = kontext({ freigabe: FREI_STANDARD });
const ctxKlein = kontext({ freigabe: FREI_KLEIN });
function alle(id, stufe, ctx = ctxStd, n = 300) {
  const aus = [];
  for (let seed = 1; seed <= n; seed++) {
    const a = fertigeAufgabe(generatoren[id][stufe], F[id], String(stufe), seed * 104729 + 17, ctx);
    if (a) aus.push(a);
  }
  return aus;
}
const genug = (liste, n = 250) => assert.ok(liste.length >= n, `nur ${liste.length} Aufgaben`);
const wortVon = (o) => { const w = nachBild.get(o.bild); assert.ok(w, `Bild ${o.bild} nicht im Lexikon`); return w; };
function nurRichtig(a) {
  assert.ok(pruefe(a, richtigeEingabe(a)).ok);
  a.optionen.forEach((_, i) => assert.equal(pruefe(a, i).ok, i === a.richtig, `Option ${i}`));
  assert.equal(new Set(a.optionen.map((o) => JSON.stringify(o))).size, a.optionen.length, 'doppelte Option');
}
function zuordnenEindeutig(a) {
  for (let i = 0; i < a.paare.length; i++) for (let j = 0; j < a.paare.length; j++) assert.equal(passt(a, i, j), i === j, `Paar ${i}/${j}`);
}
// Sichtbare Einheiten: Sichtwörter nur Einzelbuchstaben, sonst nach zerlege; alle in braucht und eingeführt
function brauchtStimmt(a, texte, frei = FREI_STANDARD) {
  for (const t of texte) for (const wort of t.split(/\s+/)) {
    const e = sicht.has(wort.toLowerCase()) ? [...wort.toLowerCase()] : zerlege(wort);
    for (const x of e) assert.ok(a.braucht.includes(x), `braucht fehlt ${x} (${t})`);
  }
  for (const b of a.braucht) assert.ok(frei.has(b), `nicht eingeführt: ${b}`);
}
const OBER9 = ['Tiere', 'Obst', 'Gemüse', 'Kleider', 'Fahrzeuge', 'Musik', 'Pflanzen', 'Körper', 'Werkzeug'];
const ueberschneidung = (a, b) => ['Obst', 'Gemüse', 'Pflanzen'].includes(a) && ['Obst', 'Gemüse', 'Pflanzen'].includes(b);

test('D-WS-01 Stufe 1: genau ein Bild gehört zum Oberbegriff (Lexikon), ohne unsichere und Konflikt-Wörter', () => {
  const liste = alle('D-WS-01', 1); genug(liste);
  for (const a of liste) {
    nurRichtig(a);
    assert.equal(a.optionen.length, 3);
    const ws = a.optionen.map(wortVon);
    const ober = a.daten.ober;
    assert.ok(OBER9.includes(ober));
    ws.forEach((w, i) => {
      assert.equal(w.ober === ober, i === a.richtig, `${w.wort} bei ${ober}`);
      assert.ok(!w.oberUnsicher && !(W.oberKonflikt[ober] || []).includes(w.wort), w.wort);
      if (i !== a.richtig) assert.ok(OBER9.includes(w.ober) && !ueberschneidung(ober, w.ober), `${w.wort}: ${w.ober} gegen ${ober}`);
    });
    assert.ok(!ws.some((w) => w.wort === 'Mikrofon' && a.richtig === ws.indexOf(w)));
  }
});

test('D-WS-01 Stufe 2: drei Bilder mit gleichem Oberbegriff, eines passt nicht', () => {
  const liste = alle('D-WS-01', 2); genug(liste);
  for (const a of liste) {
    nurRichtig(a);
    assert.equal(a.optionen.length, 4);
    const ws = a.optionen.map(wortVon);
    const fremd = ws[a.richtig];
    const rest = ws.filter((_, i) => i !== a.richtig);
    assert.ok(rest.every((w) => w.ober === rest[0].ober), rest.map((w) => w.wort).join());
    assert.notEqual(fremd.ober, rest[0].ober);
    assert.ok(!ueberschneidung(fremd.ober, rest[0].ober));
    assert.equal(fremd.wort, a.daten.fremd);
  }
});

test('D-WS-01 Stufe 3: Bild und Beispiel in der Kiste haben denselben Oberbegriff; nie Obst und Gemüse', () => {
  const liste = alle('D-WS-01', 3); genug(liste);
  for (const a of liste) {
    assert.equal(a.paare.length, 2);
    zuordnenEindeutig(a);
    const obers = a.paare.map(([bild, kiste]) => {
      assert.equal(kiste.szene.art, 'lage');
      const w = wortVon(bild), bsp = nachBild.get(kiste.szene.bild);
      assert.ok(bsp && bsp.ober === w.ober, `${w.wort} in Kiste mit ${bsp?.wort}`);
      return w.ober;
    });
    assert.notEqual(obers[0], obers[1]);
    assert.ok(!ueberschneidung(obers[0], obers[1]));
  }
});

const GT = new Map(INHALTE.gegenteile.map((g) => [g.id, g]));
const gtBild = (s) => JSON.stringify(s.szene ? { szene: s.szene } : { bild: s.bild });
test('D-WS-02 Stufe 1: jedes Paar ist ein Gegenteil-Paar aus den Inhalten, verschiedene Begriffe', () => {
  const liste = alle('D-WS-02', 1); genug(liste);
  for (const a of liste) {
    zuordnenEindeutig(a);
    const begriffe = new Set();
    for (const [x, y] of a.paare) {
      const g = INHALTE.gegenteile.find((e) => (e.a.wort === x.wort && e.b.wort === y.wort && gtBild(e.a) === JSON.stringify({ ...x, wort: undefined }) )
        || (e.b.wort === x.wort && e.a.wort === y.wort && gtBild(e.b) === JSON.stringify({ ...x, wort: undefined })));
      assert.ok(g, `kein Gegenteil: ${x.wort} – ${y.wort}`);
      begriffe.add(g.begriff);
    }
    assert.equal(begriffe.size, a.paare.length);
  }
});

for (const s of [2, 3]) {
  test(`D-WS-02 Stufe ${s}: das richtige Bild zeigt das Gegenteil (aus den Inhalten), das gehörte Bild ist Ablenker`, () => {
    const liste = alle('D-WS-02', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      const g = GT.get(a.daten.id);
      const [gehoert, loesung] = g.a.wort === a.daten.gehoert ? [g.a, g.b] : [g.b, g.a];
      assert.equal(loesung.wort, a.daten.loesung);
      assert.equal(JSON.stringify(a.optionen[a.richtig]), gtBild(loesung));
      assert.ok(a.optionen.some((o) => JSON.stringify(o) === gtBild(gehoert)));
      if (s === 3) assert.ok(a.sprich.includes(gehoert === g.a ? g.satz : g.satzB));
      else assert.ok(a.frage.includes(gehoert.wort));
    }
  });
}

for (const s of [1, 2, 3]) {
  test(`D-WS-03 Stufe ${s}: Einzahl ein Bild, Mehrzahl eine Menge desselben Bilds (Lexikon), klingt verschieden`, () => {
    const liste = alle('D-WS-03', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      const w = nachWort.get(a.daten.wort);
      assert.ok(w.mehrzahl && w.mehrzahl !== w.wort && !w.bildMehrere && !w.nameUnsicher);
      const o = a.optionen[a.richtig];
      const gesucht = a.daten.gesucht === 'mehrzahl' ? `die ${w.mehrzahl}` : `${w.artikel} ${w.wort}`;
      if (a.daten.gesucht === 'mehrzahl') assert.ok(o.szene?.art === 'menge' && o.szene.bild === w.bild && o.szene.anzahl >= 2);
      else assert.deepEqual(o, { bild: w.bild });
      if (s === 3) { assert.equal(a.zeige, gesucht); brauchtStimmt(a, [a.zeige]); }
      else assert.ok(a.sprich.includes(gesucht));
      if (s === 1) assert.equal(a.optionen.length, 2);
      if (s === 2) assert.equal(a.optionen.length, 4);
    }
  });
}

for (const [s, n] of [[1, 2], [2, 3], [3, 4]]) {
  test(`D-WS-04 Stufe ${s}: ${n} Paare reimen sich (Lexikon und Reimteil), Paare untereinander nicht`, () => {
    const liste = alle('D-WS-04', s); genug(liste);
    for (const a of liste) {
      assert.equal(a.paare.length, n);
      zuordnenEindeutig(a);
      const teile = a.paare.map(([x, y]) => {
        const wx = wortVon(x), wy = wortVon(y);
        assert.equal(wx.reim, wy.reim);
        assert.equal(reimteil(wx.wort), reimteil(wy.wort), `${wx.wort}/${wy.wort}`);
        return reimteil(wx.wort);
      });
      assert.equal(new Set(teile).size, n, teile.join());
    }
  });
}

for (const s of [1, 2, 3]) {
  test(`D-WS-05 Stufe ${s}: Reihenfolge der Bilder wie in der Bildergeschichte`, () => {
    const liste = alle('D-WS-05', s); genug(liste);
    for (const a of liste) {
      assert.ok(pruefe(a, richtigeEingabe(a)).ok);
      const g = INHALTE.bildergeschichten.find((b) => b.id === a.daten.id);
      assert.equal(g.stufen['D-WS-05'], s);
      assert.equal(a.teile.length, s === 1 ? 3 : 4);
      a.teile.forEach((t, i) => {
        assert.deepEqual(t.szene ?? t.bild, g.bilder[i]);
        if (s < 3) assert.equal(t.wort, g.sprich[i]); else assert.equal(t.wort, undefined);
      });
      if (s === 3) for (const satz of g.sprich) assert.ok(a.sprich.includes(satz));
      // falsche Reihenfolge wird nicht angenommen
      assert.ok(!pruefe(a, a.teile.map((_, i) => i).reverse()).ok);
    }
  });
}

const FARBE_VON = { Banane: 'gelb', Zitrone: 'gelb', Küken: 'gelb', Sonne: 'gelb', Mais: 'gelb', Erdbeere: 'rot', Tomate: 'rot', Kirsche: 'rot', Gurke: 'gruen', Frosch: 'gruen', Brokkoli: 'gruen', Klee: 'gruen', Kaktus: 'gruen', Tanne: 'gruen', Karotte: 'orange', Mandarine: 'orange', Kürbis: 'orange', Schwein: 'rosa', Flamingo: 'rosa', Schokolade: 'braun' };
for (const s of [1, 2, 3]) {
  test(`D-WS-06 Stufe ${s}: richtige Farbe, nie weiss, keine ähnlichen Farben nebeneinander`, () => {
    const liste = alle('D-WS-06', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      const farben = a.optionen.map((o) => o.szene.farbe);
      assert.ok(!farben.includes('weiss'));
      for (const [x, y] of [['rosa', 'violett'], ['rosa', 'rot'], ['orange', 'rot'], ['orange', 'gelb'], ['braun', 'schwarz'], ['blau', 'violett']]) assert.ok(!(farben.includes(x) && farben.includes(y)), farben.join());
      const richtig = farben[a.richtig];
      if (s === 1) assert.ok(a.sprich.includes(a.daten.farbe) && richtig === a.daten.farbe.replace('ü', 'ue'));
      if (s === 2) assert.equal(richtig, FARBE_VON[a.daten.wort], a.daten.wort);
      if (s === 3) { assert.equal(richtig, a.zeige.replace('ü', 'ue')); brauchtStimmt(a, [a.zeige]); }
    }
  });
}

const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
test('D-WS-07: Tag danach, gestern und morgen, Reihenfolge (Wochentage nachgerechnet)', () => {
  for (const a of alle('D-WS-07', 1)) {
    nurRichtig(a);
    const i = TAGE.indexOf(a.daten.tag);
    assert.equal(a.optionen[a.richtig].sprich, TAGE[(i + 1) % 7]);
    assert.ok(a.frage.includes(`nach dem ${a.daten.tag}`));
    assert.ok(!a.optionen.some((o) => o.sprich === a.daten.tag));
  }
  for (const a of alle('D-WS-07', 2)) {
    nurRichtig(a);
    const i = TAGE.indexOf(a.daten.heute);
    const soll = a.frage.includes('gestern') ? TAGE[(i + 6) % 7] : TAGE[(i + 1) % 7];
    assert.equal(a.optionen[a.richtig].sprich, soll);
    assert.ok(a.frage.startsWith(`Heute ist ${a.daten.heute}.`));
  }
  for (const a of alle('D-WS-07', 3)) {
    assert.ok(pruefe(a, richtigeEingabe(a)).ok);
    const idx = a.teile.map((t) => TAGE.indexOf(t.sprich));
    assert.ok(idx.every((x, k) => x >= 0 && (k === 0 || x > idx[k - 1])), idx.join());
    assert.equal(new Set(a.teile.map((t) => t.farbe)).size, 3);
  }
  // Farben verraten die Reihenfolge nicht: die erste Karte ist nicht immer gleich gefärbt
  assert.ok(new Set(alle('D-WS-07', 3).map((a) => a.teile[0].farbe)).size === 3);
});

const ZAHL = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
test('D-WS-08: Zahlwort und Menge bzw. Zahl stimmen überein; nur lesbare Zahlwörter', () => {
  for (const [s, bis] of [[1, 5], [2, 10]]) {
    const liste = alle('D-WS-08', s); genug(liste);
    for (const a of liste) {
      nurRichtig(a);
      const n = ZAHL.indexOf(a.zeige);
      assert.ok(n >= 1 && n <= bis);
      const v = a.optionen[a.richtig].visual;
      assert.equal(v.art === 'dinge' ? v.n : v.rot, n);
      brauchtStimmt(a, [a.zeige]);
    }
  }
  const liste = alle('D-WS-08', 3); genug(liste);
  for (const a of liste) {
    zuordnenEindeutig(a);
    for (const [t, z] of a.paare) assert.equal(ZAHL.indexOf(t.text), z.zahl);
    brauchtStimmt(a, a.paare.map(([t]) => t.text));
  }
});

test('D-WS-09: Artikel aus dem Lexikon, Nomen mit Begleiter, Grossschreibung', () => {
  for (const a of alle('D-WS-09', 1)) {
    nurRichtig(a);
    const w = nachWort.get(a.daten.wort);
    assert.equal(a.optionen[a.richtig].sprich, `${w.artikel} ${w.sprich || w.wort}`);
    assert.equal(a.bild, w.bild);
    assert.ok(!w.nameUnsicher);
  }
  for (const a of alle('D-WS-09', 2)) {
    nurRichtig(a);
    const w = nachWort.get(a.daten.wort);
    assert.equal(a.zeige, `${w.artikel} ${w.wort}`);
    assert.equal(a.optionen[a.richtig].bild, w.bild);
    brauchtStimmt(a, [a.zeige]);
  }
  for (const a of alle('D-WS-09', 3)) {
    nurRichtig(a);
    const richtig = a.optionen[a.richtig];
    assert.equal(richtig, a.daten.wort);
    assert.ok(/^[A-ZÄÖÜ]/.test(richtig));
    assert.ok(a.optionen.includes(richtig.toLowerCase()));
    brauchtStimmt(a, a.optionen);
  }
});

// Zweiter Weg: eigene Tabelle der Jahreszeit je Ding, Jahreszeiten- und Monatsfolge
const ZEIT = { Tulpe: 'Frühling', Sonne: 'Sommer', Blatt: 'Herbst', Kürbis: 'Herbst', Pilz: 'Herbst', Schneemann: 'Winter', Schlitten: 'Winter' };
const NIE_ABLENKER = ['Sonne', 'Pilz'];
const JZ = ['Frühling', 'Sommer', 'Herbst', 'Winter'];
const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
test('D-WS-10: Jahreszeit der Dinge, Beschreibung, davor und danach, Monatsfolge (nachgerechnet)', () => {
  const l1 = alle('D-WS-10', 1);
  assert.ok(new Set(l1.map((a) => a.sig)).size >= 15, 'Abwechslung Stufe 1');
  for (const a of l1) {
    nurRichtig(a);
    assert.equal(a.optionen.length, 3);
    assert.deepEqual(a.braucht, []);
    const ws = a.optionen.map(wortVon);
    const zeiten = ws.map((w) => ZEIT[w.wort]);
    zeiten.forEach((z, i) => assert.equal(z === a.daten.zeit, i === a.richtig, `${ws[i].wort} bei ${a.daten.zeit}`));
    // Ablenker aus zwei verschiedenen anderen Jahreszeiten; Sonne und Pilz nie, Tulpe nie beim Sommer
    const falsch = ws.filter((_, i) => i !== a.richtig);
    assert.notEqual(ZEIT[falsch[0].wort], ZEIT[falsch[1].wort]);
    for (const w of falsch) assert.ok(!NIE_ABLENKER.includes(w.wort) && !(w.wort === 'Tulpe' && a.daten.zeit === 'Sommer'), w.wort);
    assert.ok(a.frage.startsWith(`Was passt zum ${a.daten.zeit}?`));
  }
  const l2 = alle('D-WS-10', 2);
  assert.ok(new Set(l2.map((a) => a.sig)).size >= 20, 'Abwechslung Stufe 2');
  for (const a of l2) {
    nurRichtig(a);
    const loesung = a.optionen[a.richtig].sprich;
    assert.equal(new Set(a.optionen.map((o) => o.sprich)).size, 3);
    a.optionen.forEach((o) => assert.ok(JZ.includes(o.sprich)));
    if (a.daten.art === 'beschreibung') { assert.equal(loesung, a.daten.loesung); assert.ok(a.frage.startsWith(a.daten.text)); continue; }
    const i = JZ.indexOf(a.daten.zeit);
    assert.equal(loesung, JZ[(i + (a.daten.art === 'nach' ? 1 : 3)) % 4]);
    assert.ok(!a.optionen.some((o) => o.sprich === a.daten.zeit), 'gefragte Jahreszeit ist keine Karte');
    assert.ok(a.frage.includes(`${a.daten.art} dem ${a.daten.zeit}`));
  }
  assert.ok(l2.some((a) => a.daten.art === 'beschreibung') && l2.some((a) => a.daten.art === 'vor') && l2.some((a) => a.daten.art === 'nach'));
  const l3 = alle('D-WS-10', 3);
  assert.ok(new Set(l3.map((a) => a.sig)).size >= 100, 'Abwechslung Stufe 3');
  for (const a of l3) {
    nurRichtig(a);
    const i = MON.indexOf(a.daten.monat);
    assert.equal(a.optionen[a.richtig].sprich, MON[(i + 1) % 12]);
    const karten = a.optionen.map((o) => o.sprich);
    assert.ok(!karten.includes(a.daten.monat));
    assert.ok(!(karten.includes('Juni') && karten.includes('Juli')), 'Juni und Juli nie zusammen');
  }
});

test('Kleine Freigabe: keine Ausnahme, sichtbare Buchstaben eingeführt', () => {
  for (const id of Object.keys(generatoren)) for (const s of [1, 2, 3]) {
    for (const a of alle(id, s, ctxKlein, 60)) for (const b of a.braucht) assert.ok(FREI_KLEIN.has(b), `${id}/${s}: ${b}`);
  }
});
