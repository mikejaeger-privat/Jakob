// Deutsch BU: Buchstaben (Laut und Buchstabe, Gross und klein, Nachspuren, Buchstabe im Wort, ABC, Verbindungen).
// Gezeigte Buchstaben stehen in «braucht». Buchstaben werden nie allein gesprochen (die Stimme sagt «Be» statt /b/).
import { A, sig, auswahl, werkzeug, grundlaut, lautZahl, zerlege } from './lib.js';

const sp = (w) => w.sprich || w.wort;
const gross = (id) => id.toUpperCase();
const ZAHL = ['null', 'einmal', 'zweimal', 'dreimal', 'viermal'];
const UMLAUTE = ['ä', 'ö', 'ü'];
const SELTEN = ['c', 'q', 'x', 'y', 'v'];   // Klang und Buchstabe passen nicht eindeutig zusammen
const VOKALE = 'aeiouäöü';

// Einzelbuchstaben, die eingeführt sind (ohne Verbindungen)
const einzel = (T) => T.B.liste.filter((b) => b.art !== 'verbindung' && T.frei.has(b.id));
// Wörter, deren erste Lauteinheit genau der Buchstabe ist und so geschrieben wird (Maus für m, Ohr für o; nicht Vogel, Stern)
const anlautWoerter = (T, id) => T.woerter.filter((w) => w.bild && w.wort[0].toLowerCase() === id && grundlaut(w.laute[0]) === id && (w.laute[0].length === 1 || /^[aeiouäöü](h|\1)$/i.test(w.laute[0])));
// Formen, die sich zusätzlich zu «aehnlichForm» leicht verwechseln lassen: klein (Basisschrift) und gross
const KLEIN_AEHNLICH = [['h', 'b'], ['a', 'd'], ['a', 'q'], ['a', 'g'], ['l', 't'], ['n', 'r']];
const GROSS_AEHNLICH = [['e', 'f'], ['m', 'n', 'w'], ['b', 'p', 'r', 'd'], ['o', 'c', 'g', 'q'], ['u', 'v'], ['i', 'l', 'j', 't'], ['k', 'x'], ['v', 'w', 'y']];
const inGruppe = (gruppen, a, b) => gruppen.some((g) => g.includes(a) && g.includes(b));
const formAehnlich = (T, a, b) => (T.buchstabe(a).aehnlichForm || []).includes(b) || (T.buchstabe(b).aehnlichForm || []).includes(a) || inGruppe(KLEIN_AEHNLICH, a, b);
const lautAehnlich = (T, a, b) => (T.buchstabe(a)?.aehnlichLaut || []).includes(b) || (T.buchstabe(b)?.aehnlichLaut || []).includes(a);
// Zwei Buchstaben vertragen sich als Auswahl (Regel 1, nieZusammen; ähnliche Form oder ähnlicher Laut nur wenn erlaubt)
function vertraeglich(T, a, b, { aehnlich = false, gross = false } = {}) {
  if (a === b || T.klangKonflikt(a, b) || T.nieZusammen(a, b)) return false;
  if (aehnlich) return true;
  if (gross && inGruppe(GROSS_AEHNLICH, a, b)) return false;
  return !formAehnlich(T, a, b) && !lautAehnlich(T, a, b);
}
// Gedehnter Anfang und Rest für den Hinweis («Mmm … aus»), wenn die Stimme es kann
function anfangDehnen(T, w, id) {
  if (!T.ctx.dehnlaute || !T.dehnlaut(id) || VOKALE.includes(id) || w.laute[0].length !== 1) return null;
  const rest = w.wort.slice(1).toLowerCase();
  return /^[aeiouäöü]/.test(rest) && !/^[aeiouäöü]+h?$/.test(rest) && !/ai/.test(rest) ? `${T.dehnlaut(id)} … ${rest}` : null;
}
const bezugWort = (b, w) => (b.stelle === 'anfang' && b.wort !== w.wort ? b.wort : null);

