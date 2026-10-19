// Erzeugt site/data/schrift/basisschrift.json: Nachspur-Vorlagen angelehnt an die unverbundene Deutschschweizer Basisschrift.
// Jedes Zeichen besteht aus Strichen in Schreibreihenfolge und -richtung (SVG-Pfad aus M, L, C) und daraus abgetasteten Punkten.
// Koordinaten: Höhe 100 = Oberlinie (0) bis Grundlinie (100), Mittellinie 50, Unterlänge bis 135.
// Aufruf: node tools/baue_schrift.mjs
import fs from 'node:fs';

// --- Bögen: elliptischer Bogen als kubische Bézier-Segmente ---
// Winkel in Grad, Bildschirmkoordinaten (0 = rechts, 90 = unten, −90 = oben).
// a1 < a0: gegen den Uhrzeigersinn (wie man o, a, c schreibt); a1 > a0: im Uhrzeigersinn (Bauch von b, p).
const f1 = (x) => Math.round(x * 10) / 10;
const rad = (a) => (a * Math.PI) / 180;
function bogen(cx, cy, rx, ry, a0, a1) {
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90));
  const d = (a1 - a0) / n;
  let s = '';
  for (let i = 0; i < n; i++) {
    const t0 = rad(a0 + i * d), t1 = rad(a0 + (i + 1) * d);
    const k = (4 / 3) * Math.tan((t1 - t0) / 4);
    const p0 = [cx + rx * Math.cos(t0), cy + ry * Math.sin(t0)];
    const p1 = [cx + rx * Math.cos(t1), cy + ry * Math.sin(t1)];
    const c0 = [p0[0] - k * rx * Math.sin(t0), p0[1] + k * ry * Math.cos(t0)];
    const c1 = [p1[0] + k * rx * Math.sin(t1), p1[1] - k * ry * Math.cos(t1)];
    s += ` C${f1(c0[0])} ${f1(c0[1])} ${f1(c1[0])} ${f1(c1[1])} ${f1(p1[0])} ${f1(p1[1])}`;
  }
  return s;
}
// Bogen als eigener Strich (beginnt mit M beim Winkel a0)
const kreis = (cx, cy, rx, ry, a0, a1) => `M${f1(cx + rx * Math.cos(rad(a0)))} ${f1(cy + ry * Math.sin(rad(a0)))}` + bogen(cx, cy, rx, ry, a0, a1);
// Umlautpunkte und i-Punkte als kurze Striche von oben nach unten
const punkt = (x, y) => `M${x} ${y} L${x} ${y + 5}`;

// Bausteine der Kleinbuchstaben (Mittellänge von 50 bis 100)
const BAUCH_A = kreis(22, 75, 20, 25, -40, -360);          // a, d, g, q: oben rechts beginnend gegen den Uhrzeigersinn
const BAUCH_B = kreis(27, 75, 21, 25, -155, 155);          // b, p: vom Stamm aus im Uhrzeigersinn
const OVAL_O = kreis(24, 75, 21, 25, -60, -420);           // o: oben rechts beginnend, geschlossen
const BOGEN_N = 'M6 72 C6 58 15 50 25 50 C36 50 42 58 42 70 L42 100';   // n, h: Bogen vom Stamm aus
const U_BOGEN = 'M6 50 L6 78 C6 92 14 100 23 100 C32 100 40 92 40 80';  // u: hinunter und Bogen
const OVAL_GROSS = kreis(38, 50, 34, 50, -60, -420);        // O, Q

