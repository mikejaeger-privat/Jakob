// Mathematik ZE: Zerlegen (bis 5, bis 10, Kraft der Fünf, Ergänzen bis 10, Verdoppeln und Halbieren, gerade und ungerade)
import { A, sig, auswahl, fehlerbilder, DINGE } from './lib.js';

const STANDARD = { zwanzigerfeld: 'Zwanzigerfeld', zehnerfeld: 'Zehnerfeld', zerlegungshaus: 'Zahlenhaus', schuettelbox: 'Schüttelbox', plaettchen: 'Plättchen' };
const begriff = (ctx, k) => ctx?.begriffe?.[k] || STANDARD[k];
const fbOption = (o, text) => ({ eingabe: JSON.stringify(o), text });
const sind = (n) => (n === 1 ? 'ist' : 'sind');
const EIN = { der: 'ein', die: 'eine', das: 'ein' };
const KEIN = { der: 'keiner', die: 'keine', das: 'keines' };
const JEDER = { der: 'jeder', die: 'jede', das: 'jedes' };

// --- Zerlegen ---
function farbenZerlegung(r, ctx) {   // M-ZE-01 Stufe 1: Plättchen in zwei Farben
  const n = r.int(2, 5), a = r.int(1, n - 1), b = n - a;
  const nachBlau = r.bool();
  const [gegeben, gesucht, gFarbe, sFarbe] = nachBlau ? [a, b, 'rot', 'blau'] : [b, a, 'blau', 'rot'];
  const pl = begriff(ctx, 'plaettchen');
  return A.zahl({
    frage: `Das sind ${n} ${pl}. ${gegeben} ${sind(gegeben)} ${gFarbe}. Wie viele sind ${sFarbe}?`,
    visual: { art: 'plaettchen', rot: a, blau: b, weg: 0, anordnung: 'reihe' }, loesung: gesucht, bis: 10,
    hinweis: `Zähle die ${sFarbe}en ${pl}.`,
    erklaerung: `${n} sind ${a} rote und ${b} blaue. Also ${sind(gesucht)} ${gesucht} ${sFarbe}.`,
    sig: sig(n, a, sFarbe), daten: { n, a, b, gesucht: sFarbe },
    fehlerbilder: fehlerbilder(gesucht, 10, [n, `${n} sind alle zusammen. Gefragt sind nur die ${sFarbe}en.`], [gegeben, `Das sind die ${gFarbe}en. Gefragt sind die ${sFarbe}en.`]),
  });
}

function schuettelbox(r, ctx, von, bis) {
  const n = r.int(von, bis), s = r.int(1, n - 1), h = n - s;
  const pl = begriff(ctx, 'plaettchen');
  return A.zahl({
    frage: `In der ${begriff(ctx, 'schuettelbox')} sind ${n} ${pl}. ${s} siehst du. Wie viele sind unter dem Deckel?`,
    visual: { art: 'schuettelbox', n, sichtbar: s }, loesung: h, bis: 10,
    hinweis: `Zusammen sind es ${n}. Zähle von ${s} aus weiter bis ${n}.`,
    erklaerung: `${n} sind ${s} und ${h}. Unter dem Deckel ${sind(h)} ${h}.`,
    sig: sig(n, s), daten: { n, sichtbar: s },
    fehlerbilder: fehlerbilder(h, 10, [n, `${n} sind alle zusammen. Gefragt ist nur, was unter dem Deckel ist.`],
      [s, `${s} siehst du. Gefragt ist, was unter dem Deckel ist.`], [n + s, 'Hier wird nichts dazugezählt. Unter dem Deckel ist ein Teil von allen.']),
  });
}

// Zahlenhaus mit allen Zerlegungen (ohne 0); seite: 'rechts' = rechte Zahl gesucht, 'zufall' = je Zeile eine Seite
function hausAlle(r, ctx, n, seite) {
  const zeilen = [], loesung = [], seiten = [];
  for (let a = 1; a < n; a++) {
    const rechts = seite === 'rechts' || r.bool();
    seiten.push(rechts ? 'r' : 'l');
    zeilen.push(rechts ? [a, '?'] : ['?', n - a]);
    loesung.push(rechts ? n - a : a);
  }
  const zh = begriff(ctx, 'zerlegungshaus');
  return A.zahl({
    frage: `Fülle das ${zh} aus. Oben steht ${n}.`,
    visual: { art: 'zerlegungshaus', dach: n, zeilen }, loesung, bis: 10,
    hinweis: seite === 'rechts' ? 'Links steht jedes Mal eins mehr. Was passiert rechts?' : `In jeder Zeile ergeben die zwei Zahlen zusammen ${n}.`,
    erklaerung: `${n} ist ${Array.from({ length: n - 1 }, (_, i) => `${i + 1} und ${n - i - 1}`).join(', ')}.`,
    sig: sig(n, seiten.join('')), daten: { dach: n, zeilen },
  });
}