export const generatoren = {
  // Buchstabe zum Laut: Anfangslaut eines Bildworts hören, Buchstaben wählen
  'D-BU-01': {
    1: (r, ctx) => buchstabeZumLaut(r, werkzeug(ctx), { anzahl: 3, klein: false, aehnlich: false, ziel: ctx.karte }),
    2: (r, ctx) => buchstabeZumLaut(r, werkzeug(ctx), { anzahl: 4, klein: true, aehnlich: false, ziel: ctx.karte }),
    3: (r, ctx) => buchstabeZumLaut(r, werkzeug(ctx), { anzahl: 4, klein: true, aehnlich: true, ziel: ctx.karte }),
  },
  // Laut zum Buchstaben: Buchstabe gezeigt, Bild wählen (das Kind nennt die Bilder selbst)
  'D-BU-02': {
    1: (r, ctx) => lautZumBuchstaben(r, werkzeug(ctx), { anzahl: 3, klein: false, ziel: ctx.karte }),
    2: (r, ctx) => lautZumBuchstaben(r, werkzeug(ctx), { anzahl: 4, klein: true, ziel: ctx.karte }),
    3: (r, ctx) => lautImWortBild(r, werkzeug(ctx)),
  },
  // Gross- und Kleinbuchstaben verbinden
  'D-BU-03': {
    1: (r, ctx) => grossKlein(r, werkzeug(ctx), ['o', 's', 'w', 'u', 'z', 'v', 'x', 'p', 'c'], 3, 1),
    2: (r, ctx) => grossKlein(r, werkzeug(ctx), ['a', 'e', 'g', 'r', 'h', 'b', 'd'], 3, 2),
    3: (r, ctx) => grossKlein(r, werkzeug(ctx), null, 4, 3),
  },
  // Buchstaben nachspuren
  'D-BU-04': {
    1: (r, ctx) => nachspuren(r, werkzeug(ctx), 'gross'),
    2: (r, ctx) => nachspuren(r, werkzeug(ctx), 'klein'),
    3: (r, ctx) => nachspuren(r, werkzeug(ctx), 'aehnlich'),
  },
  // Buchstabe im Wort finden
  'D-BU-05': {
    1: (r, ctx) => imWortFinden(r, werkzeug(ctx), 'einmal'),
    2: (r, ctx) => imWortFinden(r, werkzeug(ctx), 'mehrmals'),
    3: (r, ctx) => imWortFinden(r, werkzeug(ctx), 'grossklein'),
  },
  // Alphabet (Erweiterung)
  'D-BU-06': {
    1: (r, ctx) => abcLuecke(r, werkzeug(ctx)),
    2: (r, ctx) => abcOrdnen(r, werkzeug(ctx), 3),
    3: (r, ctx) => abcOrdnen(r, werkzeug(ctx), 5),
  },
  // Buchstabenverbindungen: Bildwort hören, Verbindung wählen
  'D-BU-07': {
    1: (r, ctx) => verbindungHoeren(r, werkzeug(ctx), ctx.stufe?.auswahl || ['sch', 'ei', 'au'], ctx.karte),
    2: (r, ctx) => verbindungHoeren(r, werkzeug(ctx), ctx.stufe?.auswahl || ['ch', 'eu', 'ie'], ctx.karte),
    3: (r, ctx) => verbindungHoeren(r, werkzeug(ctx), ctx.stufe?.auswahl || ['st', 'sp', 'pf', 'ck', 'tz', 'ng', 'nk', 'qu', 'äu'], ctx.karte),
  },
};

