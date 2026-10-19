// Deutsch LE: Lesen (Silben, Wörter, Sichtwörter, Sätze, Verbindungen, kurze Texte).
// Lesetexte zeigen nur eingeführte Buchstaben und Verbindungen; Sichtwörter gelten als Wortbilder (Regel 6).
import { A, sig, auswahl, werkzeug, zerlege } from './lib.js';

const klein = (t) => String(t).toLowerCase();
const VOKAL = /^(ei|au|eu|äu|ie|[aeiouäöü])/;
const istVokal = (einheit) => VOKAL.test(klein(einheit));
// braucht eines Lexikonworts: Lexikon und Zerlegung zusammen (sicher ist sicher)
const brauchtWort = (w) => [...new Set([...w.braucht, ...zerlege(w.wort)])];
const vereint = (...listen) => [...new Set(listen.flat())];
// Bildoption ohne gesprochenen Namen (Lesen: das Kind liest, die App nennt die Bilder nicht)
const bild = (w) => ({ bild: w.bild });
const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Ablenker-Bilder: verschieden, nicht verwechselbar, optional anderer Anlaut und ohne unsicheren Namen
function ablenkerBilder(r, T, ziel, n, { andererAnlaut = false, filter = () => true, sicher = false } = {}) {
  const kand = T.woerter.filter((w) => w.bild && w.wort !== ziel.wort && w.bild !== ziel.bild && !T.verwechselbar(w, ziel)
    && (!andererAnlaut || (w.anlaut !== ziel.anlaut && klein(w.laute[0]) !== klein(ziel.laute[0])))
    && (!sicher || !w.nameUnsicher) && filter(w));
  return T.waehle(r, kand, n);
}

// Wort lesen, Bild wählen (bild-wort)
function wortLesen(r, T, kandidaten, { optionen: anzahl = 3, boegen = false, andererAnlaut = false, ablenker = null, frage = null }) {
  const ziele = kandidaten.filter((w) => w.bild && T.lesbaresWort(w) && brauchtWort(w).every((b) => T.frei.has(b)));
  if (!ziele.length) return null;
  const w = r.pick(ziele);
  const falsche = ablenker ? ablenker(w) : ablenkerBilder(r, T, w, anzahl - 1, { andererAnlaut });
  if (!falsche) return null;
  const { optionen, richtig } = auswahl(r, bild(w), falsche.map(bild), anzahl);
  return A.bildWort({
    frage: frage || 'Lies das Wort. Tippe auf das passende Bild.',
    zeige: w.wort, silben: w.silben, silbenboegen: boegen, optionen, richtig, sprichNachher: w.wort,
    hinweis: boegen ? 'Lies Bogen für Bogen und sprich dabei leise mit.' : 'Lies das Wort langsam, Laut für Laut. Dann schau die Bilder an.',
    erklaerung: `Da steht ${w.wort}. Das ist ${T.mitArtikel(w)}.`,
    braucht: brauchtWort(w), bilder: [w, ...falsche].map((x) => x.bild),
    sig: sig(w.wort, ...falsche.map((x) => x.wort).sort()), daten: { wort: w.wort, ablenker: falsche.map((x) => x.wort) },
  });
}

