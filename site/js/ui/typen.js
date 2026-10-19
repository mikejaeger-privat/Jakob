// Aufgabentypen als Bausteine für beide Fächer. Jeder Typ baut seine Bühne und kennt seine Eingabe.
// typ(a, api) -> { el, symbol, haken, bereit(), eingabe(), erleichtere(r, e), zeigeLoesung(), richtig(e), demo() }
//   haken: true, wenn die Antwort mit dem Haken bestätigt wird; sonst ruft der Typ api.pruefen(e) selbst auf
import { h, s } from './dom.js';
import { darstellung, antwortfeld, feldSvg, geldstueck, musterElement, pfeilSymbol, FARBE } from './darstellung.js';
import { symbol } from './figuren.js';
import { passt, hatFuenferstruktur } from '../core/pruefen.js';
import { bewerte } from '../core/nachspur.js';
import { klang } from '../app/klang.js';

const ZAHLWORT = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig'];
const zahlSprechen = (n) => ZAHLWORT[n] ?? String(n);
const mische = (arr, seed = 1) => {
  const b = arr.slice();
  let x = (Math.imul(seed, 9301) + 49297) >>> 0;
  for (let i = b.length - 1; i > 0; i--) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; const j = (x >>> 16) % (i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};
// Mischen, aber nie in der Lösungsreihenfolge (sonst wäre die Aufgabe schon gelöst)
const mischeAnders = (arr, seed) => {
  if (arr.length < 2) return arr.slice();
  for (let k = 0; k < 8; k++) { const m = mische(arr, seed + k * 7); if (m.some((x, i) => x !== arr[i])) return m; }
  return arr.slice(1).concat(arr[0]);
};

// --- Rechnung oder Text mit Antwortfeldern («_») und Platzhalter «○» ---
export function zeigeZeile(zeige, felder) {
  if (zeige === undefined || zeige === null || zeige === '') return null;
  // Liste: mehrere Zeilen (Hilfsrechnung oben, Aufgabe unten); die Felder zählen über alle Zeilen
  if (Array.isArray(zeige)) return h('div.rechnungen', zeige.map((z, i) => { const zeile = zeigeZeile(z, felder); if (i < zeige.length - 1) zeile.classList.add('hilfszeile'); return zeile; }));
  const teile = String(zeige).split(' ').map((t) => {
    if (t === '_') { const f = antwortfeld(felder.length); felder.push(f); return f; }
    if (t === '○') return h('span.rz-platz', ' ');
    if (/^\d+$/.test(t)) return h('span.rz-zahl', t);
    if (/^[+−=<>·:]$/.test(t)) return h('span.rz-zeichen', t);
    return h('span.rz-text', t);
  });
  return h('div.rechnung', teile);
}

// Inhalt einer Karte: Text, Emoji, Darstellung, Musterelement, Geldstück
function karteInhalt(o) {
  if (o === null || o === undefined) return '';
  if (typeof o !== 'object') return h('span.k-text', String(o));
  if (o.visual) return darstellung(o.visual, { klein: true }).el;
  if (o.szene) return szeneBild(o.szene);
  if (o.bild) return h('span.emoji', o.bild);
  if (o.form || o.farbe) return musterElement(o);
  if (o.text !== undefined) return h('span.k-text', String(o.text));
  if (o.zahl !== undefined) return h('span.k-text', String(o.zahl));
  if (o.menge) return darstellung(o.menge, { klein: true }).el;
  if (o.buchstabe) return h('span.k-text.k-buchstabe', o.buchstabe);
  return h('span.k-text', '?');
}
export function szeneBild(sz) {
  if (sz.art === 'menge') return h('span.szene.menge', Array.from({ length: sz.anzahl }, () => h('span.emoji', sz.bild)));
  if (sz.art === 'farbe') return h('span.szene.farbe', s('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' }, s('path', { d: 'M50 8 C76 8 92 26 90 50 C88 78 70 92 46 90 C22 88 8 72 10 48 C12 24 28 8 50 8 Z', fill: FARBE[sz.farbe] || sz.farbe, class: 'klecks' })));
  if (sz.art === 'groesse') return h('span.szene.groesse' + (sz.gross ? '.gross' : '.klein'), h('span.emoji', sz.bild));
  if (sz.art === 'aktion') return h('span.szene.aktion', h('span.emoji', sz.bild), h('span.emoji.zeichen', { schlafen: '💤', rennen: '💨', essen: '🍽️' }[sz.zeichen] || ''));
  if (sz.art === 'lage') return h('span.szene.lage.' + sz.lage, h('span.emoji.bezug', sz.bezug), h('span.emoji.ding', sz.bild));
  return h('span.emoji', sz.bild || '?');
}

