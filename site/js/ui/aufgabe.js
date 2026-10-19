// Spielt eine Aufgabe im Kinderbereich: Auftrag sprechen, Eingabe, Prüfung, freundlicher Hinweis, zweiter Versuch,
// Lösung zeigen und erklären. Kein rotes Kreuz, kein Fehlerzähler, kein Tadel-Ton.
// spieleAufgabe(wurzel, a, { modus: 'normal' | 'zeig' | 'vorschau', fortschritt: { jetzt, von } })
//   -> Promise<{ wert: 1 | 0.5 | 0 | 'geuebt', versuche, hilfe, ms, abbruch? }>
import { h } from './dom.js';
import { symbol } from './figuren.js';
import { kindRahmen, kKnopf } from './kind.js';
import { TYPEN, ladeSchrift } from './typen.js';
import { zeigeTippen, zeigeZiehen, zeigeSpur, versteckeHand } from './zeigehand.js';
import { pruefe } from '../core/pruefen.js';
import { sprich, stopp, stimmeDa } from '../app/sprache.js';
import { klang } from '../app/klang.js';
import { Z, speichere } from '../app/zustand.js';
import { G, begriff } from '../app/steuerung.js';

const LOB = ['Super!', 'Genau!', 'Toll!', 'Ja, genau so!', 'Prima!', 'Stimmt!'];
const LOB_SPAETER = ['Jetzt stimmt es!', 'Genau, jetzt hast du es!', 'Ja, so ist es richtig.'];
const NOCHMAL = ['Schau nochmals genau.', 'Fast. Versuch es nochmals.', 'Noch nicht ganz. Versuch es nochmals.'];
const NS_LOB = ['Super gespurt!', 'Schön gespurt!', 'Toll gemacht!'];
const NS_NOCHMAL = {
  leer: 'Fahre mit dem Finger auf der grauen Linie.',
  abdeckung: 'Fahre die ganze Linie nach. Nochmals!',
  genauigkeit: 'Bleib schön auf der Linie. Nochmals!',
  richtung: 'Fang beim grünen Punkt an. Nochmals!',
};
const wahl = (liste) => liste[Math.floor(Math.random() * liste.length)];
const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
// Sprechen; ohne Stimme kurz warten, damit Rückmeldungen sichtbar bleiben
const sage = async (text, ms = 900) => { if (stimmeDa()) return sprich(text); await warte(ms); return true; };

const TESTRECHNER = typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname);

