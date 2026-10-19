// Erzeugt site/data/schrift/basisschrift.json: Nachspur-Vorlagen angelehnt an die unverbundene Deutschschweizer Basisschrift.
// Jedes Zeichen besteht aus Strichen in Schreibreihenfolge und -richtung (SVG-Pfad aus M, L, C) und daraus abgetasteten Punkten.
// Koordinaten: Höhe 100 = Oberlinie (0) bis Grundlinie (100), Mittellinie 50, Unterlänge bis 135.
// Aufruf: node tools/baue_schrift.mjs
import fs from 'node:fs';

// Ziffern 0 bis 9 (Etappe 3). Buchstaben folgen in Etappe 4.
// Annahme: Die 7 ohne Querstrich, die 1 mit kurzem Aufstrich (bei der Lehrperson zu prüfen).
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
};

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
