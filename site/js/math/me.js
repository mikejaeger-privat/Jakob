// Mathematik ME: Mengen und Zahlen (auf einen Blick, Zahl zur Menge, Menge legen, Ziffern, Mengen und Zahlen vergleichen,
// Zehner und Einer, Zahlenstrahl)
import { A, sig, auswahl, fehlerbilder, DINGE, menge } from './lib.js';

const STANDARD = { zwanzigerfeld: 'Zwanzigerfeld', zehnerfeld: 'Zehnerfeld', zahlenstrahl: 'Zahlenstrahl', plaettchen: 'Plättchen' };
const begriff = (ctx, k) => ctx?.begriffe?.[k] || STANDARD[k];
// Fehlerbild zu einer Option, die ein Objekt ist (Bild, Darstellung)
const fbOption = (o, text) => ({ eingabe: JSON.stringify(o), text });
const gross = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// «Hier sind 3 Äpfel» / «Hier ist 1 Apfel»
const sindMenge = (n, d) => `${n === 1 ? 'ist' : 'sind'} ${menge(n, d)}`;
const EINZAHL = { Augen: 'Auge', Finger: 'Finger' };
const esSind = (n, was) => (n === 1 ? `Es ist 1 ${EINZAHL[was] || was}` : `Es sind ${n} ${was}`);

// Darstellungen
const zehnerfeld5 = (n) => ({ art: 'zehnerfeld', rot: Math.min(n, 5), blau: Math.max(0, n - 5) });   // obere Reihe rot, untere blau
const zwanzigerfeld10 = (n) => ({ art: 'zwanzigerfeld', rot: Math.min(n, 10), blau: Math.max(0, n - 10) });
const dinge = (d, n) => ({ art: 'dinge', bild: d[0], n });

// Ziffernformen als Hilfe (beschreibt die Form, nicht die Antwort)
const FORM = {
  0: 'Die Null ist rund wie ein Ei.',
  1: 'Die Eins ist ein langer Strich mit einem kleinen Haken oben.',
  2: 'Die Zwei hat oben einen Bogen und unten einen geraden Strich.',
  3: 'Die Drei hat zwei Bäuche nach rechts.',
  4: 'Die Vier hat eine spitze Ecke und einen langen Strich nach unten.',
  5: 'Die Fünf hat oben einen Hut und unten einen Bauch.',
  6: 'Die Sechs hat unten einen runden Bauch.',
  7: 'Die Sieben hat oben einen geraden Strich und dann einen langen schrägen Strich.',
  8: 'Die Acht hat zwei Kreise übereinander.',
  9: 'Die Neun hat oben einen runden Kopf.',
  10: 'Die Zehn hat zwei Ziffern: eine 1 und eine 0.',
};
// Ziffern, die ähnlich aussehen (Ablenker)
const AEHNLICH = { 0: [8, 6], 1: [7, 4], 2: [5, 7], 3: [8, 5], 4: [1, 9], 5: [2, 6, 3], 6: [9, 0, 8], 7: [1, 2], 8: [3, 0, 6], 9: [6, 4], 10: [1, 0] };
// Zehnerzahlen, die ähnlich klingen
const AEHNLICH_KLANG = { 13: [18], 14: [15], 15: [14], 16: [17, 19], 17: [16], 18: [13], 19: [16], 11: [12], 12: [11], 20: [12] };

// Dinge, die sich auf einem Bild zu ähnlich sehen
const AEHNLICH_BILD = [['Apfel', 'Tomate'], ['Vogel', 'Ente'], ['Vogel', 'Huhn'], ['Ente', 'Huhn'], ['Zitrone', 'Banane']];
function zweiDinge(r) {
  for (;;) {
    const [d1, d2] = r.sample(DINGE, 2);
    if (!AEHNLICH_BILD.some(([x, y]) => (x === d1[1] && y === d2[1]) || (x === d2[1] && y === d1[1]))) return [d1, d2];
  }
}

