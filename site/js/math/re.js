// Mathematik RE: Rechnen (Plus und Minus bis 10 und 20, Zehnerübergang, Tausch- und Umkehraufgaben, Nachbaraufgaben,
// Platzhalter, Rechengeschichten, Zahlenmauern, Blitzrechnen, Rechnungen vergleichen)
import { A, sig, auswahl, fehlerbilder, NAMEN, DINGE, menge, PLUS, MINUS, GLEICH, LUECKE, rechnung } from './lib.js';

const begriff = (ctx, k, std) => ctx?.begriffe?.[k] || std;
const ding = (name) => DINGE.find((d) => d[1] === name);
const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const DATIV = { er: 'ihm', sie: 'ihr' };
const bleibt = (n) => (n === 1 ? 'bleibt' : 'bleiben');

// --- Darstellungen ---
const zehnerfeld = (rot, blau = 0, weg = 0) => ({ art: 'zehnerfeld', rot, blau, weg });
const zwanzigerfeld = (rot, blau = 0, weg = 0, anordnung) => (anordnung ? { art: 'zwanzigerfeld', rot, blau, weg, anordnung } : { art: 'zwanzigerfeld', rot, blau, weg });
const feldFuer = (rot, blau, weg, bis) => (Math.max(rot + blau, rot) <= 10 && bis <= 10 ? zehnerfeld(rot, blau, weg) : zwanzigerfeld(rot, blau, weg));

// --- Zahlenpaare ---
// Karteikarte aus dem Kontext lesen (nur wenn sie zum Muster passt)
function karte(ctx, muster) { const m = typeof ctx.karte === 'string' ? ctx.karte.match(muster) : null; return m ? m.slice(1).map(Number) : null; }
function plusBis(r, smin, smax) { const s = r.int(smin, smax); const a = r.int(1, s - 1); return [a, s - a, s]; }
function minusBis(r, amin, amax) { const a = r.int(amin, amax); const b = r.int(1, a - 1); return [a, b, a - b]; }
function plusUeber(r) { const a = r.int(2, 9); const b = r.int(11 - a, 9); return [a, b, a + b]; }          // mit Zehnerübergang
function minusUeber(r) { const a = r.int(11, 18); const b = r.int((a % 10) + 1, 9); return [a, b, a - b]; }  // mit Zehnerübergang

// Fehlerbilder für eine Plusaufgabe a + b = s
const fbPlus = (a, b, s, bis) => fehlerbilder(s, bis,
  [s - 1, 'Eins zu wenig. Zähle nochmals genau.'],
  [s + 1, 'Eins zu viel. Hast du eine Zahl doppelt gezählt?'],
  [a !== b ? Math.abs(a - b) : null, 'Bei Plus kommt etwas dazu. Dann wird es mehr.']);
// Fehlerbilder für eine Minusaufgabe a − b = c
const fbMinus = (a, b, c, bis) => fehlerbilder(c, bis,
  [a + b, 'Bei Minus wird etwas weggenommen. Dann wird es weniger.'],
  [c + 1, 'Eins zu viel. Zähle nochmals genau.'],
  [c - 1, 'Eins zu wenig. Zähle nochmals genau.']);

// Auswahl-Fehlerbilder für Optionen, die nicht stimmen
// Zahlen einer Rechnung als sortierte Liste: gleiche Liste heisst gleiche Rechenfamilie
const familie = (t) => (String(t).match(/\d+/g) || []).map(Number).sort((p, q) => p - q).join(',');
const fbOptionen = (optionen, richtig, text) => optionen.filter((o, i) => i !== richtig).map((o) => ({ eingabe: String(o), text: typeof text === 'function' ? text(o) : text }));

// --- Einfache Rechenaufgabe mit oder ohne Bild ---
function plusAufgabe(r, ctx, { a, b, visual = null, nachFehler = null, frage = null }) {
  const s = a + b;
  return A.zahl({
    frage: frage || `Wie viel ist ${a} + ${b}?`,
    zeige: rechnung(a, PLUS, b, GLEICH, LUECKE), loesung: s, bis: ctx.bis,
    ...(visual ? { visual } : {}), ...(nachFehler ? { visualNachFehler: nachFehler } : {}),
    hinweis: visual ? 'Zähle zuerst die ersten, dann zähle die zweiten weiter.' : `Zähle von ${Math.max(a, b)} aus weiter.`,
    erklaerung: `${a} + ${b} = ${s}.`,
    sig: sig(a, b), daten: { a, b, op: '+' },
    fehlerbilder: fbPlus(a, b, s, ctx.bis),
  });
}
function minusAufgabe(r, ctx, { a, b, visual = null, nachFehler = null, frage = null }) {
  const c = a - b;
  return A.zahl({
    frage: frage || `Wie viel ist ${a} − ${b}?`,
    zeige: rechnung(a, MINUS, b, GLEICH, LUECKE), loesung: c, bis: ctx.bis,
    ...(visual ? { visual } : {}), ...(nachFehler ? { visualNachFehler: nachFehler } : {}),
    hinweis: b > c ? `Zähle von ${b} bis ${a} weiter. Wie viele Schritte sind es?` : `Zähle von ${a} aus ${b === 1 ? 'einen Schritt' : `${b} Schritte`} rückwärts.`,
    erklaerung: `${a} − ${b} = ${c}.`,
    sig: sig(a, b), daten: { a, b, op: '−' },
    fehlerbilder: fbMinus(a, b, c, ctx.bis),
  });
}

// Dinge, die weggehen: [Name im Wortlexikon, Verb Einzahl, Verb Mehrzahl, Satz für «da sind»]
const WEGGEHEN = [
  ['Vogel', 'fliegt weg', 'fliegen weg', 'sitzen auf dem Ast'], ['Ente', 'schwimmt weg', 'schwimmen weg', 'schwimmen auf dem Weiher'],
  ['Fisch', 'schwimmt weg', 'schwimmen weg', 'schwimmen im Weiher'], ['Ballon', 'fliegt davon', 'fliegen davon', 'hängen am Zaun'],
  ['Biene', 'fliegt weg', 'fliegen weg', 'sitzen auf der Blume'], ['Schmetterling', 'fliegt weg', 'fliegen weg', 'sitzen auf der Wiese'],
  ['Frosch', 'hüpft weg', 'hüpfen weg', 'sitzen am Weiher'], ['Schaf', 'läuft weg', 'laufen weg', 'stehen auf der Weide'],
  ['Huhn', 'läuft weg', 'laufen weg', 'picken auf dem Hof'],
];