// --- Kraft der Fünf ---
function kraftFuenfBild(r, ctx) {   // M-ZE-03 Stufe 1
  const n = r.int(6, 10), bildArt = r.pick(['zehnerfeld', 'fingerbild']), modus = r.pick(['teil', 'ganz']);
  const visual = bildArt === 'zehnerfeld' ? { art: 'zehnerfeld', rot: 5, blau: n - 5, weg: 0 } : { art: 'fingerbild', n };
  const finger = bildArt === 'fingerbild';
  const was = finger ? 'Finger' : begriff(ctx, 'plaettchen');
  if (modus === 'teil') {
    return A.zahl({
      frage: `${n} ist 5 und wie viele?`, zeige: `${n} = 5 + _`, visual, loesung: n - 5, bis: 10,
      hinweis: finger ? 'Eine Hand hat 5 Finger. Wie viele Finger zeigt die andere Hand?' : 'Oben sind 5. Wie viele sind unten?',
      erklaerung: `${n} ist 5 und ${n - 5}.`,
      sig: sig(n, bildArt, modus), daten: { n, modus },
      fehlerbilder: fehlerbilder(n - 5, 10, [n, `${n} ist das Ganze. Gesucht ist, was zu 5 noch dazukommt.`], [5, '5 steht schon da. Was kommt zu 5 dazu?']),
    });
  }
  return A.zahl({
    frage: `Wie viele ${was} sind es?`, visual, loesung: n, bis: 10,
    hinweis: finger ? 'Eine ganze Hand sind 5. Zähle von 5 aus weiter.' : 'Eine volle Reihe sind 5. Zähle von 5 aus weiter.',
    erklaerung: `5 und ${n - 5} sind ${n}.`,
    sig: sig(n, bildArt, modus), daten: { n, modus },
    fehlerbilder: fehlerbilder(n, 10, [n - 5, finger ? 'Das ist nur die zweite Hand. Die erste Hand hat auch noch 5.' : 'Das ist nur die untere Reihe. Oben sind auch noch 5.'],
      [n + 1, 'Schau nochmals genau.'], [n - 1, 'Schau nochmals genau.']),
  });
}