// --- Zahlenfeld: Tasten 0 bis 10 oder 0 bis 20 in Fünferreihen, oder Ziffern 0 bis 9 ---
export function zahlenfeld(art, onZahl, onLoeschen) {
  const tasten = new Map();
  const taste = (n, klasse = '') => {
    const t = h('button.taste' + klasse, { type: 'button', 'aria-label': String(n), onclick: () => onZahl(n) }, String(n));
    tasten.set(n, t); return t;
  };
  let el;
  if (art === 'ziffern') {
    el = h('div.zahlenfeld.ziffern', [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => taste(n)), h('span.taste-platz'), taste(0),
      h('button.taste.loeschen', { type: 'button', 'aria-label': 'Löschen', onclick: () => onLoeschen() }, symbol('loeschen')));
  } else {
    const max = art === 20 ? 20 : 10;
    const reihen = [];
    for (let a = 1; a <= max; a += 5) reihen.push(h('div.zf-reihe', [0, 1, 2, 3, 4].map((k) => taste(a + k))));
    el = h('div.zahlenfeld.z' + max, reihen, h('div.zf-reihe.null', taste(0, '.null')));
  }
  return { el, tasten };
}

// =====================================================================================
export const TYPEN = {
  // --- Zahl eingeben ---
  zahl(a, api) {
    const felder = [];
    const vis = darstellung(a.visual);
    const zeile = zeigeZeile(a.zeige, felder);
    if (!felder.length && vis) felder.push(...vis.felder);
    let eigenes = null;
    if (!felder.length) { eigenes = h('div.antwort-zeile', antwortfeld(0), a.einheit ? h('span.einheit', a.einheit) : null); felder.push(eigenes.firstChild); }
    else if (a.einheit && zeile) zeile.append(h('span.einheit', a.einheit));
    const werte = felder.map(() => null);
    const fest = felder.map(() => false);
    let aktiv = 0;
    const ziffern = a.zahlenfeld === 'ziffern';
    const zeigeAktiv = () => felder.forEach((f, i) => f.classList.toggle('aktiv', i === aktiv && !fest[i]));
    const setze = (i, wert) => { werte[i] = wert; felder[i].textContent = wert === null ? '' : String(wert); felder[i].classList.toggle('voll', wert !== null); };
    const naechstes = () => { const j = werte.findIndex((w, i) => w === null && !fest[i]); if (j >= 0) aktiv = j; zeigeAktiv(); };
    felder.forEach((f, i) => f.addEventListener('click', () => { if (fest[i]) return; aktiv = i; zeigeAktiv(); klang('tipp'); }));
    const zf = zahlenfeld(ziffern ? 'ziffern' : a.zahlenfeld, (n) => {
      if (fest[aktiv]) naechstes();
      if (ziffern) {
        const alt = werte[aktiv] === null ? '' : String(werte[aktiv]);
        const neu = (alt + n).replace(/^0+(?=\d)/, '').slice(0, 3);
        setze(aktiv, Number(neu));
        api.sprich(String(werte[aktiv]));
      } else {
        setze(aktiv, n); api.sprich(zahlSprechen(n));
        if (felder.length > 1) { const vorher = aktiv; naechstes(); if (aktiv === vorher) zeigeAktiv(); }
      }
      api.aenderung();
    }, () => {
      const alt = werte[aktiv] === null ? '' : String(werte[aktiv]);
      setze(aktiv, alt.length > 1 ? Number(alt.slice(0, -1)) : null); api.aenderung();
    });
    zeigeAktiv();
    const nachFehler = h('div.nach-fehler');
    const links = h('div.zahl-links', vis?.el, zeile, eigenes, nachFehler);
    const el = h('div.buehne.typ-zahl' + (vis ? '.mit-bild' : ''), links, zf.el);
    return {
      el, symbol: 'zaehlen', haken: true,
      bereit: () => werte.every((w) => w !== null),
      eingabe: () => werte.slice(),
      erleichtere(r) {
        if (r?.teile) r.teile.forEach((ok, i) => { if (ok) { fest[i] = true; felder[i].classList.add('ok'); } else setze(i, null); });
        else werte.forEach((_, i) => setze(i, null));
        naechstes();
        if (felder.length === 1) {   // Zahlenfeld auf die Nähe der Lösung einschränken (mindestens fünf Tasten)
          const l = a.loesung[0];
          const max = a.zahlenfeld === 20 ? 20 : a.zahlenfeld === 10 ? 10 : null;
          if (max !== null) {
            let von = Math.max(0, l - 2), bis = Math.min(max, l + 2);
            while (bis - von < 4) { if (von > 0) von--; else bis++; }
            zf.tasten.forEach((t, n) => t.classList.toggle('aus', n < von || n > bis));
          }
        }
        if (a.visualNachFehler) { const v2 = darstellung(a.visualNachFehler); nachFehler.replaceChildren(v2.el); }
        api.aenderung();
      },
      zeigeLoesung() { felder.forEach((f, i) => { setze(i, a.loesung[i]); f.classList.add('loesung'); }); },
      richtig() { felder.forEach((f) => f.classList.add('ok')); },
      demo() { const t = zf.tasten.get(a.loesung[0] === 0 ? 1 : 0); return api.tippen(felder[aktiv]).then(() => api.tippen(t, 1)); },
    };
  },

  // --- Bild wählen ---
  'wahl-bild'(a, api) { return waehlen(a, api, 'wahl-bild'); },
  'wahl-wort'(a, api) { return waehlen(a, api, 'wahl-wort'); },
  'bild-wort'(a, api) { return waehlen(a, api, 'bild-wort'); },
  muster(a, api) { return waehlen(a, api, 'muster'); },

  // --- Dinge antippen und zählen ---
  zaehlen(a, api) {
    let gezaehlt = 0;
    const dinge = a.dinge.map((d) => {
      const el = h('button.zding', { type: 'button', 'aria-label': 'Ding', onclick: () => tipp(el) }, h('span.emoji', d.bild), h('span.zmarke'));
      el.style.left = (d.x * 100) + '%'; el.style.top = (d.y * 100) + '%';
      return el;
    });
    function tipp(el) {
      if (el.classList.contains('gezaehlt')) return;
      gezaehlt++;
      el.classList.add('gezaehlt'); el.querySelector('.zmarke').textContent = String(gezaehlt);
      klang('tipp'); api.sprich(zahlSprechen(gezaehlt));
    }
    const zuruecksetzen = () => { gezaehlt = 0; dinge.forEach((d) => { d.classList.remove('gezaehlt', 'loesung'); d.querySelector('.zmarke').textContent = ''; }); };
    const nochmal = h('button.kk.klein.k-nochmal', { type: 'button', 'aria-label': 'Nochmals zählen', onclick: () => { klang('tipp'); zuruecksetzen(); } }, symbol('nochmal'));
    const feld = h('div.zaehlfeld' + (a.dinge.length > 12 ? '.viele' : ''), dinge);
    let antwort, wahl = null, wert = null, felder = [], zf = null;
    if (a.antwort === 'wahl') {
      const karten = a.optionen.map((o, i) => h('button.wkarte.zahlkarte', { type: 'button', onclick: () => { wahl = i; api.pruefen(Number(o)); } }, h('span.k-text', String(o))));
      antwort = h('div.wahl.zahlen', karten);
      antwort.karten = karten;
    } else {
      const f = antwortfeld(0); felder = [f]; f.classList.add('aktiv');
      zf = zahlenfeld(a.zahlenfeld === 20 ? 20 : 10, (n) => { wert = n; f.textContent = String(n); f.classList.add('voll'); api.sprich(zahlSprechen(n)); api.aenderung(); });
      antwort = h('div.zaehl-antwort', h('div.antwort-zeile', f), zf.el);
    }
    const el = h('div.buehne.typ-zaehlen', h('div.zaehl-links', feld, nochmal), antwort);
    // Schmale Bildschirme (Handy hochkant): Dinge in Fünferreihen statt frei verteilt, damit nichts übereinanderliegt
    requestAnimationFrame(() => { if (feld.isConnected && feld.clientWidth < 560) feld.classList.add('raster'); });
    return {
      el, symbol: 'finger', haken: a.antwort !== 'wahl',
      bereit: () => wert !== null, eingabe: () => wert,
      erleichtere() {
        zuruecksetzen();
        if (a.antwort === 'wahl' && wahl !== null) antwort.karten[wahl].classList.add('weg');
        if (felder[0]) { felder[0].textContent = ''; felder[0].classList.remove('voll'); wert = null; }
        api.aenderung();
      },
      zeigeLoesung() {
        zuruecksetzen();
        dinge.forEach((d, i) => { d.classList.add('gezaehlt', 'loesung'); d.querySelector('.zmarke').textContent = String(i + 1); });
        if (a.antwort === 'wahl') antwort.karten.forEach((k, i) => k.classList.toggle('richtig', i === a.richtig));
        else { felders(felder, a.anzahl); }
      },
      richtig() { if (a.antwort === 'wahl' && wahl !== null) antwort.karten[wahl].classList.add('richtig'); else felder[0]?.classList.add('ok'); },
      demo() { return api.tippen(dinge[0], 1).then(() => api.tippen(dinge[1] || dinge[0], 1)); },
    };
  },

  // --- Karten der Reihe nach legen ---
  reihenfolge(a, api) {
    return legeKarten(a, api, {
      karten: a.teile.map((t, i) => ({ inhalt: t, wert: i })),
      plaetze: a.teile.length, vorlage: null,
      kopf: h('div.richtung', symbol('treppe', { klasse: a.richtung === 'ab' ? 'ab' : 'auf' })),
      loesung: a.teile.map((_, i) => i),
      eingabe: (belegt) => belegt.map((k) => k.wert),
    });
  },

  // --- Kacheln in Felder legen (Rechnung, Wort, Weg) ---
  legen(a, api) {
    const vorlage = a.vorlage || Array.from({ length: a.felder ?? a.loesung.length }, () => null);
    return legeKarten(a, api, {
      karten: a.kacheln.map((t, i) => ({ inhalt: t, wert: t, i })),
      plaetze: vorlage.filter((x) => x === null).length, vorlage,
      kopf: a.vorlesen ? null : null,
      loesung: a.loesung,
      eingabe: (belegt) => belegt.map((k) => k.wert),
      zeigeOben: a.zeige ? zeigeZeile(a.zeige, []) : null,
      visual: a.visual,
    });
  },

  // --- Plättchen legen, Zehner und Einer, Münzen ---
  'menge-legen'(a, api) {
    if (a.feld === 'muenzen') return muenzenLegen(a, api);
    if (a.feld === 'zehnereiner') return zehnerEinerLegen(a, api);
    const zehner = a.feld === 'zehner';
    const R = 2, C = zehner ? 5 : 10;
    // Farbe nach Fünfergruppe: Zehnerfeld oben rot, unten blau; Zwanzigerfeld je erste Gruppe rot, zweite blau
    const farbe = (i) => (Math.floor(i / 5) % 2 === 0 ? 'rot' : 'blau');
    const belegt = new Set(Array.from({ length: a.start ?? 0 }, (_, i) => i));
    const leer = Array(R * C).fill(null);
    const f = feldSvg(R, C, leer);
    let geaendert = false;
    const zeichne = () => f.steine.forEach((st, i) => { st.setAttribute('class', 'pl ' + (belegt.has(i) ? farbe(i) : 'leer')); });
    const tipp = (i) => { if (belegt.has(i)) belegt.delete(i); else belegt.add(i); geaendert = true; klang('tipp'); zeichne(); api.aenderung(); };
    [...f.zellen, ...f.steine].forEach((el) => el.addEventListener('click', () => tipp(Number(el.getAttribute('data-i')))));
    f.el.classList.add('tippfeld');
    zeichne();
    const el = h('div.buehne.typ-menge', h('div.menge-feld', f.el), a.zeige ? zeigeZeile(a.zeige, []) : null);
    return {
      el, symbol: 'hand', haken: true,
      bereit: () => geaendert && (belegt.size > 0 || a.ziel === 0),
      eingabe: () => ({ zellen: [...belegt].sort((x, y) => x - y) }),
      erleichtere() { api.aenderung(); },
      zeigeLoesung() { belegt.clear(); for (let i = 0; i < a.ziel; i++) belegt.add(i); zeichne(); f.el.classList.add('loesung'); },
      richtig() { f.el.classList.add('ok'); },
      demo() { const frei = [...Array(R * C).keys()].find((i) => !belegt.has(i)) ?? 0; return api.tippen(f.zellen[frei], 1); },
    };
  },

  // --- Stellen antippen (Zahlenstrahl, Gitter, Spiegel, Formen) ---
  antippen(a, api) {
    const vis = darstellung(a.visual, { tippbar: true });
    const markiert = new Set();
    vis.tippbare.forEach(({ el: t, wert }) => t.addEventListener('click', () => {
      if (t.classList.contains('fest')) return;
      if (markiert.has(wert)) { markiert.delete(wert); t.classList.remove('markiert'); }
      else {
        if (a.einzeln) { markiert.clear(); vis.tippbare.forEach((x) => { if (!x.el.classList.contains('fest')) x.el.classList.remove('markiert'); }); }
        markiert.add(wert); t.classList.add('markiert');
      }
      klang('tipp'); api.aenderung();
    }));
    const el = h('div.buehne.typ-antippen', vis.el, a.zeige ? zeigeZeile(a.zeige, []) : null);
    return {
      el, symbol: 'finger', haken: true,
      bereit: () => markiert.size > 0, eingabe: () => [...markiert],
      erleichtere(r, e) {
        const loes = new Set(a.loesung.map(String));
        vis.tippbare.forEach(({ el: t, wert }) => { if (markiert.has(wert) && loes.has(wert)) t.classList.add('fest'); else if (markiert.has(wert)) { markiert.delete(wert); t.classList.remove('markiert'); } });
        api.aenderung();
      },
      zeigeLoesung() { const loes = new Set(a.loesung.map(String)); vis.tippbare.forEach(({ el: t, wert }) => { t.classList.toggle('markiert', false); t.classList.toggle('loesung', loes.has(wert)); }); },
      richtig() { vis.tippbare.forEach(({ el: t }) => { if (t.classList.contains('markiert')) t.classList.add('ok'); }); },
      demo() { const t = vis.tippbare[Math.floor(vis.tippbare.length / 2)]?.el; return api.tippen(t, 1); },
    };
  },

  // --- Gesprochene Anweisung: Bilder antippen ---
  'hoeren-tippen'(a, api) {
    const sz = a.szene;
    const folge = [];
    const knoepfe = new Map();
    const knopf = (e) => {
      const b = h('button.hding', { type: 'button', 'data-id': e.id, 'aria-label': e.name || 'Bild', onclick: () => tipp(e.id, b) }, h('span.emoji', e.bild), h('span.hmarke'));
      knoepfe.set(e.id, b); return b;
    };
    let buehne;
    if (sz.art === 'reihe') {
      buehne = h('div.hreihe' + (sz.elemente.length > 6 ? '.lang' : ''), sz.start ? h('span.hstart', sz.start) : null, sz.elemente.map(knopf));
    } else {
      buehne = h('div.hfrei', sz.elemente.map((e) => {
        const b = e.deko ? h('span.hding.deko', h('span.emoji', e.bild)) : knopf(e);
        b.style.left = (e.x * 100) + '%'; b.style.top = (e.y * 100) + '%';
        if (e.w) b.style.setProperty('--w', String(e.w));
        if (e.z) b.style.zIndex = String(e.z);
        return b;
      }));
    }
    function tipp(id, b) {
      if (folge.includes(id) && a.loesung.length > 1) return;
      klang('tipp');
      folge.push(id);
      b.classList.add('gewaehlt');
      if (a.loesung.length > 1) b.querySelector('.hmarke').textContent = String(folge.length);
      if (folge.length >= a.loesung.length) api.pruefen(folge.slice());
    }
    const zurueck = () => { folge.length = 0; knoepfe.forEach((b) => { b.classList.remove('gewaehlt'); b.querySelector('.hmarke').textContent = ''; }); };
    const el = h('div.buehne.typ-hoeren', buehne);
    return {
      el, symbol: 'ohr', haken: false,
      bereit: () => false, eingabe: () => folge.slice(),
      erleichtere(r) { const falsch = folge.filter((id) => !a.loesung.includes(id)); zurueck(); falsch.forEach((id) => knoepfe.get(id)?.classList.add('weg-leise')); },
      zeigeLoesung() { zurueck(); a.loesung.forEach((id, i) => { const b = knoepfe.get(id); if (b) { b.classList.add('loesung'); if (a.loesung.length > 1) b.querySelector('.hmarke').textContent = String(i + 1); } }); },
      richtig() { folge.forEach((id) => knoepfe.get(id)?.classList.add('ok')); },
      demo() { return api.tippen([...knoepfe.values()][0], 1); },
    };
  },

  // --- Paare verbinden ---
  zuordnen(a, api) {
    const n = a.paare.length;
    const rechtsOrdnung = mischeAnders([...Array(n).keys()], (a.seed || 3) + 11);
    const farben = ['p1', 'p2', 'p3', 'p4'];
    let gewaehlt = null, paar = 0;
    const fertig = new Set();
    const links = a.paare.map((p, i) => h('button.zkarte.links', { type: 'button', 'data-i': String(i), onclick: () => waehle('l', i) }, karteInhalt(p[0])));
    const rechts = rechtsOrdnung.map((j) => h('button.zkarte.rechts', { type: 'button', 'data-j': String(j), onclick: () => waehle('r', j) }, karteInhalt(a.paare[j][1])));
    const rechtsEl = (j) => rechts[rechtsOrdnung.indexOf(j)];
    function markiereWahl() { [...links, ...rechts].forEach((k) => k.classList.remove('gewaehlt')); if (gewaehlt) (gewaehlt.seite === 'l' ? links[gewaehlt.i] : rechtsEl(gewaehlt.i)).classList.add('gewaehlt'); }
    async function waehle(seite, i) {
      if (fertig.has(seite + i)) return;
      klang('tipp');
      if (!gewaehlt || gewaehlt.seite === seite) { gewaehlt = { seite, i }; markiereWahl(); return; }
      const [l, r] = seite === 'l' ? [i, gewaehlt.i] : [gewaehlt.i, i];
      gewaehlt = null; markiereWahl();
      if (passt(a, l, r)) {
        const fa = farben[paar++ % 4];
        links[l].classList.add('verbunden', fa); rechtsEl(r).classList.add('verbunden', fa);
        fertig.add('l' + l); fertig.add('r' + r);
        klang('richtig');
        if (fertig.size === 2 * n) api.fertigRichtig();
      } else {
        const lk = links[l], rk = rechtsEl(r);
        lk.classList.add('wackeln'); rk.classList.add('wackeln');
        setTimeout(() => { lk.classList.remove('wackeln'); rk.classList.remove('wackeln'); }, 500);
        api.fehlversuch();
      }
    }
    const el = h('div.buehne.typ-zuordnen', h('div.zspalte', links), h('div.zspalte', rechts));
    return {
      el, symbol: 'hand', haken: false,
      bereit: () => false, eingabe: () => null,
      erleichtere() {},
      zeigeLoesung() {
        for (let l = 0; l < n; l++) {
          if (fertig.has('l' + l)) continue;
          const fa = farben[paar++ % 4];
          links[l].classList.add('verbunden', 'loesung', fa); rechtsEl(l).classList.add('verbunden', 'loesung', fa);
          fertig.add('l' + l); fertig.add('r' + l);
        }
      },
      richtig() {},
      demo() { const l = [...Array(n).keys()].find((i) => !fertig.has('l' + i)) ?? 0; return api.ziehen(links[l], rechtsEl(l)); },
    };
  },

  // --- Nachspuren mit dem Finger ---
  nachspuren(a, api) { return nachspurBuehne(a, api); },
};