export const generatoren = {
  // Plus bis 10 mit Bild
  'M-RE-01': {
    1: (r, ctx) => {
      const [a, b, s] = plusBis(r, 2, 5);
      const P = begriff(ctx, 'plaettchen', 'Plättchen');
      const x = plusAufgabe(r, ctx, { a, b, visual: { art: 'plaettchen', rot: a, blau: b, weg: 0, anordnung: 'reihe' }, frage: `Rote und blaue ${P}: Wie viele sind es zusammen?` });
      x.hinweis = `Zähle zuerst die roten ${P}. Dann zähle die blauen weiter.`;
      x.erklaerung = `${a} + ${b} = ${s}. Zusammen sind es ${s} ${P}.`;
      return x;
    },
    2: (r, ctx) => {
      const [a, b, s] = plusBis(r, 4, 10);
      const P = begriff(ctx, 'plaettchen', 'Plättchen');
      const x = plusAufgabe(r, ctx, { a, b, visual: zwanzigerfeld(a, b), frage: `Wie viele ${P} sind es zusammen? Rechne ${a} + ${b}.` });
      x.hinweis = `Im ${begriff(ctx, 'zwanzigerfeld', 'Zwanzigerfeld')} sind immer fünf zusammen. Zähle die roten, dann die blauen weiter.`;
      x.erklaerung = `${a} rote und ${b} blaue: ${a} + ${b} = ${s}.`;
      return x;
    },
    3: (r, ctx) => {
      const [a, b, s] = plusBis(r, 3, 10);
      const d = r.pick(DINGE);
      const x = plusAufgabe(r, ctx, { a, b, visual: { art: 'dinge', bild: d[0], n: s, weg: 0, gruppen: [a, b] }, frage: `${menge(a, d)} und ${menge(b, d)}. Wie viele ${d[2]} sind es zusammen?` });
      x.hinweis = 'Zähle zuerst die linke Gruppe. Dann zähle die rechte Gruppe weiter.';
      x.erklaerung = `${a} + ${b} = ${s}. Es sind ${menge(s, d)}.`;
      x.bilder = [d[0]]; x.sig = sig(a, b, d[1]);
      return x;
    },
  },

  // Minus bis 10 mit Bild
  'M-RE-02': {
    1: (r, ctx) => {
      const [a, b, c] = minusBis(r, 2, 5);
      const P = begriff(ctx, 'plaettchen', 'Plättchen');
      const x = minusAufgabe(r, ctx, { a, b, visual: { art: 'plaettchen', rot: a, blau: 0, weg: b, anordnung: 'reihe' }, frage: `Die durchgestrichenen ${P} sind weg. Wie viele bleiben?` });
      x.hinweis = `Zähle nur die ${P}, die nicht durchgestrichen sind.`;
      x.erklaerung = `${a} − ${b} = ${c}. Es ${bleibt(c)} ${c}.`;
      x.fehlerbilder = fehlerbilder(c, ctx.bis, [b, 'Das sind die durchgestrichenen. Wie viele bleiben übrig?'], ...fbMinus(a, b, c, ctx.bis).map((f) => [Number(f.eingabe), f.text]));
      return x;
    },
    2: (r, ctx) => {
      const [a, b, c] = minusBis(r, 3, 10);
      const P = begriff(ctx, 'plaettchen', 'Plättchen');
      const x = minusAufgabe(r, ctx, { a, b, visual: zehnerfeld(a, 0, b), frage: `Die durchgestrichenen ${P} sind weg. Wie viele bleiben? Rechne ${a} − ${b}.` });
      x.hinweis = `Zähle nur die ${P}, die nicht durchgestrichen sind.`;
      x.erklaerung = `${a} − ${b} = ${c}. Es ${bleibt(c)} ${c}.`;
      x.fehlerbilder = fehlerbilder(c, ctx.bis, [b, 'Das sind die durchgestrichenen. Wie viele bleiben übrig?'], ...fbMinus(a, b, c, ctx.bis).map((f) => [Number(f.eingabe), f.text]));
      return x;
    },
    3: (r, ctx) => {
      const [a, b, c] = minusBis(r, 3, 10);
      const [name, v1, vn, ort] = r.pick(WEGGEHEN);
      const d = ding(name);
      const satz = `${menge(a, d)} ${ort}. ${b === 1 ? `1 ${d[1]} ${v1}` : `${b} ${d[2]} ${vn}`}. Wie viele bleiben da?`;
      const x = minusAufgabe(r, ctx, { a, b, visual: { art: 'dinge', bild: d[0], n: a, weg: b }, frage: satz });
      x.hinweis = `Schau das Bild an. Die durchgestrichenen sind weg. Zähle die anderen.`;
      x.erklaerung = `${a} − ${b} = ${c}. Es ${bleibt(c)} ${menge(c, d)}.`;
      x.bilder = [d[0]]; x.sig = sig(a, b, name);
      x.fehlerbilder = fehlerbilder(c, ctx.bis, [b, `So viele sind weg. Gesucht ist, wie viele noch da sind.`], ...fbMinus(a, b, c, ctx.bis).map((f) => [Number(f.eingabe), f.text]));
      return x;
    },
  },

  // Plus bis 10 ohne Bild (Bild erst nach dem ersten Versuch)
  'M-RE-03': {
    1: (r, ctx) => {
      const b = r.pick([1, 2]), a = r.int(1, 10 - b), s = a + b;
      const x = plusAufgabe(r, ctx, { a, b, nachFehler: zehnerfeld(a, b) });
      x.hinweis = `Zähle von ${a} aus ${b === 1 ? 'eins' : 'zwei'} weiter.`;
      x.fehlerbilder = fehlerbilder(s, ctx.bis, [s - 1, `Beim Weiterzählen zählst du die ${a} nicht mit. Fang nach der ${a} an.`], [s + 1, 'Eins zu viel. Zähle nochmals genau.'], [a > b ? a - b : null, 'Bei Plus wird es mehr.']);
      return x;
    },
    2: (r, ctx) => {
      const [a, b] = plusBis(r, 3, 10);
      return plusAufgabe(r, ctx, { a, b, nachFehler: zehnerfeld(a, b) });
    },
    3: (r, ctx) => {
      const s = r.int(4, 10), a = r.int(1, s - 2), b = r.int(1, s - a - 1), c = s - a - b;
      const d = r.pick(DINGE.slice(0, 12));
      return A.zahl({
        frage: `Wie viel ist ${a} + ${b} + ${c}?`,
        zeige: rechnung(a, PLUS, b, PLUS, c, GLEICH, LUECKE), loesung: s, bis: ctx.bis,
        visualNachFehler: { art: 'dinge', bild: d[0], n: s, weg: 0, gruppen: [a, b, c] },
        hinweis: `Rechne zuerst ${a} + ${b}. Dann rechne mit der ${c} weiter.`,
        erklaerung: `${a} + ${b} = ${a + b}. Dann ${a + b} + ${c} = ${s}.`,
        sig: sig(a, b, c), daten: { zahlen: [a, b, c], op: '+' }, bilder: [d[0]],
        fehlerbilder: fehlerbilder(s, ctx.bis, [a + b, `Das ist erst ${a} + ${b}. Die ${c} kommt noch dazu.`], [b + c, `Die ${a} am Anfang gehört auch dazu.`], [s - 1, 'Eins zu wenig.'], [s + 1, 'Eins zu viel.']),
      });
    },
  },

  // Minus bis 10 ohne Bild
  'M-RE-04': {
    1: (r, ctx) => {
      const b = r.pick([1, 2]), a = r.int(b + 1, 10), c = a - b;
      const x = minusAufgabe(r, ctx, { a, b, nachFehler: zehnerfeld(a, 0, b) });
      x.hinweis = b === 1 ? `Zähle von ${a} aus einen Schritt rückwärts.` : `Zähle von ${a} aus zwei Schritte rückwärts.`;
      x.fehlerbilder = fehlerbilder(c, ctx.bis, [c + 1, `Beim Rückwärtszählen zählst du die ${a} nicht mit.`], [c - 1, 'Eins zu wenig.'], [a + b, 'Bei Minus wird es weniger.']);
      return x;
    },
    2: (r, ctx) => {
      const [a, b] = minusBis(r, 2, 10);
      return minusAufgabe(r, ctx, { a, b, nachFehler: zehnerfeld(a, 0, b) });
    },
    3: (r, ctx) => {
      // von 10 aus oder mit Ergebnis 0
      const vonZehn = r.bool();
      const a = vonZehn ? 10 : r.int(1, 9);
      const b = vonZehn ? r.int(1, 10) : a;
      const c = a - b;
      const x = minusAufgabe(r, ctx, { a, b, nachFehler: zehnerfeld(a, 0, b) });
      if (c === 0) {
        x.hinweis = `Von ${a} nimmst du alle ${a} weg. Wie viele bleiben übrig?`;
        x.erklaerung = `${a} − ${a} = 0. Wenn alle weg sind, bleibt nichts übrig.`;
        x.fehlerbilder = fehlerbilder(0, ctx.bis, [a, 'Es werden alle weggenommen. Dann bleibt keines mehr.'], [1, 'Schau nochmals: Es werden alle weggenommen.']);
      } else {
        x.hinweis = `Denk an das ${begriff(ctx, 'zehnerfeld', 'Zehnerfeld')}: Von 10 nimmst du ${b} weg.`;
      }
      return x;
    },
  },

  // Plus und Minus bis 20 ohne Zehnerübergang
  'M-RE-05': {
    1: (r, ctx) => {
      const a = r.int(11, 18), b = r.int(1, 9 - (a % 10)), s = a + b;
      const x = plusAufgabe(r, ctx, { a, b, visual: zwanzigerfeld(a, b) });
      x.hinweis = `Der Zehner bleibt. Rechne mit den Einern: ${a % 10} + ${b}.`;
      x.erklaerung = `${a % 10} + ${b} = ${(a % 10) + b}, also ${a} + ${b} = ${s}.`;
      x.fehlerbilder = fehlerbilder(s, ctx.bis, [(a % 10) + b, 'Das sind nur die Einer. Der Zehner gehört auch dazu.'], [s - 1, 'Eins zu wenig.'], [s + 1, 'Eins zu viel.'], [a - b, 'Bei Plus wird es mehr.']);
      return x;
    },
    2: (r, ctx) => {
      if (r.bool()) {
        const a = r.int(11, 18), b = r.int(1, 9 - (a % 10)), s = a + b;
        const x = plusAufgabe(r, ctx, { a, b, nachFehler: zwanzigerfeld(a, b) });
        x.hinweis = `Der Zehner bleibt. Rechne mit den Einern: ${a % 10} + ${b}.`;
        x.erklaerung = `${a % 10} + ${b} = ${(a % 10) + b}, also ${a} + ${b} = ${s}.`;
        x.fehlerbilder = fehlerbilder(s, ctx.bis, [(a % 10) + b, 'Das sind nur die Einer. Der Zehner gehört auch dazu.'], [s - 1, 'Eins zu wenig.'], [s + 1, 'Eins zu viel.'], [a - b, 'Bei Plus wird es mehr.']);
        return x;
      }
      const a = r.int(11, 19), b = r.int(1, a % 10), c = a - b;
      const x = minusAufgabe(r, ctx, { a, b, nachFehler: zwanzigerfeld(a, 0, b) });
      x.hinweis = `Der Zehner bleibt. Rechne mit den Einern: ${a % 10} − ${b}.`;
      x.erklaerung = `${a % 10} − ${b} = ${(a % 10) - b}, also ${a} − ${b} = ${c}.`;
      x.fehlerbilder = fehlerbilder(c, ctx.bis, [(a % 10) - b > 0 ? (a % 10) - b : null, 'Das sind nur die Einer. Der Zehner bleibt stehen.'], [a + b, 'Bei Minus wird es weniger.'], [c + 1, 'Eins zu viel.'], [c - 1, 'Eins zu wenig.']);
      return x;
    },
    3: (r, ctx) => {
      // verwandte Aufgabe: 3 + 4 = 7, also 13 + 4 = 17
      const plus = r.bool();
      let x, b, y;
      if (plus) { x = r.int(1, 8); b = r.int(1, 9 - x); y = x + b; } else { x = r.int(2, 9); b = r.int(1, x - 1); y = x - b; }
      const op = plus ? PLUS : MINUS;
      const l = y + 10;
      return A.zahl({
        frage: `${x} ${op} ${b} = ${y}. Wie viel ist dann ${x + 10} ${op} ${b}?`,
        zeige: [rechnung(x, op, b, GLEICH, y), rechnung(x + 10, op, b, GLEICH, LUECKE)], loesung: l, bis: ctx.bis,
        visualNachFehler: plus ? zwanzigerfeld(x + 10, b) : zwanzigerfeld(x + 10, 0, b),
        hinweis: `Schau die obere Rechnung an. Unten steht ein Zehner mehr.`,
        erklaerung: `${x} ${op} ${b} = ${y}, also ist ${x + 10} ${op} ${b} = ${l}. Der Zehner kommt dazu.`,
        sig: sig(x, op, b), daten: { a: x + 10, b, op: plus ? '+' : '−', hilfe: [x, b, y] },
        fehlerbilder: fehlerbilder(l, ctx.bis, [y, 'Das ist das Ergebnis der oberen Rechnung. Unten ist noch ein Zehner mehr.'], [l + 1, 'Eins zu viel.'], [l - 1, 'Eins zu wenig.']),
      });
    },
  },

  // Plus mit Zehnerübergang
  'M-RE-06': {
    1: (r, ctx) => zehnerPlus(r, ctx, 'bild'),
    2: (r, ctx) => zehnerPlus(r, ctx, 'schritte'),
    3: (r, ctx) => zehnerPlus(r, ctx, 'ohne'),
  },
  // Minus mit Zehnerübergang
  'M-RE-07': {
    1: (r, ctx) => zehnerMinus(r, ctx, 'bild'),
    2: (r, ctx) => zehnerMinus(r, ctx, 'schritte'),
    3: (r, ctx) => zehnerMinus(r, ctx, 'ohne'),
  },

  // Tauschaufgaben
  'M-RE-08': {
    1: (r) => {
      // drei Paare mit verschiedenen Ergebnissen, damit nur die Tauschaufgabe passt
      const paare = [];
      const summen = new Set();
      for (let v = 0; paare.length < 3 && v < 500; v++) {
        const [a, b, s] = plusBis(r, 3, 10);
        if (a === b || summen.has(s)) continue;
        summen.add(s); paare.push([a, b]);
      }
      return A.zuordnen({
        frage: 'Welche Aufgaben gehören zusammen? Verbinde jede Aufgabe mit ihrer Tauschaufgabe.',
        paare: paare.map(([a, b]) => [{ text: rechnung(a, PLUS, b) }, { text: rechnung(b, PLUS, a) }]),
        hinweis: 'Eine Tauschaufgabe hat die gleichen zwei Zahlen, nur die Plätze sind getauscht.',
        erklaerung: paare.map(([a, b]) => `${a} + ${b} und ${b} + ${a}`).join(', ') + ' gehören zusammen. Sie geben gleich viel.',
        sig: sig(...paare.flat()), daten: { paare },
      });
    },
    2: (r) => {
      let a, b;
      do { [a, b] = plusBis(r, 3, 9); } while (a === b);
      const richtig = rechnung(b, PLUS, a);
      const falsche = [
        a > b ? rechnung(a, MINUS, b) : rechnung(b, MINUS, a),
        b + a + 1 <= 10 ? rechnung(b, PLUS, a + 1) : rechnung(b, PLUS, a - 1),
        a + b + 1 <= 10 ? rechnung(b + 1, PLUS, a) : rechnung(b - 1, PLUS, a),
      ].filter((t) => !/(^| )0( |$)/.test(t));
      const o = auswahl(r, richtig, falsche, 3);
      return A.wahlWort({
        frage: `Welche Aufgabe ist die Tauschaufgabe von ${a} + ${b}?`,
        zeige: rechnung(a, PLUS, b), ...o,
        hinweis: 'Bei der Tauschaufgabe sind die zwei Zahlen gleich, nur die Plätze getauscht. Das Zeichen bleibt Plus.',
        erklaerung: `${b} + ${a} ist die Tauschaufgabe von ${a} + ${b}. Beide geben ${a + b}.`,
        sig: sig(a, b), daten: { a, b },
        fehlerbilder: fbOptionen(o.optionen, o.richtig, (t) => (t.includes(MINUS) ? 'Bei der Tauschaufgabe bleibt das Plus.' : 'Schau die Zahlen genau an. Es müssen die gleichen zwei Zahlen sein.')),
      });
    },
    3: (r, ctx) => {
      const a = r.int(1, 3), b = r.int(Math.max(a + 4, 6), 20 - a), s = a + b;
      return A.zahl({
        frage: `Wie viel ist ${a} + ${b}? Tauschen hilft.`,
        zeige: rechnung(a, PLUS, b, GLEICH, LUECKE), loesung: s, bis: ctx.bis,
        visualNachFehler: zwanzigerfeld(b, a),
        hinweis: `Tausche die Zahlen: ${b} + ${a} ist leichter. Zähle von ${b} aus weiter.`,
        erklaerung: `${a} + ${b} gibt gleich viel wie ${b} + ${a}. ${b} + ${a} = ${s}.`,
        sig: sig(a, b), daten: { a, b, op: '+' },
        fehlerbilder: fehlerbilder(s, ctx.bis, [s - 1, `Beim Weiterzählen zählst du die ${b} nicht mit.`], [s + 1, 'Eins zu viel.'], [b - a, 'Bei Plus wird es mehr.']),
      });
    },
  },

  // Umkehraufgaben und Rechenfamilien
  'M-RE-09': {
    1: (r) => {
      let a, b, s;
      do { [a, b, s] = plusBis(r, 3, 10); } while (a === b);
      const zuerst = r.bool() ? b : a;   // welche Zahl abgezogen wird
      const richtig = `${s} ${MINUS} ${zuerst} ${GLEICH} ${s - zuerst}`;
      const falsche = [`${Math.max(a, b)} ${MINUS} ${Math.min(a, b)} ${GLEICH} ${Math.abs(a - b)}`];
      const andere = [];
      for (let x = 1; x < s; x++) if (x !== a && x !== b) andere.push(x);
      if (andere.length) { const x = r.pick(andere); falsche.push(`${s} ${MINUS} ${x} ${GLEICH} ${s - x}`); }
      if (s + 1 <= 10) falsche.push(`${s + 1} ${MINUS} ${zuerst} ${GLEICH} ${s + 1 - zuerst}`);
      const o = auswahl(r, richtig, r.shuffle(falsche.filter((t) => familie(t) !== familie(richtig))), 3);
      return A.wahlWort({
        frage: `Welche Minusaufgabe gehört zu ${a} + ${b} = ${s}?`,
        zeige: rechnung(a, PLUS, b, GLEICH, s), ...o,
        hinweis: 'Die Minusaufgabe braucht die gleichen drei Zahlen wie die Plusaufgabe.',
        erklaerung: `${a} + ${b} = ${s}, also ist ${richtig}. Es sind die gleichen drei Zahlen.`,
        sig: sig(a, b, zuerst), daten: { a, b, s },
        fehlerbilder: fbOptionen(o.optionen, o.richtig, `Diese Rechnung stimmt, aber sie hat nicht die Zahlen ${a}, ${b} und ${s}.`),
      });
    },
    2: (r) => {
      let a, b, s;
      do { [a, b, s] = plusBis(r, 3, 10); } while (a === b);
      const minusLegen = r.bool();
      const kacheln = r.shuffle([a, b, s].map(String));
      if (minusLegen) {
        return A.legen({
          frage: `${a}, ${b} und ${s} sind eine Rechenfamilie. Lege eine Minusaufgabe mit diesen Zahlen.`,
          zeige: rechnung(a, PLUS, b, GLEICH, s),
          kacheln, vorlage: [null, MINUS, null, GLEICH, null],
          loesung: [s, a, b].map(String), alternativen: [[s, b, a].map(String)],
          hinweis: `Bei Minus steht die grösste Zahl vorn: ${s}.`,
          erklaerung: `${s} − ${a} = ${b} und ${s} − ${b} = ${a} gehören zur Familie.`,
          sig: sig(a, b, 'minus'), daten: { a, b, s, op: '−' },
        });
      }
      return A.legen({
        frage: `${a}, ${b} und ${s} sind eine Rechenfamilie. Lege eine Plusaufgabe mit diesen Zahlen.`,
        zeige: rechnung(s, MINUS, a, GLEICH, b),
        kacheln, vorlage: [null, PLUS, null, GLEICH, null],
        loesung: [a, b, s].map(String), alternativen: [[b, a, s].map(String)],
        hinweis: `Bei Plus steht die grösste Zahl hinten, nach dem Gleich.`,
        erklaerung: `${a} + ${b} = ${s} und ${b} + ${a} = ${s} gehören zur Familie.`,
        sig: sig(a, b, 'plus'), daten: { a, b, s, op: '+' },
      });
    },
    3: (r) => {
      // Probe mit der Umkehraufgabe bis 20
      if (r.bool()) {
        const a = r.int(11, 20), b = r.int(2, 9), c = a - b;
        const richtig = `${c} ${PLUS} ${b} ${GLEICH} ${a}`;
        const falsche = [];
        if (a + b <= 20) falsche.push(`${a} ${PLUS} ${b} ${GLEICH} ${a + b}`);
        if (c + a <= 20) falsche.push(`${c} ${PLUS} ${a} ${GLEICH} ${c + a}`);
        if (c > b) falsche.push(`${c} ${MINUS} ${b} ${GLEICH} ${c - b}`);
        if (c + 1 + b <= 20) falsche.push(`${c + 1} ${PLUS} ${b} ${GLEICH} ${c + 1 + b}`);
        if (c - 1 >= 1) falsche.push(`${c - 1} ${PLUS} ${b} ${GLEICH} ${c - 1 + b}`);
        const o = auswahl(r, richtig, r.shuffle(falsche.filter((t) => familie(t) !== familie(richtig))), 3);
        return A.wahlWort({
          frage: `Mach die Probe zu ${a} − ${b} = ${c}. Welche Plusaufgabe passt?`,
          zeige: rechnung(a, MINUS, b, GLEICH, c), ...o,
          hinweis: 'Bei der Probe rechnest du umgekehrt: Plus statt Minus, mit den gleichen drei Zahlen.',
          erklaerung: `Probe: ${c} + ${b} = ${a}. Also stimmt ${a} − ${b} = ${c}.`,
          sig: sig('m', a, b), daten: { a, b, c, gegeben: '−' },
          fehlerbilder: fbOptionen(o.optionen, o.richtig, `Für die Probe brauchst du die Zahlen ${a}, ${b} und ${c} und ein Plus.`),
        });
      }
      const z = r.int(11, 20), y = r.int(2, 9), x = z - y;
      const richtig = `${z} ${MINUS} ${y} ${GLEICH} ${x}`;
      const falsche = [];
      if (x !== y) falsche.push(`${Math.max(x, y)} ${MINUS} ${Math.min(x, y)} ${GLEICH} ${Math.abs(x - y)}`);
      if (z - y - 1 >= 1) falsche.push(`${z} ${MINUS} ${y + 1} ${GLEICH} ${z - y - 1}`);
      if (z + y <= 20) falsche.push(`${z} ${PLUS} ${y} ${GLEICH} ${z + y}`);
      if (z - y + 1 <= 20 && y - 1 >= 1) falsche.push(`${z} ${MINUS} ${y - 1} ${GLEICH} ${z - y + 1}`);
      const o = auswahl(r, richtig, r.shuffle(falsche.filter((t) => familie(t) !== familie(richtig))), 3);
      return A.wahlWort({
        frage: `Mach die Probe zu ${x} + ${y} = ${z}. Welche Minusaufgabe passt?`,
        zeige: rechnung(x, PLUS, y, GLEICH, z), ...o,
        hinweis: 'Bei der Probe rechnest du umgekehrt: Minus statt Plus. Nimm die Zahl wieder weg, die dazugekommen ist.',
        erklaerung: `Probe: ${z} − ${y} = ${x}. Also stimmt ${x} + ${y} = ${z}.`,
        sig: sig('p', x, y), daten: { a: x, b: y, c: z, gegeben: '+' },
        fehlerbilder: fbOptionen(o.optionen, o.richtig, `Für die Probe brauchst du die Zahlen ${x}, ${y} und ${z} und ein Minus.`),
      });
    },
  },

  // Nachbaraufgaben
  'M-RE-10': {
    1: (r, ctx) => nachbar(r, ctx, 'bild'),
    2: (r, ctx) => nachbar(r, ctx, 'ohne'),
    3: (r, ctx) => {
      const d = r.int(2, 9), vorn = r.bool();
      const [a, b] = vorn ? [d, d + 1] : [d + 1, d];
      const s = a + b;
      return A.zahl({
        frage: `Wie viel ist ${a} + ${b}?`,
        zeige: rechnung(a, PLUS, b, GLEICH, LUECKE), loesung: s, bis: ctx.bis,
        visualNachFehler: zwanzigerfeld(a, b, 0, 'reihen'),
        hinweis: `Denk an ${d} + ${d}. Dann ist es eins mehr.`,
        erklaerung: `${d} + ${d} = ${2 * d}. Eins mehr ist ${s}. Also ${a} + ${b} = ${s}.`,
        sig: sig(a, b), daten: { a, b, op: '+', doppel: d },
        fehlerbilder: fehlerbilder(s, ctx.bis, [2 * d, `Das ist ${d} + ${d}. Hier ist es eins mehr.`], [2 * d + 2, `Das ist ${d + 1} + ${d + 1}. Hier ist es eins weniger.`], [s + 1, 'Eins zu viel.']),
      });
    },
  },

  // Platzhalteraufgaben
  'M-RE-11': {
    1: (r, ctx) => platzhalterPlus(r, ctx, plusBis(r, 3, 10), 'bild'),
    2: (r, ctx) => (r.bool() ? platzhalterPlus(r, ctx, plusBis(r, 3, 10), 'ohne') : platzhalterMinus(r, ctx, minusBis(r, 3, 10))),
    3: (r, ctx) => (r.bool() ? platzhalterPlus(r, ctx, plusBis(r, 11, 20), 'ohne') : platzhalterMinus(r, ctx, minusBis(r, 11, 20))),
  },

  // Rechengeschichten
  'M-RE-12': {
    1: (r, ctx) => geschichte(r, ctx, 'dazu', 'zahl'),
    2: (r, ctx) => geschichte(r, ctx, 'dazu', 'legen'),
    3: (r, ctx) => geschichte(r, ctx, r.bool() ? 'weg' : 'ergaenzen', 'zahl'),
  },

  // Zahlenmauern
  'M-RE-13': {
    1: (r, ctx) => {
      const [a, b, s] = plusBis(r, 2, 10);
      const ZM = begriff(ctx, 'zahlenmauer', 'Zahlenmauer');
      return A.zahl({
        frage: `In der ${ZM} ergeben die zwei Steine unten zusammen den Stein oben. Welche Zahl gehört oben hin?`,
        visual: { art: 'zahlenmauer', reihen: [['?'], [a, b]] }, loesung: s, bis: ctx.bis,
        hinweis: `Rechne die zwei Steine unten zusammen: ${a} + ${b}.`,
        erklaerung: `${a} + ${b} = ${s}. Oben steht ${s}.`,
        sig: sig(a, b), daten: { reihen: [[s], [a, b]] },
        fehlerbilder: fbPlus(a, b, s, ctx.bis),
      });
    },
    2: (r, ctx) => {
      const [a, b, s] = plusBis(r, 3, 10);
      const links = r.bool();
      const bekannt = links ? b : a, fehlt = links ? a : b;
      const ZM = begriff(ctx, 'zahlenmauer', 'Zahlenmauer');
      return A.zahl({
        frage: `In der ${ZM} steht oben ${s}. Ein Stein unten fehlt. Welche Zahl gehört hinein?`,
        visual: { art: 'zahlenmauer', reihen: [[s], links ? ['?', b] : [a, '?']] }, loesung: fehlt, bis: ctx.bis,
        hinweis: `Die zwei Steine unten ergeben zusammen ${s}. ${bekannt} und wie viele sind ${s}?`,
        erklaerung: `${a} + ${b} = ${s}. Es fehlt die ${fehlt}.`,
        sig: sig(a, b, links), daten: { reihen: [[s], [a, b]] },
        fehlerbilder: fehlerbilder(fehlt, ctx.bis, [s, `Die ${s} steht schon oben. Gesucht ist der Stein unten.`], [s + bekannt, 'Du hast zusammengezählt. Die Steine unten ergeben zusammen den oberen.'], [fehlt + 1, 'Eins zu viel.'], [fehlt - 1, 'Eins zu wenig.']),
      });
    },
    3: (r, ctx) => {
      const b = r.int(1, 8), rest = 20 - 2 * b;
      const a = r.int(1, Math.min(9, rest - 1)), c = r.int(1, Math.min(9, rest - a));
      const m1 = a + b, m2 = b + c, top = m1 + m2;
      const ZM = begriff(ctx, 'zahlenmauer', 'Zahlenmauer');
      const voll = [[top], [m1, m2], [a, b, c]];
      if (r.bool(0.65)) {
        return A.zahl({
          frage: `Rechne die ${ZM} von unten nach oben aus.`,
          visual: { art: 'zahlenmauer', reihen: [['?'], ['?', '?'], [a, b, c]] }, loesung: [top, m1, m2], bis: ctx.bis,
          hinweis: `Rechne zuerst die Steine in der Mitte: ${a} + ${b} und ${b} + ${c}. Dann den obersten.`,
          erklaerung: `${a} + ${b} = ${m1}, ${b} + ${c} = ${m2}, und ${m1} + ${m2} = ${top}.`,
          sig: sig('a', a, b, c), daten: { reihen: voll },
        });
      }
      return A.zahl({
        frage: `Fülle die ${ZM} aus. Beginne mit dem Stein, den du schon ausrechnen kannst.`,
        visual: { art: 'zahlenmauer', reihen: [['?'], [m1, '?'], [a, '?', c]] }, loesung: [top, m2, b], bis: ctx.bis,
        hinweis: `Unten fehlt der mittlere Stein. ${a} und wie viele sind ${m1}?`,
        erklaerung: `${m1} − ${a} = ${b}. Dann ${b} + ${c} = ${m2}, und ${m1} + ${m2} = ${top}.`,
        sig: sig('c', a, b, c), daten: { reihen: voll },
      });
    },
  },

  // Blitzrechnen (später im Karteikasten)
  'M-RE-14': {
    // ctx.karte (Karteikasten): «7=3+4», «3+4», «7−3» legt die Zahlen fest
    1: (r, ctx) => {
      const k = karte(ctx, /^(\d+)=(\d+)\+(\d+)$/);
      const n = k ? k[0] : r.int(2, 10), a = k ? k[1] : r.int(1, n - 1), b = n - a, rechts = r.bool();
      const ZH = begriff(ctx, 'zerlegungshaus', 'Zahlenhaus');
      const bekannt = rechts ? a : b, fehlt = rechts ? b : a;
      return A.zahl({
        frage: rechts ? `Welche Zahl fehlt im ${ZH}? ${n} sind ${a} und wie viele?` : `Welche Zahl fehlt im ${ZH}? Welche Zahl und ${b} sind ${n}?`,
        visual: { art: 'zerlegungshaus', dach: n, zeilen: [rechts ? [a, '?'] : ['?', b]] }, loesung: fehlt, bis: ctx.bis,
        hinweis: `Die zwei Zahlen unten ergeben zusammen ${n}. ${bekannt} und wie viele sind ${n}?`,
        erklaerung: `${a} und ${b} sind ${n}. Es fehlt die ${fehlt}.`,
        sig: sig(n, a, rechts), daten: { karte: `${n}=${a}+${b}`, n, a, b, versteckt: rechts ? 'rechts' : 'links' },
        fehlerbilder: fehlerbilder(fehlt, ctx.bis, [n, `Die ${n} steht schon im Dach. Gesucht ist die Zahl unten.`], [n + bekannt, `Unten ergeben die zwei Zahlen zusammen ${n}.`], [fehlt + 1, 'Eins zu viel.'], [fehlt - 1, 'Eins zu wenig.']),
      });
    },
    2: (r, ctx) => {
      const kp = karte(ctx, /^(\d+)\+(\d+)$/), km = karte(ctx, /^(\d+)−(\d+)$/);
      if (kp || (!km && r.bool())) {
        const [a, b] = kp || plusBis(r, 2, 10);
        const x = plusAufgabe(r, ctx, { a, b, nachFehler: zehnerfeld(a, b) });
        x.daten.karte = `${a}+${b}`;
        return x;
      }
      const [a, b] = km || minusBis(r, 2, 10);
      const x = minusAufgabe(r, ctx, { a, b, nachFehler: zehnerfeld(a, 0, b) });
      x.daten.karte = `${a}${MINUS}${b}`;
      return x;
    },
    3: (r, ctx) => {
      const kp = karte(ctx, /^(\d+)\+(\d+)$/), km = karte(ctx, /^(\d+)−(\d+)$/);
      const x = kp ? zehnerPlus(r, ctx, 'ohne', [kp[0], kp[1], kp[0] + kp[1]]) : km ? zehnerMinus(r, ctx, 'ohne', [km[0], km[1], km[0] - km[1]])
        : r.bool() ? zehnerPlus(r, ctx, 'ohne') : zehnerMinus(r, ctx, 'ohne');
      x.daten.karte = `${x.daten.a}${x.daten.op === '+' ? '+' : MINUS}${x.daten.b}`;
      return x;
    },
  },

  // Rechnungen vergleichen
  'M-RE-15': {
    1: (r) => vergleich(r, 10, false),
    2: (r) => vergleich(r, 10, true),
    3: (r) => vergleich(r, 20, true),
  },
};