// Ziffern 0 bis 9 (Etappe 3) und Buchstaben (Etappe 4).
// Annahmen (bei der Lehrperson zu prüfen): die 7 ohne Querstrich, die 1 mit kurzem Aufstrich; a, d, g, q mit Bauch und
// Abstrich als zwei Striche; m, n, h, r, u mit Stamm und Bogen getrennt; k und K mit zwei Strichen; t mit Bogen unten;
// T, E, F, t, f: zuerst der Abstrich, dann die Querstriche; Umlautpunkte als kurze Striche.
export const ZEICHEN = {
  0: { breite: 64, striche: ['M32 0 C12 0 4 28 4 50 C4 76 14 100 32 100 C50 100 60 76 60 50 C60 26 52 0 32 0'] },
  1: { breite: 56, striche: ['M12 28 L42 0 L42 100'] },
  2: { breite: 66, striche: ['M8 24 C10 7 22 0 33 0 C48 0 58 10 58 25 C58 45 32 70 8 100 L60 100'] },
  3: { breite: 66, striche: ['M8 12 C16 3 24 0 33 0 C48 0 56 10 56 22 C56 38 44 47 28 48 C46 48 60 58 60 74 C60 90 48 100 32 100 C22 100 12 96 6 88'] },
  4: { breite: 68, striche: ['M40 0 L6 68 L62 68', 'M47 32 L47 100'] },
  5: { breite: 66, striche: ['M14 0 L11 46 C18 40 26 38 33 38 C50 38 60 52 60 68 C60 88 48 100 32 100 C22 100 12 96 6 88', 'M14 0 L56 0'] },
  6: { breite: 66, striche: ['M54 8 C48 2 41 0 34 0 C14 0 6 28 6 58 C6 84 16 100 33 100 C50 100 60 88 60 72 C60 56 50 46 34 46 C22 46 11 54 7 66'] },
  7: { breite: 64, striche: ['M6 0 L58 0 L24 100'] },
  8: { breite: 64, striche: ['M54 18 C54 8 44 0 32 0 C18 0 10 9 10 20 C10 33 22 42 34 50 C48 59 58 66 58 78 C58 92 46 100 32 100 C18 100 6 92 6 78 C6 66 16 59 30 50 C42 42 54 33 54 18'] },
  9: { breite: 64, striche: ['M56 24 C56 10 46 0 32 0 C18 0 8 10 8 26 C8 42 18 52 32 52 C46 52 56 42 56 24 C56 60 52 84 46 100'] },

  // --- Grossbuchstaben (Oberlinie bis Grundlinie) ---
  A: { breite: 70, striche: ['M35 0 L4 100', 'M35 0 L66 100', 'M16 64 L54 64'] },
  B: { breite: 58, striche: ['M6 0 L6 100', 'M6 0 L28 0 C42 0 49 11 49 24 C49 37 41 47 28 47 L6 47', 'M6 47 L31 47 C46 47 54 58 54 73 C54 89 45 100 30 100 L6 100'] },
  C: { breite: 70, striche: [kreis(38, 50, 34, 50, -45, -315)] },
  D: { breite: 64, striche: ['M6 0 L6 100', 'M6 0 L24 0 C46 0 60 22 60 50 C60 78 46 100 24 100 L6 100'] },
  E: { breite: 54, striche: ['M6 0 L6 100', 'M6 0 L50 0', 'M6 48 L44 48', 'M6 100 L50 100'] },
  F: { breite: 50, striche: ['M6 0 L6 100', 'M6 0 L48 0', 'M6 48 L42 48'] },
  G: { breite: 74, striche: [kreis(38, 50, 34, 50, -45, -355) + ' L48 54.4'] },
  H: { breite: 66, striche: ['M6 0 L6 100', 'M60 0 L60 100', 'M6 50 L60 50'] },
  I: { breite: 16, striche: ['M8 0 L8 100'] },
  J: { breite: 44, striche: ['M38 0 L38 72 C38 89 30 100 20 100 C11 100 5 95 2 87'] },
  K: { breite: 60, striche: ['M6 0 L6 100', 'M54 0 L8 56 L56 100'] },
  L: { breite: 50, striche: ['M6 0 L6 100 L48 100'] },
  M: { breite: 76, striche: ['M6 0 L6 100', 'M6 0 L38 64 L70 0 L70 100'] },
  N: { breite: 64, striche: ['M6 0 L6 100', 'M6 0 L58 100 L58 0'] },
  O: { breite: 76, striche: [OVAL_GROSS] },
  P: { breite: 56, striche: ['M6 0 L6 100', 'M6 0 L28 0 C44 0 52 11 52 26 C52 41 44 52 28 52 L6 52'] },
  Q: { breite: 76, striche: [OVAL_GROSS, 'M44 74 L72 104'] },
  R: { breite: 58, striche: ['M6 0 L6 100', 'M6 0 L28 0 C44 0 52 11 52 26 C52 41 44 52 28 52 L6 52', 'M26 52 L56 100'] },
  S: { breite: 56, striche: ['M50 14 C45 5 37 0 28 0 C15 0 6 9 6 23 C6 37 17 42 28 47 C42 53 52 60 52 75 C52 91 42 100 27 100 C16 100 7 95 3 86'] },
  T: { breite: 62, striche: ['M31 0 L31 100', 'M2 0 L60 0'] },
  U: { breite: 64, striche: ['M6 0 L6 64 C6 87 17 100 32 100 C47 100 58 87 58 64 L58 0'] },
  V: { breite: 66, striche: ['M3 0 L33 100 L63 0'] },
  W: { breite: 90, striche: ['M3 0 L22 100 L45 30 L68 100 L87 0'] },
  X: { breite: 60, striche: ['M4 0 L56 100', 'M56 0 L4 100'] },
  Y: { breite: 62, striche: ['M3 0 L31 52', 'M59 0 L31 52 L31 100'] },
  Z: { breite: 58, striche: ['M4 0 L54 0 L4 100 L56 100'] },

  // --- Kleinbuchstaben ---
  a: { breite: 48, striche: [BAUCH_A, 'M42 50 L42 100'] },
  b: { breite: 50, striche: ['M6 0 L6 100', BAUCH_B] },
  c: { breite: 44, striche: [kreis(24, 75, 20, 25, -45, -315)] },
  d: { breite: 48, striche: [BAUCH_A, 'M42 0 L42 100'] },
  e: { breite: 46, striche: ['M4 75 L42 75' + bogen(23, 75, 19, 25, 0, -315)] },
  f: { breite: 34, striche: ['M32 7 C28 2 24 0 20 0 C14 0 10 5 10 12 L10 100', 'M0 50 L28 50'] },
  g: { breite: 48, striche: [BAUCH_A, 'M42 50 L42 116 C42 130 33 136 23 136 C14 136 7 132 4 126'] },
  h: { breite: 48, striche: ['M6 0 L6 100', BOGEN_N] },
  i: { breite: 18, striche: ['M9 50 L9 100', punkt(9, 30)] },
  j: { breite: 28, striche: ['M20 50 L20 122 C20 131 15 136 9 136 C5 136 2 134 0 131', punkt(20, 30)] },
  k: { breite: 44, striche: ['M6 0 L6 100', 'M38 50 L8 76 L40 100'] },
  l: { breite: 16, striche: ['M8 0 L8 100'] },
  m: { breite: 68, striche: ['M6 50 L6 100', 'M6 70 C6 57 12 50 20 50 C29 50 34 57 34 68 L34 100', 'M34 70 C34 57 40 50 48 50 C57 50 62 57 62 68 L62 100'] },
  n: { breite: 48, striche: ['M6 50 L6 100', BOGEN_N] },
  o: { breite: 48, striche: [OVAL_O] },
  p: { breite: 50, striche: ['M6 50 L6 135', BAUCH_B] },
  q: { breite: 48, striche: [BAUCH_A, 'M42 50 L42 135'] },
  r: { breite: 36, striche: ['M6 50 L6 100', 'M6 72 C6 58 14 50 24 50 C28 50 32 51 34 54'] },
  s: { breite: 42, striche: ['M35 56 C31 52 26 50 20 50 C11 50 5 55 5 62 C5 70 12 73 20 75 C29 77 37 81 37 89 C37 96 30 100 21 100 C13 100 7 97 3 92'] },
  t: { breite: 36, striche: ['M14 20 L14 90 C14 97 18 100 24 100 C28 100 31 98 33 95', 'M2 50 L30 50'] },
  u: { breite: 48, striche: [U_BOGEN, 'M40 50 L40 100'] },
  v: { breite: 46, striche: ['M3 50 L23 100 L43 50'] },
  w: { breite: 66, striche: ['M3 50 L17 100 L33 60 L49 100 L63 50'] },
  x: { breite: 42, striche: ['M4 50 L38 100', 'M38 50 L4 100'] },
  y: { breite: 46, striche: ['M4 50 L27 96', 'M43 50 L14 135'] },
  z: { breite: 42, striche: ['M5 50 L37 50 L5 100 L39 100'] },
};
// Umlaute: Grundzeichen und zwei Punkte (kurze Striche), links zuerst
for (const [u, basis, x1, x2, y] of [['Ä', 'A', 24, 46, -14], ['Ö', 'O', 28, 48, -14], ['Ü', 'U', 22, 42, -14], ['ä', 'a', 14, 30, 30], ['ö', 'o', 16, 32, 30], ['ü', 'u', 14, 32, 30]]) {
  ZEICHEN[u] = { breite: ZEICHEN[basis].breite, striche: [...ZEICHEN[basis].striche, punkt(x1, y), punkt(x2, y)] };
}

