// Prüft alle Mathematik-Generatoren: je Stufe 200 Aufgaben mit verschiedenen Startwerten und den Zahlenräumen 10, 20 und 100.
// Geprüft: Pflichtfelder, Lösung vorhanden und eindeutig, Ablenker verschieden und falsch, Zahlenraum, keine negativen Zahlen,
// Darstellung passt zu den Zahlen, Vielfalt, Schweizer Schreibweise, Wörter, die im Kinderbereich nicht vorkommen.
// Aufruf: node tools/teste_mathe.mjs [gruppe ...] [--n 200]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pruefe, richtigeEingabe, passt } from '../site/js/core/pruefen.js';
import { fertigeAufgabe, stufeFrei, GRUPPEN } from '../site/js/math/index.js';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const iN = args.indexOf('--n');
const N = iN >= 0 ? Number(args[iN + 1]) : 200;
const gewuenscht = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--n');
const katalog = JSON.parse(fs.readFileSync(path.join(wurzel, 'site/data/katalog/mathe.json'), 'utf8'));
const P = JSON.parse(fs.readFileSync(path.join(wurzel, 'site/data/parameter.json'), 'utf8'));

export const VISUALS = ['zehnerfeld', 'zwanzigerfeld', 'wuerfelbild', 'fingerbild', 'plaettchen', 'dinge', 'zehnerstreifen', 'zerlegungshaus', 'schuettelbox',
  'zahlenstrahl', 'rechenstrich', 'zahlenmauer', 'geld', 'uhr', 'waage', 'strichliste', 'bilddiagramm', 'formen', 'koerper', 'gitter', 'spiegel', 'laengen', 'reihe'];
const TYPEN = ['zahl', 'wahl-bild', 'wahl-wort', 'zuordnen', 'legen', 'reihenfolge', 'muster', 'zaehlen', 'menge-legen', 'antippen', 'hoeren-tippen', 'nachspuren'];
const VERBOTEN = /\b(Test|Prüfung|Stufe|Niveau|Fehler|falsch|Punkte?|Note)\b/i;

// --- Zahlen einer Aufgabe sammeln (für die Prüfung des Zahlenraums) ---
const istZahl = (x) => typeof x === 'number' || (typeof x === 'string' && /^\d+$/.test(x));
function zahlenVisual(v, geldAusnahme) {
  if (!v) return [];
  const z = [];
  const add = (...x) => z.push(...x.filter((y) => istZahl(y)).map(Number));
  switch (v.art) {
    case 'zehnerfeld': case 'zwanzigerfeld': case 'plaettchen': add(v.rot ?? 0, v.blau ?? 0, (v.rot ?? 0) + (v.blau ?? 0), v.weg ?? 0); break;
    case 'dinge': add(v.n, v.weg ?? 0, ...(v.gruppen || [])); break;
    case 'zehnerstreifen': add(v.zehner * 10 + v.einer, v.einer); break;
    case 'zerlegungshaus': add(v.dach, ...v.zeilen.flat()); break;
    case 'schuettelbox': add(v.n, v.sichtbar); break;
    case 'zahlenstrahl': add(v.von, v.bis, ...(v.marken || []).map((m) => m.x), ...(v.spruenge || []).flatMap((s) => [s.von, s.nach])); break;
    case 'rechenstrich': { let x = v.start; add(x); for (const s of v.spruenge) { x += s; add(x, Math.abs(s)); } break; }
    case 'zahlenmauer': add(...v.reihen.flat()); break;
    case 'geld': if (!geldAusnahme) add(v.stuecke.reduce((s, x) => s + x.wert, 0) / 100); break;
    case 'strichliste': add(...v.zeilen.map((x) => x.n)); break;
    case 'bilddiagramm': add(...v.spalten.map((x) => x.n)); break;
    case 'laengen': add(...v.staebe.map((x) => x.laenge)); break;
    case 'wuerfelbild': add(...[].concat(v.n)); break;
    case 'fingerbild': add(v.n); break;
    case 'reihe': add(...v.teile); break;
    default: break;
  }
  return z;
}
function zahlenIn(a, geldAusnahme) {
  const z = [];
  const add = (...x) => z.push(...x.filter(istZahl).map(Number));
  for (const z of [].concat(a.zeige ?? [])) if (typeof z === 'string') add(...z.split(' '));
  if (a.typ === 'zahl') add(...a.loesung);
  if (a.typ === 'zaehlen') add(a.anzahl);
  if (a.typ === 'menge-legen' && a.feld !== 'muenzen') add(a.ziel, a.start ?? 0);
  if (a.typ === 'menge-legen' && a.feld === 'muenzen') add(a.ziel / 100);
  for (const o of a.optionen || []) { if (istZahl(o)) add(o); else if (o && typeof o === 'object') { if (istZahl(o.text)) add(o.text); z.push(...zahlenVisual(o.visual, geldAusnahme)); } }
  for (const t of a.teile || []) { if (istZahl(t)) add(t); else if (t && typeof t === 'object') { if (istZahl(t.text)) add(t.text); z.push(...zahlenVisual(t.visual, geldAusnahme)); } }
  for (const t of a.kacheln || []) add(t);
  for (const t of a.folge || []) add(t);
  for (const [x, y] of a.paare || []) for (const e of [x, y]) { if (istZahl(e.zahl)) add(e.zahl); if (istZahl(e.text)) add(e.text); z.push(...zahlenVisual(e.visual, geldAusnahme)); }
  z.push(...zahlenVisual(a.visual, geldAusnahme), ...zahlenVisual(a.visualNachFehler, geldAusnahme));
  return z;
}
function texte(a) {
  return [a.frage, a.sprich, a.hinweis, a.erklaerung, a.vorlesen, a.auftrag, ...(a.fehlerbilder || []).map((f) => f.text)]
    .flat().filter((t) => t !== undefined && t !== null).map(String);
}

