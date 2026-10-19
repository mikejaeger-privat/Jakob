// Prüft alle Wortgeneratoren (Deutsch): je Stufe 200 Aufgaben mit der Standard-Freigabe (alle Einzelbuchstaben, Sch, Ei, Au)
// und einer kleinen Freigabe. Geprüft: Pflichtfelder, Lösung eindeutig und akzeptiert, keine nicht eingeführten Buchstaben,
// kein verwechselbares Bildpaar, Bildnamen sicher, Schreibweise, verbotene Wörter, Vielfalt (mindestens 20 verschiedene).
// Aufruf: node tools/teste_deutsch.mjs [gruppe ...] [--n 200]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { pruefe, richtigeEingabe, passt } from '../site/js/core/pruefen.js';
import { fertigeAufgabe, stufeFrei, GRUPPEN } from '../site/js/deutsch/index.js';
import { brauchtText, werkzeug } from '../site/js/deutsch/lib.js';
import { K, W, kontext, FREI_STANDARD, FREI_KLEIN } from './deutsch-kontext.mjs';

const args = process.argv.slice(2);
const iN = args.indexOf('--n');
const N = iN >= 0 ? Number(args[iN + 1]) : 200;
const gewuenscht = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--n');
const TYPEN = ['wahl-bild', 'wahl-wort', 'wahl-hoeren', 'bild-wort', 'zuordnen', 'legen', 'nachspuren', 'menge-legen', 'reihenfolge', 'hoeren-tippen', 'silben', 'vorlesen', 'antippen', 'lautplatz'];
const VERBOTEN = /\b(Test|Prüfung|Stufe|Niveau|Fehler|falsch|Punkte|Note)\b/i;   // «Punkt» (grüner Startpunkt) ist erlaubt, «Punkte» als Wertung nicht
const nachBild = new Map(W.woerter.map((w) => [w.bild, w]));
const sicht = new Set(W.sichtwoerter.map((s) => s.wort.toLowerCase()));

// Alle Texte, die das Kind sieht (für «braucht»)
function sichtbareTexte(a) {
  const t = [];
  const add = (x) => { if (typeof x === 'string' && x.trim() && !/^pfeil:/.test(x)) t.push(x); };
  [].concat(a.zeige ?? []).forEach(add);
  if (['wahl-wort'].includes(a.typ)) (a.optionen || []).forEach(add);
  if (a.typ === 'legen') { (a.kacheln || []).forEach(add); (a.vorlage || []).forEach(add); }
  if (a.typ === 'reihenfolge' && a.art === 'text') { (a.teile || []).forEach(add); (a.ablenker || []).forEach(add); }
  if (a.typ === 'silben' && a.modus !== 'zaehlen') (a.silben || []).forEach(add);   // beim Zählen zeigt die Trommel keine Silben
  for (const [x, y] of a.paare || []) for (const e of [x, y]) { add(e.text); add(e.buchstabe); }
  if (a.typ === 'lautplatz') add(a.laut);
  if (a.typ === 'nachspuren') { add(a.zeichen); add(a.wort); }
  return t;
}
// Nötige Einheiten: Sichtwörter nur mit ihren Einzelbuchstaben (Regel 6)
function noetig(texte) {
  const s = new Set();
  for (const t of texte) for (const wort of t.split(/[\s.,!?«»]+/).filter(Boolean)) {
    if (sicht.has(wort.toLowerCase())) for (const c of wort.toLowerCase()) s.add(c);
    else for (const e of brauchtText(wort)) s.add(e);
  }
  return s;
}
function texte(a) {
  return [a.frage, a.sprich, a.hinweis, a.erklaerung, a.vorlesen, a.auftrag, ...(a.fehlerbilder || []).map((f) => f.text), ...((a.optionen || []).map((o) => o?.sprich).filter(Boolean))]
    .flat().filter((x) => x !== undefined && x !== null).map(String);
}

const module = {};
for (const g of GRUPPEN) {
  const p = path.join('site/js/deutsch', g + '.js');
  if (fs.existsSync(p)) module[g] = (await import(pathToFileURL(path.resolve(p)))).generatoren;
}

