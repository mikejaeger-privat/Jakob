// Einen Stein des Tagesplans in der Oberfläche spielen. Den Ablauf (Zeit, Zeig-Runde, Entdeckerrunde, Rückstufung,
// Schatzkarte, leichte Schlussaufgabe) regelt core/ablauf.js; hier sind nur die Aufgaben-Oberfläche und die Szenen.
import { h } from './dom.js';
import { spieleAufgabe } from './aufgabe.js';
import { kindRahmen } from './kind.js';
import { fuchs, symbol } from './figuren.js';
import { matheCtx, deutschCtx } from './baustein.js';
import { protokolliere } from '../app/zustand.js';
import { sprich, stimmeDa } from '../app/sprache.js';
import { klang } from '../app/klang.js';
import { welt, L } from '../app/lernen.js';
import { spieleStein as ablauf } from '../core/ablauf.js';
import { neuerSeed } from '../core/util.js';

const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
const sage = async (t, ms = 1200) => { if (stimmeDa()) return sprich(t); await warte(ms); return true; };

export async function spieleStein(wurzel, plan, i) {
  const io = {
    ctx: (fach) => (fach === 'M' ? matheCtx() : deutschCtx()),
    spiele: (a, opt) => spieleAufgabe(wurzel, a, opt),
    szene: (name) => SZENEN[name]?.(wurzel),
    protokoll: (x) => protokolliere(x),
    seed: () => neuerSeed(),
  };
  document.body.classList.add('in-sitzung');
  try { return await ablauf(welt, L, io, plan, i); } finally { document.body.classList.remove('in-sitzung'); }
}

// --- Kurze Szenen ohne Text ---
function szene(wurzel, inhalt, ansage, ms = 2600) {
  return new Promise((ok) => {
    let fertig = false;
    const weiter = () => { if (!fertig) { fertig = true; ok(); } };
    const knopf = h('button.k-start.klein', { type: 'button', 'aria-label': 'Weiter', onclick: () => { klang('hopp'); weiter(); } }, symbol('pfeil'));
    kindRahmen(wurzel, { klasse: 'k-szene', lautsprecher: () => sprich(ansage), inhalt: [h('div.szene', inhalt)], unten: [knopf] });
    sage(ansage, ms).then(() => setTimeout(weiter, 400));
  });
}
const SZENEN = {
  zeigStart: (w) => szene(w, [h('div.k-fuchs', fuchs({ stimmung: 'staunt', klasse: 'gross' })), h('div.szene-stern', symbol('stern'))],
    'Jetzt zeigst du, was du kannst. Es gibt keinen Hilfe-Knopf. Probier es einfach!'),
  schatzStart: (w) => szene(w, [h('div.k-fuchs', fuchs({ stimmung: 'staunt', klasse: 'gross' })), h('div.szene-schatz', symbol('schatz'))],
    'Heute gibt es eine Schatzkarte! Bei jeder Aufgabe kommst du dem Schatz ein Stück näher.'),
  schatzEnde: (w) => szene(w, [h('div.k-fuchs', fuchs({ klasse: 'gross' })), h('div.szene-schatz.offen', symbol('schatz'))],
    'Du hast den Schatz gefunden! Toll, wie du dich angestrengt hast.'),
};
