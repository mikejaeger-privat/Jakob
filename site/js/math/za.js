// Mathematik ZA: Zählen (Zählen bis 10 und 20, rückwärts, weiter, Nachbarzahlen, Reihen, Ordnen, Schritte, Ordnungszahlen)
import { A, sig, auswahl, fehlerbilder, streue, reihen, DINGE, TIERE, ORDNUNG_NOM, JEDEN, EINEN, menge } from './lib.js';

// --- Dinge zählen ---
function zaehlAufgabe(r, { von, bis, anordnung, antwort, raum }) {
  const n = r.int(von, bis);
  const d = r.pick(DINGE);
  const lage = anordnung === 'reihe' ? reihen(n, 10) : streue(r, n, { abstand: n > 12 ? 0.11 : 0.14 });
  const dinge = lage.map((p) => ({ bild: d[0], x: p.x, y: p.y }));
  const a = {
    frage: `Wie viele ${d[2]} sind es? Tippe ${JEDEN[d[3]]} ${d[1]} an und zähle.`,
    hinweis: `Tippe ${JEDEN[d[3]]} ${d[1]} nur einmal an. Ich zähle mit.` + (n > 10 ? ' Nach zehn zählst du weiter: elf, zwölf …' : ''),
    erklaerung: `Es sind ${menge(n, d)}.`,
    dinge, anzahl: n, antwort, zahlenfeld: raum, bilder: [d[0]],
    sig: sig(n, d[1], anordnung, Math.round(dinge[0].x * 100)),
    daten: { n, anordnung },
    fehlerbilder: fehlerbilder(n, raum,
      [n + 1, `Vielleicht hast du ${EINEN[d[3]]} ${d[1]} zweimal gezählt. Tippe ${JEDEN[d[3]]} nur einmal an.`],
      [n - 1, `${d[3] === 'der' ? 'Einer' : d[3] === 'die' ? 'Eine' : 'Eines'} fehlt noch. Schau, ob du ${JEDEN[d[3]]} ${d[1]} angetippt hast.`]),
  };
  if (antwort === 'wahl') Object.assign(a, auswahl(r, String(n), [n - 1, n + 1, n + 2].filter((x) => x >= 1 && x <= raum).map(String)));
  return A.zaehlen(a);
}

// --- Reihen mit Zahlensteinen: «?» ist ein Antwortfeld ---
const reihe = (teile) => ({ art: 'reihe', teile });

