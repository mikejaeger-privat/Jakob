// Mathematik FO: Form und Raum (Formen, Körper, Muster, Lage, Spiegeln, Wege mit Pfeilen)
// Gitter und Spiegel: x nach rechts (Spalte 0 links), y nach unten (Zeile 0 oben); Pfeil 'oben' heisst y − 1.
import { A, sig, auswahl, fehlerbilder, TIERE } from './lib.js';

const FARBEN = ['rot', 'blau', 'gelb', 'gruen', 'orange', 'violett'];
const FARBWORT = { rot: 'rot', blau: 'blau', gelb: 'gelb', gruen: 'grün', orange: 'orange', violett: 'violett' };
const FORMWORT = { kreis: 'Kreis', dreieck: 'Dreieck', quadrat: 'Quadrat', rechteck: 'Rechteck', viereck: 'Viereck' };
const FORMMEHR = { kreis: 'Kreise', dreieck: 'Dreiecke', quadrat: 'Quadrate' };
const FORMART = { kreis: 'den', dreieck: 'das', quadrat: 'das', viereck: 'das' };   // «Tippe auf den Kreis»
const DATIV = { der: 'dem', die: 'der', das: 'dem' };
const NOM = { der: 'Der', die: 'Die', das: 'Das' };

// Eine einzelne Form auf einer Bildkarte (gross, in der Mitte)
const formKarte = (form, farbe, groesse = 3, drehung = 0) => ({ visual: { art: 'formen', liste: [{ form, farbe, groesse, drehung, x: 0.5, y: 0.5 }] } });

// --- Formen ---
function formenStufe1(r) {
  const gefragt = r.pick(['kreis', 'dreieck', 'viereck']);
  const viereck = r.pick(['quadrat', 'rechteck']);
  const farben = r.sample(FARBEN, 3);
  const karten = [
    { teil: 'kreis', o: formKarte('kreis', farben[0], r.pick([2.5, 3, 3.5])) },
    { teil: 'dreieck', o: formKarte('dreieck', farben[1], r.pick([2.5, 3, 3.5])) },
    { teil: 'viereck', o: formKarte(viereck, farben[2], viereck === 'rechteck' ? r.pick([2, 2.5]) : r.pick([2.5, 3]), viereck === 'rechteck' ? r.pick([0, 90]) : 0) },
  ];
  const ziel = karten.find((k) => k.teil === gefragt);
  const { optionen, richtig } = auswahl(r, ziel.o, karten.filter((k) => k !== ziel).map((k) => k.o), 3);
  const merkmal = { kreis: 'Ein Kreis ist rund und hat keine Ecken.', dreieck: 'Ein Dreieck hat drei Ecken.', viereck: 'Ein Viereck hat vier Ecken.' };
  return A.wahlBild({
    frage: `Tippe auf ${FORMART[gefragt]} ${FORMWORT[gefragt]}.`,
    optionen, richtig,
    hinweis: merkmal[gefragt],
    erklaerung: `Hier ist ${FORMART[gefragt] === 'den' ? 'der' : 'das'} ${FORMWORT[gefragt]}. ${merkmal[gefragt]}`,
    sig: sig(gefragt, viereck, ...optionen.map((o) => o.visual.liste[0].form + o.visual.liste[0].farbe)),
    daten: { gefragt, formen: optionen.map((o) => o.visual.liste[0].form) },
  });
}

function formenStufe2(r) {
  const farben = r.shuffle(FARBEN);
  const quadrat = formKarte('quadrat', farben[0], r.pick([2, 2.5, 3]));
  const rechtecke = [formKarte('rechteck', farben[1], r.pick([1.8, 2.2]), r.pick([0, 90])), formKarte('rechteck', farben[2], r.pick([2.4, 2.8]), r.pick([0, 90]))];
  const andere = r.bool(0.5) ? [formKarte(r.pick(['kreis', 'dreieck']), farben[3], r.pick([2.5, 3]))] : [];
  const { optionen, richtig } = auswahl(r, quadrat, [...rechtecke, ...andere], 2 + rechtecke.length + andere.length - 1);
  return A.wahlBild({
    frage: 'Tippe auf das Quadrat.',
    optionen, richtig,
    hinweis: 'Beim Quadrat sind alle vier Seiten gleich lang.',
    erklaerung: 'Hier ist das Quadrat. Alle vier Seiten sind gleich lang.',
    sig: sig(...optionen.map((o) => { const f = o.visual.liste[0]; return f.form + f.farbe + f.drehung + f.groesse; })),
    daten: { formen: optionen.map((o) => o.visual.liste[0].form) },
  });
}

