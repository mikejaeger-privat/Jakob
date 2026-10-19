// Kern des Lernens (ohne Browser): Tagesplan-Kontext, Verbuchen, Karteikasten, Entdeckerrunde, Schatzkarte, Sammelbild.
// Die App (app/lernen.js) und die Simulation (tools/sim/) rufen dieselben Funktionen auf.
// W = { Z: Zustand, G: Grundlagen, K: Kalender, heute(), stimme(), spielbar(f, s), speichere(...schlüssel) }
import { tagesplan } from './plan.js';
import { verbuche, zeigErgebnis, zeigBestanden, vermute, lies, status } from './stand.js';
import { verbucheKarte } from './kasten.js';
import { zufall, neuerSeed, tagNr, wochentag } from './util.js';
import { zerlege } from '../deutsch/lib.js';

export function lernkern(W) {
  const Z = W.Z;
  const MINUS = '−';

  // --- Kalenderwerte ---
  // Aktuelles Mathematik-Kapitel: Vorgabe der Eltern oder Schätzung aus dem Datum (Kapitel des Monats, über den Monat verteilt)
  function mKapitel(t = W.heute()) {
    const kap = W.G.LM.faecher.M.kapitel;
    if (Number.isInteger(Z.einstellungen?.kapitel) && kap[Z.einstellungen.kapitel]) return Z.einstellungen.kapitel;
    const d = new Date(t * 86400000);
    const m = d.getUTCMonth() + 1;
    const schulMonat = (x) => (x >= 8 ? x - 8 : x + 4); // August = 0 … Juli = 11
    const jetzt = schulMonat(m);
    const start = kap.map((k) => schulMonat(Number(k.monat.slice(0, 2))));
    const imMonat = start.map((s, i) => [s, i]).filter(([s]) => s === jetzt).map(([, i]) => i);
    if (imMonat.length) {
      const tageImMonat = new Date(Date.UTC(d.getUTCFullYear(), m, 0)).getUTCDate();
      return imMonat[Math.min(imMonat.length - 1, Math.floor(((d.getUTCDate() - 1) / tageImMonat) * imMonat.length))];
    }
    let letzt = 0;
    start.forEach((s, i) => { if (s <= jetzt) letzt = i; });
    return letzt;
  }
  // Anteil des Schuljahres (in Schulwochen)
  function schuljahrAnteil(t = W.heute()) {
    const s = tagNr(W.G.Z.schuljahr.start), e = tagNr(W.G.Z.schuljahr.ende);
    if (t <= s) return 0;
    return Math.min(1, W.K.schulwochen(s, t) / Math.max(1, W.K.schulwochen(s, e)));
  }

  // --- Karteikasten ---
  function kartenKandidaten() {
    const frei = Z.buchstaben?.frei || {};
    const D = [];
    const ohne = new Set(W.G.P.karteikasten.buchstabenOhneKarte || []);
    // Lernwörter nur, wenn alle ihre Buchstaben eingeführt sind (Leitplanke: nur freigegebene Buchstaben)
    for (const lw of (Z.lernwoerter || []).filter((x) => !x.geloescht)) if (zerlege(lw.wort).every((e) => frei[e])) D.push('l:' + lw.id);
    for (const id of Z.buchstaben?.reihenfolge || []) {
      const b = W.G.B.liste.find((x) => x.id === id);
      if (!b || !frei[id] || ohne.has(id)) continue;
      if (b.art === 'verbindung') { if (W.stimme()) D.push('v:' + id); } else D.push('b:' + id);
    }
    if (W.stimme()) for (const sw of W.G.W.sichtwoerter) {
      const e = lies(Z.stand, 'D-LE-07', sw.gruppe);
      if (e && (e.na > 0 || e.vermutet)) D.push('s:' + sw.wort);
    }
    const M = [];
    const B = W.G.P.beherrschung, t = W.heute();
    const traegt1 = (id) => ['fast', 'sicher', 'vermutet'].includes(status(Z.stand, id, 1, t, B));
    if (traegt1('M-ZE-02')) for (let n = 2; n <= 10; n++) for (let a = 1; a < n; a++) M.push(`r:${n}=${a}+${n - a}`);
    if (traegt1('M-RE-04')) {
      for (let s = 2; s <= 10; s++) for (let a = 1; a < s; a++) M.push(`r:${a}+${s - a}`);
      for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) M.push(`r:${a}${MINUS}${b}`);
    }
    if (traegt1('M-RE-07') && (Z.einstellungen.zahlenraum || 20) >= 20) {
      for (let a = 2; a <= 9; a++) for (let b = 11 - a; b <= 9; b++) M.push(`r:${a}+${b}`);
      for (let a = 11; a <= 18; a++) for (let b = a - 9; b <= 9; b++) if (a - b < 10) M.push(`r:${a}${MINUS}${b}`);
    }
    return { D, M };
  }
  // Welche Fertigkeit und Stufe übt eine Karte?
  function kartenZiel(id) {
    const k = Z.kasten[id];
    const fach = k ? k.fach : 1;
    const [art, rest] = [id[0], id.slice(2)];
    if (art === 'b') return W.stimme() ? { f: 'D-BU-01', s: fach <= 2 ? '1' : '2' } : { f: 'D-BU-02', s: fach <= 2 ? '1' : '2' };
    if (art === 'v') { const st = ['sch', 'ei', 'au'].includes(rest) ? '1' : ['ch', 'eu', 'ie'].includes(rest) ? '2' : '3'; return { f: 'D-BU-07', s: st }; }
    if (art === 's') { const sw = W.G.W.sichtwoerter.find((x) => x.wort === rest); return { f: 'D-LE-07', s: String(sw?.gruppe || 1) }; }
    if (art === 'l') return { f: 'D-SC-06', s: fach <= 2 ? '1' : fach === 3 ? '2' : '3' };
    if (art === 'r') {
      if (rest.includes('=')) return { f: 'M-RE-14', s: '1' };
      const [a, b] = rest.split(/[+−]/).map(Number);
      const gross = rest.includes('+') ? a + b > 10 : a > 10;
      return { f: 'M-RE-14', s: gross ? '3' : '2' };
    }
    return {};
  }
  // Lernwort einer Karte (für den Generator)
  const lernwortVon = (id) => (id?.startsWith('l:') ? (Z.lernwoerter || []).find((x) => x.id === id.slice(2))?.wort || null : null);

  // --- Entdeckerrunde ---
  function entdeckerAktiv(t = W.heute()) {
    const E = Z.entdecker;
    if (!E) return true;
    if (E.fertig) return false;
    return E.tage.includes(t) || E.tage.length < W.G.P.entdeckerrunde.lernTage;
  }

  // --- Schatzkarte ---
  function schatzFaellig(t = W.heute()) {
    if (entdeckerAktiv(t) || Z.tagesplan?.tag === t) return Z.tagesplan?.tag === t && Z.tagesplan.art === 'schatz';
    const SK = W.G.P.schatzkarte;
    const letzte = (Z.schatzkarten || []).at(-1);
    const basis = letzte ? letzte.tag : (Z.entdecker?.tage?.[0] ?? Z.profil.erstellt);
    const montag = basis - wochentag(basis) + (letzte ? 7 : 0);
    const wochen = W.K.schulwochen(montag, t - wochentag(t) - 1);   // ganze Schulwochen vor der laufenden Woche
    const geuebt = Object.values(Z.stand).filter((e) => e.na > 0).length;
    return wochen >= (letzte ? SK.abstandSchulwochenMin : SK.ersteNachSchulwochen) && geuebt >= 8;
  }

  // --- Tagesplan ---
  function lerntagNr(t) { return Object.entries(Z.tage || {}).filter(([d, x]) => Number(d) < t && x.n > 0).length; }
  function startLeicht() {
    const F = W.G.k.fertigkeiten;
    const ok = (l) => l.filter(([id, s]) => F.has(id) && W.spielbar(F.get(id), String(s))).map(([f, s]) => ({ f, s: String(s) }));
    return {
      D: ok([['D-BU-01', 1], ['D-BU-02', 1], ['D-HB-01', 1]]),
      M: ok([['M-ZA-05', 1], ['M-ME-01', 1], ['M-ZA-01', 1]]),
      schluss: ok([['M-FO-03', 1], ['M-ZA-01', 1], ['M-ME-04', 1], ['D-BU-04', 1], ['D-HB-01', 1]]),
    };
  }
  function kontextPlan(t = W.heute(), extra = {}) {
    const tagX = Z.tage?.[t] || {};
    const lwBald = (Z.lernwoerter || []).some((x) => !x.geloescht && x.test !== null && x.test >= t && x.test - t <= W.G.P.plan.lernwoerterVorTestTage);
    return {
      heute: t, P: W.G.P, k: W.G.k, lm: W.G.LM, stand: Z.stand, kasten: Z.kasten,
      minuten: Z.einstellungen.minuten, gewichtung: Z.einstellungen.gewichtung,
      mKapitel: mKapitel(t), dAnteil: schuljahrAnteil(t), spielbar: W.spielbar, rng: zufall(extra.seed ?? (W.seed ? W.seed() : neuerSeed())),
      lerntagNr: lerntagNr(t), entdecker: entdeckerAktiv(t) ? (Z.entdecker || { tage: [], proben: {} }) : null,
      schatzFaellig: schatzFaellig(t), kartenKandidaten: kartenKandidaten(), kartenZiel,
      neuHeute: tagX.neuKarten || 0, zeigHeute: tagX.zeig || 0, neuesThemaHeute: tagX.neuesThema || null,
      lernwoerterBald: lwBald, startLeicht: startLeicht(), ...extra,
    };
  }
  function planHeute({ neu = false } = {}) {
    const t = W.heute();
    if (!neu && Z.tagesplan?.tag === t && Z.tagesplan.v === 2) return Z.tagesplan;
    const plan = tagesplan(kontextPlan(t));
    plan.v = 2;
    Z.tagesplan = plan;
    if (plan.neuesThema) tagEintrag(t).neuesThema = plan.neuesThema;
    W.speichere('tagesplan', 'tage');
    return plan;
  }

  // --- Verbuchen ---
  function tagEintrag(t) {
    if (!Z.tage) Z.tage = {};
    return Z.tage[t] || (Z.tage[t] = { n: 0, sek: 0, steine: 0, zeig: 0, neuKarten: 0, neuesThema: null, fertig: false });
  }
  function geschaetzteSekunden(a) {
    const L = W.G.P.lernzeit;
    const m = Z.messung?.[a.typ];
    if (m) return m;
    if (a.karte) return L.sekundenProAufgabe.karte;
    return L.sekundenProAufgabe[a.typ] ?? L.sekundenProAufgabe[a.fach] ?? 25;
  }
  function sitzungSekunden(t = W.heute()) { return Z.tage?.[t]?.sek || 0; }

  // Eine Antwort verbuchen. e: Planeintrag ({ f, s, karte }), r: Ergebnis von spieleAufgabe
  function verbucheAntwort(e, a, r, { entdecker = false } = {}) {
    const t = W.heute();
    const B = W.G.P.beherrschung;
    verbuche(Z.stand, a.f, a.s, r.wert, t, B);
    const tag = tagEintrag(t);
    tag.n++;
    tag.sek += Math.min(180, r.ms / 1000) + 2;
    if (e.karte) {
      if (!Z.kasten[e.karte]) tag.neuKarten++;
      verbucheKarte(Z.kasten, e.karte, r.wert === 'geuebt' ? 1 : r.wert, t, W.G.P.karteikasten, { entdecker });
    }
    // Zeit pro Aufgabentyp (gleitender Mittelwert)
    if (!Z.messung) Z.messung = {};
    const sek = Math.min(120, r.ms / 1000), g = W.G.P.lernzeit.messungGewichtNeu;
    Z.messung[a.typ] = Z.messung[a.typ] ? Math.round((Z.messung[a.typ] * (1 - g) + sek * g) * 10) / 10 : Math.round(sek * 10) / 10;
    // Gesehene Aufgaben (gegen Wiederholungen)
    const gk = `${a.f}|${a.s}`;
    if (!Z.gesehen) Z.gesehen = {};
    Z.gesehen[gk] = [...(Z.gesehen[gk] || []).filter((x) => x !== a.sig), a.sig].slice(-20);
    W.speichere('stand', 'kasten', 'messung', 'tage', 'gesehen');
  }

  // Zeig-Runde abschliessen
  function zeigFertig(f, s, ergebnisse) {
    const t = W.heute();
    const ZR = W.G.P.zeigRunde;
    const werte = ergebnisse.map((r) => r.wert);
    const richtig = werte.slice(0, ZR.aufgaben).filter((w) => w === 1).length;
    const zusatz = werte.length > ZR.aufgaben ? werte[ZR.aufgaben] === 1 : null;
    const bestanden = zeigBestanden(richtig, zusatz, ZR);
    zeigErgebnis(Z.stand, f, s, bestanden, t, W.G.P.beherrschung);
    tagEintrag(t).zeig++;
    if (bestanden) tagEintrag(t).zeigBestanden = true;   // das Teil im Sammelbild wird heute etwas Besonderes
    W.speichere('stand', 'tage');
    return bestanden;
  }
  // Braucht die Zeig-Runde eine fünfte Aufgabe? (3 von 4 richtig)
  function zeigZusatz(ergebnisse) {
    const ZR = W.G.P.zeigRunde;
    if (ergebnisse.length !== ZR.aufgaben) return false;
    return ergebnisse.filter((r) => r.wert === 1).length === ZR.bestehenMitZusatz;
  }

  // Entdeckerrunde: Ergebnis einer Probe (zwei Aufgaben einer Stufe)
  function probeFertig(f, s, ergebnisse) {
    const t = W.heute();
    const E = Z.entdecker || (Z.entdecker = { tage: [], proben: {}, fertig: false });
    if (!E.tage.includes(t)) E.tage.push(t);
    const fert = W.G.k.fertigkeiten.get(f);
    const st = Object.keys(fert.stufen).map(Number).sort((a, b) => a - b);
    const ok = ergebnisse.length >= W.G.P.entdeckerrunde.aufstiegNachRichtigen && ergebnisse.every((r) => r.wert === 1);
    if (ok) {
      vermute(Z.stand, f, s, W.G.P.entdeckerrunde.startWertNachAufstieg, t, W.G.P.beherrschung);
      const naechste = st.find((x) => x > Number(s));
      E.proben[f] = naechste && W.spielbar(fert, String(naechste)) ? { s: naechste, fertig: false } : { s: Number(s), fertig: true };
    } else E.proben[f] = { s: Number(s), fertig: true };
    W.speichere('entdecker', 'stand');
    return ok ? E.proben[f] : null;
  }

  // Sitzung fertig (alle Steine): Tag abschliessen, Sammelbild, Entdeckerrunde zählen
  function sitzungFertig() {
    const t = W.heute();
    const tag = tagEintrag(t);
    const erstes = !tag.fertig;
    tag.fertig = true;
    let teil = null;
    if (erstes) {
      if (Z.tagesplan?.art === 'entdecker') {
        const E = Z.entdecker || (Z.entdecker = { tage: [], proben: {}, fertig: false });
        if (!E.tage.includes(t)) E.tage.push(t);
        if (E.tage.length >= W.G.P.entdeckerrunde.lernTage) E.fertig = true;
        W.speichere('entdecker');
      }
      teil = sammelTeil(tag.zeigBestanden ? 'besonders' : 'normal');
    }
    W.speichere('tage');
    return { teil };
  }

  // --- Sammelbild ---
  function sammelTeil(art) {
    if (Z.einstellungen.belohnung === false) return null;
    const P = W.G.P.belohnung;
    const sb = Z.sammelbild || (Z.sammelbild = { szene: P.szenen[0], teile: [], album: [] });
    const teil = { id: `t${Date.now().toString(36)}${sb.teile.length}`, art, tag: W.heute(), nr: sb.teile.length };
    sb.teile.push(teil);
    if (sb.teile.length >= P.teileProSzene) {
      sb.album.push({ id: `a${sb.album.length + 1}`, szene: sb.szene, teile: sb.teile.length, fertig: W.heute() });
      const i = P.szenen.indexOf(sb.szene);
      sb.szene = P.szenen[(i + 1) % P.szenen.length];
      sb.teile = [];
      teil.voll = true;
    }
    W.speichere('sammelbild');
    return teil;
  }

  // --- Schatzkarte: Bericht für die Eltern ---
  function schatzBericht(eintraege, ergebnisse) {
    const t = W.heute();
    const B = W.G.P.beherrschung;
    const bereiche = {};
    ergebnisse.forEach((r, i) => {
      const e = eintraege[i];
      if (!e) return;
      const g = e.f.slice(0, 4);
      const x = bereiche[g] || (bereiche[g] = { n: 0, erster: 0 });
      x.n++;
      if (r.wert === 1) x.erster++;
    });
    const zaehle = (fach) => {
      const z = { neu: 0, vermutet: 0, ueben: 0, fast: 0, sicher: 0 };
      for (const f of W.G.k[fach].fertigkeiten) if (f.kern === true) for (const s of Object.keys(f.stufen)) z[status(Z.stand, f.id, s, t, B)]++;
      return z;
    };
    const bericht = { tag: t, nr: (Z.schatzkarten || []).length + 1, bereiche, status: { D: zaehle('D'), M: zaehle('M') } };
    Z.schatzkarten = [...(Z.schatzkarten || []), bericht];
    W.speichere('schatzkarten');
    return bericht;
  }

  return { mKapitel, schuljahrAnteil, kartenKandidaten, kartenZiel, lernwortVon, entdeckerAktiv, schatzFaellig, lerntagNr, startLeicht, kontextPlan, planHeute, tagEintrag, geschaetzteSekunden, sitzungSekunden, verbucheAntwort, zeigFertig, zeigZusatz, probeFertig, sitzungFertig, sammelTeil, schatzBericht };
}