// --- Zehnerübergang ---
function zehnerPlus(r, ctx, art, fest = null) {
  const [a, b, s] = fest || plusUeber(r);
  const auf = 10 - a, rest = b - auf;
  const Z = begriff(ctx, 'zwanzigerfeld', 'Zwanzigerfeld');
  const fb = fehlerbilder(s, ctx.bis,
    [s - 1, 'Eins zu wenig. Zähle nochmals genau.'],
    [s + 1, 'Eins zu viel. Zähle nochmals genau.'],
    [rest, 'Das ist nur der Rest nach der 10. Die volle 10 gehört dazu.'],
    [a !== b ? Math.abs(a - b) : null, 'Bei Plus wird es mehr.']);
  const basis = {
    loesung: s, bis: ctx.bis,
    erklaerung: `${a} + ${auf} = 10. Dann noch ${rest} dazu: 10 + ${rest} = ${s}. Also ${a} + ${b} = ${s}.`,
    sig: sig(a, b), daten: { a, b, op: '+', auf, rest },
  };
  if (art === 'bild') {
    return A.zahl({
      ...basis, frage: `Wie viel ist ${a} + ${b}? Schau im ${Z}: Die obere Reihe wird zuerst voll.`,
      zeige: rechnung(a, PLUS, b, GLEICH, LUECKE), visual: zwanzigerfeld(a, b),
      hinweis: `Fülle zuerst bis 10 auf: Wie viele fehlen von ${a} bis 10? Dann kommt der Rest dazu.`, fehlerbilder: fb,
    });
  }
  if (art === 'schritte') {
    return A.zahl({
      ...basis, frage: `Rechne ${a} + ${b} in zwei Schritten: zuerst bis 10, dann weiter.`,
      zeige: rechnung(a, PLUS, b, GLEICH, a, PLUS, LUECKE, PLUS, LUECKE, GLEICH, LUECKE), loesung: [auf, rest, s],
      visualNachFehler: zwanzigerfeld(a, b),
      hinweis: `Wie viele fehlen von ${a} bis 10? Das kommt in die erste Lücke. Was von ${b} übrig bleibt, kommt in die zweite.`,
      erklaerung: `${a} + ${auf} = 10, und 10 + ${rest} = ${s}. Also ${a} + ${b} = ${a} + ${auf} + ${rest} = ${s}.`,
    });
  }
  return A.zahl({
    ...basis, frage: `Wie viel ist ${a} + ${b}?`,
    zeige: rechnung(a, PLUS, b, GLEICH, LUECKE), visualNachFehler: zwanzigerfeld(a, b),
    hinweis: `Rechne zuerst bis 10. Wie viele fehlen von ${a} bis 10?`, fehlerbilder: fb,
  });
}
function zehnerMinus(r, ctx, art, fest = null) {
  const [a, b, c] = fest || minusUeber(r);
  const e = a % 10, rest = b - e;
  const Z = begriff(ctx, 'zwanzigerfeld', 'Zwanzigerfeld');
  const fb = fehlerbilder(c, ctx.bis,
    [10 + rest, `Hast du ${b} − ${e} gerechnet? Bei ${a} − ${b} nimmst du zuerst ${e} weg bis 10, dann noch den Rest.`],
    [c + 1, 'Eins zu viel. Zähle nochmals genau.'],
    [c - 1, 'Eins zu wenig. Zähle nochmals genau.'],
    [a + b, 'Bei Minus wird es weniger.']);
  const basis = {
    loesung: c, bis: ctx.bis,
    erklaerung: `${a} − ${e} = 10. Dann noch ${rest} weg: 10 − ${rest} = ${c}. Also ${a} − ${b} = ${c}.`,
    sig: sig(a, b), daten: { a, b, op: '−', bisZehn: e, rest },
  };
  if (art === 'bild') {
    return A.zahl({
      ...basis, frage: `Wie viel ist ${a} − ${b}? Schau im ${Z}: Zuerst gehen die ${begriff(ctx, 'plaettchen', 'Plättchen')} in der unteren Reihe weg.`,
      zeige: rechnung(a, MINUS, b, GLEICH, LUECKE), visual: zwanzigerfeld(a, 0, b),
      hinweis: `Nimm zuerst ${e} weg. Dann bist du bei 10. Dann nimm noch den Rest weg.`, fehlerbilder: fb,
    });
  }
  if (art === 'schritte') {
    return A.zahl({
      ...basis, frage: `Rechne ${a} − ${b} in zwei Schritten: zuerst zurück bis 10, dann weiter.`,
      zeige: rechnung(a, MINUS, b, GLEICH, a, MINUS, LUECKE, MINUS, LUECKE, GLEICH, LUECKE), loesung: [e, rest, c],
      visualNachFehler: zwanzigerfeld(a, 0, b),
      hinweis: `Wie viele musst du von ${a} wegnehmen, damit du bei 10 bist? Das kommt in die erste Lücke.`,
      erklaerung: `${a} − ${e} = 10, und 10 − ${rest} = ${c}. Also ${a} − ${b} = ${a} − ${e} − ${rest} = ${c}.`,
    });
  }
  return A.zahl({
    ...basis, frage: `Wie viel ist ${a} − ${b}?`,
    zeige: rechnung(a, MINUS, b, GLEICH, LUECKE), visualNachFehler: zwanzigerfeld(a, 0, b),
    hinweis: `Rechne zuerst zurück bis 10. Wie viele musst du dafür von ${a} wegnehmen?`, fehlerbilder: fb,
  });
}

