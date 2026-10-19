// Simulation: drei Kinder (langsam, mittel, schnell) vom 19.10.2026 bis zum Ende der 1. Klasse, mit dem echten Tagesplan,
// dem echten Ablauf der Steine (core/ablauf.js) und den echten Generatoren. Nur das Antworten ist simuliert.
// Geprüft (KONZEPT Abschnitt 10): Zeit, Erfolg am Schluss, Buchstaben-Freigabe, Zahlenraum, Karteikasten-Abstände,
// Schatzkarten-Abstände, höchstens ein neues Thema und eine Zeig-Runde pro Tag.
// Aufruf: node tools/sim/lauf.mjs [--bis 2027-07-16] [--profil mittel] [--minuten 10] [--md]
import fs from 'node:fs';
import path from 'node:path';
import { kalender } from '../../site/js/core/kalender.js';
import { lernkern } from '../../site/js/core/lernen.js';
import { spieleStein } from '../../site/js/core/ablauf.js';
import { status } from '../../site/js/core/stand.js';
import { schonDran } from '../../site/js/core/plan.js';
import { zufall, tagNr, isoVonNr, wochentag } from '../../site/js/core/util.js';
import { stufeFrei as raumFrei } from '../../site/js/math/index.js';
import { stufeFrei as deutschFrei } from '../../site/js/deutsch/index.js';
import { mischeInhalte, brauchtText } from '../../site/js/deutsch/lib.js';
import { standardEinstellungen, standardBuchstaben } from '../../site/js/app/zustand.js';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const START = tagNr(opt('--von', '2026-10-19'));
const ENDE = tagNr(opt('--bis', '2027-07-16'));
const MINUTEN = Number(opt('--minuten', 10));
const NUR = opt('--profil', null);
const lies = (p) => JSON.parse(fs.readFileSync(path.join('site/data', p), 'utf8'));

const deutsch = lies('katalog/deutsch.json'), mathe = lies('katalog/mathe.json');
const index = lies('inhalte/index.json');
const G = {
  k: { D: deutsch, M: mathe, fertigkeiten: new Map([...deutsch.fertigkeiten, ...mathe.fertigkeiten].map((f) => [f.id, f])) },
  P: lies('parameter.json'), Z: lies('ziele.json'), LM: lies('lehrmittel.json'), B: lies('buchstaben.json'), W: lies('woerter.json'),
  IN: mischeInhalte((index.D || []).map((d) => lies('inhalte/' + d))),
};
const K = kalender(G.Z);

// Profile: Können zu Beginn (für Stoff, den die Klasse schon hatte), Lernrate pro Aufgabe, Lernen in der Schule pro Woche, Tempo, Ausfall
const PROFILE = {
  langsam: { start: 0.45, lern: 0.05, schule: 0.03, tempo: 1.45, ausfall: 0.15 },
  mittel: { start: 0.65, lern: 0.08, schule: 0.05, tempo: 1.0, ausfall: 0.1 },
  schnell: { start: 0.85, lern: 0.12, schule: 0.07, tempo: 0.75, ausfall: 0.05 },
};
const SEK = { zahl: 18, 'wahl-bild': 10, 'wahl-wort': 10, 'wahl-hoeren': 14, 'bild-wort': 14, zuordnen: 25, legen: 35, nachspuren: 35, 'menge-legen': 22, reihenfolge: 25, 'hoeren-tippen': 22, silben: 16, vorlesen: 30, antippen: 16, lautplatz: 14, zaehlen: 18, muster: 14 };   // Sekunden bei mittlerem Tempo (Annahme)

