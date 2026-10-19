// Einstieg: Daten laden, Ansicht wählen, Service Worker anmelden.
import { h, leere, meldung, dateiKnopf } from './ui/dom.js';
import { Z, ladeZustand } from './app/zustand.js';
import { init, G } from './app/steuerung.js';
import { initSprache, konfiguriere, stopp } from './app/sprache.js';
import { setzeTon } from './app/klang.js';
import { dauerhaftSpeichern } from './app/db.js';
import { gleicheAbHoechstens, starteAutomatik, status as abgleichStatus, neuAnmelden } from './app/abgleich.js';
import { zeigeStart, zeigeWeg, entsperren } from './ui/kind.js';
import { zeigeEinfuehrung } from './ui/einfuehrung.js';
import { zeigeEinrichtung, zeigeNamen } from './ui/einrichtung.js';
import { zeigeEltern, schliesseEltern } from './ui/eltern.js';
import { versteckeHand } from './ui/zeigehand.js';
import { zeigeVorschau } from './ui/baustein.js';
import { elternOffen } from './ui/eltern.js';

const wurzel = document.getElementById('app');

export function route() {
  stopp(); versteckeHand();
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  if (!Z.profil || !Z.einstellungen) { zeigeEinrichtung(wurzel, () => route()); return; }
  if (!Z.profil.name) { zeigeNamen(wurzel, () => route()); return; }   // Stand kam von einem anderen Gerät
  konfiguriere({ stimme: Z.einstellungen.stimme, tempo: Z.einstellungen.tempo });
  setzeTon(Z.einstellungen.ton);
  const [teil, ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  if (teil !== 'eltern' && teil !== 'vorschau') schliesseEltern();   // Elternbereich beim Verlassen wieder sperren
  try {
    if (teil === 'eltern') zeigeEltern(wurzel, rest);
    else if (teil === 'weg') zeigeWeg(wurzel);
    else if (teil === 'einfuehrung') zeigeEinfuehrung(wurzel);
    else if (teil === 'vorschau') { if (elternOffen()) { entsperren(); zeigeVorschau(wurzel, rest[0], rest[1]); } else location.hash = '#/eltern'; }
    else zeigeStart(wurzel);
  } catch (e) {
    console.error(e);
    leere(wurzel, h('div.seite', h('section.blatt', h('h1', 'Da ist etwas schiefgelaufen.'), h('p', String(e.message || e)), h('button.btn', { onclick: () => location.reload() }, 'Neu laden'))));
  }
}

async function start() {
  try {
    await ladeZustand();
    window.addEventListener('fernaenderung', fernaenderung);
    await gleicheAbHoechstens(Z.profil ? 2500 : 8000);   // Neues von anderen Geräten holen (neues Gerät: etwas länger warten)
    await init();
    initSprache(G.P);
    if (Z.profil) dauerhaftSpeichern();
    window.addEventListener('hashchange', () => { if (!document.body.classList.contains('in-sitzung')) route(); });
    window.addEventListener('speicherfehler', speicherWarnung);
    window.addEventListener('fern-zurueckgesetzt', () => { location.hash = ''; location.reload(); });
    starteAutomatik();
    window.addEventListener('abgleich-status', anmeldungHinweis);
    gestartet = true;
    route();
  } catch (e) {
    console.error(e);
    startFehler(e);
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') meldeServiceWorker();
}

// Neues von einem anderen Gerät: Ansicht nur auffrischen, wenn gerade keine Sitzung läuft und nicht im Elternbereich
let gestartet = false;
async function fernaenderung() {
  if (!gestartet || document.body.classList.contains('in-sitzung')) return;
  try { await init(); } catch (err) { console.error(err); }
  if (!Z.profil || !Z.profil.name) route();
}

// Access-Anmeldung abgelaufen: ein ruhiger Hinweis, nur im Elternbereich (das Kind kann nicht lesen)
let anmeldungGezeigt = false;
function anmeldungHinweis() {
  if (anmeldungGezeigt || abgleichStatus.zustand !== 'anmeldung' || !document.body.classList.contains('elternmodus')) return;
  anmeldungGezeigt = true;
  const el = h('div.update-hinweis', { role: 'status' }, h('span', 'Abgleich pausiert: Die Anmeldung ist abgelaufen.'),
    h('button.btn.klein.haupt', { type: 'button', onclick: () => neuAnmelden() }, 'Neu anmelden'),
    h('button.btn.klein.leise', { type: 'button', onclick: () => el.remove() }, 'Später'));
  document.body.append(el);
}

// Speichern fehlgeschlagen: bleibender Hinweis statt stiller Datenverlust
let warnungDa = false;
function speicherWarnung() {
  if (warnungDa) return;
  warnungDa = true;
  const el = h('div.speicherwarnung', { role: 'alert' },
    h('span', 'Der Browser konnte gerade nicht speichern. Bitte eine Sicherung herunterladen (Elternbereich › Daten) und die Seite neu laden.'),
    h('button.btn.klein', { type: 'button', onclick: () => { el.remove(); warnungDa = false; } }, 'Ausblenden'));
  document.body.append(el);
}

// Start fehlgeschlagen: Wege anbieten, ohne Daten stillschweigend zu löschen
function startFehler(e) {
  const datei = dateiKnopf('Sicherungsdatei wählen', async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    try { const { importiere } = await import('./app/zustand.js'); await importiere(JSON.parse(await f.text())); location.reload(); }
    catch (err) { meldung(err.message, 'warn', 6000); }
  });
  document.body.classList.add('elternmodus');
  leere(wurzel, h('div.seite.startfehler', h('section.blatt',
    h('h1', 'Die Lernwelt konnte nicht starten.'),
    h('p', String(e?.message || e)),
    h('p.leise', 'Häufige Ursachen: privates Fenster, Speichern von Website-Daten im Browser ausgeschaltet, Speicher voll.'),
    h('div.knopfreihe', h('button.btn.haupt', { type: 'button', onclick: () => location.reload() }, 'Neu laden')),
    h('h2', 'Sicherung einspielen'), h('p.leise.klein', 'Ersetzt die Daten auf diesem Gerät durch eine Sicherungsdatei.'), datei,
    h('h2', 'Alles zurücksetzen'), h('p.leise.klein', 'Nur wenn nichts anderes hilft. Löscht alle Lernstände auf diesem Gerät.'),
    h('button.btn.gefahr', { type: 'button', onclick: async () => {
      if (!confirm('Wirklich alle Daten auf diesem Gerät löschen?')) return;
      try { indexedDB.deleteDatabase('lernwelt'); } catch { /* egal */ }
      setTimeout(() => location.reload(), 400);
    } }, 'Alles löschen'))));
}

// Updates: neue Version wird im Hintergrund geladen und nur im Elternbereich auf Knopfdruck übernommen
function meldeServiceWorker() {
  let neuLaden = false;
  let wartend = null;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (neuLaden && !document.body.classList.contains('in-sitzung')) location.reload(); });
  const anbieten = (sw) => {
    wartend = sw;
    if (!document.body.classList.contains('elternmodus') || document.querySelector('.update-hinweis')) return;
    const el = h('div.update-hinweis', { role: 'status' }, h('span', 'Eine neue Version der Lernwelt ist bereit.'),
      h('button.btn.klein.haupt', { type: 'button', onclick: () => { neuLaden = true; sw.postMessage('aktivieren'); el.remove(); } }, 'Jetzt aktualisieren'),
      h('button.btn.klein.leise', { type: 'button', onclick: () => el.remove() }, 'Später'));
    document.body.append(el);
  };
  window.addEventListener('hashchange', () => { if (wartend && location.hash.startsWith('#/eltern')) setTimeout(() => anbieten(wartend), 300); });
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    if (reg.waiting && navigator.serviceWorker.controller) anbieten(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const neu = reg.installing;
      neu?.addEventListener('statechange', () => { if (neu.state === 'installed' && navigator.serviceWorker.controller) anbieten(neu); });
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
}
start();