// --- Nachbaraufgaben: Verdoppeln als Hilfe ---
function nachbar(r, ctx, art) {
  const d = r.int(3, 9);
  const form = r.pick(['plus1', 'plus1vorn', 'minus1']);
  const [a, b] = form === 'plus1' ? [d, d + 1] : form === 'plus1vorn' ? [d + 1, d] : [d, d - 1];
  const s = a + b, mehr = s > 2 * d;
  const hilfe = rechnung(d, PLUS, d, GLEICH, 2 * d);
  const bild = zwanzigerfeld(a, b, 0, 'reihen');
  const o = {
    frage: `${d} + ${d} = ${2 * d}. Wie viel ist dann ${a} + ${b}?`,
    zeige: [hilfe, rechnung(a, PLUS, b, GLEICH, LUECKE)], loesung: s, bis: ctx.bis,
    hinweis: `${a} + ${b} ist fast ${d} + ${d}. Es ist eins ${mehr ? 'mehr' : 'weniger'}.`,
    erklaerung: `${d} + ${d} = ${2 * d}. ${a} + ${b} ist eins ${mehr ? 'mehr' : 'weniger'}: ${s}.`,
    sig: sig(a, b), daten: { a, b, op: '+', doppel: d },
    fehlerbilder: fehlerbilder(s, ctx.bis, [2 * d, `Das ist ${d} + ${d}. Hier ist es eins ${mehr ? 'mehr' : 'weniger'}.`], [mehr ? s + 1 : s - 1, `Es ist nur eins ${mehr ? 'mehr' : 'weniger'} als ${d} + ${d}.`]),
  };
  if (art === 'bild') o.visual = bild; else o.visualNachFehler = bild;
  return A.zahl(o);
}