function formenStufe3(r) {
  const gefragt = r.pick(['kreis', 'dreieck', 'quadrat']);
  const c = r.int(2, 6);
  const gesamt = r.int(Math.max(c + 3, 6), 9);
  const andereFormen = { kreis: ['dreieck', 'quadrat', 'rechteck'], dreieck: ['kreis', 'quadrat', 'rechteck'], quadrat: ['kreis', 'dreieck', 'rechteck'] }[gefragt];
  const DREH = { kreis: [0], dreieck: [0, 0, 90, 180, 270, 30], quadrat: [0, 0, 20, 30], rechteck: [0, 90, 30] };
  const zellen = r.sample([0, 1, 2, 3, 4, 5, 6, 7, 8], gesamt);
  const formen = r.shuffle([...Array(c).fill(gefragt), ...Array.from({ length: gesamt - c }, () => r.pick(andereFormen))]);
  const liste = formen.map((form, i) => {
    const z = zellen[i];
    return {
      form, farbe: r.pick(FARBEN), groesse: form === 'rechteck' ? 0.8 : r.pick([1, 1.1, 1.2]), drehung: r.pick(DREH[form]),
      x: Math.round(((z % 3) + 0.5) / 3 * 1000 + (r.next() - 0.5) * 50) / 1000,
      y: Math.round((Math.floor(z / 3) + 0.5) / 3 * 1000 + (r.next() - 0.5) * 50) / 1000,
    };
  });
  const gedreht = liste.some((f) => f.form === gefragt && f.drehung !== 0);
  return A.zahl({
    frage: `Wie viele ${FORMMEHR[gefragt]} siehst du?`,
    visual: { art: 'formen', liste }, loesung: c, bis: 10,
    hinweis: `Zeig mit dem Finger auf ${gefragt === 'kreis' ? 'jeden' : 'jedes'} ${FORMWORT[gefragt]} und zähle.${gefragt === 'kreis' ? '' : ' Auch die gedrehten zählen.'}`,
    erklaerung: `Es sind ${c} ${FORMMEHR[gefragt]}.`,
    sig: sig(gefragt, c, gesamt, ...zellen.slice(0, gesamt)),
    daten: { gefragt, liste },
    fehlerbilder: fehlerbilder(c, 10,
      [c - 1, gedreht ? `Hast du auch die gedrehten ${FORMMEHR[gefragt]} gezählt?` : `Eines hast du noch nicht gezählt. Schau genau.`],
      [c + 1, `Schau genau: Nur die ${FORMMEHR[gefragt]} zählen.`]),
  });
}

// --- Körper ---
const KOERPER = { kugel: ['Kugel', 'die'], wuerfel: ['Würfel', 'der'], quader: ['Quader', 'der'], zylinder: ['Zylinder', 'der'] };
const AKK = { der: 'den', die: 'die', das: 'das' };
const koerperKarte = (form) => ({ visual: { art: 'koerper', form } });
const KOERPER_MERKMAL = {
  kugel: 'Eine Kugel ist ganz rund, wie ein Ball.',
  wuerfel: 'Ein Würfel hat lauter gleiche, quadratische Flächen, wie ein Spielwürfel.',
  quader: 'Ein Quader ist eckig wie eine Schachtel. Er ist länger als hoch.',
  zylinder: 'Ein Zylinder ist rund und hat oben und unten eine flache Fläche, wie eine Dose.',
};
const DINGE_KOERPER = {
  kugel: [['⚽', 'Ball', 'der'], ['🏀', 'Basketball', 'der'], ['🍊', 'Orange', 'die']],
  zylinder: [['🥫', 'Dose', 'die'], ['🕯️', 'Kerze', 'die'], ['🧻', 'Rolle', 'die']],
  wuerfel: [['🎲', 'Spielwürfel', 'der'], ['🧊', 'Eiswürfel', 'der']],
  quader: [['🧱', 'Ziegelstein', 'der'], ['📦', 'Schachtel', 'die']],
};

function koerperStufe1(r) {
  const frage = r.pick(['kugel', 'wuerfel', 'rollen', 'ecken']);
  const ziel = frage === 'rollen' ? 'kugel' : frage === 'ecken' ? 'wuerfel' : frage;
  const { optionen, richtig } = auswahl(r, koerperKarte(ziel), [koerperKarte(ziel === 'kugel' ? 'wuerfel' : 'kugel')], 2);
  const text = { kugel: 'Tippe auf die Kugel.', wuerfel: 'Tippe auf den Würfel.', rollen: 'Was kann rollen? Tippe darauf.', ecken: 'Was hat Ecken? Tippe darauf.' }[frage];
  return A.wahlBild({
    frage: text, optionen, richtig,
    hinweis: ziel === 'kugel' ? KOERPER_MERKMAL.kugel : 'Ein Würfel hat Ecken und Kanten, wie ein Spielwürfel.',
    erklaerung: ziel === 'kugel' ? 'Das ist die Kugel. Sie ist rund und kann rollen.' : 'Das ist der Würfel. Er hat Ecken und Kanten.',
    sig: sig(frage, richtig), daten: { ziel, frage },
  });
}

