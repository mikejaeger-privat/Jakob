// Darstellungen der Mathematik wie in den Zürcher Lehrmitteln: Zehner- und Zwanzigerfeld, Würfel- und Fingerbilder,
// Plättchen, Dinge, Zehnerstreifen, Zahlenhaus, Schüttelbox, Zahlenstrahl, Rechenstrich, Zahlenmauer, Geld, Uhr, Waage,
// Strichliste, Bilddiagramm, Formen, Körper, Gitter, Spiegel, Längen, Zahlenreihe. Alles eigene SVG, keine Bilddateien.
//
// darstellung(v, opt) -> { el, felder, tippbare }
//   felder:   Antwortfelder für jedes '?' in Lesereihenfolge (die Aufgabe füllt sie)
//   tippbare: [{ el, wert }] für «antippen» (opt.tippbar)
import { h, s } from './dom.js';

export const FARBE = { rot: '#d8453b', blau: '#2f6fbf', gelb: '#f2c230', gruen: '#3f9a52', orange: '#ee8a2c', violett: '#8a55b5', braun: '#8a5a3c', schwarz: '#2b2b2b', weiss: '#ffffff', rosa: '#f29bc0' };

export function antwortfeld(i) {
  return h('span.af', { 'data-i': String(i), role: 'button', 'aria-label': 'Antwortfeld' });
}

export function darstellung(v, opt = {}) {
  if (!v) return null;
  const ctx = { felder: [], tippbare: [], opt };
  const f = ART[v.art];
  if (!f) throw new Error('Unbekannte Darstellung: ' + v.art);
  const el = f(v, ctx);
  el.classList.add('dst', 'dst-' + v.art);
  if (opt.klein) el.classList.add('klein');
  return { el, felder: ctx.felder, tippbare: ctx.tippbare };
}

const svg = (w, hgt, ...kinder) => s('svg', { viewBox: `0 0 ${w} ${hgt}`, class: 'dst-svg', 'aria-hidden': 'true' }, ...kinder);
const feld = (ctx) => { const el = antwortfeld(ctx.felder.length); ctx.felder.push(el); return el; };
const istFrage = (x) => x === '?';
const zahlOderFeld = (x, ctx, klasse = '') => (istFrage(x) ? feld(ctx) : h('span.dst-zahl' + klasse, String(x)));

// --- Plättchen in Feldern ---
// Belegung in Lesereihenfolge: zuerst rot, dann blau; anordnung 'reihen': rot oben, blau unten
export function belegung(v, reihen, spalten) {
  const n = reihen * spalten;
  const b = Array(n).fill(null);
  const rot = v.rot ?? 0, blau = v.blau ?? 0;
  if (v.anordnung === 'reihen') {
    for (let i = 0; i < rot; i++) b[i] = 'rot';
    for (let i = 0; i < blau; i++) b[spalten + i] = 'blau';
  } else {
    for (let i = 0; i < rot + blau && i < n; i++) b[i] = i < rot ? 'rot' : 'blau';
  }
  // weg: die letzten belegten Felder in Lesereihenfolge
  const belegt = b.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
  const weg = new Set(belegt.slice(belegt.length - (v.weg ?? 0)));
  return { b, weg };
}
// Zeichnet ein Feld mit Zellen; liefert auch die Zellen (für «menge-legen»)
export function feldSvg(reihen, spalten, b, weg = new Set()) {
  const Z = 44, L = 8, LUECKE5 = spalten > 5 ? 14 : 0;
  const breite = spalten * Z + (spalten - 1) * L + LUECKE5 + 16, hoehe = reihen * Z + (reihen - 1) * L + 16;
  const zellen = [], steine = [];
  const kinder = [s('rect', { x: 1, y: 1, width: breite - 2, height: hoehe - 2, rx: 12, class: 'feld-rand' })];
  for (let r = 0; r < reihen; r++) for (let c = 0; c < spalten; c++) {
    const i = r * spalten + c;
    const x = 8 + c * (Z + L) + (c >= 5 ? LUECKE5 : 0), y = 8 + r * (Z + L);
    const zelle = s('rect', { x, y, width: Z, height: Z, rx: 8, class: 'feld-zelle', 'data-i': String(i) });
    const stein = s('g', { class: 'pl' + (b[i] ? ' ' + b[i] : ' leer') + (weg.has(i) ? ' weg' : ''), 'data-i': String(i) },
      s('circle', { cx: x + Z / 2, cy: y + Z / 2, r: Z * 0.38 }),
      s('path', { d: `M${x + 10} ${y + Z - 10} L${x + Z - 10} ${y + 10}`, class: 'pl-strich' }));
    zellen.push(zelle); steine.push(stein);
    kinder.push(zelle, stein);
  }
  return { el: svg(breite, hoehe, ...kinder), zellen, steine };
}

