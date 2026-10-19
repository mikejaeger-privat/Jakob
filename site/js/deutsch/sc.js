// Deutsch SC: Schreiben (nachspuren, Wort hören und legen, abschreiben, Buchstaben ergänzen, Satz legen, Lernwörter).
// Schreibaufgaben nur mit lautgetreuen Wörtern (keine Merkstellen), nur eingeführte Buchstaben und Verbindungen.
import { A, sig, auswahl, werkzeug, zerlege } from './lib.js';

const klein = (t) => String(t).toLowerCase();
const gross = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const vereint = (...listen) => [...new Set(listen.flat())];
const VOKALE = ['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'ü'];
const istVokal = (e) => /^(ei|au|eu|äu|ie|[aeiouäöü])/.test(klein(e));
// Einheiten eines Lexikonworts als Kacheln (Lauteinheiten mit Gross- und Kleinschreibung wie im Wort)
const kacheln = (w) => w.laute.slice();
// Schreibwörter: lautgetreu, alle Buchstaben eingeführt, Einheiten wie im Buchstabenplan (Laute = Zerlegung)
function schreibwoerter(T, { laute = null, silben = null, zaehlbar = false } = {}) {
  return T.woerter.filter((w) => w.lautgetreu && T.lesbaresWort(w) && (!zaehlbar || w.lautzaehlbar)
    && w.laute.map(klein).join('|') === zerlege(w.wort).join('|')
    && (!laute || laute.includes(w.laute.length)) && (!silben || silben.includes(w.silben.length)));
}

// Zusätzliche Buchstaben-Kacheln: eingeführt, nicht im Wort, nie gleich klingend oder aus «nieZusammen» (kein e neben ä).
// aehnlich = true: bevorzugt ähnlich klingende Buchstaben (Stufe 3), sonst deutlich andere.
function zusatzKacheln(r, T, w, n, { aehnlich = false } = {}) {
  const imWort = w.laute.map(klein);
  const plan = (id) => T.buchstabe(id) || {};
  const einzeln = T.B.liste.filter((b) => b.id.length === 1 && T.frei.has(b.id) && !['c', 'q', 'x', 'y'].includes(b.id)).map((b) => b.id);
  // nicht im Wort, auch nicht als Teil einer Verbindung (kein i neben Ei, kein s neben Sch)
  const ok = (k) => !imWort.includes(k) && !imWort.some((e) => e.length > 1 && e.includes(k)) && imWort.every((e) => !T.klangKonflikt(e, k) && !T.nieZusammen(e, k));
  const nah = (k) => imWort.some((e) => (plan(e).aehnlichLaut || []).includes(k) || (plan(k).aehnlichLaut || []).includes(e)
    || (plan(e).aehnlichForm || []).includes(k) || (plan(k).aehnlichForm || []).includes(e));
  const passt = einzeln.filter(ok);
  const aus = [];
  if (aehnlich) for (const k of r.shuffle(passt.filter(nah))) { if (aus.length >= 1) break; aus.push(k); }
  for (const k of r.shuffle(passt.filter((k) => !nah(k)))) { if (aus.length >= n) break; if (!aus.includes(k)) aus.push(k); }
  return aus.length === n ? aus : null;
}

// Wörter, die beim Ergänzen nicht entstehen dürfen (häufige Wörter, die nicht im Lexikon stehen)
const SPERRLISTE = new Set(`omi opi schar mama papa name mofa hose dose rose nase vase hase oma opa kino auto sofa lama mond wand hand sand land band rand
wind kind rind ball fall hund mund rund bunt hut gut mut wut tor ohr rot not brot boot bus eis reis kreis maus haus laus raus baum raum traum
bein wein stein nein sein dein mein fein klein schein sonne tonne wanne kanne tanne dame same lamm kamm pause lose tot bot hat rat tat satt
nass hass fass pass tasse kasse masse wasser messer esel igel regel nagel vogel kegel segel tür reh see tee fee zoo uhr mehr sehr hier tier vier
tag weg zug berg burg korb kalb gelb halb dorf hof rad bad pfad rabe gabe nabe hafer kater vater mutter oder aber eben oben unten bitte danke
hallo heute morgen abend nacht licht leer meer heer teer bär beere ofen hafen rasen nase dose mais mus muss bis bin bist ist sind sein seid
wir ihr sie er es du ich an am in im um zu so da wo wie was wer wann dann denn wenn mit von vor bei aus auf ab ob ja nein nur nun noch schon
rosa lila blau grau rot gelb grün braun gut alt neu neun zehn elf eins zwei drei vier fünf sechs sieben acht
sohn tal mal mahl wal wahl saal aal kahl pfahl stahl schal zahl qual ball tal hals salz malz pilz filz milz harz herz kerz schmerz
wolf golf welt geld feld held zelt fell hell bell gell well mann kann wann bann tanne panne pfanne sahne fahne hahn zahn bahn kahn wahn
hose rose lose dose base vase nase rasen hasen wasen leise reise weise meise
tafel gabel nabel kabel säbel fabel nudel pudel rudel sudel
kino kilo kiwi kuli limo lupe tube tube rübe hupe suppe puppe lupe
dino lama loch mama mehl mila miau muh rabe ruhe rufe rute tor tour tal tun tut`.split(/\s+/).filter(Boolean));

function ergibtWort(T, wort) {
  const k = klein(wort);
  return SPERRLISTE.has(k) || T.woerter.some((w) => klein(w.wort) === k || klein(w.mehrzahl || '') === k) || T.W.sichtwoerter.some((s) => klein(s.wort) === k);
}

// --- Fehlenden Buchstaben ergänzen ---
function ergaenzen(r, T, stelle) {
  const kand = [];
  for (const w of schreibwoerter(T)) {
    if (!w.bild || w.nameUnsicher || w.laute.length < 3) continue;
    const n = w.laute.length;
    const idx = stelle === 'anfang' ? [0] : stelle === 'ende' ? [n - 1] : Array.from({ length: n - 2 }, (_, i) => i + 1);
    // nur Einzelbuchstaben; die Lücke darf keine neue Verbindung entstehen lassen (I_el sähe aus wie «ie»)
    for (const i of idx) if (w.laute[i].length === 1 && zerlege(w.laute.filter((_, j) => j !== i).join('')).join('|') === w.laute.filter((_, j) => j !== i).map(klein).join('|')) kand.push([w, i]);
  }
  if (!kand.length) return null;
  const [w, i] = r.pick(kand);
  const richtigK = klein(w.laute[i]);
  const vokal = VOKALE.includes(richtigK);
  // Ablenker: gleiche Art (Vokal oder Konsonant), eingeführt, nicht gleich klingend, nicht aus nieZusammen, ergeben kein Wort
  const pool = T.B.liste.filter((b) => b.id.length === 1 && T.frei.has(b.id) && !['c', 'q', 'x', 'y', 'j', 'v'].includes(b.id)
    && VOKALE.includes(b.id) === vokal && b.id !== richtigK && !T.klangKonflikt(b.id, richtigK) && !T.nieZusammen(b.id, richtigK)
    && !((T.buchstabe(richtigK)?.aehnlichLaut || []).includes(b.id)) && !((b.aehnlichLaut || []).includes(richtigK))).map((b) => b.id);
  const form = (k) => (i === 0 ? k.toUpperCase() : k);
  const setze = (k) => w.laute.map((e, j) => (j === i ? form(k) : e)).join('');
  const falsche = [];
  for (const k of r.shuffle(pool)) {
    if (falsche.length >= 2) break;
    if (ergibtWort(T, setze(k))) continue;
    if (falsche.some((f) => T.klangKonflikt(f, k) || T.nieZusammen(f, k))) continue;
    falsche.push(k);
  }
  if (falsche.length < 2) return null;
  const luecke = w.laute.map((e, j) => (j === i ? '_' : e)).join('');
  const { optionen, richtig } = auswahl(r, form(richtigK), falsche.map(form), 3);
  const wo = stelle === 'anfang' ? 'am Anfang' : stelle === 'ende' ? 'am Ende' : 'in der Mitte';
  return A.wahlWort({
    // Das Kind nennt das Bild selbst (SPEC Abschnitt 7, wahl-bild): das Wort wird vor der Antwort nicht gesprochen
    frage: `Schau das Bild an. Welcher Buchstabe fehlt ${wo}? Tippe darauf.`,
    zeige: luecke, bild: w.bild, namenSprechen: false, optionen, richtig,
    hinweis: stelle === 'anfang' ? 'Sprich das Wort zum Bild langsam. Welchen Laut hörst du ganz am Anfang?'
      : stelle === 'ende' ? 'Sprich das Wort zum Bild langsam. Welchen Laut hörst du ganz am Schluss?'
        : 'Sprich das Wort zum Bild langsam, Laut für Laut. Welcher Laut fehlt in der Lücke?',
    erklaerung: `Das Wort heisst ${w.wort}. So ist es vollständig.`,
    braucht: vereint(w.laute.map(klein), falsche), bilder: [w.bild],
    sig: sig(w.wort, i, ...falsche.sort()), daten: { wort: w.wort, index: i, ablenker: falsche },
  });
}

// --- Wort hören und legen ---
function hoerenLegen(r, T, ctx, { laute, silben = null, zusatz = 0, aehnlich = false, tabelle = false }) {
  const ziele = schreibwoerter(T, { laute, silben, zaehlbar: true }).filter((w) => w.bild);
  if (!ziele.length) return null;
  const w = r.pick(ziele);
  const extra = zusatz ? zusatzKacheln(r, T, w, zusatz, { aehnlich }) : [];
  if (!extra) return null;
  const silbenWeise = ctx.silben && w.silbenSprechbar && w.silben.length > 1;
  return A.legen({
    frage: 'Hör gut zu und lege das Wort mit den Buchstaben.',
    sprich: `Hör gut zu: … ${w.sprich || w.wort}. Lege das Wort mit den Buchstaben.`,
    vorlesen: w.sprich || w.wort, bild: w.bild,
    kacheln: [...kacheln(w), ...extra], loesung: kacheln(w), felder: w.laute.length, anlauttabelle: tabelle || undefined,
    hinweis: silbenWeise ? `Sprich das Wort langsam: ${w.silben.join(' … ')}. Für jeden Laut gibt es ein Kästchen.` : 'Sprich das Wort langsam, Laut für Laut. Für jeden Laut gibt es ein Kästchen.',
    erklaerung: `So schreibt man ${w.wort}.`,
    braucht: vereint(w.laute.map(klein), extra), bilder: [w.bild],
    sig: sig(w.wort, ...extra.sort()), daten: { wort: w.wort, laute: w.laute, extra },
  });
}

// --- Wort abschreiben ---
function abschreiben(r, T, { laute, verdecken = false }) {
  const ziele = schreibwoerter(T, { laute });
  if (!ziele.length) return null;
  const w = r.pick(ziele);
  return A.legen({
    frage: verdecken ? 'Schau das Wort gut an. Dann verstecke es und lege es aus dem Kopf.' : 'Schreib das Wort ab. Lege die Buchstaben der Reihe nach.',
    abschreiben: w.wort, verdecken: verdecken || undefined, bild: w.bild && !w.nameUnsicher ? w.bild : undefined,
    kacheln: kacheln(w), loesung: kacheln(w), felder: w.laute.length,
    hinweis: verdecken ? 'Schau das Wort nochmals an. Welcher Buchstabe kommt zuerst?' : 'Fang links an. Such zuerst den ersten Buchstaben, dann den nächsten.',
    erklaerung: `So schreibt man ${w.wort}.`,
    braucht: w.laute.map(klein),
    sig: sig(w.wort, verdecken), daten: { wort: w.wort, laute: w.laute },
  });
}

// --- Satz aus Wörtern legen ---
// braucht eines Satzes nach Regel 6: Sichtwörter nur mit ihren Einzelbuchstaben
function brauchtLesen(T, ...texte) {
  const s = new Set();
  for (const wort of texte.join(' ').split(/[\s.,!?«»:;-]+/).filter(Boolean)) for (const e of (T.istSichtwort(wort) ? [...klein(wort)] : zerlege(wort))) s.add(e);
  return [...s];
}
// Geschlechter, die ein Begleiter im Satz zulässt (der: Nominativ männlich oder Dativ weiblich, dem/im/ein: männlich oder sächlich …)
const BEGLEITER = { der: ['der', 'die'], die: ['die'], das: ['das'], den: ['der'], dem: ['der', 'das'], im: ['der', 'das'], ein: ['der', 'das'], eine: ['die'], einen: ['der'], einem: ['der', 'das'], einer: ['die'] };
// Überzählige Karte: ein lautgetreues Nomen aus dem Lexikon, dessen Geschlecht zu keinem Begleiter und keinem Nomen im Satz passt.
// So kann die Karte kein Wort im Satz ersetzen («Lea malt eine rote Rose.» + «Hut»: «eine rote Hut» geht nicht).
function ueberzaehligeKarte(r, T, woerter) {
  const imSatz = new Set(woerter.map(klein));
  const besetzt = new Set();
  for (const x of woerter) {
    for (const g of BEGLEITER[klein(x)] || []) besetzt.add(g);
    const lex = T.woerter.find((w) => w.wort === x || w.mehrzahl === x);
    if (lex?.artikel) besetzt.add(lex.artikel);
  }
  const kand = T.woerter.filter((w) => w.lautgetreu && T.lesbaresWort(w) && w.artikel && !besetzt.has(w.artikel) && w.silben.length <= 2 && w.wort.length <= 6
    && !imSatz.has(klein(w.wort)) && /^[A-ZÄÖÜ][a-zäöü]+$/.test(w.wort));
  return kand.length ? r.pick(kand).wort : null;
}
function satzLegen(r, ctx, stufe) {
  const T = werkzeug(ctx);
  const liste = (ctx.inhalte?.saetze || []).filter((s) => s.stufen?.['D-SC-05'] === stufe && Array.isArray(s.woerter)
    && brauchtLesen(T, s.satz).every((b) => T.frei.has(b)) && new Set(s.woerter.map(klein)).size === s.woerter.length);
  if (!liste.length) return null;
  const s = r.pick(liste);
  const woerter = s.woerter.filter((x) => !/^[.!?]$/.test(x));
  const zeichen = s.woerter.find((x) => /^[.!?]$/.test(x)) || '.';
  const ablenker = [];
  if (stufe === 3) {
    const extra = ueberzaehligeKarte(r, T, woerter);
    if (!extra) return null;
    ablenker.push(extra);
  }
  const teile = stufe === 3 ? [...woerter, zeichen] : woerter;
  return A.reihenfolge({
    frage: 'Hör gut zu und lege die Wörter in die richtige Reihenfolge.',
    sprich: `Hör gut zu: … ${s.satz} … Lege die Wörter in die richtige Reihenfolge.`,
    vorlesen: s.satz, teile, art: 'text', ende: stufe === 3 ? undefined : zeichen, ablenker: ablenker.length ? ablenker : undefined,
    // Bild zum Satz als Stütze; bei einer Szene zusätzlich ihr Emoji, solange «reihenfolge» nur «bild» zeigt
    bild: typeof s.bild === 'string' ? s.bild : s.bild?.bild, szene: typeof s.bild === 'object' ? s.bild : undefined,
    hinweis: stufe === 3 ? 'Ein Satz fängt mit einem grossen Buchstaben an. Die Karte mit dem kleinen Zeichen kommt ans Ende. Eine Karte brauchst du nicht.' : 'Hör den Satz nochmals. Welches Wort hast du zuerst gehört?',
    erklaerung: `Der Satz heisst: ${s.satz}`,
    braucht: vereint(brauchtLesen(T, s.satz), ...ablenker.map((a) => zerlege(a))),
    sig: sig(s.id, ...ablenker), daten: { id: s.id, satz: s.satz, ablenker },
  });
}

// --- Lernwörter der Woche (von den Eltern eingetragen) ---
function lernwort(r, ctx, stufe) {
  const T = werkzeug(ctx);
  const liste = (ctx.lernwoerter || []).map((x) => (typeof x === 'string' ? x : x?.wort)).filter((x) => typeof x === 'string' && x.trim())
    .map((x) => x.trim()).filter((x) => /^[A-Za-zÄÖÜäöü]+$/.test(x) && x.length <= 10 && zerlege(x).every((e) => T.frei.has(e)));
  if (!liste.length) return null;
  const wort = r.pick(liste);
  const einheiten = zerlege(wort);
  const teile = einheiten.map((e, i) => (i === 0 && /^[A-ZÄÖÜ]/.test(wort) ? gross(e) : e));
  const lex = T.wort(wort);
  const extra = stufe === 3 ? (zusatzKacheln(r, T, { laute: einheiten }, 2) || []) : [];
  if (stufe === 3 && extra.length < 2) return null;
  if (stufe === 1) {
    return A.legen({
      frage: 'Schreib dein Lernwort ab. Lege die Buchstaben der Reihe nach.',
      abschreiben: wort, kacheln: teile, loesung: teile, felder: teile.length, bild: lex?.bild,
      hinweis: 'Fang links an. Such zuerst den ersten Buchstaben, dann den nächsten.',
      erklaerung: `So schreibt man ${wort}.`,
      braucht: [...new Set(einheiten)], sig: sig(wort, 1), daten: { wort, teile },
    });
  }
  return A.legen({
    frage: 'Hör gut zu und lege dein Lernwort.',
    sprich: `Hör gut zu: … ${wort}. Lege dein Lernwort.`,
    vorlesen: wort, kacheln: [...teile, ...extra], loesung: teile, felder: teile.length, bild: lex?.bild,
    hinweis: 'Sprich das Wort langsam. Denk daran, wie du es geübt hast.',
    erklaerung: `So schreibt man ${wort}.`,
    braucht: vereint(einheiten, extra), sig: sig(wort, stufe, ...extra.sort()), daten: { wort, teile, extra },
  });
}

export const generatoren = {
  'D-SC-01': {
    // kurze Wörter mit Startpunkten und Pfeilen
    1: (r, ctx) => spuren(r, werkzeug(ctx), (w) => w.wort.length <= 4, 'pfeile'),
    // Nomen mit grossem Anfangsbuchstaben, zwei Silben
    2: (r, ctx) => spuren(r, werkzeug(ctx), (w) => w.silben.length === 2 && w.wort.length <= 6, 'pfeile'),
    // längere Wörter, nur Startpunkte
    3: (r, ctx) => spuren(r, werkzeug(ctx), (w) => w.wort.length >= 5 && w.wort.length <= 7, 'start'),
  },
  'D-SC-02': {
    1: (r, ctx) => hoerenLegen(r, werkzeug(ctx), ctx, { laute: [3, 4] }),
    2: (r, ctx) => hoerenLegen(r, werkzeug(ctx), ctx, { laute: [4, 5], zusatz: 2 }),
    3: (r, ctx) => hoerenLegen(r, werkzeug(ctx), ctx, { laute: [5, 6], silben: [2], zusatz: 3, aehnlich: true, tabelle: true }),
  },
  'D-SC-03': {
    1: (r, ctx) => abschreiben(r, werkzeug(ctx), { laute: [3, 4] }),
    2: (r, ctx) => abschreiben(r, werkzeug(ctx), { laute: [5, 6] }),
    3: (r, ctx) => abschreiben(r, werkzeug(ctx), { laute: [4, 5, 6], verdecken: true }),
  },
  'D-SC-04': {
    1: (r, ctx) => ergaenzen(r, werkzeug(ctx), 'anfang'),
    2: (r, ctx) => ergaenzen(r, werkzeug(ctx), 'ende'),
    3: (r, ctx) => ergaenzen(r, werkzeug(ctx), 'mitte'),
  },
  'D-SC-05': {
    1: (r, ctx) => satzLegen(r, ctx, 1),
    2: (r, ctx) => satzLegen(r, ctx, 2),
    3: (r, ctx) => satzLegen(r, ctx, 3),
  },
  'D-SC-06': {
    1: (r, ctx) => lernwort(r, ctx, 1),
    2: (r, ctx) => lernwort(r, ctx, 2),
    3: (r, ctx) => lernwort(r, ctx, 3),
  },
};

// --- Wörter nachspuren ---
function spuren(r, T, filter, hilfe) {
  const ziele = schreibwoerter(T).filter((w) => /^[A-Za-zÄÖÜäöü]+$/.test(w.wort) && filter(w));
  if (!ziele.length) return null;
  const w = r.pick(ziele);
  return A.nachspuren({
    frage: `Fahre das Wort ${w.wort} mit dem Finger nach.`,
    sprich: `Fahre das Wort … ${w.sprich || w.wort} … mit dem Finger nach.`,
    wort: w.wort, hilfe,
    hinweis: hilfe === 'pfeile' ? 'Fang bei jedem Buchstaben bei der 1 an und folge den Pfeilen.' : 'Fang bei jedem Buchstaben beim Startpunkt an.',
    erklaerung: `So schreibt man ${w.wort}.`,
    braucht: w.laute.map(klein), bilder: w.bild ? [w.bild] : [],
    sig: sig(w.wort, hilfe), daten: { wort: w.wort },
  });
}