export const generatoren = {
  'M-ZA-01': {
    1: (r) => zaehlAufgabe(r, { von: 2, bis: 5, anordnung: 'reihe', antwort: 'wahl', raum: 10 }),
    2: (r) => zaehlAufgabe(r, { von: 6, bis: 10, anordnung: 'reihe', antwort: 'zahlenfeld', raum: 10 }),
    3: (r) => zaehlAufgabe(r, { von: 5, bis: 10, anordnung: 'frei', antwort: 'zahlenfeld', raum: 10 }),
  },
  'M-ZA-02': {
    1: (r) => zaehlAufgabe(r, { von: 11, bis: 15, anordnung: 'reihe', antwort: 'zahlenfeld', raum: 20 }),
    2: (r) => zaehlAufgabe(r, { von: 11, bis: 20, anordnung: 'reihe', antwort: 'zahlenfeld', raum: 20 }),
    3: (r) => zaehlAufgabe(r, { von: 11, bis: 20, anordnung: 'frei', antwort: 'zahlenfeld', raum: 20 }),
  },

  // Rückwärts zählen: die gezeigten Zahlen werden vorgesprochen, gesucht ist die nächste
  'M-ZA-03': {
    1: (r) => rueckwaerts(r, { oben: 10, zwei: false }),
    2: (r) => rueckwaerts(r, { oben: 20, zwei: false }),
    3: (r) => rueckwaerts(r, { oben: 20, zwei: true }),
  },
  'M-ZA-04': {
    1: (r) => weiter(r, { oben: 10, zwei: false }),
    2: (r) => weiter(r, { oben: 20, zwei: false }),
    3: (r) => weiter(r, { oben: 20, zwei: true }),
  },

  // Nachbarzahlen: Zahlensteine, ohne Stimme verständlich
  'M-ZA-05': {
    1: (r) => {
      const n = r.int(1, 9);
      return A.zahl({
        frage: `Welche Zahl kommt nach ${n}?`, visual: reihe([n, '?']), loesung: n + 1, bis: 10,
        hinweis: `Zähle: ${n} und dann?`, erklaerung: `Nach ${n} kommt ${n + 1}.`,
        sig: sig(n), daten: { n, art: 'nach' },
        fehlerbilder: fehlerbilder(n + 1, 10, [n - 1, `${n - 1} kommt vor ${n}. Gesucht ist die Zahl danach.`], [n, `Das ist die Zahl selbst. Welche kommt danach?`]),
      });
    },
    2: (r) => {
      const n = r.int(2, 19), vor = r.bool();
      const l = vor ? n - 1 : n + 1;
      return A.zahl({
        frage: vor ? `Welche Zahl kommt vor ${n}?` : `Welche Zahl kommt nach ${n}?`,
        visual: reihe(vor ? ['?', n] : [n, '?']), loesung: l, bis: 20,
        hinweis: vor ? `Zähle rückwärts: ${n} und dann?` : `Zähle weiter: ${n} und dann?`,
        erklaerung: vor ? `Vor ${n} kommt ${l}.` : `Nach ${n} kommt ${l}.`,
        sig: sig(n, vor), daten: { n, art: vor ? 'vor' : 'nach' },
        fehlerbilder: fehlerbilder(l, 20, [vor ? n + 1 : n - 1, vor ? `${n + 1} kommt nach ${n}. Gesucht ist die Zahl davor.` : `${n - 1} kommt vor ${n}. Gesucht ist die Zahl danach.`]),
      });
    },
    3: (r) => {
      const n = r.int(2, 19);
      return A.zahl({
        frage: `Welche Zahlen sind die Nachbarn von ${n}? Links die Zahl davor, rechts die Zahl danach.`,
        visual: reihe(['?', n, '?']), loesung: [n - 1, n + 1], bis: 20,
        hinweis: `Die Nachbarn sind eins weniger und eins mehr als ${n}.`,
        erklaerung: `Die Nachbarn von ${n} sind ${n - 1} und ${n + 1}.`,
        sig: sig(n), daten: { n, art: 'beide' },
      });
    },
  },

  // Zahlenreihe ergänzen
  'M-ZA-06': {
    1: (r) => {
      const s = r.int(1, 6), luecke = r.int(1, 4);
      const zahlen = [0, 1, 2, 3, 4].map((i) => s + i);
      const teile = zahlen.map((x, i) => (i === luecke ? '?' : x));
      return A.zahl({
        frage: 'Welche Zahl fehlt?', visual: reihe(teile), loesung: zahlen[luecke], bis: 10,
        hinweis: 'Zähle die Reihe von vorn und sprich jede Zahl mit.',
        erklaerung: `Es fehlt die ${zahlen[luecke]}: ${zahlen.join(', ')}.`,
        sig: sig(s, luecke), daten: { zahlen, luecken: [luecke], schritt: 1 },
      });
    },
    2: (r) => luecken(r, { oben: 20, rueck: false }),
    3: (r) => luecken(r, { oben: 20, rueck: true }),
  },

  // Zahlen ordnen
  'M-ZA-07': {
    1: (r) => ordnen(r, { anzahl: 3, oben: 10, getrennt: false, abwaerts: false }),
    2: (r) => ordnen(r, { anzahl: 4, oben: 20, getrennt: false, abwaerts: false }),
    3: (r) => ordnen(r, { anzahl: 5, oben: 20, getrennt: true, abwaerts: r.bool() }),
  },

  // In Schritten zählen (Erweiterung)
  'M-ZA-08': {
    1: (r) => schritte(r, { schritt: 2, oben: 20, start: r.int(1, 10), bis: 20 }),
    2: (r) => schritte(r, { schritt: 5, oben: 50, start: 5 * r.int(1, 6), bis: 100 }),
    3: (r) => schritte(r, { schritt: 10, oben: 100, start: 10 * r.int(1, 6), bis: 100 }),
  },

  // Ordnungszahlen: Tiere stehen in einer Reihe, die Reihe beginnt bei der Fahne
  'M-ZA-09': {
    1: (r) => ordnung(r, { anzahl: r.int(4, 5), stellen: ['erste', 'letzte'] }),
    2: (r) => ordnung(r, { anzahl: r.int(5, 6), stellen: [2, 3, 4, 5] }),
    3: (r) => ordnung(r, { anzahl: 10, stellen: [3, 4, 5, 6, 7, 8, 9, 10] }),
  },
};

