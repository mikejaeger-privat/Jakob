// Prüft Kompetenzkatalog, Lehrmittel-Reihenfolge, Ziele und Parameter.
// Aufruf: node tools/pruefe_katalog.mjs [--bilanz]
import { readFileSync } from 'node:fs';

const lies = (p) => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const roh = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const bilanz = process.argv.includes('--bilanz');

const fehler = [];
const warnungen = [];
const F = (m) => fehler.push(m);
const W = (m) => warnungen.push(m);

const TYPEN = new Set(['wahl-bild', 'wahl-wort', 'wahl-hoeren', 'bild-wort', 'zuordnen', 'legen', 'nachspuren', 'zahl', 'zaehlen',
  'menge-legen', 'reihenfolge', 'muster', 'hoeren-tippen', 'silben', 'vorlesen', 'antippen', 'lautplatz']);
const STIMME = new Set(['noetig', 'hilfreich', 'ohne']);
const QUELLE = new Set(['woerter', 'inhalte', 'buchstaben', 'schrift', 'sichtwoerter', 'eltern', 'generator', 'karteikasten']);
const KARTEI = new Set(['buchstaben', 'sichtwoerter', 'lernwoerter', 'rechnen']);
const KLASSE = new Set([1, 1.5, 2]);
const LP21 = /^(D|MA)\.\d(\.[A-F](\.\d)?)?$/;

const plan = lies('site/data/buchstaben.json');
const grapheme = new Set(plan.liste.map((b) => b.id));
const kat = { D: lies('site/data/katalog/deutsch.json'), M: lies('site/data/katalog/mathe.json') };
const alle = new Map();

for (const [fach, k] of Object.entries(kat)) {
  const datei = fach === 'D' ? 'deutsch' : 'mathe';
  if (roh(`site/data/katalog/${datei}.json`).includes('ß')) F(`${datei}.json enthält «ß»`);
  if (k.fach !== fach) F(`${datei}.json: fach ist «${k.fach}»`);
  const gruppen = new Set();
  for (const g of k.gruppen) {
    if (gruppen.has(g.id)) F(`${fach}: Gruppe ${g.id} doppelt`);
    gruppen.add(g.id);
    if (!g.name || !g.bereich || !g.symbol) F(`${fach}: Gruppe ${g.id} unvollständig`);
  }
  for (const f of k.fertigkeiten) {
    const wo = f.id;
    if (!new RegExp(`^${fach}-[A-Z]{2}-\\d{2}$`).test(f.id)) F(`${wo}: ID-Format`);
    if (alle.has(f.id)) F(`${wo}: ID doppelt`);
    alle.set(f.id, f);
    if (f.gruppe !== f.id.split('-')[1]) F(`${wo}: gruppe passt nicht zur ID`);
    if (!gruppen.has(f.gruppe)) F(`${wo}: Gruppe ${f.gruppe} fehlt`);
    if (!KLASSE.has(f.klasse)) F(`${wo}: klasse ${f.klasse}`);
    if (![true, false, 'eltern'].includes(f.kern)) F(`${wo}: kern ${f.kern}`);
    if (!f.name) F(`${wo}: name fehlt`);
    if (!f.kurz || [...f.kurz].length > 28) F(`${wo}: kurz fehlt oder länger als 28 Zeichen`);
    if (!QUELLE.has(f.quelle)) F(`${wo}: quelle «${f.quelle}»`);
    if (!STIMME.has(f.stimme)) F(`${wo}: stimme «${f.stimme}»`);
    if (f.karteikasten && !KARTEI.has(f.karteikasten)) F(`${wo}: karteikasten «${f.karteikasten}»`);
    if (!f.typen.length) F(`${wo}: keine Typen`);
    for (const t of f.typen) if (!TYPEN.has(t)) F(`${wo}: Typ «${t}» unbekannt`);
    if (!f.lp21.length) F(`${wo}: lp21 fehlt`);
    for (const c of f.lp21) if (!LP21.test(c)) F(`${wo}: lp21 «${c}»`);
    if (f.stichwoerter.length < 3 || f.stichwoerter.length > 14) F(`${wo}: ${f.stichwoerter.length} Stichwörter`);
    for (const s of f.stichwoerter) if (s !== s.toLowerCase()) F(`${wo}: Stichwort «${s}» nicht klein`);
    const n = Object.keys(f.stufen);
    if (n.length < 2 || n.length > 3 || n.some((x, i) => x !== String(i + 1))) F(`${wo}: Stufen ${n.join(',')}`);
    for (const [nr, s] of Object.entries(f.stufen)) {
      if (!s.text) F(`${wo}/${nr}: Text fehlt`);
      if (s.stimme && !STIMME.has(s.stimme)) F(`${wo}/${nr}: stimme «${s.stimme}»`);
      for (const x of [...(s.braucht || []), ...(s.auswahl || [])]) if (!grapheme.has(x)) F(`${wo}/${nr}: «${x}» fehlt im Buchstabenplan`);
      if (fach === 'M' && ![10, 20, 100].includes(s.raum)) F(`${wo}/${nr}: raum ${s.raum}`);
      if (fach === 'D' && s.raum) F(`${wo}/${nr}: raum nur in Mathematik`);
      if (s.bedingung && !['dehnlaute', 'silben'].includes(s.bedingung)) F(`${wo}/${nr}: bedingung «${s.bedingung}»`);
      if (s.ausnahme && s.ausnahme !== 'muenzwerte') F(`${wo}/${nr}: ausnahme «${s.ausnahme}»`);
    }
    if (fach === 'M') {
      const r = Object.values(f.stufen).map((s) => s.raum);
      if (r.some((x, i) => i && x < r[i - 1]) && f.id !== 'M-ZE-03') W(`${wo}: Zahlenraum sinkt von Stufe zu Stufe (${r.join(', ')})`);
    }
  }
}

