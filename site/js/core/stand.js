// Lernmodell: Stand je Fertigkeit und Stufe. Reine Funktionen auf einfachen Datenobjekten (prüfbar mit Node).
// Zahlen in parameter.json (Abschnitte «beherrschung» und «zeigRunde»), Erklärung in KONZEPT.md, Abschnitt 5.

export const schluessel = (id, s) => `${id}|${s}`;
export function teileSchluessel(k) { const i = k.lastIndexOf('|'); return [k.slice(0, i), k.slice(i + 1)]; }

export function neuerEintrag(B) {
  return {
    sw: 0, sg: B.vorsichtFalsche, // gewichtete Punkte und Gewichte (Start: gedachte falsche Antworten)
    na: 0,                        // Antworten (ohne Nachspuren)
    geuebt: 0,                    // Nachspuren und Vorlesen: zählt als geübt, nicht in den Wert
    tage: 0, letzterTag: null,    // Anzahl verschiedener Tage mit Antworten
    letzter: null,                // Tag der letzten Antwort
    erst: null,                   // Tag der ersten Antwort
    merk: B.merkdauerStart,       // Merkdauer in Tagen
    tag: null, tr: 0, tg: 0,      // Tagesbilanz für die Merkdauer
    ff: 0,                        // nicht gelöste Antworten in Folge
    vermutet: false,              // Entdeckerrunde: übersprungen, noch nicht selbst geübt
    zr: null,                     // Zeig-was-du-kannst-Runde bestanden am (Tag)
    zrV: null, zrN: 0, zrNa: 0,   // letzter Versuch, Anzahl Versuche, Antworten beim letzten Versuch
  };
}

export function hole(stand, id, s, B) {
  const k = schluessel(id, s);
  if (!stand[k]) stand[k] = neuerEintrag(B);
  return stand[k];
}
export const lies = (stand, id, s) => stand[schluessel(id, s)] || null;

function tagAbschliessen(e, B) {
  if (e.tag === null || e.tg < 2) return;
  const q = e.tr / e.tg;
  if (q >= B.guterTag) e.merk = Math.min(B.merkdauerMax, e.merk * 2);
  else if (q < B.schwacherTag) e.merk = Math.max(B.merkdauerMin, e.merk / 2);
}

// wert: 1 (richtig), 0.5 (nach Hinweis), 0 (nicht gelöst) oder 'geuebt' (Nachspuren, Vorlesen)
export function verbuche(stand, id, s, wert, heute, B) {
  const e = hole(stand, id, s, B);
  if (e.erst === null) e.erst = heute;
  if (wert === 'geuebt') {
    e.geuebt++;
    if (e.letzterTag !== heute) { e.tage++; e.letzterTag = heute; }
    e.letzter = heute;
    return e;
  }
  if (e.tag !== heute) { tagAbschliessen(e, B); e.tag = heute; e.tr = 0; e.tg = 0; }
  const z = Math.pow(0.5, 1 / B.halbierungAntworten);
  e.sw = e.sw * z + wert;
  e.sg = e.sg * z + 1;
  e.na++; e.tr += wert; e.tg++;
  if (e.letzterTag !== heute) { e.tage++; e.letzterTag = heute; }
  e.ff = wert === 0 ? e.ff + 1 : 0;
  e.letzter = heute;
  if (e.na >= B.minAntwortenNeu) e.vermutet = false;
  return e;
}

export const wert = (e) => (e && e.sg > 0 ? e.sw / e.sg : 0);

// Wert mit Vergessen: nach drei Merkdauern ohne Übung noch die Hälfte
export function wertJetzt(e, heute, B) {
  if (!e || e.letzter === null) return e?.vermutet ? wert(e) : 0;
  const t = Math.max(0, heute - e.letzter);
  return wert(e) * Math.pow(0.5, t / (B.vergessenFaktor * e.merk));
}

// Nur Nachspuren und Vorlesen: Status aus der Anzahl Übungen (keine Prüfung der Handschrift, kein Mikrofon)
const nurGeuebt = (e) => e && e.na === 0 && e.geuebt > 0;

// Sicher: Zeig-Runde bestanden und der Wert ist seither nicht unter «fast sicher» gefallen
export function istSicherEintrag(e, heute, B) {
  if (!e || e.zr === null) return false;
  return e.na === 0 || wertJetzt(e, heute, B) >= B.schwelleFastSicher;
}
// Eine sichere höhere Stufe schliesst die tieferen ein
export function istSicher(stand, id, s, heute, B, max = 3) {
  for (let m = Number(s); m <= max; m++) if (istSicherEintrag(lies(stand, id, m), heute, B)) return true;
  return false;
}

// 'neu' | 'vermutet' | 'ueben' | 'fast' | 'sicher'
export function status(stand, id, s, heute, B) {
  if (istSicher(stand, id, s, heute, B)) return 'sicher';
  const e = lies(stand, id, s);
  if (!e) return 'neu';
  if (nurGeuebt(e)) return e.geuebt >= 2 * B.minAntwortenNeu ? 'fast' : e.geuebt >= B.minAntwortenNeu ? 'ueben' : 'neu';
  if (e.na < B.minAntwortenNeu) return e.vermutet ? 'vermutet' : 'neu';
  if (e.zr !== null) return 'fast'; // war sicher, Wert gesunken: wieder üben
  return wertJetzt(e, heute, B) >= B.schwelleFastSicher ? 'fast' : 'ueben';
}
// Gilt als «kann man darauf aufbauen» (Voraussetzung erfüllt)
export const traegt = (st) => st === 'fast' || st === 'sicher' || st === 'vermutet';

export function faellig(e, heute) {
  return !!e && e.letzter !== null && heute - e.letzter >= e.merk;
}

// Bereit für «Zeig, was du kannst»?
export function zeigBereit(e, heute, B, ZR) {
  if (!e) return false;
  if (e.vermutet && e.zrN === 0 && e.zr === null) return true; // Vermutung aus der Entdeckerrunde bestätigen
  if (e.na === 0) return false;
  if (e.zr !== null && wertJetzt(e, heute, B) >= B.schwelleFastSicher) return false; // schon sicher
  if (e.zrV !== null && (heute - e.zrV < ZR.sperreTageNachVersuch || e.na - e.zrNa < ZR.uebenNachVersuch)) return false;
  return wertJetzt(e, heute, B) >= B.schwelleZeigBereit && e.na >= ZR.minAntworten && e.tage >= ZR.minTage;
}

// Ergebnis der Zeig-Runde (die einzelnen Antworten sind schon verbucht): richtig von 4, dazu die Zusatzaufgabe
export function zeigBestanden(richtig, zusatzRichtig, ZR) {
  return richtig >= ZR.bestehenGanz || (richtig >= ZR.bestehenMitZusatz && zusatzRichtig === true);
}
export function zeigErgebnis(stand, id, s, bestanden, heute, B) {
  const e = hole(stand, id, s, B);
  e.zrV = heute; e.zrN++; e.zrNa = e.na;
  if (bestanden) { e.zr = heute; e.ff = 0; }
  return e;
}

// Entdeckerrunde: übersprungene Stufe startet mit einem vermuteten Wert
// (auch wenn schon die zwei Aufgaben der Probe verbucht sind: der Wert wird mindestens der Startwert)
export function vermute(stand, id, s, startWert, heute, B) {
  const e = hole(stand, id, s, B);
  if (e.zr !== null || e.na >= B.minAntwortenNeu) return e;
  e.sw = Math.max(e.sw, startWert * e.sg); e.vermutet = true; e.erst = e.erst ?? heute;
  return e;
}