async function simuliere(name, prof, seed) {
  const r = zufall(seed);
  const Z = {
    profil: { name: 'Sim', erstellt: START, pin: null }, einstellungen: { ...standardEinstellungen(G.P), minuten: MINUTEN },
    buchstaben: standardBuchstaben(G.B), stand: {}, kasten: {}, gesehen: {}, messung: {}, tage: {}, lernwoerter: [],
    meldungen: [], tagesplan: null, sammelbild: { szene: G.P.belohnung.szenen[0], teile: [], album: [] }, schatzkarten: [], entdecker: null,
  };
  let heute = START;
  let dCtx = null, dKey = '';
  const freigabe = () => new Set(Object.entries(Z.buchstaben.frei).filter(([, v]) => v).map(([k]) => k));
  const ctxD = () => {
    const fr = freigabe();
    const key = [...fr].join(',') + '|' + Z.lernwoerter.length;
    if (key !== dKey) { dKey = key; dCtx = { lexikon: G.W, buchstaben: G.B, freigabe: fr, inhalte: G.IN, dehnlautText: G.P.sprache.dehnlautText, stimme: true, silben: true, dehnlaute: true, lernwoerter: Z.lernwoerter.map((x) => x.wort), zuletzt: new Set() }; }
    return dCtx;
  };
  const ctxM = () => ({ grenze: Z.einstellungen.zahlenraum, begriffe: G.P.begriffe, stimme: true });
  const spielbar = (f, s) => {
    if (!f || !f.stufen[s]) return false;
    if (f.id.startsWith('M-')) return raumFrei(f.stufen[s], Z.einstellungen.zahlenraum);
    return deutschFrei(f, s, ctxD());
  };
  const W = { Z, G, K, heute: () => heute, stimme: () => true, spielbar, speichere: () => true, seed: () => Math.floor(r.next() * 4294967296) };
  const L = lernkern(W);

  // Können des Kindes je Fertigkeit und Stufe
  const koennen = new Map();
  const c0 = L.kontextPlan(START, { seed: 1 });
  const schon = new Set([...schonDran(c0, 'D'), ...schonDran(c0, 'M')]);
  const kann = (f, s) => {
    const k = `${f}|${s}`;
    // Stoff, den die Klasse schon hatte: Stufe 1 meist gut, höhere Stufen weniger; Neues tief
    if (!koennen.has(k)) koennen.set(k, Math.max(0.05, Math.min(0.95, (schon.has(f) ? prof.start + (Number(s) === 1 ? 0.2 : 0) : 0.15) - 0.12 * (Number(s) - 1) + (r.next() - 0.5) * 0.1)));
    return koennen.get(k);
  };
  const lerne = (f, s, x) => koennen.set(`${f}|${s}`, Math.min(0.98, kann(f, s) + x * (1 - kann(f, s))));

  const pruef = { zeit: [], erfolg: [], buchstaben: [], raum: [], kasten: [], neu: [], zeig: [], leer: [] };
  const tageLog = [];
  let tagSek = 0, aufgabenTag = 0, nachZeit = 0, letzter = null, steinArt = null;
  const io = {
    ctx: (fach) => (fach === 'M' ? ctxM() : ctxD()),
    seed: () => Math.floor(r.next() * 4294967296),
    szene: async () => {},
    protokoll: () => {},
    spiele: async (a, { modus, fortschritt } = {}) => {
      const total = Z.einstellungen.minuten * 60;
      const erlaubt = !fortschritt || (steinArt === 'schluss' && fortschritt.jetzt === 0);   // Erfolgsaufgabe, erste Aufgabe im Schlussstein
      if (tagSek >= total && !erlaubt) nachZeit++;
      // Freigaben prüfen
      if (a.fach === 'D') { const fr = freigabe(); for (const b of a.braucht || []) if (!fr.has(b)) pruef.buchstaben.push(`${isoVonNr(heute)} ${a.f}/${a.s}: ${b}`); }
      else { const st = G.k.fertigkeiten.get(a.f).stufen[a.s]; if ((st.raum ?? 10) > Z.einstellungen.zahlenraum) pruef.raum.push(`${isoVonNr(heute)} ${a.f}/${a.s}`); }
      if (a.karte && Z.kasten[a.karte] && Z.kasten[a.karte].faellig > heute) pruef.kasten.push(`${isoVonNr(heute)} ${a.karte} fällig ${isoVonNr(Z.kasten[a.karte].faellig)}`);
      const k = kann(a.f, a.s);
      let wert;
      if (a.typ === 'nachspuren') wert = 'geuebt';
      else if (r.next() < k) wert = 1;
      else if (modus !== 'zeig' && r.next() < k * 0.7) wert = 0.5;
      else wert = 0;
      const sek = (SEK[a.typ] ?? 15) * prof.tempo * (0.7 + r.next() * 0.6) * (wert === 1 ? 1 : 1.5);
      lerne(a.f, a.s, prof.lern * (wert === 1 ? 1 : wert === 0.5 ? 0.8 : 0.4));
      tagSek += sek + 2; aufgabenTag++;
      letzter = wert;
      return { wert, versuche: wert === 1 ? 0 : 1, hilfe: wert === 0.5, ms: sek * 1000 };
    },
  };

  let schatzTage = [];
  const schnapp = {};   // Stand zu den Etappen-Daten
  let woche = null;
  for (heute = START; heute <= ENDE; heute++) {
    // Schule bringt Stoff voran: was laut Lehrmittel dran ist, wird jede Schulwoche etwas besser
    if (wochentag(heute) === 0 && K.schultag(heute)) {
      const c = L.kontextPlan(heute, { seed: 2 });
      for (const f of [...schonDran(c, 'D'), ...schonDran(c, 'M')]) for (const s of [1, 2, 3]) lerne(f, s, prof.schule / s);
    }
    for (const e of G.Z.etappen) if (tagNr(e.datum) === heute) schnapp[e.name] = stand(Z, heute);
    if (!K.lerntag(heute, Z.einstellungen.lernTage)) continue;
    if (r.next() < prof.ausfall) continue;
    tagSek = 0; aufgabenTag = 0; nachZeit = 0; letzter = null;
    const plan = L.planHeute();
    if (plan.art === 'schatz') schatzTage.push(heute);
    // Reihenfolge: Aufwärmen bzw. Schatz zuerst, dann Deutsch und Mathematik in zufälliger Folge, Schluss zuletzt
    const reihe = plan.steine.map((s, i) => i);
    const haupt = reihe.filter((i) => ['deutsch', 'mathe'].includes(plan.steine[i].art));
    if (haupt.length === 2 && r.bool()) haupt.reverse();
    const folge = [...reihe.filter((i) => ['aufwaermen', 'schatz'].includes(plan.steine[i].art)), ...haupt, ...reihe.filter((i) => plan.steine[i].art === 'schluss')];
    const neuTag = new Set();
    for (const i of folge) {
      const st = plan.steine[i];
      if (!st.eintraege.length) pruef.leer.push(`${isoVonNr(heute)} ${st.art}`);
      const n0 = aufgabenTag;
      steinArt = st.art;
      const erg = await spieleStein(W, L, io, plan, i);
      if (erg.fertig) plan.erledigt.push(i);
      for (const e of st.eintraege) if (e.neu && e.erg?.length) neuTag.add(e.f);
      if (aufgabenTag === n0 && st.eintraege.length) pruef.leer.push(`${isoVonNr(heute)} ${st.art} (keine Aufgabe gespielt)`);
    }
    L.sitzungFertig();
    const total = Z.einstellungen.minuten * 60;
    if (nachZeit > 0) pruef.zeit.push(`${isoVonNr(heute)}: ${nachZeit} Aufgaben nach ${MINUTEN} Minuten begonnen (Ende ${Math.round(tagSek)} s)`);
    if (letzter !== null && letzter === 0) pruef.erfolg.push(`${isoVonNr(heute)}: letzte Aufgabe nicht gelöst`);
    if (neuTag.size > G.P.sitzung.neueThemenProTag) pruef.neu.push(`${isoVonNr(heute)}: ${[...neuTag].join(', ')}`);
    if ((Z.tage[heute]?.zeig || 0) > G.P.zeigRunde.maxProTag) pruef.zeig.push(isoVonNr(heute));
    tageLog.push({ tag: heute, art: plan.art, sek: tagSek, n: aufgabenTag, total });
    void woche;
  }
  // Schatzkarten-Abstände in Schulwochen
  const abstaende = [];
  for (let i = 0; i < schatzTage.length; i++) {
    const von = i ? schatzTage[i - 1] : START;
    const montag = von - wochentag(von) + (i ? 7 : 0);
    abstaende.push(K.schulwochen(montag, schatzTage[i] - 1));
  }
  for (const e of G.Z.etappen) if (!schnapp[e.name] && tagNr(e.datum) > ENDE) schnapp[e.name] = null;
  return { name, Z, tageLog, pruef, schatzTage, abstaende, schnapp };
}