// --- D-BU-01 ---
function buchstabeZumLaut(r, T, { anzahl, klein, aehnlich, ziel = null }) {
  const kandidaten = einzel(T).filter((b) => !SELTEN.includes(b.id) && !UMLAUTE.includes(b.id) && anlautWoerter(T, b.id).length
    && (!aehnlich || aehnlicheFuer(T, b.id).length));
  if (!kandidaten.length) return null;
  const b = ziel ? kandidaten.find((x) => x.id === ziel) : r.pick(kandidaten);   // ziel: Karte aus dem Karteikasten
  if (!b) return null;
  const w = r.pick(anlautWoerter(T, b.id));
  const pool = einzel(T).map((x) => x.id).filter((x) => !SELTEN.includes(x) && !UMLAUTE.includes(x) && vertraeglich(T, b.id, x, { gross: !klein }));
  let falsche = [];
  if (aehnlich) for (const x of r.shuffle(aehnlicheFuer(T, b.id))) {
    if (falsche.length < 2 && falsche.every((f) => vertraeglich(T, f, x, { aehnlich: true }))) falsche.push(x);
  }
  for (const x of r.shuffle(pool)) {
    if (falsche.length >= anzahl - 1) break;
    if (falsche.includes(x)) continue;
    if (falsche.every((f) => vertraeglich(T, f, x, { aehnlich, gross: !klein }))) falsche.push(x);
  }
  if (falsche.length < anzahl - 1) return null;
  const zeigen = (id) => (klein ? id : gross(id));
  const { optionen, richtig } = auswahl(r, zeigen(b.id), falsche.map(zeigen), anzahl);
  const dehn = anfangDehnen(T, w, b.id);
  const bezug = bezugWort(b, w);
  return A.wahlWort({
    frage: `Mit welchem Buchstaben fängt ${sp(w)} an? Tippe auf den Buchstaben.`,
    sprich: `Mit welchem Buchstaben fängt … ${sp(w)} an? Tippe auf den Buchstaben.`,
    vorlesen: sp(w), anlautBild: w.bild, optionen, richtig,
    hinweis: dehn ? `Hör auf den Anfang: ${dehn}.` : `Sprich das Wort langsam und hör auf den ersten Laut: ${sp(w)}.`,
    erklaerung: bezug ? `${sp(w)} fängt gleich an wie ${bezug}. Das ist dieser Buchstabe.` : `${sp(w)} fängt mit diesem Buchstaben an.`,
    braucht: [b.id, ...falsche], bilder: [w.bild],
    sig: sig(w.wort, klein, ...falsche.slice().sort()), daten: { wort: w.wort, buchstabe: b.id, falsche, klein },
  });
}
// Ähnliche Formen und die erlaubten ähnlichen Laute (nur m/n und o/u) als Ablenker auf Stufe 3
const LAUTPAARE = { m: ['n'], n: ['m'], o: ['u'], u: ['o'] };
function aehnlicheFuer(T, id) {
  const b = T.buchstabe(id);
  const kand = [...(b.aehnlichForm || []), ...(LAUTPAARE[id] || [])];
  // seltene Buchstaben (c, v, x, y) auch hier nicht; q steht im Katalog (b d p q)
  return [...new Set(kand)].filter((x) => T.frei.has(x) && T.buchstabe(x) && T.buchstabe(x).art !== 'verbindung' && !UMLAUTE.includes(x)
    && (x === 'q' || !SELTEN.includes(x))
    && x !== id && !T.klangKonflikt(id, x) && !T.nieZusammen(id, x));
}