// --- M-ME-01 Mengen auf einen Blick ---
function aufEinenBlick(r, ctx, art) {
  const max = art === 'wuerfelbild' ? 6 : 10;
  const n = r.int(1, max);
  const bild = (x) => (art === 'zehnerfeld' ? zehnerfeld5(x) : { art, n: x });
  const was = art === 'wuerfelbild' ? 'Augen' : art === 'fingerbild' ? 'Finger' : begriff(ctx, 'plaettchen');
  const hinweis = art === 'wuerfelbild' ? 'Schau, wie die Augen liegen. Du kannst sie auch zählen.'
    : n > 5 ? (art === 'fingerbild' ? 'Eine ganze Hand hat 5 Finger. Zähle von 5 aus weiter.' : 'Die obere Reihe hat 5. Zähle von 5 aus weiter.')
      : (art === 'fingerbild' ? 'Zähle die Finger.' : `Zähle die ${was}.`);
  const fuenfUnd = n > 5 && art !== 'wuerfelbild' ? ` 5 und ${n - 5} sind ${n}.` : '';
  if (r.bool()) {
    const frage = art === 'wuerfelbild' ? 'Wie viele Augen hat der Würfel?' : art === 'fingerbild' ? 'Wie viele Finger sind das?' : `Wie viele ${was} sind im ${begriff(ctx, 'zehnerfeld')}?`;
    return A.zahl({
      frage, visual: bild(n), loesung: n, bis: 10, hinweis,
      erklaerung: `${esSind(n, was)}.${fuenfUnd}`,
      sig: sig('zahl', art, n), daten: { n, art, modus: 'zahl' },
      fehlerbilder: fehlerbilder(n, 10, [n + 1, 'Schau nochmals genau. Zähle jedes nur einmal.'], [n - 1, 'Eines fehlt noch. Schau nochmals genau.']),
    });
  }
  const falsche = r.shuffle([n - 1, n + 1, n - 2, n + 2].filter((x) => x >= 1 && x <= max));
  const opt = auswahl(r, { visual: bild(n) }, falsche.map((x) => ({ visual: bild(x) })), 3);
  const frage = art === 'wuerfelbild' ? `Welcher Würfel zeigt ${n}?` : art === 'fingerbild' ? `Welche Hände zeigen ${n}?` : `Welches ${begriff(ctx, 'zehnerfeld')} zeigt ${n}?`;
  return A.wahlBild({
    frage: frage + ' Tippe darauf.', zeige: String(n), ...opt, hinweis,
    erklaerung: `${esSind(n, was).replace('Es', 'Hier')}.${fuenfUnd}`,
    sig: sig('wahl', art, n, ...opt.optionen.map((o) => (art === 'zehnerfeld' ? o.visual.rot + o.visual.blau : o.visual.n)).sort()),
    daten: { n, art, modus: 'wahl', werte: opt.optionen.map((o) => (art === 'zehnerfeld' ? o.visual.rot + o.visual.blau : o.visual.n)) },
    fehlerbilder: opt.optionen.filter((_, i) => i !== opt.richtig).map((o) => {
      const x = art === 'zehnerfeld' ? o.visual.rot + o.visual.blau : o.visual.n;
      return fbOption(o, `Hier sind es ${x}. Gesucht ist ${n}.`);
    }),
  });
}

// --- M-ME-02 Wie viele? ---
function fuenferText(n) {
  const f = [];
  for (let k = 5; k <= n; k += 5) f.push(k);
  const rest = n - (f.at(-1) || 0);
  return `In Fünfern gezählt: ${f.join(', ')}${rest ? ` und noch ${rest}` : ''}. Es sind ${n}.`;
}

// --- M-ME-03 Menge legen ---
function fuenfer(n) {   // 13 -> «5 und 5 und 3»
  const t = [];
  let x = n;
  while (x >= 5) { t.push(5); x -= 5; }
  if (x) t.push(x);
  return t.join(' und ');
}