function felders(felder, wert) { if (felder[0]) { felder[0].textContent = String(wert); felder[0].classList.add('voll', 'loesung'); } }

// --- Auswahl (Antippen ist die Antwort) ---
function waehlen(a, api, typ) {
  const karten = a.optionen.map((o, i) => h('button.wkarte' + (typ === 'wahl-wort' ? '.wort' + (String(o).length > 5 ? '.lang' : '') : typeof o === 'object' && (o.visual || o.szene) ? '.bild.gross' : '.bild'),
    { type: 'button', 'aria-label': (typeof o === 'object' ? (o.wort || o.text || 'Bild') : String(o)), onclick: () => { gewaehlt = i; api.pruefen(i); } }, karteInhalt(o)));
  let gewaehlt = null;
  const oben = [];
  if (typ === 'muster') {
    const luecke = a.luecke ?? a.folge.indexOf('?');
    oben.push(h('div.muster-folge', a.folge.map((e, i) => (e === '?' || i === luecke ? h('span.mu-el.luecke', '?') : musterElement(e)))));
  }
  if (a.visual) oben.push(darstellung(a.visual).el);
  const platz = [];
  const zeile = a.zeige !== undefined && typ !== 'bild-wort' ? zeigeZeile(a.zeige, platz) : null;
  if (zeile) oben.push(zeile);
  if (typ === 'bild-wort') oben.push(h('div.lesetext', a.zeige));
  const el = h('div.buehne.typ-wahl.' + typ, oben.length ? h('div.wahl-oben', oben) : null, h('div.wahl', karten));
  const symbolArt = typ === 'bild-wort' ? 'auge' : typ === 'wahl-wort' && a.vorlesen ? 'ohr' : 'finger';
  const sichtbar = () => karten.filter((k) => !k.classList.contains('weg'));
  return {
    el, symbol: symbolArt, haken: false, karten,
    bereit: () => false, eingabe: () => gewaehlt,
    erleichtere() {
      // die gewählte falsche Karte verschwindet; bei vier Karten (oder nach dem Hilfe-Knopf) noch eine weitere falsche
      if (gewaehlt !== null && gewaehlt !== a.richtig) karten[gewaehlt].classList.add('weg');
      const andere = () => sichtbar().map((k) => karten.indexOf(k)).filter((i) => i !== a.richtig);
      if ((karten.length === 4 || gewaehlt === null) && andere().length > 1) karten[andere()[0]].classList.add('weg');
      gewaehlt = null;
    },
    zeigeLoesung() { karten.forEach((k, i) => { k.classList.toggle('richtig', i === a.richtig); k.classList.toggle('blass', i !== a.richtig); }); fuelleZeichen(a.richtig); },
    richtig() { karten[a.richtig].classList.add('richtig'); fuelleZeichen(a.richtig); },
    demo() { const i = a.richtig === 0 ? 1 : 0; return api.tippen(karten[i], 1); },
    namen: (a.namenSprechen ?? a.optionen.some((o) => o && typeof o === 'object' && o.wort)) ? a.optionen.map((o) => (o && typeof o === 'object' ? o.wort : null)) : null,
  };
  function fuelleZeichen(i) { const p = el.querySelector('.rz-platz'); if (p && typeof a.optionen[i] === 'string') { p.textContent = a.optionen[i]; p.classList.add('voll'); } }
}