function rueckwaerts(r, { oben, zwei }) {
  if (zwei) {
    const s = r.int(5, oben);
    const zahlen = [s, s - 1, s - 2, s - 3];
    return A.zahl({
      frage: `Zähle rückwärts ab ${s}. Welche zwei Zahlen kommen als Nächstes?`,
      sprich: `Zähle rückwärts ab ${s}: ${s} … ${s - 1} … Welche zwei Zahlen kommen als Nächstes?`,
      visual: reihe([s, s - 1, '?', '?']), loesung: [s - 2, s - 3], bis: oben,
      hinweis: `Rückwärts heisst: jedes Mal eins weniger. ${s}, ${s - 1}, …`,
      erklaerung: `Rückwärts: ${zahlen.join(', ')}.`,
      sig: sig(s), daten: { start: s, schritt: -1, gesucht: [2, 3] },
    });
  }
  const x = oben === 20 && r.bool(0.7) ? r.int(8, 17) : r.int(1, oben - 3);   // gesuchte Zahl; bis 20 meist über 10
  const gezeigt = [x + 3, x + 2, x + 1];
  return A.zahl({
    frage: 'Wir zählen rückwärts. Welche Zahl kommt als Nächstes?',
    sprich: `Wir zählen rückwärts: ${gezeigt.join(' … ')} … Welche Zahl kommt als Nächstes?`,
    visual: reihe([...gezeigt, '?']), loesung: x, bis: oben,
    hinweis: `Rückwärts heisst: jedes Mal eins weniger. Was ist eins weniger als ${x + 1}?`,
    erklaerung: `Nach ${x + 1} kommt rückwärts ${x}.`,
    sig: sig(x), daten: { start: x + 3, schritt: -1, gesucht: [3] },
    fehlerbilder: fehlerbilder(x, oben, [x + 2, `Rückwärts wird es weniger. Nach ${x + 1} kommt ${x}.`]),
  });
}

function weiter(r, { oben, zwei }) {
  if (zwei) {
    const s = r.int(1, oben - 2);
    return A.zahl({
      frage: `Zähle weiter ab ${s}. Welche zwei Zahlen kommen?`,
      visual: reihe([s, '?', '?']), loesung: [s + 1, s + 2], bis: oben,
      hinweis: `Weiterzählen heisst: jedes Mal eins mehr. ${s}, …`,
      erklaerung: `Nach ${s} kommen ${s + 1} und ${s + 2}.`,
      sig: sig(s), daten: { start: s, schritt: 1, gesucht: [1, 2] },
    });
  }
  const k = r.pick([2, 3]);
  const unten = oben === 20 ? 8 : 1;
  const s = r.int(unten, oben - k);
  const gezeigt = Array.from({ length: k }, (_, i) => s + i);
  const l = s + k;
  return A.zahl({
    frage: 'Zähle weiter. Welche Zahl kommt als Nächstes?',
    sprich: `Zähle weiter: ${gezeigt.join(' … ')} … Welche Zahl kommt als Nächstes?`,
    visual: reihe([...gezeigt, '?']), loesung: l, bis: oben,
    hinweis: `Was ist eins mehr als ${l - 1}?`,
    erklaerung: `Nach ${l - 1} kommt ${l}.`,
    sig: sig(s, k), daten: { start: s, schritt: 1, gesucht: [k] },
    fehlerbilder: fehlerbilder(l, oben, [l + 1, `Das war eine zu weit. Nach ${l - 1} kommt ${l}.`]),
  });
}

function luecken(r, { oben, rueck }) {
  const s = rueck ? r.int(6, oben) : r.int(1, oben - 5);
  const zahlen = [0, 1, 2, 3, 4, 5].map((i) => (rueck ? s - i : s + i));
  // zwei Lücken; die ersten zwei Zahlen bleiben sichtbar, damit die Richtung klar ist
  const [l1, l2] = r.sample([2, 3, 4, 5], 2).sort((a, b) => a - b);
  const teile = zahlen.map((x, i) => (i === l1 || i === l2 ? '?' : x));
  return A.zahl({
    frage: rueck ? 'Diese Reihe geht rückwärts. Welche Zahlen fehlen?' : 'Welche Zahlen fehlen?',
    visual: reihe(teile), loesung: [zahlen[l1], zahlen[l2]], bis: oben,
    hinweis: rueck ? `Die Zahlen werden jedes Mal eins kleiner: ${zahlen[0]}, ${zahlen[1]}, …` : `Die Zahlen werden jedes Mal eins grösser: ${zahlen[0]}, ${zahlen[1]}, …`,
    erklaerung: `Es fehlen ${zahlen[l1]} und ${zahlen[l2]}: ${zahlen.join(', ')}.`,
    sig: sig(s, l1, l2, rueck), daten: { zahlen, luecken: [l1, l2], schritt: rueck ? -1 : 1 },
  });
}

