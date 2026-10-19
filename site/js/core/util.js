// Hilfsfunktionen: Zufall mit Startwert, Tage, Schweizer Zahlformate, Textvergleich.

export function zufall(seed) {
  let a = (seed >>> 0) || 1;
  const next = () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    bool: (p = 0.5) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const b = arr.slice();
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
      }
      return b;
    },
    sample: (arr, n) => r.shuffle(arr).slice(0, n),
  };
  return r;
}

export function neuerSeed() {
  return (Math.floor(Math.random() * 4294967296) ^ Date.now()) >>> 0;
}

// --- Tage als ganze Zahlen (Tage seit 1970-01-01), unabhängig von Zeitzonen ---
export function tagNr(iso) {
  const [j, m, t] = iso.split('-').map(Number);
  return Math.round(Date.UTC(j, m - 1, t) / 86400000);
}
export function isoVonNr(nr) {
  return new Date(nr * 86400000).toISOString().slice(0, 10);
}
export function heuteNr(d = new Date()) {
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}
export function wochentag(nr) { // 0 = Montag … 6 = Sonntag
  return (((nr + 3) % 7) + 7) % 7;
}
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
export function datumText(nr, mitTag = false) {
  const d = new Date(nr * 86400000);
  const s = `${d.getUTCDate()}. ${MONATE[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return mitTag ? `${TAGE[wochentag(nr)]}, ${s}` : s;
}
export function datumKurz(nr) {
  const d = new Date(nr * 86400000);
  return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
}

// --- Schweizer Zahlformate ---
export function zahlText(x, stellen = null) {
  if (typeof x !== 'number' || !isFinite(x)) return String(x);
  let s = stellen === null ? String(Math.round(x * 1e6) / 1e6) : x.toFixed(stellen);
  let [g, d] = s.split('.');
  const neg = g.startsWith('-');
  if (neg) g = g.slice(1);
  if (g.length > 3) g = g.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return (neg ? '−' : '') + g + (d ? ',' + d : '');
}
export function geldText(x) {
  const rp = Math.round(x * 100);
  const fr = Math.floor(rp / 100);
  const r = rp % 100;
  return r === 0 ? `Fr. ${zahlText(fr)}.–` : `Fr. ${zahlText(fr)}.${String(r).padStart(2, '0')}`;
}
// Liest eine Zahleneingabe: 12'500 / 12 500 / 3,45 / 3.45 / −7 / 1/2 (Bruch als Objekt)
export function leseZahl(eingabe) {
  if (typeof eingabe === 'number') return eingabe;
  let s0 = String(eingabe ?? '').trim();
  const gem = s0.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/); // gemischte Zahl «1 1/4»
  if (gem) { const n = Number(gem[3]); return n === 0 ? null : { z: Number(gem[1]) * n + Number(gem[2]), n }; }
  s0 = s0.replace(/\.\s*[–—-]$/, ''); // «12.–» oder «12.-» (Franken)
  let s = s0.replace(/[−–]/g, '-').replace(/['’`\s]/g, '');
  s = s.replace(/^(fr\.?|chf)/i, '').replace(/(fr\.?|rp\.?|%)$/i, '');
  if (s === '') return null;
  if (/^-?\d+\/\d+$/.test(s)) {
    const [z, n] = s.split('/').map(Number);
    return n === 0 ? null : { z, n };
  }
  s = s.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}
export function fastGleich(a, b, tol = 1e-9) {
  return Math.abs(a - b) <= tol + 1e-9 * Math.max(Math.abs(a), Math.abs(b));
}
export function ggT(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }

// --- Textvergleich ---
export function normText(s, { akzente = true, gross = false, satzzeichen = false } = {}) {
  let t = String(s ?? '').normalize('NFC').replace(/ß/g, 'ss').replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim();
  if (!satzzeichen) t = t.replace(/[.!?;:,«»"„“”]/g, '').replace(/\s+/g, ' ').trim();
  else t = t.replace(/[«»„“”‹›]/g, '"').replace(/\s*([.!?;:,])/g, '$1').replace(/\s*"\s*/g, '"').replace(/\s+/g, ' ').trim();
  if (!gross) t = t.toLowerCase();
  if (!akzente) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return t;
}
export function abstand(a, b) { // Levenshtein
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let v = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const w = [i];
    for (let j = 1; j <= n; j++) {
      w[j] = Math.min(v[j] + 1, w[j - 1] + 1, v[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    v = w;
  }
  return v[n];
}
export function runde5(min) { return Math.round(min / 5) * 5; }
export function begrenze(x, a, b) { return Math.max(a, Math.min(b, x)); }