function koerperStufe2(r) {
  const ziel = r.pick(['kugel', 'wuerfel', 'quader', 'zylinder']);
  // Ein Würfel ist auch ein Quader: Wird nach dem Quader gefragt, ist kein Würfel dabei.
  const moeglich = ['kugel', 'wuerfel', 'quader', 'zylinder'].filter((k) => k !== ziel && !(ziel === 'quader' && k === 'wuerfel'));
  const anzahl = Math.min(moeglich.length + 1, r.pick([3, 4]));
  const { optionen, richtig } = auswahl(r, koerperKarte(ziel), r.shuffle(moeglich).map(koerperKarte), anzahl);
  const [name, art] = KOERPER[ziel];
  return A.wahlBild({
    frage: `Tippe auf ${AKK[art]} ${name}.`, optionen, richtig,
    hinweis: KOERPER_MERKMAL[ziel],
    erklaerung: `Das ist ${art} ${name}. ${KOERPER_MERKMAL[ziel]}`,
    sig: sig(ziel, ...optionen.map((o) => o.visual.form)), daten: { ziel, formen: optionen.map((o) => o.visual.form) },
  });
}

function koerperStufe3(r) {
  // Würfel und Quader nicht zusammen (ein Würfel ist auch ein Quader)
  const formen = ['kugel', 'zylinder', r.pick(['wuerfel', 'quader'])];
  const paare = r.shuffle(formen).map((form) => {
    const d = r.pick(DINGE_KOERPER[form]);
    return [{ bild: d[0], wort: d[1] }, koerperKarte(form)];
  });
  const saetze = paare.map(([d, k]) => {
    const dd = Object.values(DINGE_KOERPER).flat().find((x) => x[0] === d.bild);
    const [name, art] = KOERPER[k.visual.form];
    return `${NOM[dd[2]]} ${dd[1]} ist ${art === 'die' ? 'eine' : 'ein'} ${name}.`;
  });
  return A.zuordnen({
    frage: 'Welcher Körper passt zu welchem Ding? Verbinde sie.',
    paare,
    hinweis: 'Schau die Form an: ganz rund wie eine Kugel, eckig, oder rund mit flachen Enden wie ein Zylinder?',
    erklaerung: saetze.join(' '),
    bilder: paare.map((p) => p[0].bild),
    sig: sig(...paare.map((p) => p[0].bild)), daten: { formen: paare.map((p) => p[1].visual.form), dinge: paare.map((p) => p[0].bild) },
  });
}

// --- Muster ---
const EINHEITEN = ['AB', 'ABB', 'AAB', 'ABC'];
function musterFolge(r, einheit, element) {
  const len = einheit.length;
  const k = r.int(0, len - 1);
  const sichtbar = 2 * len + k;
  const folge = Array.from({ length: sichtbar }, (_, i) => element(einheit[i % len]));
  return { folge: [...folge, '?'], loesung: element(einheit[sichtbar % len]), k, sichtbar };
}
function musterFarben(r) {
  const einheit = r.pick(EINHEITEN);
  const farben = r.sample(FARBEN, 4);
  const map = { A: farben[0], B: farben[1], C: farben[2] };
  const el = (b) => ({ farbe: map[b], form: 'kreis' });
  const { folge, loesung } = musterFolge(r, einheit, el);
  const imMuster = [...new Set(einheit)].map((b) => map[b]);
  const falsche = r.shuffle([...imMuster.filter((f) => f !== loesung.farbe), farben[3]]).map((f) => ({ farbe: f, form: 'kreis' }));
  const { optionen, richtig } = auswahl(r, loesung, falsche, 3);
  const teil = einheit.split('').map((b) => FARBWORT[map[b]]).join(', ');
  return A.muster({
    frage: 'Wie geht das Muster weiter? Tippe auf die Farbe, die als Nächstes kommt.',
    folge, optionen, richtig,
    hinweis: `Sag die Farben laut: ${teil}, ${teil} … Was kommt dann?`,
    erklaerung: `Das Muster ist ${teil}. Darum kommt jetzt ${FARBWORT[loesung.farbe]}.`,
    sig: sig(einheit, ...imMuster, folge.length), daten: { einheit, map, sichtbar: folge.length - 1 },
  });
}
function musterFormen(r) {
  const einheit = r.pick(['ABC', 'AAB', 'ABB', 'ABA']);
  const formen = r.shuffle(['kreis', 'dreieck', 'quadrat']);
  const farbe = r.pick(FARBEN);
  const map = { A: formen[0], B: formen[1], C: formen[2] };
  const el = (b) => ({ farbe, form: map[b] });
  const { folge, loesung } = musterFolge(r, einheit, el);
  const falsche = formen.filter((f) => f !== loesung.form).map((f) => ({ farbe, form: f }));
  const { optionen, richtig } = auswahl(r, loesung, falsche, 3);
  const teil = einheit.split('').map((b) => FORMWORT[map[b]]).join(', ');
  return A.muster({
    frage: 'Wie geht das Muster weiter? Tippe auf die Form, die als Nächstes kommt.',
    folge, optionen, richtig,
    hinweis: `Sag die Formen laut: ${teil}, ${teil} … Was kommt dann?`,
    erklaerung: `Das Muster ist ${teil}. Darum kommt jetzt ein ${FORMWORT[loesung.form]}.`,
    sig: sig(einheit, ...formen, farbe, folge.length), daten: { einheit, map, sichtbar: folge.length - 1 },
  });
}
function musterZahlen(r) {
  const schritt = r.pick([1, 2]);
  const ab = r.bool(0.3);
  const n = r.int(4, 5);
  // Folge im Bereich 1 bis 20, die nächste Zahl ebenfalls
  const spanne = schritt * n;
  const start = ab ? r.int(1 + spanne, 20) : r.int(1, 20 - spanne);
  const zahlen = Array.from({ length: n }, (_, i) => (ab ? start - i * schritt : start + i * schritt));
  const naechste = ab ? start - n * schritt : start + n * schritt;
  const letzte = zahlen[n - 1];
  const falsche = [ab ? letzte - 1 : letzte + 1, naechste + (ab ? -schritt : schritt), naechste + (ab ? 1 : -1), naechste + (ab ? -1 : 1)]
    .filter((x) => x >= 0 && x <= 20 && x !== naechste);
  const { optionen, richtig } = auswahl(r, naechste, falsche, 3);
  return A.muster({
    frage: 'Wie geht die Zahlenfolge weiter? Tippe auf die nächste Zahl.',
    folge: [...zahlen, '?'], optionen, richtig,
    hinweis: ab ? `Schau, wie viel jedes Mal weniger wird: von ${zahlen[0]} zu ${zahlen[1]}.` : `Schau, wie viel jedes Mal dazukommt: von ${zahlen[0]} zu ${zahlen[1]}.`,
    erklaerung: ab ? `Es wird jedes Mal ${schritt} weniger. Nach ${letzte} kommt ${naechste}.` : `Es ${schritt === 1 ? 'kommt' : 'kommen'} jedes Mal ${schritt} dazu. Nach ${letzte} kommt ${naechste}.`,
    sig: sig(start, schritt, ab, n), daten: { start, schritt, ab, n },
    fehlerbilder: schritt === 2 ? fehlerbilder(naechste, 20, [ab ? letzte - 1 : letzte + 1, `Hier ändert sich die Zahl jedes Mal um ${schritt}, nicht um 1.`]) : [],
  });
}