// --- D-BU-02 ---
function lautZumBuchstaben(r, T, { anzahl, klein, ziel = null }) {
  const ok = (w) => w.bild && T.bildOk(w, { gesprochen: false });
  const kandidaten = einzel(T).filter((b) => !SELTEN.includes(b.id) && !UMLAUTE.includes(b.id) && anlautWoerter(T, b.id).filter(ok).length);
  if (!kandidaten.length) return null;
  const b = ziel ? kandidaten.find((x) => x.id === ziel) : r.pick(kandidaten);
  if (!b) return null;
  const w = r.pick(anlautWoerter(T, b.id).filter(ok));
  // Ablenker: fängt mit einem anderen Buchstaben und einem anderen, nicht ähnlich klingenden Laut an
  const passt = (x) => ok(x) && x.wort[0].toLowerCase() !== b.id && x.anlaut && x.anlaut !== b.id
    && !T.klangKonflikt(b.id, x.anlaut) && !T.nieZusammen(b.id, x.anlaut) && !T.nieZusammen(b.id, x.wort[0].toLowerCase())
    && !lautAehnlich(T, b.id, x.anlaut) && !lautAehnlich(T, b.id, grundlaut(x.laute[0])) && !T.verwechselbar(x, w)
    && !formAehnlich(T, b.id, x.wort[0].toLowerCase()) && (klein || !inGruppe(GROSS_AEHNLICH, b.id, x.wort[0].toLowerCase()));
  const falsche = T.waehle(r, T.woerter.filter(passt), anzahl - 1, (g, k) => g.anlaut !== k.anlaut);
  if (!falsche) return null;
  const { optionen, richtig } = auswahl(r, { bild: w.bild }, falsche.map((x) => ({ bild: x.bild })), anzahl);
  const bezug = bezugWort(b, w);
  return A.wahlBild({
    frage: 'Schau den Buchstaben an. Welches Bild fängt mit diesem Laut an? Tippe auf das Bild.',
    zeige: klein ? b.id : gross(b.id), optionen, richtig, namenSprechen: false,
    hinweis: 'Sag die Namen der Bilder leise und hör auf den Anfang.',
    erklaerung: `${sp(w)} fängt mit diesem Buchstaben an${bezug ? `, genau wie ${bezug}` : ''}.`,
    braucht: [b.id], bilder: [w, ...falsche].map((x) => x.bild),
    sig: sig(b.id, klein, w.wort, ...falsche.map((x) => x.wort).sort()), daten: { buchstabe: b.id, wort: w.wort, falsche: falsche.map((x) => x.wort) },
  });
}
// Stufe 3: Umlaut oder Verbindung kommt irgendwo im Wort vor (ä: Bär, ö: Löwe, ü: Tür)
const GLEICH_KLINGEND = { ei: ['ai'], ai: ['ei'], eu: ['äu'], äu: ['eu'] };
function lautKlar(T, w, laut) {
  // wie oft der Laut als Einheit vorkommt; null, wenn er versteckt ist oder ähnlich Klingendes im Wort steckt
  const z = lautZahl(w, laut);
  if (z === null) return null;
  for (const e of w.laute.map((x) => x.toLowerCase())) {
    const g = grundlaut(e);
    if (g === laut) continue;
    if (e.includes(laut) || T.klangKonflikt(laut, g) || T.nieZusammen(laut, g) || lautAehnlich(T, laut, g) || (GLEICH_KLINGEND[laut] || []).includes(g)) return null;
  }
  return z;
}
// Ablenker für Stufe 3: nichts, was dem Laut nahekommt
const GRUNDVOKAL = { ä: 'a', ö: 'o', ü: 'u' };   // Schweizer ä ist sehr offen, darum kein a neben ä
function ablenkerKlar(T, x, laut) {
  const k = x.wort.toLowerCase();
  if (k.includes(laut)) return false;
  // auch geschrieben keine ähnlich klingende Verbindung (Mango bei nk)
  const b = T.buchstabe(laut);
  if ([...(b.aehnlichLaut || []), ...(b.nieZusammen || [])].some((v) => v.length > 1 && k.includes(v))) return false;
  if (GRUNDVOKAL[laut] && k.includes(GRUNDVOKAL[laut])) return false;
  // Konsonantenverbindung: nicht alle ihre Buchstaben einzeln im Wort (Kanu bei nk, Regenbogen bei ng)
  if (!/[aeiouäöü]/.test(laut) && [...laut].every((c) => k.includes(c))) return false;
  // ch: keine Wörter mit verhärtetem g am Ende (Zug, Berg klingen je nach Sprecher mit ch)
  if (laut === 'ch' && (x.merk || []).includes('auslaut')) return false;
  return true;
}
function lautImWortBild(r, T) {
  const ok = (w) => w.bild && T.bildOk(w, { gesprochen: false });
  // ck und tz sind Schreibweisen, keine eigenen Laute: hier nicht
  const laute = [...UMLAUTE, ...T.B.liste.filter((b) => b.art === 'verbindung').map((b) => b.id)]
    .filter((l) => !['ck', 'tz'].includes(l) && T.frei.has(l) && T.woerter.some((w) => ok(w) && lautKlar(T, w, l) === 1));
  if (!laute.length) return null;
  const laut = r.pick(laute);
  const b = T.buchstabe(laut);
  const w = r.pick(T.woerter.filter((x) => ok(x) && lautKlar(T, x, laut) === 1));
  const falsche = T.waehle(r, T.woerter.filter((x) => ok(x) && lautKlar(T, x, laut) === 0 && !T.verwechselbar(x, w) && ablenkerKlar(T, x, laut)), 2);
  if (!falsche) return null;
  const { optionen, richtig } = auswahl(r, { bild: w.bild }, falsche.map((x) => ({ bild: x.bild })), 3);
  const bezug = b.wort && b.wort !== w.wort ? b.wort : null;
  return A.wahlBild({
    frage: 'Schau die Buchstaben an. In welchem Bild hörst du diesen Laut? Er kann auch in der Mitte oder am Ende sein.',
    zeige: b.anzeige, optionen, richtig, namenSprechen: false,
    hinweis: 'Sag die Namen der Bilder langsam. Hör genau hin, auch in der Mitte und am Ende.',
    erklaerung: `In ${sp(w)} hörst du diesen Laut${bezug ? `, wie in ${bezug}` : ''}.`,
    braucht: [laut], bilder: [w, ...falsche].map((x) => x.bild),
    sig: sig(laut, w.wort, ...falsche.map((x) => x.wort).sort()), daten: { laut, wort: w.wort, falsche: falsche.map((x) => x.wort) },
  });
}

