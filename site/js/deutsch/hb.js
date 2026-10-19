// Deutsch HB: Hören und Laute (phonologische Bewusstheit). Höraufgaben mit Bildern, Wörter ohne Artikel gesprochen.
import { A, sig, auswahl, werkzeug, reimteil, bildOption, grundlaut, lautZahl, lautStelle } from './lib.js';
// Wörter in der Reihenfolge der Karten auf dem Bildschirm (damit der Hinweis die Lösung nicht durch seine Reihenfolge verrät)
const kartenfolge = (optionen, woerter) => optionen.map((o) => woerter.find((w) => w.bild === o?.bild)).filter(Boolean);

// Sprechfassung eines Worts (z. B. «Velo» als «Welo»)
const sp = (w) => w.sprich || w.wort;
const ZAHL = ['null', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht'];
const silbenText = (n) => (n === 1 ? 'eine Silbe' : `${ZAHL[n]} Silben`);

// Reimgruppen mit mindestens «min» Wörtern, deren Bilder sicher sind oder gesprochen werden
function reimgruppen(T, min = 2) {
  const g = new Map();
  for (const w of T.woerter) if (w.reim && w.bild) { if (!g.has(w.reim)) g.set(w.reim, []); g.get(w.reim).push(w); }
  return [...g.values()].filter((l) => l.length >= min);
}
// Ablenker: kein gleicher Reimteil wie das gesprochene Wort und wie die Lösung (Regel 2), Bild verträglich
const keinReim = (w, ...gegen) => gegen.every((x) => reimteil(w.wort) !== reimteil(x.wort) && (!w.reim || w.reim !== x.reim));

export const generatoren = {
  'D-HB-01': {
    // Reimwort aus zwei Bildern wählen
    1: (r, ctx) => reimWahl(r, werkzeug(ctx), { ablenker: 1, gleicherAnfang: false }),
    // aus drei Bildern; ein Ablenker beginnt gleich wie das gesprochene Wort
    2: (r, ctx) => reimWahl(r, werkzeug(ctx), { ablenker: 2, gleicherAnfang: true }),
    // vier Bilder: das eine finden, das sich nicht reimt (nur Gruppen mit mindestens drei Wörtern)
    3: (r, ctx) => {
      const T = werkzeug(ctx);
      const gruppe = r.pick(reimgruppen(T, 3));
      const reimend = T.waehle(r, gruppe, 3);
      if (!reimend) return null;
      const fremd = T.waehle(r, T.woerter.filter((w) => w.bild && keinReim(w, ...reimend) && reimend.every((x) => !T.verwechselbar(w, x))), 1);
      if (!fremd) return null;
      const alle = [...reimend, fremd[0]];
      const { optionen, richtig } = auswahl(r, bildOption(fremd[0]), alle.filter((w) => w !== fremd[0]).map(bildOption), 4);
      return A.wahlBild({
        frage: 'Drei Bilder reimen sich. Tippe auf das Bild, das sich nicht reimt.',
        optionen, richtig, namenSprechen: true, braucht: [],
        hinweis: `Sprich die Wörter langsam und hör auf das Ende: ${kartenfolge(optionen, alle).map((w) => w.wort).join(' … ')}.`,
        erklaerung: `${reimend.map((w) => w.wort).join(', ')} reimen sich. ${fremd[0].wort} reimt sich nicht.`,
        bilder: alle.map((w) => w.bild),
        sig: sig(fremd[0].wort, ...reimend.map((w) => w.wort).sort()), daten: { reim: reimend[0].reim, fremd: fremd[0].wort },
      });
    },
  },

  // Silben klatschen und zählen: Trommel antippen, für jede Silbe einmal
  'D-HB-02': {
    1: (r, ctx) => silbenZaehlen(r, ctx, [1, 2]),
    2: (r, ctx) => silbenZaehlen(r, ctx, [1, 2, 3]),
    3: (r, ctx) => silbenZaehlen(r, ctx, [1, 2, 3, 3, 4, 4]),
  },

  // Anfangslaut hören
  'D-HB-03': {
    1: (r, ctx) => lautWahl(r, werkzeug(ctx), { feld: 'anlaut', laute: ['a', 'e', 'i', 'o', 'u', 'm', 'n', 'l', 's', 'f', 'sch'], ablenker: 1 }),
    2: (r, ctx) => lautWahl(r, werkzeug(ctx), { feld: 'anlaut', laute: null, ablenker: 2 }),
    3: (r, ctx) => anlautPaare(r, werkzeug(ctx)),
  },

  // Endlaut hören
  'D-HB-04': {
    1: (r, ctx) => lautWahl(r, werkzeug(ctx), { feld: 'endlaut', laute: ['a', 'o', 'i', 'u'], ablenker: 2 }),
    2: (r, ctx) => lautWahl(r, werkzeug(ctx), { feld: 'endlaut', laute: ['m', 'n', 'l', 's', 'f', 'sch', 'z'], ablenker: 2 }),
    3: (r, ctx) => lautWahl(r, werkzeug(ctx), { feld: 'endlaut', laute: ENDLAUTE_KLAR, ablenker: 3 }),
  },

  // Laut im Wort finden: Buchstabe gezeigt, Wort gesprochen, Stelle im Zug wählen
  'D-HB-05': {
    1: (r, ctx) => lautPlatz(r, werkzeug(ctx), ['vorne', 'hinten']),
    2: (r, ctx) => lautPlatz(r, werkzeug(ctx), ['vorne', 'mitte', 'hinten']),
    3: (r, ctx) => lautPlatz(r, werkzeug(ctx), ['vorne', 'mitte', 'hinten', 'nicht']),
  },

  // Laute zählen: für jeden gehörten Laut ein Plättchen
  'D-HB-06': {
    1: (r, ctx) => lauteZaehlen(r, werkzeug(ctx), [2, 3]),
    2: (r, ctx) => lauteZaehlen(r, werkzeug(ctx), [4]),
    3: (r, ctx) => lauteZaehlen(r, werkzeug(ctx), [5, 6]),
  },

  // Silben und Laute zusammenziehen: die Stimme spricht in Teilen, das Kind wählt das Bild
  'D-HB-07': {
    1: (r, ctx) => zusammenziehen(r, werkzeug(ctx), 'silben'),
    2: (r, ctx) => zusammenziehen(r, werkzeug(ctx), 'anlaut'),
    3: (r, ctx) => zusammenziehen(r, werkzeug(ctx), 'laute'),
  },

  // Wörter im Satz zählen: für jedes Wort eine Karte
  'D-HB-08': {
    1: (r, ctx) => woerterZaehlen(r, ctx, 1),
    2: (r, ctx) => woerterZaehlen(r, ctx, 2),
    3: (r, ctx) => woerterZaehlen(r, ctx, 3),
  },
};

function reimWahl(r, T, { ablenker, gleicherAnfang }) {
  const gruppe = r.pick(reimgruppen(T, 2));
  const paar = T.waehle(r, gruppe, 2);
  if (!paar) return null;
  const [gesprochen, loesung] = paar;
  const kandidaten = T.woerter.filter((w) => w.bild && keinReim(w, gesprochen, loesung) && !T.verwechselbar(w, loesung) && !T.verwechselbar(w, gesprochen) && w.wort !== gesprochen.wort);
  let falsche = [];
  if (gleicherAnfang) {
    const gleich = kandidaten.filter((w) => w.anlaut === gesprochen.anlaut);
    if (!gleich.length) return null;
    falsche.push(r.pick(gleich));
  }
  const rest = T.waehle(r, kandidaten.filter((w) => !falsche.includes(w) && falsche.every((f) => !T.verwechselbar(f, w))), ablenker - falsche.length);
  if (!rest) return null;
  falsche = [...falsche, ...rest];
  const { optionen, richtig } = auswahl(r, bildOption(loesung), falsche.map(bildOption), ablenker + 1);
  return A.wahlBild({
    frage: `Was reimt sich auf ${gesprochen.wort}? Tippe auf das Bild.`,
    sprich: `Was reimt sich auf … ${gesprochen.wort}? Tippe auf das Bild.`,
    optionen, richtig, namenSprechen: true, braucht: [],
    hinweis: `Hör auf das Ende: ${gesprochen.wort} … ${kartenfolge(optionen, [loesung, ...falsche]).map((w) => w.wort).join(' … ')}. Welches Wort klingt am Ende gleich?`,
    erklaerung: `${gesprochen.wort} und ${loesung.wort} reimen sich. Beide enden gleich.`,
    bilder: [loesung, ...falsche].map((w) => w.bild),
    sig: sig(gesprochen.wort, loesung.wort, ...falsche.map((w) => w.wort).sort()), daten: { gesprochen: gesprochen.wort, loesung: loesung.wort, reim: gesprochen.reim },
  });
}

// --- Silben zählen ---
function silbenZaehlen(r, ctx, zahlen) {
  const T = werkzeug(ctx);
  const n = r.pick(zahlen);   // zuerst die Silbenzahl, damit alle Längen vorkommen
  const k = T.woerter.filter((w) => w.bild && !w.silbenUnsicher && w.silben.length === n);
  if (!k.length) return null;
  const w = r.pick(k);
  const silbenEinzeln = ctx.silben && w.silbenSprechbar && n > 1;
  return A.silben({
    modus: 'zaehlen', wort: sp(w), bild: w.bild, silben: w.silben,
    frage: `Wie viele Silben hat ${sp(w)}? Tippe für jede Silbe einmal auf die Trommel.`,
    sprich: `Wie viele Silben hat … ${sp(w)}? Klatsch mit und tippe für jede Silbe einmal auf die Trommel. Dann tippe auf den Haken.`,
    hinweis: 'Sprich das Wort langsam und klatsche dazu. Bei jedem Klatschen tippst du einmal auf die Trommel.',
    erklaerung: `${sp(w)} hat ${silbenText(n)}${silbenEinzeln ? ': ' + w.silben.join(' … ') : ''}.`,
    braucht: [], bilder: [w.bild],
    sig: sig(w.wort), daten: { wort: w.wort, silben: n },
  });
}

// --- Anfangs- und Endlaut: Bild mit gleichem Laut wählen ---
const ENDLAUTE_KLAR = ['a', 'o', 'i', 'u', 'e', 'ei', 'au', 'm', 'n', 'l', 's', 'f', 'sch', 'z', 't', 'k', 'p'];
// Wörter, deren Laut am Anfang bzw. Ende sicher ist: Anfang gleich geschrieben wie gehört (nicht Vogel, Stern),
// Ende ohne Auslautverhärtung (Zug, Hund: in Mundart anders gesprochen)
const lautSicherAmRand = (w, feld) => (feld === 'anlaut' ? grundlaut(w.laute[0]) === w.anlaut : !(w.merk || []).includes('auslaut'));
function lautGruppen(T, feld, laute) {
  const g = new Map();
  for (const w of T.woerter) {
    const l = w[feld];
    if (!l || !w.bild || (laute && !laute.includes(l)) || !lautSicherAmRand(w, feld)) continue;
    if (!g.has(l)) g.set(l, []);
    g.get(l).push(w);
  }
  return [...g].filter(([, liste]) => liste.length >= 2);
}
// Ablenker: anderer Laut, kein gleich klingender Laut (Regel 1), untereinander verschieden
function lautAblenker(r, T, feld, laut, n, schon, erlaubt) {
  const aus = [];
  const genommen = [laut];
  for (const w of r.shuffle(T.woerter)) {
    if (aus.length >= n) break;
    const l = w[feld];
    if (!l || !w.bild || (erlaubt && !erlaubt.includes(l))) continue;
    if (feld === 'endlaut' && (w.merk || []).includes('auslaut')) continue;
    if (genommen.some((x) => T.klangKonflikt(x, l))) continue;
    if ([...schon, ...aus].some((x) => x.wort === w.wort || x.bild === w.bild || T.verwechselbar(x, w))) continue;
    aus.push(w); genommen.push(l);
  }
  return aus.length === n ? aus : null;
}
function lautWahl(r, T, { feld, laute, ablenker }) {
  const gruppen = lautGruppen(T, feld, laute);
  if (!gruppen.length) return null;
  const [laut, liste] = r.pick(gruppen);
  // beim Endlaut lieber zwei Wörter, die sich nicht reimen (sonst wird es eine Reimaufgabe)
  let paar = null;
  for (let v = 0; v < 6 && !paar; v++) { const p = T.waehle(r, liste, 2); if (p && (feld !== 'endlaut' || v > 3 || reimteil(p[0].wort) !== reimteil(p[1].wort))) paar = p; }
  if (!paar) return null;
  const [bezug, loesung] = paar;
  const erlaubt = feld === 'endlaut' ? ENDLAUTE_KLAR : null;
  const falsche = lautAblenker(r, T, feld, laut, ablenker, [bezug, loesung], erlaubt);
  if (!falsche) return null;
  const { optionen, richtig } = auswahl(r, bildOption(loesung), falsche.map(bildOption), ablenker + 1);
  const anfang = feld === 'anlaut';
  return A.wahlBild({
    frage: anfang ? `Welches Bild fängt gleich an wie ${sp(bezug)}?` : `Welches Bild hört gleich auf wie ${sp(bezug)}?`,
    sprich: anfang ? `Hör gut zu: … ${sp(bezug)}. Welches Bild fängt gleich an?` : `Hör gut zu: … ${sp(bezug)}. Welches Bild hört gleich auf?`,
    optionen, richtig, namenSprechen: true, braucht: [],
    hinweis: anfang
      ? `Sprich die Wörter langsam und hör auf den ersten Laut: ${sp(bezug)} … ${kartenfolge(optionen, [loesung, ...falsche]).map(sp).join(' … ')}.`
      : `Sprich die Wörter langsam und hör auf den letzten Laut: ${sp(bezug)} … ${kartenfolge(optionen, [loesung, ...falsche]).map(sp).join(' … ')}.`,
    erklaerung: anfang ? `${sp(bezug)} und ${sp(loesung)} fangen gleich an.` : `${sp(bezug)} und ${sp(loesung)} hören gleich auf.`,
    bilder: [loesung, ...falsche].map((w) => w.bild),
    sig: sig(bezug.wort, loesung.wort, ...falsche.map((w) => w.wort).sort()), daten: { feld, laut, bezug: bezug.wort, loesung: loesung.wort, falsche: falsche.map((w) => w.wort) },
  });
}
// Zwei bis drei Paare mit gleichem Anfangslaut verbinden
function anlautPaare(r, T) {
  const k = r.int(2, 3);
  const gruppen = r.shuffle(lautGruppen(T, 'anlaut', null));
  const paare = [], laute = [], alle = [];
  for (const [laut, liste] of gruppen) {
    if (paare.length >= k) break;
    if (laute.some((x) => T.klangKonflikt(x, laut))) continue;
    const p = T.waehle(r, liste.filter((w) => alle.every((x) => !T.verwechselbar(x, w))), 2);
    if (!p) continue;
    paare.push(p); laute.push(laut); alle.push(...p);
  }
  if (paare.length < k) return null;
  return A.zuordnen({
    frage: 'Welche zwei Bilder fangen gleich an? Verbinde sie.',
    sprich: 'Welche zwei Bilder fangen gleich an? Tippe ein Bild an, dann das Bild, das gleich anfängt.',
    paare: paare.map(([a, b]) => [bildOption(a), bildOption(b)]), braucht: [],
    hinweis: 'Tippe ein Bild an und hör auf den ersten Laut. Such das Bild, das genau so anfängt.',
    erklaerung: paare.map(([a, b]) => `${sp(a)} und ${sp(b)}`).join(', ') + ' fangen gleich an.',
    bilder: alle.map((w) => w.bild),
    sig: sig(...paare.map(([a, b]) => [a.wort, b.wort].sort().join('+')).sort()), daten: { paare: paare.map(([a, b]) => [a.wort, b.wort]), laute },
  });
}

// --- Laut im Wort (Regel 3) ---
// Buchstaben, deren Laut sich im Wort sicher hören lässt (nicht e/ä: Schwa und Mundart; nicht c, q, v, x, y)
const PLATZ_LAUTE = ['a', 'i', 'o', 'u', 'm', 'n', 'l', 's', 'r', 'f', 'w', 't', 'h', 'd', 'b', 'k', 'p', 'g', 'z', 'j', 'ö', 'ü'];
// Wie oft der Laut sicher vorkommt; null, wenn er versteckt, gleich klingend oder in einer anderen Einheit steckt
export function lautSicher(T, w, laut) {
  const z = lautZahl(w, laut);
  if (z === null) return null;
  for (const e of w.laute.map((x) => x.toLowerCase())) {
    const g = grundlaut(e);
    if (g === laut) continue;
    if (e.includes(laut)) return null;              // steckt in au, ei, sch, ck …
    if (T.klangKonflikt(laut, g)) return null;      // klingt gleich (f/v, d/t, i/ü …)
    if (T.nieZusammen(laut, g)) return null;
  }
  return z;
}
function lautPlatz(r, T, stellen) {
  const laute = PLATZ_LAUTE.filter((l) => T.frei.has(l));
  if (!laute.length) return null;
  for (let v = 0; v < 30; v++) {
    const laut = r.pick(laute);
    const stelle = r.pick(stellen);
    const b = T.buchstabe(laut);
    const passt = (w) => {
      if (!w.bild || w.wort === b.wort) return false;
      const z = lautSicher(T, w, laut);
      // «gar nicht» nur, wenn auch kein ähnlich klingender Laut vorkommt (m/n, ü/u …)
      if (stelle === 'nicht') return z === 0 && !w.laute.some((e) => (b.aehnlichLaut || []).includes(grundlaut(e)));
      if (z !== 1) return false;
      const st = lautStelle(w, laut);
      if (st !== stelle) return false;
      if (['b', 'd', 'g'].includes(laut) && st === 'hinten') return false;   // Auslaut klingt wie p, t, k
      return true;
    };
    const k = T.woerter.filter(passt);
    if (!k.length) continue;
    const w = r.pick(k);
    const frage = stellen.length === 2 ? 'vorne oder hinten' : 'vorne, in der Mitte oder hinten';
    const bezug = b.wort === w.wort ? '' : b.stelle === 'anfang' ? ` Es ist der Laut wie am Anfang von ${b.wort}.` : ` Es ist der Laut wie in ${b.wort}.`;
    const text = { vorne: 'ganz vorne', mitte: 'in der Mitte', hinten: 'ganz hinten' }[stelle];
    return A.lautplatz({
      wort: sp(w), bild: w.bild, laut: b.anzeige, plaetze: stellen.length === 2 ? 2 : 3, nicht: stellen.includes('nicht'), loesung: stelle,
      frage: stellen.includes('nicht')
        ? `Schau den Buchstaben an. Hörst du ihn in ${sp(w)}? Wenn ja: vorne, in der Mitte oder hinten?`
        : `Schau den Buchstaben an. Hörst du ihn ${frage} in ${sp(w)}?`,
      sprich: stellen.includes('nicht')
        ? `Schau den Buchstaben an. Hör gut zu: … ${sp(w)}. Hörst du diesen Laut? Wenn ja: vorne, in der Mitte oder hinten? Sonst tippe auf «gar nicht».`
        : `Schau den Buchstaben an. Hör gut zu: … ${sp(w)}. Hörst du diesen Laut ${frage}?`,
      hinweis: `Sprich das Wort ganz langsam: ${sp(w)}.${bezug} ${stellen.includes('nicht') ? 'Hörst du ihn? Wenn ja, wo?' : 'Wo hörst du ihn?'}`,
      erklaerung: stelle === 'nicht' ? `In ${sp(w)} kommt dieser Laut nicht vor.` : `In ${sp(w)} hörst du diesen Laut ${text}.`,
      braucht: [laut], bilder: [w.bild],
      sig: sig(laut, w.wort), daten: { wort: w.wort, laut, stelle },
    });
  }
  return null;
}

// --- Laute zählen ---
function lauteZaehlen(r, T, zahlen) {
  const n = r.pick(zahlen.filter((z) => T.woerter.some((w) => w.lautzaehlbar && w.bild && w.laute.length === z)));
  if (!n) return null;
  const w = r.pick(T.woerter.filter((x) => x.lautzaehlbar && x.bild && x.laute.length === n));
  const dehn = T.ctx.dehnlaute && w.laute.every((e) => T.dehnlaut(grundlaut(e)));
  return A.mengeLegen({
    feld: 'lautreihe', ziel: n, vorlesen: sp(w), bild: w.bild,
    frage: `Hör gut zu: ${sp(w)}. Lege für jeden Laut ein Plättchen.`,
    sprich: `Hör gut zu: … ${sp(w)}. Lege für jeden Laut, den du hörst, ein Plättchen.`,
    hinweis: 'Sprich das Wort ganz langsam und dehne es. Bei jedem neuen Laut legst du ein Plättchen.',
    erklaerung: `${sp(w)} hat ${ZAHL[n]} Laute${dehn ? ': ' + w.laute.map((e) => T.dehnlaut(grundlaut(e))).join(' … ') : ''}.`,
    braucht: [], bilder: [w.bild],
    sig: sig(w.wort), daten: { wort: w.wort, laute: n },
  });
}

// --- Zusammenziehen ---
// Wörter, deren einzeln gesprochene Silben nach einem unschönen Wort klingen können
const SILBEN_HEIKEL = ['Kaktus'];
function zusammenziehen(r, T, art) {
  const ok = (w) => w.bild && T.bildOk(w, { gesprochen: false }) && !w.silbenUnsicher;
  let k;
  if (art === 'silben') k = T.woerter.filter((w) => ok(w) && w.silbenSprechbar && w.silben.length >= 2 && w.silben.length <= 4 && !SILBEN_HEIKEL.includes(w.wort));
  else if (art === 'anlaut') k = T.woerter.filter((w) => ok(w) && !w.sprich && w.silben.length === 1 && restVon(T, w));
  else k = T.woerter.filter((w) => ok(w) && !w.sprich && w.laute.length >= 2 && w.laute.every((e) => T.dehnlaut(grundlaut(e))) && grundlaut(w.laute.at(-1)) !== 'e');
  if (!k.length) return null;
  const w = r.pick(k);
  let teile;
  if (art === 'silben') teile = w.silben.join(' … ');
  else if (art === 'anlaut') teile = `${T.dehnlaut(w.laute[0].toLowerCase())} … ${restVon(T, w)}`;
  else teile = w.laute.map((e) => T.dehnlaut(grundlaut(e))).join(' … ');
  const falsche = T.waehle(r, T.woerter.filter((x) => ok(x) && x.wort !== w.wort && x.silben.length === w.silben.length && x.anlaut !== w.anlaut && !T.verwechselbar(x, w)), 2);
  if (!falsche) return null;
  const { optionen, richtig } = auswahl(r, { bild: w.bild }, falsche.map((x) => ({ bild: x.bild })), 3);
  return A.wahlBild({
    frage: `Hör gut zu: ${teile}. Welches Bild ist das?`,
    sprich: `Hör gut zu: … ${teile}. Welches Bild ist das?`,
    optionen, richtig, namenSprechen: false, braucht: [],
    hinweis: art === 'silben' ? `Sprich die Teile schnell hintereinander: ${teile}.` : `Sprich die Laute schnell hintereinander, wie ein Wort: ${teile}.`,
    erklaerung: `${teile} … das ist ${sp(w)}.`,
    bilder: [w, ...falsche].map((x) => x.bild),
    sig: sig(art, w.wort, ...falsche.map((x) => x.wort).sort()), daten: { art, wort: w.wort, teile },
  });
}
// Rest nach dem gedehnten Anfangslaut: muss mit einem Selbstlaut beginnen und sich als Silbe sprechen lassen (Maus -> aus)
function restVon(T, w) {
  const erste = w.laute[0].toLowerCase();
  if (!T.dehnlaut(erste) || 'aeiouäöü'.includes(erste[0])) return null;
  if (!w.wort.toLowerCase().startsWith(erste)) return null;
  const rest = w.wort.slice(erste.length).toLowerCase();
  if (!/^[aeiouäöü]/.test(rest) || /^[aeiouäöü]+h?$/.test(rest) || /ai/.test(rest)) return null;
  return rest;
}

// --- Wörter im Satz zählen (feste Inhalte, gehörte Sätze) ---
function woerterZaehlen(r, ctx, stufe) {
  const k = (ctx.inhalte?.saetze || []).filter((s) => s.stufen?.['D-HB-08'] === stufe);
  if (!k.length) return null;
  const s = r.pick(k);
  const woerter = s.woerter.filter((x) => !/^[.!?]$/.test(x));
  return A.mengeLegen({
    feld: 'wortreihe', ziel: woerter.length, vorlesen: s.satz, bild: typeof s.bild === 'string' ? s.bild : undefined,
    frage: `Hör gut zu: ${s.satz} Lege für jedes Wort eine Karte.`,
    sprich: `Hör gut zu: … ${s.satz} … Lege für jedes Wort, das du hörst, eine Karte.`,
    hinweis: 'Sprich den Satz langsam nach. Bei jedem Wort klopfst du einmal und legst eine Karte.',
    erklaerung: `Der Satz hat ${ZAHL[woerter.length]} Wörter: ${woerter.join(' … ')}.`,
    braucht: [],
    sig: sig(s.id), daten: { id: s.id, woerter: woerter.length },
  });
}
