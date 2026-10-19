// Sammelbild (Belohnung): Eine Szene füllt sich Teil für Teil mit Tieren und Pflanzen. Eigene SVG-Zeichnungen, kein Text.
// sammelbild(szene, teile, { neu, klein }) -> SVGElement (viewBox 0 0 1000 600)
// Teil nr i steht auf Platz i (feste Plätze, vorne grösser, hinten kleiner); das Motiv ergibt sich aus Szene und Platz.
// «besonders» (bestandene Zeig-was-du-kannst-Runde) zeigt am selben Platz ein eigenes, leuchtendes Motiv.
import { s } from './dom.js';

export const TEILE_PRO_SZENE = 45;
export const SZENEN_NAME = { herbstwald: 'Herbstwald', winterwald: 'Winterwald', fruehlingswiese: 'Frühlingswiese', sommersee: 'Sommersee' };

// --- Kleine Zeichenhelfer (nur SVG-Attribute, keine style-Attribute) ---
const P = (d, fill, x = {}) => s('path', { d, fill, ...x });
const C = (cx, cy, r, fill, x = {}) => s('circle', { cx, cy, r, fill, ...x });
const E = (cx, cy, rx, ry, fill, x = {}) => s('ellipse', { cx, cy, rx, ry, fill, ...x });
const R = (x, y, width, height, fill, rx = 0, z = {}) => s('rect', { x, y, width, height, rx, fill, ...z });
const L = (d, stroke, w = 3, x = {}) => s('path', { d, fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...x });
const G = (transform, ...k) => s('g', transform ? { transform } : {}, ...k);
const auge = (x, y, r = 2.6) => [C(x, y, r, '#2b1d14'), C(x + r * 0.35, y - r * 0.4, r * 0.38, '#fff')];
const DUNKEL = '#2b1d14';

// Gemeinsame Formen
function krone(kr, bluete = false) {
  const k = [
    R(-7, -70, 14, 70, '#7a5236', 4),
    L('M0 -58 L-20 -80 M2 -66 L20 -86', '#7a5236', 5),
    C(-32, -96, 30, kr[0]), C(32, -98, 30, kr[0]),
    C(0, -116, 44, kr[1]),
    C(-24, -132, 26, kr[2]), C(22, -136, 24, kr[1]),
    C(2, -152, 20, kr[2]),
  ];
  if (bluete) for (const [x, y] of [[-30, -100], [-8, -124], [18, -110], [30, -138], [-20, -146], [6, -160], [38, -96], [-40, -122], [10, -90]]) k.push(C(x, y, 3.4, '#ffffff'));
  return k;
}
function blatt(x, y, rot, farbe, laenge = 11) {
  return G(`translate(${x} ${y}) rotate(${rot})`,
    P(`M0 ${-laenge} Q${laenge * 0.75} ${-laenge * 0.3} 0 ${laenge} Q${-laenge * 0.75} ${-laenge * 0.3} 0 ${-laenge} Z`, farbe),
    L(`M0 ${-laenge * 0.8} L0 ${laenge * 0.9}`, 'rgba(60,30,10,.35)', 1));
}
function stern5(cx, cy, ra, ri, farbe, x = {}) {
  const pkt = [];
  for (let i = 0; i < 10; i++) { const w = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? ri : ra; pkt.push(`${(cx + r * Math.cos(w)).toFixed(1)} ${(cy + r * Math.sin(w)).toFixed(1)}`); }
  return P(`M${pkt.join(' L')} Z`, farbe, x);
}
function funkeln(x, y, r, farbe = '#fffbe0') {
  return P(`M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`, farbe);
}
const welle = (w = 24) => L(`M${-w} 0 Q${-w / 2} -3 0 0 Q${w / 2} 3 ${w} 0`, '#d8eef9', 2);
function flocke(x, y, r, farbe) {
  const k = [];
  for (let i = 0; i < 3; i++) {
    const w = (i * Math.PI) / 3;
    const dx = r * Math.cos(w), dy = r * Math.sin(w);
    k.push(L(`M${x - dx} ${y - dy} L${x + dx} ${y + dy}`, farbe, 2.4));
    for (const sgn of [1, -1]) {
      const bx = x + sgn * dx * 0.55, by = y + sgn * dy * 0.55;
      const n1 = w + Math.PI / 4, n2 = w - Math.PI / 4, a = r * 0.32 * sgn;
      k.push(L(`M${bx} ${by} L${bx + a * Math.cos(n1)} ${by + a * Math.sin(n1)} M${bx} ${by} L${bx + a * Math.cos(n2)} ${by + a * Math.sin(n2)}`, farbe, 1.8));
    }
  }
  return k;
}

