// Mathematik GR: Grössen und Daten (Längen, Münzen, Geldbeträge, Uhr, Gewichte, Strichliste und Bilddiagramm)
import { A, sig, auswahl, fehlerbilder, DINGE, ZAHLWORT, MINUS } from './lib.js';

const FARBEN = ['rot', 'blau', 'gelb', 'gruen', 'orange', 'violett'];
const FARBWORT = { rot: 'rote', blau: 'blaue', gelb: 'gelbe', gruen: 'grüne', orange: 'orange', violett: 'violette' };
const NOM = { der: 'Der', die: 'Die', das: 'Das' };
const dativMehr = (p) => (/[ns]$/.test(p) ? p : p + 'n');   // «mit den Äpfeln»

// --- Längen ---
const stab = (laenge, farbe, einheit = 'kaestchen') => ({ art: 'laengen', staebe: [{ laenge, farbe }], einheit });
// n verschiedene Längen zwischen von und bis, je mindestens 2 auseinander
function laengen(r, n, von, bis) {
  for (let v = 0; v < 200; v++) {
    const l = r.sample(Array.from({ length: bis - von + 1 }, (_, i) => von + i), n).sort((a, b) => a - b);
    if (l.every((x, i) => i === 0 || x - l[i - 1] >= 2)) return r.shuffle(l);
  }
  return null;
}
function laengenStufe1(r, ctx) {
  // Ohne Stimme nur «gleich lang» (Vorlage oben, gleiche Länge suchen): das ist ohne Ton verständlich
  const art = ctx.stimme === false ? 'gleich' : r.pick(['laengste', 'kuerzeste', 'gleich']);
  const farben = r.sample(FARBEN, 4);
  if (art === 'gleich') {
    const l = laengen(r, 3, 2, 10);
    const ziel = l[0];
    const { optionen, richtig } = auswahl(r, { visual: stab(ziel, farben[1]) }, [{ visual: stab(l[1], farben[2]) }, { visual: stab(l[2], farben[3]) }], 3);
    return A.wahlBild({
      frage: `Welcher Stab ist gleich lang wie der ${FARBWORT[farben[0]]} Stab oben?`,
      visual: stab(ziel, farben[0]), optionen, richtig,
      hinweis: 'Zähle die Kästchen beim Stab oben. Such unten einen Stab mit gleich vielen Kästchen.',
      erklaerung: `Dieser Stab ist gleich lang: Beide sind ${ziel} Kästchen lang.`,
      sig: sig(art, ...l, ...farben), daten: { art, ziel, laengen: optionen.map((o) => o.visual.staebe[0].laenge) },
    });
  }
  const l = laengen(r, 3, 2, 10);
  const ziel = art === 'laengste' ? Math.max(...l) : Math.min(...l);
  const karten = l.map((x, i) => ({ visual: stab(x, farben[i]) }));
  const zk = karten[l.indexOf(ziel)];
  const { optionen, richtig } = auswahl(r, zk, karten.filter((k) => k !== zk), 3);
  return A.wahlBild({
    frage: art === 'laengste' ? 'Tippe auf den längsten Stab.' : 'Tippe auf den kürzesten Stab.',
    optionen, richtig,
    hinweis: art === 'laengste' ? 'Der längste Stab hat die meisten Kästchen.' : 'Der kürzeste Stab hat die wenigsten Kästchen.',
    erklaerung: art === 'laengste' ? `Dieser Stab ist am längsten. Er ist ${ziel} Kästchen lang.` : `Dieser Stab ist am kürzesten. Er ist ${ziel} Kästchen lang.`,
    sig: sig(art, ...l, ...farben.slice(0, 3)), daten: { art, ziel, laengen: optionen.map((o) => o.visual.staebe[0].laenge) },
  });
}
function laengenStufe2(r) {
  const l = r.int(3, 18), farbe = r.pick(FARBEN);
  return A.zahl({
    frage: 'Wie viele Kästchen lang ist der Stab?',
    visual: stab(l, farbe), loesung: l, bis: 20,
    hinweis: 'Zähle die Kästchen unter dem Stab, eines nach dem anderen. Nicht die Striche zählen.',
    erklaerung: `Der Stab ist ${l} Kästchen lang.`,
    sig: sig(l, farbe), daten: { laenge: l, einheit: 'kaestchen' },
    fehlerbilder: fehlerbilder(l, 20, [l + 1, 'Hast du die Striche gezählt? Zähle die Kästchen, also die Felder dazwischen.'], [l - 1, 'Eines fehlt. Zähle nochmals bis zum Ende vom Stab.']),
  });
}
function laengenStufe3(r) {
  const l = r.int(2, 20), farbe = r.pick(FARBEN);
  return A.zahl({
    frage: 'Wie lang ist der Stab? Lies am Massstab ab.',
    visual: stab(l, farbe, 'cm'), loesung: l, bis: 20, einheit: 'cm',
    hinweis: 'Der Stab beginnt bei 0. Schau, bei welcher Zahl er aufhört.',
    erklaerung: `Der Stab hört bei ${l} auf. Er ist ${l} Zentimeter lang.`,
    sig: sig(l, farbe), daten: { laenge: l, einheit: 'cm' },
    fehlerbilder: fehlerbilder(l, 20, [l + 1, 'Der Massstab beginnt bei 0, nicht bei 1. Lies dort ab, wo der Stab aufhört.']),
  });
}

