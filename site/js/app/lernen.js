// Lernen in der App: verbindet den gespeicherten Zustand mit dem Kern (core/lernen.js) und speichert Änderungen.
import { Z, speichere } from './zustand.js';
import { G, K, heute } from './steuerung.js';
import { stimmeDa } from './sprache.js';
import { lernkern } from '../core/lernen.js';

// Spielbarkeit (wird aus ui/baustein.js gesetzt, damit core/ ohne Browser bleibt)
let spielbarFn = () => true;
export function setzeSpielbar(fn) { spielbarFn = fn; }

export const welt = {
  Z, get G() { return G; }, get K() { return K; },
  heute: () => heute(), stimme: () => stimmeDa(), spielbar: (f, s) => spielbarFn(f, s), speichere: (...k) => speichere(...k),
};
export const L = lernkern(welt);
export const { mKapitel, schuljahrAnteil, kartenKandidaten, kartenZiel, lernwortVon, entdeckerAktiv, schatzFaellig, kontextPlan, planHeute, geschaetzteSekunden, sitzungSekunden, verbucheAntwort, zeigFertig, zeigZusatz, probeFertig, sitzungFertig, sammelTeil, schatzBericht } = L;