// --- Silben ---
// Offene Silbe aus einem Konsonanten und einem vollen Vokal (a, i, o, u): gut sprechbar, kein unbetontes e
const OFFEN_VOLL = /^[bdfghklmnprstwz][aiou]$/;
const KONSONANTEN_SILBE = ['b', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w', 'z'];
// Erste Silbe eines lautgetreuen Worts: offen (Ro, Ha, Schau …) bzw. geschlossen oder mit Verbindung (Tul, Kak, Schaf)
const ANFANG_OFFEN = /^(sch|[bdfghklmnprstwz])(ei|au|[aeiouäöü])$/;
const ANFANG_ZU = /^(sch|schw|[bdfghklmnprstwz]{1,2})(ei|au|[aeiouäöü])(sch|[bdfghklmnprstwz]{0,2})$/;
const hatVerbindung = (s) => /sch|ei|au/.test(klein(s));

function silbeHoeren(r, T) {
  // Silben aus lautgetreuen Wörtern, deren Silben die Stimme gut spricht
  const silben = new Map();
  for (const w of T.woerter) {
    if (!w.lautgetreu || !w.silbenSprechbar) continue;
    for (const s of w.silben) { const k = klein(s); if (OFFEN_VOLL.test(k) && T.lesbar([...k]) && !silben.has(k)) silben.set(k, w); }
  }
  if (!silben.size) return null;
  const [ziel, quelle] = r.pick([...silben]);
  const kons = ziel[0], vokal = ziel[1];
  // Ablenker: gleicher Vokal, anderer Anfang; kein gleich klingender Anfang (b/p, d/t, g/k, s/z, f/w) und nicht m/n
  const andere = KONSONANTEN_SILBE.filter((k) => k !== kons && T.frei.has(k) && !T.klangKonflikt(k, kons) && !(['m', 'n'].includes(k) && ['m', 'n'].includes(kons))
    && !(['f', 'w'].includes(k) && ['f', 'w'].includes(kons)));
  const gewaehlt = [];
  for (const k of r.shuffle(andere)) if (gewaehlt.every((g) => !T.klangKonflikt(g, k) && !(['m', 'n'].includes(g) && ['m', 'n'].includes(k)))) { gewaehlt.push(k); if (gewaehlt.length === 2) break; }
  if (gewaehlt.length < 2) return null;
  const zeigen = (s) => gross(s);
  const falsche = gewaehlt.map((k) => k + vokal);
  const { optionen, richtig } = auswahl(r, zeigen(ziel), falsche.map(zeigen), 3);
  return A.wahlWort({
    frage: 'Hör gut zu. Welche Silbe hörst du? Tippe darauf.',
    vorlesen: ziel, optionen, richtig,
    hinweis: 'Sprich die Silbe leise nach. Mit welchem Laut fängt sie an?',
    erklaerung: `Das war die Silbe ${zeigen(ziel)}, wie in ${quelle.wort}.`,
    braucht: vereint(...[ziel, ...falsche].map((s) => [...s])),
    sig: sig(ziel, ...falsche.sort()), daten: { silbe: ziel, ablenker: falsche, quelle: quelle.wort },
  });
}

function silbeLesenBild(r, T, muster, nurZu) {
  // Zielwörter: lautgetreu, Bild mit sicherem Namen (das Kind muss den Namen selbst wissen), erste Silbe nach Muster
  const ziele = T.woerter.filter((w) => w.lautgetreu && w.bild && !w.nameUnsicher && !w.bildMehrere && muster.test(klein(w.silben[0]))
    && (!nurZu || !ANFANG_OFFEN.test(klein(w.silben[0])) || hatVerbindung(w.silben[0])) && T.lesbar(zerlege(w.silben[0]))
    // «Ge» in Geschenk, Gespenst spricht man mit kurzem, dumpfem e: liest das Kind «Ge», hört es den Anfang nicht
    && klein(w.silben[0]) !== 'ge');
  if (!ziele.length) return null;
  const w = r.pick(ziele);
  const silbe = w.silben[0];
  const erste = klein(w.laute[0]);
  const falsche = T.waehle(r, T.woerter.filter((x) => x.bild && !x.nameUnsicher && x.wort !== w.wort && !T.verwechselbar(x, w)
    && klein(x.laute[0]) !== erste && x.anlaut !== w.anlaut && !klein(x.wort).startsWith(klein(silbe))), 2);
  if (!falsche) return null;
  const { optionen, richtig } = auswahl(r, bild(w), falsche.map(bild), 3);
  return A.bildWort({
    frage: 'Lies die Silbe. Welches Wort fängt so an? Tippe auf das Bild.',
    zeige: silbe, optionen, richtig, namenSprechen: false, sprichNachher: `${silbe} … ${w.wort}`,
    hinweis: 'Lies die Silbe langsam. Sag dann zu jedem Bild das Wort und hör auf den Anfang.',
    erklaerung: w.silben.length > 1 ? `Da steht ${silbe}. ${w.wort} fängt mit ${silbe} an.` : `Da steht ${silbe}. Das ist ${T.mitArtikel(w)}.`,
    braucht: zerlege(silbe), bilder: [w, ...falsche].map((x) => x.bild),
    sig: sig(silbe, w.wort, ...falsche.map((x) => x.wort).sort()), daten: { silbe, wort: w.wort, ablenker: falsche.map((x) => x.wort) },
  });
}

// --- Silben zum Wort verbinden ---
function silbenVerbinden(r, T, anzahl, { mitBild, gesprochen, lautgetreu = true }) {
  // jede Silbenkarte muss für sich lesbar sein (Kis|te zeigt «ste» wie am Wortanfang)
  const ziele = T.woerter.filter((w) => (!lautgetreu || w.lautgetreu) && T.lesbaresWort(w) && anzahl.includes(w.silben.length)
    && [...brauchtWort(w), ...w.silben.flatMap((x) => zerlege(x))].every((b) => T.frei.has(b))
    && new Set(w.silben.map(klein)).size === w.silben.length && (!mitBild || (w.bild && !w.nameUnsicher)));
  if (!ziele.length) return null;
  const w = r.pick(ziele);
  return A.silben({
    modus: 'verbinden', silben: w.silben.slice(), bild: mitBild ? w.bild : undefined, vorlesen: gesprochen ? w.wort : undefined,
    frage: gesprochen ? 'Hör gut zu. Tippe die Silben der Reihe nach an, von links nach rechts.' : 'Welches Wort passt zum Bild? Tippe die Silben der Reihe nach an.',
    sprich: gesprochen ? `Hör gut zu: … ${w.wort}. Tippe die Silben der Reihe nach an.` : undefined,
    hinweis: gesprochen ? 'Sprich das Wort langsam nach. Welche Silbe hörst du zuerst?' : 'Sag das Wort zum Bild langsam. Welche Silbe hörst du zuerst?',
    erklaerung: `So heisst das Wort: ${w.wort}.`,
    // eine Silbe, die wie ein Sichtwort aussieht (Ein-horn), braucht auch dessen Einzelbuchstaben
    // jede Silbenkarte für sich: «Kat|ze» zeigt t und z getrennt, «Ein|horn» sieht aus wie das Sichtwort «ein»
    braucht: vereint(brauchtWort(w), ...w.silben.map((x) => (T.istSichtwort(x) ? [...zerlege(x), ...klein(x)] : zerlege(x)))), bilder: mitBild ? [w.bild] : [],
    sig: sig(w.wort), daten: { wort: w.wort, silben: w.silben },
  });
}

// --- Minimalpaare: Wörter, die sich in genau einer Lauteinheit unterscheiden ---
function unterschiede(a, b) {
  const x = a.laute.map(klein), y = b.laute.map(klein);
  if (x.length !== y.length) return null;
  const d = [];
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) d.push(i);
  return d;
}
const minimalpaar = (a, b) => unterschiede(a, b)?.length === 1;

