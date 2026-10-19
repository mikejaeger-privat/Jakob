// Kennenlern-Runde: Der Fuchs zeigt die Knöpfe und eine erste Bildwahl. Das Kind tippt alles selbst einmal an.
import { h } from './dom.js';
import { fuchs } from './figuren.js';
import { kindRahmen, kKnopf, istEntsperrt } from './kind.js';
import { zeigeTippen, versteckeHand } from './zeigehand.js';
import { Z, speichere } from '../app/zustand.js';
import { G } from '../app/steuerung.js';
import { sprich, stopp } from '../app/sprache.js';
import { klang } from '../app/klang.js';

let aktiv = 0;

export async function zeigeEinfuehrung(wurzel) {
  if (!istEntsperrt()) { location.hash = '#/'; return; }
  const meine = ++aktiv;
  const noch = () => meine === aktiv && document.body.contains(feld);
  stopp(); versteckeHand();

  let ansage = '';
  const nochmal = () => sprich(ansage);
  let warteAuf = null;   // Element, auf das das Kind tippen soll
  let getippt = null;
  const tippe = (el) => () => { if (warteAuf === el && getippt) { const f = getippt; getippt = null; f(); } };

  const hoeren = kKnopf('lautsprecher', 'Nochmals hören', () => {}, '.k-hoeren');
  const hilfe = kKnopf('frage', 'Hilfe', () => {}, '.k-hilfe');
  const haken = kKnopf('haken', 'Fertig', () => {}, '.k-haken');
  const weiter = kKnopf('pfeil', 'Weiter', () => {}, '.k-weiter');
  for (const el of [hoeren, hilfe, haken, weiter]) el.addEventListener('click', tippe(el));
  hoeren.addEventListener('click', () => { if (warteAuf !== hoeren) nochmal(); });

  const fx = h('div.einf-fuchs', fuchs());
  const bilder = h('div.einf-bilder');
  const feld = h('div.einf', fx, bilder);
  const rahmen = kindRahmen(wurzel, { klasse: 'k-einf', inhalt: [feld], unten: [h('span.k-platz'), haken, weiter] });
  rahmen.querySelector('.kind-oben').replaceChildren(hoeren, h('div.k-mitte-oben'), hilfe);
  [hoeren, hilfe, haken, weiter].forEach((el) => el.classList.add('gedimmt'));

  // Spricht, zeigt dann mit der Hand auf das Ziel und wartet, bis das Kind tippt (nach 12 Sekunden zeigt die Hand nochmals)
  async function schritt(text, ziel) {
    if (!noch()) return false;
    ansage = text;
    ziel.classList.remove('gedimmt'); ziel.classList.add('leuchtet');
    warteAuf = ziel;
    const gewartet = new Promise((ok) => { getippt = ok; });
    await sprich(text);
    if (!noch()) return false;
    let timer = null;
    const zeige = () => { if (getippt && noch()) { zeigeTippen(ziel, 2); timer = setTimeout(zeige, G.P.kinderbereich.zeigehandNachSek * 1000); } };
    zeige();
    await gewartet;
    clearTimeout(timer); versteckeHand();
    ziel.classList.remove('leuchtet');
    warteAuf = null;
    klang('richtig');
    return noch();
  }

  if (!noch()) return;
  ansage = 'Hallo! Ich bin der Fuchs. Ich zeige dir, wie alles geht.';
  await sprich(ansage);
  if (!await schritt('Das ist der Lautsprecher. Wenn du ihn antippst, sage ich alles nochmals. Tippe auf den Lautsprecher.', hoeren)) return;
  await sprich('Genau. So hörst du es nochmals.');
  if (!await schritt('Das ist das Fragezeichen. Wenn du nicht weiterweisst, tippe darauf. Dann helfe ich dir. Tippe auf das Fragezeichen.', hilfe)) return;
  await sprich('Super.');
  if (!await schritt('Mit dem Haken sagst du: Ich bin fertig. Tippe auf den Haken.', haken)) return;
  if (!await schritt('Und mit dem Pfeil geht es weiter. Tippe auf den Pfeil.', weiter)) return;

  // Erste Bildwahl: tippen ist die Antwort
  const W = G.W.woerter;
  const bild = (wort) => W.find((w) => w.wort === wort);
  const auswahl = ['Hund', 'Maus', 'Ball'].map(bild).filter(Boolean);
  const karten = auswahl.map((w) => h('button.bildkarte', { type: 'button', 'aria-label': w.wort }, h('span.emoji', w.bild)));
  bilder.replaceChildren(...karten);
  fx.classList.add('klein');
  const maus = karten[1];
  let fertig = false;
  karten.forEach((k, i) => k.addEventListener('click', async () => {
    if (fertig || !noch()) return;
    if (k === maus) {
      fertig = true; versteckeHand(); klang('richtig'); k.classList.add('richtig');
      await sprich('Richtig, das ist die Maus! Jetzt kennst du alles. Los geht es.');
      if (!noch()) return;
      Z.einfuehrung = { ...(Z.einfuehrung || {}), gesehen: true, typen: { ...(Z.einfuehrung?.typen || {}), 'wahl-bild': true } };
      speichere('einfuehrung');
      location.hash = '#/weg';
    } else {
      klang('tipp');
      ansage = `Das ist ${auswahl[i].artikel} ${auswahl[i].wort}. Tippe auf die Maus.`;
      await sprich(ansage);
      if (noch() && !fertig) zeigeTippen(maus, 1);
    }
  }));
  ansage = 'Bei vielen Aufgaben tippst du auf ein Bild. Hier sind ein Hund … eine Maus … und ein Ball. Tippe auf die Maus.';
  for (const k of karten) k.classList.add('erscheint');
  await sprich(ansage);
  if (noch() && !fertig) zeigeTippen(maus, 2);
}