// --- M-ME-04 Ziffern: gehörte Zahl wählen ---
function zifferHoeren(r, n, bis, anzahl) {
  let falsche;
  if (n <= 10) falsche = [...r.shuffle(AEHNLICH[n] || []), ...r.shuffle([n - 1, n + 1])];
  else falsche = [...(n === 20 ? [2] : [n - 10]), ...r.shuffle(AEHNLICH_KLANG[n] || []), ...r.shuffle([n - 1, n + 1])];
  falsche = falsche.filter((x) => x >= 0 && x <= bis && x !== n);
  const opt = auswahl(r, String(n), falsche.map(String), anzahl);
  const zehner = Math.floor(n / 10), einer = n % 10;
  const fb = opt.optionen.filter((_, i) => i !== opt.richtig).map((o) => {
    const x = Number(o);
    if (n > 10 && x < 10) return [x, `Das ist die ${x}. ${n} hat zwei Ziffern: vorne eine ${zehner} und hinten eine ${einer}.`];
    if (n <= 10) return [x, `Das ist die ${x}. ${FORM[n]}`];
    return [x, `Das ist die ${x}. Hör nochmals genau hin.`];
  });
  return A.wahlWort({
    frage: 'Hör gut zu und tippe auf die Zahl.', sprich: `Tippe auf die Zahl … ${n}.`, vorlesen: String(n), ...opt,
    hinweis: n <= 10 ? FORM[n] : `Die Zahl hat vorne eine ${zehner}. Hör genau, was hinten kommt.`,
    erklaerung: `Das ist die ${n}.`,
    sig: sig(n, ...opt.optionen.slice().sort()), daten: { n, optionen: opt.optionen },
    fehlerbilder: fehlerbilder(n, bis, ...fb),
  });
}

// --- M-ME-05 Mengen vergleichen ---
function mehrWeniger(r, { oben, minDiff, frageArt }) {
  const d = r.pick(DINGE);
  let a, b;
  do { a = r.int(1, oben); b = r.int(1, oben); } while (Math.abs(a - b) < minDiff);
  const gesucht = frageArt === 'mehr' ? Math.max(a, b) : Math.min(a, b);
  const anders = frageArt === 'mehr' ? Math.min(a, b) : Math.max(a, b);
  const optionen = [{ visual: dinge(d, a) }, { visual: dinge(d, b) }];
  const richtig = a === gesucht ? 0 : 1;
  return A.wahlBild({
    frage: `Wo sind ${frageArt} ${d[2]}? Tippe auf das Bild.`, optionen, richtig,
    hinweis: 'Zähle auf beiden Bildern.',
    erklaerung: `Hier ${sindMenge(gesucht, d)}, dort ${sindMenge(anders, d).replace(/^(ist|sind) /, '')}. ${gesucht} ist ${frageArt} als ${anders}.`,
    bilder: [d[0]], sig: sig(frageArt, d[1], a, b), daten: { a, b, frageArt },
    fehlerbilder: [fbOption(optionen[1 - richtig], `Hier ${sindMenge(anders, d)}. Auf dem anderen Bild sind es ${frageArt}.`)],
  });
}
function gleichViele(r, ctx) {
  const d = r.pick(DINGE);
  const n = r.int(5, 20);
  const falsche = r.shuffle([n - 1, n + 1, n - 2, n + 2].filter((x) => x >= 1 && x <= 20));
  const opt = auswahl(r, { visual: zwanzigerfeld10(n) }, falsche.map((x) => ({ visual: zwanzigerfeld10(x) })), 3);
  const pl = begriff(ctx, 'plaettchen');
  return A.wahlBild({
    frage: `Oben sind ${d[2]}. Wo sind gleich viele ${pl}? Tippe darauf.`, visual: dinge(d, n), ...opt,
    hinweis: `Zähle zuerst die ${d[2]}. Such dann das ${begriff(ctx, 'zwanzigerfeld')} mit genau so vielen.`,
    erklaerung: `Es sind ${menge(n, d)} und ${n} ${pl}. Das ist gleich viel.`,
    bilder: [d[0]], sig: sig('gleich', d[1], n, ...opt.optionen.map((o) => o.visual.rot + o.visual.blau).sort((x, y) => x - y)),
    daten: { n, werte: opt.optionen.map((o) => o.visual.rot + o.visual.blau), frageArt: 'gleich' },
    fehlerbilder: opt.optionen.filter((_, i) => i !== opt.richtig).map((o) => {
      const x = o.visual.rot + o.visual.blau;
      return fbOption(o, `Hier sind ${x} ${pl}. Das sind ${x > n ? 'zu viele' : 'zu wenige'}.`);
    }),
  });
}

