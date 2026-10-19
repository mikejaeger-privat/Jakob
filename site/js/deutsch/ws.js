// Deutsch WS: Wortschatz. Oberbegriffe, Gegenteile, Einzahl und Mehrzahl, Reimpaare, Bildergeschichten, Farben,
// Wochentage, Zahlwörter, Nomen und Begleiter. Regeln: tools/SPEC-AUFGABEN.md (Abschnitte 6 bis 8).
import { A, sig, auswahl, werkzeug, zerlege, reimteil, FARBE_ID, WOCHENTAGE, ZAHLWOERTER, HOERFARBEN } from './lib.js';

// Sprechfassung eines Worts (z. B. «Velo» als «Welo»)
const sp = (w) => w.sprich || w.wort;
const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const aufzaehlung = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} und ${xs[xs.length - 1]}`);
const EIN = { der: 'ein', die: 'eine', das: 'ein' };

// Einheiten, die das Kind sieht: Sichtwörter nur mit ihren Einzelbuchstaben (Regel 6), sonst nach zerlege
function brauchtSicht(T, ...texte) {
  const s = new Set();
  for (const t of texte) for (const wort of String(t).split(/[\s.,!?«»:;-]+/).filter(Boolean)) {
    if (T.istSichtwort(wort)) for (const c of wort.toLowerCase()) s.add(c);
    else for (const e of zerlege(wort)) s.add(e);
  }
  return [...s];
}
const einheitenOk = (T, text) => brauchtSicht(T, text).every((b) => T.frei.has(b));

// --- D-WS-01 Oberbegriffe ---
const OBER = {
  Tiere: { zu: 'zu den Tieren', kiste: 'Tiere' },
  Obst: { zu: 'zum Obst', kiste: 'Obst' },
  Gemüse: { zu: 'zum Gemüse', kiste: 'Gemüse' },
  Kleider: { zu: 'zu den Kleidern', kiste: 'Kleider' },
  Fahrzeuge: { zu: 'zu den Fahrzeugen', kiste: 'Fahrzeuge' },
  Musik: { zu: 'zu den Musikinstrumenten', kiste: 'Musikinstrumente' },
  Pflanzen: { zu: 'zu den Pflanzen', kiste: 'Pflanzen' },
  Körper: { zu: 'zu den Körperteilen', kiste: 'Körperteile' },
  Werkzeug: { zu: 'zum Werkzeug', kiste: 'Werkzeug' },
};
// Oberbegriffe, die sich für ein Kind überschneiden können, nie zusammen (Obst, Gemüse und Pflanzen; Vogel und Flugzeug;
// Handschuh und Hand). Obst und Gemüse damit auch nie als Kistenpaar.
const OBER_GETRENNT = { Obst: ['Gemüse', 'Pflanzen'], Gemüse: ['Obst', 'Pflanzen'], Pflanzen: ['Obst', 'Gemüse'], Tiere: ['Fahrzeuge'], Fahrzeuge: ['Tiere'], Kleider: ['Körper'], Körper: ['Kleider'] };
const getrennt = (a, b) => a === b || (OBER_GETRENNT[a] || []).includes(b);
const konflikt = (T, ober) => T.W.oberKonflikt?.[ober] || [];
// Wörter des Oberbegriffs: ohne oberUnsicher und ohne die Wörter in oberKonflikt des Oberbegriffs
// (ohne Wörter mit eigener Sprechfassung wie «Velo»: die Namen werden so gesprochen, wie sie geschrieben sind)
// Mikrofon steht im Lexikon bei Musik, ist aber kein Musikinstrument
const KEIN_INSTRUMENT = ['Mikrofon'];
const oberWoerter = (T, ober) => T.woerter.filter((w) => w.bild && w.ober === ober && !w.sprich && !w.oberUnsicher && !konflikt(T, ober).includes(w.wort) && !(ober === 'Musik' && KEIN_INSTRUMENT.includes(w.wort)));
// Ablenker: aus den anderen Oberbegriffen der Liste, ebenfalls ohne oberUnsicher und ohne oberKonflikt des gefragten
const fremdWoerter = (T, ober) => T.woerter.filter((w) => w.bild && OBER[w.ober] && !getrennt(ober, w.ober) && !w.sprich && !w.oberUnsicher && !konflikt(T, ober).includes(w.wort) && !KEIN_INSTRUMENT.includes(w.wort));
const passtZu = (T, w, liste) => liste.every((x) => x.wort !== w.wort && x.bild !== w.bild && !T.verwechselbar(w, x));
const opt = (w) => ({ bild: w.bild, wort: w.wort });

function oberWahl(r, T) {
  const ober = r.pick(Object.keys(OBER));
  const R = T.waehle(r, oberWoerter(T, ober), 1);
  if (!R) return null;
  const fremd = fremdWoerter(T, ober);
  const falsche = [];
  // zwei Ablenker aus zwei verschiedenen anderen Oberbegriffen
  for (const k of r.shuffle([...new Set(fremd.map((w) => w.ober))])) {
    if (falsche.length >= 2) break;
    const f = T.waehle(r, fremd.filter((w) => w.ober === k && passtZu(T, w, [...R, ...falsche])), 1);
    if (f) falsche.push(f[0]);
  }
  if (falsche.length < 2) return null;
  const w = R[0];
  const { optionen, richtig } = auswahl(r, opt(w), falsche.map(opt), 3);
  return A.wahlBild({
    frage: `Welches Bild gehört ${OBER[ober].zu}? Tippe darauf.`,
    optionen, richtig, namenSprechen: true, braucht: [],
    hinweis: `Hör dir die Namen nochmals an. Frag dich bei jedem Bild: Gehört es ${OBER[ober].zu}?`,
    erklaerung: `${gross(T.mitArtikel(w))} gehört ${OBER[ober].zu}.`,
    sig: sig(ober, w.wort, ...falsche.map((x) => x.wort).sort()), daten: { ober, richtig: w.wort, falsche: falsche.map((x) => x.wort) },
  });
}

function oberFremd(r, T) {
  const ober = r.pick(Object.keys(OBER));
  const drei = T.waehle(r, oberWoerter(T, ober), 3);
  if (!drei) return null;
  const f = T.waehle(r, fremdWoerter(T, ober).filter((w) => passtZu(T, w, drei)), 1);
  if (!f) return null;
  const { optionen, richtig } = auswahl(r, opt(f[0]), drei.map(opt), 4);
  return A.wahlBild({
    frage: 'Drei Bilder gehören zusammen. Tippe auf das Bild, das nicht dazu passt.',
    optionen, richtig, namenSprechen: true, braucht: [],
    hinweis: 'Hör dir die Namen nochmals an. Welche drei gehören zusammen?',
    erklaerung: `${aufzaehlung(drei.map((w) => w.wort))} gehören ${OBER[ober].zu}. ${gross(T.mitArtikel(f[0]))} gehört nicht dazu.`,
    sig: sig(ober, f[0].wort, ...drei.map((w) => w.wort).sort()), daten: { ober, fremd: f[0].wort, gruppe: drei.map((w) => w.wort) },
  });
}

// Zwei Kisten: je ein Bild gehört in die Kiste mit dem Beispiel des gleichen Oberbegriffs (Zuordnen kennt nur Paare)
function oberKisten(r, T) {
  const obers = Object.keys(OBER);
  const a = r.pick(obers);
  const b = r.pick(obers.filter((x) => !getrennt(a, x)));
  if (!b) return null;
  const ga = T.waehle(r, oberWoerter(T, a), 2);
  if (!ga) return null;
  const gb = T.waehle(r, oberWoerter(T, b).filter((w) => passtZu(T, w, ga) && !konflikt(T, a).includes(w.wort)), 2);
  if (!gb || ga.some((w) => konflikt(T, b).includes(w.wort))) return null;
  // ga[0], gb[0]: zu sortierende Bilder; ga[1], gb[1]: Beispiel in der Kiste
  const kiste = (ober, beispiel) => ({ szene: { art: 'lage', bild: beispiel.bild, bezug: '📦', lage: 'in' }, wort: `Kiste für ${OBER[ober].kiste}` });
  const paare = r.shuffle([[opt(ga[0]), kiste(a, ga[1])], [opt(gb[0]), kiste(b, gb[1])]]);
  return A.zuordnen({
    frage: 'Sortiere die Bilder in die richtige Kiste. Tippe auf ein Bild und dann auf seine Kiste.',
    sprich: `Sortiere die Bilder in die richtige Kiste. … Eine Kiste ist für ${OBER[a].kiste}, die andere für ${OBER[b].kiste}. … Tippe auf ein Bild und dann auf seine Kiste.`,
    paare, braucht: [],
    hinweis: 'Tippe auf eine Kiste und hör zu, wofür sie ist. Was liegt schon darin?',
    erklaerung: `${gross(T.mitArtikel(ga[0]))} gehört ${OBER[a].zu}. ${gross(T.mitArtikel(gb[0]))} gehört ${OBER[b].zu}.`,
    sig: sig(a, ga[0].wort, ga[1].wort, b, gb[0].wort, gb[1].wort), daten: { kisten: { [a]: [ga[0].wort, ga[1].wort], [b]: [gb[0].wort, gb[1].wort] } },
  });
}

// --- D-WS-02 Gegenteile (feste Inhalte) ---
// Gegenteile, die ein Kind leicht verwechselt, nie in derselben Aufgabe (Sonne ist auch heiss, ein Baby ist auch klein …)
const GT_KONFLIKT = [['heiss-kalt', 'hell-dunkel'], ['gross-klein', 'viel-wenig'], ['gross-klein', 'alt-jung'], ['oben-unten', 'vor-hinter'], ['gross-klein', 'schnell-langsam'], ['hell-dunkel', 'viel-wenig']];
const gtBegriff = (g) => g.begriff || `${g.a.wort}-${g.b.wort}`;
const gtVertraeglich = (x, y) => gtBegriff(x) !== gtBegriff(y) && !GT_KONFLIKT.some(([p, q]) => (gtBegriff(x) === p && gtBegriff(y) === q) || (gtBegriff(x) === q && gtBegriff(y) === p));
const gtBild = (s) => (s.szene ? { szene: s.szene } : { bild: s.bild });
const gegenteile = (ctx) => (ctx.inhalte?.gegenteile || []).filter((g) => g.a?.wort && g.b?.wort && (g.a.bild || g.a.szene) && (g.b.bild || g.b.szene));
function waehleGt(r, liste, n, gegen = []) {
  const aus = [];
  for (const g of r.shuffle(liste)) {
    if (aus.length >= n) break;
    if ([...gegen, ...aus].every((x) => gtVertraeglich(x, g))) aus.push(g);
  }
  return aus.length === n ? aus : null;
}

function gtPaare(r, ctx, n) {
  const gs = waehleGt(r, gegenteile(ctx), n);
  if (!gs) return null;
  // Richtung je Paar zufällig: links das eine, rechts sein Gegenteil
  const seiten = gs.map((g) => (r.bool() ? [g.a, g.b] : [g.b, g.a]));
  const paare = seiten.map(([x, y]) => [{ ...gtBild(x), wort: x.wort }, { ...gtBild(y), wort: y.wort }]);
  return A.zuordnen({
    frage: 'Verbinde die Gegenteile. Tippe auf ein Bild und dann auf das Bild, das das Gegenteil zeigt.',
    paare, braucht: [],
    hinweis: 'Tippe auf ein Bild und hör zu, was es zeigt. Welches andere Bild zeigt genau das Gegenteil?',
    erklaerung: seiten.map(([x, y]) => `${gross(x.wort)} und ${y.wort} sind Gegenteile.`).join(' '),
    sig: sig(...seiten.map(([x, y], i) => `${gs[i].id}:${x.wort}>${y.wort}`).sort()),
    daten: { ids: gs.map((g) => g.id), paare: seiten.map(([x, y]) => [x.wort, y.wort]) },
  });
}

function gtWahl(r, ctx, mitSatz) {
  const liste = gegenteile(ctx).filter((g) => !mitSatz || g.satz);
  if (!liste.length) return null;
  const g = r.pick(liste);
  const umgekehrt = mitSatz ? !!g.satzB && r.bool() : r.bool();
  const [gehoert, loesung] = umgekehrt ? [g.b, g.a] : [g.a, g.b];
  const andere = waehleGt(r, gegenteile(ctx), 1, [g]);
  if (!andere) return null;
  const dritte = r.bool() ? andere[0].a : andere[0].b;
  const { optionen, richtig } = auswahl(r, gtBild(loesung), [gtBild(gehoert), gtBild(dritte)], 3);
  const satz = umgekehrt ? g.satzB : g.satz;
  return A.wahlBild({
    frage: mitSatz ? 'Hör den Satz. Tippe auf das Bild, das das Gegenteil zeigt.' : `Was ist das Gegenteil von ${gehoert.wort}? Tippe auf das Bild.`,
    sprich: mitSatz ? `Hör gut zu. … ${satz} … Tippe auf das Bild, das das Gegenteil zeigt.` : `Was ist das Gegenteil von … ${gehoert.wort}? … Tippe auf das Bild.`,
    optionen, richtig, namenSprechen: false, braucht: [],
    hinweis: mitSatz ? 'Hör den Satz nochmals an. Wie ist es im Satz? Such das Bild, bei dem es genau umgekehrt ist.' : `Überleg zuerst: Was ist das Gegenteil von ${gehoert.wort}? Dann such das Bild dazu.`,
    erklaerung: `Das Gegenteil von ${gehoert.wort} ist ${loesung.wort}.`,
    sig: sig(g.id, umgekehrt ? 'b' : 'a', andere[0].id, dritte.wort), daten: { id: g.id, gehoert: gehoert.wort, loesung: loesung.wort, satz: mitSatz ? satz : null },
  });
}

// --- D-WS-03 Einzahl und Mehrzahl ---
// Mehrzahl gesetzt und anders als die Einzahl (deutlicher als nur der Artikel), ohne bildMehrere, Name sicher, keine Sonder-Sprechfassung
// Bild zeigt schon mehrere (🍇, 🫒) oder die Mehrzahl ist für ein Kind sinnlos (Monde)
const EINZAHL_UNSICHER = ['Traube', 'Olive', 'Mond'];
const mehrzahlWoerter = (T, lesen) => T.woerter.filter((w) => w.bild && w.mehrzahl && w.mehrzahl !== w.wort && !w.bildMehrere && !w.nameUnsicher && !w.sprich && !EINZAHL_UNSICHER.includes(w.wort)
  && `${w.artikel} ${w.wort}` !== `die ${w.mehrzahl}` && (!lesen || (einheitenOk(T, `${w.artikel} ${w.wort}`) && einheitenOk(T, `die ${w.mehrzahl}`))));
const einsBild = (w) => ({ bild: w.bild });
const vieleBild = (w, n) => ({ szene: { art: 'menge', bild: w.bild, anzahl: n } });

function einzahlMehrzahl(r, T, { dinge, lesen }) {
  const ws = T.waehle(r, mehrzahlWoerter(T, lesen), dinge);
  if (!ws) return null;
  const w = ws[0];
  const mehr = r.bool();
  const n = r.int(3, 5);
  const gesucht = mehr ? `die ${w.mehrzahl}` : `${w.artikel} ${w.wort}`;
  const richtigOpt = mehr ? vieleBild(w, n) : einsBild(w);
  const falsche = [mehr ? einsBild(w) : vieleBild(w, n)];
  for (const x of ws.slice(1)) falsche.push(einsBild(x), vieleBild(x, r.int(3, 5)));
  const { optionen, richtig } = auswahl(r, richtigOpt, falsche, 2 * dinge);
  const erkl = `Bei «${T.mitArtikel(w)}» ist es nur eins. Bei «die ${w.mehrzahl}» sind es mehrere.`;
  const daten = { wort: w.wort, mehrzahl: w.mehrzahl, gesucht: mehr ? 'mehrzahl' : 'einzahl', andere: ws.slice(1).map((x) => x.wort) };
  const s = sig(gesucht, ...ws.slice(1).map((x) => x.wort).sort());
  if (lesen) {
    return A.bildWort({
      frage: 'Lies. Tippe auf das passende Bild.', zeige: gesucht, sprichNachher: gesucht, optionen, richtig,
      hinweis: 'Lies genau, auch das Ende des Wortes. Ist es eins oder sind es mehrere?',
      erklaerung: `Da steht «${gesucht}». ${erkl}`,
      braucht: brauchtSicht(T, gesucht), sig: s, daten,
    });
  }
  return A.wahlBild({
    frage: `Hör gut zu: ${gesucht}. Tippe auf das passende Bild.`,
    sprich: `Hör gut zu … ${gesucht}. … Tippe auf das passende Bild.`,
    optionen, richtig, namenSprechen: false, braucht: [],
    hinweis: 'Hör genau auf das Wort und auf das Ende: Ist es eins oder sind es mehrere?',
    erklaerung: erkl, sig: s, daten,
  });
}

// --- D-WS-04 Reimpaare ---
function reimPaare(r, T, n) {
  const gruppen = new Map();
  // Bildname wird beim Antippen gesprochen (unsichere Namen erlaubt); keine Wörter mit eigener Sprechfassung
  for (const w of T.woerter) if (w.reim && w.bild && !w.sprich) { if (!gruppen.has(w.reim)) gruppen.set(w.reim, []); gruppen.get(w.reim).push(w); }
  const paare = [];
  const alle = [];
  for (const g of r.shuffle([...gruppen.values()].filter((l) => l.length >= 2))) {
    if (paare.length >= n) break;
    const rt = reimteil(g[0].wort);
    // Paare dürfen sich untereinander nicht reimen (Regel 2)
    if (alle.some((x) => x.reim === g[0].reim || reimteil(x.wort) === rt)) continue;
    const p = T.waehle(r, g.filter((w) => passtZu(T, w, alle) && reimteil(w.wort) === rt), 2);
    if (!p) continue;
    paare.push(p); alle.push(...p);
  }
  if (paare.length < n || !T.zusammenOk(alle)) return null;
  return A.zuordnen({
    frage: 'Verbinde die Bilder, die sich reimen. Tippe auf ein Bild und dann auf sein Reimwort.',
    paare: paare.map(([x, y]) => [opt(x), opt(y)]), braucht: [],
    hinweis: 'Tippe auf ein Bild und hör gut auf das Ende des Wortes. Welches andere Wort endet gleich?',
    erklaerung: paare.map(([x, y]) => `${x.wort} und ${y.wort} reimen sich.`).join(' '),
    sig: sig(...paare.map(([x, y]) => [x.wort, y.wort].sort().join('+')).sort()), daten: { paare: paare.map(([x, y]) => [x.wort, y.wort]) },
  });
}

// --- D-WS-05 Bildergeschichte ordnen (feste Inhalte) ---
function bildergeschichte(r, ctx, stufe) {
  const liste = (ctx.inhalte?.bildergeschichten || []).filter((b) => b.stufen?.['D-WS-05'] === stufe && b.bilder?.length === b.sprich?.length);
  if (!liste.length) return null;
  const g = r.pick(liste);
  const hoeren = stufe === 3;
  // Stufe 1 und 2: Antippen spricht den Satz zum Bild; Stufe 3: die Geschichte wird vorher erzählt
  const teile = g.bilder.map((b, i) => ({ ...(typeof b === 'string' ? { bild: b } : { szene: b }), ...(hoeren ? {} : { wort: g.sprich[i] }) }));
  return A.reihenfolge({
    art: 'bild', teile,
    frage: hoeren ? 'Hör die Geschichte. Lege dann die Bilder in die richtige Reihenfolge.' : 'Lege die Bilder in die richtige Reihenfolge. Was kommt zuerst?',
    sprich: hoeren ? ['Hör gut zu.', ...g.sprich, 'Lege jetzt die Bilder in die richtige Reihenfolge.'].join(' … ') : undefined,
    braucht: [],
    hinweis: hoeren ? 'Hör die Geschichte nochmals an. Was passiert zuerst, was am Schluss?' : 'Tippe auf ein Bild und hör zu. Was passiert zuerst, was am Schluss?',
    erklaerung: g.sprich.join(' '),
    sig: g.id, daten: { id: g.id },
  });
}

// --- D-WS-06 Farben ---
// Weiss ist auf hellem Grund kaum sichtbar und kommt als Farbklecks nicht vor
const FARBEN_KLECKS = ['rot', 'blau', 'gelb', 'grün', 'orange', 'violett', 'braun', 'schwarz', 'rosa'];
const FARBEN_AEHNLICH = [['rosa', 'violett'], ['rosa', 'rot'], ['orange', 'rot'], ['orange', 'gelb'], ['orange', 'braun'], ['braun', 'schwarz'], ['blau', 'violett']];
const farbenAehnlich = (a, b) => FARBEN_AEHNLICH.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
const klecks = (f) => ({ szene: { art: 'farbe', farbe: FARBE_ID[f] } });
// Dinge mit eindeutiger Farbe: [Wort, Farbe, wie gefragt, andere Farben, die das Ding auch haben kann (nie Ablenker)]
const FARBDINGE = [
  ['Banane', 'gelb', 'eine Banane', ['grün', 'braun']], ['Zitrone', 'gelb', 'eine Zitrone', ['grün']], ['Küken', 'gelb', 'ein Küken', ['braun']],
  ['Sonne', 'gelb', 'die Sonne', ['orange', 'rot']], ['Mais', 'gelb', 'Mais', ['orange']],
  ['Erdbeere', 'rot', 'eine Erdbeere', []], ['Tomate', 'rot', 'eine Tomate', ['grün', 'gelb', 'orange']], ['Kirsche', 'rot', 'eine Kirsche', ['schwarz', 'violett']],
  ['Gurke', 'grün', 'eine Gurke', []], ['Frosch', 'grün', 'ein Frosch', ['braun', 'gelb']], ['Brokkoli', 'grün', 'Brokkoli', []],
  ['Klee', 'grün', 'Klee', []], ['Kaktus', 'grün', 'ein Kaktus', []], ['Tanne', 'grün', 'eine Tanne', []],
  ['Karotte', 'orange', 'eine Karotte', ['gelb', 'rot', 'violett']], ['Mandarine', 'orange', 'eine Mandarine', ['gelb']], ['Kürbis', 'orange', 'ein Kürbis', ['gelb', 'grün']],
  ['Schwein', 'rosa', 'ein Schwein', ['braun', 'schwarz']], ['Flamingo', 'rosa', 'ein Flamingo', ['rot', 'orange']],
  ['Schokolade', 'braun', 'Schokolade', ['schwarz', 'weiss']],
];
function farbAblenker(r, richtig, n, auch = []) {
  const aus = [];
  for (const f of r.shuffle(FARBEN_KLECKS)) {
    if (aus.length >= n) break;
    if (f === richtig || auch.includes(f) || farbenAehnlich(f, richtig) || aus.some((x) => farbenAehnlich(x, f))) continue;
    aus.push(f);
  }
  return aus.length === n ? aus : null;
}

// --- D-WS-09 Begleiter ---
// Artikel weicht in der Schweiz oft ab oder schwankt (der Radio, der Butter, der Socken, das Magnet …): nicht verwenden
const ARTIKEL_UNSICHER = ['Tram', 'Radio', 'Butter', 'Brezel', 'Socke', 'Magnet', 'Kiwi', 'Taxi'];
// ohne Wörter, deren Mehrzahl gleich lautet (sonst ist «die Igel» auch richtig)
const begleiterWoerter = (T) => T.woerter.filter((w) => w.bild && ['der', 'die', 'das'].includes(w.artikel) && !w.nameUnsicher && !ARTIKEL_UNSICHER.includes(w.wort) && w.mehrzahl !== w.wort);
// Gross und klein sehen gleich aus (nur grösser): O o, S s, U u, V v, W w, Z z, C c, X x, Ö ö, Ü ü
const GLEICHE_FORM = ['c', 'o', 's', 'u', 'v', 'w', 'x', 'z', 'ö', 'ü'];

export const generatoren = {
  'D-WS-01': {
    1: (r, ctx) => oberWahl(r, werkzeug(ctx)),
    2: (r, ctx) => oberFremd(r, werkzeug(ctx)),
    3: (r, ctx) => oberKisten(r, werkzeug(ctx)),
  },

  'D-WS-02': {
    1: (r, ctx) => gtPaare(r, ctx, 3),
    2: (r, ctx) => gtWahl(r, ctx, false),
    3: (r, ctx) => gtWahl(r, ctx, true),
  },

  'D-WS-03': {
    1: (r, ctx) => einzahlMehrzahl(r, werkzeug(ctx), { dinge: 1, lesen: false }),
    2: (r, ctx) => einzahlMehrzahl(r, werkzeug(ctx), { dinge: 2, lesen: false }),
    3: (r, ctx) => einzahlMehrzahl(r, werkzeug(ctx), { dinge: r.bool() ? 1 : 2, lesen: true }),
  },

  'D-WS-04': {
    1: (r, ctx) => reimPaare(r, werkzeug(ctx), 2),
    2: (r, ctx) => reimPaare(r, werkzeug(ctx), 3),
    3: (r, ctx) => reimPaare(r, werkzeug(ctx), 4),
  },

  'D-WS-05': {
    1: (r, ctx) => bildergeschichte(r, ctx, 1),
    2: (r, ctx) => bildergeschichte(r, ctx, 2),
    3: (r, ctx) => bildergeschichte(r, ctx, 3),
  },

  'D-WS-06': {
    // gehörte Farbe antippen
    1: (r) => {
      const f = r.pick(FARBEN_KLECKS);
      const falsche = farbAblenker(r, f, 2);
      if (!falsche) return null;
      const { optionen, richtig } = auswahl(r, klecks(f), falsche.map(klecks), 3);
      return A.wahlBild({
        frage: `Tippe auf die Farbe ${f}.`, sprich: `Tippe auf die Farbe … ${f}.`,
        optionen, richtig, namenSprechen: false, braucht: [],
        hinweis: 'Hör nochmals gut hin und schau dir alle Farben an.',
        erklaerung: `Diese Farbe ist ${f}.`,
        sig: sig(f, ...falsche.slice().sort()), daten: { farbe: f, falsche },
      });
    },
    // Farbe eines Dings (nur gesprochen, das Ding wird nicht gezeigt)
    2: (r, ctx) => {
      const T = werkzeug(ctx);
      const [wort, f, wie, auch] = r.pick(FARBDINGE.filter(([w]) => T.wort(w)));
      const falsche = farbAblenker(r, f, 2, auch);
      if (!falsche) return null;
      const { optionen, richtig } = auswahl(r, klecks(f), falsche.map(klecks), 3);
      return A.wahlBild({
        frage: `Welche Farbe hat ${wie}? Tippe auf die Farbe.`, sprich: `Welche Farbe hat … ${wie}? … Tippe auf die Farbe.`,
        optionen, richtig, namenSprechen: false, braucht: [],
        hinweis: `Wie sieht ${wie} aus? Denk an die Farbe.`,
        erklaerung: `${gross(wie)} ist ${f}.`,
        sig: sig(wort, ...falsche.slice().sort()), daten: { wort, farbe: f, falsche },
      });
    },
    // Farbwort lesen
    3: (r, ctx) => {
      const T = werkzeug(ctx);
      const lesbar = FARBEN_KLECKS.filter((f) => einheitenOk(T, f));
      if (!lesbar.length) return null;
      const f = r.pick(lesbar);
      const falsche = farbAblenker(r, f, 2);
      if (!falsche) return null;
      const { optionen, richtig } = auswahl(r, klecks(f), falsche.map(klecks), 3);
      return A.bildWort({
        frage: 'Lies das Farbwort. Tippe auf die passende Farbe.', zeige: f, sprichNachher: f,
        optionen, richtig, braucht: brauchtSicht(T, f),
        hinweis: 'Lies das Wort langsam, Laut für Laut.',
        erklaerung: `Da steht ${f}.`,
        sig: sig(f, ...falsche.slice().sort()), daten: { farbe: f, falsche },
      });
    },
  },

  'D-WS-07': {
    // Welcher Tag kommt nach …? (Hörkarten)
    1: (r) => {
      const i = r.int(0, 6);
      const tag = WOCHENTAGE[i], nach = WOCHENTAGE[(i + 1) % 7];
      const andere = r.sample(WOCHENTAGE.filter((t) => t !== tag && t !== nach), 2);
      const tage = r.shuffle([nach, ...andere]);
      return A.wahlHoeren({
        frage: `Welcher Tag kommt nach dem ${tag}? Hör dir die Karten an und wähle.`,
        sprich: `Welcher Tag kommt nach dem ${tag}? … Hör dir die Karten an und wähle den richtigen Tag.`,
        optionen: tage.map((t, k) => ({ sprich: t, farbe: HOERFARBEN[k] })), richtig: tage.indexOf(nach), bild: '🗓️', braucht: [],
        hinweis: 'Die Woche beginnt am Montag. Sag die Wochentage leise der Reihe nach auf.',
        erklaerung: `Nach dem ${tag} kommt der ${nach}.`,
        sig: sig('nach', tag, ...andere.slice().sort()), daten: { tag, loesung: nach, andere },
      });
    },
    // gestern, heute, morgen (ohne echtes Datum)
    2: (r) => {
      const i = r.int(0, 6);
      const heute = WOCHENTAGE[i], gestern = WOCHENTAGE[(i + 6) % 7], morgen = WOCHENTAGE[(i + 1) % 7];
      const fragtGestern = r.bool();
      const loesung = fragtGestern ? gestern : morgen, gegen = fragtGestern ? morgen : gestern;
      const dritte = r.bool() ? heute : r.pick(WOCHENTAGE.filter((t) => ![heute, gestern, morgen].includes(t)));
      const tage = r.shuffle([loesung, gegen, dritte]);
      const frage = fragtGestern ? `Heute ist ${heute}. Welcher Tag war gestern?` : `Heute ist ${heute}. Welcher Tag ist morgen?`;
      return A.wahlHoeren({
        frage: `${frage} Hör dir die Karten an und wähle.`,
        sprich: `Heute ist ${heute}. … ${fragtGestern ? 'Welcher Tag war gestern?' : 'Welcher Tag ist morgen?'} … Hör dir die Karten an und wähle den richtigen Tag.`,
        optionen: tage.map((t, k) => ({ sprich: t, farbe: HOERFARBEN[k] })), richtig: tage.indexOf(loesung), bild: '🗓️', braucht: [],
        hinweis: 'Gestern ist der Tag vor heute. Morgen ist der Tag nach heute.',
        erklaerung: fragtGestern ? `Heute ist ${heute}. Gestern war ${gestern}.` : `Heute ist ${heute}. Morgen ist ${morgen}.`,
        sig: sig(fragtGestern ? 'gestern' : 'morgen', heute, dritte), daten: { heute, frage: fragtGestern ? 'gestern' : 'morgen', loesung, andere: [gegen, dritte] },
      });
    },
    // drei Wochentage ordnen (Hörkarten); Farben zufällig, damit sie die Reihenfolge nicht verraten
    3: (r) => {
      let idx;
      if (r.bool()) { const s = r.int(0, 4); idx = [s, s + 1, s + 2]; } else idx = r.sample([0, 1, 2, 3, 4, 5, 6], 3).sort((a, b) => a - b);
      const farben = r.shuffle(HOERFARBEN);
      const tage = idx.map((j) => WOCHENTAGE[j]);
      return A.reihenfolge({
        art: 'hoeren', teile: tage.map((t, k) => ({ sprich: t, farbe: farben[k] })),
        frage: 'Bring die Wochentage in die richtige Reihenfolge. Tippe eine Karte an und hör gut zu. Tippe sie nochmals an, dann kommt sie in die Reihe.',
        braucht: [],
        hinweis: 'Die Woche beginnt am Montag. Sag die Wochentage leise der Reihe nach auf.',
        erklaerung: `Die Reihenfolge ist ${aufzaehlung(tage)}.`,
        sig: sig(...tage), daten: { tage },
      });
    },
  },

  'D-WS-08': {
    // eins bis fünf lesen, Menge wählen
    1: (r, ctx) => zahlwortMenge(r, werkzeug(ctx), 5),
    // bis zehn (Zehnerfeld)
    2: (r, ctx) => zahlwortMenge(r, werkzeug(ctx), 10),
    // bis zwölf: Zahlwort und Ziffer verbinden
    3: (r, ctx) => {
      const T = werkzeug(ctx);
      const lesbar = [];
      for (let n = 1; n <= 12; n++) if (einheitenOk(T, ZAHLWOERTER[n])) lesbar.push(n);
      if (lesbar.length < 3) return null;
      const zahlen = r.sample(lesbar, Math.min(4, lesbar.length));
      return A.zuordnen({
        frage: 'Lies die Zahlwörter. Verbinde jedes Wort mit der passenden Zahl.',
        paare: zahlen.map((n) => [{ text: ZAHLWOERTER[n] }, { zahl: n }]),
        braucht: brauchtSicht(T, ...zahlen.map((n) => ZAHLWOERTER[n])),
        hinweis: 'Lies ein Wort langsam. Dann such die Zahl dazu.',
        erklaerung: zahlen.map((n) => `Das Wort ${ZAHLWOERTER[n]} gehört zur Zahl ${n}.`).join(' '),
        sig: sig(...zahlen.slice().sort((a, b) => a - b)), daten: { zahlen },
      });
    },
  },

  'D-WS-09': {
    // der, die oder das? (Hörkarten zum Bild)
    1: (r, ctx) => {
      const T = werkzeug(ctx);
      const w = r.pick(begleiterWoerter(T));
      const arts = ['der', 'die', 'das'];
      return A.wahlHoeren({
        frage: 'Wie sagt man richtig: der, die oder das? Hör dir die Karten an und wähle.',
        sprich: 'Wie sagt man richtig? … Hör dir die Karten an und wähle.',
        optionen: arts.map((a, k) => ({ sprich: `${a} ${sp(w)}`, farbe: HOERFARBEN[k] })), richtig: arts.indexOf(w.artikel), bild: w.bild, braucht: [],
        hinweis: `Sprich leise mit: der, die oder das ${sp(w)}? Was klingt richtig?`,
        erklaerung: `Es heisst ${T.mitArtikel(w)}.`,
        sig: sig(w.wort), daten: { wort: w.wort, artikel: w.artikel },
      });
    },
    // Nomen mit Begleiter lesen, Bild wählen
    2: (r, ctx) => {
      const T = werkzeug(ctx);
      const kand = begleiterWoerter(T).filter((w) => einheitenOk(T, `${w.artikel} ${w.wort}`) && T.lesbaresWort(w));
      if (!kand.length) return null;
      const w = r.pick(kand);
      const falsche = T.waehle(r, begleiterWoerter(T).filter((x) => passtZu(T, x, [w])), 2);
      if (!falsche) return null;
      const zeige = `${w.artikel} ${w.wort}`;
      const { optionen, richtig } = auswahl(r, { bild: w.bild }, falsche.map((x) => ({ bild: x.bild })), 3);
      return A.bildWort({
        frage: 'Lies. Tippe auf das passende Bild.', zeige, sprichNachher: `${w.artikel} ${sp(w)}`,
        optionen, richtig, braucht: brauchtSicht(T, zeige),
        hinweis: 'Lies Wort für Wort, ganz langsam.',
        erklaerung: `Da steht ${zeige}.`,
        sig: sig(w.wort, ...falsche.map((x) => x.wort).sort()), daten: { wort: w.wort, falsche: falsche.map((x) => x.wort) },
      });
    },
    // Nomen schreibt man gross: Rose oder rose?
    3: (r, ctx) => {
      const T = werkzeug(ctx);
      const kand = begleiterWoerter(T).filter((w) => T.lesbaresWort(w) && einheitenOk(T, w.wort) && !GLEICHE_FORM.includes(w.wort[0].toLowerCase()));
      if (!kand.length) return null;
      const w = r.pick(kand);
      const klein = w.wort.toLowerCase();
      const optionen = r.shuffle([w.wort, klein]);
      return A.wahlWort({
        frage: 'Wie schreibt man das Wort richtig? Tippe darauf.', vorlesen: sp(w),
        optionen, richtig: optionen.indexOf(w.wort), bild: w.bild, braucht: brauchtSicht(T, w.wort),
        hinweis: 'Schau dir den ersten Buchstaben genau an. Ist das Wort ein Ding, ein Tier oder ein Mensch?',
        erklaerung: `${w.wort} ist ein Nomen. Nomen schreibt man gross.`,
        sig: sig(w.wort), daten: { wort: w.wort },
      });
    },
  },
};

// Zahlwort lesen, Menge wählen: bis 5 als Dinge, bis 10 im Zehnerfeld
const MENGE_DINGE = ['Apfel', 'Stern', 'Ballon', 'Fisch', 'Blume'];
function zahlwortMenge(r, T, bis) {
  const lesbar = [];
  for (let n = 1; n <= bis; n++) if (einheitenOk(T, ZAHLWOERTER[n])) lesbar.push(n);
  if (!lesbar.length) return null;
  const n = r.pick(lesbar);
  const andere = r.sample([...Array(bis).keys()].map((i) => i + 1).filter((x) => x !== n), 2);
  const ding = T.wort(r.pick(MENGE_DINGE.filter((d) => T.wort(d))));
  const bild = (k) => (bis <= 5 ? { visual: { art: 'dinge', bild: ding.bild, n: k } } : { visual: { art: 'zehnerfeld', rot: k, blau: 0, weg: 0 } });
  const { optionen, richtig } = auswahl(r, bild(n), andere.map(bild), 3);
  const wort = ZAHLWOERTER[n];
  const menge = bis <= 5
    ? (n === 1 ? `Das ist ${EIN[ding.artikel]} ${ding.wort}.` : `Das sind ${wort} ${ding.mehrzahl}.`)
    : (n === 1 ? 'Das ist ein Plättchen.' : `Das sind ${wort} Plättchen.`);
  return A.bildWort({
    frage: bis <= 5 ? 'Lies das Zahlwort. Tippe auf das Bild mit so vielen Dingen.' : 'Lies das Zahlwort. Tippe auf das Feld mit so vielen Plättchen.',
    zeige: wort, sprichNachher: wort, optionen, richtig, braucht: brauchtSicht(T, wort),
    hinweis: 'Lies das Wort langsam. Dann zähle auf jedem Bild nach.',
    erklaerung: `Da steht ${wort}. ${menge}`,
    sig: sig(n, ...andere.slice().sort((a, b) => a - b)), daten: { zahl: n, andere },
  });
}