// --- Sichtwörter: Wörter, die nur m und n unterscheidet, nicht zusammen anbieten (im/in, am/an, dem/den) ---
function aehnlichKlang(a, b) {
  if (a.length !== b.length) return false;
  let d = 0, mn = true;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) { d++; if (!(['m', 'n'].includes(a[i]) && ['m', 'n'].includes(b[i]))) mn = false; }
  return d === 1 && mn;
}

// Satzzerlegung für «antippen» mit Wörtern: Satzzeichen bleiben am Wort
const woerterVon = (satz) => satz.split(' ');
const ohneZeichen = (t) => t.replace(/[.,!?]/g, '');

// Szene oder Emoji als Bildoption
const bildOpt = (b) => (typeof b === 'string' ? { bild: b } : { szene: b });
const lesbarText = (T, braucht) => braucht.every((b) => T.frei.has(b));
// braucht eines Lesetexts nach Regel 6: Sichtwörter nur mit ihren Einzelbuchstaben, alle anderen Wörter nach zerlege
function brauchtLesen(T, ...texte) {
  const s = new Set();
  for (const wort of texte.join(' ').split(/[\s.,!?«»:;-]+/).filter(Boolean)) {
    for (const e of (T.istSichtwort(wort) ? [...klein(wort)] : zerlege(wort))) s.add(e);
  }
  return [...s];
}
// Sätze, die zum Lesen geschrieben sind (nicht die Hörsätze)
const leseSatz = (s) => Boolean(s.stufen?.['D-LE-08'] || s.stufen?.['D-SC-05']);