// --- Lage im Raum ---
const BEZUG = [['🌳', 'Baum', 'der'], ['🏠', 'Haus', 'das'], ['🚗', 'Auto', 'das'], ['🚌', 'Bus', 'der']];
const tier = (t, id, x, y, w, z) => ({ id, bild: t[0], name: t[1], x, y, w, ...(z !== undefined ? { z } : {}) });
const mitArtikelDativ = (t) => `${DATIV[t[2]]} ${t[1]}`;

function lageStufe1(r) {
  const b = r.pick(BEZUG);
  const [t1, t2, t3] = r.sample(TIERE, 3);
  const seite = r.pick([0.18, 0.82]);
  const elemente = [
    { id: 'bezug', bild: b[0], name: b[1], x: 0.5, y: 0.55, w: 0.28, deko: true },
    tier(t1, 'oben', 0.5, 0.25, 0.16),
    tier(t2, 'unten', 0.5, 0.88, 0.16),
    tier(t3, 'neben', seite, 0.55, 0.16),
  ];
  const lage = r.pick(['oben', 'unten', 'neben']);
  const ort = { oben: `oben auf ${mitArtikelDativ(b)}`, unten: `unter ${mitArtikelDativ(b)}`, neben: `neben ${mitArtikelDativ(b)}` }[lage];
  const t = { oben: t1, unten: t2, neben: t3 }[lage];
  return A.hoerenTippen({
    frage: `Tippe auf das Tier ${ort}.`, auftrag: `Tippe auf das Tier ${ort}.`,
    szene: { art: 'frei', elemente }, loesung: [lage],
    hinweis: { oben: `Oben ist da, wo der Himmel ist. Welches Tier ist oben auf ${mitArtikelDativ(b)}?`, unten: `Unter ${mitArtikelDativ(b)} heisst: darunter, näher am Boden.`, neben: `Neben ${mitArtikelDativ(b)} heisst: auf der Seite, gleich hoch.` }[lage],
    erklaerung: `${NOM[t[2]]} ${t[1]} ist ${ort}.`,
    bilder: elemente.map((e) => e.bild),
    sig: sig(lage, b[1], t1[1], t2[1], t3[1], seite), daten: { lage, elemente },
  });
}