// Statusübersicht zu einem Tag
function stand(Z, t) {
  const B = G.P.beherrschung;
  const z = {};
  for (const fach of ['D', 'M']) {
    const x = { neu: 0, vermutet: 0, ueben: 0, fast: 0, sicher: 0 };
    for (const f of G.k[fach].fertigkeiten) if (f.kern === true && f.klasse === 1) for (const s of Object.keys(f.stufen)) x[status(Z.stand, f.id, s, t, B)]++;
    z[fach] = x;
  }
  return z;
}

const ergebnisse = [];
for (const [name, prof] of Object.entries(PROFILE)) {
  if (NUR && NUR !== name) continue;
  ergebnisse.push(await simuliere(name, prof, { langsam: 11, mittel: 22, schnell: 33 }[name]));
}

// Bericht
const W0 = (e, f, s) => (f.id.startsWith('M-') ? raumFrei(f.stufen[s], e.Z.einstellungen.zahlenraum) : deutschFrei(f, s, { freigabe: new Set(Object.entries(e.Z.buchstaben.frei).filter(([, v]) => v).map(([k]) => k)), stimme: true, silben: true, dehnlaute: true, lernwoerter: [] }));
const MD = args.includes('--md');
const zeilen = [];
const P = (t = '') => zeilen.push(t);
const ETAPPEN = G.Z.etappen.map((e) => ({ name: e.name, tag: tagNr(e.datum) }));
for (const e of ergebnisse) {
  const L = e.tageLog;
  const min = L.map((x) => x.sek / 60);
  const mittel = min.reduce((a, b) => a + b, 0) / Math.max(1, min.length);
  const pq = (q) => { const s = [...min].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))] || 0; };
  P(`### Profil ${e.name}`);
  P();
  P(`- Lerntage mit Sitzung: ${L.length} (davon Entdeckerrunde ${L.filter((x) => x.art === 'entdecker').length}, Schatzkarte ${L.filter((x) => x.art === 'schatz').length}); Aufgaben pro Tag im Mittel ${(L.reduce((a, b) => a + b.n, 0) / Math.max(1, L.length)).toFixed(1)}.`);
  P(`- Minuten pro Tag: Mittel ${mittel.toFixed(1)}, 90 % der Tage höchstens ${pq(0.9).toFixed(1)}, längster Tag ${Math.max(...min).toFixed(1)} (eingestellt ${MINUTEN}).`);
  P(`- Schatzkarten: ${e.schatzTage.map((t) => isoVonNr(t)).join(', ') || 'keine'} (Abstände in Schulwochen: ${e.abstaende.join(', ') || '–'}).`);
  const zr = Object.values(e.Z.stand).filter((x) => x.zrN > 0);
  P(`- Zeig-was-du-kannst-Runden: ${zr.reduce((a, b) => a + b.zrN, 0)} Versuche, ${zr.filter((x) => x.zr !== null).length} Stufen bestanden; Karteikarten im Kasten: ${Object.keys(e.Z.kasten).length} (Fach 4 bis 5: ${Object.values(e.Z.kasten).filter((k) => k.fach >= 4).length}); Sammelbild: ${e.Z.sammelbild.album.length} volle Bilder, ${e.Z.sammelbild.teile.length} Teile im aktuellen.`);
  for (const et of ETAPPEN) {
    const z = e.schnapp[et.name];
    if (!z) continue;
    const t = (x) => `sicher ${x.sicher}, fast sicher ${x.fast}, am Üben ${x.ueben}, vermutet ${x.vermutet}, neu ${x.neu}`;
    P(`- ${et.name} (Stufen der 1. Klasse): Deutsch ${t(z.D)}; Mathematik ${t(z.M)}.`);
  }
  const pr = e.pruef;
  const anz = (l) => (l.length ? `${l.length} (z. B. ${l.slice(0, 2).join('; ')})` : '0');
  P(`- Prüfungen: Zeit überschritten ${anz(pr.zeit)}; Sitzung ohne Erfolg am Schluss ${anz(pr.erfolg)}; nicht eingeführte Buchstaben ${anz(pr.buchstaben)}; Zahlenraum ${anz(pr.raum)}; Karte vor Fälligkeit ${anz(pr.kasten)}; mehr als ein neues Thema ${anz(pr.neu)}; mehr als eine Zeig-Runde ${anz(pr.zeig)}; leere Steine ${anz(pr.leer)}.`);
  P();
}
console.log(zeilen.join('\n'));
if (args.includes('--neu')) for (const e of ergebnisse) { const t = ENDE; const B = G.P.beherrschung; const l = []; for (const f of [...G.k.D.fertigkeiten, ...G.k.M.fertigkeiten]) if (f.kern === true && f.klasse === 1) for (const s of Object.keys(f.stufen)) if (status(e.Z.stand, f.id, s, t, B) === 'neu') l.push(f.id.slice(2) + '/' + s + (W0(e, f, s) ? '' : '✗')); console.log(e.name, 'neu am Ende:', l.join(' ')); }
const verstoesse = ergebnisse.reduce((n, e) => n + e.pruef.buchstaben.length + e.pruef.raum.length + e.pruef.kasten.length + e.pruef.neu.length + e.pruef.zeig.length + e.pruef.zeit.length + e.pruef.erfolg.length, 0);
if (!MD) console.log(verstoesse ? `${verstoesse} Verstösse` : 'Keine Verstösse.');
process.exit(verstoesse ? 1 : 0);