// --- Münzen und Geldscheine (Werte in Rappen) ---
const muenze = (wert) => ({ wert, art: 'muenze' });
const schein = (wert) => ({ wert, art: 'note' });
const geldBild = (stuecke) => ({ art: 'geld', stuecke });
const wertText = (w) => (w >= 100 ? `${w / 100} Franken` : `${w} Rappen`);

function muenzenErkennen(r, werte) {
  const ziel = r.pick(werte);
  const falsche = r.shuffle(werte.filter((w) => w !== ziel)).slice(0, 2);
  const { optionen, richtig } = auswahl(r, { visual: geldBild([muenze(ziel)]) }, falsche.map((w) => ({ visual: geldBild([muenze(w)]) })), 3);
  return A.wahlBild({
    frage: `Tippe auf die Münze mit ${wertText(ziel)}.`,
    optionen, richtig,
    hinweis: 'Schau genau, welche Zahl auf jeder Münze steht.',
    erklaerung: `Das ist die Münze mit ${wertText(ziel)}.`,
    sig: sig(ziel, ...optionen.map((o) => o.visual.stuecke[0].wert)), daten: { ziel },
  });
}
function muenzenOrdnen(r) {
  const werte = r.sample([5, 10, 20, 50, 100, 200, 500], r.pick([3, 4])).sort((a, b) => a - b);
  const ab = r.bool(0.3);
  const reihe = ab ? werte.slice().reverse() : werte;
  return A.reihenfolge({
    frage: ab ? 'Lege die Münzen der Reihe nach. Die Münze mit dem grössten Wert zuerst.' : 'Lege die Münzen der Reihe nach. Die Münze mit dem kleinsten Wert zuerst.',
    teile: reihe.map((w) => ({ visual: geldBild([muenze(w)]) })), art: 'visual', richtung: ab ? 'ab' : 'auf',
    hinweis: 'Rappen sind weniger wert als Franken. Ein Franken sind 100 Rappen.',
    erklaerung: `So ist es richtig: ${reihe.map(wertText).join(', ')}.`,
    sig: sig(...reihe), daten: { werte: reihe, ab },
  });
}
// Münzen, deren Summe zwischen von und bis liegt (Franken-Münzen 1, 2, 5 Fr.)
function frankenMuenzen(r, anzahlVon, anzahlBis, summeVon, summeBis) {
  for (let v = 0; v < 300; v++) {
    const n = r.int(anzahlVon, anzahlBis);
    const st = Array.from({ length: n }, () => r.pick([100, 200, 500]));
    const s = st.reduce((a, b) => a + b, 0) / 100;
    if (s >= summeVon && s <= summeBis) return st.sort((a, b) => b - a);
  }
  return null;
}
function geldZaehlen1(r) {
  const st = frankenMuenzen(r, 2, 4, 3, 10);
  const summe = st.reduce((a, b) => a + b, 0) / 100;
  return A.zahl({
    frage: 'Wie viele Franken sind das zusammen?',
    visual: geldBild(st.map(muenze)), loesung: summe, bis: 10, einheit: 'Fr.',
    hinweis: 'Beginne bei der grössten Münze und zähle die anderen dazu.',
    erklaerung: `${st.map((w) => w / 100).join(' und ')} Franken sind zusammen ${summe} Franken.`,
    sig: sig(...st), daten: { stuecke: st },
    fehlerbilder: fehlerbilder(summe, 10, [st.length, 'Du hast die Münzen gezählt. Jede Münze ist so viele Franken wert, wie draufsteht.']),
  });
}
function geldZaehlen2(r) {
  let st;
  if (r.bool(0.1)) st = [schein(2000)];
  else if (r.bool(0.1)) st = [schein(1000), schein(1000)];
  else {
    const m = frankenMuenzen(r, 1, 3, 1, 10);
    st = [schein(1000), ...m.map(muenze)];
  }
  const summe = st.reduce((a, b) => a + b.wert, 0) / 100;
  const kurz = st.map((x) => x.wert / 100);
  return A.zahl({
    frage: 'Wie viele Franken sind das zusammen?',
    visual: geldBild(st), loesung: summe, bis: 20, einheit: 'Fr.',
    hinweis: st.length > 1 ? 'Beginne beim Geldschein und zähle die Münzen dazu.' : 'Schau, welche Zahl auf dem Geldschein steht.',
    erklaerung: st.length > 1 ? `${kurz.join(' und ')} Franken sind zusammen ${summe} Franken.` : `Das ist ein Geldschein mit ${summe} Franken.`,
    sig: sig(...st.map((x) => x.art + x.wert)), daten: { stuecke: st.map((x) => x.wert) },
    fehlerbilder: fehlerbilder(summe, 20, [st.length, 'Du hast die Stücke gezählt. Jedes ist so viele Franken wert, wie draufsteht.']),
  });
}
function geldLegen(r) {
  const fr = r.int(3, 20);
  // Zerlegung als Beispiel für die Erklärung: grösste Stücke zuerst
  const zerlegung = [];
  let rest = fr * 100;
  for (const w of [2000, 1000, 500, 200, 100]) while (rest >= w) { zerlegung.push(w); rest -= w; }
  return A.mengeLegen({
    frage: `Lege ${fr} Franken.`,
    feld: 'muenzen', muenzen: [100, 200, 500, 1000, 2000], ziel: fr * 100,
    hinweis: 'Nimm zuerst das grösste Stück, das noch passt. Dann das nächste.',
    erklaerung: zerlegung.length === 1
      ? `${fr} Franken sind zum Beispiel ${fr >= 10 ? 'ein Geldschein' : 'eine Münze'} mit ${fr} Franken.`
      : `${fr} Franken sind zum Beispiel ${zerlegung.map((w) => w / 100).join(' und ')} Franken.`,
    sig: sig(fr), daten: { franken: fr, zerlegung },
  });
}