// --- Karten in Plätze legen (Reihenfolge und Legen) ---
function legeKarten(a, api, { karten, plaetze, vorlage, kopf, loesung, eingabe, zeigeOben = null, visual = null }) {
  const reihenfolge = mischeAnders(karten.map((_, i) => i), (a.seed || 5) + 3);
  const kartenEl = karten.map((k) => {
    const inhalt = typeof k.inhalt === 'string' && k.inhalt.startsWith('pfeil:') ? pfeilSymbol(k.inhalt.slice(6)) : karteInhalt(k.inhalt);
    const el = h('button.lkarte', { type: 'button', 'data-wert': String(k.wert), onclick: () => tippKarte(k) }, inhalt);
    k.el = el; return el;
  });
  const platzEl = [];
  const zeile = (vorlage || Array(plaetze).fill(null)).map((v) => {
    if (v !== null && v !== undefined) return h('span.lfest', typeof v === 'number' ? String(v) : v);
    const p = h('span.lplatz', { role: 'button', onclick: () => tippPlatz(platzEl.indexOf(p)) });
    platzEl.push(p); return p;
  });
  const belegt = Array(platzEl.length).fill(null);
  const fest = Array(platzEl.length).fill(false);
  const pool = h('div.lpool', reihenfolge.map((i) => kartenEl[i]));
  function tippKarte(k) {
    if (k.platz !== undefined && k.platz !== null) { tippPlatz(k.platz); return; }
    const frei = belegt.findIndex((x) => x === null);
    if (frei < 0) return;
    klang('tipp');
    belegt[frei] = k; k.platz = frei;
    platzEl[frei].append(k.el); platzEl[frei].classList.add('voll');
    if (typeof k.inhalt === 'string' && !k.inhalt.startsWith('pfeil:') && /^\d+$/.test(k.inhalt)) api.sprich(k.inhalt);
    else if (k.inhalt && typeof k.inhalt === 'object' && k.inhalt.wort) api.sprich(k.inhalt.wort);
    api.aenderung();
  }
  function tippPlatz(i) {
    const k = belegt[i];
    if (!k || fest[i]) return;
    klang('tipp');
    belegt[i] = null; k.platz = null; platzEl[i].classList.remove('voll');
    pool.append(k.el);
    // ursprüngliche Reihenfolge im Vorrat wiederherstellen
    reihenfolge.forEach((j) => { if (karten[j].platz === null || karten[j].platz === undefined) pool.append(kartenEl[j]); });
    api.aenderung();
  }
  const ziel = h('div.lziel', kopf, zeile);
  const vis = visual ? darstellung(visual).el : null;
  const el = h('div.buehne.typ-legen', vis, zeigeOben, ziel, pool);
  return {
    el, symbol: 'hand', haken: true,
    bereit: () => belegt.every((x) => x !== null),
    eingabe: () => eingabe(belegt),
    erleichtere(r) {
      const teile = r?.teile || [];
      belegt.forEach((k, i) => { if (k && teile[i]) { fest[i] = true; platzEl[i].classList.add('ok'); } else if (k) tippPlatz(i); });
      api.aenderung();
    },
    zeigeLoesung() {
      belegt.forEach((k, i) => { if (k && !fest[i]) tippPlatz(i); });
      // passende Karten für die Lösung suchen (bei Reihenfolge Indizes, beim Legen Werte)
      loesung.forEach((wert, i) => {
        if (fest[i]) return;
        const k = karten.find((x) => (x.platz === null || x.platz === undefined) && String(x.wert) === String(wert));
        if (k) { belegt[i] = k; k.platz = i; platzEl[i].append(k.el); platzEl[i].classList.add('voll', 'loesung'); }
      });
    },
    richtig() { platzEl.forEach((p) => p.classList.add('ok')); },
    demo() { const k = karten.find((x) => x.platz === null || x.platz === undefined); const p = platzEl[belegt.findIndex((x) => x === null)]; return k && p ? api.ziehen(k.el, p) : Promise.resolve(); },
  };
}