// Konsonantenhäufung: zwei Konsonanten-Einheiten nebeneinander
const haeufung = (w) => w.laute.some((e, i) => i > 0 && !istVokal(e) && !istVokal(w.laute[i - 1]));
const merk = (w, ...m) => m.some((x) => (w.merk || []).includes(x));

// Zusammengesetzte Wörter im Lexikon (für lange Wörter, D-LE-04 Stufe 3)
const ZUSAMMENGESETZT = ['Einhorn', 'Nashorn', 'Lastwagen', 'Regenbogen', 'Sonnenblume', 'Schneemann', 'Fledermaus', 'Wildschwein', 'Seilbahn', 'Handschuh', 'Sanduhr', 'Zahnbürste', 'Erdbeere', 'Erdnuss', 'Schildkröte', 'Motorrad', 'Kokosnuss', 'Nilpferd', 'Eichhörnchen', 'Spiegelei', 'Feuerwehr', 'Flugzeug', 'Rucksack', 'Faultier', 'Dreieck'];

export const generatoren = {
  'D-LE-01': {
    // gehörte offene Silbe unter drei geschriebenen finden (nur mit gut gesprochenen Silben)
    1: (r, ctx) => silbeHoeren(r, werkzeug(ctx)),
    // offene Silbe lesen, Bild wählen, dessen Wort so anfängt (ohne Stimme lösbar)
    2: (r, ctx) => silbeLesenBild(r, werkzeug(ctx), ANFANG_OFFEN, false),
    // geschlossene Silben und Silben mit Verbindung
    3: (r, ctx) => silbeLesenBild(r, werkzeug(ctx), ANFANG_ZU, true),
  },

  'D-LE-02': {
    1: (r, ctx) => silbenVerbinden(r, werkzeug(ctx), [2], { mitBild: true }),
    2: (r, ctx) => silbenVerbinden(r, werkzeug(ctx), [3], { mitBild: true, lautgetreu: false }),
    3: (r, ctx) => silbenVerbinden(r, werkzeug(ctx), [2, 3], { mitBild: false, gesprochen: true, lautgetreu: false }),
  },

  'D-LE-03': {
    1: (r, ctx) => { const T = werkzeug(ctx); return wortLesen(r, T, T.woerter.filter((w) => w.lautgetreu && w.silben.length === 2 && !w.nameUnsicher), { optionen: 3, boegen: true, andererAnlaut: true }); },
    2: (r, ctx) => { const T = werkzeug(ctx); return wortLesen(r, T, T.woerter.filter((w) => w.silben.length === 2 && !w.nameUnsicher), { optionen: 4 }); },
    // ähnliche Wörter: mindestens ein Ablenker unterscheidet sich in genau einer Lauteinheit
    3: (r, ctx) => {
      const T = werkzeug(ctx);
      // ohne Bilder mit unsicherem Namen (🐙 «Krake» neben 🦀 «Krabbe»)
      const mitPartner = T.woerter.filter((w) => w.bild && !w.nameUnsicher && w.silben.length === 2 && T.lesbaresWort(w)
        && T.woerter.some((x) => x.bild && !x.nameUnsicher && x !== w && minimalpaar(w, x) && !T.verwechselbar(w, x)));
      return wortLesen(r, T, mitPartner, {
        optionen: 3,
        ablenker: (w) => {
          const partner = T.waehle(r, T.woerter.filter((x) => x.bild && !x.nameUnsicher && x !== w && minimalpaar(w, x) && !T.verwechselbar(w, x)), 1);
          if (!partner) return null;
          // zweiter Ablenker: wenn möglich ebenfalls ähnlich, sonst ein anderes Wort mit gleich vielen Silben
          const zweite = T.waehle(r, T.woerter.filter((x) => x.bild && !x.nameUnsicher && x !== w && x !== partner[0] && minimalpaar(w, x) && !T.verwechselbar(w, x) && !T.verwechselbar(partner[0], x)), 1)
            || T.waehle(r, T.woerter.filter((x) => x.bild && x !== w && x !== partner[0] && x.silben.length === 2 && !x.nameUnsicher && !T.verwechselbar(w, x) && !T.verwechselbar(partner[0], x)), 1);
          return zweite ? [partner[0], zweite[0]] : null;
        },
      });
    },
  },

  'D-LE-04': {
    1: (r, ctx) => { const T = werkzeug(ctx); return wortLesen(r, T, T.woerter.filter((w) => w.lautgetreu && w.silben.length === 3 && !w.nameUnsicher), { optionen: 3, boegen: true, andererAnlaut: true }); },
    2: (r, ctx) => { const T = werkzeug(ctx); return wortLesen(r, T, T.woerter.filter((w) => w.silben.length === 3 && !w.nameUnsicher), { optionen: 4, andererAnlaut: true }); },
    3: (r, ctx) => { const T = werkzeug(ctx); return wortLesen(r, T, T.woerter.filter((w) => (w.silben.length >= 4 || ZUSAMMENGESETZT.includes(w.wort)) && !w.nameUnsicher), { optionen: 3 }); },
  },

  'D-LE-05': {
    // einsilbig, lautgetreu, ohne Konsonantenhäufung (Bus, Hut, Wal)
    1: (r, ctx) => { const T = werkzeug(ctx); return wortLesen(r, T, T.woerter.filter((w) => w.lautgetreu && w.silben.length === 1 && !haeufung(w) && !w.nameUnsicher), { optionen: 3, andererAnlaut: true }); },
    // zwei Konsonanten am Anfang oder Ende (Brot, Pilz, Zelt)
    2: (r, ctx) => { const T = werkzeug(ctx); return wortLesen(r, T, T.woerter.filter((w) => w.lautgetreu && w.silben.length === 1 && haeufung(w)), { optionen: 4, andererAnlaut: true }); },
    // Doppelkonsonant oder stummes h (Ball, Kuh, Zahn)
    3: (r, ctx) => { const T = werkzeug(ctx); return wortLesen(r, T, T.woerter.filter((w) => w.silben.length === 1 && merk(w, 'doppel', 'dehnung-h')), { optionen: 4, andererAnlaut: true }); },
  },

  'D-LE-06': {
    // drei geschriebene Wörter mit verschiedenem Anfang
    1: (r, ctx) => gehoertesWort(r, werkzeug(ctx), { anzahl: 3, art: 'anfang-verschieden', lautgetreu: true }),
    // drei Wörter mit gleichem Anfang
    2: (r, ctx) => gehoertesWort(r, werkzeug(ctx), { anzahl: 3, art: 'anfang-gleich' }),
    // vier Wörter, gleicher Anfang und gleiches Ende, der Unterschied liegt in der Mitte
    3: (r, ctx) => gehoertesWort(r, werkzeug(ctx), { anzahl: 4, art: 'mitte' }),
  },

  'D-LE-07': {
    1: (r, ctx) => sichtwort(r, ctx, 1),
    2: (r, ctx) => sichtwort(r, ctx, 2),
    3: (r, ctx) => sichtwort(r, ctx, 3),
  },

  'D-LE-08': {
    1: (r, ctx) => satzLesen(r, ctx, 1),
    2: (r, ctx) => satzLesen(r, ctx, 2),
    3: (r, ctx) => satzLesen(r, ctx, 3),
  },

  'D-LE-09': {
    1: (r, ctx) => verbindungLesen(r, ctx),
    2: (r, ctx) => verbindungLesen(r, ctx),
    3: (r, ctx) => verbindungLesen(r, ctx),
  },

  'D-LE-10': {
    1: (r, ctx) => textLesen(r, ctx, 1),
    2: (r, ctx) => textLesen(r, ctx, 2),
    3: (r, ctx) => textLesen(r, ctx, 3),
  },
};