function ordnen(r, { anzahl, oben, getrennt, abwaerts }) {
  let zahlen;
  for (let v = 0; v < 200; v++) {
    zahlen = r.sample(Array.from({ length: oben }, (_, i) => i + 1), anzahl).sort((a, b) => a - b);
    if (!getrennt || zahlen.every((x, i) => i === 0 || x - zahlen[i - 1] > 1)) break;
  }
  const teile = (abwaerts ? zahlen.slice().reverse() : zahlen).map(String);
  return A.reihenfolge({
    frage: abwaerts ? 'Lege die Zahlen der Reihe nach. Die grösste zuerst.' : 'Lege die Zahlen der Reihe nach. Die kleinste zuerst.',
    teile, art: 'text', richtung: abwaerts ? 'ab' : 'auf',
    hinweis: abwaerts ? 'Such zuerst die grösste Zahl. Dann die nächstkleinere.' : 'Such zuerst die kleinste Zahl. Dann die nächstgrössere.',
    erklaerung: `So ist die Reihe richtig: ${teile.join(', ')}.`,
    sig: sig(...zahlen, abwaerts), daten: { zahlen, abwaerts },
  });
}

function schritte(r, { schritt, oben, start, bis }) {
  const zahlen = [0, 1, 2, 3, 4].map((i) => start + i * schritt).filter((x) => x <= oben);
  const n = zahlen.length;
  const luecke = r.int(Math.min(2, n - 1), n - 1);
  const teile = zahlen.map((x, i) => (i === luecke ? '?' : x));
  return A.zahl({
    frage: `Hier wird in ${schritt === 2 ? 'Zweier' : schritt === 5 ? 'Fünfer' : 'Zehner'}schritten gezählt. Welche Zahl fehlt?`,
    visual: reihe(teile), loesung: zahlen[luecke], bis,
    hinweis: `Jedes Mal kommen ${schritt} dazu.`,
    erklaerung: `${zahlen[luecke - 1]} und ${schritt} dazu ist ${zahlen[luecke]}.`,
    sig: sig(start, schritt, luecke), daten: { zahlen, luecken: [luecke], schritt },
    fehlerbilder: fehlerbilder(zahlen[luecke], bis, [zahlen[luecke - 1] + 1, `Hier wird nicht in Einerschritten gezählt. Jedes Mal kommen ${schritt} dazu.`]),
  });
}

function ordnung(r, { anzahl, stellen }) {
  const tiere = r.sample(TIERE, anzahl);
  const stelle = r.pick(stellen.filter((s) => typeof s === 'string' || s <= anzahl));
  const index = stelle === 'erste' ? 0 : stelle === 'letzte' ? anzahl - 1 : stelle - 1;
  const wort = typeof stelle === 'string' ? stelle : ORDNUNG_NOM[stelle];
  const elemente = tiere.map(([bild, name], i) => ({ id: 't' + i, bild, name }));
  return A.hoerenTippen({
    frage: `Die Reihe fängt bei der Fahne an. Tippe auf das ${wort} Tier.`,
    auftrag: `Tippe auf das ${wort} Tier.`,
    szene: { art: 'reihe', start: '🚩', elemente },
    loesung: ['t' + index],
    hinweis: stelle === 'letzte' ? 'Das letzte Tier ist am Ende der Reihe, am weitesten weg von der Fahne.' : `Zähle von der Fahne aus: erstes, zweites, drittes …`,
    erklaerung: `Das ${wort} Tier ist ${tiere[index][2]} ${tiere[index][1]}.`,
    bilder: tiere.map((t) => t[0]),
    sig: sig(stelle, ...tiere.map((t) => t[1])), daten: { anzahl, index, stelle },
  });
}
