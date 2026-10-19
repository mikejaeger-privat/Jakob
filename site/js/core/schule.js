// Was in der Schule gerade dran ist: Angaben der Lehrperson (Elternbrief zu einem Abschnitt, z. B. einem Quintal,
// in lehrmittel.json unter «schule») und sonst die Schätzung aus der Jahresplanung und dem Datum.
// Rein, ohne Browser; App, Simulation und Tests benutzen dieselben Funktionen. Erklärung in KONZEPT.md, Abschnitt 6.
import { tagNr } from './util.js';

export function abschnitte(lm) {
  return (lm.schule?.abschnitte || []).map((a) => ({ ...a, vonT: tagNr(a.von), bisT: tagNr(a.bis) }));
}
// Abschnitt, in dem der Tag liegt (oder null)
export const abschnittAm = (lm, t) => abschnitte(lm).find((a) => t >= a.vonT && t <= a.bisT) || null;

// Deutsch: Fertigkeiten des laufenden Abschnitts (Reihenfolge der Lehrperson bzw. der App) …
export const deutschJetzt = (lm, t) => abschnittAm(lm, t)?.D?.fertigkeiten || [];
// … und aller Abschnitte, die schon begonnen haben (gelten als «schon dran»)
export const deutschBegonnen = (lm, t) => [...new Set(abschnitte(lm).filter((a) => a.vonT <= t).flatMap((a) => a.D?.fertigkeiten || []))];

const schulMonat = (x) => (x >= 8 ? x - 8 : x + 4); // August = 0 … Juli = 11

// Schätzung aus der Jahresplanung: Kapitel des Monats, über den Monat verteilt
export function kapitelNachDatum(kap, t) {
  const d = new Date(t * 86400000);
  const m = d.getUTCMonth() + 1;
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

// Mathematik-Kapitel (Index in lehrmittel.faecher.M.kapitel), das laut Schule am Tag t dran ist, ohne Vorgabe der Eltern.
// Im Abschnitt: die genannten Kapitel gleichmässig über die Tage verteilt (Annahme). Danach mindestens das letzte
// Kapitel des Abschnitts, damit die Schätzung nach dem Brief nicht zurückfällt.
export function kapitelAm(lm, t) {
  const kap = lm.faecher.M.kapitel;
  const index = (name) => kap.findIndex((k) => k.name === name);
  const a = abschnittAm(lm, t);
  const liste = (a?.M?.kapitel || []).map(index).filter((i) => i >= 0);
  if (liste.length) {
    const anteil = (t - a.vonT) / (a.bisT - a.vonT + 1);
    return liste[Math.min(liste.length - 1, Math.floor(anteil * liste.length))];
  }
  let min = -1;
  for (const x of abschnitte(lm)) if (x.bisT < t) for (const n of x.M?.kapitel || []) min = Math.max(min, index(n));
  return Math.max(kapitelNachDatum(kap, t), min);
}