// --- Darstellung passt zu den Zahlen ---
function pruefeVisual(v, F) {
  if (!v) return;
  if (!VISUALS.includes(v.art)) { F(`Darstellung «${v.art}» unbekannt`); return; }
  const nn = (x) => Number.isInteger(x) && x >= 0;
  switch (v.art) {
    case 'zehnerfeld': if (!nn(v.rot) || !nn(v.blau ?? 0) || v.rot + (v.blau ?? 0) > 10 || (v.weg ?? 0) > v.rot + (v.blau ?? 0)) F(`Zehnerfeld passt nicht: ${JSON.stringify(v)}`); break;
    case 'zwanzigerfeld': if (!nn(v.rot) || !nn(v.blau ?? 0) || v.rot + (v.blau ?? 0) > 20 || (v.weg ?? 0) > v.rot + (v.blau ?? 0)) F(`Zwanzigerfeld passt nicht: ${JSON.stringify(v)}`); break;
    case 'wuerfelbild': for (const n of [].concat(v.n)) if (!(n >= 1 && n <= 6)) F(`Würfelbild ${n}`); break;
    case 'fingerbild': if (!(v.n >= 0 && v.n <= 10)) F(`Fingerbild ${v.n}`); break;
    case 'dinge': if (!(v.n >= 1) || (v.weg ?? 0) > v.n || (v.gruppen && v.gruppen.reduce((s, x) => s + x, 0) !== v.n)) F(`Dinge passen nicht: ${JSON.stringify(v)}`); break;
    case 'zehnerstreifen': if (!nn(v.zehner) || !(v.einer >= 0 && v.einer <= 9)) F(`Zehnerstreifen ${JSON.stringify(v)}`); break;
    case 'zerlegungshaus': for (const z of v.zeilen) if (istZahl(v.dach) && z.every(istZahl) && Number(z[0]) + Number(z[1]) !== Number(v.dach)) F(`Zahlenhaus: ${z} ergibt nicht ${v.dach}`); break;
    case 'schuettelbox': if (!(v.sichtbar >= 0 && v.sichtbar <= v.n)) F(`Schüttelbox ${JSON.stringify(v)}`); break;
    case 'zahlenstrahl': for (const m of v.marken || []) if (m.x < v.von || m.x > v.bis) F(`Marke ausserhalb: ${m.x}`); break;
    case 'zahlenmauer': {
      const R = v.reihen;
      for (let i = 0; i < R.length - 1; i++) for (let j = 0; j < R[i].length; j++) {
        const o = R[i][j], u1 = R[i + 1][j], u2 = R[i + 1][j + 1];
        if ([o, u1, u2].every(istZahl) && Number(o) !== Number(u1) + Number(u2)) F(`Zahlenmauer: ${o} ≠ ${u1} + ${u2}`);
        if (R[i + 1].length !== R[i].length + 1) F('Zahlenmauer: Reihenlängen');
      }
      break;
    }
    case 'uhr': if (!(v.h >= 1 && v.h <= 12) || ![0, 30].includes(v.m)) F(`Uhr ${v.h}:${v.m}`); break;
    case 'geld': for (const x of v.stuecke) if (![5, 10, 20, 50, 100, 200, 500, 1000, 2000].includes(x.wert)) F(`Geldstück ${x.wert}`); break;
    default: break;
  }
}

