// Hintergrund des Kinderbereichs: eine Waldlichtung (nur Dekoration, ohne Bedeutung für Screenreader).
import { s } from './dom.js';

const tanne = (x, y, k) => s('g', { transform: `translate(${x} ${y}) scale(${k})`, class: 'ls-tanne' },
  s('path', { d: 'M0 -120 L34 -50 L18 -50 L44 0 L-44 0 L-18 -50 L-34 -50 Z' }), s('rect', { x: -6, y: 0, width: 12, height: 16, class: 'ls-stamm' }));
const laubbaum = (x, y, k) => s('g', { transform: `translate(${x} ${y}) scale(${k})`, class: 'ls-laub' },
  s('rect', { x: -7, y: -30, width: 14, height: 46, class: 'ls-stamm' }), s('circle', { cx: 0, cy: -62, r: 44 }), s('circle', { cx: -30, cy: -40, r: 26 }), s('circle', { cx: 30, cy: -42, r: 28 }));
const busch = (x, y, k) => s('g', { transform: `translate(${x} ${y}) scale(${k})`, class: 'ls-busch' },
  s('circle', { cx: -16, cy: -12, r: 18 }), s('circle', { cx: 8, cy: -18, r: 22 }), s('circle', { cx: 28, cy: -10, r: 15 }));

export function landschaft() {
  return s('svg', { class: 'landschaft', viewBox: '0 0 1200 420', preserveAspectRatio: 'xMidYMax slice', 'aria-hidden': 'true' },
    s('path', { d: 'M0 250 C180 180 380 210 560 230 C760 252 960 170 1200 210 V420 H0 Z', class: 'ls-huegel-fern' }),
    tanne(90, 250, 0.9), tanne(170, 236, 1.15), laubbaum(300, 238, 0.85), tanne(980, 214, 1.05), tanne(1060, 228, 0.85), laubbaum(1150, 222, 0.9),
    s('path', { d: 'M0 320 C220 270 420 300 640 300 C860 300 1000 268 1200 290 V420 H0 Z', class: 'ls-huegel-nah' }),
    busch(70, 330, 1.1), busch(1120, 318, 1.2), busch(620, 312, 0.7),
    s('path', { d: 'M0 380 C300 360 900 362 1200 378 V420 H0 Z', class: 'ls-wiese' }));
}
