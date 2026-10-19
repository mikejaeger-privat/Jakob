// Zeigehand: macht dem Kind eine Bewegung vor (tippen, ziehen, nachspuren). Hilfe, kein Drängen.
import { h } from './dom.js';
import { zeigehandSvg } from './figuren.js';

const GROESSE = { b: 72, h: 96, spitzeX: 36, spitzeY: 6 };
let hand = null, laufend = null;
const ruhig = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function element() {
  if (!hand || !hand.isConnected) { hand = h('div.zeigehand', { 'aria-hidden': 'true' }, zeigehandSvg()); document.body.append(hand); }
  return hand;
}
const mitte = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
const pos = (p) => `translate(${Math.round(p.x - GROESSE.spitzeX)}px, ${Math.round(p.y - GROESSE.spitzeY)}px)`;

function welle(p) {
  const w = h('div.zh-welle', { 'aria-hidden': 'true' });
  document.body.append(w);
  w.style.left = p.x + 'px'; w.style.top = p.y + 'px';
  const a = w.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 0.55 }, { transform: 'translate(-50%,-50%) scale(1.5)', opacity: 0 }], { duration: ruhig() ? 1 : 650, easing: 'ease-out' });
  a.onfinish = () => w.remove();
}

export function versteckeHand() {
  if (laufend) { laufend.abbruch = true; laufend = null; }
  if (hand) { hand.getAnimations().forEach((a) => a.cancel()); hand.classList.remove('da'); }
}

async function ablauf(schritte) {
  versteckeHand();
  const ich = { abbruch: false };
  laufend = ich;
  const el = element();
  el.classList.add('da');
  for (const s of schritte) {
    if (ich.abbruch) return false;
    const a = el.animate(s.frames, { duration: ruhig() ? Math.min(s.dauer, 1) : s.dauer, easing: s.easing || 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' });
    await a.finished.catch(() => {});
    if (s.welle && !ich.abbruch) welle(s.welle);
    if (s.pause && !ich.abbruch) await new Promise((ok) => setTimeout(ok, s.pause));
  }
  if (!ich.abbruch) { el.classList.remove('da'); if (laufend === ich) laufend = null; }
  return !ich.abbruch;
}

// Tippen auf ein Element (zweimal)
export function zeigeTippen(ziel, mal = 2) {
  if (!ziel?.isConnected) return Promise.resolve(false);
  const p = mitte(ziel);
  const start = { x: p.x + 70, y: p.y + 110 };
  const schritte = [{ frames: [{ transform: pos(start), opacity: 0 }, { transform: pos(p), opacity: 1 }], dauer: 700 }];
  for (let i = 0; i < mal; i++) {
    schritte.push({ frames: [{ transform: pos(p) + ' scale(1)' }, { transform: pos(p) + ' scale(.88)' }], dauer: 160, welle: p });
    schritte.push({ frames: [{ transform: pos(p) + ' scale(.88)' }, { transform: pos(p) + ' scale(1)' }], dauer: 200, pause: 380 });
  }
  schritte.push({ frames: [{ opacity: 1, transform: pos(p) }, { opacity: 0, transform: pos({ x: p.x + 30, y: p.y + 50 }) }], dauer: 450 });
  return ablauf(schritte);
}

// Ziehen von einem Element zu einem anderen
export function zeigeZiehen(von, nach) {
  if (!von?.isConnected || !nach?.isConnected) return Promise.resolve(false);
  const a = mitte(von), b = mitte(nach);
  return ablauf([
    { frames: [{ transform: pos({ x: a.x + 70, y: a.y + 110 }), opacity: 0 }, { transform: pos(a), opacity: 1 }], dauer: 650 },
    { frames: [{ transform: pos(a) }, { transform: pos(a) + ' scale(.88)' }], dauer: 160, welle: a },
    { frames: [{ transform: pos(a) + ' scale(.88)' }, { transform: pos(b) + ' scale(.88)' }], dauer: 1100, easing: 'ease-in-out' },
    { frames: [{ transform: pos(b) + ' scale(.88)' }, { transform: pos(b) + ' scale(1)' }], dauer: 200, welle: b, pause: 300 },
    { frames: [{ opacity: 1, transform: pos(b) }, { opacity: 0, transform: pos({ x: b.x + 30, y: b.y + 50 }) }], dauer: 450 },
  ]);
}

// Nachspuren entlang von Punkten (Bildschirmkoordinaten)
export function zeigeSpur(punkte) {
  if (!punkte?.length) return Promise.resolve(false);
  const [p0] = punkte;
  return ablauf([
    { frames: [{ transform: pos({ x: p0.x + 60, y: p0.y + 100 }), opacity: 0 }, { transform: pos(p0), opacity: 1 }], dauer: 600, welle: p0 },
    { frames: punkte.map((p) => ({ transform: pos(p) + ' scale(.9)' })), dauer: Math.max(900, punkte.length * 60), easing: 'linear', pause: 300 },
    { frames: [{ opacity: 1 }, { opacity: 0 }], dauer: 400 },
  ]);
}
