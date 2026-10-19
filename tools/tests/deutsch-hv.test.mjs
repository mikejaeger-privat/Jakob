// Deutsch HV (Hörverstehen): jede Stufe mit 300 Startwerten. Die Lösung wird auf einem zweiten Weg nachgeprüft:
// Anweisungen aus dem Auftrag (genannte Dinge, Reihenfolge, Lagewort) und den Koordinaten der Szene,
// Geschichten aus den Sätzen (die richtige Antwort kommt in der Geschichte vor, die Frage wird gestellt).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatoren } from '../../site/js/deutsch/hv.js';
import { fertigeAufgabe } from '../../site/js/deutsch/index.js';
import { pruefe, richtigeEingabe } from '../../site/js/core/pruefen.js';
import { K, W, INHALTE, kontext, FREI_STANDARD } from '../deutsch-kontext.mjs';

const F = Object.fromEntries(K.fertigkeiten.map((f) => [f.id, f]));
const nachBild = new Map(W.woerter.map((w) => [w.bild, w]));
const nachWort = new Map(W.woerter.map((w) => [w.wort, w]));
const verw = new Set(W.verwechselbar.flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]));
const ctx = kontext({ freigabe: FREI_STANDARD });
function alle(id, stufe, n = 300) {
  const aus = [];
  for (let seed = 1; seed <= n; seed++) {
    const a = fertigeAufgabe(generatoren[id][stufe], F[id], String(stufe), seed * 104729 + 17, ctx);
    if (a) aus.push(a);
  }
  return aus;
}
const genug = (liste, n = 250) => assert.ok(liste.length >= n, `nur ${liste.length} Aufgaben`);
const AKK = { der: 'den', die: 'die', das: 'das' };
const DAT = { der: 'dem', die: 'der', das: 'dem' };
const ANW = new Map(INHALTE.anweisungen.map((a) => [a.id, a]));

function szeneOk(a) {
  const el = a.szene.elemente;
  assert.equal(a.szene.art, 'frei');
  assert.equal(new Set(el.map((e) => e.id)).size, el.length, 'doppelte Element-ID');
  for (const e of el) {
    assert.ok(e.x >= 0 && e.x <= 1 && e.y >= 0 && e.y <= 1, `${e.id} ausserhalb`);
    const w = nachWort.get(e.name);
    assert.ok(w && w.bild === e.bild, `${e.name}: Bild nicht aus dem Lexikon`);
    if (!e.deko) assert.ok(!w.nameUnsicher, `${e.name}: Name unsicher`);
  }
  // keine verwechselbaren Bilder in einer Szene
  for (const x of el) for (const y of el) if (x !== y) assert.ok(!verw.has(`${x.name}|${y.name}`) && nachWort.get(x.name).art !== y.name, `${x.name}/${y.name}`);
  // antippbare Dinge überlappen sich nicht
  const tipp = el.filter((e) => !e.deko);
  for (const x of tipp) for (const y of tipp) if (x !== y) assert.ok(Math.hypot(x.x - y.x, x.y - y.y) > 0.12, `${x.id} und ${y.id} zu nah`);
}

test('D-HV-01 Stufe 1: der Auftrag nennt genau das richtige Ding (mit Artikel im Akkusativ)', () => {
  const liste = alle('D-HV-01', 1); genug(liste);
  for (const a of liste) {
    szeneOk(a);
    assert.ok(pruefe(a, richtigeEingabe(a)).ok);
    assert.equal(a.loesung.length, 1);
    const genannt = a.szene.elemente.filter((e) => a.auftrag.includes(`${AKK[nachWort.get(e.name).artikel]} ${e.name}.`));
    assert.deepEqual(genannt.map((e) => e.id), a.loesung);
    for (const e of a.szene.elemente) if (e.id !== a.loesung[0]) assert.ok(!pruefe(a, [e.id]).ok);
  }
});

test('D-HV-01 Stufe 2: zwei Dinge in der genannten Reihenfolge; umgekehrt wird nicht angenommen', () => {
  const liste = alle('D-HV-01', 2); genug(liste);
  for (const a of liste) {
    szeneOk(a);
    assert.equal(a.loesung.length, 2);
    const stelle = (id) => { const e = a.szene.elemente.find((x) => x.id === id); return a.auftrag.indexOf(`${AKK[nachWort.get(e.name).artikel]} ${e.name}`); };
    const [p1, p2] = a.loesung.map(stelle);
    assert.ok(p1 >= 0 && p2 > p1, a.auftrag);
    assert.ok(a.auftrag.includes('zuerst'));
    assert.ok(pruefe(a, richtigeEingabe(a)).ok);
    assert.ok(!pruefe(a, a.loesung.slice().reverse()).ok);
    // Plätze nur getauscht: dieselben Positionen wie in den Inhalten
    const roh = ANW.get(a.daten.id);
    const pos = (l) => l.map((e) => `${e.x},${e.y}`).sort().join(';');
    assert.equal(pos(a.szene.elemente), pos(roh.szene.elemente));
  }
});

