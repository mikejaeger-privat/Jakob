// Kinderbereich: Startbildschirm und Tagesweg. Kein Text, nur Bilder und Stimme.
import { h, leere } from './dom.js';
import { fuchs, symbol } from './figuren.js';
import { landschaft } from './landschaft.js';
import { zeigeTippen, versteckeHand } from './zeigehand.js';
import { Z } from '../app/zustand.js';
import { G, K, freiGrund, heute } from '../app/steuerung.js';
import { planHeute, sitzungFertig } from '../app/lernen.js';
import { sprich, stopp, freischalten, stimmeDa } from '../app/sprache.js';
import { klang, freischaltenTon } from '../app/klang.js';
import { speichere } from '../app/zustand.js';
import './baustein.js';
import { spieleStein } from './sitzung.js';
import { zeigeSchluss, zeigeStern } from './schluss.js';

// iOS lässt Sprache erst nach einer Berührung zu: Der Startbildschirm schaltet frei.
let entsperrt = false;
export const istEntsperrt = () => entsperrt;
export function entsperren() { if (!entsperrt) { freischalten(); freischaltenTon(); entsperrt = true; } }

// Grundgerüst: Lichtung, oben links Lautsprecher, oben rechts Schloss oder Hilfe, Inhalt, unten Knöpfe
export function kindRahmen(wurzel, { klasse = '', lautsprecher = null, rechts = null, inhalt = [], unten = [] } = {}) {
  document.body.classList.add('kindmodus');
  document.body.classList.remove('elternmodus');
  const oben = h('div.kind-oben',
    lautsprecher ? kKnopf('lautsprecher', 'Nochmals hören', lautsprecher, '.k-hoeren') : h('span.k-platz'),
    h('div.k-mitte-oben'),
    rechts || h('span.k-platz'));
  const rahmen = h('div.kind' + (klasse ? '.' + klasse : ''), landschaft(), oben, h('div.kind-inhalt', inhalt), h('div.kind-unten', unten));
  leere(wurzel, rahmen);
  return rahmen;
}

// Runder Knopf mit Bildsymbol (Beschriftung nur für Screenreader)
export function kKnopf(sym, beschriftung, onclick, klasse = '') {
  return h('button.kk' + klasse, { type: 'button', 'aria-label': beschriftung, onclick: (e) => { klang('tipp'); onclick(e); } }, symbol(sym));
}
export const elternKnopf = () => h('button.kk-eltern', { type: 'button', 'aria-label': 'Elternbereich', onclick: () => { stopp(); location.hash = '#/eltern'; } }, symbol('schloss'));

// --- Startbildschirm ---
export function zeigeStart(wurzel) {
  stopp(); versteckeHand();
  const los = h('button.k-start', { type: 'button', 'aria-label': 'Los geht es', onclick: () => {
    entsperren(); klang('hopp');
    location.hash = Z.einfuehrung?.gesehen || !G.P.kinderbereich.einfuehrungBeimErstenStart ? '#/weg' : '#/einfuehrung';
  } }, symbol('start'));
  const fx = h('button.k-fuchs', { type: 'button', 'aria-label': 'Der Fuchs zeigt dir, wie alles geht', onclick: () => { entsperren(); location.hash = '#/einfuehrung'; } }, fuchs({ klasse: 'gross' }));
  kindRahmen(wurzel, { klasse: 'k-startseite', rechts: elternKnopf(), inhalt: [fx, los] });
  // Ohne Berührung darf die Stimme noch nicht sprechen. Nach einer Weile zeigt die Hand den Start.
  setTimeout(() => { if (los.isConnected) zeigeTippen(los, 2); }, 2500);
}

// --- Tagesweg: Steine von heute ---
const STEIN = {
  aufwaermen: { sym: 'karten', name: 'Aufwärmen' },
  deutsch: { sym: 'buch', name: 'Deutsch', klasse: 'fd' },
  mathe: { sym: 'wuerfel', name: 'Mathematik', klasse: 'fm' },
  schluss: { sym: 'stern', name: 'Schlussstein' },
  schatz: { sym: 'schatz', name: 'Schatzkarte' },
};
const WEG = 'M70 360 C210 372 250 190 400 205 C550 220 560 372 720 338 C840 312 860 190 940 150';