// Voraussetzungen: vorhanden, gleiche Fachgrenzen egal, keine Kreise
for (const f of alle.values()) {
  for (const v of [...f.vor, ...Object.values(f.stufen).flatMap((s) => s.vor || [])]) {
    if (!alle.has(v)) F(`${f.id}: Voraussetzung ${v} fehlt`);
    // Nur Voraussetzungen der ganzen Fertigkeit; eine höhere Stufe darf später im Jahr kommen.
    else if (f.vor.includes(v) && alle.get(v).klasse > f.klasse) W(`${f.id} (Klasse ${f.klasse}) setzt ${v} (Klasse ${alle.get(v).klasse}) voraus`);
  }
}
const farbe = new Map();
function besuche(id, pfad) {
  if (farbe.get(id) === 1) { F(`Kreis in den Voraussetzungen: ${[...pfad, id].join(' → ')}`); return; }
  if (farbe.get(id) === 2) return;
  farbe.set(id, 1);
  for (const v of alle.get(id)?.vor || []) if (alle.has(v)) besuche(v, [...pfad, id]);
  farbe.set(id, 2);
}
for (const id of alle.keys()) besuche(id, []);

// Lehrmittel-Reihenfolge
const lm = lies('site/data/lehrmittel.json');
const inM = new Set();
for (const k of lm.faecher.M.kapitel) {
  if (!/^\d\d(-\d\d)?$/.test(k.monat)) F(`Lehrmittel M «${k.name}»: monat «${k.monat}»`);
  for (const id of k.fertigkeiten) { if (!alle.has(id) || !id.startsWith('M-')) F(`Lehrmittel M «${k.name}»: ${id} unbekannt`); inM.add(id); }
}
for (const f of kat.M.fertigkeiten) if (!inM.has(f.id)) F(`Lehrmittel M: ${f.id} kommt in keinem Kapitel vor`);
const inD = new Map();
// Schlüssel «1», «1.5», «2» numerisch sortieren (JavaScript ordnet ganzzahlige Schlüssel zuerst).
for (const [kl, liste] of Object.entries(lm.faecher.D.reihenfolge).sort((a, b) => Number(a[0]) - Number(b[0]))) {
  for (const id of liste) {
    if (!alle.has(id) || !id.startsWith('D-')) F(`Lehrmittel D: ${id} unbekannt`);
    if (inD.has(id)) F(`Lehrmittel D: ${id} doppelt`);
    inD.set(id, Number(kl));
    if (alle.has(id) && alle.get(id).klasse !== Number(kl)) W(`Lehrmittel D: ${id} steht unter ${kl}, Katalog sagt ${alle.get(id).klasse}`);
  }
}
for (const f of kat.D.fertigkeiten) if (!inD.has(f.id)) F(`Lehrmittel D: ${f.id} fehlt in der Reihenfolge`);
// Deutsch: Voraussetzungen sollen in der Reihenfolge vorher kommen
const posD = new Map([...inD.keys()].map((id, i) => [id, i]));
for (const f of kat.D.fertigkeiten) for (const v of f.vor) if (posD.has(v) && posD.get(v) > posD.get(f.id)) W(`Lehrmittel D: ${f.id} kommt vor seiner Voraussetzung ${v}`);

// Ziele
const z = lies('site/data/ziele.json');
const datum = (s) => /^\d{4}-\d\d-\d\d$/.test(s) && !Number.isNaN(Date.parse(s));
for (const e of z.etappen) if (!datum(e.datum)) F(`Etappe ${e.id}: Datum ${e.datum}`);
let vorher = '';
for (const [a, b, name] of z.ferien.liste) {
  if (!datum(a) || !datum(b) || a > b) F(`Ferien ${name}: ${a} bis ${b}`);
  if (a <= vorher) F(`Ferien ${name}: nicht aufsteigend`);
  vorher = b;
}
for (const [d, name] of z.feiertage.liste) if (!datum(d)) F(`Feiertag ${name}: ${d}`);

// Parameter
const p = lies('site/data/parameter.json');
const summe = Object.values(p.gewichtung).reduce((a, b) => a + b, 0);
if (Math.abs(summe - 1) > 1e-9) F(`Gewichtung ergibt ${summe}`);
if (!(p.lernzeit.minMinuten <= p.lernzeit.minuten && p.lernzeit.minuten <= p.lernzeit.maxMinuten)) F('Lernzeit: Minuten ausserhalb der Grenzen');
for (const datei of ['site/data/lehrmittel.json', 'site/data/ziele.json', 'site/data/parameter.json', 'site/data/buchstaben.json']) if (roh(datei).includes('ß')) F(`${datei} enthält «ß»`);

if (bilanz) {
  for (const [fach, k] of Object.entries(kat)) {
    const g = {};
    for (const f of k.fertigkeiten) g[f.gruppe] = (g[f.gruppe] || 0) + 1;
    const kern = k.fertigkeiten.filter((f) => f.kern === true).length;
    const kl = {};
    for (const f of k.fertigkeiten) kl[f.klasse] = (kl[f.klasse] || 0) + 1;
    console.log(`${k.name}: ${k.fertigkeiten.length} Fertigkeiten (${kern} Kern), Stufen ${k.fertigkeiten.reduce((a, f) => a + Object.keys(f.stufen).length, 0)}`, g, 'Klassen', kl);
  }
}

for (const w of warnungen) console.log('Warnung:', w);
for (const f of fehler) console.log('Fehler:', f);
console.log(fehler.length ? `${fehler.length} Fehler` : `Katalog in Ordnung (${alle.size} Fertigkeiten, ${warnungen.length} Warnungen).`);
process.exit(fehler.length ? 1 : 0);