// --- Motive: lokale Koordinaten, Fuss bei (0, 0), nach oben negativ ---
const M = {
  laubbaum: () => krone(['#c9541f', '#e8772e', '#f4a640']),
  baum: () => krone(['#3f7f4a', '#5a9a52', '#7cb661']),
  bluetenbaum: () => krone(['#e27fa4', '#f2a9c4', '#fbd3e1'], true),
  fliegenpilz: () => [
    P('M-30 0 Q-25 -9 -17 -2 Q-9 -11 0 -2 Q10 -10 18 -1 Q26 -8 32 0 Z', '#7fae4a'),
    P('M-8 0 Q-10 -18 -7 -30 L7 -30 Q10 -18 8 0 Z', '#f3ead8'),
    P('M-9 -21 Q0 -17 9 -21 L9 -25 Q0 -21 -9 -25 Z', '#ded1b5'),
    P('M-32 -28 Q-30 -62 0 -62 Q30 -62 32 -28 Q0 -21 -32 -28 Z', '#d63a2f'),
    E(-16, -44, 4.5, 3.5, '#fff'), E(2, -53, 5, 3.8, '#fff'), E(18, -41, 4, 3, '#fff'), E(-4, -37, 3, 2.4, '#fff'), E(25, -31, 2.6, 2, '#fff'), E(-25, -32, 2.6, 2, '#fff'),
  ],
  igel: () => {
    const pkt = [];
    const n = 15;
    for (let i = 0; i <= n; i++) {
      const w = Math.PI * (1.02 - (0.9 * i) / n);
      const r = i % 2 ? 1 : 0.8;
      pkt.push(`${(-4 + 36 * r * Math.cos(w)).toFixed(1)} ${(-6 - 36 * r * Math.sin(w)).toFixed(1)}`);
    }
    return [
      E(-12, -2, 7, 3, '#4a3324'), E(10, -2, 7, 3, '#4a3324'),
      P(`M${pkt.join(' L')} L26 -4 L-36 -4 Z`, '#6b4a33'),
      P('M-28 -10 L-20 -26 L-12 -12 M-10 -30 L0 -16 M8 -32 L12 -16', 'none', { stroke: '#4f3523', 'stroke-width': 2, 'stroke-linecap': 'round' }),
      P('M14 -30 Q32 -27 42 -11 Q36 -3 16 -4 Q8 -16 14 -30 Z', '#e7caa0'),
      C(42, -11, 3.2, DUNKEL), ...auge(26, -19, 2.4),
    ];
  },
  eichhoernchen: () => [
    P('M-4 -8 C-40 -6 -48 -58 -22 -74 C-6 -84 10 -70 -2 -58 C-12 -48 -22 -40 -6 -26 Z', '#b8551f'),
    L('M-10 -16 C-34 -20 -36 -54 -20 -66', '#d9733a', 4),
    E(8, -24, 14, 20, '#c8622a'), E(12, -20, 8, 13, '#f1d7b0'),
    C(14, -50, 12, '#c8622a'), P('M7 -59 L9 -73 L16 -61 Z', '#b8551f'),
    ...auge(18, -52, 2.4), C(25, -47, 2, DUNKEL),
    C(22, -31, 5.5, '#8a5a2b'), P('M18 -35 Q22 -39 27 -35', '#6b4220'),
    E(4, -3, 8, 3.5, '#b8551f'), E(18, -3, 7, 3.5, '#b8551f'),
  ],
  eule: (schnee = false) => [
    R(-20, -24, 40, 24, '#8a5a3b', 3), E(0, -24, 20, 6, schnee ? '#f4f8fc' : '#c49a6c'), schnee ? null : E(0, -24, 11, 3, '#a87b52'),
    P('M-18 -64 L-15 -82 L-6 -70 Z', '#8b6b4a'), P('M18 -64 L15 -82 L6 -70 Z', '#8b6b4a'),
    E(0, -50, 20, 26, '#8b6b4a'),
    P('M-20 -52 Q-27 -36 -13 -26 Q-18 -40 -20 -52 Z', '#6f5238'), P('M20 -52 Q27 -36 13 -26 Q18 -40 20 -52 Z', '#6f5238'),
    E(0, -37, 12, 11, '#d8c19c'),
    L('M-7 -41 l3 3 l3 -3 M1 -41 l3 3 l3 -3 M-3 -34 l3 3 l3 -3', '#a88a62', 1.5),
    E(0, -58, 16, 12, '#c9a77e'),
    C(-7, -58, 6.5, '#fff'), C(7, -58, 6.5, '#fff'), C(-6, -58, 3.4, DUNKEL), C(8, -58, 3.4, DUNKEL), C(-5, -59.4, 1.1, '#fff'), C(9, -59.4, 1.1, '#fff'),
    P('M-3 -52 L3 -52 L0 -46 Z', '#e8a23a'),
  ],
  kastanie: () => [
    P('M-30 0 Q-34 -18 -16 -22 Q-8 -12 -11 0 Z', '#8fae4a'),
    L('M-31 -8 l-4 -1 M-30 -15 l-4 -3 M-24 -21 l-2 -4 M-17 -22 l1 -4', '#6f8e34', 1.5),
    P('M-10 -1 Q-16 -20 3 -27 Q20 -20 15 -1 Q3 3 -10 -1 Z', '#7b3f1e'), E(2, -3, 11, 4, '#d8b98a'), E(-3, -17, 3, 5.5, '#a65c32'),
    P('M16 -1 Q12 -14 24 -18 Q35 -13 31 -1 Q24 2 16 -1 Z', '#8a4a26'), E(23, -2, 7, 3, '#d8b98a'), E(21, -11, 2, 3.5, '#b0663a'),
  ],
  apfel: () => [
    P('M0 -24 C-10 -32 -24 -26 -22 -12 C-21 -2 -12 2 0 -1 C12 2 21 -2 22 -12 C24 -26 10 -32 0 -24 Z', '#d63a2f'),
    E(-10, -15, 3.5, 6.5, '#ef6a5a'),
    L('M0 -24 Q1 -30 4 -34', '#6b4a33', 2.5),
    P('M4 -31 Q14 -40 21 -31 Q12 -25 4 -31 Z', '#6fa245'),
  ],
  reh: () => [
    R(-24, -36, 5, 36, '#9a6a3e', 2), R(-14, -36, 5, 36, '#a8764a', 2), R(13, -36, 5, 36, '#9a6a3e', 2), R(22, -36, 5, 36, '#a8764a', 2),
    R(-24, -4, 5, 4, '#4a3324', 1), R(-14, -4, 5, 4, '#4a3324', 1), R(13, -4, 5, 4, '#4a3324', 1), R(22, -4, 5, 4, '#4a3324', 1),
    E(0, -46, 30, 15, '#b07a4a'), E(0, -38, 20, 6, '#e2c29a'), E(-29, -52, 5, 6.5, '#f3e8d6'),
    P('M14 -54 L24 -86 L36 -84 L28 -46 Z', '#b07a4a'),
    P('M26 -100 L18 -114 L32 -103 Z', '#9a6a3e'),
    P('M22 -94 Q34 -104 48 -92 Q51 -84 42 -82 Q28 -82 22 -94 Z', '#b07a4a'),
    C(48, -88, 2.6, DUNKEL), ...auge(36, -93, 2.3),
  ],
  schnecke: () => [
    P('M-24 0 Q-26 -7 -14 -8 L22 -8 Q30 -9 31 -18 Q35 -18 35 -10 Q35 0 22 0 Z', '#c9b38a'),
    L('M29 -16 L30 -28 M33 -16 L39 -27', '#a8956c', 2), C(30, -29, 2.2, '#5a4a35'), C(39, -28, 2.2, '#5a4a35'),
    C(-2, -21, 15, '#d9a441'),
    L('M-2 -21 a4 4 0 1 1 4 4 a8 8 0 1 1 -8 -8 a11.5 11.5 0 0 1 11.5 11.5', '#a8742a', 2.2),
  ],
  kuerbis: () => [
    E(-14, -20, 16, 20, '#d9622b'), E(14, -20, 16, 20, '#d9622b'), E(0, -21, 17, 22, '#f08a3a'),
    L('M-6 -40 Q-11 -20 -6 -1 M6 -40 Q11 -20 6 -1', '#c9541f', 1.6),
    P('M-3 -40 L-2 -51 L5 -53 L4 -40 Z', '#6b7a35'), L('M4 -48 q10 -7 13 2', '#6fa245', 2.2),
  ],
  laubhaufen: () => [
    P('M-42 0 Q-38 -30 -8 -38 Q20 -43 37 -20 Q43 -8 42 0 Z', '#c8762b'),
    blatt(-22, -25, -60, '#e8a23a'), blatt(3, -35, 20, '#d63a2f'), blatt(22, -21, 70, '#f4c542'),
    blatt(-5, -16, -15, '#9a3b1e', 9), blatt(-31, -8, 40, '#e8772e', 9), blatt(28, -7, -40, '#b5470e', 9), blatt(10, -8, 110, '#f0a03a', 8),
  ],
  drachen: () => [
    L('M0 -40 Q12 -28 -2 -16 Q-12 -6 3 2', '#6b4a33', 1.6),
    P('M2 -30 l9 -5 l0 10 Z M2 -30 l-9 -5 l0 10 Z', '#3a8fc2'), P('M-4 -12 l9 -5 l0 10 Z M-4 -12 l-9 -5 l0 10 Z', '#6fbf5a'),
    P('M0 -100 L-23 -72 L0 -72 Z', '#d63a2f'), P('M0 -100 L23 -72 L0 -72 Z', '#f4c542'),
    P('M-23 -72 L0 -40 L0 -72 Z', '#f4c542'), P('M23 -72 L0 -40 L0 -72 Z', '#d63a2f'),
    L('M0 -100 L0 -40 M-23 -72 L23 -72', '#6b4a33', 1.4),
  ],
  zugvoegel: () => [
    L('M-34 -46 q8 -9 14 0 q6 -9 14 0', '#4a3b30', 3), L('M0 -66 q7 -8 12 0 q5 -8 12 0', '#4a3b30', 2.6), L('M10 -26 q7 -8 12 0 q5 -8 12 0', '#4a3b30', 2.6),
  ],
  blaetter: () => [blatt(-18, -52, 35, '#e8772e', 12), blatt(12, -32, -25, '#d63a2f', 11), blatt(-6, -11, 65, '#f4c542', 10)],
  tanne: () => [
    R(-6, -24, 12, 24, '#6b4a33', 2),
    P('M0 -162 L-30 -112 L-16 -114 L-42 -72 L-24 -74 L-54 -24 L54 -24 L24 -74 L42 -72 L16 -114 L30 -112 Z', '#2f6b4f'),
    P('M0 -162 L-15 -137 Q-7 -131 0 -137 Q7 -130 15 -137 Z', '#f4f8fc'),
    E(-20, -113, 11, 3.5, '#f4f8fc'), E(18, -113, 11, 3.5, '#f4f8fc'),
    E(-30, -74, 14, 4, '#f4f8fc'), E(28, -74, 14, 4, '#f4f8fc'),
    E(-40, -25, 16, 5, '#f4f8fc'), E(38, -25, 16, 5, '#f4f8fc'), E(0, -25, 12, 4, '#f4f8fc'),
  ],
  schneemann: () => {
    const rand = { stroke: '#bccfe2', 'stroke-width': 1.6 };
    return [
      C(0, -22, 22, '#f6f9fc', rand), C(0, -56, 16, '#f6f9fc', rand), C(0, -82, 12, '#f6f9fc', rand),
      L('M-15 -58 L-34 -70 M-27 -66 L-31 -77 M15 -58 L34 -70 M27 -66 L33 -76', '#6b4a33', 2.6),
      R(-13, -73, 26, 6, '#d63a2f', 3), R(4, -72, 6, 15, '#d63a2f', 2),
      C(-4, -85, 1.9, DUNKEL), C(4, -85, 1.9, DUNKEL), P('M0 -82 L13 -79 L0 -77.5 Z', '#e8772e'),
      C(0, -58, 2, DUNKEL), C(0, -50, 2, DUNKEL), C(0, -28, 2.2, DUNKEL), C(0, -18, 2.2, DUNKEL),
      R(-10, -105, 20, 15, '#2b2b33', 2), R(-15, -93, 30, 4, '#2b2b33', 2),
    ];
  },
  hase: () => [
    E(-8, -3, 12, 4, '#97795f'),
    E(-2, -20, 20, 18, '#a68b72'), E(-8, -16, 14, 14, '#97795f'), C(-22, -19, 6, '#f6f1ea'),
    P('M16 -48 Q21 -74 28 -72 Q31 -66 21 -46 Z', '#97795f'),
    C(16, -40, 11.5, '#a68b72'),
    P('M8 -48 Q2 -76 10 -78 Q17 -74 14 -48 Z', '#a68b72'), P('M9.5 -52 Q6 -70 10 -72 Q13.5 -68 12.5 -52 Z', '#e9b9b0'),
    ...auge(20, -42, 2.3), C(27, -38, 1.9, '#d98a8a'),
    E(12, -3, 6, 3.5, '#97795f'),
  ],
  rotkehlchen: () => [
    L('M-2 0 L-1 -9 M4 0 L4 -9', '#8a6a4a', 1.7),
    P('M-13 -17 L-28 -24 L-25 -12 Z', '#7a5e43'),
    E(0, -18, 15, 12, '#8a6a4a'), C(10, -28, 9.5, '#8a6a4a'),
    P('M4 -33 Q19 -31 16 -16 Q12 -8 2 -10 Q8 -20 4 -33 Z', '#e8622e'),
    P('M-10 -22 Q0 -26 6 -16 Q-4 -12 -10 -22 Z', '#6f5238'),
    P('M18.5 -30 L25 -28 L18.5 -26.5 Z', '#4a3b30'), ...auge(13, -30, 1.9),
  ],
  schlitten: () => [
    E(0, -1, 38, 3, '#e3ecf5'),
    R(-24, -17, 4, 11, '#8a5a3b'), R(14, -17, 4, 11, '#8a5a3b'),
    L('M-32 -6 L26 -6 Q36 -6 34 -16', '#8a5a3b', 3.6),
    R(-29, -23, 52, 7, '#c0602b', 2), R(-27, -21, 48, 1.6, '#e08a4a'),
    L('M22 -21 Q36 -22 38 -10', '#d63a2f', 1.6),
  ],
  laterne: (glow) => [
    C(0, -62, 30, glow),
    R(-3, -48, 6, 48, '#3a3a44', 2), R(-9, -4, 18, 4, '#3a3a44', 1),
    P('M-11 -48 L11 -48 L13 -75 L-13 -75 Z', '#3a3a44'), R(-8, -72, 16, 21, '#ffd65a', 2), L('M0 -72 L0 -51', '#e8b23a', 1.4),
    P('M-17 -75 L0 -88 L17 -75 Z', '#3a3a44'), P('M-17 -75 L0 -88 L17 -75 Q8 -80 0 -78 Q-8 -81 -17 -75 Z', '#f4f8fc'),
    C(0, -90, 2.6, '#3a3a44'),
  ],
  vogelhaeuschen: () => [
    R(-3, -56, 6, 56, '#7a5236', 1),
    R(-18, -80, 36, 25, '#c0602b', 2), C(0, -69, 5.5, '#4a2d1d'), R(-1, -61, 2, 5, '#6b4a33'),
    R(-23, -57, 46, 4, '#8a5a3b', 1),
    P('M-27 -78 L0 -99 L27 -78 Z', '#8a3b2b'),
    P('M-27 -79 L0 -100 L27 -79 L24 -76 Q12 -84 0 -82 Q-12 -86 -24 -76 Z', '#f4f8fc'),
    E(14, -57, 6, 2, '#f4f8fc'),
  ],
  stechpalme: () => {
    const b = 'M0 0 L-5 -5 L-11 -4 L-9 -12 L-15 -15 L-11 -21 L-13 -28 L-6 -27 L0 -34 L6 -27 L13 -28 L11 -21 L15 -15 L9 -12 L11 -4 L5 -5 Z';
    return [
      G('translate(-2 -6) rotate(-38)', P(b, '#2f6b3f'), L('M0 -2 L0 -30', '#4f8f5f', 1.2)),
      G('translate(2 -6) rotate(38)', P(b, '#3a7a48'), L('M0 -2 L0 -30', '#5a9a6a', 1.2)),
      C(-4, -8, 4.2, '#d6262f'), C(4, -9, 4.2, '#c41f2a'), C(0, -14, 4.2, '#e0333a'), C(-2.5, -15.5, 1.2, '#ff9a9a'),
    ];
  },
  schneeflocken: () => [...flocke(-16, -50, 13, '#6fa6d6'), ...flocke(14, -30, 10, '#8dbbe3'), ...flocke(-6, -10, 8, '#6fa6d6')],
  meise: () => [
    P('M-6 -30 Q-20 -46 -34 -42 Q-22 -36 -12 -26 Z', '#5a7a8a'), P('M2 -30 Q14 -48 30 -46 Q20 -38 8 -26 Z', '#6d8f9e'),
    P('M-14 -24 L-26 -20 L-14 -18 Z', '#4a5f6a'),
    E(0, -24, 13, 9, '#f4d03f'), L('M2 -32 L4 -16', DUNKEL, 3),
    C(12, -30, 7, DUNKEL), E(13, -29, 3.4, 2.8, '#ffffff'), P('M18.5 -31 L23 -30 L18.5 -28.5 Z', DUNKEL),
  ],
  tulpe: () => {
    const k = [];
    for (const [x, h, col] of [[-8, 50, '#e8413a'], [11, 40, '#f4c542']]) {
      k.push(L(`M${x} 0 Q${x - 2} ${-h / 2} ${x} ${-h}`, '#4f8f3f', 3));
      k.push(P(`M${x} -3 Q${x - 17} ${-h * 0.4} ${x - 7} ${-h * 0.72} Q${x - 4} ${-h * 0.36} ${x} -3 Z`, '#5a9a4a'));
      k.push(P(`M${x - 8} ${-h} Q${x - 9.5} ${-h - 14} ${x - 5} ${-h - 17} L${x - 2} ${-h - 10} L${x} ${-h - 18} L${x + 2} ${-h - 10} L${x + 5} ${-h - 17} Q${x + 9.5} ${-h - 14} ${x + 8} ${-h} Q${x} ${-h + 5} ${x - 8} ${-h} Z`, col));
    }
    return k;
  },
  gaensebluemchen: () => {
    const k = [];
    for (const [x, h, r] of [[-14, 26, 7], [4, 36, 8], [18, 20, 6]]) {
      k.push(L(`M${x} 0 Q${x + 2} ${-h / 2} ${x} ${-h}`, '#5a9a4a', 2));
      for (let i = 0; i < 10; i++) k.push(E(x, -h - r * 0.62, r * 0.28, r * 0.62, '#ffffff', { transform: `rotate(${i * 36} ${x} ${-h})`, stroke: '#e4dccb', 'stroke-width': 0.6 }));
      k.push(C(x, -h, r * 0.38, '#f4c542'));
    }
    k.push(P('M-22 0 Q-18 -8 -12 -2 Q-6 -8 0 -1 Q8 -7 14 -1 Q20 -7 26 0 Z', '#6fa245'));
    return k;
  },
  schmetterling: (c1 = '#f08a3a', c2 = '#f4c542') => [
    P('M0 -26 Q-22 -52 -27 -31 Q-25 -21 0 -24 Z', c1), P('M0 -26 Q22 -52 27 -31 Q25 -21 0 -24 Z', c1),
    P('M0 -24 Q-19 -20 -17 -8 Q-8 -3 0 -22 Z', c2), P('M0 -24 Q19 -20 17 -8 Q8 -3 0 -22 Z', c2),
    C(-15, -34, 3.2, '#fffaf0'), C(15, -34, 3.2, '#fffaf0'), C(-10, -14, 2, '#fffaf0'), C(10, -14, 2, '#fffaf0'),
    E(0, -22, 2.6, 11, '#3b2a1f'), L('M0 -32 Q-4 -41 -8 -44 M0 -32 Q4 -41 8 -44', '#3b2a1f', 1.3),
  ],
  biene: () => [
    E(-5, -34, 8, 5.5, '#eaf6fc', { stroke: '#a9cfe2', 'stroke-width': 1 }), E(4, -35, 8, 5.5, '#eaf6fc', { stroke: '#a9cfe2', 'stroke-width': 1 }),
    P('M-12 -24 L-17 -23 L-12 -22 Z', DUNKEL),
    E(0, -24, 12, 8, '#f4c542'),
    P('M-4 -31.3 Q-2 -24 -4 -16.7 L0 -16 Q2 -24 0 -32 Z', DUNKEL), P('M5 -31.1 Q7 -24 5 -16.9 L8 -17.6 Q10 -24 8 -30.4 Z', DUNKEL),
    C(12, -25, 5.5, DUNKEL), C(13.8, -26.5, 1.3, '#fff'),
    L('M14 -30 Q16 -36 19 -37 M11 -30 Q11 -36 13 -38', DUNKEL, 1.2),
  ],
  marienkaefer: () => [
    P('M-26 0 Q-10 -28 24 -15 Q4 5 -26 0 Z', '#6fa245'), L('M-23 -1 Q0 -10 22 -15', '#4f8f3f', 1.3),
    C(11, -15, 4.5, DUNKEL),
    E(0, -14, 10.5, 8.5, '#d6262f'), L('M-10 -14 L10 -14', DUNKEL, 1.3),
    C(-4, -18, 1.9, DUNKEL), C(4, -18, 1.9, DUNKEL), C(-5, -10, 1.7, DUNKEL), C(5, -10, 1.7, DUNKEL), C(-1, -20.5, 1.3, '#ff8d8d'),
  ],
  vogelnest: () => [
    E(0, -16, 24, 5, '#7a5236'),
    E(-8, -19, 6, 7.5, '#9fd3e6'), E(4, -20, 6, 7.5, '#b5e0ee'), E(13, -17, 5.5, 7, '#9fd3e6'),
    P('M-25 -17 Q-23 0 0 0 Q23 0 25 -17 Q0 -10 -25 -17 Z', '#9a6a3e'),
    L('M-21 -12 Q0 -4 21 -12 M-16 -6 Q0 -1 16 -6', '#7a5236', 1.5),
    L('M-26 -16 l-6 -4 M24 -15 l7 -3 M-14 -2 l-5 3', '#7a5236', 1.4),
  ],
  frosch: (stein = false) => {
    const y = stein ? -7 : 0;
    return [
      stein ? E(0, -4, 25, 7, '#a3a196') : null, stein ? E(-6, -7, 14, 3, '#b9b7ac') : null,
      E(-16, y - 4, 10, 5, '#4f9a3f'), E(16, y - 4, 10, 5, '#4f9a3f'),
      P(`M-18 ${y - 4} Q-22 ${y - 30} 0 ${y - 32} Q22 ${y - 30} 18 ${y - 4} Q0 ${y + 2} -18 ${y - 4} Z`, '#5cae4a'),
      E(0, y - 10, 10, 8, '#c8e6a0'),
      C(-9, y - 32, 7, '#5cae4a'), C(9, y - 32, 7, '#5cae4a'),
      C(-9, y - 33, 4.2, '#fff'), C(9, y - 33, 4.2, '#fff'), C(-8.5, y - 33, 2.3, DUNKEL), C(9.5, y - 33, 2.3, DUNKEL),
      L(`M-8 ${y - 22} Q0 ${y - 17} 8 ${y - 22}`, '#2f6b2f', 1.5),
      E(-8, y - 1, 4.5, 2.5, '#4f9a3f'), E(8, y - 1, 4.5, 2.5, '#4f9a3f'),
    ];
  },
  loewenzahn: () => {
    const k = [L('M0 0 Q-2 -24 0 -40', '#5a9a4a', 2), L('M14 0 Q15 -12 14 -22', '#5a9a4a', 2)];
    k.push(P('M0 -2 L-15 -10 L-9 -10 L-19 -18 L-6 -13 Z', '#5a9a4a'), P('M0 -2 L15 -9 L10 -9 L20 -15 L6 -12 Z', '#6aa84f'));
    k.push(C(0, -49, 11, '#fffef8', { stroke: '#d8d2c0', 'stroke-width': 1 }));
    for (let i = 0; i < 10; i++) { const w = (i * Math.PI) / 5; k.push(L(`M0 -49 L${(10 * Math.cos(w)).toFixed(1)} ${(-49 + 10 * Math.sin(w)).toFixed(1)}`, '#d8d2c0', 0.8)); }
    k.push(C(14, -26, 6, '#f4c542'), C(14, -26, 3, '#e8a23a'));
    return k;
  },
  schwalbe: () => [
    P('M0 -30 Q-14 -40 -32 -36 Q-16 -32 -6 -26 L-14 -12 L-2 -22 L0 -17 L2 -22 L14 -12 L6 -26 Q16 -32 32 -36 Q14 -40 0 -30 Z', '#24395e'),
    E(0, -25, 3.2, 4.5, '#f3eee6'), C(0, -31, 2.4, '#c0442b'),
  ],
  seerose: () => [
    E(0, -3, 27, 7.5, '#4f9a5a'), P('M0 -3 L12 -10 L19 -9 Z', '#5aa7d6'), L('M-20 -3 Q-8 -6 0 -3', '#3f8048', 1),
    P('M-11 -5 L-11 -18 L-3 -7 Z', '#f0a0bd'), P('M11 -5 L13 -18 L4 -7 Z', '#f0a0bd'),
    P('M-6 -6 L-3 -22 L1 -6 Z', '#f5b5cb'), P('M-1 -6 L5 -21 L6 -6 Z', '#f8c6d7'),
    E(0, -8, 4.5, 2.6, '#f4c542'),
  ],
  ente: () => [
    welle(28),
    P('M-27 -14 L-35 -21 L-29 -10 Z', '#2b2b33'),
    P('M-26 -12 Q-30 -26 -18 -22 Q0 -26 18 -18 Q22 -8 14 -2 L-18 -2 Q-26 -4 -26 -12 Z', '#8a7a6a'),
    P('M-14 -16 Q2 -23 12 -12 Q0 -8 -14 -16 Z', '#6f6151'), P('M1 -14 L9 -13 L6 -10 Z', '#3a6fc2'),
    P('M10 -18 Q10 -26 14 -28 L20 -24 Q18 -18 16 -16 Z', '#2f7d4a'),
    C(16, -31, 9, '#2f7d4a'), L('M10 -23 Q15 -21 20 -24', '#ffffff', 2),
    P('M24 -32 L35 -30 Q33 -25 24 -27 Z', '#f4c542'), ...auge(18, -33, 1.9),
  ],
  fisch: () => [
    E(0, -2, 20, 3.5, 'none', { stroke: '#d8eef9', 'stroke-width': 2 }),
    C(-14, -8, 2.4, '#bfe3f4'), C(12, -10, 2, '#bfe3f4'), C(4, -14, 1.6, '#bfe3f4'),
    G('rotate(-28 0 -32)',
      P('M-16 -32 L-30 -41 L-29 -23 Z', '#d9622b'),
      P('M-2 -39 L7 -46 L9 -38 Z', '#d9622b'),
      E(0, -32, 19, 8.5, '#e8913a'), E(2, -29, 12, 3.5, '#f3b56a'),
      ...auge(11, -34, 1.9)),
  ],
  schwan: () => [
    welle(30),
    P('M-30 -8 Q-34 -26 -16 -24 Q4 -28 18 -14 Q22 -4 12 -2 L-22 -2 Q-30 -2 -30 -8 Z', '#ffffff', { stroke: '#c9d4df', 'stroke-width': 1.3 }),
    P('M-22 -16 Q-4 -31 10 -14 Q-6 -8 -22 -16 Z', '#eef2f6', { stroke: '#c9d4df', 'stroke-width': 1.1 }),
    L('M12 -12 Q8 -40 18 -48 Q26 -52 26 -44', '#c9d4df', 9), L('M12 -12 Q8 -40 18 -48 Q26 -52 26 -44', '#ffffff', 6.5),
    C(24, -46, 5.5, '#ffffff'), P('M28 -48 L37 -43 L28 -42 Z', '#e8772e'), C(28, -46, 1.8, DUNKEL), C(23, -47.5, 1.3, DUNKEL),
  ],
  segelboot: () => [
    welle(32),
    P('M-29 -12 L29 -12 L20 -1 L-20 -1 Z', '#c0602b'), R(-27, -12, 54, 3, '#fffaf0'),
    R(-1.5, -76, 3, 64, '#6b4a33', 1),
    P('M3 -74 L3 -16 L31 -16 Z', '#fffaf0', { stroke: '#d8cfc0', 'stroke-width': 1 }),
    P('M-3 -64 L-3 -16 L-23 -16 Z', '#f4c542'),
    P('M1.5 -76 L15 -72 L1.5 -68 Z', '#d63a2f'),
  ],
  schilf: () => [
    L('M-10 0 Q-14 -40 -24 -62', '#6f8e44', 2.6), L('M0 0 Q2 -44 -2 -78', '#7c9b4c', 2.6), L('M10 0 Q14 -36 22 -58', '#6f8e44', 2.6),
    L('M-4 0 Q-20 -18 -30 -26', '#86a85a', 3), L('M5 0 Q20 -20 32 -24', '#86a85a', 3),
    R(-5, -86, 6, 18, '#7a5236', 3), R(-28, -70, 6, 15, '#7a5236', 3), R(19, -66, 6, 15, '#7a5236', 3),
  ],
  muschel: () => [
    P('M0 0 L-19 -14 Q-17 -31 0 -33 Q17 -31 19 -14 Z', '#f3c9b0'),
    L('M0 -1 L-14 -26 M0 -1 L-6 -31 M0 -1 L6 -31 M0 -1 L14 -26 M0 -1 L-18 -15 M0 -1 L18 -15', '#d89a80', 1.4),
    P('M-6 1 L6 1 L4 -4 L-4 -4 Z', '#e0a88f'),
  ],
  sandburg: () => [
    R(-28, -26, 56, 26, '#e6c27a', 2),
    R(-32, -46, 17, 46, '#e9c985', 2), R(15, -46, 17, 46, '#e9c985', 2),
    R(-32, -51, 5, 6, '#e9c985'), R(-24, -51, 5, 6, '#e9c985'), R(-16.5, -51, 5, 6, '#e9c985'),
    R(15, -51, 5, 6, '#e9c985'), R(22.5, -51, 5, 6, '#e9c985'), R(30, -51, 2, 6, '#e9c985'),
    R(-12, -30, 4, 4, '#e6c27a'), R(-4, -30, 4, 4, '#e6c27a'), R(4, -30, 4, 4, '#e6c27a'),
    P('M-7 0 L-7 -10 Q0 -18 7 -10 L7 0 Z', '#c49a52'),
    L('M-23 -51 L-23 -68', '#6b4a33', 1.6), P('M-23 -68 L-12 -64 L-23 -60 Z', '#d63a2f'),
    L('M-28 -36 L-20 -36 M20 -36 L28 -36', '#d4ac62', 1.2),
  ],
  moewe: () => [
    P('M-32 -36 Q-17 -45 -4 -33 Q0 -31 4 -33 Q17 -45 32 -36 Q17 -38 6 -29 Q0 -25 -6 -29 Q-17 -38 -32 -36 Z', '#ffffff', { stroke: '#97a5b3', 'stroke-width': 1.3 }),
    P('M-32 -36 Q-27 -39 -23 -39 L-25 -36 Z', '#3a3a44'), P('M32 -36 Q27 -39 23 -39 L25 -36 Z', '#3a3a44'),
    C(0, -31, 3.4, '#ffffff', { stroke: '#97a5b3', 'stroke-width': 1 }), P('M2.5 -31 L6 -30 L2.5 -29.4 Z', '#e8a23a'),
  ],
};