// --- M-ME-08 Zahlenstrahl: Hilfe zum Ablesen von der nächsten Fünferzahl aus ---
function abFuenfer(x) {
  const unten = x - (x % 5);
  const striche = (k) => (k === 1 ? 'einen Strich' : `${k} Striche`);
  if (x % 5 <= 2) return { hinweis: `Fang bei ${unten} an und zähle die Striche weiter.`, weg: `Von ${unten} aus ${striche(x % 5)} weiter: Das ist die ${x}.` };
  return { hinweis: `Fang bei ${unten + 5} an und zähle die Striche zurück.`, weg: `Von ${unten + 5} aus ${striche(5 - (x % 5))} zurück: Das ist die ${x}.` };
}

export const generatoren = {
  'M-ME-01': {
    1: (r, ctx) => aufEinenBlick(r, ctx, 'wuerfelbild'),
    2: (r, ctx) => aufEinenBlick(r, ctx, 'fingerbild'),
    3: (r, ctx) => aufEinenBlick(r, ctx, 'zehnerfeld'),
  },

  'M-ME-02': {
    1: (r, ctx) => {
      const n = r.int(2, 10), anordnung = r.pick(['reihe', 'frei']);
      const pl = begriff(ctx, 'plaettchen');
      return A.zahl({
        frage: `Wie viele ${pl} sind es?`, visual: { art: 'plaettchen', rot: n, blau: 0, weg: 0, anordnung }, loesung: n, bis: 10,
        hinweis: 'Zeige mit dem Finger auf jedes und zähle mit.',
        erklaerung: anordnung === 'reihe' && n > 5 ? `5 und ${n - 5} sind ${n}. Es sind ${n} ${pl}.` : `Es sind ${n} ${pl}.`,
        sig: sig(n, anordnung), daten: { n },
        fehlerbilder: fehlerbilder(n, 10, [n + 1, 'Vielleicht hast du eines zweimal gezählt. Zeige auf jedes nur einmal.'], [n - 1, 'Eines fehlt noch. Schau, ob du jedes gezählt hast.']),
      });
    },
    2: (r, ctx) => {
      const n = r.int(6, 20);
      const geteilt = r.bool();   // zwei Farben beliebig verteilt statt «obere Reihe rot»
      const rot = geteilt ? r.int(1, n - 1) : Math.min(n, 10);
      const pl = begriff(ctx, 'plaettchen');
      return A.zahl({
        frage: `Wie viele ${pl} sind im ${begriff(ctx, 'zwanzigerfeld')}?`, visual: { art: 'zwanzigerfeld', rot, blau: n - rot, weg: 0 }, loesung: n, bis: 20,
        hinweis: n > 10 ? 'Eine volle Reihe sind 10. Zähle in der unteren Reihe von 10 aus weiter.' : 'Bis zur Lücke sind es 5. Zähle von 5 aus weiter.',
        erklaerung: n > 10 ? `Oben ist eine volle Reihe, das sind 10. Unten sind ${n - 10}. Zusammen sind es ${n}.` : n > 5 ? `5 und ${n - 5} sind ${n}.` : `Es sind ${n}.`,
        sig: sig(n, rot), daten: { n, rot },
        fehlerbilder: fehlerbilder(n, 20, [n - 10 >= 1 ? n - 10 : null, 'Du hast nur die untere Reihe gezählt. Oben sind auch noch 10.'],
          [n + 1, 'Schau nochmals genau. Zähle jedes nur einmal.'], [n - 1, 'Eines fehlt noch.']),
      });
    },
    3: (r, ctx) => {
      const n = r.int(11, 20);
      const rot = r.bool() ? n : r.int(4, n - 4);
      const pl = begriff(ctx, 'plaettchen');
      return A.zahl({
        frage: `Wie viele ${pl} sind es? Zähle geschickt.`, visual: { art: 'plaettchen', rot, blau: n - rot, weg: 0, anordnung: 'frei' }, loesung: n, bis: 20,
        hinweis: 'Zähle zuerst 5 ab und merke sie dir. Dann wieder 5. Dann die übrigen.',
        erklaerung: fuenferText(n),
        sig: sig(n, rot), daten: { n, rot },
        fehlerbilder: fehlerbilder(n, 20, [n + 1, 'Vielleicht hast du eines zweimal gezählt. Merke dir, welche du schon hast.'], [n - 1, 'Eines fehlt noch. Schau genau.']),
      });
    },
  },

  'M-ME-03': {
    1: (r, ctx) => {
      const n = r.int(1, 10);
      const pl = begriff(ctx, 'plaettchen');
      return A.mengeLegen({
        frage: `Lege ${n} ${pl} ins ${begriff(ctx, 'zehnerfeld')}.`, zeige: String(n), ziel: n, feld: 'zehner', start: 0, struktur: false,
        hinweis: 'Tippe auf ein leeres Feld, dann liegt dort ein Plättchen. Zähle mit.',
        erklaerung: n > 5 ? `${n} sind eine volle Reihe mit 5 und noch ${n - 5}.` : `${n} ${pl} in der oberen Reihe.`,
        sig: sig(n), daten: { n },
      });
    },
    2: (r, ctx) => {
      const n = r.int(6, 20);
      const pl = begriff(ctx, 'plaettchen');
      return A.mengeLegen({
        frage: `Lege ${n} ${pl} ins ${begriff(ctx, 'zwanzigerfeld')}.`, zeige: String(n), ziel: n, feld: 'zwanziger', start: 0, struktur: false,
        hinweis: n > 10 ? 'Mach zuerst die obere Reihe voll. Das sind 10. Dann zähle unten weiter.' : 'Bis zur Lücke sind es 5. Dann zähle weiter.',
        erklaerung: n > 10 ? `${n} sind 10 in der oberen Reihe und ${n - 10} in der unteren.` : `${n} sind 5 und ${n - 5}.`,
        sig: sig(n), daten: { n },
      });
    },
    3: (r, ctx) => {
      const n = r.int(6, 20);
      const pl = begriff(ctx, 'plaettchen');
      return A.mengeLegen({
        frage: `Lege ${n} ${pl} ins ${begriff(ctx, 'zwanzigerfeld')}. Mach immer zuerst einen Fünfer voll.`, zeige: String(n),
        ziel: n, feld: 'zwanziger', start: 0, struktur: true,
        hinweis: `${n} ist ${fuenfer(n)}. Lege die Fünfer immer bis zur Lücke.`,
        erklaerung: `${n} sind ${fuenfer(n)}: ${n % 5 ? `ganze Fünfer und noch ${n % 5}` : 'lauter ganze Fünfer'}.`,
        sig: sig(n), daten: { n },
      });
    },
  },

  'M-ME-04': {
    1: (r) => zifferHoeren(r, r.int(0, 10), 10, 3),
    2: (r) => {
      const d = r.int(0, 9), hilfe = r.bool(0.7) ? 'pfeile' : 'start';
      return A.nachspuren({
        frage: `Fahre die ${d} mit dem Finger nach.`, zeichen: String(d), hilfe,
        hinweis: hilfe === 'pfeile' ? 'Fang beim Startpunkt an und folge den Pfeilen.' : 'Fang beim Startpunkt an.',
        erklaerung: `So schreibt man die ${d}. ${FORM[d]}`,
        sig: sig(d, hilfe), daten: { ziffer: d },
      });
    },
    3: (r) => zifferHoeren(r, r.int(11, 20), 20, r.pick([3, 4])),
  },

  'M-ME-05': {
    1: (r) => mehrWeniger(r, { oben: 10, minDiff: 2, frageArt: 'mehr' }),
    2: (r, ctx) => {
      const art = r.pick(['mehr', 'weniger', 'gleich']);
      return art === 'gleich' ? gleichViele(r, ctx) : mehrWeniger(r, { oben: 20, minDiff: 1, frageArt: art });
    },
    3: (r) => {
      const [d1, d2] = zweiDinge(r);
      const diff = r.int(1, 5), a = r.int(diff + 1, 12), b = a - diff;
      const links = r.bool();
      const spalten = links ? [{ bild: d1[0], n: a }, { bild: d2[0], n: b }] : [{ bild: d2[0], n: b }, { bild: d1[0], n: a }];
      return A.zahl({
        frage: `Es gibt mehr ${d1[2]} als ${d2[2]}. Wie viele ${d1[2]} sind es mehr?`,
        visual: { art: 'bilddiagramm', spalten }, loesung: diff, bis: 20,
        hinweis: `Schau, wo die ${d2[2]} aufhören. Zähle nur die ${d1[2]}, die noch weiter gehen.`,
        erklaerung: `${gross(menge(a, d1))} und ${menge(b, d2)}: ${diff === 1 ? `Es ist 1 ${d1[1]}` : `Es sind ${diff} ${d1[2]}`} mehr.`,
        bilder: [d1[0], d2[0]], sig: sig(d1[1], d2[1], a, b, links), daten: { a, b },
        fehlerbilder: fehlerbilder(diff, 20, [a, `Du hast alle ${d1[2]} gezählt. Gesucht sind nur die, die mehr sind.`],
          [b, `Das sind die ${d2[2]}. Gesucht ist, wie viele ${d1[2]} mehr sind.`],
          [diff + 1, `Schau nochmals genau, wo die ${d2[2]} aufhören.`], [diff - 1, `Schau nochmals genau, wo die ${d2[2]} aufhören.`]),
      });
    },
  },

  'M-ME-06': {
    1: (r) => {
      let a, b;
      do { a = r.int(1, 10); b = r.int(1, 10); } while (a === b);
      const gr = Math.max(a, b), kl = Math.min(a, b);
      return A.wahlWort({
        frage: 'Welche Zahl ist grösser? Tippe darauf.', optionen: [String(a), String(b)], richtig: a > b ? 0 : 1,
        visualNachFehler: { art: 'zahlenstrahl', von: 0, bis: 10, beschrift: 'alle', marken: [{ x: a, text: String(a) }, { x: b, text: String(b) }] },
        hinweis: 'Zähle von 1 an. Welche Zahl kommt später?',
        erklaerung: `${gr} ist grösser als ${kl}. Am Zahlenstrahl steht ${gr} weiter rechts.`,
        sig: sig(a, b), daten: { a, b, frageArt: 'groesser' },
        fehlerbilder: fehlerbilder(String(gr), 10, [kl, `${kl} ist kleiner als ${gr}. Gesucht ist die grössere Zahl.`]),
      });
    },
    2: (r) => {
      const a = r.int(1, 20);
      const b = r.bool(0.2) ? a : (() => { let x; do { x = r.int(1, 20); } while (x === a); return x; })();
      const zeichen = a < b ? '<' : a > b ? '>' : '=';
      const optionen = ['<', '=', '>'];
      const satz = a < b ? `${a} ist kleiner als ${b}.` : a > b ? `${a} ist grösser als ${b}.` : `Beide Zahlen sind gleich gross.`;
      const fb = optionen.filter((z) => z !== zeichen).map((z) => ({
        eingabe: z,
        text: zeichen === '=' ? 'Schau genau: Beide Zahlen sind gleich gross.'
          : z === '=' ? `Die Zahlen sind nicht gleich. ${Math.max(a, b)} ist grösser.`
            : `Umgekehrt: ${satz} Die Spitze zeigt zur kleineren Zahl.`,
      }));
      return A.wahlWort({
        frage: 'Welches Zeichen passt in den Kreis?', zeige: `${a} ○ ${b}`, optionen, richtig: optionen.indexOf(zeichen),
        hinweis: 'Die offene Seite des Zeichens zeigt zur grösseren Zahl. Sind beide gleich, passt das Gleichzeichen.',
        erklaerung: `${satz} Also ${a} ${zeichen} ${b}.`,
        sig: sig(a, b), daten: { a, b }, fehlerbilder: fb,
      });
    },
    3: (r) => {
      const g = r.int(2, 5), a = r.int(1, 20 - g), b = a + g;
      const x = r.int(a + 1, b - 1);
      const unter = a > 1 ? a - r.int(1, Math.min(3, a - 1)) : null, ueber = b < 20 ? b + r.int(1, Math.min(3, 20 - b)) : null;
      const kand = r.shuffle([unter, ueber, r.pick([a, b])].filter((y) => y !== null && y >= 1 && y <= 20));
      const opt = auswahl(r, String(x), kand.map(String), 3);
      const fb = opt.optionen.filter((_, i) => i !== opt.richtig).map(Number).map((y) => [y,
        y === a || y === b ? `${y} ist eine der beiden Zahlen. Gesucht ist eine Zahl dazwischen.`
          : y < a ? `${y} ist kleiner als ${a}. Die Zahl muss grösser als ${a} sein.` : `${y} ist grösser als ${b}. Die Zahl muss kleiner als ${b} sein.`]);
      return A.wahlWort({
        frage: `Welche Zahl liegt zwischen ${a} und ${b}?`, ...opt,
        visual: { art: 'zahlenstrahl', von: 0, bis: 20, beschrift: 'fuenfer', marken: [{ x: a, text: String(a) }, { x: b, text: String(b) }] },
        hinweis: `Zähle von ${a} weiter bis ${b}. Welche Zahl kommt dabei vor?`,
        erklaerung: `${x} liegt zwischen ${a} und ${b}: ${x} ist grösser als ${a} und kleiner als ${b}.`,
        sig: sig(a, b, x, ...opt.optionen.slice().sort()), daten: { a, b, optionen: opt.optionen },
        fehlerbilder: fehlerbilder(x, 20, ...fb),
      });
    },
  },

  'M-ME-07': {
    1: (r) => {
      const n = r.int(10, 20), z = Math.floor(n / 10), e = n % 10;
      return A.zahl({
        frage: 'Welche Zahl ist das? Ein Streifen hat 10.', visual: { art: 'zehnerstreifen', zehner: z, einer: e }, loesung: n, bis: 20,
        hinweis: z === 2 ? 'Jeder Streifen hat 10. Zähle in Zehnern: 10, …' : e ? 'Der Streifen hat 10. Zähle von 10 aus die einzelnen weiter.' : 'Der Streifen hat 10. Gibt es noch einzelne Kästchen?',
        erklaerung: e ? `${z} Zehner und ${e} Einer sind ${n}.` : `${z} Zehner ${z === 1 ? 'ist' : 'sind'} ${n}.`,
        sig: sig(n), daten: { zehner: z, einer: e },
        fehlerbilder: fehlerbilder(n, 20, [e >= 1 ? e : null, 'Du hast nur die Einer gezählt. Der Streifen zählt 10.'],
          [z + e !== n ? z + e : null, 'Ein Streifen zählt nicht 1, sondern 10.'], [n + 1, 'Schau nochmals genau.'], [n - 1, 'Schau nochmals genau.']),
      });
    },
    2: (r) => {
      const n = r.int(10, 20), z = Math.floor(n / 10), e = n % 10;
      return A.mengeLegen({
        frage: `Lege ${n} mit Zehnern und Einern.`, zeige: String(n), ziel: n, feld: 'zehnereiner', start: 0,
        hinweis: 'Ein Streifen ist ein Zehner, also 10. Ein einzelnes Kästchen ist ein Einer.',
        erklaerung: e ? `${n} sind ${z} Zehner und ${e} Einer.` : `${n} ${z === 1 ? 'ist' : 'sind'} ${z} Zehner.`,
        sig: sig(n), daten: { zehner: z, einer: e },
      });
    },
    3: (r) => {
      const einer = r.bool(0.7);
      const n = einer ? r.int(11, 19) : r.int(10, 20);
      const z = Math.floor(n / 10), e = n % 10;
      const l = einer ? e : z;
      return A.zahl({
        frage: einer ? `Wie viele Einer hat ${n}?` : `Wie viele Zehner hat ${n}?`, zeige: String(n), loesung: l, bis: 20,
        visualNachFehler: { art: 'zehnerstreifen', zehner: z, einer: e },
        hinweis: einer ? 'Die Einer stehen hinten.' : 'Die Zehner stehen vorne.',
        erklaerung: e ? `${n} hat ${z} Zehner und ${e} Einer.` : `${n} hat ${z} Zehner und keine Einer.`,
        sig: sig(n, einer ? 'E' : 'Z'), daten: { n, frage: einer ? 'einer' : 'zehner' },
        fehlerbilder: einer
          ? fehlerbilder(l, 20, [n, `${n} ist die ganze Zahl. Gefragt sind nur die Einer.`], [z, 'Das sind die Zehner. Gefragt sind die Einer.'])
          : fehlerbilder(l, 20, [e, 'Das sind die Einer. Gefragt sind die Zehner.'], [10 * z, `Gefragt ist, wie viele Zehner: wie viele Streifen.`]),
      });
    },
  },

  'M-ME-08': {
    1: (r, ctx) => {
      const beschrift = r.bool() ? 'enden' : [0, 5, 10];
      const x = beschrift === 'enden' ? r.int(1, 9) : r.pick([1, 2, 3, 4, 6, 7, 8, 9]);
      const ab = beschrift !== 'enden' && x > 5 ? 5 : 0;
      return A.zahl({
        frage: `Welche Zahl gehört zum Fragezeichen am ${begriff(ctx, 'zahlenstrahl')}?`,
        visual: { art: 'zahlenstrahl', von: 0, bis: 10, beschrift, marken: [{ x, text: '?' }] }, loesung: x, bis: 10,
        hinweis: `Fang bei ${ab} an und zähle die Striche danach.`,
        erklaerung: `Von ${ab} aus ${x - ab === 1 ? 'einen Strich' : `${x - ab} Striche`} weiter: Das ist die ${x}.`,
        sig: sig(x, beschrift === 'enden' ? 'e' : 'f'), daten: { x },
        fehlerbilder: fehlerbilder(x, 10, [x + 1, `Den Strich bei ${ab} zählst du nicht mit. Fang danach an zu zählen.`], [x - 1, 'Schau nochmals genau. Zähle jeden Strich einmal.']),
      });
    },
    2: (r, ctx) => {
      const x = r.pick([1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19]);
      const h = abFuenfer(x);
      return A.zahl({
        frage: `Welche Zahl gehört zum Fragezeichen am ${begriff(ctx, 'zahlenstrahl')}?`,
        visual: { art: 'zahlenstrahl', von: 0, bis: 20, beschrift: 'fuenfer', marken: [{ x, text: '?' }] }, loesung: x, bis: 20,
        hinweis: h.hinweis, erklaerung: h.weg,
        sig: sig(x), daten: { x },
        fehlerbilder: fehlerbilder(x, 20, [x + 1, 'Den Strich, bei dem du anfängst, zählst du nicht mit.'], [x - 1, 'Schau nochmals genau. Zähle jeden Strich einmal.']),
      });
    },
    3: (r, ctx) => {
      const x = r.pick([1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19]);
      return A.antippen({
        frage: `Tippe am ${begriff(ctx, 'zahlenstrahl')} auf die ${x}.`, zeige: String(x),
        visual: { art: 'zahlenstrahl', von: 0, bis: 20, beschrift: 'fuenfer' }, loesung: [String(x)], einzeln: true,
        hinweis: abFuenfer(x).hinweis,
        erklaerung: `Die ${x} kommt nach der ${x - 1} und vor der ${x + 1}.`,
        sig: sig(x), daten: { x },
      });
    },
  },
};