// --- Münzen legen ---
function muenzenLegen(a, api) {
  const gelegt = [];
  const ablage = h('div.ablage');
  const zeichne = () => {
    ablage.replaceChildren(...gelegt.map((w, i) => { const m = geldstueck(w); m.classList.add('tippbar'); m.addEventListener('click', () => { gelegt.splice(i, 1); klang('tipp'); zeichne(); api.aenderung(); }); return m; }));
  };
  const vorrat = h('div.vorrat', a.muenzen.map((w) => { const m = geldstueck(w); const b = h('button.vorrat-knopf', { type: 'button', 'data-wert': String(w), 'aria-label': `${w >= 100 ? w / 100 + ' Franken' : w + ' Rappen'}`, onclick: () => { gelegt.push(w); klang('tipp'); zeichne(); api.aenderung(); } }, m); return b; }));
  const el = h('div.buehne.typ-muenzen', a.zeige ? zeigeZeile(a.zeige, []) : null, ablage, vorrat);
  return {
    el, symbol: 'hand', haken: true,
    bereit: () => gelegt.length > 0, eingabe: () => ({ summe: gelegt.reduce((x, y) => x + y, 0) }),
    erleichtere() {},
    zeigeLoesung() {
      gelegt.length = 0; let rest = a.ziel;
      for (const w of [...a.muenzen].sort((x, y) => y - x)) while (rest >= w) { gelegt.push(w); rest -= w; }
      zeichne(); ablage.classList.add('loesung');
    },
    richtig() { ablage.classList.add('ok'); },
    demo() { return api.ziehen(vorrat.firstChild, ablage); },
  };
}