export const generatoren = {
  'M-ZE-01': {
    1: (r, ctx) => farbenZerlegung(r, ctx),
    2: (r, ctx) => schuettelbox(r, ctx, 2, 5),
    3: (r, ctx) => hausAlle(r, ctx, r.int(3, 5), 'zufall'),
  },

  'M-ZE-02': {
    1: (r, ctx) => schuettelbox(r, ctx, 6, 10),
    2: (r, ctx) => {
      const n = r.int(4, 10), a = r.int(1, n - 1), b = n - a;
      const modus = r.pick(['rechts', 'links', 'dach']);
      const zh = begriff(ctx, 'zerlegungshaus');
      const visual = modus === 'dach' ? { art: 'zerlegungshaus', dach: '?', zeilen: [[a, b]] }
        : { art: 'zerlegungshaus', dach: n, zeilen: [modus === 'rechts' ? [a, '?'] : ['?', b]] };
      const l = modus === 'dach' ? n : modus === 'rechts' ? b : a;
      const teil = modus === 'rechts' ? a : b;
      return A.zahl({
        frage: `Welche Zahl fehlt im ${zh}?`, visual, loesung: l, bis: 10,
        hinweis: modus === 'dach' ? 'Oben steht, wie viele es zusammen sind.' : 'Die zwei Zahlen unten ergeben zusammen die Zahl oben.',
        erklaerung: `${a} und ${b} sind ${n}. Es fehlt die ${l}.`,
        sig: sig(n, a, modus), daten: { dach: n, a, b, modus },
        fehlerbilder: modus === 'dach'
          ? fehlerbilder(l, 10, [a, 'Oben stehen beide Teile zusammen.'], [b, 'Oben stehen beide Teile zusammen.'], [n + 1, 'Zähle nochmals genau.'], [n - 1, 'Zähle nochmals genau.'])
          : fehlerbilder(l, 10, [n, 'Oben steht das Ganze. Gesucht ist der fehlende Teil.'], [n + teil, `Hier wird nicht zusammengezählt. ${teil} und wie viele sind ${n}?`],
            [teil, `${teil} steht schon da. ${teil} und wie viele sind ${n}?`], [l + 1, `Prüfe: ${teil} und ${l + 1} sind mehr als ${n}.`], [l - 1 >= 1 ? l - 1 : null, `Prüfe: ${teil} und ${l - 1} sind weniger als ${n}.`]),
      });
    },
    // Alle Zerlegungen ohne 0 (Annahme: «0 und n» gehört nicht dazu, bei der Lehrperson zu prüfen)
    3: (r, ctx) => hausAlle(r, ctx, r.int(3, 10), 'rechts'),
  },

  'M-ZE-03': {
    1: (r, ctx) => kraftFuenfBild(r, ctx),
    2: (r, ctx) => {
      const n = r.int(16, 20), e = n - 15, modus = r.pick(['teil', 'fuenfzehn', 'ganz']);
      const visual = { art: 'zwanzigerfeld', rot: 15, blau: e, weg: 0 };
      const pl = begriff(ctx, 'plaettchen');
      if (modus === 'ganz') {
        return A.zahl({
          frage: `Wie viele ${pl} sind im ${begriff(ctx, 'zwanzigerfeld')}?`, visual, loesung: n, bis: 20,
          hinweis: 'Rot sind eine volle Reihe und ein Fünfer, das sind 15. Zähle von 15 aus weiter.',
          erklaerung: `15 und ${e} sind ${n}.`,
          sig: sig(n, modus), daten: { n, modus },
          fehlerbilder: fehlerbilder(n, 20, [e, `Das sind nur die blauen. Rot sind noch 15.`], [10 + e, 'Rot sind nicht 10, sondern eine volle Reihe und ein Fünfer: 15.'], [n + 1, 'Schau nochmals genau.'], [n - 1, 'Schau nochmals genau.']),
        });
      }
      const teil = modus === 'teil';
      return A.zahl({
        frage: teil ? `${n} ist 15 und wie viele?` : `${n} ist wie viele und ${e}?`, zeige: teil ? `${n} = 15 + _` : `${n} = _ + ${e}`, visual, loesung: teil ? e : 15, bis: 20,
        hinweis: teil ? '15 sind die roten: eine volle Reihe und ein Fünfer. Wie viele kommen dazu?' : 'Zähle die roten: eine volle Reihe und ein Fünfer.',
        erklaerung: `${n} ist 15 und ${e}.`,
        sig: sig(n, modus), daten: { n, modus },
        fehlerbilder: teil
          ? fehlerbilder(e, 20, [n, `${n} ist das Ganze. Was kommt zu 15 dazu?`], [15, '15 steht schon da. Was kommt zu 15 dazu?'])
          : fehlerbilder(15, 20, [n, `${n} ist das Ganze. Gesucht ist der rote Teil.`], [10, 'Rot ist mehr als eine Reihe: eine volle Reihe und noch ein Fünfer.']),
      });
    },
    3: (r, ctx) => {
      const n = r.int(6, 10), e = n - 5;
      const form = r.pick([`${n} = 5 + _`, `${n} = _ + 5`, `5 + _ = ${n}`, `_ + 5 = ${n}`]);
      return A.zahl({
        frage: `${n} ist 5 und wie viele?`, zeige: form, loesung: e, bis: 10,
        visualNachFehler: { art: 'zehnerfeld', rot: 5, blau: e, weg: 0 },
        hinweis: `Denk an das ${begriff(ctx, 'zehnerfeld')}: Oben sind 5. Wie viele sind unten, damit es ${n} sind?`,
        erklaerung: `${n} ist 5 und ${e}: 5 + ${e} = ${n}.`,
        sig: sig(n, form), daten: { n },
        fehlerbilder: fehlerbilder(e, 10, [n, `${n} ist das Ganze. 5 und wie viele sind ${n}?`], [5, '5 steht schon da. Was kommt zu 5 dazu?'],
          [e + 1, `Prüfe: 5 + ${e + 1} ist mehr als ${n}.`], [e - 1 >= 1 ? e - 1 : null, `Prüfe: 5 + ${e - 1} ist weniger als ${n}.`]),
      });
    },
  },

  'M-ZE-04': {
    1: (r, ctx) => {
      const a = r.int(1, 9), farbig = r.bool();
      const visual = farbig ? { art: 'zehnerfeld', rot: Math.min(a, 5), blau: Math.max(0, a - 5), weg: 0 } : { art: 'zehnerfeld', rot: a, blau: 0, weg: 0 };
      const pl = begriff(ctx, 'plaettchen');
      return A.zahl({
        frage: `Im ${begriff(ctx, 'zehnerfeld')} ${sind(a)} ${a} ${pl}. Wie viele fehlen bis 10?`, visual, loesung: 10 - a, bis: 10,
        hinweis: 'Zähle die leeren Felder.',
        erklaerung: `${a} und ${10 - a} sind 10.`,
        sig: sig(a, farbig), daten: { a, ziel: 10 },
        fehlerbilder: fehlerbilder(10 - a, 10, [a, 'Das sind die Plättchen, die schon da sind. Zähle die leeren Felder.'],
          [10, '10 ist das ganze Feld. Gesucht sind nur die leeren Felder.'], [11 - a, 'Zähle die leeren Felder nochmals genau.'], [9 - a >= 1 ? 9 - a : null, 'Zähle die leeren Felder nochmals genau.']),
      });
    },
    2: (r, ctx) => {
      const a = r.int(1, 9), vorn = r.bool();
      return A.zahl({
        frage: `${a} und wie viele sind 10?`, zeige: vorn ? `${a} + _ = 10` : `_ + ${a} = 10`, loesung: 10 - a, bis: 10,
        visualNachFehler: { art: 'zehnerfeld', rot: a, blau: 0, weg: 0 },
        hinweis: `Denk an das ${begriff(ctx, 'zehnerfeld')}: ${a} ${sind(a)} schon da. Wie viele Felder sind noch leer?`,
        erklaerung: `${a} + ${10 - a} = 10.`,
        sig: sig(a, vorn), daten: { a, ziel: 10 },
        fehlerbilder: fehlerbilder(10 - a, 10, [10, '10 ist das Ergebnis. Gesucht ist, was noch fehlt.'], [a, `${a} steht schon da. Was fehlt bis 10?`],
          [11 - a, `Prüfe: ${a} + ${11 - a} ist mehr als 10.`], [9 - a >= 1 ? 9 - a : null, `Prüfe: ${a} + ${9 - a} ist weniger als 10.`]),
      });
    },
    3: (r, ctx) => {
      const a = r.int(11, 19), vorn = r.bool(), l = 20 - a;
      return A.zahl({
        frage: `${a} und wie viele sind 20?`, zeige: vorn ? `${a} + _ = 20` : `_ + ${a} = 20`, loesung: l, bis: 20,
        visualNachFehler: { art: 'zwanzigerfeld', rot: a, blau: 0, weg: 0 },
        hinweis: `Denk an ${a - 10} + _ = 10.`,
        erklaerung: `${a} + ${l} = 20, denn ${a - 10} + ${l} = 10.`,
        sig: sig(a, vorn), daten: { a, ziel: 20 },
        fehlerbilder: fehlerbilder(l, 20, [20, '20 ist das Ergebnis. Gesucht ist, was noch fehlt.'], [a, `${a} steht schon da. Was fehlt bis 20?`],
          [a - 10, `${a - 10} sind die Einer von ${a}. Gesucht ist, was bis 20 fehlt.`], [10 + l, `Von ${a} bis 20 ist es weniger als 10.`],
          [l + 1, `Prüfe: ${a} + ${l + 1} ist mehr als 20.`], [l - 1 >= 1 ? l - 1 : null, `Prüfe: ${a} + ${l - 1} ist weniger als 20.`]),
      });
    },
  },

  'M-ZE-05': {
    1: (r) => {
      const a = r.int(1, 5), bildArt = r.pick(['wuerfelbild', 'zehnerfeld', 'dinge']);
      const d = r.pick(DINGE);
      const visual = bildArt === 'wuerfelbild' ? { art: 'wuerfelbild', n: [a, a] }
        : bildArt === 'zehnerfeld' ? { art: 'zehnerfeld', rot: a, blau: a, weg: 0, anordnung: 'reihen' }
          : { art: 'dinge', bild: d[0], n: 2 * a, gruppen: [a, a] };
      return A.zahl({
        frage: `Verdopple: Wie viel ist ${a} und noch einmal ${a}?`, zeige: `${a} + ${a} = _`, visual, loesung: 2 * a, bis: 10,
        hinweis: bildArt === 'wuerfelbild' ? 'Zähle die Augen auf beiden Würfeln zusammen.' : 'Beide Seiten sind gleich. Zähle alle zusammen.',
        erklaerung: `Das Doppelte von ${a} ist ${2 * a}: ${a} + ${a} = ${2 * a}.`,
        bilder: bildArt === 'dinge' ? [d[0]] : undefined,
        sig: sig(a, bildArt, bildArt === 'dinge' ? d[1] : ''), daten: { a },
        fehlerbilder: fehlerbilder(2 * a, 10, [a, 'Das ist nur eine Seite. Verdoppeln heisst: zweimal so viel.'],
          [2 * a + 1, 'Zähle nochmals genau.'], [2 * a - 1, 'Zähle nochmals genau.']),
      });
    },
    2: (r, ctx) => {
      const a = r.int(1, 10), mitBild = a >= 6 && r.bool();
      return A.zahl({
        frage: `Was ist das Doppelte von ${a}?`, zeige: `${a} + ${a} = _`, loesung: 2 * a, bis: 20,
        visual: mitBild ? { art: 'zwanzigerfeld', rot: a, blau: a, weg: 0, anordnung: 'reihen' } : undefined,
        visualNachFehler: mitBild ? undefined : { art: 'zwanzigerfeld', rot: a, blau: a, weg: 0, anordnung: 'reihen' },
        hinweis: a >= 6 ? `${a} ist 5 und ${a - 5}. Zweimal 5 sind 10. Dazu zweimal ${a - 5}.` : `Zähle ${a} und noch einmal ${a}.`,
        erklaerung: `Das Doppelte von ${a} ist ${2 * a}: ${a} + ${a} = ${2 * a}.`,
        sig: sig(a, mitBild), daten: { a },
        fehlerbilder: fehlerbilder(2 * a, 20, [a, 'Das ist nur einmal. Verdoppeln heisst: zweimal so viel.'],
          [2 * a + 1, `Prüfe: ${a} + ${a} ist eine gerade Zahl.`], [2 * a - 1, `Prüfe: ${a} + ${a} ist eine gerade Zahl.`]),
      });
    },
    3: (r, ctx) => {
      const a = r.int(1, 10), n = 2 * a, haus = r.bool();
      const d = r.pick(DINGE);
      return A.zahl({
        frage: `Halbiere ${n}: Teile ${n} in zwei gleich grosse Zahlen.`,
        zeige: haus ? undefined : `_ + _ = ${n}`,
        visual: haus ? { art: 'zerlegungshaus', dach: n, zeilen: [['?', '?']] } : undefined,
        visualNachFehler: { art: 'dinge', bild: d[0], n },
        loesung: [a, a], bis: 20,
        hinweis: `Beide Zahlen sind gleich gross. Welche Zahl und noch einmal dieselbe Zahl ergeben ${n}?`,
        erklaerung: `Die Hälfte von ${n} ist ${a}, denn ${a} + ${a} = ${n}.`,
        bilder: [d[0]], sig: sig(n, haus), daten: { n },
      });
    },
  },

  'M-ZE-06': {
    1: (r) => {
      const d = r.pick(DINGE);
      const uebrig = r.bool();   // gesucht: das Bild, bei dem eines übrig bleibt (sonst: bei dem keines übrig bleibt)
      const passend = (x) => (x % 2 === 1) === uebrig;
      const pool = Array.from({ length: 9 }, (_, i) => i + 2);
      const x = r.pick(pool.filter(passend));
      const andere = r.sample(pool.filter((y) => !passend(y)), 2);
      const bild = (n) => ({ visual: { art: 'dinge', bild: d[0], n, gruppen: [...Array(Math.floor(n / 2)).fill(2), ...(n % 2 ? [1] : [])] } });
      const opt = auswahl(r, bild(x), andere.map(bild), 3);
      const frage = uebrig ? `Immer zwei ${d[2]} sind ein Paar. Wo bleibt ${EIN[d[3]]} ${d[1]} übrig?` : `Immer zwei ${d[2]} sind ein Paar. Wo bleibt ${KEIN[d[3]]} übrig?`;
      return A.wahlBild({
        frage: frage + ' Tippe auf das Bild.', ...opt,
        hinweis: `Schau bei jedem Bild: Hat ${JEDER[d[3]]} ${d[1]} einen Partner?`,
        erklaerung: uebrig ? `${x} ist ungerade: ${x} ${d[2]} sind ${Math.floor(x / 2)} Paare, und ${EIN[d[3]]} ${d[1]} bleibt übrig.`
          : `${x} ist gerade: ${x} ${d[2]} sind ${x / 2} Paare, und ${KEIN[d[3]]} bleibt übrig.`,
        bilder: [d[0]], sig: sig(d[1], uebrig, x, ...andere.slice().sort((p, q) => p - q)), daten: { gesucht: x, andere, uebrig },
        fehlerbilder: opt.optionen.filter((_, i) => i !== opt.richtig).map((o) => fbOption(o,
          uebrig ? `Hier hat ${JEDER[d[3]]} ${d[1]} einen Partner.` : `Hier bleibt ${EIN[d[3]]} ${d[1]} übrig.`)),
      });
    },
    2: (r) => {
      const gerade = r.bool();
      const pool = Array.from({ length: 20 }, (_, i) => i + 1);
      const x = r.pick(pool.filter((y) => (y % 2 === 0) === gerade));
      const andere = r.sample(pool.filter((y) => (y % 2 === 0) !== gerade), 2);
      const opt = auswahl(r, { text: String(x) }, andere.map((y) => ({ text: String(y) })), 3);
      return A.wahlBild({
        frage: gerade ? 'Welche Zahl ist gerade?' : 'Welche Zahl ist ungerade?', ...opt,
        hinweis: gerade ? 'Gerade Zahlen enden mit 0, 2, 4, 6 oder 8.' : 'Ungerade Zahlen enden mit 1, 3, 5, 7 oder 9.',
        erklaerung: gerade ? `${x} ist gerade: ${x} ist ${x / 2} und ${x / 2}.` : `${x} ist ungerade: Macht man Paare, bleibt eines übrig.`,
        sig: sig(gerade, x, ...andere.slice().sort((p, q) => p - q)), daten: { gesucht: x, andere, gerade },
        fehlerbilder: andere.map((y) => fbOption({ text: String(y) }, `${y} ist ${gerade ? 'ungerade' : 'gerade'}.`)),
      });
    },
    3: (r) => {
      const s = r.int(1, 12), gerade = s % 2 === 0;
      const zahlen = [0, 1, 2, 3, 4].map((i) => s + 2 * i);   // höchstens 20
      const luecke = r.bool(0.6) ? 4 : r.int(1, 3);
      const folge = zahlen.map((x, i) => (i === luecke ? '?' : x));
      const l = zahlen[luecke];
      const sichtbar = zahlen.filter((x) => x !== l);
      const falsche = r.shuffle([l - 1, l + 1, l + 2, l - 2].filter((y) => y >= 1 && y <= 20 && !sichtbar.includes(y)));
      const opt = auswahl(r, l, falsche, 3);
      return A.muster({
        frage: luecke === 4 ? 'Wie geht die Reihe weiter?' : 'Welche Zahl fehlt in der Reihe?', folge, luecke, ...opt,
        hinweis: 'Von Zahl zu Zahl kommen immer 2 dazu.',
        erklaerung: `Die Reihe springt immer um 2: ${zahlen.join(', ')}. Das sind lauter ${gerade ? 'gerade' : 'ungerade'} Zahlen.`,
        sig: sig(s, luecke, ...opt.optionen.slice().sort((p, q) => p - q)), daten: { zahlen, luecke },
        fehlerbilder: fehlerbilder(l, 20, ...opt.optionen.filter((_, i) => i !== opt.richtig).map((y) => [y,
          (y % 2 === 0) !== gerade ? `${y} ist ${gerade ? 'ungerade' : 'gerade'}. In dieser Reihe sind alle Zahlen ${gerade ? 'gerade' : 'ungerade'}.`
            : `Prüfe: Von Zahl zu Zahl kommen immer 2 dazu.`])),
      });
    },
  },
};