// Lage aus den Koordinaten: auf = darüber, unter = darunter, neben = seitlich, in = mitten im festen Ding
function lageAus(p, deko) {
  const dx = p.x - deko.x, dy = p.y - deko.y;
  if (Math.abs(dx) < 0.08 && Math.abs(dy) < 0.08) return 'in';
  if (Math.abs(dx) >= 0.15 && Math.abs(dy) < 0.1) return 'neben';
  if (Math.abs(dx) < 0.08 && dy <= -0.15) return 'auf';
  if (Math.abs(dx) < 0.08 && dy >= 0.15) return 'unter';
  return null;
}
test('D-HV-01 Stufe 3: Lagewort im Auftrag passt zu den Koordinaten (Orte und Tiere); Spiegeln ändert nichts', () => {
  const liste = alle('D-HV-01', 3); genug(liste);
  let gespiegelt = 0;
  for (const a of liste) {
    szeneOk(a);
    assert.ok(pruefe(a, richtigeEingabe(a)).ok);
    const deko = a.szene.elemente.find((e) => e.deko);
    assert.ok(deko, 'festes Ding fehlt');
    const dekoW = nachWort.get(deko.name);
    if (a.ziehen) {
      // jeder Ort liegt dort, wo sein Name sagt
      for (const o of a.szene.orte) assert.equal(lageAus(o, deko), o.id, `${a.daten.id} Ort ${o.id}`);
      const [z] = a.ziehen;
      const ding = a.szene.elemente.find((e) => e.id === z.element);
      const art = nachWort.get(ding.name).artikel;
      const ziel = z.ort === 'in' ? (dekoW.artikel === 'die' ? `in die ${deko.name}` : dekoW.artikel === 'das' ? `ins ${deko.name}` : `in den ${deko.name}`) : `${z.ort} ${AKK[dekoW.artikel]} ${deko.name}`;
      assert.ok(a.auftrag.includes(`${AKK[art]} ${ding.name} ${ziel}.`), a.auftrag);
      // ein anderer Ort wird nicht angenommen
      for (const o of a.szene.orte) if (o.id !== z.ort) assert.ok(!pruefe(a, { [z.element]: o.id }).ok);
      // die Orte überlappen sich nicht
      const orte = a.szene.orte;
      for (const p of orte) for (const q of orte) if (p !== q) assert.ok(Math.abs(p.x - q.x) * 2 >= p.w + q.w - 1e-9 || Math.abs(p.y - q.y) * 2 >= p.h + q.h - 1e-9, `${p.id}/${q.id}`);
    } else {
      const m = a.auftrag.match(/^Tippe auf das Tier (auf|unter|neben) (dem|der) (\S+)\.$/);
      assert.ok(m, a.auftrag);
      assert.equal(m[3], deko.name);
      assert.equal(m[2], DAT[dekoW.artikel]);
      const tiere = a.szene.elemente.filter((e) => !e.deko);
      const passend = tiere.filter((e) => lageAus(e, deko) === m[1]);
      assert.deepEqual(passend.map((e) => e.id), a.loesung, a.auftrag);
      assert.equal(new Set(tiere.map((e) => lageAus(e, deko))).size, tiere.length, 'je Lage nur ein Tier');
    }
    if (a.sig.endsWith('_s')) gespiegelt++;
  }
  assert.ok(gespiegelt > 50 && gespiegelt < 250, `${gespiegelt} gespiegelt`);
});

const norm = (t) => t.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u');
for (const s of [1, 2, 3]) {
  test(`D-HV-02 Stufe ${s}: Sätze und Frage werden gesprochen, die richtige Antwort steht in der Geschichte`, () => {
    const liste = alle('D-HV-02', s); genug(liste);
    for (const a of liste) {
      assert.ok(pruefe(a, richtigeEingabe(a)).ok);
      a.optionen.forEach((_, i) => assert.equal(pruefe(a, i).ok, i === a.richtig));
      const g = INHALTE.geschichten.find((x) => x.id === a.daten.id);
      assert.equal(g.stufen['D-HV-02'], s);
      const [mi, ma] = s === 1 ? [2, 2] : s === 2 ? [3, 4] : [4, 5];
      assert.ok(g.saetze.length >= mi && g.saetze.length <= ma, `${g.id}: ${g.saetze.length} Sätze`);
      for (const satz of g.saetze) assert.ok(a.sprich.includes(satz));
      assert.ok(a.sprich.endsWith(g.frage));
      assert.deepEqual(a.optionen[a.richtig], g.optionen[g.richtig]);
      const text = norm(g.saetze.join(' '));
      const o = a.optionen[a.richtig];
      if (o.wort) {
        assert.ok(text.includes(norm(o.wort).slice(0, 3)), `${g.id}: ${o.wort} kommt nicht vor`);
        assert.equal(nachBild.get(o.bild)?.wort, o.wort);
      } else {
        assert.ok(text.includes(o.szene.lage), `${g.id}: Lage ${o.szene.lage}`);
        assert.ok(text.includes(norm(nachBild.get(o.szene.bezug).wort)), `${g.id}: Bezug`);
      }
      if (s === 1) assert.ok(g.frage.startsWith('Wer '));
      if (s === 2) assert.ok(/^(Was|Wo|Wohin|Womit) /.test(g.frage), g.frage);
      if (s === 3) assert.ok(/^(Warum|Wofür|Was|Welche) /.test(g.frage) && /zuerst|zuletzt|Schluss|nach dem|darum|warum|wofür/i.test(g.frage + ' ' + g.saetze.join(' ')), g.frage);
      // Bilder ohne verwechselbare Paare
      const ws = a.optionen.filter((x) => x.wort).map((x) => x.wort);
      for (const x of ws) for (const y of ws) if (x !== y) assert.ok(!verw.has(`${x}|${y}`), `${x}/${y}`);
    }
  });
}