// Besondere Teile: leuchtend, mit Funkeln
const B = {
  gluehwuermchen: (glow) => [
    C(0, -40, 34, glow),
    E(-1, -44, 6, 3.4, '#ffffff', { opacity: 0.85 }), E(4, -45, 6, 3.2, '#ffffff', { opacity: 0.85 }),
    E(-2, -40, 6, 3.6, '#3b3020'), C(5, -39.5, 4, '#fff36b'), C(5, -39.5, 2, '#ffffff'),
    funkeln(-24, -60, 5), funkeln(22, -66, 4), funkeln(26, -22, 3.5), funkeln(-20, -18, 3),
  ],
  stern: (glow) => [
    C(0, -52, 36, glow),
    stern5(0, -52, 21, 9, '#f4c542'), stern5(0, -52, 11, 5, '#fff3b0'),
    funkeln(-26, -76, 5), funkeln(28, -30, 4), funkeln(26, -80, 3.5),
  ],
  regenbogen: (glow) => {
    const k = [C(0, -24, 44, glow)];
    ['#e8413a', '#f08a3a', '#f4c542', '#6fbf5a', '#3a8fc2', '#7a5bb5'].forEach((c, i) => {
      const r = 46 - i * 6;
      k.push(L(`M${-r} -2 A${r} ${r} 0 0 1 ${r} -2`, c, 6.4, { 'stroke-linecap': 'butt' }));
    });
    for (const x of [-38, 38]) k.push(C(x - 8, -4, 8, '#ffffff'), C(x + 2, -8, 10, '#ffffff'), C(x + 11, -3, 7, '#ffffff'));
    k.push(funkeln(-6, -60, 4.5), funkeln(30, -54, 3.5));
    return k;
  },
  libelle: (glow) => [
    C(0, -38, 36, glow),
    E(-2, -46, 13, 4, '#e8fbff', { stroke: '#7cc6d6', 'stroke-width': 1, transform: 'rotate(-18 -2 -46)' }),
    E(-2, -30, 13, 4, '#e8fbff', { stroke: '#7cc6d6', 'stroke-width': 1, transform: 'rotate(18 -2 -30)' }),
    E(10, -46, 12, 3.6, '#e8fbff', { stroke: '#7cc6d6', 'stroke-width': 1, transform: 'rotate(-30 10 -46)' }),
    E(10, -30, 12, 3.6, '#e8fbff', { stroke: '#7cc6d6', 'stroke-width': 1, transform: 'rotate(30 10 -30)' }),
    R(-28, -39.8, 34, 3.6, '#2fa7a2', 1.8), E(8, -38, 5, 3.6, '#f4c542'), C(16, -38, 4, '#2a8f8f'), C(17.5, -39.2, 1.2, '#fff'),
    funkeln(-30, -60, 4.5), funkeln(26, -64, 4), funkeln(30, -18, 3),
  ],
};

