// Stimme einrichten (Eltern): deutsche Stimme wählen, Probesatz, Hörtest für Silben und Dehnlaute, Tempo.
import { h, meldung } from './dom.js';
import { Z, speichere } from '../app/zustand.js';
import { G } from '../app/steuerung.js';
import { deutscheStimmen, stimmeDa, stimmeInfo, konfiguriere, sprich, sprachBereit, stopp } from '../app/sprache.js';
import { entsperren } from './kind.js';

const IOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export function anleitungStimme() {
  return h('div.anleitung',
    h('p', IOS ? 'So lädt man auf dem iPad eine gute deutsche Stimme:' : 'So lädt man eine deutsche Stimme:'),
    IOS ? h('ol',
      h('li', 'Einstellungen öffnen › Bedienungshilfen › Gesprochene Inhalte › Stimmen.'),
      h('li', 'Deutsch wählen. Gibt es «Deutsch (Schweiz)», diese nehmen, sonst Deutsch (Deutschland).'),
      h('li', 'Eine Stimme mit dem Zusatz «Erweitert» oder «Premium» laden (sie klingt natürlicher, braucht einige hundert MB).'),
      h('li', 'Zurück in die Lernwelt, diese Seite neu öffnen und die Stimme hier wählen.'))
      : h('ol',
        h('li', 'In den Einstellungen des Geräts bei «Sprache» oder «Text-to-Speech» eine deutsche Stimme hinzufügen.'),
        h('li', 'Die Lernwelt neu laden und die Stimme hier wählen.')),
    h('p.leise.klein', 'Die Lernwelt verwendet nur Stimmen, die auf dem Gerät gespeichert sind. Nichts wird an einen Dienst gesendet. Lautstärke hoch stellen; auf dem iPad den Stummschalter prüfen.'));
}

// Baut den Abschnitt; nachAenderung wird nach jeder gespeicherten Änderung aufgerufen
export function stimmAbschnitt({ nachAenderung = () => {}, kompakt = false } = {}) {
  const e = Z.einstellungen;
  const box = h('div.stimmtest');
  const speichern = () => { speichere('einstellungen'); nachAenderung(); };

  async function aufbauen() {
    await sprachBereit();
    const liste = deutscheStimmen();
    if (!liste.length) {
      box.replaceChildren(h('p.banner', 'Auf diesem Gerät ist keine deutsche Stimme gefunden worden. Ohne Stimme spielt die Lernwelt nur Aufgaben, die ohne Ton gehen.'), anleitungStimme(),
        h('div.knopfreihe', h('button.btn', { type: 'button', onclick: () => location.reload() }, 'Neu suchen')));
      return;
    }
    const aktuell = stimmeInfo();
    const wahl = h('select.feld', { 'aria-label': 'Stimme', onchange: () => { e.stimme = wahl.value; konfiguriere({ stimme: wahl.value }); speichern(); probe(); } },
      liste.map((v) => h('option', { value: v.name, selected: aktuell?.name === v.name }, `${v.name} (${v.lang})`)));
    const tempo = h('input', { type: 'range', min: G.P.sprache.tempoMin, max: G.P.sprache.tempoMax, step: 0.05, value: e.tempo, 'aria-label': 'Sprechtempo',
      onchange: () => { e.tempo = Number(tempo.value); konfiguriere({ tempo: e.tempo }); speichern(); probe(); } });
    const probe = () => { entsperren(); sprich(`Hallo ${Z.profil?.name || ''}! Ich bin die Stimme der Lernwelt. Hörst du mich gut?`); };

    const testZeile = (titel, erklaerung, abspielen, schalter) => {
      const status = h('span.chip', e[schalter] ? 'ein' : 'aus');
      const setze = (wert) => { e[schalter] = wert; e.hoertest = { ...(e.hoertest || {}), [schalter]: wert, am: Date.now() }; status.textContent = wert ? 'ein' : 'aus'; speichern(); meldung(wert ? `${titel}: eingeschaltet.` : `${titel}: ausgeschaltet. Die App lässt diese Aufgaben weg.`); };
      return h('div.hoertest',
        h('div.hoertest-kopf', h('strong', titel), status),
        h('p.leise.klein', erklaerung),
        h('div.knopfreihe',
          h('button.btn', { type: 'button', onclick: () => { entsperren(); abspielen(); } }, 'Anhören'),
          h('button.btn.leise', { type: 'button', onclick: () => setze(true) }, 'Klingt richtig'),
          h('button.btn.leise', { type: 'button', onclick: () => setze(false) }, 'Klingt falsch')));
    };
    const D = G.P.sprache.dehnlautText;
    box.replaceChildren(
      h('label.formular', 'Stimme', wahl),
      h('div.knopfreihe', h('button.btn.haupt', { type: 'button', onclick: probe }, 'Probesatz anhören'), h('button.btn.leise', { type: 'button', onclick: stopp }, 'Stopp')),
      h('label.formular', 'Sprechtempo', h('div.regler', h('span.leise.klein', 'langsamer'), tempo, h('span.leise.klein', 'schneller'))),
      kompakt ? null : h('h3', 'Hörtest'),
      testZeile('Silben einzeln vorsprechen', 'Die Stimme sagt «So … fa», «La … ma», «Ki … wi» mit Pausen. Klingen die Silben wie beim Klatschen?',
        () => sprich('So … fa … La … ma … Ki … wi'), 'silben'),
      testZeile('Dehnlaute vorsprechen', 'Die Stimme sagt lang gezogene Laute: «mmm», «sss», «fff», «aaa». Klingen sie wie gedehnte Laute (nicht wie Buchstabennamen)?',
        () => sprich([D.m, D.s, D.f, D.a].filter(Boolean)), 'dehnlaute'),
      h('details', h('summary', 'Bessere Stimme laden'), anleitungStimme()));
  }
  aufbauen();
  return box;
}

export const stimmeBereit = () => stimmeDa();
