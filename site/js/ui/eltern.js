// Elternbereich hinter der Eltern-PIN (nur Kindersicherung). Eigener Übungsmassstab, keine Beurteilung, keine Prognose.
import { h, leere, meldung, dialog, dateiKnopf } from './dom.js';
import { Z, S, speichere, pruefePin, setzePin, exportiere, importiere, zuruecksetzen } from '../app/zustand.js';
import { G, K, heute, speicher, backupTage, istLerntag, freiGrund } from '../app/steuerung.js';
import { status as abgleich, gleicheAb, neuAnmelden, zuruecksetzenUeberall } from '../app/abgleich.js';
import { dauerhaftSpeichern, speicherStatus } from '../app/db.js';
import { datumText, isoVonNr, tagNr } from '../core/util.js';
import { stimmAbschnitt } from './stimmtest.js';
import { setzeTon } from '../app/klang.js';
import { stopp } from '../app/sprache.js';
import { symbol } from './figuren.js';

const TEILE = [['ueberblick', 'Überblick'], ['buchstaben', 'Buchstaben'], ['mathematik', 'Mathematik'], ['lernwoerter', 'Lernwörter'], ['einstellungen', 'Einstellungen'], ['daten', 'Daten'], ['grenzen', 'Grenzen']];
const OFFEN_MS = 15 * 60 * 1000;
const TAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function offen() { try { return Number(sessionStorage.getItem('eltern-offen') || 0) > Date.now(); } catch { return false; } }
function oeffne() { try { sessionStorage.setItem('eltern-offen', String(Date.now() + OFFEN_MS)); } catch { /* egal */ } }
export function schliesseEltern() { try { sessionStorage.removeItem('eltern-offen'); } catch { /* egal */ } }

function rahmen(wurzel) {
  stopp();
  document.body.classList.remove('kindmodus');
  document.body.classList.add('elternmodus');
  const main = h('main.seite.eltern', { tabindex: -1 });
  leere(wurzel, main);
  return main;
}