const ART = {
  zehnerfeld(v) { const { b, weg } = belegung(v, 2, 5); return h('div', feldSvg(2, 5, b, weg).el); },
  zwanzigerfeld(v) { const { b, weg } = belegung(v, 2, 10); return h('div', feldSvg(2, 10, b, weg).el); },

  wuerfelbild(v) {
    const PUNKTE = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] };
    const wuerfel = (n) => svg(100, 100, s('rect', { x: 4, y: 4, width: 92, height: 92, rx: 18, class: 'wf' }),
      ...PUNKTE[n].map(([x, y]) => s('circle', { cx: 25 * x, cy: 25 * y, r: 9, class: 'wf-punkt' })));
    return h('div.wuerfelreihe', [].concat(v.n).map(wuerfel));
  },

  fingerbild(v) {
    // Zwei Hände, Daumen innen. Gezählt wird mit dem Daumen zuerst: linke Hand 1 bis 5, rechte Hand 6 bis 10.
    const hand = (n) => {
      const teile = [];
      // Zeige-, Mittel-, Ring-, kleiner Finger: [Mitte x, Länge]
      [[66, 56], [49, 62], [32, 56], [16, 44]].forEach(([x, lang], i) => {
        const l = i + 2 <= n ? lang : 12;
        teile.push(s('rect', { x: x - 7.5, y: 80 - l, width: 15, height: l + 16, rx: 7.5, class: 'fi' }));
      });
      const daumenOben = n >= 1;
      if (daumenOben) teile.push(s('rect', { x: 80, y: 58, width: 15, height: 46, rx: 7.5, transform: 'rotate(32 87 100)', class: 'fi' }));
      teile.push(s('rect', { x: 6, y: 76, width: 80, height: 62, rx: 24, class: 'fi' }));
      if (!daumenOben) teile.push(s('rect', { x: 44, y: 92, width: 40, height: 15, rx: 7.5, class: 'fi falt' }));
      return teile;
    };
    return h('div', svg(236, 142,
      s('g', {}, ...hand(Math.min(5, v.n))),
      s('g', { transform: 'translate(236 0) scale(-1 1)' }, ...hand(Math.max(0, v.n - 5)))));
  },

  plaettchen(v) {
    const rot = v.rot ?? 0, blau = v.blau ?? 0, n = rot + blau;
    const weg = v.weg ?? 0;
    const pos = [];
    if (v.anordnung === 'frei') {
      // feste, aus den Zahlen abgeleitete Streuung (gleiche Aufgabe = gleiches Bild)
      let a = (rot * 31 + blau * 17 + weg * 7 + 3) >>> 0;
      const zufall = () => { a = (Math.imul(a, 1103515245) + 12345) >>> 0; return (a >>> 8) / 16777216; };
      for (let i = 0; i < n; i++) {
        let p = null;
        for (let t = 0; t < 400; t++) {
          const q = { x: 30 + zufall() * 340, y: 30 + zufall() * 140 };
          if (pos.every((o) => Math.hypot(o.x - q.x, o.y - q.y) > (t > 300 ? 34 : 44))) { p = q; break; }
        }
        pos.push(p || { x: 30 + (i % 10) * 36, y: 30 + Math.floor(i / 10) * 40 });
      }
      const el = svg(400, 200, ...pos.map((p, i) => s('g', { class: 'pl ' + (i < rot ? 'rot' : 'blau') + (i >= n - weg ? ' weg' : '') },
        s('circle', { cx: p.x, cy: p.y, r: 17 }), s('path', { d: `M${p.x - 11} ${p.y + 11} L${p.x + 11} ${p.y - 11}`, class: 'pl-strich' }))));
      el.style.width = 'min(100%, 520px)';
      return h('div', el);
    }
    const B = 40;
    for (let i = 0; i < n; i++) pos.push({ x: 24 + i * B + Math.floor(i / 5) * 14, y: 26 });
    const breite = Math.max(24 + n * B + Math.floor((n - 1) / 5) * 14 + 6, 60);
    const el = svg(breite, 52, ...pos.map((p, i) => s('g', { class: 'pl ' + (i < rot ? 'rot' : 'blau') + (i >= n - weg ? ' weg' : '') },
      s('circle', { cx: p.x, cy: p.y, r: 16 }), s('path', { d: `M${p.x - 11} ${p.y + 11} L${p.x + 11} ${p.y - 11}`, class: 'pl-strich' }))));
    el.style.width = `min(100%, ${Math.round(breite * 1.5)}px)`;   // Plättchen immer gleich gross, egal wie viele
    return h('div', el);
  },

  dinge(v) {
    const gruppen = v.gruppen || [v.n];
    const weg = v.weg ?? 0;
    let i = 0;
    return h('div.dinge', gruppen.map((g) => h('div.dinge-gruppe', Array.from({ length: g }, () => {
      const istWeg = i++ >= v.n - weg;
      return h('span.ding' + (istWeg ? '.weg' : ''), v.bild);
    }))));
  },

  zehnerstreifen(v) {
    const Q = 22, kinder = [];
    for (let z = 0; z < v.zehner; z++) for (let k = 0; k < 10; k++) kinder.push(s('rect', { x: 10 + k * Q + (k >= 5 ? 6 : 0), y: 10 + z * (Q + 14), width: Q, height: Q, class: 'zs' }));
    const yE = 10 + v.zehner * (Q + 14);
    for (let k = 0; k < v.einer; k++) kinder.push(s('rect', { x: 10 + k * Q + (k >= 5 ? 6 : 0), y: yE, width: Q, height: Q, class: 'zs einer' }));
    const zeilen = v.zehner + (v.einer ? 1 : 0);
    return h('div', svg(10 * Q + 26, Math.max(1, zeilen) * (Q + 14) + 6, ...kinder));
  },

  zerlegungshaus(v, ctx) {
    return h('div.zhaus' + (v.zeilen.length > 4 ? '.viele' : ''),
      h('div.zhaus-dach', zahlOderFeld(v.dach, ctx)),
      h('div.zhaus-zeilen', v.zeilen.map((z) => h('div.zhaus-zeile', zahlOderFeld(z[0], ctx), zahlOderFeld(z[1], ctx)))));
  },

  schuettelbox(v) {
    const kinder = [s('rect', { x: 6, y: 30, width: 308, height: 110, rx: 14, class: 'sb-box' })];
    // sichtbare Plättchen links, Deckel rechts
    for (let i = 0; i < v.sichtbar; i++) kinder.push(s('circle', { cx: 36 + (i % 4) * 36, cy: 64 + Math.floor(i / 4) * 40, r: 16, class: 'sb-pl' }));
    kinder.push(s('rect', { x: 170, y: 22, width: 152, height: 126, rx: 14, class: 'sb-deckel' }));
    kinder.push(s('path', { d: 'M190 85 h112', class: 'sb-griff' }));
    kinder.push(s('circle', { cx: 160, cy: 22, r: 24, class: 'sb-zahl-bg' }), s('text', { x: 160, y: 32, class: 'sb-zahl' }, String(v.n)));
    return h('div', svg(320, 150, ...kinder));
  },

  zahlenstrahl(v, ctx) {
    const von = v.von, bis = v.bis, n = bis - von;
    const A = 30, B = Math.max(30, Math.min(56, 900 / n));
    const breite = A * 2 + n * B, Y = 70;
    const x = (z) => A + (z - von) * B;
    const beschriftet = (z) => v.beschrift === 'alle' || (v.beschrift === 'fuenfer' && z % 5 === 0) || (v.beschrift === 'enden' && (z === von || z === bis))
      || (Array.isArray(v.beschrift) && v.beschrift.includes(z)) || (!v.beschrift && (z % 5 === 0 || z === von || z === bis));
    const kinder = [s('path', { d: `M${A - 16} ${Y} H${breite - A + 18}`, class: 'zst-linie' }), s('path', { d: `M${breite - A + 10} ${Y - 7} L${breite - A + 20} ${Y} L${breite - A + 10} ${Y + 7}`, class: 'zst-linie' })];
    for (let z = von; z <= bis; z++) {
      const gross = z % 10 === 0 ? 16 : z % 5 === 0 ? 12 : 8;
      kinder.push(s('path', { d: `M${x(z)} ${Y - gross} V${Y + gross}`, class: 'zst-strich' + (z % 5 === 0 ? ' fuenf' : '') }));
      if (beschriftet(z)) kinder.push(s('text', { x: x(z), y: Y + 40, class: 'zst-text' }, String(z)));
    }
    for (const sp of v.spruenge || []) {
      const x1 = x(sp.von), x2 = x(sp.nach), hoch = Math.min(46, 16 + Math.abs(x2 - x1) / 4);
      kinder.push(s('path', { d: `M${x1} ${Y - 10} Q${(x1 + x2) / 2} ${Y - 10 - hoch * 2} ${x2} ${Y - 10}`, class: 'zst-bogen' }));
      const r = x2 > x1 ? -1 : 1;
      kinder.push(s('path', { d: `M${x2 + r * 9} ${Y - 20} L${x2} ${Y - 10} L${x2 + r * 11} ${Y - 9}`, class: 'zst-bogen' }));
    }
    const ueber = [];
    for (const m of v.marken || []) {
      kinder.push(s('path', { d: `M${x(m.x)} ${Y - 22} L${x(m.x) - 9} ${Y - 38} H${x(m.x) + 9} Z`, class: 'zst-marke' }));
      if (m.text !== undefined && m.text !== null && m.text !== '') {
        const pos = { left: `${(x(m.x) / breite) * 100}%` };
        const inhalt = istFrage(m.text) ? feld(ctx) : h('span.zst-markentext', String(m.text));
        ueber.push(h('div.zst-ueber', { style: pos }, inhalt));
      }
    }
    const svgEl = svg(breite, 120, ...kinder);
    if (ctx.opt.tippbar) {
      for (let z = von; z <= bis; z++) {
        const t = s('rect', { x: x(z) - B / 2, y: Y - 34, width: B, height: 76, class: 'tipp-ziel', 'data-wert': String(z) });
        svgEl.append(t); ctx.tippbare.push({ el: t, wert: String(z) });
      }
    }
    const el = h('div.zst' + (ueber.length ? '.mit-marken' : ''), svgEl, ...ueber);
    el.style.setProperty('--zst-breite', breite);
    return el;
  },

  rechenstrich(v) {
    const stationen = [v.start];
    for (const sp of v.spruenge) stationen.push(stationen.at(-1) + sp);
    const gesamt = v.spruenge.reduce((a, b) => a + Math.abs(b), 0) || 1;
    const breite = 640, A = 40, Y = 100;
    const pos = [A];
    for (const sp of v.spruenge) pos.push(pos.at(-1) + (Math.abs(sp) / gesamt) * (breite - 2 * A) * (Math.sign(sp) || 1));
    // Minus-Sprünge laufen nach links: alles verschieben, damit es Platz hat
    const minX = Math.min(...pos), versatz = A - minX;
    const P = pos.map((p) => p + versatz);
    const kinder = [s('path', { d: `M${A - 20} ${Y} H${breite - A + 20}`, class: 'zst-linie' })];
    v.spruenge.forEach((sp, i) => {
      const x1 = P[i], x2 = P[i + 1], hoch = 30 + Math.abs(x2 - x1) / 6;
      kinder.push(s('path', { d: `M${x1} ${Y - 4} Q${(x1 + x2) / 2} ${Y - hoch * 2} ${x2} ${Y - 4}`, class: 'zst-bogen' }));
      const r = x2 > x1 ? -1 : 1;
      kinder.push(s('path', { d: `M${x2 + r * 10} ${Y - 15} L${x2} ${Y - 4} L${x2 + r * 13} ${Y - 2}`, class: 'zst-bogen' }));
      kinder.push(s('text', { x: (x1 + x2) / 2, y: Y - hoch - 10, class: 'rs-sprung' }, (sp >= 0 ? '+' : '−') + Math.abs(sp)));
    });
    P.forEach((x, i) => {
      kinder.push(s('path', { d: `M${x} ${Y - 10} V${Y + 10}`, class: 'zst-strich' }));
      if (v.beschrift) kinder.push(s('text', { x, y: Y + 40, class: 'zst-text' }, String(stationen[i])));
    });
    return h('div', svg(breite, 150, ...kinder));
  },

  zahlenmauer(v, ctx) {
    return h('div.zmauer', v.reihen.map((reihe) => h('div.zm-reihe', reihe.map((x) => h('div.zm-stein', zahlOderFeld(x, ctx))))));
  },

  geld(v) {
    return h('div.geld', v.stuecke.map((st) => geldstueck(st.wert, st.art)));
  },

  uhr(v) {
    const kinder = [s('circle', { cx: 100, cy: 100, r: 92, class: 'uhr-rand' })];
    for (let i = 1; i <= 12; i++) {
      const w = (i / 12) * Math.PI * 2;
      kinder.push(s('text', { x: 100 + Math.sin(w) * 70, y: 100 - Math.cos(w) * 70 + 9, class: 'uhr-zahl' }, String(i)));
    }
    for (let i = 0; i < 60; i++) {
      const w = (i / 60) * Math.PI * 2, r1 = i % 5 === 0 ? 82 : 86;
      kinder.push(s('path', { d: `M${100 + Math.sin(w) * r1} ${100 - Math.cos(w) * r1} L${100 + Math.sin(w) * 90} ${100 - Math.cos(w) * 90}`, class: 'uhr-strich' }));
    }
    const wh = (((v.h % 12) + v.m / 60) / 12) * 360, wm = (v.m / 60) * 360;
    kinder.push(s('path', { d: 'M100 108 V52', class: 'uhr-std', transform: `rotate(${wh} 100 100)` }));
    kinder.push(s('path', { d: 'M100 112 V24', class: 'uhr-min', transform: `rotate(${wm} 100 100)` }));
    kinder.push(s('circle', { cx: 100, cy: 100, r: 6, class: 'uhr-mitte' }));
    return h('div', svg(200, 200, ...kinder));
  },

  waage(v) {
    if (v.zweite) return h('div.waagen', ART.waage({ ...v, zweite: null }), ART.waage({ art: 'waage', ...v.zweite }));
    const w = v.neigung === 'links' ? -12 : v.neigung === 'rechts' ? 12 : 0;
    const rad = (w * Math.PI) / 180;
    const lx = 200 - Math.cos(rad) * 130, ly = 70 - Math.sin(rad) * 130;
    const rx = 200 + Math.cos(rad) * 130, ry = 70 + Math.sin(rad) * 130;
    const schale = (x, y, bild) => s('g', {},
      s('path', { d: `M${x} ${y} L${x - 46} ${y + 70} M${x} ${y} L${x + 46} ${y + 70}`, class: 'wg-seil' }),
      s('path', { d: `M${x - 58} ${y + 70} H${x + 58} Q${x} ${y + 100} ${x - 58} ${y + 70} Z`, class: 'wg-schale' }),
      s('text', { x, y: y + 64, class: 'wg-bild' }, bild));
    return h('div', svg(400, 220,
      s('path', { d: 'M200 70 L176 210 H224 Z', class: 'wg-fuss' }),
      s('path', { d: `M${lx} ${ly} L${rx} ${ry}`, class: 'wg-balken' }),
      s('circle', { cx: 200, cy: 70, r: 9, class: 'wg-achse' }),
      schale(lx, ly, v.links), schale(rx, ry, v.rechts)));
  },

  strichliste(v) {
    return h('div.strichliste', v.zeilen.map((z) => h('div.sl-zeile', h('span.sl-bild', z.bild), h('span.sl-striche', striche(z.n)))));
  },

  bilddiagramm(v) {
    // Säulen aus Bildern, unten das Bild als Beschriftung; Linien bei jedem fünften helfen beim Zählen
    const max = Math.max(...v.spalten.map((x) => x.n));
    return h('div.bilddiagramm', { style: { '--zeilen': String(max) } }, v.spalten.map((sp) => h('div.bd-spalte',
      h('div.bd-saeule', Array.from({ length: sp.n }, (_, k) => h('span.bd-bild' + ((k + 1) % 5 === 0 ? '.fuenf' : ''), sp.bild))),
      h('div.bd-name', sp.bild))));
  },

  formen(v, ctx) {
    const W = 500, H = 300;
    const kinder = v.liste.map((f, i) => {
      const g = form(f.form, (f.groesse ?? 1) * 30, FARBE[f.farbe] || f.farbe || '#888');
      g.setAttribute('transform', `translate(${f.x * W} ${f.y * H}) rotate(${f.drehung ?? 0})`);
      if (ctx.opt.tippbar) { g.classList.add('tipp-form'); g.setAttribute('data-wert', String(i)); ctx.tippbare.push({ el: g, wert: String(i) }); }
      return g;
    });
    return h('div', svg(W, H, ...kinder));
  },

  koerper(v) { return h('div', koerperSvg(v.form)); },

  gitter(v, ctx) {
    const Z = 64, W = v.b * Z, H = v.h * Z;
    const kinder = [];
    for (let y = 0; y < v.h; y++) for (let x = 0; x < v.b; x++) {
      const r = s('rect', { x: x * Z + 2, y: y * Z + 2, width: Z - 4, height: Z - 4, rx: 8, class: 'gt-zelle' });
      kinder.push(r);
      if (ctx.opt.tippbar) { r.classList.add('tipp-zelle'); r.setAttribute('data-wert', `${x},${y}`); ctx.tippbare.push({ el: r, wert: `${x},${y}` }); }
    }
    const emoji = (x, y, t, k = '') => s('text', { x: x * Z + Z / 2, y: y * Z + Z / 2 + 14, class: 'gt-bild ' + k }, t);
    for (const [x, y] of v.hindernisse || []) kinder.push(s('path', { d: `M${x * Z + 12} ${y * Z + Z - 14} C${x * Z + 8} ${y * Z + 26} ${x * Z + 24} ${y * Z + 14} ${x * Z + 36} ${y * Z + 16} C${x * Z + 52} ${y * Z + 18} ${x * Z + 58} ${y * Z + 34} ${x * Z + 52} ${y * Z + Z - 14} Z`, class: 'gt-stein' }));
    for (const z of v.ziele || []) kinder.push(emoji(z.x, z.y, z.bild));
    if (v.start) kinder.push(emoji(v.start[0], v.start[1], '🦊', 'start'));
    const bild = svg(W + 4, H + 4, ...kinder);
    bild.style.width = `min(100%, ${Math.round((W + 4) * 0.95)}px)`;
    const el = h('div.gitter', bild);
    if (v.pfeile?.length) el.append(h('div.gt-pfeile', v.pfeile.map((p) => pfeilSymbol(p))));
    return el;
  },

  spiegel(v, ctx) {
    const Z = 52, W = v.b * Z, H = v.h * Z;
    const figur = new Set(v.figur.map(([x, y]) => `${x},${y}`));
    const kinder = [];
    for (let y = 0; y < v.h; y++) for (let x = 0; x < v.b; x++) {
      const r = s('rect', { x: x * Z + 2, y: y * Z + 2, width: Z - 4, height: Z - 4, rx: 6, class: 'sp-zelle' + (figur.has(`${x},${y}`) ? ' voll' : '') });
      kinder.push(r);
      if (ctx.opt.tippbar && x >= v.achse) { r.classList.add('tipp-zelle'); r.setAttribute('data-wert', `${x},${y}`); ctx.tippbare.push({ el: r, wert: `${x},${y}` }); }
    }
    if (v.achse !== undefined && v.achse !== null) kinder.push(s('path', { d: `M${v.achse * Z} -6 V${H + 6}`, class: 'sp-achse' }));
    const bild = svg(W + 4, H + 4, ...kinder);
    bild.style.width = `min(100%, ${Math.round((W + 4) * (ctx.opt.klein ? 0.6 : 1))}px)`;
    return h('div', bild);
  },

  laengen(v, ctx) {
    const E = v.einheit === 'cm' ? 30 : 34;
    const max = Math.max(...v.staebe.map((x) => x.laenge), v.einheit === 'cm' ? 0 : 1);
    const spalten = v.einheit === 'cm' ? Math.max(max, v.massstab ?? max) : max + 1;
    const breite = 20 + spalten * E + 20, kinder = [];
    const zeilenH = 42;
    if (v.einheit !== 'cm') {
      for (let y = 0; y < v.staebe.length; y++) for (let x = 0; x < spalten; x++) kinder.push(s('rect', { x: 20 + x * E, y: 10 + y * zeilenH, width: E, height: zeilenH, class: 'lg-kaestchen' }));
    }
    v.staebe.forEach((st, y) => kinder.push(s('rect', { x: 20, y: 18 + y * zeilenH, width: st.laenge * E, height: zeilenH - 16, rx: 6, fill: FARBE[st.farbe] || '#c66', class: 'lg-stab' })));
    let hoehe = 14 + v.staebe.length * zeilenH;
    if (v.einheit === 'cm') {
      const y0 = hoehe + 4;
      kinder.push(s('rect', { x: 8, y: y0, width: spalten * E + 24, height: 54, rx: 6, class: 'lg-massstab' }));
      for (let k = 0; k <= spalten; k++) {
        kinder.push(s('path', { d: `M${20 + k * E} ${y0} V${y0 + (k % 5 === 0 ? 22 : 14)}`, class: 'lg-strich' }));
        kinder.push(s('text', { x: 20 + k * E, y: y0 + 44, class: 'lg-zahl' }, String(k)));
      }
      hoehe = y0 + 60;
    }
    const el = svg(breite, hoehe, ...kinder);
    el.style.width = `min(100%, ${Math.round(breite * (ctx.opt.klein ? 0.7 : 1.6))}px)`;   // gleiche Kästchengrösse in allen Karten
    return h('div', el);
  },

  reihe(v, ctx) {
    return h('div.zreihe', v.teile.map((t) => (istFrage(t) ? h('div.zr-stein.frage', feld(ctx)) : h('div.zr-stein', h('span.dst-zahl', String(t))))));
  },
};