// --- Gehörtes Wort unter geschriebenen finden ---
function gehoertesWort(r, T, { anzahl, art, lautgetreu = false }) {
  // geschriebene Wörter: lesbar, höchstens drei Silben, keine Doppelungen im Bild nötig
  const lesbar = T.woerter.filter((w) => T.lesbaresWort(w) && w.silben.length <= 3 && (!lautgetreu || w.lautgetreu));
  const ersteE = (w) => klein(w.laute[0]);
  const letzteE = (w) => klein(w.laute[w.laute.length - 1]);
  const passtZu = {
    'anfang-verschieden': (w, x) => ersteE(x) !== ersteE(w) && x.anlaut !== w.anlaut && !T.klangKonflikt(x.anlaut, w.anlaut),
    'anfang-gleich': (w, x) => ersteE(x) === ersteE(w),
    mitte: (w, x) => ersteE(x) === ersteE(w) && letzteE(x) === letzteE(w) && x.laute.length >= 3 && Math.abs(x.laute.length - w.laute.length) <= 1,
  }[art];
  const ziele = lesbar.filter((w) => (art !== 'mitte' || w.laute.length >= 3) && lesbar.filter((x) => x !== w && klein(x.wort) !== klein(w.wort) && passtZu(w, x)).length >= anzahl - 1);
  if (!ziele.length) return null;
  const w = r.pick(ziele);
  // die Ablenker untereinander: bei «verschieden» auch untereinander anderer Anfang
  const kand = lesbar.filter((x) => x !== w && klein(x.wort) !== klein(w.wort) && passtZu(w, x));
  const falsche = [];
  // bei «Mitte» zuerst echte Minimalpaare (Hase, Hose)
  const reihe = art === 'mitte' ? [...r.shuffle(kand.filter((x) => minimalpaar(w, x))), ...r.shuffle(kand.filter((x) => !minimalpaar(w, x)))] : r.shuffle(kand);
  for (const x of reihe) {
    if (falsche.length >= anzahl - 1) break;
    if (falsche.some((f) => klein(f.wort) === klein(x.wort) || (art === 'anfang-verschieden' && (ersteE(f) === ersteE(x) || T.klangKonflikt(f.anlaut, x.anlaut))))) continue;
    falsche.push(x);
  }
  if (falsche.length < anzahl - 1) return null;
  const { optionen, richtig } = auswahl(r, w.wort, falsche.map((x) => x.wort), anzahl);
  const hinweis = art === 'anfang-verschieden' ? 'Hör auf den Anfang des Worts. Welches geschriebene Wort fängt so an?'
    : art === 'anfang-gleich' ? 'Alle Wörter fangen gleich an. Lies weiter und hör, wie das Wort aufhört.'
      : 'Anfang und Ende sind gleich. Lies genau, was in der Mitte steht.';
  return A.wahlWort({
    frage: 'Hör gut zu. Welches Wort hörst du? Tippe darauf.',
    vorlesen: w.sprich || w.wort, optionen, richtig,
    hinweis, erklaerung: `Du hast ${w.wort} gehört. So schreibt man es.`,
    braucht: vereint(brauchtWort(w), ...falsche.map(brauchtWort)),
    sig: sig(w.wort, ...falsche.map((x) => x.wort).sort()), daten: { wort: w.wort, ablenker: falsche.map((x) => x.wort), art },
  });
}