export function zeigeEltern(wurzel, rest = []) {
  const main = rahmen(wurzel);
  if (Z.profil.pin && !offen()) return pinTor(main, wurzel, rest);
  oeffne();
  const teil = TEILE.some(([id]) => id === rest[0]) ? rest[0] : 'ueberblick';
  const nav = h('nav.eltern-nav', { 'aria-label': 'Elternbereich' }, TEILE.map(([id, name]) => h('a' + (id === teil ? '.an' : ''), { href: `#/eltern/${id}`, 'aria-current': id === teil ? 'page' : null }, name)));
  const inhalt = h('div.eltern-inhalt');
  leere(main, h('div.eltern-kopf', h('h1', 'Elternbereich'),
    h('button.btn.leise', { type: 'button', onclick: () => { schliesseEltern(); location.hash = '#/'; } }, symbol('haus', { klasse: 'btn-sym' }), 'Zum Kinderbereich')), nav, inhalt);
  const neu = () => zeigeEltern(wurzel, [teil]);
  const f = { ueberblick: teilUeberblick, buchstaben: teilBuchstaben, mathematik: teilMathematik, lernwoerter: teilLernwoerter, einstellungen: teilEinstellungen, daten: teilDaten, grenzen: teilGrenzen }[teil];
  Promise.resolve(f(inhalt, neu)).catch((e) => { console.error(e); leere(inhalt, h('p.fehlertext', String(e.message || e))); });
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function pinTor(main, wurzel, rest) {
  const pin = h('input.feld.pin', { type: 'password', inputmode: 'numeric', autocomplete: 'current-password', maxlength: 6, 'aria-label': 'PIN' });
  const fehler = h('p.fehlertext', { role: 'alert' });
  const pruefen = async () => {
    if (await pruefePin(pin.value)) { oeffne(); zeigeEltern(wurzel, rest); }
    else { fehler.textContent = 'Die PIN stimmt nicht.'; pin.value = ''; pin.focus(); }
  };
  pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') pruefen(); });
  leere(main, h('section.blatt.pin-blatt', h('h1', 'Elternbereich'), h('p', 'Bitte die Eltern-PIN eingeben.'), pin, fehler,
    h('div.knopfreihe', h('a.btn.leise', { href: '#/' }, 'Zurück'), h('button.btn.haupt', { type: 'button', onclick: pruefen }, 'Öffnen')),
    h('details.leise.klein', h('summary', 'PIN vergessen?'), h('p', 'Die PIN lässt sich nicht auslesen. Ausweg: auf einem anderen Gerät mit demselben Stand (Abgleich) die PIN ändern, oder eine Sicherung einspielen, nachdem die Website-Daten dieser Seite im Browser gelöscht wurden. Ohne Sicherung geht der Stand dabei verloren.'))));
  setTimeout(() => pin.focus(), 50);
}

// --- Überblick ---
function teilUeberblick(el) {
  const t = heute();
  const plan = Z.tagesplan?.tag === t ? Z.tagesplan : null;
  const frei = freiGrund(t);
  const naechsteFerien = K.ferien.find((f) => f.bis >= t);
  const etappen = K.etappen.filter((e) => e.tag >= t);
  const letzte = Z.backup?.letztes;
  leere(el,
    !letzte || t - letzte > backupTage() ? h('p.banner', letzte ? `Die letzte Sicherung ist vom ${datumText(letzte)}. Bitte unter «Daten» eine neue herunterladen.` : 'Es gibt noch keine Sicherung. Bitte unter «Daten» eine herunterladen.') : null,
    h('section.blatt', h('h2', 'Heute'),
      h('p', `${datumText(t, true)}: ${frei ? (frei === 'kein Lerntag' ? 'kein Lerntag (in den Einstellungen änderbar).' : `${frei}, nichts geplant.`) : `Lerntag, ${Z.einstellungen.minuten} Minuten.`}`),
      plan ? h('p.leise', `Steine heute: ${plan.steine.length}, erledigt: ${plan.erledigt.length}.`) : null,
      naechsteFerien ? h('p.leise.klein', `Nächste Ferien: ${naechsteFerien.name}, ${datumText(naechsteFerien.von)} bis ${datumText(naechsteFerien.bis)}.`) : null),
    h('section.blatt', h('h2', 'Stand'), h('p.massstab', 'Eigener Übungsmassstab dieser App, keine Beurteilung der Schule.'),
      h('p.leise', 'Der Stand je Fertigkeit (neu, am Üben, fast sicher, sicher) erscheint hier, sobald das Kind übt.')),
    h('section.blatt', h('h2', 'Etappen zur Orientierung'),
      h('p.leise.klein', G.Z.etappenHinweis),
      h('ul.liste', etappen.map((e) => h('li', h('strong', e.name), ` – ${datumText(e.tag)}`)))),
    h('p.leise.klein', `Version ${document.documentElement.dataset.version || ''}`));
}

// --- Buchstabenplan ---
function teilBuchstaben(el) {
  const B = Z.buchstaben;
  const info = new Map(G.B.liste.map((b) => [b.id, b]));
  const gruppe = (art) => B.reihenfolge.filter((id) => info.get(id) && (art === 'verbindung' ? info.get(id).art === 'verbindung' : info.get(id).art !== 'verbindung'));
  const kachel = (id) => {
    const b = info.get(id);
    const box = h('input', { type: 'checkbox', checked: !!B.frei[id], onchange: () => { B.frei[id] = box.checked; speichere('buchstaben'); } });
    return h('label.bkachel', box, h('span.bk-zeichen', b.anzeige), h('span.bk-wort.leise', `${b.wort}${b.form === 'mehrzahl' ? ' (Mehrzahl)' : ''}`));
  };
  const alle = (ids, wert, neu) => () => { for (const id of ids) B.frei[id] = wert; speichere('buchstaben'); neu(); };
  const einzeln = gruppe('einzel'), verb = gruppe('verbindung');
  const zeichne = () => leere(el,
    h('section.blatt', h('h2', 'Buchstabenplan'),
      h('p', 'Lese- und Schreibaufgaben verwenden nur Buchstaben und Verbindungen, die hier abgehakt sind. Hören und Lautieren dürfen alle Laute nutzen. Bitte die Reihenfolge und den Stand der Schule übernehmen.'),
      h('p.leise.klein', G.B.hinweis)),
    h('section.blatt', h('h2', 'Einzelbuchstaben'),
      h('div.knopfreihe', h('button.btn.klein', { type: 'button', onclick: alle(einzeln, true, zeichne) }, 'Alle abhaken'), h('button.btn.klein.leise', { type: 'button', onclick: alle(einzeln, false, zeichne) }, 'Alle entfernen')),
      h('div.bkacheln', einzeln.map(kachel))),
    h('section.blatt', h('h2', 'Verbindungen'),
      h('p.leise.klein', 'Welche Verbindungen die Klasse schon hat, weiss die Lehrperson. Angenommen sind Sch, Ei und Au. Häufige Wörter wie «ich», «die» oder «nicht» übt die App als Wortbild auch ohne ch und ie.'),
      h('div.knopfreihe', h('button.btn.klein', { type: 'button', onclick: alle(verb, true, zeichne) }, 'Alle abhaken'), h('button.btn.klein.leise', { type: 'button', onclick: alle(verb, false, zeichne) }, 'Alle entfernen')),
      h('div.bkacheln', verb.map(kachel))));
  zeichne();
}

// --- Mathematik: Kapitel und Zahlenraum ---
function teilMathematik(el, neu) {
  const e = Z.einstellungen;
  const kap = G.LM.faecher.M.kapitel;
  const wahl = h('select.feld', { 'aria-label': 'Aktuelles Kapitel', onchange: () => { e.kapitel = wahl.value || null; speichere('einstellungen'); meldung('Gespeichert.'); } },
    h('option', { value: '', selected: !e.kapitel }, 'Automatisch nach Datum (Jahresplanung)'),
    kap.map((k) => h('option', { value: k.name, selected: e.kapitel === k.name }, `${k.name} (${monatText(k.monat)})`)));
  const raum = [10, 20, 100].map((n) => h('label.wahl', h('input', { type: 'radio', name: 'raum', value: n, checked: e.zahlenraum === n, onchange: () => { e.zahlenraum = n; speichere('einstellungen'); meldung(`Zahlenraum bis ${n} freigegeben.`); neu(); } }), ` bis ${n}`));
  leere(el,
    h('section.blatt', h('h2', 'Aktuelles Kapitel'),
      h('p', `Lehrmittel: ${G.LM.faecher.M.lehrmittel}. Der Tagesplan nimmt das Kapitel, das gerade in der Schule dran ist, regelmässig dran. Ohne Angabe schätzt die App es aus der Jahresplanung und dem Datum.`),
      h('label.formular', 'Kapitel', wahl),
      h('p.leise.klein', 'Die Zuordnung der Kapitel zu den Übungen ist eine Annahme der App.')),
    h('section.blatt', h('h2', 'Zahlenraum'),
      h('p', 'Aufgaben verwenden nie grössere Zahlen als hier freigegeben. Bis 100 erst gegen Ende der 1. Klasse und nur, wenn bis 20 sicher sitzt.'),
      h('div.wahlreihe', raum)));
}
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const monatText = (m) => m.split('-').map((x) => MONATE[Number(x) - 1]).join(' bis ');

// --- Lernwörter (ab Etappe 6) ---
function teilLernwoerter(el) {
  leere(el, h('section.blatt', h('h2', 'Lernwörter der Woche'),
    h('p', 'Hier lassen sich bald die Lernwörter der Schule eintragen, mit dem Datum des Wörtertests. Die App übt sie dann im Karteikasten.')));
}

// --- Einstellungen ---
function teilEinstellungen(el, neu) {
  const e = Z.einstellungen;
  const P = G.P;
  const spe = (text = 'Gespeichert.') => { speichere('einstellungen'); meldung(text); };
  const minuten = h('input', { type: 'range', min: P.lernzeit.minMinuten, max: P.lernzeit.maxMinuten, step: 1, value: e.minuten, 'aria-label': 'Minuten pro Lerntag',
    oninput: () => { minText.textContent = `${minuten.value} Minuten`; }, onchange: () => { e.minuten = Number(minuten.value); spe(); } });
  const minText = h('strong', `${e.minuten} Minuten`);
  const tage = TAGE.map((t, i) => {
    const box = h('input', { type: 'checkbox', checked: e.lernTage.includes(i + 1), onchange: () => {
      e.lernTage = box.checked ? [...new Set([...e.lernTage, i + 1])].sort() : e.lernTage.filter((x) => x !== i + 1);
      spe();
    } });
    return h('label.wahl', box, ' ' + t);
  });
  const dAnteil = Math.round((e.gewichtung.D ?? 0.55) * 100);
  const gew = h('input', { type: 'range', min: 30, max: 70, step: 5, value: dAnteil, 'aria-label': 'Anteil Deutsch',
    oninput: () => { gewText.textContent = `Deutsch ${gew.value} %, Mathematik ${100 - gew.value} %`; },
    onchange: () => { e.gewichtung = { D: Number(gew.value) / 100, M: (100 - Number(gew.value)) / 100 }; spe(); } });
  const gewText = h('strong', `Deutsch ${dAnteil} %, Mathematik ${100 - dAnteil} %`);
  const schalter = (feld, titel, text, nach = () => {}) => {
    const box = h('input', { type: 'checkbox', checked: e[feld] !== false, onchange: () => { e[feld] = box.checked; nach(box.checked); spe(); } });
    return h('label.schalter', box, h('span', h('strong', titel), h('span.leise.klein', text)));
  };
  const begriffFeld = (k, titel) => {
    const f = h('input.feld', { type: 'text', value: e.begriffe?.[k] || P.begriffe[k], maxlength: 30, onchange: () => { e.begriffe = { ...(e.begriffe || {}), [k]: f.value.trim() || P.begriffe[k] }; spe(); } });
    return h('label.formular', titel, f);
  };
  const name = h('input.feld', { type: 'text', value: Z.profil.name, maxlength: 30 });
  const pin = h('input.feld.pin', { type: 'password', inputmode: 'numeric', maxlength: 6, autocomplete: 'new-password', placeholder: 'neue PIN' });
  leere(el,
    h('section.blatt', h('h2', 'Lernzeit'),
      h('label.formular', 'Minuten pro Lerntag', h('div.regler', minuten, minText)),
      h('p.leise.klein', 'Empfohlen sind etwa 10 Minuten. Die Zeit ist fest; der Inhalt passt sich an.'),
      h('div.formular', h('span', 'Lerntage'), h('div.wahlreihe', tage)),
      h('p.leise.klein', 'In den Ferien und an Feiertagen der Schule Schlieren ist nichts geplant.'),
      h('label.formular', 'Verteilung', h('div.regler', gew, gewText))),
    h('section.blatt', h('h2', 'Stimme'), stimmAbschnitt({ nachAenderung: () => {} })),
    h('section.blatt', h('h2', 'Kinderbereich'),
      schalter('ton', 'Töne', 'Leise Bestätigungstöne bei richtigen Antworten und beim Antippen.', (an) => setzeTon(an)),
      schalter('belohnung', 'Sammelbild', 'Nach jeder Sitzung kommt ein Teil ins Sammelbild (Wald, Wiese, See).'),
      schalter('vorlesen', 'Vorlesen-Aufgabe', 'Das Kind liest einer erwachsenen Person ein Wort vor; diese tippt «geklappt» oder «üben wir noch». Nur einschalten, wenn beim Üben meist jemand dabei ist.')),
    h('section.blatt', h('h2', 'Gesprochene Fachbegriffe'),
      h('p.leise.klein', 'So nennt die Stimme die Darstellungen. Bitte an die Wörter der Klasse anpassen.'),
      begriffFeld('zwanzigerfeld', 'Zwanzigerfeld'), begriffFeld('zerlegungshaus', 'Zerlegungshaus'), begriffFeld('schuettelbox', 'Schüttelbox')),
    h('section.blatt', h('h2', 'Name des Kindes'), h('p.leise.klein', 'Bleibt auf diesem Gerät.'), name,
      h('div.knopfreihe', h('button.btn', { type: 'button', onclick: async () => { if (!name.value.trim()) return; Z.profil.name = name.value.trim(); await speichere('profil'); meldung('Name gespeichert.'); } }, 'Name speichern'))),
    h('section.blatt', h('h2', 'Eltern-PIN'), h('p.leise.klein', 'Nur eine Kindersicherung. Leer lassen und speichern entfernt die PIN.'), pin,
      h('div.knopfreihe', h('button.btn', { type: 'button', onclick: async () => {
        if (pin.value && !/^\d{4,6}$/.test(pin.value)) { meldung('Bitte 4 bis 6 Ziffern.', 'warn'); return; }
        await setzePin(pin.value); meldung(pin.value ? 'PIN gespeichert.' : 'PIN entfernt.'); pin.value = '';
      } }, 'PIN speichern'))));
  void neu;
}

// --- Daten: Abgleich, Sicherung, Speicher, Zurücksetzen ---
function laden(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const ABGLEICH_TEXT = {
  aktiv: 'Der Lernstand wird zwischen euren Geräten abgeglichen: beim Öffnen, nach dem Üben und beim Wechsel in eine andere App.',
  aus: 'Der Abgleich ist nicht eingerichtet. Alle Daten liegen nur auf diesem Gerät.',
  offline: 'Gerade keine Verbindung. Änderungen werden abgeglichen, sobald das Gerät wieder online ist.',
  anmeldung: 'Die Anmeldung ist abgelaufen. Geübt werden kann weiter; abgeglichen wird erst nach dem neuen Anmelden mit Mailadresse und Code.',
  fehler: 'Der letzte Abgleich hat nicht geklappt.',
  unbekannt: 'Der Abgleich wurde noch nicht versucht.',
};
function teilDaten(el, neu) {
  const t = heute();
  const letzte = Z.backup?.letztes;
  const sichern = async () => {
    const d = await exportiere();
    laden(JSON.stringify(d), `lernwelt-sicherung-${isoVonNr(t)}.json`);
    Z.backup = { ...(Z.backup || {}), letztes: t }; await speichere('backup');
    meldung('Sicherung heruntergeladen. Die Datei an einem sicheren Ort aufbewahren (iCloud Drive oder per Mail an sich selbst).', 'info', 5000); neu();
  };
  const wiederherstellen = dateiKnopf('Sicherungsdatei wählen', async (ev) => {
    const datei = ev.target.files[0]; if (!datei) return;
    if (datei.size > 60 * 1024 * 1024) { meldung('Diese Datei ist zu gross für eine Sicherung der Lernwelt.', 'warn', 6000); return; }
    try {
      const obj = JSON.parse(await datei.text());
      if (!await dialog('Sicherung einspielen?', h('p', 'Alle Daten auf diesem Gerät werden durch die Sicherung ersetzt.'), [{ text: 'Abbrechen', wert: false }, { text: 'Ersetzen', wert: true, gefahr: true }])) return;
      await importiere(obj); location.reload();
    } catch (err) { meldung(err.message, 'warn', 6000); }
  });
  const z = abgleich.zustand;
  const letzterAbgleich = S.letzter ? new Date(S.letzter).toLocaleString('de-CH', { dateStyle: 'medium', timeStyle: 'short' }) : null;
  const mitServer = z !== 'aus';
  const gut = speicher.dauerhaft || speicher.installiert;
  leere(el,
    h('section.blatt', h('h2', 'Abgleich zwischen Geräten'),
      h('p', ABGLEICH_TEXT[z] || ABGLEICH_TEXT.unbekannt),
      (z === 'fehler' || z === 'aus') && abgleich.text && !/keinen Abgleich/.test(abgleich.text) ? h('p.leise.klein', abgleich.text) : null,
      z !== 'aus' ? h('p.leise.klein', [S.wer ? `Angemeldet als ${S.wer}.` : null, letzterAbgleich ? `Zuletzt abgeglichen: ${letzterAbgleich}.` : null, S.offen.length ? `${S.offen.length} Bereiche noch nicht hochgeladen.` : null].filter(Boolean).join(' ')) : null,
      z !== 'aus' ? h('div.knopfreihe', z === 'anmeldung' ? h('button.btn.haupt', { type: 'button', onclick: neuAnmelden }, 'Neu anmelden')
        : h('button.btn', { type: 'button', onclick: async (ev) => { ev.target.disabled = true; await gleicheAb({ erzwingen: true }); neu(); } }, 'Jetzt abgleichen')) : null),
    h('section.blatt', h('h2', 'Sicherung'),
      h('p', `${z === 'aktiv' ? 'Eine Kopie liegt online; eine Sicherungsdatei schützt zusätzlich, etwa vor versehentlichem Löschen.' : 'Alle Daten liegen nur auf diesem Gerät.'} ${letzte ? `Letzte Sicherung: ${datumText(letzte)}.` : 'Es gibt noch keine Sicherung.'}`),
      h('div.knopfreihe', h('button.btn.haupt', { type: 'button', onclick: sichern }, 'Sicherung herunterladen')),
      h('h3', 'Sicherung einspielen oder Gerät wechseln'), h('p.leise.klein', 'Auf dem neuen Gerät die Lernwelt öffnen und hier die Sicherungsdatei wählen.'), wiederherstellen),
    h('section.blatt', h('h2', 'Speicher auf diesem Gerät'),
      h('p', gut ? 'Der Browser bewahrt die Daten dauerhaft auf.' : 'Der Browser darf die Daten bei Platzmangel oder längerer Nichtbenutzung löschen.'),
      !speicher.installiert ? h('p.leise.klein', 'Sicherer auf dem iPad: in Safari «Teilen › Zum Home-Bildschirm» und die Lernwelt danach immer über das Symbol öffnen. Safari-Tab und Symbol haben getrennte Speicher: vorher hier sichern und im Symbol wieder einspielen.') : null,
      !gut ? h('div.knopfreihe', h('button.btn', { type: 'button', onclick: async () => { await dauerhaftSpeichern(); Object.assign(speicher, await speicherStatus()); neu(); } }, 'Dauerhaft speichern anfragen')) : null,
      h('p.leise.klein', `Erinnerung an die Sicherung nach ${backupTage()} Tagen.`)),
    h('section.blatt.gefahr-blatt', h('h2', 'Zurücksetzen'),
      h('p', mitServer ? 'Löscht alle Lernstände und Einstellungen online und auf allen Geräten (braucht eine Verbindung). Vorher sichern.' : 'Löscht alle Lernstände und Einstellungen auf diesem Gerät. Vorher sichern.'),
      h('button.btn.gefahr', { type: 'button', onclick: async () => {
        const wo = mitServer ? 'online und auf allen Geräten' : 'auf diesem Gerät';
        if (!await dialog('Wirklich alles löschen?', h('p', `Alles wird ${wo} gelöscht. Das lässt sich nicht rückgängig machen.`), [{ text: 'Abbrechen', wert: false }, { text: 'Alles löschen', wert: true, gefahr: true }])) return;
        if (mitServer) {
          try { await zuruecksetzenUeberall(); } catch (err) {
            if (err.zustand === 'aus') { await zuruecksetzen(); location.hash = ''; location.reload(); return; }
            meldung(`Zurücksetzen nicht möglich: ${err.message} Bitte mit Verbindung erneut versuchen.`, 'warn', 9000); return;
          }
        } else await zuruecksetzen();
        location.hash = ''; location.reload();
      } }, 'Alles löschen')),
    h('p.leise.klein', `Version ${document.documentElement.dataset.version || ''}`));
  void tagNr; void istLerntag;
}

// --- Grenzen ---
function teilGrenzen(el) {
  leere(el, h('section.blatt', h('h2', 'Was die Lernwelt kann und was nicht'),
    h('ul.liste',
      h('li', 'Sie übt täglich kurz, was in der 1. Klasse dran ist: Laute hören, Buchstaben, Silben und Wörter lesen, lautgetreu schreiben, Zahlen bis 20, Rechnen, Formen, Grössen.'),
      h('li', '«Sicher» ist ein eigener Übungsmassstab aus wenigen Aufgaben, keine Beurteilung der Schule und keine Prognose.'),
      h('li', 'Die Stimme des Geräts ist eine Annäherung. Laute klingen nicht wie bei der Lehrperson. Sprechen und Vorlesen prüft die App nicht (kein Mikrofon).'),
      h('li', 'Nachspuren ist Übung, keine Beurteilung der Handschrift.'),
      h('li', 'Die Inhalte sind KI-erzeugt und automatisch geprüft, aber von keinem Menschen gegengelesen. Fehler bitte über «Aufgabe melden» festhalten.'),
      h('li', h('strong', 'Die App ersetzt keine Förderung. '), 'Halten Schwierigkeiten mit Lauten, Zahlen oder Mengen an, ist das Gespräch mit der Lehrperson der richtige Weg. Eine Abklärung organisiert die Schule.'))));
}