// --- Einzelteile ---
export function striche(n) {
  const buendel = [];
  for (let i = 0; i < n; i += 5) {
    const k = Math.min(5, n - i);
    const linien = [];
    for (let j = 0; j < Math.min(4, k); j++) linien.push(s('path', { d: `M${8 + j * 11} 6 V44`, class: 'sl-strich' }));
    if (k === 5) linien.push(s('path', { d: 'M2 38 L50 12', class: 'sl-strich' }));
    buendel.push(s('svg', { viewBox: '0 0 54 50', class: 'sl-buendel', 'aria-hidden': 'true' }, ...linien));
  }
  return buendel;
}

const MUENZE = { 5: [34, 'gold'], 10: [38, 'silber'], 20: [42, 'silber'], 50: [32, 'silber'], 100: [46, 'silber'], 200: [54, 'silber'], 500: [62, 'silber'] };
export function geldstueck(wert, art) {
  const text = wert >= 100 ? `${wert / 100} Fr.` : `${wert} Rp.`;
  if (art === 'note' || wert >= 1000) {
    return h('span.note' + (wert === 1000 ? '.zehn' : '.zwanzig'), { 'aria-label': text }, svg(150, 80,
      s('rect', { x: 2, y: 2, width: 146, height: 76, rx: 8, class: 'nt-flaeche' }),
      s('circle', { cx: 112, cy: 40, r: 22, class: 'nt-kreis' }),
      s('text', { x: 50, y: 50, class: 'nt-text' }, String(wert / 100)),
      s('text', { x: 112, y: 47, class: 'nt-klein' }, 'Fr.')));
  }
  const [d, metall] = MUENZE[wert] || [40, 'silber'];
  return h('span.muenze.' + metall, { 'aria-label': text, style: { '--d': d } }, svg(100, 100,
    s('circle', { cx: 50, cy: 50, r: 47, class: 'mz-rand' }),
    s('circle', { cx: 50, cy: 50, r: 40, class: 'mz-innen' }),
    s('text', { x: 50, y: wert >= 100 ? 58 : 55, class: 'mz-zahl' + (wert >= 100 ? '' : ' rp') }, String(wert >= 100 ? wert / 100 : wert)),
    s('text', { x: 50, y: wert >= 100 ? 80 : 76, class: 'mz-einheit' }, wert >= 100 ? 'Fr.' : 'Rp.')));
}