function lageStufe2(r) {
  const seite = r.pick(['links', 'rechts']);
  const hinweis = 'Streck beide Hände aus, die Daumen zur Seite. Die Hand, die ein L macht, ist links.';
  if (r.bool(0.5)) {
    const b = r.pick(BEZUG);
    const [t1, t2, t3] = r.sample(TIERE, 3);
    const elemente = [
      { id: 'bezug', bild: b[0], name: b[1], x: 0.5, y: 0.55, w: 0.26, deko: true },
      tier(t1, 'links', 0.17, 0.6, 0.16), tier(t2, 'rechts', 0.83, 0.6, 0.16), tier(t3, 'oben', 0.5, 0.24, 0.15),
    ];
    const t = seite === 'links' ? t1 : t2;
    return A.hoerenTippen({
      frage: `Tippe auf das Tier ${seite} vom ${b[1]}.`, auftrag: `Tippe auf das Tier ${seite} vom ${b[1]}.`,
      szene: { art: 'frei', elemente }, loesung: [seite],
      hinweis, erklaerung: `${NOM[t[2]]} ${t[1]} ist ${seite} vom ${b[1]}.`,
      bilder: elemente.map((e) => e.bild),
      sig: sig('bezug', seite, b[1], t1[1], t2[1], t3[1]), daten: { lage: seite, elemente },
    });
  }
  const tiere = r.sample(TIERE, 3);
  const elemente = tiere.map((t, i) => tier(t, ['links', 'mitte', 'rechts'][i], [0.18, 0.5, 0.82][i], 0.6, 0.17));
  const t = seite === 'links' ? tiere[0] : tiere[2];
  return A.hoerenTippen({
    frage: `Tippe auf das Tier ganz ${seite}.`, auftrag: `Tippe auf das Tier ganz ${seite}.`,
    szene: { art: 'frei', elemente }, loesung: [seite],
    hinweis, erklaerung: `${NOM[t[2]]} ${t[1]} ist ganz ${seite}.`,
    bilder: elemente.map((e) => e.bild),
    sig: sig('reihe', seite, ...tiere.map((x) => x[1])), daten: { lage: seite, elemente },
  });
}

function lageStufe3(r) {
  if (r.bool(0.5)) {
    // zwischen: vier Tiere in einer Reihe, gesucht ist eines der beiden mittleren
    const tiere = r.sample(TIERE, 4);
    const elemente = tiere.map((t, i) => tier(t, 't' + i, [0.14, 0.38, 0.62, 0.86][i], 0.6, 0.17));
    const i = r.pick([1, 2]);
    const links = tiere[i - 1], rechts = tiere[i + 1];
    const ort = `zwischen ${mitArtikelDativ(links)} und ${mitArtikelDativ(rechts)}`;
    return A.hoerenTippen({
      frage: `Tippe auf das Tier ${ort}.`, auftrag: `Tippe auf das Tier ${ort}.`,
      szene: { art: 'frei', elemente }, loesung: ['t' + i],
      hinweis: `Such zuerst ${links[2] === 'der' ? 'den' : links[2]} ${links[1]} und ${rechts[2] === 'der' ? 'den' : rechts[2]} ${rechts[1]}. Welches Tier steht genau dazwischen?`,
      erklaerung: `${NOM[tiere[i][2]]} ${tiere[i][1]} steht ${ort}.`,
      bilder: elemente.map((e) => e.bild),
      sig: sig('zwischen', i, ...tiere.map((t) => t[1])), daten: { lage: 'zwischen', index: i, elemente },
    });
  }
  // vor und hinter: das hintere Tier ist teilweise verdeckt, das vordere verdeckt den Bezug
  const b = r.pick(BEZUG);
  const [tv, th] = r.sample(TIERE, 2);
  const vorne = r.pick([-1, 1]);
  const elemente = [
    { id: 'hinter', bild: th[0], name: th[1], x: 0.5 - vorne * 0.2, y: 0.38, w: 0.15, z: 0 },
    { id: 'bezug', bild: b[0], name: b[1], x: 0.5, y: 0.5, w: 0.34, z: 1, deko: true },
    { id: 'vor', bild: tv[0], name: tv[1], x: 0.5 + vorne * 0.12, y: 0.7, w: 0.2, z: 2 },
  ];
  const lage = r.pick(['vor', 'hinter']);
  const t = lage === 'vor' ? tv : th;
  const ort = `${lage} ${mitArtikelDativ(b)}`;
  return A.hoerenTippen({
    frage: `Tippe auf das Tier ${ort}.`, auftrag: `Tippe auf das Tier ${ort}.`,
    szene: { art: 'frei', elemente }, loesung: [lage],
    hinweis: lage === 'hinter' ? `Hinter ${mitArtikelDativ(b)} heisst: ${b[2] === 'der' ? 'Der' : 'Das'} ${b[1]} versteckt das Tier ein wenig.` : `Vor ${mitArtikelDativ(b)} heisst: Das Tier ist näher bei dir und verdeckt ein Stück vom ${b[1]}.`,
    erklaerung: `${NOM[t[2]]} ${t[1]} ist ${ort}.`,
    bilder: elemente.map((e) => e.bild),
    sig: sig(lage, b[1], tv[1], th[1], vorne), daten: { lage, elemente },
  });
}