// --- D-BU-03 ---
const VERWECHSELBAR = [['b', 'd', 'p', 'q'], ['n', 'm', 'u']];
const gruppeVon = (id) => VERWECHSELBAR.findIndex((g) => g.includes(id));
// I (gross) und l (klein) sind beide ein senkrechter Strich: nie im selben Zuordnen
const geht = (ids, x) => !ids.includes(x) && !((x === 'i' && ids.includes('l')) || (x === 'l' && ids.includes('i')));
const GK_HINWEIS = {
  1: 'Diese Paare sehen sich ähnlich. Der kleine Buchstabe ist oft einfach kleiner.',
  2: 'Hier sehen gross und klein verschieden aus. Denk an ein Wort, das mit dem Buchstaben anfängt.',
  3: 'Schau genau, wohin der Bauch und der Strich zeigen.',
};
function grossKlein(r, T, menge, anzahl, stufe) {
  const auchVerwechselbar = stufe === 3;
  const frei = einzel(T).map((b) => b.id);
  let ids;
  if (!auchVerwechselbar) {
    // keine zwei aus derselben Verwechslungsgruppe (b und d erst auf Stufe 3)
    const kand = r.shuffle(menge.filter((x) => frei.includes(x)));
    ids = [];
    for (const x of kand) { if (ids.length >= anzahl) break; const g = gruppeVon(x); if (geht(ids, x) && (g < 0 || ids.every((y) => gruppeVon(y) !== g))) ids.push(x); }
  } else {
    // mindestens zwei verwechselbare Buchstaben zusammen, dazu beliebige andere
    const gruppen = VERWECHSELBAR.map((g) => g.filter((x) => frei.includes(x))).filter((g) => g.length >= 2);
    if (!gruppen.length) return null;
    const g = r.pick(gruppen);
    ids = r.sample(g, Math.min(g.length, r.int(2, 3)));
    for (const x of r.shuffle(frei)) { if (ids.length >= anzahl) break; if (geht(ids, x)) ids.push(x); }
  }
  if (ids.length < Math.min(anzahl, 3)) return null;
  return A.zuordnen({
    frage: 'Welche Buchstaben gehören zusammen? Verbinde jeden grossen Buchstaben mit seinem kleinen.',
    sprich: 'Welche Buchstaben gehören zusammen? Tippe einen grossen Buchstaben an, dann den passenden kleinen.',
    paare: ids.map((x) => [{ buchstabe: gross(x) }, { buchstabe: x }]),
    hinweis: GK_HINWEIS[stufe],
    erklaerung: 'Jeder grosse Buchstabe hat seinen kleinen Partner. Sie gehören zum gleichen Laut.',
    braucht: ids.slice(),
    sig: sig(...ids.slice().sort()), daten: { buchstaben: ids },
  });
}

// --- D-BU-04 ---
function nachspuren(r, T, art) {
  let kand;
  const frei = einzel(T).map((b) => b.id);
  if (art === 'gross') kand = frei.filter((x) => !UMLAUTE.includes(x)).map(gross);
  else if (art === 'klein') kand = frei.filter((x) => !UMLAUTE.includes(x));
  else kand = ['b', 'd', 'p', 'q', 'ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü'].filter((x) => frei.includes(x.toLowerCase()));
  if (!kand.length) return null;
  const z = r.pick(kand);
  const pfeile = art !== 'aehnlich';
  return A.nachspuren({
    zeichen: z, hilfe: pfeile ? 'pfeile' : 'start',
    frage: pfeile ? 'Fahre den Buchstaben mit dem Finger nach. Fang beim Startpunkt an und folge den Pfeilen.' : 'Fahre den Buchstaben mit dem Finger nach. Fang beim Startpunkt an.',
    hinweis: 'Setz den Finger auf die Eins und fahre der grauen Linie nach. Hat der Buchstabe mehrere Striche, kommt danach die Zwei.',
    erklaerung: 'So schreibt man diesen Buchstaben.',
    braucht: [z.toLowerCase()],
    sig: sig(z), daten: { zeichen: z },
  });
}