// --- Namen (gesprochen, mit Artikel) ---
const NAME = {
  laubbaum: 'ein Baum', baum: 'ein Baum', bluetenbaum: 'ein Blütenbaum', fliegenpilz: 'ein Fliegenpilz', igel: 'ein Igel', eichhoernchen: 'ein Eichhörnchen',
  eule: 'eine Eule', kastanie: 'zwei Kastanien', apfel: 'ein Apfel', reh: 'ein Reh', schnecke: 'eine Schnecke', kuerbis: 'ein Kürbis', laubhaufen: 'ein Laubhaufen',
  drachen: 'ein Drachen', zugvoegel: 'drei Vögel', blaetter: 'bunte Blätter', tanne: 'eine Tanne', schneemann: 'ein Schneemann', hase: 'ein Hase',
  rotkehlchen: 'ein Rotkehlchen', schlitten: 'ein Schlitten', laterne: 'eine Laterne', vogelhaeuschen: 'ein Vogelhäuschen', stechpalme: 'eine Stechpalme',
  schneeflocken: 'Schneeflocken', meise: 'eine Meise', tulpe: 'zwei Tulpen', gaensebluemchen: 'drei Gänseblümchen', schmetterling: 'ein Schmetterling',
  biene: 'eine Biene', marienkaefer: 'ein Marienkäfer', vogelnest: 'ein Vogelnest', frosch: 'ein Frosch', loewenzahn: 'eine Pusteblume', schwalbe: 'eine Schwalbe',
  seerose: 'eine Seerose', ente: 'eine Ente', fisch: 'ein Fisch', schwan: 'ein Schwan', segelboot: 'ein Segelboot', schilf: 'ein Büschel Schilf',
  muschel: 'eine Muschel', sandburg: 'eine Sandburg', moewe: 'eine Möwe',
  gluehwuermchen: 'ein Glühwürmchen', stern: 'ein Stern', regenbogen: 'ein Regenbogen', libelle: 'eine Libelle',
};

