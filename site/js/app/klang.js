// Leise Töne aus der Web Audio API (keine Mediendateien, die CSP bleibt unverändert). Kein Ton klingt nach Tadel:
// Für «nochmals» gibt es keinen Ton, nur die freundliche Stimme.
let ctx = null;
let an = true;
export function setzeTon(wert) { an = wert !== false; }

export function freischaltenTon() {
  try {
    if (!ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; ctx = new A(); }
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}

function note(freq, start, dauer, { typ = 'sine', laut = 0.08, bis = null } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = typ;
  o.frequency.setValueAtTime(freq, start);
  if (bis) o.frequency.exponentialRampToValueAtTime(bis, start + dauer);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(laut, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
  o.connect(g).connect(ctx.destination);
  o.start(start); o.stop(start + dauer + 0.05);
}

const KLAENGE = {
  tipp: (t) => note(880, t, 0.06, { laut: 0.04, typ: 'triangle' }),
  richtig: (t) => { note(523.25, t, 0.18); note(659.25, t + 0.09, 0.18); note(783.99, t + 0.18, 0.32); },
  hopp: (t) => note(420, t, 0.22, { bis: 760, typ: 'triangle', laut: 0.06 }),
  stern: (t) => [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => note(f, t + i * 0.08, 0.3, { laut: 0.05, typ: 'triangle' })),
  weiter: (t) => note(660, t, 0.12, { laut: 0.04 }),
};

export function klang(art) {
  if (!an || !ctx || !KLAENGE[art]) return;
  try { if (ctx.state === 'suspended') ctx.resume(); KLAENGE[art](ctx.currentTime + 0.01); } catch { /* egal */ }
}