export function form(name, r, farbe) {
  const g = s('g', { class: 'form' });
  const a = { fill: farbe, class: 'form-flaeche' };
  if (name === 'kreis') g.append(s('circle', { cx: 0, cy: 0, r, ...a }));
  else if (name === 'quadrat') g.append(s('rect', { x: -r * 0.9, y: -r * 0.9, width: r * 1.8, height: r * 1.8, rx: 2, ...a }));
  else if (name === 'rechteck') g.append(s('rect', { x: -r * 1.4, y: -r * 0.7, width: r * 2.8, height: r * 1.4, rx: 2, ...a }));
  else if (name === 'dreieck') g.append(s('path', { d: `M0 ${-r * 1.05} L${r * 1.1} ${r * 0.85} L${-r * 1.1} ${r * 0.85} Z`, ...a }));
  else if (name === 'stern') g.append(s('path', { d: sternPfad(r), ...a }));
  else g.append(s('circle', { cx: 0, cy: 0, r, ...a }));
  return g;
}
function sternPfad(r) {
  const p = [];
  for (let i = 0; i < 10; i++) { const w = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; p.push(`${Math.cos(w) * rr} ${Math.sin(w) * rr}`); }
  return 'M' + p.join(' L') + ' Z';
}
// Kleines Element eines Musters: { farbe, form } oder eine Zahl
export function musterElement(e) {
  if (e && typeof e === 'object') return h('span.mu-el', svg(60, 60, (() => { const g = form(e.form || 'kreis', 22, FARBE[e.farbe] || '#888'); g.setAttribute('transform', 'translate(30 30)'); return g; })()));
  return h('span.mu-el.zahl', String(e));
}