// --- Szenen: Farben, Hintergrund, erlaubte Motive je Reihe (Gewicht), besonderes Motiv ---
const SZENEN = {
  herbstwald: {
    himmel: ['#f6dcae', '#fbefd9'], besonders: 'gluehwuermchen',
    reihen: [
      { schattenFarbe: 'rgba(80,50,20,.16)', m: { drachen: 1, zugvoegel: 1, blaetter: 1 } },
      { m: { laubbaum: 3, reh: 1, eule: 1 } },
      { m: { laubbaum: 2, reh: 1, eichhoernchen: 1, eule: 1, kuerbis: 1 } },
      { m: { eichhoernchen: 1, fliegenpilz: 1, igel: 1, kuerbis: 1, laubhaufen: 1, reh: 1 } },
      { m: { igel: 1, fliegenpilz: 1, kuerbis: 1, laubhaufen: 1, schnecke: 1, apfel: 1, kastanie: 1 } },
      { m: { schnecke: 1, kastanie: 1, apfel: 1, igel: 1, fliegenpilz: 1 } },
    ],
  },
  winterwald: {
    himmel: ['#c9def0', '#eef5fb'], besonders: 'stern',
    reihen: [
      { m: { schneeflocken: 1, meise: 1 } },
      { m: { tanne: 3, reh: 1 } },
      { m: { tanne: 2, reh: 1, schneemann: 1, vogelhaeuschen: 1, eule: 1 } },
      { m: { schneemann: 1, hase: 1, laterne: 1, eule: 1, vogelhaeuschen: 1 } },
      { m: { hase: 1, rotkehlchen: 1, schlitten: 1, laterne: 1, stechpalme: 1 } },
      { m: { rotkehlchen: 1, schlitten: 1, stechpalme: 1, hase: 1 } },
    ],
  },
  fruehlingswiese: {
    himmel: ['#bfe3f6', '#eef8fd'], besonders: 'regenbogen',
    reihen: [
      { m: { schmetterling: 1, biene: 1, schwalbe: 1 } },
      { m: { bluetenbaum: 3, hase: 1 } },
      { m: { bluetenbaum: 2, hase: 1, tulpe: 1, vogelnest: 1 } },
      { m: { tulpe: 1, hase: 1, frosch: 1, vogelnest: 1, gaensebluemchen: 1, loewenzahn: 1 } },
      { m: { tulpe: 1, gaensebluemchen: 1, marienkaefer: 1, schnecke: 1, frosch: 1, loewenzahn: 1 } },
      { m: { marienkaefer: 1, schnecke: 1, gaensebluemchen: 1, frosch: 1 } },
    ],
  },
  sommersee: {
    himmel: ['#93cdf0', '#dff1fb'], besonders: 'libelle',
    reihen: [
      { m: { moewe: 1, schmetterling: 1, biene: 1 } },
      { m: { baum: 2, schilf: 1 } },
      { zone: 'wasser', m: { segelboot: 1, schwan: 1, ente: 1, seerose: 1 } },
      { zone: 'wasser', m: { ente: 1, seerose: 1, fisch: 1, schwan: 1 } },
      { m: { sandburg: 1, frosch: 1, muschel: 1, schilf: 1 } },
      { m: { muschel: 1, sandburg: 1, frosch: 1 } },
    ],
  },
};

