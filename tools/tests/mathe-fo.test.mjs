// Mathematik FO (Form und Raum): jede Stufe mit 300 Startwerten, Lösung auf einem zweiten Weg nachgeprüft
// (Formen zählen, Musterperiode suchen, Lage aus den Koordinaten, Spiegelbild berechnen, Weg im Gitter nachlaufen).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generatoren } from '../../site/js/math/fo.js';
import { fertigeAufgabe } from '../../site/js/math/index.js';
import { pruefe, richtigeEingabe } from '../../site/js/core/pruefen.js';

const katalog = JSON.parse(fs.readFileSync(new URL('../../site/data/katalog/mathe.json', import.meta.url), 'utf8'));
const P = JSON.parse(fs.readFileSync(new URL('../../site/data/parameter.json', import.meta.url), 'utf8'));
const F = Object.fromEntries(katalog.fertigkeiten.map((f) => [f.id, f]));
const ctx = { grenze: 100, begriffe: P.begriffe, stimme: true };
function* aufgaben(id, stufe, n = 300) {
  for (let seed = 1; seed <= n; seed++) {
    const a = fertigeAufgabe(generatoren[id][stufe], F[id], stufe, seed * 31 + 7, ctx);
    assert.ok(a, `${id}/${stufe}: keine Aufgabe bei Seed ${seed}`);
    yield a;
  }
}
const formVon = (o) => o.visual.liste[0].form;
const VIERECK = ['quadrat', 'rechteck'];

test('M-FO-01: Formen erkennen und zählen (Regel 8: Quadrat ist auch Viereck)', () => {
  for (const a of aufgaben('M-FO-01', 1)) {
    const formen = a.optionen.map(formVon);
    assert.equal(formen.filter((f) => f === 'kreis').length, 1);
    assert.equal(formen.filter((f) => f === 'dreieck').length, 1);
    assert.equal(formen.filter((f) => VIERECK.includes(f)).length, 1, 'genau ein Viereck');
    const ziel = formVon(a.optionen[a.richtig]);
    if (/Viereck/.test(a.frage)) assert.ok(VIERECK.includes(ziel)); else assert.ok(a.frage.includes(ziel === 'kreis' ? 'Kreis' : 'Dreieck'));
  }
  for (const a of aufgaben('M-FO-01', 2)) {
    assert.match(a.frage, /Quadrat/);
    assert.doesNotMatch(a.frage, /Rechteck|Viereck/);
    const formen = a.optionen.map(formVon);
    assert.equal(formen.filter((f) => f === 'quadrat').length, 1);
    assert.equal(formVon(a.optionen[a.richtig]), 'quadrat');
  }
  for (const a of aufgaben('M-FO-01', 3)) {
    assert.doesNotMatch(a.frage, /Rechteck|Viereck/);
    const gefragt = { Kreise: 'kreis', Dreiecke: 'dreieck', Quadrate: 'quadrat' }[a.frage.match(/Wie viele (\S+)/)[1]];
    const L = a.visual.liste;
    assert.equal(a.loesung[0], L.filter((f) => f.form === gefragt).length);
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) assert.ok(Math.hypot(L[i].x - L[j].x, L[i].y - L[j].y) > 0.25, 'Formen überlappen nicht');
    for (const f of L) assert.ok(f.x > 0 && f.x < 1 && f.y > 0 && f.y < 1);
  }
});

test('M-FO-02: Körper (Würfel und Quader nie zusammen, wenn es auf den Unterschied ankommt)', () => {
  for (const s of [1, 2]) for (const a of aufgaben('M-FO-02', s)) {
    const ziel = a.optionen[a.richtig].visual.form;
    const formen = a.optionen.map((o) => o.visual.form);
    assert.equal(new Set(formen).size, formen.length);
    if (/Quader/.test(a.frage)) { assert.equal(ziel, 'quader'); assert.ok(!formen.includes('wuerfel')); }
    if (/Kugel|rollen/.test(a.frage)) assert.equal(ziel, 'kugel');
    if (/Würfel|Ecken/.test(a.frage)) assert.equal(ziel, 'wuerfel');
    if (/Zylinder/.test(a.frage)) assert.equal(ziel, 'zylinder');
  }
  const FORM = { '⚽': 'kugel', '🏀': 'kugel', '🍊': 'kugel', '🥫': 'zylinder', '🕯️': 'zylinder', '🧻': 'zylinder', '🎲': 'wuerfel', '🧊': 'wuerfel', '🧱': 'quader', '📦': 'quader' };
  for (const a of aufgaben('M-FO-02', 3)) {
    const formen = a.paare.map((p) => p[1].visual.form);
    assert.equal(new Set(formen).size, 3);
    assert.ok(!(formen.includes('wuerfel') && formen.includes('quader')));
    for (const [d, k] of a.paare) assert.equal(FORM[d.bild], k.visual.form);
  }
});