// --- Spiegeln ---
const B = 6, H = 4, ACHSE = 3;
const spiegelX = (x) => 2 * ACHSE - 1 - x;
const schl = (c) => `${c[0]},${c[1]}`;
const sortiert = (zellen) => zellen.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]);
const gleicheMenge = (a, b) => a.length === b.length && a.every((c) => b.some((d) => d[0] === c[0] && d[1] === c[1]));
// Zusammenhängende Figur aus n Kästchen links der Achse (x 0 bis 2)
function figurLinks(r, n) {
  const zellen = [[r.int(0, ACHSE - 1), r.int(0, H - 1)]];
  for (let v = 0; zellen.length < n && v < 500; v++) {
    const [x, y] = r.pick(zellen);
    const [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    const c = [x + dx, y + dy];
    if (c[0] < 0 || c[0] >= ACHSE || c[1] < 0 || c[1] >= H || zellen.some((d) => d[0] === c[0] && d[1] === c[1])) continue;
    zellen.push(c);
  }
  return sortiert(zellen);
}
const gespiegelt = (zellen) => sortiert(zellen.map(([x, y]) => [spiegelX(x), y]));
const spiegelBild = (figur) => ({ art: 'spiegel', b: B, h: H, figur: sortiert(figur), achse: ACHSE });

function spiegelStufe1(r) {
  for (let v = 0; v < 100; v++) {
    const links = figurLinks(r, r.int(3, 4));
    const richtigR = gespiegelt(links);
    const verschoben = sortiert(links.map(([x, y]) => [x + ACHSE, y]));
    const gekippt = sortiert(richtigR.map(([x, y]) => [x, H - 1 - y]));
    if (gleicheMenge(verschoben, richtigR) || gleicheMenge(gekippt, richtigR) || gleicheMenge(gekippt, verschoben)) continue;
    const opt = (rechts) => ({ visual: spiegelBild([...links, ...rechts]) });
    const { optionen, richtig } = auswahl(r, opt(richtigR), [opt(verschoben), opt(gekippt)], 3);
    return A.wahlBild({
      frage: 'Der Strich ist ein Spiegel. Bei welchem Bild ist die Figur richtig gespiegelt?',
      optionen, richtig,
      hinweis: 'Im Spiegel ist alles gleich weit vom Strich weg. Was nah am Strich ist, bleibt nah am Strich.',
      erklaerung: 'Bei diesem Bild ist die rechte Seite genau das Spiegelbild der linken Seite.',
      sig: sig(...links.map(schl)), daten: { links, rechts: richtigR },
    });
  }
  return null;
}

function spiegelStufe2(r) {
  const links = figurLinks(r, r.int(2, 4));
  const loesung = gespiegelt(links).map(schl);
  return A.antippen({
    frage: 'Der Strich ist ein Spiegel. Tippe auf der rechten Seite die Kästchen an, die das Spiegelbild ergeben.',
    visual: spiegelBild(links), loesung,
    hinweis: 'Zähle bei jedem Kästchen, wie weit es vom Strich weg ist. Das Spiegelbild ist auf der anderen Seite gleich weit weg.',
    erklaerung: 'So sieht das Spiegelbild aus: gleich weit vom Strich weg, nur auf der anderen Seite.',
    sig: sig(...links.map(schl)), daten: { links },
  });
}

function spiegelStufe3(r) {
  for (let v = 0; v < 200; v++) {
    const links = figurLinks(r, r.int(2, 4));
    const rechts = gespiegelt(links);
    const symmetrisch = [...links, ...rechts];
    const veraendert = () => {
      // ein Kästchen rechts an einen freien Nachbarplatz auf der rechten Seite verschieben
      const weg = r.pick(rechts);
      const rest = rechts.filter((c) => c !== weg);
      const frei = [];
      for (const [x, y] of rest.length ? rest : [weg]) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c = [x + dx, y + dy];
        if (c[0] >= ACHSE && c[0] < B && c[1] >= 0 && c[1] < H && !rechts.some((d) => d[0] === c[0] && d[1] === c[1])) frei.push(c);
      }
      if (!frei.length) return null;
      return sortiert([...links, ...rest, r.pick(frei)]);
    };
    const f1 = veraendert(), f2 = veraendert();
    if (!f1 || !f2 || gleicheMenge(f1, f2)) continue;
    const opt = (fig) => ({ visual: spiegelBild(fig) });
    const { optionen, richtig } = auswahl(r, opt(symmetrisch), [opt(f1), opt(f2)], 3);
    return A.wahlBild({
      frage: 'Welche Figur ist auf beiden Seiten vom Strich gleich, wie im Spiegel?',
      optionen, richtig,
      hinweis: 'Vergleiche Reihe für Reihe: Ist rechts vom Strich alles genau gleich weit weg wie links?',
      erklaerung: 'Diese Figur ist symmetrisch: Die rechte Seite ist das Spiegelbild der linken.',
      sig: sig(...links.map(schl)), daten: { links },
    });
  }
  return null;
}