export function zeigeWeg(wurzel, { trotzdem = false } = {}) {
  if (!entsperrt) { location.hash = '#/'; return; }
  stopp(); versteckeHand();
  const name = Z.profil.name;
  const grund = freiGrund(heute());
  if (grund && !trotzdem) { zeigeFrei(wurzel, grund); return; }
  const plan = planHeute();
  const offen = plan.steine.map((st, i) => i).filter((i) => !plan.erledigt.includes(i));
  const jetzt = waehlbar(plan);
  let ansage = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 1000 440'); svg.setAttribute('class', 'weg-pfad'); svg.setAttribute('aria-hidden', 'true');
  const pfad = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pfad.setAttribute('d', WEG); svg.append(pfad);
  const steine = plan.steine.map((st, i) => {
    const info = STEIN[st.art] || STEIN.schluss;
    const zustand = plan.erledigt.includes(i) ? 'erledigt' : jetzt.includes(i) ? 'jetzt' : 'spaeter';
    return h('button.stein.' + zustand + (info.klasse ? '.' + info.klasse : ''), {
      type: 'button', 'aria-label': info.name + (zustand === 'erledigt' ? ', erledigt' : ''),
      onclick: () => steinGetippt(i, zustand),
    }, symbol(info.sym), zustand === 'erledigt' ? h('span.stein-haken', symbol('haken')) : null);
  });
  const fx = h('div.weg-fuchs', fuchs());
  const feld = h('div.weg', svg, steine, fx);
  kindRahmen(wurzel, { klasse: 'k-weg', lautsprecher: () => sprich(ansage), rechts: elternKnopf(), inhalt: [feld] });

  // Steine auf den Weg setzen (Prozent der Fläche), Fuchs neben den nächsten Stein
  requestAnimationFrame(() => {
    const laenge = pfad.getTotalLength();
    const n = steine.length;
    steine.forEach((el, i) => {
      const p = pfad.getPointAtLength(laenge * (n === 1 ? 0.5 : 0.06 + (0.88 * i) / (n - 1)));
      el.style.left = (p.x / 10) + '%'; el.style.top = (p.y / 4.4) + '%';
    });
    const ziel = steine[jetzt[0] ?? offen[0] ?? n - 1];
    if (ziel) { fx.style.left = ziel.style.left; fx.style.top = ziel.style.top; }
  });

  const anzahl = zahlwort(plan.steine.length);
  if (!offen.length) ansage = `Super, ${name}! Du hast heute alles geschafft. Bis morgen!`;
  else if (plan.erledigt.length === 0 && plan.art === 'schatz') ansage = `Hallo ${name}! Heute gibt es eine Schatzkarte. Tipp auf den ersten Stein.`;
  else if (plan.erledigt.length === 0 && plan.art === 'entdecker' && !Z.entdecker?.tage?.length) ansage = `Hallo ${name}! Heute machen wir zusammen einen Ausflug und schauen, was du schon alles kannst. Es gibt ${anzahl} Steine. Tipp auf den ersten Stein.`;
  else if (plan.erledigt.length === 0) ansage = `Hallo ${name}! Heute gibt es ${anzahl} Steine. Tipp auf den ersten Stein.`;
  else if (jetzt.length > 1) ansage = 'Womit willst du weitermachen? Tipp auf das Buch oder auf den Würfel.';
  else ansage = 'Tipp auf den nächsten Stein.';
  sprich(ansage).then((fertig) => { if (fertig && jetzt.length === 1) zeigeTippen(steine[jetzt[0]], 1); });

  function steinGetippt(i, zustand) {
    if (zustand === 'erledigt') { sprich('Diesen Stein hast du schon geschafft.'); return; }
    if (zustand !== 'jetzt') { sprich('Dieser Stein kommt später. Tipp auf einen Stein, der leuchtet.'); zeigeTippen(steine[jetzt[0]], 1); return; }
    klang('hopp');
    starteStein(i);
  }

  async function starteStein(i) {
    const p = planHeute();
    const r = await spieleStein(wurzel, p, i);
    if (r.fertig) {
      if (!p.erledigt.includes(i)) p.erledigt.push(i);
      speichere('tagesplan');
      if (r.stern === 'bestanden') await zeigeStern(wurzel);
      if (p.steine.every((x, j) => p.erledigt.includes(j))) {
        const { teil } = sitzungFertig();
        zeigeSchluss(wurzel, { teil, aufgaben: Object.values(p.steine).reduce((n, st) => n + (st.lauf?.n || 0), 0) });
        return;
      }
    }
    zeigeWeg(wurzel, { trotzdem: true });
  }
}

// Welche Steine jetzt leuchten: zuerst das Aufwärmen, dann darf das Kind zwischen Deutsch und Mathematik wählen,
// der Schlussstein kommt immer zuletzt.
export function waehlbar(plan) {
  const offen = plan.steine.map((st, i) => i).filter((i) => !plan.erledigt.includes(i));
  if (!offen.length) return [];
  const erster = plan.steine[offen[0]].art;
  if (erster === 'aufwaermen' || erster === 'schatz') return [offen[0]];
  const haupt = offen.filter((i) => ['deutsch', 'mathe'].includes(plan.steine[i].art));
  return haupt.length ? haupt : [offen[0]];
}

const ZAHLWORT = ['null', 'einen', 'zwei', 'drei', 'vier', 'fünf', 'sechs'];
const zahlwort = (n) => ZAHLWORT[n] || String(n);

// --- Freier Tag ---
function zeigeFrei(wurzel, grund) {
  // Ferien heissen Ferien; ein einzelner freier Tag (Feiertag, schulfrei, kein Lerntag) ist einfach frei
  const ansage = K.ferienAm(heute()) ? 'Heute sind Ferien. Der Fuchs schläft. Wenn du willst, kannst du trotzdem üben.' : 'Heute ist frei. Der Fuchs schläft. Wenn du willst, kannst du trotzdem üben.';
  const los = h('button.k-start.klein', { type: 'button', 'aria-label': 'Trotzdem üben', onclick: () => { klang('hopp'); zeigeWeg(wurzel, { trotzdem: true }); } }, symbol('start'));
  kindRahmen(wurzel, { klasse: 'k-frei', lautsprecher: () => sprich(ansage), rechts: elternKnopf(), inhalt: [h('div.k-fuchs', fuchs({ stimmung: 'schlaeft', klasse: 'gross' })), los] });
  if (stimmeDa()) sprich(ansage);
}