// --- Uhr ---
const uhr = (h, m) => ({ art: 'uhr', h, m });
const plus1 = (h) => (h % 12) + 1;
const minus1 = (h) => ((h + 10) % 12) + 1;
function uhrVoll(r, ctx) {
  const h = r.int(1, 12);
  if (ctx.stimme !== false && r.bool(0.3)) {
    // Welche Uhr zeigt …? (braucht die Stimme)
    const falsche = r.shuffle([plus1(h), minus1(h), plus1(plus1(h)), (h + 5) % 12 + 1]).filter((x) => x !== h);
    const { optionen, richtig } = auswahl(r, { visual: uhr(h, 0) }, falsche.map((x) => ({ visual: uhr(x, 0) })), 3);
    return A.wahlBild({
      frage: `Welche Uhr zeigt ${h} Uhr?`, optionen, richtig,
      hinweis: `Bei ${h} Uhr zeigt der lange Zeiger auf die 12 und der kurze auf die ${h}.`,
      erklaerung: `Diese Uhr zeigt ${h} Uhr: Der kurze Zeiger zeigt auf die ${h}, der lange auf die 12.`,
      sig: sig('welche', h, ...optionen.map((o) => o.visual.h)), daten: { h, m: 0, art: 'welche' },
    });
  }
  const falsche = h === 12 ? [11, 1] : r.shuffle([12, r.pick([plus1(h), minus1(h)])]);
  const { optionen, richtig } = auswahl(r, { text: String(h) }, falsche.map((x) => ({ text: String(x) })), 3);
  return A.wahlBild({
    frage: 'Wie viel Uhr ist es?', visual: uhr(h, 0), optionen, richtig,
    hinweis: 'Der kurze Zeiger zeigt die Stunde.',
    erklaerung: `Es ist ${h} Uhr. Der kurze Zeiger zeigt auf die ${h}, der lange auf die 12.`,
    sig: sig('lies', h, ...optionen.map((o) => o.text)), daten: { h, m: 0, art: 'lies' },
    fehlerbilder: h === 12 ? [] : fehlerbilder(h, 20, [12, 'Der lange Zeiger zeigt auf die 12. Die Stunde zeigt der kurze Zeiger.']).map((f) => ({ eingabe: JSON.stringify({ text: f.eingabe }), text: f.text })),
  });
}
function uhrHalb(r, ctx) {
  if (ctx.stimme === false) return null;   // «halb 8» lässt sich nur hören
  const h = r.int(1, 12);   // kurzer Zeiger zwischen h und h + 1: «halb (h + 1)»
  const halbVon = plus1(h);
  const erkl = `Es ist halb ${ZAHLWORT[halbVon]}. Der kurze Zeiger steht zwischen ${h} und ${halbVon}, der lange zeigt auf die 6.`;
  if (r.bool(0.5)) {
    const { optionen, richtig } = auswahl(r, { visual: uhr(h, 30) }, [{ visual: uhr(halbVon, 30) }, { visual: uhr(halbVon, 0) }], 3);
    return A.wahlBild({
      frage: `Welche Uhr zeigt halb ${halbVon}?`, optionen, richtig,
      hinweis: `Bei «halb» zeigt der lange Zeiger auf die 6. Halb ${halbVon} ist eine halbe Stunde vor ${halbVon} Uhr.`,
      erklaerung: erkl,
      sig: sig('welche', h, ...optionen.map((o) => o.visual.h + ':' + o.visual.m)), daten: { h, m: 30, art: 'welche' },
    });
  }
  const falsche = [h, 6, plus1(halbVon)].filter((x) => x !== halbVon);
  const { optionen, richtig } = auswahl(r, { text: String(halbVon) }, falsche.map((x) => ({ text: String(x) })), 3);
  return A.wahlBild({
    frage: 'Es ist halb … Welche Zahl gehört dazu?', sprich: 'Es ist halb … ? Welche Zahl gehört dazu?',
    visual: uhr(h, 30), optionen, richtig,
    hinweis: 'Schau, zwischen welchen Zahlen der kurze Zeiger steht. Bei «halb» sagt man die Zahl, die als Nächstes kommt.',
    erklaerung: erkl,
    sig: sig('lies', h, ...optionen.map((o) => o.text)), daten: { h, m: 30, art: 'lies' },
    fehlerbilder: [
      ...(h !== halbVon ? [{ eingabe: JSON.stringify({ text: String(h) }), text: `Der kurze Zeiger ist schon über die ${h} hinaus. Halb heisst: eine halbe Stunde vor der nächsten Zahl.` }] : []),
      ...(halbVon !== 6 && h !== 6 ? [{ eingabe: JSON.stringify({ text: '6' }), text: 'Auf die 6 zeigt der lange Zeiger. Schau auf den kurzen Zeiger.' }] : []),
    ],
  });
}
// Tagesablauf: ein Bild für den Morgen, eines für den Mittag, eines für den Abend
const MORGEN = [['⏰', 'aufstehen'], ['🌅', 'die Sonne geht auf'], ['🐓', 'der Hahn kräht'], ['🥣', 'Frühstück']];
const MITTAG = [['☀️', 'die Sonne steht hoch am Himmel'], ['🍝', 'Mittagessen']];
const ABEND = [['🌙', 'der Mond scheint'], ['🛌', 'schlafen']];
function tagesablauf(r) {
  const teile = [r.pick(MORGEN), r.pick(MITTAG), r.pick(ABEND)].map(([bild, wort]) => ({ bild, wort }));
  return A.reihenfolge({
    frage: 'Was kommt am Morgen, was am Mittag, was am Abend? Lege die Bilder der Reihe nach.',
    teile, art: 'bild', richtung: 'auf',
    hinweis: 'Was machst du am Morgen zuerst? Was am Abend zuletzt?',
    erklaerung: `Am Morgen: ${teile[0].wort}. Am Mittag: ${teile[1].wort}. Am Abend: ${teile[2].wort}.`,
    bilder: teile.map((t) => t.bild),
    sig: sig(...teile.map((t) => t.bild)), daten: { teile: teile.map((t) => t.bild) },
  });
}