function koerperSvg(name) {
  const k = { class: 'kp' };
  if (name === 'kugel') return svg(160, 160, s('circle', { cx: 80, cy: 80, r: 62, class: 'kp kugel' }), s('ellipse', { cx: 80, cy: 80, rx: 62, ry: 18, class: 'kp-linie' }), s('circle', { cx: 58, cy: 58, r: 14, class: 'kp-licht' }));
  if (name === 'wuerfel') return svg(160, 160, s('path', { d: 'M30 55 L100 55 L100 125 L30 125 Z', class: 'kp vorn' }), s('path', { d: 'M30 55 L60 30 L130 30 L100 55 Z', class: 'kp oben' }), s('path', { d: 'M100 55 L130 30 L130 100 L100 125 Z', class: 'kp seite' }));
  if (name === 'quader') return svg(200, 160, s('path', { d: 'M20 65 L140 65 L140 125 L20 125 Z', class: 'kp vorn' }), s('path', { d: 'M20 65 L50 40 L170 40 L140 65 Z', class: 'kp oben' }), s('path', { d: 'M140 65 L170 40 L170 100 L140 125 Z', class: 'kp seite' }));
  if (name === 'zylinder') return svg(160, 170, s('path', { d: 'M30 40 V130 A50 16 0 0 0 130 130 V40 Z', class: 'kp vorn' }), s('ellipse', { cx: 80, cy: 40, rx: 50, ry: 16, class: 'kp oben' }));
  if (name === 'pyramide') return svg(160, 160, s('path', { d: 'M80 20 L30 125 L100 140 Z', class: 'kp vorn' }), s('path', { d: 'M80 20 L100 140 L135 112 Z', class: 'kp seite' }));
  if (name === 'kegel') return svg(160, 170, s('path', { d: 'M80 18 L30 130 A50 16 0 0 0 130 130 Z', class: 'kp vorn' }));
  return svg(160, 160, s('circle', { cx: 80, cy: 80, r: 60, ...k }));
}

const PFEIL_D = { rechts: 'M8 24 H38 M28 14 L39 24 L28 34', links: 'M40 24 H10 M20 14 L9 24 L20 34', oben: 'M24 40 V10 M14 20 L24 9 L34 20', unten: 'M24 8 V38 M14 28 L24 39 L34 28' };
export function pfeilSymbol(richtung) {
  return h('span.pfeil-k', { 'aria-label': 'Pfeil nach ' + richtung }, s('svg', { viewBox: '0 0 48 48', class: 'sym' }, s('path', { d: PFEIL_D[richtung] || PFEIL_D.rechts })));
}