// --- Platzhalter ---
function platzhalterPlus(r, ctx, [a, b, s], art) {
  const links = r.bool();   // Lücke vorn: _ + b = s
  const bekannt = links ? b : a, fehlt = links ? a : b;
  const SB = begriff(ctx, 'schuettelbox', 'Schüttelbox');
  const box = { art: 'schuettelbox', n: s, sichtbar: bekannt };
  const o = {
    frage: links ? `Welche Zahl und ${b} sind zusammen ${s}?` : `${a} und wie viele sind zusammen ${s}?`,
    zeige: links ? rechnung(LUECKE, PLUS, b, GLEICH, s) : rechnung(a, PLUS, LUECKE, GLEICH, s), loesung: fehlt, bis: ctx.bis,
    hinweis: art === 'bild' ? `In der ${SB} sind ${s}. ${bekannt} siehst du. Wie viele sind unter dem Deckel?` : `Zähle von ${bekannt} bis ${s} weiter. Wie viele Schritte sind es?`,
    erklaerung: `${a} + ${b} = ${s}. In das Kästchen gehört ${fehlt}.`,
    sig: sig(a, b, links), daten: { a, b, s, op: '+', luecke: links ? 'a' : 'b' },
    fehlerbilder: fehlerbilder(fehlt, ctx.bis, [s, `Die ${s} steht schon da. Gesucht ist die Zahl im Kästchen.`], [s + bekannt, 'Du hast zusammengezählt. Gesucht ist, wie viele fehlen.'], [fehlt + 1, 'Eins zu viel.'], [fehlt - 1, 'Eins zu wenig.']),
  };
  if (art === 'bild') o.visual = box; else o.visualNachFehler = box;
  return A.zahl(o);
}
function platzhalterMinus(r, ctx, [a, b, c]) {
  const vorn = r.bool();   // Lücke vorn: _ − b = c
  return A.zahl({
    frage: vorn ? `Von einer Zahl nimmst du ${b} weg. Dann sind es noch ${c}. Mit welcher Zahl hast du angefangen?`
      : `Von ${a} nimmst du einige weg. Dann sind es noch ${c}. Wie viele hast du weggenommen?`,
    zeige: vorn ? rechnung(LUECKE, MINUS, b, GLEICH, c) : rechnung(a, MINUS, LUECKE, GLEICH, c),
    loesung: vorn ? a : b, bis: ctx.bis,
    visualNachFehler: feldFuer(a, 0, b, ctx.bis),
    hinweis: vorn ? `Rechne rückwärts: Nimm die ${c} und zähle die ${b} dazu, die weggenommen wurden.` : `Zähle von ${c} bis ${a}. Wie viele Schritte sind es?`,
    erklaerung: `${a} − ${b} = ${c}. In das Kästchen gehört ${vorn ? a : b}.`,
    sig: sig(a, b, vorn ? 'vorn' : 'mitte'), daten: { a, b, c, op: '−', luecke: vorn ? 'a' : 'b' },
    fehlerbilder: vorn
      ? fehlerbilder(a, ctx.bis, [c > b ? c - b : null, `Du hast minus gerechnet. Am Anfang waren es mehr als ${c}.`], [c, `${c} ${bleibt(c)} übrig. Am Anfang waren es mehr.`], [a + 1, 'Eins zu viel.'], [a - 1, 'Eins zu wenig.'])
      : fehlerbilder(b, ctx.bis, [c, `${c} ${bleibt(c)} übrig. Gesucht ist, wie viele weggenommen werden.`], [a + c, 'Du hast zusammengezählt. Gesucht ist, wie viele weg sind.'], [b + 1, 'Eins zu viel.'], [b - 1, 'Eins zu wenig.']),
  });
}