// --- Sichtwörter ---
function sichtwort(r, ctx, gruppe) {
  const T = werkzeug(ctx);
  const eigene = T.sichtwoerter(gruppe);
  if (!eigene.length) return null;
  const ziel = ctx.karte ? eigene.find((x) => x.wort === ctx.karte) : r.pick(eigene);   // Karte aus dem Karteikasten
  if (!ziel) return null;
  const zw = ziel.wort;
  const buchst = (t) => [...klein(t)];
  // Variante: im Satz antippen (wenn es einen lesbaren Satz gibt, in dem das Wort genau einmal vorkommt)
  const saetze = (ctx.inhalte?.saetze || []).filter((s) => leseSatz(s) && lesbarText(T, brauchtLesen(T, s.satz))
    && woerterVon(s.satz).filter((x) => klein(ohneZeichen(x)) === klein(zw)).length === 1);
  if (saetze.length && r.bool(0.35)) {
    const s = r.pick(saetze);
    const woerter = woerterVon(s.satz);
    const i = woerter.findIndex((x) => klein(ohneZeichen(x)) === klein(zw));
    return A.antippen({
      frage: `Tippe im Satz auf das Wort … ${zw}. Dann tippe auf den Haken.`,
      zeige: s.satz, einheit: 'wort', loesung: [String(i)],
      hinweis: `Schau jedes Wort an. Das Wort ${zw} hat ${zw.length} Buchstaben.`,
      erklaerung: `Hier steht ${zw}.`,
      braucht: brauchtLesen(T, s.satz),
      sig: sig('satz', zw, s.id), daten: { wort: zw, satz: s.satz, index: i },
    });
  }
  // Auswahl unter geschriebenen Sichtwörtern (dieselbe Gruppe, wenn nötig auch frühere Gruppen)
  const anzahl = gruppe === 1 ? 3 : 4;
  const pool = [...eigene, ...(gruppe > 1 ? T.sichtwoerter(gruppe - 1) : [])].filter((s) => s.wort !== zw && !aehnlichKlang(s.wort, zw));
  const falsche = [];
  for (const s of r.shuffle(pool)) {
    if (falsche.length >= anzahl - 1) break;
    if (falsche.some((f) => f.wort === s.wort || aehnlichKlang(f.wort, s.wort))) continue;
    falsche.push(s);
  }
  if (falsche.length < anzahl - 1) return null;
  const { optionen, richtig } = auswahl(r, zw, falsche.map((s) => s.wort), anzahl);
  return A.wahlWort({
    frage: 'Hör gut zu. Welches Wort hörst du? Tippe darauf.',
    vorlesen: zw, optionen, richtig,
    // Die Länge nur nennen, wenn sie die Lösung nicht verrät (mindestens ein Ablenker gleich lang)
    hinweis: falsche.some((f) => f.wort.length === zw.length) ? `Das Wort hat ${zw.length} Buchstaben. Lies jedes Wort leise.` : 'Lies jedes Wort leise und hör, wie es anfängt.',
    erklaerung: `Das Wort ${zw} sieht so aus.`,
    braucht: vereint(buchst(zw), ...falsche.map((s) => buchst(s.wort))),
    sig: sig(zw, ...falsche.map((s) => s.wort).sort()), daten: { wort: zw, ablenker: falsche.map((s) => s.wort) },
  });
}