// --- Plätze: 6 am Himmel, dann fünf Reihen von hinten nach vorn (10, 9, 8, 7, 5) ---
const HIMMEL = [[262, 132], [410, 214], [548, 112], [690, 204], [826, 128], [930, 224]];
const REIHEN = [{ n: 10, y: 336, k: 0.5 }, { n: 9, y: 396, k: 0.64 }, { n: 8, y: 456, k: 0.78 }, { n: 7, y: 516, k: 0.92 }, { n: 5, y: 576, k: 1.06 }];
const PLAETZE_ROH = (() => {
  const roh = HIMMEL.map(([x, y]) => ({ x, y, k: 0.74, reihe: 0 }));
  let z = 7;
  const zufall = () => { z = (z * 1103515245 + 12345) & 0x7fffffff; return z / 0x7fffffff; };
  REIHEN.forEach((r, ri) => {
    const rand = 46 + ri * 8;
    for (let j = 0; j < r.n; j++) {
      const x = rand + ((1000 - 2 * rand) * (j + 0.5 + (ri % 2 ? 0.18 : -0.18))) / r.n + (zufall() - 0.5) * 26;
      roh.push({ x: Math.round(x), y: Math.round(r.y + (zufall() - 0.5) * 14), k: r.k, reihe: ri + 1 });
    }
  });
  return roh;
})();
// Füllreihenfolge: die Reihen wechseln sich ab (zuerst vorne in der Mitte), in jeder Reihe der Platz, der am weitesten
// von allen schon besetzten entfernt ist. So wächst das Bild gleichmässig, und aufeinanderfolgende Teile stehen nicht beieinander.
const PLAETZE = (() => {
  const d = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.8);
  const VORZUG = [0.7, 0.5, 0.4, 0.2, 0, 0.3];   // Himmel, Reihe 1 (hinten) … Reihe 5 (vorn)
  const rest = PLAETZE_ROH.slice();
  const genommen = VORZUG.map(() => 0);
  const anzahl = VORZUG.map((_, r) => rest.filter((p) => p.reihe === r).length);
  const aus = [];
  while (rest.length) {
    let reihe = -1, bestQ = Infinity;
    VORZUG.forEach((v, r) => { if (genommen[r] < anzahl[r]) { const q = (genommen[r] + v) / anzahl[r]; if (q < bestQ) { bestQ = q; reihe = r; } } });
    let best = null, bestD = -Infinity;
    for (const p of rest) {
      if (p.reihe !== reihe) continue;
      const m = aus.length ? Math.min(...aus.map((q) => d(p, q))) : -Math.abs(p.x - 500);
      if (m > bestD) { bestD = m; best = p; }
    }
    aus.push(best); rest.splice(rest.indexOf(best), 1); genommen[reihe]++;
  }
  return aus;
})();
// Motiv je Platz und Szene: das im Verhältnis zum Gewicht seltenste, möglichst anders als die Nachbarn
const MOTIVE = Object.fromEntries(Object.entries(SZENEN).map(([name, sz]) => {
  const zaehl = {};
  const liste = [];
  PLAETZE.forEach((p, i) => {
    const m = sz.reihen[p.reihe].m;
    const nah = new Set(PLAETZE.slice(0, i).filter((q, j) => liste[j] && Math.hypot(q.x - p.x, (q.y - p.y) * 1.6) < 190).map((q) => liste[PLAETZE.indexOf(q)]));
    const kand = Object.keys(m).sort((a, b) => ((zaehl[a] || 0) / m[a] - (zaehl[b] || 0) / m[b]) || (nah.has(a) - nah.has(b)));
    const wahl = kand.find((x) => !nah.has(x)) || kand[0];
    zaehl[wahl] = (zaehl[wahl] || 0) + 1;
    liste.push(wahl);
  });
  return [name, liste];
}));