// --- Wege mit Pfeilen (Gitter) ---
const SCHRITT = { rechts: [1, 0], links: [-1, 0], oben: [0, -1], unten: [0, 1] };
const ZIELE = [['🍎', 'Apfel', 'der'], ['🍐', 'Birne', 'die'], ['🍓', 'Erdbeere', 'die'], ['🍄', 'Pilz', 'der'], ['⭐', 'Stern', 'der'], ['🥚', 'Ei', 'das'], ['🍌', 'Banane', 'die'], ['🌼', 'Blume', 'die']];
const bei = (z) => (z[2] === 'die' ? `bei der ${z[1]}` : `beim ${z[1]}`);
const zum = (z) => (z[2] === 'die' ? `zur ${z[1]}` : `zum ${z[1]}`);
function laufe(start, pfeile) {
  let [x, y] = start;
  const weg = [[x, y]];
  for (const p of pfeile) { x += SCHRITT[p][0]; y += SCHRITT[p][1]; weg.push([x, y]); }
  return weg;
}
const imGitter = (c, b, h) => c[0] >= 0 && c[0] < b && c[1] >= 0 && c[1] < h;
const gleich = (a, b) => a[0] === b[0] && a[1] === b[1];
const TAUSCH = { rechts: 'links', links: 'rechts', oben: 'unten', unten: 'oben' };

function wegStufe1(r) {
  const b = 5, h = 4;
  for (let v = 0; v < 300; v++) {
    const start = [r.int(0, b - 1), r.int(0, h - 1)];
    const pfeile = Array.from({ length: r.int(2, 4) }, () => r.pick(Object.keys(SCHRITT)));
    const weg = laufe(start, pfeile);
    if (!weg.every((c) => imGitter(c, b, h))) continue;
    const ende = weg[weg.length - 1];
    if (weg.slice(0, -1).some((c) => gleich(c, ende))) continue;   // der Weg kommt nicht schon vorher am Ziel vorbei
    // Ablenker: ein Pfeil zu wenig, links und rechts vertauscht, oben und unten vertauscht, ein Pfeil zu viel
    const kandidaten = [
      weg[weg.length - 2],
      laufe(start, pfeile.map((p) => (p === 'links' || p === 'rechts' ? TAUSCH[p] : p))).pop(),
      laufe(start, pfeile.map((p) => (p === 'oben' || p === 'unten' ? TAUSCH[p] : p))).pop(),
      laufe(start, [...pfeile, pfeile[pfeile.length - 1]]).pop(),
    ];
    const ablenker = [];
    for (const c of r.shuffle(kandidaten)) {
      if (!imGitter(c, b, h) || gleich(c, start) || weg.some((w) => gleich(w, c)) || ablenker.some((a) => gleich(a, c))) continue;
      ablenker.push(c);
    }
    for (let w = 0; ablenker.length < 2 && w < 100; w++) {
      const c = [r.int(0, b - 1), r.int(0, h - 1)];
      if (!gleich(c, start) && !weg.some((x) => gleich(x, c)) && !ablenker.some((a) => gleich(a, c))) ablenker.push(c);
    }
    const bilder = r.sample(ZIELE, 3);
    const ziele = [{ x: ende[0], y: ende[1], bild: bilder[0][0] }, ...ablenker.slice(0, 2).map((c, i) => ({ x: c[0], y: c[1], bild: bilder[i + 1][0] }))];
    const { optionen, richtig } = auswahl(r, { bild: bilder[0][0] }, bilder.slice(1).map((z) => ({ bild: z[0] })), 3);
    return A.wahlBild({
      frage: 'Der Fuchs geht den Pfeilen nach, Feld für Feld. Wo kommt er an?',
      visual: { art: 'gitter', b, h, start, pfeile, hindernisse: [], ziele },
      optionen, richtig,
      hinweis: 'Geh mit dem Finger vom Fuchs aus, für jeden Pfeil ein Feld weiter.',
      erklaerung: `Der Fuchs geht ${pfeile.map((p) => 'nach ' + p).join(', ')}. Er kommt ${bei(bilder[0])} an.`,
      bilder: bilder.map((z) => z[0]),
      sig: sig(...start, ...pfeile), daten: { start, pfeile, ziele, b, h },
    });
  }
  return null;
}

// Alle kürzesten Wege von start nach ziel (Breitensuche), höchstens grenze Stück
function kuerzesteWege(b, h, start, ziel, hindernisse, grenze = 300) {
  const frei = (c) => imGitter(c, b, h) && !hindernisse.some((d) => gleich(d, c));
  const dist = new Map([[schl(start), 0]]);
  const schlange = [start];
  while (schlange.length) {
    const c = schlange.shift();
    for (const [, [dx, dy]] of Object.entries(SCHRITT)) {
      const n = [c[0] + dx, c[1] + dy];
      if (frei(n) && !dist.has(schl(n))) { dist.set(schl(n), dist.get(schl(c)) + 1); schlange.push(n); }
    }
  }
  if (!dist.has(schl(ziel))) return [];
  const wege = [];
  const geh = (c, pfad) => {
    if (wege.length >= grenze) return;
    if (gleich(c, ziel)) { wege.push(pfad.slice()); return; }
    for (const [name, [dx, dy]] of Object.entries(SCHRITT)) {
      const n = [c[0] + dx, c[1] + dy];
      if (dist.get(schl(n)) === dist.get(schl(c)) + 1) { pfad.push(name); geh(n, pfad); pfad.pop(); }
    }
  };
  geh(start, []);
  // nur Wege, die zum Ziel hin kürzest sind: Abstand vom Ziel muss passen
  return wege.filter((w) => w.length === dist.get(schl(ziel)));
}
const kachel = (p) => 'pfeil:' + p;
function ausKachelnMoeglich(weg, kacheln) {
  const vorrat = kacheln.slice();
  for (const k of weg) { const i = vorrat.indexOf(k); if (i < 0) return false; vorrat.splice(i, 1); }
  return true;
}