// --- Sätze lesen: der Satz und seine Ablenker-Sätze sind gleichwertig; jeder kann der gezeigte sein ---
function satzLesen(r, ctx, stufe) {
  const T = werkzeug(ctx);
  const liste = (ctx.inhalte?.saetze || []).filter((s) => s.stufen?.['D-LE-08'] === stufe && (s.ablenker || []).length >= 1
    && lesbarText(T, brauchtLesen(T, s.satz, ...s.ablenker.map((a) => a.satz))));
  if (!liste.length) return null;
  const s = r.pick(liste);
  const varianten = [{ satz: s.satz, bild: s.bild }, ...s.ablenker];
  const z = r.int(0, varianten.length - 1);
  const ziel = varianten[z];
  const falsche = varianten.filter((_, i) => i !== z);
  const { optionen, richtig } = auswahl(r, bildOpt(ziel.bild), falsche.map((v) => bildOpt(v.bild)), varianten.length);
  const hinweis = {
    nomen: 'Lies den Satz Wort für Wort. Schau dann die Bilder genau an.',
    verb: 'Lies den Satz bis zum Schluss. Das letzte Wort sagt, was passiert.',
    farbe: 'Lies den Satz bis zum Schluss. Welche Farbe steht da?',
    lage: 'Lies genau, wo es ist: auf, unter, neben oder in? Schau dann die Bilder an.',
  }[s.unterschied] || 'Lies den Satz Wort für Wort.';
  return A.bildWort({
    frage: 'Lies den Satz. Tippe auf das passende Bild.',
    zeige: ziel.satz, optionen, richtig, sprichNachher: ziel.satz,
    hinweis, erklaerung: `Da steht: ${ziel.satz} Dazu passt dieses Bild.`,
    braucht: brauchtLesen(T, ...varianten.map((v) => v.satz)),
    sig: sig(s.id, z), daten: { id: s.id, satz: ziel.satz, unterschied: s.unterschied },
  });
}

