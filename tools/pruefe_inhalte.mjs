// Prüft feste Deutsch-Inhalte (site/data/inhalte/deutsch/*.json): Schema, IDs, Bilder, «braucht», Satzlänge, Schreibweise.
// Aufruf: node tools/pruefe_inhalte.mjs [datei ...]   (ohne Angabe: alle Dateien in site/data/inhalte/deutsch)
import fs from 'node:fs';
import path from 'node:path';
import { brauchtText } from '../site/js/deutsch/lib.js';

const ORDNER = 'site/data/inhalte/deutsch';
const dateien = process.argv.slice(2).length ? process.argv.slice(2) : (fs.existsSync(ORDNER) ? fs.readdirSync(ORDNER).filter((d) => d.endsWith('.json')).map((d) => path.join(ORDNER, d)) : []);
const W = JSON.parse(fs.readFileSync('site/data/woerter.json', 'utf8'));
const B = JSON.parse(fs.readFileSync('site/data/buchstaben.json', 'utf8'));
const K = JSON.parse(fs.readFileSync('site/data/katalog/deutsch.json', 'utf8'));
const fert = new Map(K.fertigkeiten.map((f) => [f.id, f]));
const bilderLexikon = new Set(W.woerter.map((w) => w.bild));
const SICHT = new Set(W.sichtwoerter.map((x) => x.wort.toLowerCase()));
const ids = new Set(B.liste.map((b) => b.id));
const SZENEN = ['menge', 'lage', 'aktion', 'farbe', 'groesse'];
const LAGEN = ['auf', 'unter', 'neben', 'in', 'vor', 'hinter'];
const ZEICHEN = ['schlafen', 'rennen', 'essen'];
const FARBEN = ['rot', 'blau', 'gelb', 'gruen', 'orange', 'violett', 'braun', 'schwarz', 'weiss', 'rosa'];   // Schlüssel von FARBE in ui/darstellung.js
const VERBOTEN = /\b(Test|Prüfung|Stufe|Niveau|Fehler|falsch|Punkte|Note)\b/i;
const emoji = (t) => /\p{Extended_Pictographic}/u.test(t);

let fehler = 0, warnungen = 0;
const F = (wo, t) => { fehler++; console.log(`FEHLER ${wo}: ${t}`); };
const Wn = (wo, t) => { warnungen++; console.log(`Warnung ${wo}: ${t}`); };
const alleIds = new Set();