// --- D-BU-05 ---
// Stellen des Buchstabens im Wort, nur wo er als eigene Einheit steht (das s in Sch zählt nicht)
function stellen(w, id) {
  const einheiten = zerlege(w.wort);
  const aus = { einzeln: [], versteckt: 0 };
  let pos = 0;
  for (const e of einheiten) {
    const teil = w.wort.slice(pos, pos + e.length);
    if (e.length === 1 && e === id) aus.einzeln.push({ i: pos, gross: teil !== teil.toLowerCase() });
    else if (e.length > 1 && e.includes(id)) aus.versteckt++;
    pos += e.length;
  }
  // chs zerfällt in ch + s; Länge stimmt trotzdem (ch 2, s 1)
  return pos === w.wort.length ? aus : null;
}
function imWortFinden(r, T, art) {
  const frei = einzel(T).map((b) => b.id);
  const passt = [];
  for (const w of T.woerter) {
    if (!T.lesbaresWort(w) || w.wort.includes(' ') || w.wort.includes('-')) continue;
    if (art === 'einmal' && w.wort.length > 6) continue;
    if (![...w.braucht, ...zerlege(w.wort)].every((e) => T.frei.has(e))) continue;
    for (const id of frei) {
      const s = stellen(w, id);
      if (!s || s.versteckt) continue;
      const n = s.einzeln.length, g = s.einzeln.filter((x) => x.gross).length;
      if (art === 'einmal' && n === 1) passt.push({ w, id, s });
      if (art === 'mehrmals' && n >= 2 && n <= 3 && g === 0) passt.push({ w, id, s });
      if (art === 'grossklein' && g === 1 && n >= 2 && n <= 3) passt.push({ w, id, s });
    }
  }
  if (!passt.length) return null;
  const { w, id, s } = r.pick(passt);
  const ziel = art === 'grossklein' ? `${gross(id)} ${id}` : (s.einzeln[0].gross ? gross(id) : id);
  const n = s.einzeln.length;
  return A.antippen({
    zeige: w.wort, einheit: 'buchstabe', ziel, loesung: s.einzeln.map((x) => String(x.i)),
    frage: art === 'grossklein'
      ? 'Schau die zwei Buchstaben oben an. Tippe im Wort auf jeden Buchstaben, der so aussieht, gross oder klein. Dann tippe auf den Haken.'
      : 'Schau den Buchstaben oben an. Tippe im Wort auf jeden Buchstaben, der genau so aussieht. Dann tippe auf den Haken.',
    hinweis: 'Geh mit dem Finger Buchstabe für Buchstabe durch das Wort und vergleiche.',
    erklaerung: n === 1 ? 'Der Buchstabe kommt im Wort einmal vor.' : `Der Buchstabe kommt im Wort ${ZAHL[n]} vor.`,
    braucht: [...new Set([...w.braucht, ...zerlege(w.wort), id])],
    sig: sig(w.wort, id, art), daten: { wort: w.wort, buchstabe: id, stellen: s.einzeln.map((x) => x.i) },
  });
}

// --- D-BU-06 ---
const ABC = 'abcdefghijklmnopqrstuvwxyz'.split('');
function abcLuecke(r, T) {
  const starts = [];
  for (let i = 0; i + 3 < ABC.length; i++) if (ABC.slice(i, i + 4).every((x) => T.frei.has(x))) starts.push(i);
  if (!starts.length) return null;
  const s = r.pick(starts);
  const reihe = ABC.slice(s, s + 4);
  const l = r.int(1, 3);
  const loesung = reihe[l];
  const falsche = r.shuffle(ABC.filter((x) => T.frei.has(x) && !reihe.includes(x) && Math.abs(ABC.indexOf(x) - ABC.indexOf(loesung)) <= 6)).slice(0, 2);
  if (falsche.length < 2) return null;
  const { optionen, richtig } = auswahl(r, gross(loesung), falsche.map(gross), 3);
  return A.wahlWort({
    frage: 'Hier fehlt ein Buchstabe im ABC. Welcher Buchstabe gehört in die Lücke?',
    zeige: reihe.map((x, i) => (i === l ? '○' : gross(x))).join(' '), optionen, richtig,
    hinweis: 'Sag das ABC leise auf, bis du zu diesen Buchstaben kommst.',
    erklaerung: 'Im ABC kommt dieser Buchstabe genau an dieser Stelle.',
    braucht: [...reihe, ...falsche],
    sig: sig(s, l, ...falsche.slice().sort()), daten: { reihe, luecke: l },
  });
}
function abcOrdnen(r, T, anzahl) {
  const frei = ABC.filter((x) => T.frei.has(x));
  if (frei.length < anzahl) return null;
  const ids = r.sample(frei, anzahl).sort((a, b) => ABC.indexOf(a) - ABC.indexOf(b));
  return A.reihenfolge({
    frage: 'Lege die Buchstaben so, wie sie im ABC kommen.',
    teile: ids.map(gross), art: 'text', richtung: 'auf',
    hinweis: 'Sag das ABC leise auf. Welcher Buchstabe kommt zuerst?',
    erklaerung: 'So kommen die Buchstaben im ABC.',
    braucht: ids.slice(),
    sig: sig(...ids), daten: { buchstaben: ids },
  });
}