const fehler = [], warnungen = [], bericht = [];
let geprueft = 0, erzeugt = 0;
for (const f of K.fertigkeiten) {
  const g = f.gruppe.toLowerCase();
  if (gewuenscht.length && !gewuenscht.includes(g)) continue;
  for (const stufe of Object.keys(f.stufen)) {
    const wo = `${f.id}/${stufe}`;
    const gen = module[g]?.[f.id]?.[stufe];
    if (typeof gen !== 'function') { fehler.push(`${wo}: Generator fehlt`); continue; }
    geprueft++;
    let n = 0;
    const F = (t) => { if (n++ < 3) fehler.push(`${wo}: ${t}`); };
    for (const [name, frei] of [['Standard', FREI_STANDARD], ['klein', FREI_KLEIN]]) {
      const ctx = kontext({ freigabe: frei });
      if (!stufeFrei(f, stufe, ctx)) { if (name === 'Standard') bericht.push(`${wo}: mit der Standard-Freigabe gesperrt`); continue; }
      const T = werkzeug(ctx);
      const sigs = new Set();
      let nulls = 0;
      for (let seed = 1; seed <= N; seed++) {
        let a;
        try { a = fertigeAufgabe(gen, f, stufe, seed * 7919 + 3, ctx); } catch (e) { F(`Ausnahme bei Seed ${seed}: ${e.message}`); continue; }
        if (!a) { nulls++; continue; }
        erzeugt++; sigs.add(a.sig);
        if (!TYPEN.includes(a.typ)) { F(`Typ «${a.typ}» unbekannt`); continue; }
        if (!(f.typen || []).includes(a.typ)) warnungen.push(`${wo}: Typ ${a.typ} nicht in den Katalog-Typen (${f.typen})`);
        for (const t of texte(a)) {
          if (/ß/.test(t)) F(`«ß»: ${t}`);
          if (/undefined|NaN|\[object|null/.test(t)) F(`Platzhalter im Text: ${t}`);
          if (VERBOTEN.test(t)) F(`Wort, das im Kinderbereich nicht vorkommt: ${t}`);
        }
        // Buchstaben-Freigabe
        const braucht = new Set(a.braucht || []);
        for (const x of noetig(sichtbareTexte(a))) if (!braucht.has(x)) F(`«braucht» fehlt «${x}» (${sichtbareTexte(a).join(' / ')})`);
        for (const b of braucht) if (!frei.has(b)) F(`nicht eingeführt: «${b}» (Freigabe ${name})`);
        // Lösung
        if (a.typ === 'zuordnen') {
          for (let i = 0; i < a.paare.length; i++) for (let j = 0; j < a.paare.length; j++) if (i !== j && passt(a, i, j)) F('Zuordnen: zwei Paare passen gleich');
        } else if (!['nachspuren', 'vorlesen'].includes(a.typ)) {
          let r; try { r = pruefe(a, richtigeEingabe(a)); } catch (e) { F(`Prüfung wirft: ${e.message}`); continue; }
          if (!r.ok) F(`Richtige Eingabe wird nicht akzeptiert (${a.frage})`);
        }
        if (['wahl-bild', 'wahl-wort', 'bild-wort', 'wahl-hoeren'].includes(a.typ)) {
          const k = a.optionen.map((o) => JSON.stringify(o));
          if (new Set(k).size !== k.length) F(`doppelte Optionen: ${k}`);
          if (a.optionen.length < 2 || a.optionen.length > 4) F(`${a.optionen.length} Optionen`);
          for (let i = 0; i < a.optionen.length; i++) if (pruefe(a, i).ok !== (i === a.richtig)) F('Prüfung der Optionen stimmt nicht');
          // Bilder: keine verwechselbaren Paare, unsichere Namen nur mit gesprochenem oder gezeigtem Wort
          const ws = a.optionen.map((o) => (o && o.bild ? nachBild.get(o.bild) : null)).filter(Boolean);
          if (ws.length > 1 && !T.zusammenOk(ws)) F(`verwechselbare Bilder: ${ws.map((w) => w.wort).join(', ')}`);
          const gesprochen = (a.namenSprechen ?? a.optionen.some((o) => o && o.wort)) || a.typ === 'bild-wort';
          for (const w of ws) if (w.nameUnsicher && !gesprochen) F(`Bild mit unsicherem Namen ohne gesprochenes Wort: ${w.wort}`);
        }
        if (a.typ === 'reihenfolge' && new Set(a.teile.map((t) => JSON.stringify(t))).size !== a.teile.length && !a.alternativen) F('Reihenfolge mit gleichen Teilen');
        if ((f.stufen[stufe].stimme ?? f.stimme) === 'ohne' && (a.typ === 'wahl-hoeren' || a.typ === 'hoeren-tippen')) F('Stufe ohne Stimme verlangt Hören');
      }
      if (name === 'Standard') {
        if (erzeugt && sigs.size < 20) bericht.push(`${wo}: nur ${sigs.size} verschiedene Aufgaben mit der Standard-Freigabe`);
        if (nulls === N) fehler.push(`${wo}: mit der Standard-Freigabe keine einzige Aufgabe`);
        else if (nulls > N / 2) warnungen.push(`${wo}: ${nulls}× null mit der Standard-Freigabe`);
      }
    }
  }
}
for (const w of [...new Set(warnungen)]) console.log('Warnung:', w);
for (const b of bericht) console.log('Bericht:', b);
for (const e of fehler) console.log('FEHLER:', e);
console.log(`${geprueft} Stufen geprüft, ${erzeugt} Aufgaben erzeugt, ${fehler.length} Fehler, ${new Set(warnungen).size} Warnungen, ${bericht.length} Berichtszeilen.`);
process.exit(fehler.length ? 1 : 0);
