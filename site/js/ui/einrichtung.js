// Ersteinrichtung für die Eltern: Name, PIN, Stimme, Hinweise zum iPad. Alles Text, das Kind ist noch nicht dran.
import { h, leere, meldung, dateiKnopf, dialog } from './dom.js';
import { Z, neuesProfil, setzePin, importiere, speichere } from '../app/zustand.js';
import { G } from '../app/steuerung.js';
import { stimmAbschnitt } from './stimmtest.js';
import { konfiguriere } from '../app/sprache.js';
import { fuchs } from './figuren.js';

function seite(wurzel, ...inhalt) {
  document.body.classList.remove('kindmodus');
  document.body.classList.add('elternmodus');
  leere(wurzel, h('div.seite.einrichtung', h('div.einr-fuchs', fuchs()), h('section.blatt', ...inhalt)));
  window.scrollTo(0, 0);
}

export function zeigeEinrichtung(wurzel, fertig) {
  const schritte = [willkommen, name, pin, stimme, ipad];
  let i = 0;
  const weiter = () => { i++; schritte[i](); };
  const zurueck = () => { i = Math.max(0, i - 1); schritte[i](); };
  const fuss = (weiterText = 'Weiter', aktion = weiter, mitZurueck = true) => h('div.knopfreihe',
    mitZurueck ? h('button.btn.leise', { type: 'button', onclick: zurueck }, 'Zurück') : null,
    h('button.btn.haupt', { type: 'button', onclick: aktion }, weiterText));
  const schrittText = () => h('p.schritt', `Einrichtung, Schritt ${i + 1} von ${schritte.length}`);

  function willkommen() {
    const datei = dateiKnopf('Sicherungsdatei wählen', async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      try { await importiere(JSON.parse(await f.text())); location.reload(); } catch (err) { meldung(err.message, 'warn', 6000); }
    });
    seite(wurzel,
      h('h1', 'Lernwelt'),
      h('p', 'Tägliches Üben für die 1. Klasse: Laute, Buchstaben, Lesen, Schreiben und Rechnen bis 20. Etwa 10 Minuten pro Tag, ohne Druck. Das Kind braucht nicht lesen zu können: Die App spricht alles vor und arbeitet mit Bildern.'),
      h('p', 'Die Einrichtung dauert etwa fünf Minuten: Name des Kindes, Eltern-PIN, Stimme. Alle Daten bleiben auf diesem Gerät.'),
      h('div.knopfreihe', h('button.btn.haupt', { type: 'button', onclick: weiter }, 'Einrichten')),
      h('details', h('summary', 'Daten von einem anderen Gerät übernehmen'),
        h('p.leise.klein', 'Ist der Abgleich zwischen euren Geräten eingerichtet, erscheint der Stand nach dem Öffnen von selbst. Sonst hier die Sicherungsdatei des anderen Geräts wählen.'), datei));
  }

  let eingabeName = Z.profil?.name || '';
  function name() {
    const feld = h('input.feld', { type: 'text', value: eingabeName, maxlength: 30, autocomplete: 'off', 'aria-label': 'Vorname des Kindes' });
    const ok = async () => {
      const n = feld.value.trim();
      if (!n) { meldung('Bitte den Vornamen eingeben.', 'warn'); feld.focus(); return; }
      eingabeName = n;
      if (!Z.profil) await neuesProfil(n, G.P, G.B); else { Z.profil.name = n; await speichere('profil'); }
      weiter();
    };
    feld.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok(); });
    seite(wurzel, schrittText(), h('h1', 'Wie heisst das Kind?'),
      h('p', 'Die App begrüsst das Kind mit diesem Namen. Der Name bleibt auf diesem Gerät und geht auch beim Abgleich zwischen Geräten nicht mit.'),
      h('label.formular', 'Vorname', feld), fuss('Weiter', ok));
    setTimeout(() => feld.focus(), 50);
  }

  function pin() {
    const a = h('input.feld.pin', { type: 'password', inputmode: 'numeric', maxlength: 6, autocomplete: 'new-password', 'aria-label': 'PIN' });
    const b = h('input.feld.pin', { type: 'password', inputmode: 'numeric', maxlength: 6, autocomplete: 'new-password', 'aria-label': 'PIN wiederholen' });
    const ok = async () => {
      if (!/^\d{4,6}$/.test(a.value)) { meldung('Bitte 4 bis 6 Ziffern.', 'warn'); return; }
      if (a.value !== b.value) { meldung('Die beiden PINs sind nicht gleich.', 'warn'); b.value = ''; b.focus(); return; }
      await setzePin(a.value); weiter();
    };
    const ohne = async () => {
      if (!await dialog('Ohne PIN weiter?', h('p', 'Dann kann das Kind über das Schloss in den Elternbereich und dort Einstellungen ändern. Die PIN lässt sich später unter Einstellungen festlegen.'), [{ text: 'Zurück', wert: false }, { text: 'Ohne PIN weiter', wert: true }])) return;
      weiter();
    };
    seite(wurzel, schrittText(), h('h1', 'Eltern-PIN'),
      h('p', 'Der Elternbereich (Schloss oben rechts) zeigt den Stand und die Einstellungen. Eine PIN hält das Kind dort fern. Sie ist eine Kindersicherung, kein Zugangsschutz.'),
      h('label.formular', 'PIN (4 bis 6 Ziffern)', a), h('label.formular', 'PIN wiederholen', b),
      fuss('PIN speichern', ok), h('div.knopfreihe', h('button.btn.leise.klein', { type: 'button', onclick: ohne }, 'Ohne PIN weiter')));
  }

  function stimme() {
    konfiguriere({ stimme: Z.einstellungen.stimme, tempo: Z.einstellungen.tempo });
    seite(wurzel, schrittText(), h('h1', 'Stimme einrichten'),
      h('p', 'Das Kind kann noch nicht lesen. Darum spricht die App jeden Auftrag, jeden Hinweis und jede Rückmeldung mit der Stimme des Geräts. Bitte die Stimme anhören und den kurzen Hörtest machen; danach weiss die App, welche Aufgaben mit dieser Stimme gut klingen.'),
      stimmAbschnitt(), fuss('Weiter'));
  }

  function ipad() {
    seite(wurzel, schrittText(), h('h1', 'Fast fertig'),
      h('ul.liste',
        h('li', h('strong', 'Zum Home-Bildschirm: '), 'In Safari auf «Teilen» tippen und «Zum Home-Bildschirm» wählen. Die Lernwelt danach immer über das Symbol öffnen; dann läuft sie im Vollbild und offline, und Safari löscht die Daten nicht.'),
        h('li', h('strong', 'Ton: '), 'Lautstärke hoch, Stummschalter aus. Ohne Ton geht vieles nicht.'),
        h('li', h('strong', 'Beim ersten Mal: '), 'Der Fuchs zeigt dem Kind in einer kurzen Runde alle Knöpfe. Am besten einmal daneben sitzen.'),
        h('li', h('strong', 'Elternbereich: '), 'Über das Schloss oben rechts. Dort lassen sich die eingeführten Buchstaben, das aktuelle Mathematik-Kapitel und die Lernzeit einstellen.')),
      fuss('Zum Kinderbereich', () => { location.hash = '#/'; fertig(); }));
  }

  willkommen();
}

// Stand kam von einem anderen Gerät: nur noch den Namen erfragen (er geht beim Abgleich nie mit)
export function zeigeNamen(wurzel, fertig) {
  const feld = h('input.feld', { type: 'text', maxlength: 30, autocomplete: 'off', 'aria-label': 'Vorname des Kindes' });
  const ok = async () => {
    const n = feld.value.trim();
    if (!n) { meldung('Bitte den Vornamen eingeben.', 'warn'); return; }
    Z.profil.name = n; await speichere('profil'); fertig();
  };
  feld.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok(); });
  seite(wurzel, h('h1', 'Willkommen zurück'),
    h('p', 'Der Lernstand ist von einem anderen Gerät übernommen worden. Der Name des Kindes geht beim Abgleich nie mit; bitte hier noch einmal eingeben.'),
    h('label.formular', 'Vorname', feld), h('div.knopfreihe', h('button.btn.haupt', { type: 'button', onclick: ok }, 'Weiter')));
  setTimeout(() => feld.focus(), 50);
}
