// Schlusskarte nach der Sitzung: das Sammelbild mit dem neuen Teil, der Fuchs freut sich über den Einsatz.
// Kein Zähler von Fehlern, keine Punkte. Ohne Belohnung (abgeschaltet) nur der Fuchs.
import { h } from './dom.js';
import { fuchs, symbol } from './figuren.js';
import { kindRahmen, elternKnopf } from './kind.js';
import { Z } from '../app/zustand.js';
import { sprich, stimmeDa } from '../app/sprache.js';
import { klang } from '../app/klang.js';

const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));

export async function zeigeSchluss(wurzel, { teil = null } = {}) {
  let sammelbild = null, teilName = null;
  try { ({ sammelbild, teilName } = await import('./sammelbild.js')); } catch (e) { console.warn('Sammelbild', e); }
  const name = Z.profil.name;
  const sb = Z.sammelbild;
  const szene = teil?.voll ? Z.sammelbild.album.at(-1)?.szene : sb?.szene;
  const teile = teil?.voll ? Array.from({ length: teil.nr + 1 }, (_, i) => ({ id: 'a' + i, art: 'normal', nr: i })).map((x, i) => (i === teil.nr ? teil : x)) : sb?.teile || [];
  const bild = teil && szene && sammelbild ? sammelbild(szene, teile, { neu: teil.id }) : null;
  let ansage = `Super gemacht, ${name}! Du hast heute fleissig geübt.`;
  if (bild) ansage += ` In deinem Bild ist ${teilName(szene, teil)} dazugekommen.`;
  if (teil?.voll) ansage += ' Dein Bild ist jetzt voll. Morgen beginnt ein neues!';
  ansage += ' Bis morgen!';
  const fertig = h('button.k-start.klein', { type: 'button', 'aria-label': 'Fertig', onclick: () => { klang('hopp'); location.hash = '#/'; } }, symbol('haus'));
  kindRahmen(wurzel, {
    klasse: 'k-schluss', lautsprecher: () => sprich(ansage), rechts: elternKnopf(),
    inhalt: [h('div.schluss', bild ? h('div.schluss-bild', bild) : null, h('div.k-fuchs', fuchs({ klasse: bild ? '' : 'gross' })))],
    unten: [fertig],
  });
  klang('stern');
  if (stimmeDa()) warte(500).then(() => sprich(ansage));
}

// Kleiner Stern nach einer bestandenen Zeig-was-du-kannst-Runde
export function zeigeStern(wurzel) {
  return new Promise((ok) => {
    let fertig = false;
    const weiter = () => { if (!fertig) { fertig = true; ok(); } };
    const ansage = 'Das hast du super gezeigt! Dafür gibt es einen Stern.';
    const knopf = h('button.k-start.klein', { type: 'button', 'aria-label': 'Weiter', onclick: () => { klang('hopp'); weiter(); } }, symbol('pfeil'));
    kindRahmen(wurzel, { klasse: 'k-szene', lautsprecher: () => sprich(ansage), inhalt: [h('div.szene', h('div.k-fuchs', fuchs({ klasse: 'gross' })), h('div.szene-stern.gross', symbol('stern')))], unten: [knopf] });
    klang('stern');
    (stimmeDa() ? sprich(ansage) : warte(1500)).then(() => setTimeout(weiter, 600));
  });
}
