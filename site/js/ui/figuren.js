// Eigene SVG-Zeichnungen: der Fuchs, die Zeigehand, Bildsymbole für Knöpfe und Steine.
import { s } from './dom.js';

// --- Der Fuchs (sitzend, von vorn). stimmung: 'froh' | 'staunt' | 'schlaeft' | 'denkt' ---
export function fuchs({ stimmung = 'froh', klasse = '' } = {}) {
  const augen = stimmung === 'schlaeft'
    ? [s('path', { d: 'M75 74 Q82 80 89 74', class: 'fx-strich' }), s('path', { d: 'M111 74 Q118 80 125 74', class: 'fx-strich' })]
    : [s('ellipse', { cx: 82, cy: stimmung === 'denkt' ? 69 : 72, rx: 6.5, ry: 8.5, class: 'fx-dunkel' }),
       s('ellipse', { cx: 118, cy: stimmung === 'denkt' ? 69 : 72, rx: 6.5, ry: 8.5, class: 'fx-dunkel' }),
       s('circle', { cx: 84.5, cy: stimmung === 'denkt' ? 65.5 : 68.5, r: 2.4, class: 'fx-licht' }),
       s('circle', { cx: 120.5, cy: stimmung === 'denkt' ? 65.5 : 68.5, r: 2.4, class: 'fx-licht' })];
  const mund = stimmung === 'staunt'
    ? s('ellipse', { cx: 100, cy: 112, rx: 4, ry: 5, class: 'fx-dunkel' })
    : s('path', { d: 'M100 105 Q100 112 92 112 M100 105 Q100 112 108 112', class: 'fx-strich' });
  const zzz = stimmung === 'schlaeft'
    ? s('g', { class: 'fx-zzz' }, s('text', { x: 140, y: 36 }, 'z'), s('text', { x: 154, y: 20, class: 'klein' }, 'z'))
    : null;
  return s('svg', { viewBox: '0 0 200 220', class: 'fuchs ' + klasse, role: 'img', 'aria-label': 'Fuchs' },
    s('path', { d: 'M116 198 C172 204 200 160 188 116 C183 98 170 90 158 95 C171 132 158 168 110 177 Z', class: 'fx-fell' }),
    s('path', { d: 'M188 116 C183 98 170 90 158 95 C163 104 166 113 167 122 C174 119 181 117 188 116 Z', class: 'fx-creme' }),
    s('path', { d: 'M58 204 C50 162 66 120 100 116 C134 120 150 162 142 204 Z', class: 'fx-fell' }),
    s('ellipse', { cx: 100, cy: 172, rx: 24, ry: 31, class: 'fx-creme' }),
    s('ellipse', { cx: 83, cy: 203, rx: 13, ry: 7, class: 'fx-pfote' }),
    s('ellipse', { cx: 117, cy: 203, rx: 13, ry: 7, class: 'fx-pfote' }),
    s('path', { d: 'M62 62 L52 12 L92 40 Z', class: 'fx-fell' }),
    s('path', { d: 'M138 62 L148 12 L108 40 Z', class: 'fx-fell' }),
    s('path', { d: 'M65 54 L59 24 L83 40 Z', class: 'fx-ohr' }),
    s('path', { d: 'M135 54 L141 24 L117 40 Z', class: 'fx-ohr' }),
    s('path', { d: 'M56 70 C56 47 77 35 100 35 C123 35 144 47 144 70 C144 97 123 119 100 123 C77 119 56 97 56 70 Z', class: 'fx-fell' }),
    s('path', { d: 'M56 74 C70 73 85 82 100 97 C115 82 130 73 144 74 C142 101 123 121 100 123 C77 121 58 101 56 74 Z', class: 'fx-creme' }),
    augen,
    s('path', { d: 'M93 97 Q100 92 107 97 Q104 104 100 105 Q96 104 93 97 Z', class: 'fx-dunkel' }),
    mund, zzz);
}

// --- Zeigehand: Zeigefinger nach oben, Fingerspitze bei (24, 4) im Raster 48 × 64 ---
export function zeigehandSvg() {
  return s('svg', { viewBox: '0 0 48 64', class: 'zeigehand-svg', 'aria-hidden': 'true' },
    s('path', { class: 'zh-hand', d: 'M18 30 V9 a6 6 0 0 1 12 0 V27 l2-1 a5 5 0 0 1 6 4 l1 1 a5 5 0 0 1 7 4 V48 C46 57 39 62 30 62 H25 C17 62 12 57 9 50 L4 38 a4.5 4.5 0 0 1 8-4 L18 41 Z' }),
    s('path', { class: 'zh-linie', d: 'M30 27 V36 M38 31 V38' }));
}