// --- Zehner und Einer legen ---
function zehnerEinerLegen(a, api) {
  let zehner = 0, einer = 0;
  const flaeche = h('div.ze-flaeche');
  const zeichne = () => {
    const teile = [];
    for (let i = 0; i < zehner; i++) teile.push(h('button.ze-zehner', { type: 'button', 'aria-label': 'Zehner wegnehmen', onclick: () => { zehner--; klang('tipp'); zeichne(); api.aenderung(); } }, darstellung({ art: 'zehnerstreifen', zehner: 1, einer: 0 }).el));
    const e = [];
    for (let i = 0; i < einer; i++) e.push(h('button.ze-einer', { type: 'button', 'aria-label': 'Einer wegnehmen', onclick: () => { einer--; klang('tipp'); zeichne(); api.aenderung(); } }));
    flaeche.replaceChildren(h('div.ze-zehnerreihe', teile), h('div.ze-einerreihe', e));
  };
  const zKnopf = h('button.ze-quelle', { type: 'button', 'aria-label': 'Einen Zehner legen', onclick: () => { if (zehner < 2) { zehner++; klang('tipp'); zeichne(); api.aenderung(); } } }, darstellung({ art: 'zehnerstreifen', zehner: 1, einer: 0 }).el);
  const eKnopf = h('button.ze-quelle.einer', { type: 'button', 'aria-label': 'Einen Einer legen', onclick: () => { if (einer < 9) { einer++; klang('tipp'); zeichne(); api.aenderung(); } } }, h('span.ze-einer'));
  zeichne();
  const el = h('div.buehne.typ-zehnereiner', a.zeige ? zeigeZeile(a.zeige, []) : h('div.rechnung', h('span.rz-zahl', String(a.ziel))), flaeche, h('div.ze-quellen', zKnopf, eKnopf));
  return {
    el, symbol: 'hand', haken: true,
    bereit: () => zehner + einer > 0, eingabe: () => ({ zehner, einer }),
    erleichtere() {},
    zeigeLoesung() { zehner = Math.floor(a.ziel / 10); einer = a.ziel % 10; zeichne(); flaeche.classList.add('loesung'); },
    richtig() { flaeche.classList.add('ok'); },
    demo() { return api.ziehen(zKnopf, flaeche); },
  };
}