// --- Gewichte (Waage: neigung ist die Seite, die tiefer hängt, also die schwerere) ---
const SCHWER = [['🐘', 'Elefant', 'der'], ['🚗', 'Auto', 'das'], ['🐮', 'Kuh', 'die'], ['🐴', 'Pferd', 'das'], ['🚌', 'Bus', 'der'], ['🐻', 'Bär', 'der']];
const LEICHT = [['🐭', 'Maus', 'die'], ['🎈', 'Ballon', 'der'], ['🐝', 'Biene', 'die'], ['🦋', 'Schmetterling', 'der'], ['🍓', 'Erdbeere', 'die'], ['🐌', 'Schnecke', 'die']];
// ähnlich grosse Dinge: Welches schwerer ist, zeigt nur die Waage
const AEHNLICH = [['🍎', 'Apfel', 'der'], ['🍐', 'Birne', 'die'], ['🍋', 'Zitrone', 'die'], ['🍅', 'Tomate', 'die'], ['🥚', 'Ei', 'das'], ['🥨', 'Brezel', 'die'], ['🍌', 'Banane', 'die']];
const karte = (d) => ({ bild: d[0], wort: d[1] });
const als = (d) => `${d[2] === 'die' ? 'die' : d[2] === 'das' ? 'das' : 'der'} ${d[1]}`;