// --- Bildsymbole (Linien, 48er Raster) ---
const PFADE = {
  lautsprecher: [['path', { d: 'M8 19 H16 L26 10 V38 L16 29 H8 Z', class: 'voll' }], ['path', { d: 'M32 17 a9 9 0 0 1 0 14 M37 11 a17 17 0 0 1 0 26' }]],
  frage: [['path', { d: 'M17 17 a7 7 0 1 1 10.5 6 c-2.6 1.6-3.5 3-3.5 6 V31' }], ['circle', { cx: 24, cy: 38, r: 2.6, class: 'voll' }]],
  pfeil: [['path', { d: 'M10 24 H36 M26 13 L37 24 L26 35' }]],
  haken: [['path', { d: 'M10 25 L20 35 L39 13' }]],
  schloss: [['path', { d: 'M15 22 V16 a9 9 0 0 1 18 0 V22' }], ['rect', { x: 10, y: 22, width: 28, height: 19, rx: 4, class: 'voll' }]],
  start: [['path', { d: 'M17 11 L38 24 L17 37 Z', class: 'voll' }]],
  haus: [['path', { d: 'M8 23 L24 9 L40 23 M13 20 V39 H35 V20' }], ['rect', { x: 20, y: 28, width: 8, height: 11, class: 'voll' }]],
  stern: [['path', { d: 'M24 6 L29 18 L42 19 L32 28 L35 41 L24 34 L13 41 L16 28 L6 19 L19 18 Z', class: 'voll' }]],
  karten: [['rect', { x: 9, y: 14, width: 22, height: 28, rx: 3 }], ['rect', { x: 17, y: 7, width: 22, height: 28, rx: 3, class: 'flaeche' }]],
  buch: [['path', { d: 'M6 12 C12 9 19 9 24 13 C29 9 36 9 42 12 V38 C36 35 29 35 24 39 C19 35 12 35 6 38 Z' }], ['path', { d: 'M24 13 V39' }], ['path', { d: 'M11 26 L14 18 L17 26 M12 23.5 H16', class: 'duenn' }]],
  wuerfel: [['rect', { x: 8, y: 8, width: 32, height: 32, rx: 7 }], ['circle', { cx: 16, cy: 16, r: 3, class: 'voll' }], ['circle', { cx: 32, cy: 16, r: 3, class: 'voll' }], ['circle', { cx: 24, cy: 24, r: 3, class: 'voll' }], ['circle', { cx: 16, cy: 32, r: 3, class: 'voll' }], ['circle', { cx: 32, cy: 32, r: 3, class: 'voll' }]],
  schatz: [['path', { d: 'M7 12 L17 8 L31 12 L41 8 V36 L31 40 L17 36 L7 40 Z' }], ['path', { d: 'M17 8 V36 M31 12 V40' }], ['path', { d: 'M21 22 L27 28 M27 22 L21 28', class: 'duenn' }]],
  lupe: [['circle', { cx: 20, cy: 20, r: 11 }], ['path', { d: 'M28 28 L40 40' }]],
  ohr: [['path', { d: 'M16 30 C10 22 12 8 24 8 C34 8 37 17 34 24 C32 29 27 30 27 35 C27 41 20 42 18 37' }], ['path', { d: 'M21 22 C21 17 28 16 28 21', class: 'duenn' }]],
  auge: [['path', { d: 'M5 24 C12 13 36 13 43 24 C36 35 12 35 5 24 Z' }], ['circle', { cx: 24, cy: 24, r: 6, class: 'voll' }]],
  finger: [['path', { d: 'M19 26 V10 a4 4 0 0 1 8 0 V24 l6 1 a4 4 0 0 1 4 4 V36 C37 42 32 44 27 44 H24 C19 44 16 41 14 36 L10 29 a3 3 0 0 1 5-3 Z' }]],
  stift: [['path', { d: 'M10 38 L13 29 L32 10 L38 16 L19 35 Z' }], ['path', { d: 'M10 38 L19 35 M28 14 L34 20', class: 'duenn' }]],
  hand: [['path', { d: 'M12 28 V16 a3 3 0 0 1 6 0 V24 V11 a3 3 0 0 1 6 0 V24 V13 a3 3 0 0 1 6 0 V25 V18 a3 3 0 0 1 6 0 V31 C36 39 31 43 25 43 C18 43 14 39 12 34 Z' }]],
  zaehlen: [['circle', { cx: 14, cy: 16, r: 5, class: 'voll' }], ['circle', { cx: 34, cy: 16, r: 5, class: 'voll' }], ['circle', { cx: 14, cy: 33, r: 5, class: 'voll' }], ['circle', { cx: 34, cy: 33, r: 5 }]],
  mond: [['path', { d: 'M31 8 A16 16 0 1 0 40 32 A13 13 0 0 1 31 8 Z', class: 'voll' }]],
};
export function symbol(name, { klasse = '', titel = null } = {}) {
  const teile = (PFADE[name] || PFADE.stern).map(([tag, a]) => s(tag, a));
  const attr = { viewBox: '0 0 48 48', class: 'sym sym-' + name + (klasse ? ' ' + klasse : '') };
  if (titel) { attr.role = 'img'; attr['aria-label'] = titel; } else attr['aria-hidden'] = 'true';
  return s('svg', attr, teile);
}