test('M-FO-03: Muster eindeutig (mindestens zwei volle Wiederholungen), Fortsetzung stimmt', () => {
  const k = (x) => JSON.stringify(x);
  for (const s of [1, 2]) for (const a of aufgaben('M-FO-03', s)) {
    assert.equal(a.folge[a.folge.length - 1], '?');
    const f = a.folge.slice(0, -1).map(k);
    let p = 1;
    while (!f.every((x, i) => i < p || x === f[i - p])) p++;
    assert.ok(f.length >= 2 * p, 'zwei volle Wiederholungen sichtbar');
    assert.equal(k(a.optionen[a.richtig]), f[f.length - p]);
    if (s === 2) assert.equal(p, 3, 'drei Teile');
    if (s === 1) assert.ok(a.optionen.every((o) => o.form === 'kreis'));
  }
  for (const a of aufgaben('M-FO-03', 3)) {
    const z = a.folge.slice(0, -1);
    const d = z[1] - z[0];
    assert.ok([1, 2, -1, -2].includes(d));
    for (let i = 1; i < z.length; i++) assert.equal(z[i] - z[i - 1], d);
    assert.equal(a.optionen[a.richtig], z[z.length - 1] + d);
    for (const o of [...a.optionen, ...z]) assert.ok(o >= 0 && o <= 20);
  }
});

test('M-FO-04: Lage aus den Koordinaten nachgerechnet, genau ein Tier passt', () => {
  for (const s of [1, 2, 3]) for (const a of aufgaben('M-FO-04', s)) {
    const el = a.szene.elemente;
    const tiere = el.filter((e) => !e.deko);
    const bezug = el.find((e) => e.deko);
    const t = a.auftrag;
    let treffer;
    if (/oben auf/.test(t)) treffer = tiere.filter((e) => e.y < bezug.y - 0.15 && Math.abs(e.x - bezug.x) < 0.05);
    else if (/unter/.test(t)) treffer = tiere.filter((e) => e.y > bezug.y + 0.15 && Math.abs(e.x - bezug.x) < 0.05);
    else if (/neben/.test(t)) treffer = tiere.filter((e) => Math.abs(e.y - bezug.y) < 0.05 && Math.abs(e.x - bezug.x) > 0.2);
    else if (/links vom|rechts vom/.test(t)) {
      const links = /links/.test(t);
      treffer = tiere.filter((e) => Math.abs(e.y - bezug.y) < 0.1 && (links ? e.x < bezug.x - 0.2 : e.x > bezug.x + 0.2));
    } else if (/ganz links|ganz rechts/.test(t)) {
      const xs = tiere.map((e) => e.x);
      const ziel = /links/.test(t) ? Math.min(...xs) : Math.max(...xs);
      treffer = tiere.filter((e) => e.x === ziel);
    } else if (/zwischen/.test(t)) {
      const namen = [...t.matchAll(/(?:dem|der) (\S+?)[ .]/g)].map((m) => m[1]);
      const [n1, n2] = namen.map((n) => tiere.find((e) => e.name === n));
      treffer = tiere.filter((e) => e.x > Math.min(n1.x, n2.x) && e.x < Math.max(n1.x, n2.x));
      assert.ok(Math.abs(n1.x - n2.x) < 0.5, 'die beiden Nachbarn sind direkte Nachbarn');
    } else if (/vor dem|vor der/.test(t)) {
      treffer = tiere.filter((e) => e.z > bezug.z);
    } else if (/hinter/.test(t)) {
      treffer = tiere.filter((e) => e.z < bezug.z);
    } else assert.fail('Auftrag unbekannt: ' + t);
    assert.equal(treffer.length, 1, `${t}: ${treffer.length} Treffer`);
    assert.deepEqual(a.loesung, [treffer[0].id]);
    assert.ok(pruefe(a, richtigeEingabe(a)).ok);
    assert.equal(new Set(tiere.map((e) => e.bild)).size, tiere.length, 'Tiere verschieden');
  }
});

// Spiegel: zweiter Weg über eine eigene Spiegelfunktion
const spiegle = (v, [x, y]) => [2 * v.achse - 1 - x, y];
const menge = (zellen) => new Set(zellen.map((c) => c.join(',')));
const gleich = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
function symmetrisch(v) {
  const m = menge(v.figur);
  return gleich(m, menge(v.figur.map((c) => spiegle(v, c))));
}