function pruefeBild(wo, b) {
  if (!b) return F(wo, 'Bild fehlt');
  if (typeof b === 'string') { if (!emoji(b)) F(wo, `Bild «${b}» ist kein Emoji`); else if (!bilderLexikon.has(b)) Wn(wo, `Bild ${b} steht nicht im Wortlexikon`); return; }
  if (!SZENEN.includes(b.art)) return F(wo, `Szene «${b.art}» unbekannt`);
  if (b.art === 'lage' && (!LAGEN.includes(b.lage) || !b.bild || !b.bezug)) F(wo, `Lage-Szene unvollständig: ${JSON.stringify(b)}`);
  if (b.art === 'aktion' && !ZEICHEN.includes(b.zeichen)) F(wo, `Aktion «${b.zeichen}» unbekannt`);
  if (b.art === 'farbe' && !FARBEN.includes(b.farbe)) F(wo, `Farbe «${b.farbe}» unbekannt`);
  if (b.art === 'menge' && !(b.anzahl >= 2 && b.anzahl <= 6)) F(wo, `Menge ${b.anzahl} (2 bis 6)`);
  if (b.bild && !emoji(b.bild)) F(wo, `Bild «${b.bild}» ist kein Emoji`);
}
function pruefeText(wo, t) {
  if (typeof t !== 'string' || !t.trim()) return F(wo, 'Text fehlt');
  if (/ß/.test(t)) F(wo, `«ß»: ${t}`);
  if (VERBOTEN.test(t)) F(wo, `Wort, das im Kinderbereich nicht vorkommt: ${t}`);
  if (/[„“"]/.test(t)) Wn(wo, `Anführungszeichen bitte als «»: ${t}`);
}
function pruefeBraucht(wo, texte, braucht) {
  if (!Array.isArray(braucht)) return F(wo, '«braucht» fehlt');
  for (const b of braucht) if (!ids.has(b)) F(wo, `«${b}» steht nicht im Buchstabenplan`);
  // Regel 6: Sichtwörter (Wortbilder) brauchen nur ihre Einzelbuchstaben («die» ohne «ie»); strenger (mit «ie») ist auch richtig
  const noetig = new Set(), streng = new Set();
  for (const t of texte) for (const wort of t.split(/[\s.,!?«»]+/).filter(Boolean)) {
    const einheiten = brauchtText(wort);
    einheiten.forEach((e) => streng.add(e));
    const buchst = [...wort.toLowerCase()].filter((c) => /\p{L}/u.test(c));
    if (SICHT.has(wort.toLowerCase()) && !einheiten.every((e) => braucht.includes(e))) buchst.forEach((c) => noetig.add(c));
    else einheiten.forEach((e) => noetig.add(e));
  }
  for (const n of noetig) if (!braucht.includes(n)) F(wo, `«braucht» fehlt «${n}» (${texte.join(' / ')})`);
  for (const b of braucht) if (!noetig.has(b) && !streng.has(b)) Wn(wo, `«braucht» enthält «${b}», das nicht vorkommt`);
}
function pruefeStufen(wo, stufen, erlaubt) {
  if (!stufen || typeof stufen !== 'object' || !Object.keys(stufen).length) return F(wo, '«stufen» fehlt');
  for (const [id, s] of Object.entries(stufen)) {
    if (!fert.has(id)) F(wo, `Fertigkeit ${id} unbekannt`);
    else if (!fert.get(id).stufen[String(s)]) F(wo, `${id} hat keine Stufe ${s}`);
    if (erlaubt && !erlaubt.includes(id)) F(wo, `${id} passt nicht zu dieser Art Inhalt`);
  }
}

for (const datei of dateien) {
  const roh = fs.readFileSync(datei, 'utf8');
  let d;
  try { d = JSON.parse(roh); } catch (e) { F(datei, 'kein gültiges JSON: ' + e.message); continue; }
  if (d.fach !== 'D' || !d.teil) F(datei, '«fach» oder «teil» fehlt');
  const id = (wo, x) => { if (!x.id) F(wo, 'ID fehlt'); else if (alleIds.has(x.id)) F(wo, `ID ${x.id} doppelt`); else alleIds.add(x.id); };

  for (const s of d.saetze || []) {
    const wo = `${path.basename(datei)} ${s.id}`;
    id(wo, s); pruefeText(wo, s.satz);
    if (!/^[A-ZÄÖÜ]/.test(s.satz) || !/[.!?]$/.test(s.satz)) F(wo, `Satzanfang gross und Punkt am Ende: ${s.satz}`);
    const woerter = s.satz.replace(/[.!?]$/, '').split(' ');
    if (!Array.isArray(s.woerter) || s.woerter.join(' ').replace(/ ([.!?])$/, '$1') !== s.satz) F(wo, `«woerter» passt nicht zum Satz: ${JSON.stringify(s.woerter)}`);
    if (woerter.length > 6) F(wo, `${woerter.length} Wörter (höchstens 6)`);
    pruefeBild(wo, s.bild);
    for (const ab of s.ablenker || []) { pruefeText(wo, ab.satz); pruefeBild(wo, ab.bild); if (ab.satz === s.satz) F(wo, 'Ablenker gleich dem Satz'); }
    if (s.stufen?.['D-LE-08'] && !(s.ablenker || []).length) F(wo, 'D-LE-08 braucht Ablenker-Sätze mit Bild');
    if (s.stufen?.['D-LE-08'] && !['nomen', 'verb', 'farbe', 'lage'].includes(s.unterschied)) F(wo, '«unterschied» fehlt oder unbekannt');
    pruefeStufen(wo, s.stufen, ['D-LE-08', 'D-SC-05', 'D-HB-08']);
    pruefeBraucht(wo, [s.satz, ...(s.stufen?.['D-LE-08'] ? (s.ablenker || []).map((a) => a.satz) : [])], s.braucht);
  }
  for (const g of d.geschichten || []) {
    const wo = `${path.basename(datei)} ${g.id}`;
    id(wo, g); (g.saetze || []).forEach((t) => pruefeText(wo, t)); pruefeText(wo, g.frage);
    if (!Array.isArray(g.saetze) || g.saetze.length < 2 || g.saetze.length > 5) F(wo, 'zwei bis fünf Sätze');
    if (!Array.isArray(g.optionen) || g.optionen.length < 2 || g.optionen.length > 4) F(wo, 'zwei bis vier Optionen');
    else { g.optionen.forEach((o) => pruefeBild(wo, o.bild || o.szene)); if (!(g.richtig >= 0 && g.richtig < g.optionen.length)) F(wo, '«richtig» ungültig'); }
    pruefeStufen(wo, g.stufen, ['D-HV-02', 'D-LE-10', 'D-WS-05']);
    if (g.stufen?.['D-LE-10']) pruefeBraucht(wo, [...g.saetze, g.frage], g.braucht);
  }
  for (const a of d.anweisungen || []) {
    const wo = `${path.basename(datei)} ${a.id}`;
    id(wo, a); pruefeText(wo, a.auftrag);
    const el = a.szene?.elemente || [];
    if (!el.length) F(wo, 'Szene ohne Elemente');
    const eIds = new Set(el.map((e) => e.id));
    for (const e of el) { if (!emoji(e.bild)) F(wo, `Element ${e.id} ohne Emoji`); if (!(e.x >= 0 && e.x <= 1 && e.y >= 0 && e.y <= 1)) F(wo, `Element ${e.id}: Lage ausserhalb`); }
    const oIds = new Set((a.szene?.orte || []).map((o) => o.id));
    if (a.loesung) for (const l of a.loesung) if (!eIds.has(l)) F(wo, `Lösung «${l}» ist kein Element`);
    if (a.ziehen) for (const z of a.ziehen) { if (!eIds.has(z.element)) F(wo, `Ziehen: Element «${z.element}» fehlt`); if (!oIds.has(z.ort)) F(wo, `Ziehen: Ort «${z.ort}» fehlt`); }
    if (!a.loesung && !a.ziehen) F(wo, '«loesung» oder «ziehen» fehlt');
    pruefeStufen(wo, a.stufen, ['D-HV-01']);
  }
  for (const g of d.gegenteile || []) {
    const wo = `${path.basename(datei)} ${g.id}`;
    id(wo, g);
    for (const s of [g.a, g.b]) { if (!s?.wort) F(wo, 'Wort fehlt'); else pruefeText(wo, s.wort); pruefeBild(wo, s?.szene || s?.bild); }
    if (g.satz) pruefeText(wo, g.satz);
  }
  for (const b of d.bildergeschichten || []) {
    const wo = `${path.basename(datei)} ${b.id}`;
    id(wo, b);
    if (!Array.isArray(b.bilder) || b.bilder.length < 3 || b.bilder.length > 4) F(wo, 'drei oder vier Bilder');
    else b.bilder.forEach((x) => pruefeBild(wo, x));
    if (!Array.isArray(b.sprich) || b.sprich.length !== b.bilder?.length) F(wo, 'je Bild ein Satz in «sprich»');
    else b.sprich.forEach((t) => pruefeText(wo, t));
    if (new Set((b.bilder || []).map((x) => JSON.stringify(x))).size !== (b.bilder || []).length) F(wo, 'gleiche Bilder in einer Geschichte');
    pruefeStufen(wo, b.stufen, ['D-WS-05']);
  }
}
console.log(`${dateien.length} Dateien, ${alleIds.size} Inhalte, ${fehler} Fehler, ${warnungen} Warnungen.`);
process.exit(fehler ? 1 : 0);
