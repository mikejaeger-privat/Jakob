// Bausteine für die Mathematik-Generatoren (Zyklus 1). Regeln: tools/SPEC-MATHE.md, Typen: tools/SPEC-AUFGABEN.md.
// Generatoren rufen nie Math.random auf: Gleicher Startwert ergibt dieselbe Aufgabe.

export const PLUS = '+', MINUS = '−', GLEICH = '=', KLEINER = '<', GROESSER = '>', LUECKE = '_';

// Namen für Rechengeschichten: kurz, für die Gerätestimme gut sprechbar. Keine Namen der Familie.
export const NAMEN = [
  ['Lena', 'sie'], ['Noah', 'er'], ['Mia', 'sie'], ['Luca', 'er'], ['Nora', 'sie'], ['Tim', 'er'], ['Sara', 'sie'], ['Levin', 'er'],
  ['Anna', 'sie'], ['Finn', 'er'], ['Lea', 'sie'], ['Nico', 'er'], ['Zoe', 'sie'], ['Jan', 'er'], ['Lia', 'sie'], ['Elia', 'er'],
  ['Ronja', 'sie'], ['Matteo', 'er'], ['Emma', 'sie'], ['Leon', 'er'],
];

// Zählbare Dinge (Bild aus dem Wortlexikon, eindeutig, zeigt genau ein Ding): [Bild, Einzahl, Mehrzahl, Artikel]
export const DINGE = [
  ['🍎', 'Apfel', 'Äpfel', 'der'], ['🍐', 'Birne', 'Birnen', 'die'], ['🍓', 'Erdbeere', 'Erdbeeren', 'die'], ['🍌', 'Banane', 'Bananen', 'die'],
  ['🍋', 'Zitrone', 'Zitronen', 'die'], ['🍅', 'Tomate', 'Tomaten', 'die'], ['🥨', 'Brezel', 'Brezeln', 'die'], ['🥚', 'Ei', 'Eier', 'das'],
  ['🍄', 'Pilz', 'Pilze', 'der'], ['⭐', 'Stern', 'Sterne', 'der'], ['🌼', 'Blume', 'Blumen', 'die'], ['🎈', 'Ballon', 'Ballone', 'der'],
  ['🚗', 'Auto', 'Autos', 'das'], ['🚲', 'Velo', 'Velos', 'das'], ['🐟', 'Fisch', 'Fische', 'der'], ['🐦', 'Vogel', 'Vögel', 'der'],
  ['🦆', 'Ente', 'Enten', 'die'], ['🐌', 'Schnecke', 'Schnecken', 'die'], ['🐝', 'Biene', 'Bienen', 'die'], ['🦋', 'Schmetterling', 'Schmetterlinge', 'der'],
  ['🐑', 'Schaf', 'Schafe', 'das'], ['🐔', 'Huhn', 'Hühner', 'das'], ['🐸', 'Frosch', 'Frösche', 'der'], ['🍁', 'Blatt', 'Blätter', 'das'],
];
// Tiere für Reihen (Ordnungszahlen, Lage): gut unterscheidbar, Name sicher
export const TIERE = [
  ['🐶', 'Hund', 'der'], ['🐱', 'Katze', 'die'], ['🐭', 'Maus', 'die'], ['🐇', 'Hase', 'der'], ['🦊', 'Fuchs', 'der'], ['🐻', 'Bär', 'der'],
  ['🐷', 'Schwein', 'das'], ['🐮', 'Kuh', 'die'], ['🐸', 'Frosch', 'der'], ['🦉', 'Eule', 'die'], ['🐘', 'Elefant', 'der'], ['🦁', 'Löwe', 'der'],
  ['🐴', 'Pferd', 'das'], ['🐑', 'Schaf', 'das'], ['🐔', 'Huhn', 'das'], ['🦆', 'Ente', 'die'],
];
// Artikel im Akkusativ: «Tippe jeden Apfel an», «einen Apfel»
export const JEDEN = { der: 'jeden', die: 'jede', das: 'jedes' };
export const EINEN = { der: 'einen', die: 'eine', das: 'ein' };
// Ordnungszahlen im Akkusativ männlich/neutral nach «Tippe auf den …» bzw. Nominativ nach «Wer ist der …»
export const ORDNUNG_AKK = ['', 'ersten', 'zweiten', 'dritten', 'vierten', 'fünften', 'sechsten', 'siebten', 'achten', 'neunten', 'zehnten'];
export const ORDNUNG_NOM = ['', 'erste', 'zweite', 'dritte', 'vierte', 'fünfte', 'sechste', 'siebte', 'achte', 'neunte', 'zehnte'];
export const ZAHLWORT = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig'];

// Mehrzahl oder Einzahl passend zur Anzahl: menge(3, ding) -> «3 Äpfel», menge(1, ding) -> «1 Apfel»
export const menge = (n, d) => `${n} ${n === 1 ? d[1] : d[2]}`;
export const zahlwort = (n) => ZAHLWORT[n] ?? String(n);

export { A, sig, auswahl, fehlerbilder } from '../core/aufgabe.js';

// Ablenker für eine Zahl: eins daneben, zwei daneben, im Zahlenraum, ohne die Lösung
export function nachbarn(r, x, von, bis, anzahl = 2) {
  const kand = [x - 1, x + 1, x - 2, x + 2, x - 10, x + 10].filter((y) => y >= von && y <= bis && y !== x);
  return r.shuffle(kand.slice(0, 4)).slice(0, anzahl);
}

// Dinge an zufälligen, nicht überlappenden Stellen (0 bis 1) für «zaehlen» und Bildmengen
export function streue(r, n, { abstand = 0.13, rand = 0.08 } = {}) {
  const punkte = [];
  for (let versuch = 0; punkte.length < n && versuch < 4000; versuch++) {
    const p = { x: rand + r.next() * (1 - 2 * rand), y: rand + r.next() * (1 - 2 * rand) };
    const mindest = versuch > 2500 ? abstand * 0.75 : abstand;
    if (punkte.every((q) => Math.hypot(q.x - p.x, (q.y - p.y) * 0.7) >= mindest)) punkte.push(p);
  }
  if (punkte.length < n) throw new Error('Generator: zu wenig Platz für ' + n + ' Dinge');
  return punkte.map((p) => ({ x: Math.round(p.x * 1000) / 1000, y: Math.round(p.y * 1000) / 1000 }));
}
// Dinge in Reihen zu je höchstens «proReihe», mittig, Fünfer gut sichtbar (Lücke nach jedem fünften)
export function reihen(n, proReihe = 10) {
  const aus = [];
  const spalten = Math.min(n, proReihe), zeilen = Math.ceil(n / proReihe);
  const schritt = 0.084, luecke = spalten > 5 ? 0.05 : 0;
  const x0 = 0.5 - ((spalten - 1) * schritt + luecke) / 2;
  for (let i = 0; i < n; i++) {
    const zeile = Math.floor(i / proReihe), spalte = i % proReihe;
    const x = x0 + spalte * schritt + (spalte >= 5 ? luecke : 0);
    const y = zeilen === 1 ? 0.5 : 0.3 + (zeile * 0.4) / (zeilen - 1);
    aus.push({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 });
  }
  return aus;
}

// Alle Zahlen von a bis b (inklusive)
export const bereich = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
// Rechnung als Zeige-Text mit Leerzeichen zwischen den Teilen: rechnung(3, PLUS, 4, GLEICH, LUECKE) -> «3 + 4 = _»
export const rechnung = (...teile) => teile.join(' ');