function motivSchluessel(szene, teil) {
  const sz = SZENEN[szene] ? szene : 'herbstwald';
  if (teil.art === 'besonders') return SZENEN[sz].besonders;
  return MOTIVE[sz][((teil.nr ?? 0) % TEILE_PRO_SZENE + TEILE_PRO_SZENE) % TEILE_PRO_SZENE];
}
export function teilName(szene, teil) { return NAME[motivSchluessel(szene, teil)] || 'ein Teil'; }

// --- Hintergründe ---
function hintergrund(szene, id) {
  const H = SZENEN[szene].himmel;
  const himmel = s('linearGradient', { id: id + 'h', x1: 0, y1: 0, x2: 0, y2: 1 },
    s('stop', { offset: 0, 'stop-color': H[0] }), s('stop', { offset: 0.55, 'stop-color': H[1] }));
  const k = [s('defs', {}, himmel,
    s('radialGradient', { id: id + 'g' },
      s('stop', { offset: 0, 'stop-color': '#fff7b8', 'stop-opacity': 1 }),
      s('stop', { offset: 0.42, 'stop-color': '#ffe36b', 'stop-opacity': 0.55 }),
      s('stop', { offset: 1, 'stop-color': '#ffe36b', 'stop-opacity': 0 })),
    s('radialGradient', { id: id + 's' },
      s('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': 0.75 }),
      s('stop', { offset: 1, 'stop-color': '#ffffff', 'stop-opacity': 0 }))),
  R(0, 0, 1000, 600, `url(#${id}h)`)];
  const wolke = (x, y, f, farbe = '#ffffff', op = 0.85) => G(`translate(${x} ${y}) scale(${f})`, E(0, 0, 46, 15, farbe, { opacity: op }), C(-16, -8, 17, farbe, { opacity: op }), C(12, -12, 21, farbe, { opacity: op }));
  if (szene === 'herbstwald') {
    k.push(C(112, 92, 72, `url(#${id}s)`), C(112, 92, 38, '#f4b942'));
    k.push(wolke(380, 70, 1.1, '#fff8ea'), wolke(760, 58, 0.9, '#fff8ea'));
    k.push(P('M0 300 Q120 228 262 268 Q400 306 520 250 Q680 188 820 258 Q920 298 1000 268 L1000 600 L0 600 Z', '#dfbd84'));
    for (const [x, y, r, f] of [[70, 286, 15, '#cf9a5a'], [96, 280, 18, '#c48a4c'], [610, 230, 14, '#cf9a5a'], [640, 222, 17, '#c48a4c'], [668, 228, 13, '#d8a868'], [880, 270, 16, '#c48a4c'], [906, 276, 12, '#cf9a5a'], [300, 276, 12, '#d8a868']]) k.push(R(x - 2, y, 4, 14, '#a8784a'), C(x, y - 2, r, f));
    k.push(P('M0 328 Q250 300 500 318 Q760 338 1000 310 L1000 600 L0 600 Z', '#c4b46c'));
    k.push(P('M0 470 Q300 440 600 466 Q820 484 1000 458 L1000 600 L0 600 Z', '#b6a65e'));
    for (const [x, y, c, r] of [[150, 380, '#d98a3a', 20], [420, 430, '#c9541f', -30], [700, 400, '#e8a23a', 50], [860, 500, '#d98a3a', 10], [260, 540, '#c9541f', 70], [560, 560, '#e8a23a', -40], [80, 470, '#e8a23a', 30], [960, 380, '#c9541f', -20]]) k.push(blatt(x, y, r, c, 7));
  } else if (szene === 'winterwald') {
    k.push(C(112, 92, 64, `url(#${id}s)`), C(112, 92, 34, '#fdf3c8'));
    k.push(wolke(400, 72, 1.05), wolke(770, 60, 0.9));
    k.push(P('M0 296 Q140 232 290 272 Q420 304 540 254 Q690 196 830 262 Q930 300 1000 272 L1000 600 L0 600 Z', '#e1ebf4'));
    for (const [x, y, f] of [[60, 290, 0.32], [92, 282, 0.38], [600, 240, 0.3], [630, 232, 0.36], [662, 240, 0.3], [880, 270, 0.34], [912, 278, 0.28], [320, 282, 0.28]]) k.push(G(`translate(${x} ${y + 14}) scale(${f})`, P('M0 -120 L-40 -10 L40 -10 Z', '#b7cde0'), R(-5, -10, 10, 12, '#a3b8cb')));
    k.push(P('M0 328 Q250 302 500 318 Q760 336 1000 310 L1000 600 L0 600 Z', '#edf3f9'));
    k.push(P('M0 470 Q300 442 600 466 Q820 484 1000 458 L1000 600 L0 600 Z', '#f7fafd'));
    k.push(P('M0 470 Q300 442 600 466 Q820 484 1000 458', 'none', { stroke: '#dbe6f1', 'stroke-width': 3 }));
    for (const [x, y, r] of [[180, 40, 3], [320, 150, 2.5], [470, 60, 3], [620, 130, 2.5], [930, 70, 3], [880, 180, 2], [60, 200, 2.5], [520, 230, 2], [740, 110, 2.2], [240, 230, 2]]) k.push(C(x, y, r, '#ffffff', { opacity: 0.9 }));
  } else if (szene === 'fruehlingswiese') {
    k.push(C(112, 92, 72, `url(#${id}s)`), C(112, 92, 38, '#ffd75a'));
    k.push(wolke(390, 70, 1.1), wolke(770, 56, 0.95));
    k.push(P('M0 298 Q130 230 276 270 Q410 306 530 252 Q684 190 826 260 Q926 300 1000 270 L1000 600 L0 600 Z', '#bfe0a2'));
    for (const [x, y, r, f] of [[70, 284, 15, '#a6d08a'], [96, 278, 18, '#9cc882'], [612, 228, 14, '#f2bcd0'], [640, 220, 17, '#a6d08a'], [670, 226, 13, '#f2bcd0'], [882, 268, 16, '#9cc882'], [908, 274, 12, '#f2bcd0'], [302, 274, 12, '#a6d08a']]) k.push(R(x - 2, y, 4, 14, '#9a7a5a'), C(x, y - 2, r, f));
    k.push(P('M0 328 Q250 300 500 318 Q760 336 1000 310 L1000 600 L0 600 Z', '#a5d47f'));
    k.push(P('M0 470 Q300 440 600 466 Q820 484 1000 458 L1000 600 L0 600 Z', '#93c96e'));
    for (const [x, y, c] of [[140, 372, '#ffffff'], [180, 410, '#f4c542'], [420, 380, '#f5b5cb'], [700, 430, '#ffffff'], [860, 392, '#f4c542'], [300, 500, '#ffffff'], [620, 540, '#f5b5cb'], [90, 560, '#f4c542'], [940, 530, '#ffffff'], [500, 420, '#ffffff'], [770, 560, '#f4c542']]) k.push(C(x, y, 3.2, c));
  } else {
    k.push(C(112, 88, 80, `url(#${id}s)`), C(112, 88, 40, '#ffcf3a'));
    k.push(wolke(400, 66, 1.05), wolke(780, 54, 0.9));
    k.push(P('M180 300 L300 196 L360 240 L460 150 L560 236 L620 206 L740 300 Z', '#a9bfd0'));
    k.push(P('M300 196 L326 218 L340 210 L360 240 L342 226 L320 232 Z', '#f4f8fc'), P('M460 150 L496 182 L486 186 L512 194 L490 200 L470 184 L446 190 L432 176 Z', '#f4f8fc'), P('M620 206 L650 230 L632 230 L610 222 Z', '#f4f8fc'));
    k.push(P('M600 300 L760 214 L860 280 L1000 236 L1000 300 Z', '#b7cad8'), P('M760 214 L790 232 L774 236 L748 222 Z', '#f4f8fc'));
    k.push(P('M0 300 Q300 284 600 298 Q820 306 1000 292 L1000 362 L0 362 Z', '#86b96a'));
    k.push(P('M0 352 Q260 340 520 350 Q780 360 1000 346 L1000 504 Q760 494 500 502 Q250 510 0 496 Z', '#5aa7d6'));
    for (const [x, y, w] of [[120, 380, 60], [360, 420, 80], [640, 386, 70], [860, 440, 60], [220, 470, 50], [540, 474, 64], [760, 476, 40]]) k.push(L(`M${x} ${y} l${w} 0`, '#8cc6e8', 2.4));
    k.push(P('M0 496 Q250 510 500 502 Q760 494 1000 504 L1000 600 L0 600 Z', '#ecd59a'));
    k.push(P('M0 560 Q300 548 620 562 Q840 570 1000 556 L1000 600 L0 600 Z', '#e4c985'));
    k.push(P('M0 496 Q250 510 500 502 Q760 494 1000 504', 'none', { stroke: '#f7f0d8', 'stroke-width': 3 }));
  }
  return k;
}