export async function spieleAufgabe(wurzel, a, { modus = 'normal', fortschritt = null } = {}) {
  const schrift = a.typ === 'nachspuren' ? await ladeSchrift() : null;
  if (TESTRECHNER) { window.__aufgabe = a; window.__aufgabeNr = (window.__aufgabeNr || 0) + 1; }   // nur für den Browser-Bot auf dem eigenen Rechner
  return new Promise((ende) => {
    const t0 = Date.now();
    let zustand = 'warte';      // warte | pruefe | loesung | fertig
    let versuche = 0, hilfe = false, nsVersuche = 0, wert = 0;
    let ruheTimer = null;

    const api = {
      schrift,
      pruefen: (e) => pruefen(e),
      aenderung: () => haken.classList.toggle('gedimmt', !T.bereit()),
      sprich: (t) => { if (stimmeDa()) sprich(t); },
      tippen: (el, mal = 1) => zeigeTippen(el, mal),
      ziehen: (von, nach) => zeigeZiehen(von, nach),
      spur: (punkte) => zeigeSpur(punkte),
      fehlversuch: () => fehlversuch(),
      fertigRichtig: () => richtig(),
      vorlesen: (ok) => { if (zustand === 'warte') { klang(ok ? 'richtig' : 'tipp'); abschluss(ok ? 1 : 'geuebt'); } },
      anlaute: () => (G.B?.liste || []).filter((b) => Z.buchstaben?.frei?.[b.id])
        .map((b) => ({ zeichen: b.anzeige.split(' ')[0], wort: b.wort, bild: (G.W?.woerter || []).find((w) => w.wort === b.wort)?.bild || '' })).filter((x) => x.bild),
    };
    const bauer = TYPEN[a.typ];
    if (!bauer) throw new Error('Aufgabentyp fehlt in der Oberfläche: ' + a.typ);
    const T = bauer(a, api);

    // --- Rahmen: oben Lautsprecher, Art der Aufgabe, Hilfe; unten Haus, Haken, Pfeil ---
    const hilfeKnopf = modus === 'zeig' ? h('span.k-platz') : kKnopf('frage', 'Hilfe', () => onHilfe(), '.k-hilfe');
    const haken = kKnopf('haken', 'Fertig', () => onHaken(), '.k-haken');
    const weiter = kKnopf('pfeil', 'Weiter', () => onWeiter(), '.k-weiter');
    const haus = h('button.kk-haus', { type: 'button', 'aria-label': 'Zurück zum Weg', onclick: () => abschluss(null, true) }, symbol('haus'));
    if (!T.haken) haken.classList.add('versteckt');
    weiter.classList.add('versteckt');
    const rahmen = kindRahmen(wurzel, {
      klasse: 'k-aufgabe' + (a.fach === 'D' ? '.fd' : '.fm'),
      lautsprecher: () => auftrag(),
      rechts: hilfeKnopf,
      inhalt: [T.el],
      unten: [haus, haken, weiter],
    });
    const mitte = rahmen.querySelector('.k-mitte-oben');
    mitte.append(h('span.art-symbol', symbol(T.symbol)));
    if (modus === 'vorschau') mitte.append(h('button.vorschau-melden', { type: 'button', onclick: () => import('./eltern-teile.js').then((m) => m.meldeAufgabe({ f: a.f, s: a.s, sig: a.sig, typ: a.typ, frage: a.frage })) }, 'Melden'));
    if (fortschritt) mitte.append(h('span.fortschritt', Array.from({ length: fortschritt.von }, (_, i) => h('span.fp' + (i < fortschritt.jetzt ? '.fertig' : i === fortschritt.jetzt ? '.jetzt' : '')))));
    api.aenderung();

    // Zeigehand nach einer Weile ohne Berührung
    const ruhe = () => {
      clearTimeout(ruheTimer);
      ruheTimer = setTimeout(async () => {
        if (!rahmen.isConnected || zustand === 'fertig' || zustand === 'pruefe') return;
        if (zustand === 'loesung') await zeigeTippen(weiter, 2);
        else await T.demo();
        ruhe();
      }, (G.P.kinderbereich.zeigehandNachSek || 12) * 1000);
    };
    rahmen.addEventListener('pointerdown', ruhe, { capture: true });

    // --- Auftrag ---
    async function auftrag() {
      const text = a.sprich || a.frage;
      if (!stimmeDa()) return;
      let ok = await sprich(text);
      // Was gehört werden soll (Wort, Silbe, Satz), kommt nach dem Auftrag, wenn es nicht schon darin steht
      if (ok && a.vorlesen && !(a.sprich || a.frage || '').includes(String(a.vorlesen))) ok = await sprich(String(a.vorlesen));
      if (ok && T.namen && zustand === 'warte') {
        for (let i = 0; i < T.karten.length && ok; i++) {
          if (!T.namen[i] || T.karten[i].classList.contains('weg')) continue;
          T.karten[i].classList.add('nennt');
          ok = await sprich(T.namen[i]);
          T.karten[i].classList.remove('nennt');
        }
      }
      return ok;
    }
    (async () => {
      await warte(250);
      const ok = await auftrag();
      if (!rahmen.isConnected || zustand !== 'warte') return;
      // Beim ersten Mal pro Aufgabentyp macht die Hand die Bewegung vor
      const typen = Z.einfuehrung?.typen || {};
      if (ok !== false && !typen[a.typ]) {
        await T.demo();
        if (modus !== 'vorschau' && Z.einfuehrung) { Z.einfuehrung.typen = { ...typen, [a.typ]: true }; speichere('einfuehrung'); }
      }
      ruhe();
    })();

    // --- Knöpfe ---
    async function onHilfe() {
      if (zustand !== 'warte') return;
      if (!hilfe && versuche === 0) { hilfe = true; T.erleichtere(null, null); }
      if (T.hilfe) T.hilfe();
      await sage(a.hinweis, 1200);
      if (zustand === 'warte') await T.demo();
    }
    function onHaken() {
      if (zustand !== 'warte') return;
      if (!T.bereit()) { sage('Du bist noch nicht fertig.'); T.demo(); return; }
      pruefen(T.eingabe());
    }
    function onWeiter() { if (zustand === 'loesung') abschluss(wert); }

    // --- Prüfen ---
    async function pruefen(e) {
      if (zustand !== 'warte') return;
      zustand = 'pruefe';
      stopp(); versteckeHand();
      if (T.nachspuren) return pruefeSpur(e);
      const r = pruefe(a, e);
      if (r.ok) return richtig();
      if (modus === 'zeig') return loesung('So ist es. ' + a.erklaerung);
      versuche++;
      if (versuche === 1) return ersterFehler(r);
      return loesung(a.erklaerung);
    }
    async function richtig() {
      zustand = 'pruefe';
      wert = versuche === 0 && !hilfe ? 1 : 0.5;
      T.richtig();
      klang('richtig');
      rahmen.classList.add('freut');
      // Beim Lesen wird der Text erst nach der Antwort vorgesprochen
      if (a.typ === 'bild-wort' && stimmeDa()) await sprich(String(a.sprichNachher ?? a.zeige));
      await sage(versuche ? wahl(LOB_SPAETER) : wahl(LOB), 700);
      await warte(300);
      abschluss(wert);
    }
    async function ersterFehler(r) {
      let text = r.fehlerbild;
      if (!text && a.typ === 'menge-legen' && a.feld !== 'muenzen' && a.feld !== 'zehnereiner') {
        const p = begriff('plaettchen');
        text = r.zuViel ? `Das sind zu viele ${p}.` : r.zuWenig ? `Es fehlen noch ${p}.` : r.struktur ? `Leg die ${p} der Reihe nach, zuerst immer fünf.` : null;
        if (text) text += ' ' + a.hinweis;
      }
      text = text || `${wahl(NOCHMAL)} ${a.hinweis}`;
      T.erleichtere(r, null);
      zustand = 'warte';
      api.aenderung();
      await sage(text, 1400);
    }
    async function fehlversuch() {   // Zuordnen: jede falsche Verbindung ist ein Versuch
      if (zustand !== 'warte') return;
      if (modus === 'zeig') { zustand = 'pruefe'; return loesung('So ist es. ' + a.erklaerung); }
      versuche++;
      if (versuche === 1) { await sage(`${wahl(NOCHMAL)} ${a.hinweis}`, 1200); return; }
      zustand = 'pruefe';
      loesung(a.erklaerung);
    }
    async function loesung(text) {
      wert = 0;
      T.zeigeLoesung();
      zustand = 'loesung';
      haken.classList.add('versteckt');
      weiter.classList.remove('versteckt'); weiter.classList.add('leuchtet');
      await sage(text, 1500);
      ruhe();
    }
    async function pruefeSpur(e) {
      const r = T.pruefeSpur(e);
      if (r.ok) {
        T.richtig(); klang('richtig'); rahmen.classList.add('freut');
        await sage(wahl(NS_LOB), 800);
        return abschluss('geuebt');
      }
      nsVersuche++;
      if (nsVersuche >= 3) { await sage('Gut geübt!', 800); return abschluss('geuebt'); }
      zustand = 'warte';
      T.erleichtere();
      api.aenderung();
      await sage(NS_NOCHMAL[r.grund] || NS_NOCHMAL.abdeckung, 1200);
      if (zustand === 'warte') T.demo();
    }

    function abschluss(w, abbruch = false) {
      if (zustand === 'fertig') return;
      zustand = 'fertig';
      clearTimeout(ruheTimer); stopp(); versteckeHand();
      const ergebnis = { wert: w, versuche, hilfe, ms: Date.now() - t0, id: a.id, f: a.f, s: a.s, typ: a.typ, abbruch };
      if (TESTRECHNER) (window.__ergebnisse ||= []).push(ergebnis);
      ende(ergebnis);
    }
  });
}