// --- D-BU-07 ---
// Paare, die nie zusammen angeboten werden (gleicher oder ähnlicher Klang)
const NIE = [['tz', 'z'], ['ck', 'k'], ['ie', 'i'], ['äu', 'eu'], ['st', 'sch'], ['sp', 'sch'], ['ng', 'nk'], ['pf', 'f'], ['qu', 'k'], ['ei', 'ai']];
const nie = (a, b) => NIE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
function verbindungHoeren(r, T, auswahlListe, ziel = null) {
  const verb = auswahlListe.filter((v) => T.frei.has(v) && (!ziel || v === ziel));
  if (!verb.length) return null;
  // genau einmal geschrieben und als eigener Laut gehört (nicht ch in Fuchs, Eidechse)
  const imWort = (w, v) => zerlege(w.wort).filter((e) => e === v).length;
  const kand = [];
  for (const v of verb) for (const w of T.woerter) if (w.bild && imWort(w, v) === 1 && lautZahl(w, v) !== null && !/chs/i.test(w.wort)) kand.push({ v, w });
  if (!kand.length) return null;
  const { v, w } = r.pick(kand);
  const einheiten = zerlege(w.wort);
  const lauteGrund = w.laute.map((e) => grundlaut(e));
  // Ablenker: andere Verbindungen der Stufe, dann Buchstaben mit anderem Klang; nichts davon kommt im Wort vor
  const kommtVor = (x) => einheiten.includes(x) || lauteGrund.includes(x) || w.wort.toLowerCase().includes(x);
  // kein Ablenker, der ähnlich klingt wie ein Laut im Wort (sp nicht bei Schnecke, ck nicht bei Kamel)
  const klingtImWort = (x) => lauteGrund.some((g) => nie(x, g) || T.klangKonflikt(x, g) || T.nieZusammen(x, g) || lautAehnlich(T, x, g));
  const passt = (x) => x !== v && T.frei.has(x) && !kommtVor(x) && !klingtImWort(x) && !nie(v, x) && !T.klangKonflikt(v, x) && !T.nieZusammen(v, x);
  const falsche = [];
  for (const x of r.shuffle(verb)) if (falsche.length < 2 && passt(x)) falsche.push(x);
  const buchstaben = ['m', 'l', 'n', 'o', 'f', 'r', 'a', 'i', 'u'];
  for (const x of r.shuffle(buchstaben)) if (falsche.length < 2 && passt(x) && falsche.every((f) => !nie(f, x) && !T.klangKonflikt(f, x))) falsche.push(x);
  if (falsche.length < 2) return null;
  const { optionen, richtig } = auswahl(r, v, falsche, 3);
  return A.wahlWort({
    frage: `Was hörst du in ${sp(w)}? Tippe auf die passenden Buchstaben.`,
    sprich: `Hör gut zu: … ${sp(w)}. Welche Buchstaben hörst du in diesem Wort? Tippe darauf.`,
    vorlesen: sp(w), anlautBild: w.bild, optionen, richtig,
    hinweis: `Sprich das Wort langsam: ${sp(w)}. Achte auf den Laut, der aus zwei oder drei Buchstaben besteht.`,
    erklaerung: `In ${sp(w)} hörst du diese Buchstaben zusammen als einen Laut${T.buchstabe(v)?.wort && T.buchstabe(v).wort !== w.wort ? `, wie in ${T.buchstabe(v).wort}` : ''}.`,
    braucht: [v, ...falsche],
    sig: sig(w.wort, v, ...falsche.slice().sort()), daten: { wort: w.wort, verbindung: v, falsche },
  });
}