let zaehler = 0;
export function sammelbild(szene, teile = [], { neu = null, klein = false } = {}) {
  const sz = SZENEN[szene] ? szene : 'herbstwald';
  const id = `sbild${++zaehler}`;
  const glow = `url(#${id}g)`;
  const elemente = [];
  for (const teil of teile) {
    const nr = ((teil.nr ?? 0) % TEILE_PRO_SZENE + TEILE_PRO_SZENE) % TEILE_PRO_SZENE;
    const p = PLAETZE[nr];
    const reihe = SZENEN[sz].reihen[p.reihe];
    const key = motivSchluessel(sz, teil);
    const besonders = teil.art === 'besonders';
    let inhalt;
    if (besonders) inhalt = B[key](glow);
    else if (key === 'eule') inhalt = M.eule(sz === 'winterwald');
    else if (key === 'laterne') inhalt = M.laterne(glow);
    else if (key === 'schmetterling') inhalt = sz === 'sommersee' ? M.schmetterling('#3a8fd2', '#8fd0f5') : M.schmetterling();
    else if (key === 'frosch') inhalt = M.frosch(sz === 'sommersee');
    else inhalt = M[key]();
    // Schatten am Boden (nicht am Himmel, nicht auf dem Wasser)
    const boden = p.reihe > 0 && reihe.zone !== 'wasser' && !besonders;
    const schatten = boden ? E(0, 0, 30, 4.5, 'rgba(40,40,20,.13)') : null;
    const k = besonders ? Math.max(p.k, 0.7) : p.k;   // Besonderes auch hinten gut sichtbar
    const g = s('g', { class: 'teil' + (besonders ? ' besonders' : '') + (teil.id && teil.id === neu ? ' neu' : ''), transform: `translate(${p.x} ${p.y}) scale(${k.toFixed(3)})`, 'data-nr': nr },
      s('g', {}, schatten, inhalt));
    elemente.push({ y: p.y, x: p.x, g });
  }
  elemente.sort((a, b) => a.y - b.y || a.x - b.x);
  const name = SZENEN_NAME[sz];
  return s('svg', { viewBox: '0 0 1000 600', class: 'sammelbild' + (klein ? ' klein' : ''), role: 'img', 'aria-label': `${name} mit ${teile.length} von ${TEILE_PRO_SZENE} Teilen`, preserveAspectRatio: 'xMidYMid meet' },
    hintergrund(sz, id), elemente.map((e) => e.g));
}

// Für Prüfungen: Motivliste und Plätze
export const _intern = { PLAETZE, MOTIVE, NAME, SZENEN, motivSchluessel };