function gewichtStufe1(r) {
  const s = r.pick(SCHWER), l = r.pick(LEICHT);
  const schwerer = r.bool();
  const ziel = schwerer ? s : l;
  const { optionen, richtig } = auswahl(r, karte(ziel), [karte(schwerer ? l : s)], 2);
  return A.wahlBild({
    frage: schwerer ? 'Was ist schwerer?' : 'Was ist leichter?', optionen, richtig,
    hinweis: 'Stell dir vor, du müsstest beides hochheben.',
    erklaerung: schwerer ? `${NOM[s[2]]} ${s[1]} ist viel schwerer als ${als(l)}.` : `${NOM[l[2]]} ${l[1]} ist viel leichter als ${als(s)}.`,
    bilder: [s[0], l[0]],
    sig: sig(s[1], l[1], schwerer, richtig), daten: { schwer: s[1], leicht: l[1], schwerer },
  });
}
function gewichtStufe2(r) {
  const [a, b] = r.sample(AEHNLICH, 2);
  const neigung = r.pick(['links', 'rechts', 'links', 'rechts', 'gleich']);
  const frageSchwerer = r.bool();
  const gleich = neigung === 'gleich';
  const schwer = neigung === 'links' ? a : b, leicht = neigung === 'links' ? b : a;
  const ziel = gleich ? { text: '=' } : karte(frageSchwerer ? schwer : leicht);
  const alle = [karte(a), karte(b), { text: '=' }];
  const { optionen, richtig } = auswahl(r, ziel, alle.filter((o) => JSON.stringify(o) !== JSON.stringify(ziel)), 3);
  return A.wahlBild({
    frage: `${frageSchwerer ? 'Was ist schwerer?' : 'Was ist leichter?'} Schau die Waage an. Wenn beide gleich schwer sind, tippe auf das Gleichzeichen.`,
    visual: { art: 'waage', links: a[0], rechts: b[0], neigung }, optionen, richtig,
    hinweis: 'Die Seite, die tiefer hängt, ist schwerer. Hängen beide gleich hoch, sind sie gleich schwer.',
    erklaerung: gleich ? `Die Waage hängt gerade. ${NOM[a[2]]} ${a[1]} und ${als(b)} sind gleich schwer.`
      : `Der tiefere Teller ist schwerer: ${NOM[schwer[2]]} ${schwer[1]} ist schwerer als ${als(leicht)}.`,
    bilder: [a[0], b[0]],
    sig: sig(a[1], b[1], neigung, frageSchwerer), daten: { links: a[1], rechts: b[1], neigung, frageSchwerer },
  });
}
function gewichtStufe3(r) {
  const [l, m, s] = r.sample(AEHNLICH, 3);   // leicht < mittel < schwer
  const wiege = (x, y) => (r.bool() ? { links: x[0], rechts: y[0], neigung: 'rechts' } : { links: y[0], rechts: x[0], neigung: 'links' });   // y ist schwerer
  const w1 = wiege(l, m), w2 = wiege(m, s);
  const [erste, zweite] = r.bool() ? [w1, w2] : [w2, w1];
  const ab = r.bool(0.3);
  const reihe = ab ? [s, m, l] : [l, m, s];
  return A.reihenfolge({
    frage: ab ? 'Schau beide Waagen an. Lege die Dinge der Reihe nach: das schwerste zuerst.' : 'Schau beide Waagen an. Lege die Dinge der Reihe nach: das leichteste zuerst.',
    visual: { art: 'waage', ...erste, zweite },
    teile: reihe.map(karte), art: 'bild', richtung: ab ? 'ab' : 'auf',
    hinweis: `Ein Ding ist auf beiden Waagen. Ist es einmal schwerer und einmal leichter?`,
    erklaerung: `${NOM[l[2]]} ${l[1]} ist leichter als ${als(m)}. ${NOM[m[2]]} ${m[1]} ist leichter als ${als(s)}. Also: ${reihe.map((d) => d[1]).join(', ')}.`,
    bilder: [l[0], m[0], s[0]],
    sig: sig(l[1], m[1], s[1], ab), daten: { leicht: l[0], mittel: m[0], schwer: s[0], waagen: [erste, zweite], ab },
  });
}

