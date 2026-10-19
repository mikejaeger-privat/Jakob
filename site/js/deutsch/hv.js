// Deutsch HV: Hörverstehen. Gesprochene Anweisungen ausführen (D-HV-01) und kurze Geschichten verstehen (D-HV-02).
// Beide aus festen Inhalten (site/data/inhalte/deutsch/anweisungen.json, geschichten.json). Reine Höraufgaben: braucht [].
import { A, sig, auswahl } from './lib.js';

const fuer = (liste, id, stufe) => (liste || []).filter((x) => x.stufen?.[id] === stufe);

// Anweisung als Aufgabe. Stufe 1 und 2: die antippbaren Dinge tauschen ihre Plätze (der Auftrag nennt keine Lage).
// Stufe 3: die Szene wird zufällig gespiegelt (links und rechts kommen im Auftrag nicht vor, «neben» bleibt neben).
function anweisung(r, ctx, stufe) {
  const liste = fuer(ctx.inhalte?.anweisungen, 'D-HV-01', stufe).filter((a) => a.szene?.elemente?.length && (a.loesung?.length || a.ziehen?.length));
  if (!liste.length) return null;
  const a = r.pick(liste);
  let elemente = a.szene.elemente.map((e) => ({ ...e }));
  let orte = (a.szene.orte || []).map((o) => ({ ...o }));
  let variante;
  if (stufe < 3) {
    const beweglich = elemente.filter((e) => !e.deko);
    const plaetze = beweglich.map((e) => [e.x, e.y]);
    const folge = r.shuffle(plaetze.map((_, i) => i));
    beweglich.forEach((e, i) => { [e.x, e.y] = plaetze[folge[i]]; });
    variante = folge.join('');
  } else {
    const spiegeln = r.bool();
    if (spiegeln) {
      const sp = (x) => Math.round((1 - x) * 1000) / 1000;
      elemente = elemente.map((e) => ({ ...e, x: sp(e.x) }));
      orte = orte.map((o) => ({ ...o, x: sp(o.x) }));
    }
    variante = spiegeln ? 's' : 'n';
  }
  const szene = { art: 'frei', elemente, ...(orte.length ? { orte } : {}) };
  return A.hoerenTippen({
    frage: a.auftrag, auftrag: a.auftrag, szene,
    ...(a.ziehen ? { ziehen: a.ziehen.map((z) => ({ ...z })) } : { loesung: a.loesung.slice() }),
    braucht: [],
    hinweis: a.hinweis || 'Hör dir den Auftrag nochmals an. Was sollst du tun?',
    erklaerung: a.erklaerung || a.auftrag,
    sig: sig(a.id, variante), daten: { id: a.id },
  });
}

const HV2_HINWEIS = {
  1: 'Hör die Geschichte nochmals an. Achte darauf, wer was macht.',
  2: 'Hör die Geschichte nochmals an. Achte genau auf das, wonach gefragt wird.',
  3: 'Hör die Geschichte nochmals an. Achte auf Wörter wie zuerst, dann, zum Schluss oder darum.',
};

// Geschichte hören, Frage beantworten: Sätze und Frage mit Pausen, Antwort als Bild
function geschichte(r, ctx, stufe) {
  const liste = fuer(ctx.inhalte?.geschichten, 'D-HV-02', stufe).filter((g) => g.optionen?.length >= 2 && g.optionen[g.richtig]);
  if (!liste.length) return null;
  const g = r.pick(liste);
  const { optionen, richtig } = auswahl(r, g.optionen[g.richtig], g.optionen.filter((_, i) => i !== g.richtig), g.optionen.length);
  return A.wahlBild({
    frage: g.frage,
    sprich: ['Hör gut zu.', ...g.saetze, g.frage].join(' … '),
    optionen, richtig, braucht: [],
    hinweis: HV2_HINWEIS[stufe],
    erklaerung: g.erklaerung || g.saetze.join(' '),
    sig: g.id, daten: { id: g.id },
  });
}

export const generatoren = {
  'D-HV-01': {
    1: (r, ctx) => anweisung(r, ctx, 1),
    2: (r, ctx) => anweisung(r, ctx, 2),
    3: (r, ctx) => anweisung(r, ctx, 3),
  },
  'D-HV-02': {
    1: (r, ctx) => geschichte(r, ctx, 1),
    2: (r, ctx) => geschichte(r, ctx, 2),
    3: (r, ctx) => geschichte(r, ctx, 3),
  },
};