// --- Wörter mit Verbindungen ---
// Erklärung für alle Verbindungen im Wort (Schwein: «sch» und «ei»)
const ZAHLWORT = { 2: 'zwei', 3: 'drei' };
function verbindungErklaerung(w) {
  const verb = w.laute.map(klein).filter((e) => e.length > 1 && /^(sch|ch|ei|au|eu|äu|ie|st|sp|pf|ck|tz|ng|nk|qu)$/.test(e));
  if (verb.length <= 1) return `Da steht ${w.wort}. ${verb[0]?.length === 3 ? 'Drei' : 'Zwei'} Buchstaben gehören hier zusammen.`;
  return `Da steht ${w.wort}. Hier gehören zweimal Buchstaben zusammen: ${verb.map((e) => `die ${ZAHLWORT[e.length]} für ${e}`).join(' und ')}.`;
}
function verbindungLesen(r, ctx) {
  const T = werkzeug(ctx);
  // nur eingeführte Verbindungen der Stufe, zu denen es ein lesbares Wort mit Bild gibt (für Qu und Äu fehlt eines)
  const zielwoerter = (v) => T.woerter.filter((w) => w.bild && !w.nameUnsicher && T.lesbaresWort(w) && w.laute.map(klein).includes(v));
  const verb = (ctx.stufe?.auswahl || []).filter((v) => T.frei.has(v) && zielwoerter(v).length);
  if (!verb.length) return null;
  const v = r.pick(verb);
  const w = r.pick(zielwoerter(v));
  const falsche = ablenkerBilder(r, T, w, 2, { andererAnlaut: true, filter: (x) => !x.laute.map(klein).includes(v) });
  if (!falsche) return null;
  const { optionen, richtig } = auswahl(r, bild(w), falsche.map(bild), 3);
  return A.bildWort({
    frage: 'Lies das Wort. Tippe auf das passende Bild.',
    zeige: w.wort, silben: w.silben, silbenboegen: false, optionen, richtig, sprichNachher: w.wort,
    // die Verbindung wird nicht allein gesprochen (die Stimme buchstabiert «Sch» oder «Ch» sonst)
    hinweis: 'Such die Buchstaben, die zusammengehören. Lies das Wort dann langsam.',
    erklaerung: verbindungErklaerung(w),
    braucht: brauchtWort(w), bilder: [w, ...falsche].map((x) => x.bild),
    sig: sig(v, w.wort, ...falsche.map((x) => x.wort).sort()), daten: { verbindung: v, wort: w.wort, ablenker: falsche.map((x) => x.wort) },
  });
}

// --- Kurze Texte verstehen (Erweiterung): Text lesen, Frage beantworten, Bild wählen ---
function textLesen(r, ctx, stufe) {
  const T = werkzeug(ctx);
  const liste = (ctx.inhalte?.geschichten || []).filter((g) => g.stufen?.['D-LE-10'] === stufe && Array.isArray(g.saetze) && lesbarText(T, brauchtLesen(T, ...g.saetze, g.frage)));
  if (!liste.length) return null;
  const g = r.pick(liste);
  const richtigeOpt = g.optionen[g.richtig];
  const { optionen, richtig } = auswahl(r, richtigeOpt, g.optionen.filter((_, i) => i !== g.richtig), g.optionen.length);
  const text = `${g.saetze.join(' ')} ${g.frage}`;
  return A.bildWort({
    frage: `Lies die Geschichte und die Frage. Tippe auf das passende Bild.`,
    zeige: text, optionen, richtig, sprichNachher: text,
    hinweis: 'Lies die Frage noch einmal. Such dann im Text den Satz, der die Antwort weiss.',
    erklaerung: g.erklaerung || `${g.frage} Die Antwort steht im Text.`,
    braucht: brauchtLesen(T, ...g.saetze, g.frage),
    sig: sig(g.id), daten: { id: g.id },
  });
}