// --- Rechengeschichten (Alltag eines Kindes in der Schweiz) ---
function personen(r) { const [p, q] = r.sample(NAMEN, 2); return { N: p[0], er: p[1], Er: gross(p[1]), ihm: DATIV[p[1]], M: q[0] }; }
const GESCHICHTEN = {
  dazu: [
    (r, a, b, p) => { const d = ding(r.pick(['Apfel', 'Birne', 'Erdbeere', 'Banane'])); return { d, text: `${p.N} hat ${menge(a, d)} im Znünisäckli. ${p.M} gibt ${p.ihm} noch ${menge(b, d)}. Wie viele ${d[2]} hat ${p.N} jetzt?` }; },
    (r, a, b, p) => { const d = ding('Brezel'); return { d, text: `${p.N} kauft in der Bäckerei ${menge(a, d)}. Dann kauft ${p.er} noch ${menge(b, d)}. Wie viele Brezeln sind es zusammen?` }; },
    (r, a, b) => { const d = ding('Huhn'); return { d, text: `Auf dem Bauernhof picken ${menge(a, d)}. Dann ${b === 1 ? 'kommt' : 'kommen'} noch ${menge(b, d)} dazu. Wie viele Hühner sind es jetzt?` }; },
    (r, a, b, p) => { const d = ding('Pilz'); return { d, text: `${p.N} findet im Wald ${menge(a, d)}. Dann findet ${p.er} noch ${menge(b, d)}. Wie viele Pilze hat ${p.N} jetzt?` }; },
    (r, a, b) => { const d = ding('Ente'); return { d, text: `Auf dem Weiher schwimmen ${menge(a, d)}. Dann ${b === 1 ? 'kommt' : 'kommen'} noch ${menge(b, d)} dazu. Wie viele Enten sind es jetzt?` }; },
    (r, a, b) => { const d = ding('Velo'); return { d, text: `Vor dem Schulhaus stehen ${menge(a, d)}. Dann stellen Kinder noch ${menge(b, d)} dazu. Wie viele Velos stehen jetzt da?` }; },
    (r, a, b, p) => { const d = ding('Ballon'); return { d, text: `${p.N} hat ${menge(a, d)} für das Fest. ${p.M} bringt noch ${menge(b, d)}. Wie viele Ballone sind es zusammen?` }; },
    (r, a, b, p) => { const d = ding('Blume'); return { d, text: `Im Garten blühen ${menge(a, d)}. ${p.N} pflanzt noch ${menge(b, d)}. Wie viele Blumen sind es jetzt?` }; },
  ],
  weg: [
    (r, a, b, p) => { const d = ding('Erdbeere'); return { d, text: `${p.N} hat ${menge(a, d)} zum Znüni. ${p.Er} isst ${menge(b, d)}. Wie viele Erdbeeren hat ${p.N} noch?` }; },
    (r, a, b) => { const d = ding('Vogel'); return { d, text: `Auf dem Baum sitzen ${menge(a, d)}. ${b === 1 ? '1 Vogel fliegt' : `${b} Vögel fliegen`} weg. Wie viele Vögel sitzen noch auf dem Baum?` }; },
    (r, a, b, p) => { const d = ding('Ballon'); return { d, text: `${p.N} hat ${menge(a, d)}. ${b === 1 ? '1 Ballon fliegt' : `${b} Ballone fliegen`} davon. Wie viele Ballone hat ${p.N} noch?` }; },
    (r, a, b) => { const d = ding('Velo'); return { d, text: `Vor dem Schulhaus stehen ${menge(a, d)}. ${b === 1 ? '1 Kind fährt mit seinem' : `${b} Kinder fahren mit ihrem`} Velo nach Hause. Wie viele Velos stehen noch da?` }; },
    (r, a, b) => { const d = ding('Fisch'); return { d, text: `Im Weiher schwimmen ${menge(a, d)}. ${b === 1 ? '1 Fisch schwimmt' : `${b} Fische schwimmen`} weg. Wie viele Fische sind noch da?` }; },
    (r, a, b, p) => { const d = ding('Brezel'); return { d, text: `In der Bäckerei liegen ${menge(a, d)}. ${p.N} kauft ${menge(b, d)}. Wie viele Brezeln liegen noch da?` }; },
  ],
  ergaenzen: [
    (r, s, a, p) => { const d = ding('Brezel'); return { d, text: `${p.N} möchte ${menge(s, d)} kaufen. ${p.Er} hat schon ${menge(a, d)} im Korb. Wie viele Brezeln fehlen noch?` }; },
    (r, s, a) => { const d = ding('Ei'); return { d, text: `In eine Schachtel passen ${s} Eier. Es sind schon ${menge(a, d)} drin. Wie viele Eier fehlen noch?` }; },
    (r, s, a, p) => { const d = ding('Blume'); return { d, text: `${p.N} möchte ${menge(s, d)} pflücken. ${p.Er} hat schon ${menge(a, d)}. Wie viele muss ${p.er} noch pflücken?` }; },
    (r, s, a, p) => { const d = ding('Apfel'); return { d, text: `${p.N} will ${menge(s, d)} für die Klasse mitbringen. ${p.Er} hat schon ${menge(a, d)}. Wie viele braucht ${p.er} noch?` }; },
  ],
};