// --- Nachspuren ---
let schrift = null;
export async function ladeSchrift() {
  if (!schrift) schrift = fetch(new URL('../../data/schrift/basisschrift.json', import.meta.url)).then((r) => r.json());
  return schrift;
}
function nachspurBuehne(a, api) {
  const S = api.schrift;
  const z = S.zeichen[a.zeichen];
  const B = z.breite, H = 100, RAND = 18;
  const vb = `${-RAND} ${-RAND} ${B + 2 * RAND} ${H + 2 * RAND}`;
  const linien = [0, 50, 100].map((y) => s('path', { d: `M${-RAND} ${y} H${B + RAND}`, class: 'ns-linie' + (y === 50 ? ' mitte' : '') }));
  const vorlagen = z.striche.map((st) => s('path', { d: st.d, class: 'ns-vorlage' }));
  const hilfen = [];
  if (a.hilfe !== 'keine') z.striche.forEach((st, i) => {
    const [x, y] = st.punkte[0];
    hilfen.push(s('circle', { cx: x, cy: y, r: 5.5, class: 'ns-start' }), s('text', { x, y: y + 3.5, class: 'ns-nr' }, String(i + 1)));
    if (a.hilfe === 'pfeile') {
      // kleine Pfeilspitzen entlang des Strichs
      for (let k = 12; k < st.punkte.length - 4; k += 22) {
        const p = st.punkte[k], q = st.punkte[k + 2];
        const w = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
        hilfen.push(s('path', { d: 'M-3 -3 L2 0 L-3 3', class: 'ns-pfeil', transform: `translate(${p[0]} ${p[1]}) rotate(${w})` }));
      }
    }
  });
  const tinte = s('g', { class: 'ns-tinte' });
  const flaeche = s('svg', { viewBox: vb, class: 'ns-flaeche', 'aria-label': 'Zeichenfläche' }, ...linien, ...vorlagen, ...hilfen, tinte);
  let spuren = [], aktuell = null, linie = null, versuch = 0;
  const punkt = (e) => { const m = flaeche.getScreenCTM().inverse(); const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10]; };
  flaeche.addEventListener('pointerdown', (e) => {
    e.preventDefault(); flaeche.setPointerCapture?.(e.pointerId);
    aktuell = [punkt(e)]; spuren.push(aktuell);
    linie = s('polyline', { points: aktuell.map((p) => p.join(',')).join(' '), class: 'ns-strich' }); tinte.append(linie);
    api.aenderung();
  });
  flaeche.addEventListener('pointermove', (e) => {
    if (!aktuell) return;
    const p = punkt(e), l = aktuell.at(-1);
    if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 1.2) return;
    aktuell.push(p); linie.setAttribute('points', aktuell.map((q) => q.join(',')).join(' '));
  });
  const ende = () => { aktuell = null; api.aenderung(); };
  flaeche.addEventListener('pointerup', ende); flaeche.addEventListener('pointercancel', ende);
  const loeschen = () => { spuren = []; tinte.replaceChildren(); api.aenderung(); };
  const nochmal = h('button.kk.klein.k-nochmal', { type: 'button', 'aria-label': 'Nochmals', onclick: () => { klang('tipp'); loeschen(); } }, symbol('nochmal'));
  const el = h('div.buehne.typ-nachspuren', h('div.ns-rahmen', flaeche), nochmal);
  return {
    el, symbol: 'stift', haken: true, nachspuren: true,
    bereit: () => spuren.some((sp) => sp.length > 3),
    eingabe: () => spuren.map((sp) => sp.slice()),
    pruefeSpur(e) { versuch++; return bewerte(z.striche.map((st) => st.punkte), e); },
    leeren: loeschen,
    erleichtere() { loeschen(); },
    zeigeLoesung() { loeschen(); flaeche.classList.add('loesung'); },
    richtig() { flaeche.classList.add('ok'); },
    demo() {
      const st = z.striche[0].punkte;
      const m = flaeche.getScreenCTM();
      if (!m) return Promise.resolve();
      const punkte = st.filter((_, i) => i % 3 === 0).map(([x, y]) => { const p = new DOMPoint(x, y).matrixTransform(m); return { x: p.x, y: p.y }; });
      return api.spur(punkte);
    },
  };
}