// --- Daten: Strichliste und Bilddiagramm ---
function strichliste1(r) {
  const n = r.int(3, 20), d = r.pick(DINGE);
  return A.zahl({
    frage: `Hier wurden ${d[2]} gezählt. Wie viele Striche sind es?`,
    zeige: `${d[0]} = _`,
    visual: { art: 'strichliste', zeilen: [{ bild: d[0], n }] }, loesung: n, bis: 20,
    hinweis: 'Ein Bündel mit Querstrich sind 5. Zähle die Bündel in Fünferschritten, dann die einzelnen Striche dazu.',
    erklaerung: `Es sind ${n} Striche` + (n >= 5 ? `: ${Math.floor(n / 5)} Bündel mit je 5${n % 5 ? ` und ${n % 5} ${n % 5 === 1 ? 'einzelner' : 'einzelne'}` : ''}.` : '.'),
    bilder: [d[0]],
    sig: sig(n, d[1]), daten: { n },
    fehlerbilder: fehlerbilder(n, 20, [n - Math.floor(n / 5), 'Der Querstrich zählt auch. Ein Bündel sind 5 Striche.']),
  });
}
function bilddiagramm2(r) {
  const k = r.int(2, 3);
  const dinge = r.sample(DINGE, k);
  const spalten = dinge.map((d) => ({ bild: d[0], n: r.int(1, 10) }));
  const i = r.int(0, k - 1);
  const d = dinge[i], n = spalten[i].n;
  return A.zahl({
    frage: `Wie viele ${d[2]} sind es im Bild?`,
    zeige: `${d[0]} = _`,
    visual: { art: 'bilddiagramm', spalten }, loesung: n, bis: 20,
    hinweis: `Such die Säule mit den ${dativMehr(d[2])} und zähle die Bilder.`,
    erklaerung: n === 1 ? `Es ist 1 ${d[1]}.` : `Es sind ${n} ${d[2]}.`,
    bilder: dinge.map((x) => x[0]),
    sig: sig(i, ...spalten.map((s) => s.bild + s.n)), daten: { spalten, index: i },
  });
}
function wieVieleMehr(r) {
  const [a, b] = r.sample(DINGE, 2);
  const diff = r.int(1, 6), nb = r.int(1, 12 - diff);
  const na = nb + diff;
  const mitStrichen = r.bool();
  const visual = mitStrichen
    ? { art: 'strichliste', zeilen: [{ bild: a[0], n: na }, { bild: b[0], n: nb }] }
    : { art: 'bilddiagramm', spalten: r.bool() ? [{ bild: a[0], n: na }, { bild: b[0], n: nb }] : [{ bild: b[0], n: nb }, { bild: a[0], n: na }] };
  return A.zahl({
    frage: `Wie viele ${a[2]} sind es mehr als ${b[2]}?`,
    zeige: `${a[0]} ${MINUS} ${b[0]} = _`,
    visual, loesung: diff, bis: 20,
    hinweis: `Zähle zuerst beide. Wie viele fehlen bei den ${dativMehr(b[2])}, bis es gleich viele sind?`,
    erklaerung: `Es sind ${na} ${a[2]} und ${nb === 1 ? '1 ' + b[1] : nb + ' ' + b[2]}. Das sind ${diff} mehr.`,
    bilder: [a[0], b[0]],
    sig: sig(a[1], b[1], na, nb, mitStrichen), daten: { na, nb },
    fehlerbilder: fehlerbilder(diff, 20,
      [na, `Das sind alle ${a[2]}. Gefragt ist, wie viele es mehr sind als ${b[2]}.`],
      [na + nb, 'Das sind alle zusammen. Gefragt ist der Unterschied.']),
  });
}

export const generatoren = {
  'M-GR-01': { 1: laengenStufe1, 2: laengenStufe2, 3: laengenStufe3 },
  'M-GR-02': {
    1: (r) => muenzenErkennen(r, [100, 200, 500]),
    2: (r) => muenzenErkennen(r, [5, 10, 20, 50]),
    3: muenzenOrdnen,
  },
  'M-GR-03': { 1: geldZaehlen1, 2: geldZaehlen2, 3: geldLegen },
  'M-GR-04': { 1: tagesablauf, 2: uhrVoll, 3: uhrHalb },
  'M-GR-05': { 1: gewichtStufe1, 2: gewichtStufe2, 3: gewichtStufe3 },
  'M-GR-06': { 1: strichliste1, 2: bilddiagramm2, 3: wieVieleMehr },
};