function geschichte(r, ctx, art, typ) {
  const p = personen(r);
  const vorlage = r.int(0, GESCHICHTEN[art].length - 1);
  if (art === 'dazu') {
    const s = r.int(3, 10), a = r.int(2, s - 1), b = s - a;
    const { d, text } = GESCHICHTEN.dazu[vorlage](r, a, b, p);
    const basis = {
      frage: text, visual: { art: 'dinge', bild: d[0], n: s, weg: 0, gruppen: [a, b] }, bilder: [d[0]],
      hinweis: `Zuerst sind es ${a}. Dann ${b === 1 ? 'kommt 1' : `kommen ${b}`} dazu. Es werden mehr.`,
      erklaerung: `${a} + ${b} = ${s}. Es sind ${menge(s, d)}.`,
      sig: sig(art, vorlage, a, b), daten: { a, b, op: '+', art },
    };
    if (typ === 'legen') {
      const loesung = [a, PLUS, b, s].map(String);
      return A.legen({
        ...basis, frage: `${text} Lege die Rechnung dazu.`,
        kacheln: r.shuffle([String(a), String(b), String(s), PLUS, MINUS]),
        vorlage: [null, null, null, GLEICH, null], loesung,
        alternativen: a !== b ? [[b, PLUS, a, s].map(String)] : [],
        hinweis: `Zuerst sind es ${a}, dann kommen welche dazu. Kommt etwas dazu, rechnest du Plus.`,
        erklaerung: `${a} + ${b} = ${s}. Es ${b === 1 ? 'kommt' : 'kommen'} ${b} dazu, darum Plus.`,
      });
    }
    return A.zahl({ ...basis, loesung: s, bis: ctx.bis, fehlerbilder: fbPlus(a, b, s, ctx.bis) });
  }
  if (art === 'weg') {
    const a = r.int(3, 10), b = r.int(1, a - 1), c = a - b;
    const { d, text } = GESCHICHTEN.weg[vorlage](r, a, b, p);
    return A.zahl({
      frage: text, visual: { art: 'dinge', bild: d[0], n: a, weg: b }, bilder: [d[0]],
      loesung: c, bis: ctx.bis,
      hinweis: `Zuerst sind es ${a}. Dann ${b === 1 ? 'geht 1' : `gehen ${b}`} weg. Es werden weniger.`,
      erklaerung: `${a} − ${b} = ${c}. Es sind noch ${menge(c, d)}.`,
      sig: sig(art, vorlage, a, b), daten: { a, b, op: '−', art },
      fehlerbilder: fehlerbilder(c, ctx.bis, [b, `So viele sind weg. Gesucht ist, wie viele noch da sind.`], ...fbMinus(a, b, c, ctx.bis).map((f) => [Number(f.eingabe), f.text])),
    });
  }
  // ergänzen: s möchte man, a hat man schon
  const s = r.int(4, 10), a = r.int(2, s - 1), f = s - a;
  const { d, text } = GESCHICHTEN.ergaenzen[vorlage](r, s, a, p);
  return A.zahl({
    frage: text, visual: { art: 'dinge', bild: d[0], n: a, weg: 0 }, bilder: [d[0]],
    loesung: f, bis: ctx.bis,
    hinweis: `Es sind schon ${a}. Zähle von ${a} bis ${s} weiter. Wie viele Schritte sind es?`,
    erklaerung: `${a} + ${f} = ${s}. Es fehlen noch ${menge(f, d)}.`,
    sig: sig(art, vorlage, s, a), daten: { a, b: f, s, op: 'ergaenzen', art },
    fehlerbilder: fehlerbilder(f, ctx.bis, [s, `So viele sollen es am Schluss sein. Gesucht ist, wie viele noch fehlen.`], [a, `So viele sind schon da. Gesucht ist, wie viele noch fehlen.`], [s + a, 'Du hast zusammengezählt. Gesucht ist, wie viele noch fehlen.'], [f + 1, 'Eins zu viel.'], [f - 1, 'Eins zu wenig.']),
  });
}