test('M-FO-05: Spiegelbilder berechnet', () => {
  for (const a of aufgaben('M-FO-05', 1)) {
    a.optionen.forEach((o, i) => assert.equal(symmetrisch(o.visual), i === a.richtig, 'nur die richtige Option ist gespiegelt'));
    const links = a.optionen.map((o) => o.visual.figur.filter((c) => c[0] < o.visual.achse).map((c) => c.join(',')).sort().join(' '));
    assert.equal(new Set(links).size, 1, 'linke Seite überall gleich');
  }
  for (const a of aufgaben('M-FO-05', 2)) {
    const v = a.visual;
    assert.ok(v.figur.every((c) => c[0] < v.achse && c[0] >= 0 && c[1] >= 0 && c[1] < v.h));
    assert.ok(gleich(menge(a.loesung.map((s) => s.split(',').map(Number))), menge(v.figur.map((c) => spiegle(v, c)))));
    assert.ok(a.loesung.every((s) => { const [x] = s.split(',').map(Number); return x >= v.achse && x < v.b; }));
  }
  for (const a of aufgaben('M-FO-05', 3)) {
    a.optionen.forEach((o, i) => assert.equal(symmetrisch(o.visual), i === a.richtig));
  }
});

// Gitter: y nach unten, 'oben' heisst y − 1
const SCHRITT = { rechts: [1, 0], links: [-1, 0], oben: [0, -1], unten: [0, 1] };
function laufe(start, pfeile, v) {
  let [x, y] = start;
  for (const p of pfeile) {
    x += SCHRITT[p][0]; y += SCHRITT[p][1];
    if (x < 0 || y < 0 || x >= v.b || y >= v.h) return null;
    if ((v.hindernisse || []).some((d) => d[0] === x && d[1] === y)) return null;
  }
  return [x, y];
}
function bfs(v, start, ziel) {
  const d = new Map([[start.join(','), 0]]);
  const q = [start];
  while (q.length) {
    const c = q.shift();
    for (const [dx, dy] of Object.values(SCHRITT)) {
      const n = [c[0] + dx, c[1] + dy];
      if (n[0] < 0 || n[1] < 0 || n[0] >= v.b || n[1] >= v.h || (v.hindernisse || []).some((h) => h[0] === n[0] && h[1] === n[1]) || d.has(n.join(','))) continue;
      d.set(n.join(','), d.get(c.join(',')) + 1); q.push(n);
    }
  }
  return d.get(ziel.join(','));
}

test('M-FO-06: Weg im Gitter nachgelaufen', () => {
  for (const a of aufgaben('M-FO-06', 1)) {
    const v = a.visual;
    const ende = laufe(v.start, v.pfeile, v);
    assert.ok(ende, 'Weg bleibt im Gitter');
    const ziel = v.ziele.find((z) => z.x === ende[0] && z.y === ende[1]);
    assert.ok(ziel, 'am Ende liegt ein Ziel');
    assert.equal(a.optionen[a.richtig].bild, ziel.bild);
    assert.equal(new Set(v.ziele.map((z) => z.x + ',' + z.y)).size, v.ziele.length);
  }
  for (const s of [2, 3]) for (const a of aufgaben('M-FO-06', s)) {
    const v = a.visual;
    const z = [v.ziele[0].x, v.ziele[0].y];
    const kurz = bfs(v, v.start, z);
    for (const w of [a.loesung, ...(a.alternativen || [])]) {
      const ende = laufe(v.start, w.map((k) => k.replace('pfeil:', '')), v);
      assert.deepEqual(ende, z, 'Weg führt zum Ziel, ohne Steine und im Gitter');
      assert.equal(w.length, kurz, 'kürzester Weg');
      const vorrat = a.kacheln.slice();
      for (const k of w) { const i = vorrat.indexOf(k); assert.ok(i >= 0, 'aus den Kacheln legbar'); vorrat.splice(i, 1); }
    }
    assert.equal(a.felder, kurz);
    if (s === 3) {
      assert.ok(v.hindernisse.length >= 2);
      const dx = z[0] - v.start[0], dy = z[1] - v.start[1];
      const h = Array(Math.abs(dx)).fill(dx > 0 ? 'rechts' : 'links'), w = Array(Math.abs(dy)).fill(dy > 0 ? 'unten' : 'oben');
      assert.equal(laufe(v.start, [...h, ...w], v), null, 'einfacher Weg versperrt');
      assert.equal(laufe(v.start, [...w, ...h], v), null, 'einfacher Weg versperrt');
    }
  }
});