function wegLegen(r, { b, h, mitHindernissen }) {
  for (let v = 0; v < 500; v++) {
    const start = [r.int(0, b - 1), r.int(0, h - 1)];
    const ziel = [r.int(0, b - 1), r.int(0, h - 1)];
    const dx = ziel[0] - start[0], dy = ziel[1] - start[1];
    const manhattan = Math.abs(dx) + Math.abs(dy);
    if (manhattan < 2 || manhattan > 4) continue;
    let hindernisse = [];
    if (mitHindernissen) {
      if (dx === 0 && dy === 0) continue;
      const anzahl = r.int(2, 3);
      for (let w = 0; hindernisse.length < anzahl && w < 50; w++) {
        const c = [r.int(0, b - 1), r.int(0, h - 1)];
        if (!gleich(c, start) && !gleich(c, ziel) && !hindernisse.some((d) => gleich(d, c))) hindernisse.push(c);
      }
      // Beide einfachen Wege (zuerst waagrecht oder zuerst senkrecht) müssen versperrt sein
      const waag = [...Array(Math.abs(dx)).fill(dx > 0 ? 'rechts' : 'links'), ...Array(Math.abs(dy)).fill(dy > 0 ? 'unten' : 'oben')];
      const senk = [...Array(Math.abs(dy)).fill(dy > 0 ? 'unten' : 'oben'), ...Array(Math.abs(dx)).fill(dx > 0 ? 'rechts' : 'links')];
      const versperrt = (pf) => laufe(start, pf).some((c) => hindernisse.some((d) => gleich(d, c)));
      if (!versperrt(waag) || !versperrt(senk)) continue;
    }
    const wege = kuerzesteWege(b, h, start, ziel, hindernisse);
    if (!wege.length || wege[0].length > 6 || wege.length > 60) continue;
    const loesung = wege[0].map(kachel);
    const richtungen = new Set(wege[0]);
    const extra = Object.keys(SCHRITT).filter((p) => !richtungen.has(p));
    const kacheln = r.shuffle([...loesung, ...r.sample(extra.length ? extra : Object.keys(SCHRITT), Math.min(2, Math.max(1, extra.length))).map(kachel)]);
    const alternativen = wege.slice(1).map((w) => w.map(kachel)).filter((w) => ausKachelnMoeglich(w, kacheln));
    const zb = r.pick(ZIELE);
    return A.legen({
      frage: mitHindernissen
        ? `Lege mit den Pfeilen einen kurzen Weg vom Fuchs ${zum(zb)}. Die Steine sind im Weg.`
        : `Lege mit den Pfeilen einen Weg vom Fuchs ${zum(zb)}.`,
      visual: { art: 'gitter', b, h, start, pfeile: [], hindernisse, ziele: [{ x: ziel[0], y: ziel[1], bild: zb[0] }] },
      kacheln, loesung, alternativen, felder: loesung.length,
      hinweis: mitHindernissen ? 'Geh mit dem Finger um die Steine herum und zähle die Felder.' : 'Zähle: Wie viele Felder nach links oder rechts? Wie viele nach oben oder unten?',
      erklaerung: `Zum Beispiel so: ${wege[0].map((p) => 'nach ' + p).join(', ')}. Das sind ${wege[0].length} Felder.`,
      bilder: [zb[0]],
      sig: sig(...start, ...ziel, ...hindernisse.map(schl)), daten: { b, h, start, ziel, hindernisse, laenge: wege[0].length },
    });
  }
  return null;
}

export const generatoren = {
  'M-FO-01': { 1: formenStufe1, 2: formenStufe2, 3: formenStufe3 },
  'M-FO-02': { 1: koerperStufe1, 2: koerperStufe2, 3: koerperStufe3 },
  'M-FO-03': { 1: musterFarben, 2: musterFormen, 3: musterZahlen },
  'M-FO-04': { 1: lageStufe1, 2: lageStufe2, 3: lageStufe3 },
  'M-FO-05': { 1: spiegelStufe1, 2: spiegelStufe2, 3: spiegelStufe3 },
  'M-FO-06': {
    1: wegStufe1,
    2: (r) => wegLegen(r, { b: 5, h: 4, mitHindernissen: false }),
    3: (r) => wegLegen(r, { b: 6, h: 4, mitHindernissen: true }),
  },
};