// --- Rechnungen vergleichen ---
const ZEICHEN = ['<', '=', '>'];
const ZEICHENWORT = { '<': 'kleiner als', '>': 'grösser als' };
// Eine Rechnung mit dem Wert v bis «oben», ohne 0 und ohne «+ 0»/«− 0»
function rechnungMitWert(r, v, oben) {
  if (r.bool() && v >= 2) { const a = r.int(1, v - 1); return { text: rechnung(a, PLUS, v - a), wert: v }; }
  const b = r.int(1, oben - v); return { text: rechnung(v + b, MINUS, b), wert: v };
}
function vergleich(r, oben, zweiRechnungen) {
  const zeichen = r.pick(ZEICHEN);
  let L, R;
  if (!zweiRechnungen) {
    const v = r.int(2, oben - 1);   // '>' braucht eine Zahl darunter (ab 1), '<' eine darüber (bis oben)
    L = rechnungMitWert(r, v, oben);
    const z = zeichen === '=' ? v : zeichen === '<' ? r.int(v + 1, Math.min(oben, v + 3)) : r.int(Math.max(1, v - 3), v - 1);
    R = { text: String(z), wert: z };
    if (r.bool(0.3)) {
      // Zahl links, Rechnung rechts: Zeichen umdrehen
      [L, R] = [R, L];
    }
  } else {
    const v = r.int(zeichen === '>' ? 3 : 2, zeichen === '<' ? oben - 2 : oben - 1);
    L = rechnungMitWert(r, v, oben);
    const w = zeichen === '=' ? v : zeichen === '<' ? r.int(v + 1, Math.min(oben - 1, v + 3)) : r.int(Math.max(2, v - 3), v - 1);
    for (let i = 0; i < 20; i++) { R = rechnungMitWert(r, w, oben); if (R.text !== L.text) break; }
    if (R.text === L.text) return null;
  }
  const richtigesZeichen = L.wert < R.wert ? '<' : L.wert > R.wert ? '>' : '=';
  const optionen = ZEICHEN.slice();
  const richtig = optionen.indexOf(richtigesZeichen);
  const satz = `${L.text} ${richtigesZeichen} ${R.text}`;
  const rechnen = [L, R].filter((x) => /[+−]/.test(x.text)).map((x) => `${x.text} = ${x.wert}`);
  return A.wahlWort({
    frage: 'Welches Zeichen gehört in den Kreis: kleiner, gleich oder grösser?',
    zeige: `${L.text} ○ ${R.text}`, optionen, richtig,
    hinweis: zweiRechnungen ? 'Rechne zuerst beide Seiten aus. Dann vergleiche die zwei Ergebnisse.' : 'Rechne zuerst die Rechnung aus. Dann vergleiche mit der Zahl.',
    erklaerung: `${rechnen.join('. ')}. ${richtigesZeichen === '=' ? `${L.wert} und ${R.wert} sind gleich viel` : `${L.wert} ist ${ZEICHENWORT[richtigesZeichen]} ${R.wert}`}. Also: ${satz}.`,
    sig: sig(L.text, R.text), daten: { links: L, rechts: R },
    fehlerbilder: optionen.filter((o) => o !== richtigesZeichen).map((o) => ({
      eingabe: o,
      text: o === '=' ? 'Gleich passt nur, wenn beide Seiten gleich viel sind. Rechne nochmals nach.'
        : richtigesZeichen === '=' ? 'Rechne nochmals nach. Vielleicht sind beide Seiten gleich viel.'
          : 'Schau genau: Die offene Seite des Zeichens zeigt zur grösseren Zahl.',
    })),
  });
}