// Pfad in Punkte zerlegen (etwa alle 2 Einheiten)
export function abtasten(d, schritt = 2) {
  const t = d.match(/[MLC]|-?\d+(?:\.\d+)?/g);
  const pkt = [];
  let i = 0, cur = null;
  const add = (p) => { if (!pkt.length || Math.hypot(p[0] - pkt.at(-1)[0], p[1] - pkt.at(-1)[1]) > 0.01) pkt.push(p); };
  const num = () => Number(t[i++]);
  let cmd = null;
  while (i < t.length) {
    if (/[MLC]/.test(t[i])) cmd = t[i++];
    if (cmd === 'M') { cur = [num(), num()]; add(cur); }
    else if (cmd === 'L') {
      const ziel = [num(), num()];
      const n = Math.max(1, Math.ceil(Math.hypot(ziel[0] - cur[0], ziel[1] - cur[1]) / schritt));
      for (let k = 1; k <= n; k++) add([cur[0] + ((ziel[0] - cur[0]) * k) / n, cur[1] + ((ziel[1] - cur[1]) * k) / n]);
      cur = ziel;
    } else if (cmd === 'C') {
      const p1 = [num(), num()], p2 = [num(), num()], p3 = [num(), num()];
      const b = (u) => [0, 1].map((j) => (1 - u) ** 3 * cur[j] + 3 * (1 - u) ** 2 * u * p1[j] + 3 * (1 - u) * u ** 2 * p2[j] + u ** 3 * p3[j]);
      let laenge = 0, prev = cur;
      for (let k = 1; k <= 40; k++) { const q = b(k / 40); laenge += Math.hypot(q[0] - prev[0], q[1] - prev[1]); prev = q; }
      const n = Math.max(2, Math.ceil(laenge / schritt));
      for (let k = 1; k <= n; k++) add(b(k / n));
      cur = p3;
    } else throw new Error('Pfad: ' + d);
  }
  return pkt.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const aus = { hinweis: 'Nachspur-Vorlagen, angelehnt an die unverbundene Deutschschweizer Basisschrift. Erzeugt mit tools/baue_schrift.mjs.', hoehe: 100, linien: { ober: 0, mitte: 50, grund: 100, unter: 135 }, zeichen: {} };
  for (const [z, def] of Object.entries(ZEICHEN)) aus.zeichen[z] = { breite: def.breite, striche: def.striche.map((d) => ({ d, punkte: abtasten(d) })) };
  fs.mkdirSync('site/data/schrift', { recursive: true });
  fs.writeFileSync('site/data/schrift/basisschrift.json', JSON.stringify(aus) + '\n');
  console.log(`Basisschrift: ${Object.keys(aus.zeichen).length} Zeichen`);
}