const fehler = [], warnungen = [];
const module = {};
for (const g of GRUPPEN) {
  const p = path.join(wurzel, 'site/js/math', g + '.js');
  if (fs.existsSync(p)) module[g] = (await import(pathToFileURL(p))).generatoren;
}

let geprueft = 0, erzeugt = 0;
for (const f of katalog.fertigkeiten) {
  const g = f.gruppe.toLowerCase();
  if (gewuenscht.length && !gewuenscht.includes(g)) continue;
  for (const stufe of Object.keys(f.stufen)) {
    const st = f.stufen[stufe];
    const wo = `${f.id}/${stufe}`;
    const gen = module[g]?.[f.id]?.[stufe];
    if (typeof gen !== 'function') { fehler.push(`${wo}: Generator fehlt`); continue; }
    geprueft++;
    const sigs = new Set();
    let anzahlFehler = 0;
    const F = (t) => { if (anzahlFehler++ < 3) fehler.push(`${wo}: ${t}`); };
    let nulls = 0;
    for (const grenze of [10, 20, 100]) {
      if (!stufeFrei(st, grenze)) continue;
      const ctx = { grenze, begriffe: P.begriffe, stimme: true };
      for (let seed = 1; seed <= N; seed++) {
        let a;
        try { a = fertigeAufgabe(gen, f, stufe, seed * 7919 + grenze, ctx); } catch (e) { F(`Ausnahme bei Seed ${seed}: ${e.message}`); continue; }
        if (!a) { nulls++; continue; }
        erzeugt++;
        sigs.add(a.sig);
        const bis = st.raum ?? 10;
        if (!TYPEN.includes(a.typ)) { F(`Typ «${a.typ}» unbekannt`); continue; }
        if (!(f.typen || []).includes(a.typ)) warnungen.push(`${wo}: Typ ${a.typ} nicht in den Katalog-Typen (${f.typen})`);
        for (const t of texte(a)) {
          if (/ß/.test(t)) F(`«ß» im Text: ${t}`);
          if (/undefined|NaN|\[object|Infinity|null/.test(t)) F(`Platzhalter im Text: ${t}`);
          if (VERBOTEN.test(t)) F(`Wort, das im Kinderbereich nicht vorkommt: ${t}`);
        }
        for (const z of [].concat(a.zeige ?? [])) if (typeof z === 'string' && /\d\s*-\s*\d|(^| )-( |$)/.test(z)) F(`Bindestrich statt Minus (−): ${z}`);
        const zahlen = zahlenIn(a, st.ausnahme === 'muenzwerte');
        for (const x of zahlen) {
          if (x < 0) F(`negative Zahl ${x}`);
          if (x > bis) F(`Zahl ${x} über dem Zahlenraum ${bis}: ${a.zeige || a.frage}`);
        }
        pruefeVisual(a.visual, F); pruefeVisual(a.visualNachFehler, F);
        for (const o of a.optionen || []) if (o && typeof o === 'object') pruefeVisual(o.visual, F);
        // Lösung wird akzeptiert
        if (a.typ === 'zuordnen') {
          for (let i = 0; i < a.paare.length; i++) for (let j = 0; j < a.paare.length; j++) if (passt(a, i, j) && i !== j) F(`Zuordnen: Paare ${i} und ${j} nicht unterscheidbar`);
        } else if (a.typ !== 'nachspuren') {
          const e = richtigeEingabe(a);
          let r;
          try { r = pruefe(a, e); } catch (err) { F(`Prüfung wirft: ${err.message}`); continue; }
          if (!r.ok) F(`Richtige Eingabe wird nicht akzeptiert: ${JSON.stringify(e)} (${a.zeige || a.frage})`);
        }
        // Eindeutigkeit bei Auswahl
        if (['wahl-bild', 'wahl-wort', 'muster'].includes(a.typ)) {
          const k = a.optionen.map((o) => JSON.stringify(o));
          if (new Set(k).size !== k.length) F(`doppelte Optionen: ${k}`);
          if (a.optionen.length < 2 || a.optionen.length > 4) F(`${a.optionen.length} Optionen`);
          if (!(a.richtig >= 0 && a.richtig < a.optionen.length)) F('«richtig» ungültig');
          for (let i = 0; i < a.optionen.length; i++) if (pruefe(a, i).ok !== (i === a.richtig)) F('Prüfung der Optionen stimmt nicht');
        }
        if (a.typ === 'zahl') {
          const lueckenText = [].concat(a.zeige ?? []).join(' ').split(' ').filter((t) => t === '_').length;
          const fragenBild = JSON.stringify(a.visual || {}).split('"?"').length - 1;
          if (lueckenText && fragenBild) F('Antwortfelder sowohl in «zeige» als auch im Bild');
          if (!lueckenText && fragenBild && fragenBild !== a.loesung.length) F(`${fragenBild} Fragezeichen im Bild, aber ${a.loesung.length} Lösungen`);
          for (const l of a.loesung) if (!Number.isInteger(l) || l < 0) F(`Lösung ${l} ist keine natürliche Zahl`);
          if (a.zahlenfeld !== 'ziffern' && a.loesung.some((l) => l > a.zahlenfeld)) F(`Zahlenfeld ${a.zahlenfeld} zu klein für ${a.loesung}`);
          for (const fb of a.fehlerbilder || []) if (a.loesung.length === 1 && fb.eingabe === String(a.loesung[0])) F('Fehlerbild gleich Lösung');
        }
        if (a.typ === 'reihenfolge' && new Set(a.teile.map((t) => JSON.stringify(t))).size !== a.teile.length && !a.alternativen) F('Reihenfolge mit gleichen Teilen ohne Alternativen');
        if (a.typ === 'zaehlen' && a.dinge.length !== a.anzahl) F(`zaehlen: ${a.dinge.length} Dinge, Anzahl ${a.anzahl}`);
        if (st.stimme === 'ohne' || (!st.stimme && f.stimme === 'ohne')) { if (a.typ === 'hoeren-tippen' || a.vorlesen) F('Stufe ohne Stimme verlangt Hören'); }
      }
    }
    const moeglich = sigs.size;
    if (erzeugt && moeglich < 15) warnungen.push(`${wo}: nur ${moeglich} verschiedene Aufgaben`);
    if (nulls > 0) warnungen.push(`${wo}: ${nulls}× null`);
  }
}

for (const w of warnungen.filter((w, i, arr) => arr.indexOf(w) === i)) console.log('Warnung:', w);
for (const e of fehler) console.log('FEHLER:', e);
console.log(`${geprueft} Stufen geprüft, ${erzeugt} Aufgaben erzeugt, ${fehler.length} Fehler, ${new Set(warnungen).size} Warnungen.`);
process.exit(fehler.length ? 1 : 0);
