// Tagesplan: Aufwärmen (Karteikasten), Deutsch, Mathematik (das Kind wählt die Reihenfolge), Schlussstein.
// Reine Funktion; die App liefert Zustand, Kalenderwerte und «spielbar». Erklärung in KONZEPT.md, Abschnitt 6.
// Der Plan ist eine Warteschlange je Stein; wie viele Aufgaben wirklich drankommen, entscheidet die Zeit beim Spielen.
import { lies, status, istSicher, traegt, faellig, wertJetzt, zeigBereit } from './stand.js';
import { kartenHeute } from './kasten.js';
import { deutschJetzt, deutschBegonnen } from './schule.js';

const STUFEN = (f) => Object.keys(f.stufen).map(Number).sort((a, b) => a - b);
const hatAntworten = (stand, f) => STUFEN(f).some((s) => { const e = lies(stand, f.id, s); return e && (e.na > 0 || e.geuebt > 0 || e.vermutet); });

// Zeitbudget der Steine in Sekunden
export function budgets(minuten, gewichtung, P) {
  const total = minuten * 60;
  const B = P.sitzung.bausteine;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const aufwaermen = Math.round(clamp(total * 0.15, B.aufwaermen.minSek, B.aufwaermen.maxSek));
  const schluss = Math.round(clamp(total * 0.125, B.schluss.minSek, B.schluss.maxSek));
  const rest = Math.max(0, total - aufwaermen - schluss);
  const gD = gewichtung.D / (gewichtung.D + gewichtung.M);
  const D = Math.round(rest * gD), M = rest - D;
  const zwei = Math.min(D, M) >= Math.min(B.deutsch.minSek, B.mathe.minSek);
  return { total, aufwaermen, schluss, D, M, zwei, einzel: rest };
}

// Welche Fertigkeiten sind laut Lehrmittel gerade dran (Mathematik: Kapitel; Deutsch: Reihenfolge)?
export function aktuelleListe(c, fach) {
  const { k, lm, stand, heute, P } = c;
  const B = P.beherrschung;
  if (fach === 'M') {
    const kap = lm.faecher.M.kapitel;
    const i = Math.max(0, Math.min(kap.length - 1, c.mKapitel));
    const ids = [...kap[i].fertigkeiten];
    // Ist das aktuelle Kapitel schon gut geübt, kommt das nächste dazu
    const fertig = ids.every((id) => { const f = k.fertigkeiten.get(id); return !f || traegt(status(stand, id, 1, heute, B)); });
    if (fertig && kap[i + 1]) ids.push(...kap[i + 1].fertigkeiten);
    return [...new Set(ids)];
  }
  // Deutsch: die ersten Themen der Reihenfolge, deren erste Stufe noch nicht trägt und die jetzt spielbar sind
  return reihenfolgeD(c).filter((id) => {
    const f = k.fertigkeiten.get(id);
    return f && f.kern !== 'eltern' && !traegt(status(stand, id, STUFEN(f)[0], heute, B)) && stufeZumUeben(c, f) !== null;
  }).slice(0, P.plan.quoten.aktuell);
}
// Deutsch-Reihenfolge der Klasse 1, ab dem zweiten Halbjahr mit den Themen von 1.5;
// was die Lehrperson für den laufenden Abschnitt nennt (Elternbrief), kommt zuerst
const reihenfolgeBasis = (c) => { const R = c.lm.faecher.D.reihenfolge; return [...R['1'], ...(c.dAnteil >= 0.45 ? R['1.5'] : [])]; };
export function reihenfolgeD(c) {
  const schule = c.heute === undefined ? [] : deutschJetzt(c.lm, c.heute);
  return [...new Set([...schule, ...reihenfolgeBasis(c)])];
}
// Was laut Schule oder Lehrmittel schon dran war (für Entdeckerrunde, «Lücken» und neue Themen)
export function schonDran(c, fach) {
  if (fach === 'M') {
    const kap = c.lm.faecher.M.kapitel;
    return [...new Set(kap.slice(0, Math.max(0, c.mKapitel) + 1).flatMap((x) => x.fertigkeiten))];
  }
  const nachZeit = reihenfolgeBasis(c).slice(0, Math.max(c.dMin ?? 8, Math.round(c.dAnteil * c.lm.faecher.D.reihenfolge['1'].length) + 2));
  const schule = c.heute === undefined ? [] : deutschBegonnen(c.lm, c.heute);
  // Laufender Abschnitt zuerst (in seiner Reihenfolge), dann frühere Abschnitte und die Schätzung aus dem Schuljahr
  const jetzt = c.heute === undefined ? [] : deutschJetzt(c.lm, c.heute);
  return [...new Set([...jetzt, ...schule, ...nachZeit])];
}

// Voraussetzungen einer Stufe erfüllt? Liefert die fehlende Voraussetzung oder null
function fehlendeVoraussetzung(c, f, s) {
  const { k, stand, heute, P } = c;
  const B = P.beherrschung;
  const vor = s === 1 ? (f.vor || []) : (f.stufen[s].vor || []);
  for (const id of vor) {
    const g = k.fertigkeiten.get(id);
    if (!g || g.kern === 'eltern') continue;
    if (!traegt(status(stand, id, 1, heute, B))) return g;
  }
  return null;
}

// Tiefste Stufe, die noch nicht sicher ist und gespielt werden kann
export function stufeZumUeben(c, f) {
  const { stand, heute, P } = c;
  const B = P.beherrschung;
  const st = STUFEN(f);
  for (const s of st) {
    if (istSicher(stand, f.id, s, heute, B, st.at(-1))) continue;
    if (status(stand, f.id, s, heute, B) === 'vermutet') continue; // in der Entdeckerrunde übersprungen
    if (!c.spielbar(f, String(s))) return null;
    if (s > st[0]) { const v = status(stand, f.id, s - 1, heute, B); if (!traegt(v)) return null; }
    return s;
  }
  return null;
}

// Höchste schon geübte Stufe (für Wiederholung und Schatzkarte)
function hoechsteGeuebte(c, f) {
  const st = STUFEN(f);
  for (let i = st.length - 1; i >= 0; i--) { const e = lies(c.stand, f.id, st[i]); if (e && (e.na > 0 || e.vermutet)) return st[i]; }
  return null;
}

function kernListe(c, fach) {
  return c.k[fach].fertigkeiten.filter((f) => f.kern === true && (f.klasse === 1 || (f.klasse === 1.5 && c.dAnteil >= 0.45)));
}

// Warteschlange eines Fachs
export function schlange(c, fach, ctxTag) {
  const { k, stand, heute, P } = c;
  const B = P.beherrschung;
  const aus = [];
  const belegt = new Set();
  const nimm = (f, s, n, grund, extra = {}) => {
    if (!f || belegt.has(f.id) || s === null || s === undefined) return false;
    if (!c.spielbar(f, String(s))) return false;
    belegt.add(f.id); aus.push({ f: f.id, s: String(s), n, grund, ...extra }); return true;
  };
  // Neues Thema: noch nie geübt und laut Lehrmittel noch nicht dran (was die Klasse schon hatte, ist nicht neu)
  const dran = new Set(schonDran(c, fach));
  const neuesThema = (f, s) => s === STUFEN(f)[0] && !hatAntworten(stand, f) && !dran.has(f.id);
  const versuche = (f, grund, n) => {
    const s = stufeZumUeben(c, f);
    if (s === null) return false;
    const fehlt = fehlendeVoraussetzung(c, f, s);
    if (fehlt) { const sv = stufeZumUeben(c, fehlt); if (sv !== null && !(neuesThema(fehlt, sv) && ctxTag.neuesThema)) { if (neuesThema(fehlt, sv)) ctxTag.neuesThema = fehlt.id; return nimm(fehlt, sv, n, 'luecke'); } return false; }
    if (neuesThema(f, s)) { if (ctxTag.neuesThema) return false; if (nimm(f, s, n, grund, { neu: true })) { ctxTag.neuesThema = f.id; return true; } return false; }
    return nimm(f, s, n, grund);
  };

  const Q = P.plan.quoten, N = P.plan.aufgabenJeEintrag;
  // Kandidaten je Grund sammeln, dann abwechselnd einreihen (die Zeit des Steins entscheidet, wie weit es reicht)
  const wieder = faellige(c, fach);
  // Weiterkommen: angefangene Stufen (am Üben), nächste Stufen und fast sichere, abwechselnd
  const imGang = [], naechste = [], fast = [];
  for (const f of kernListe(c, fach)) {
    if (!hatAntworten(stand, f)) continue;
    const s = stufeZumUeben(c, f);
    if (s === null) continue;
    const e = lies(stand, f.id, s);
    const st = status(stand, f.id, s, heute, B);
    if (!e || st === 'neu') naechste.push(f);
    else if (st === 'ueben') imGang.push(f);
    else fast.push(f);
  }
  const weiter = [];
  for (let i = 0; i < Math.max(imGang.length, naechste.length); i++) { if (imGang[i]) weiter.push(imGang[i]); if (naechste[i]) weiter.push(naechste[i]); }
  weiter.push(...fast);
  const luecken = kernListe(c, fach).filter((f) => dran.has(f.id) && !hatAntworten(stand, f));

  const zaehl = {};
  // bei mehr als 10 Minuten entsprechend mehr Einträge, damit die Zeit auch für ein schnelles Kind reicht
  const faktor = Math.max(1, (c.minuten || 10) / 10);
  const quote = (grund) => (zaehl[grund] || 0) < Math.round((Q[grund] ?? 1) * faktor);
  const plus = (grund) => { zaehl[grund] = (zaehl[grund] || 0) + 1; };
  const nimmGrund = (liste, grund, mitVersuch = true) => {
    while (liste.length && quote(grund)) {
      const x = liste.shift();
      const ok = mitVersuch ? versuche(x.f || x, grund, N[grund]) : nimm(x.f, x.s, N[grund], grund);
      if (ok) { plus(grund); return true; }
    }
    return false;
  };

  // Zeig-was-du-kannst-Runde (höchstens eine pro Tag, über beide Fächer)
  if (ctxTag.zeig && ctxTag.zeig.fach === fach) nimm(k.fertigkeiten.get(ctxTag.zeig.f), ctxTag.zeig.s, P.zeigRunde.aufgaben, 'zeig', { zeig: true });
  // Leichter Einstieg mit einer fälligen Wiederholung
  if (!aus.length) nimmGrund(wieder, 'wiederholung', false);
  // Lernwörter vor dem Wörtertest
  if (fach === 'D' && c.lernwoerterBald) {
    const f = k.fertigkeiten.get('D-SC-06');
    if (f) nimm(f, c.lernwoerterStufe || 1, N.lernwoerter, 'lernwoerter');
  }
  // Abwechselnd: aktueller Stoff, Weiterkommen, Lücken, Wiederholung, Stufen kurz vor der Zeig-Runde
  const aktuell = aktuelleListe(c, fach).map((id) => k.fertigkeiten.get(id)).filter(Boolean);
  const wartend = kernListe(c, fach).map((f) => ({ f, s: stufeZumUeben(c, f) })).filter((x) => x.s !== null && wertJetzt(lies(stand, x.f.id, x.s), heute, B) >= B.schwelleZeigBereit);
  for (let runde = 0; runde < Math.ceil(4 * faktor); runde++) {
    nimmGrund(aktuell, 'aktuell');
    nimmGrund(weiter, 'weiter');
    nimmGrund(wieder, 'wiederholung', false);
    if (runde === 0) nimmGrund(luecken, 'luecke');
  }
  nimmGrund(wartend, 'zeigWartend', false);
  // Notfalls: der Anfang der Reihenfolge (ganz zu Beginn)
  if (!aus.length) for (const f of kernListe(c, fach)) { if (versuche(f, 'start', 2) && aus.length >= 2) break; }
  return aus;
}

// Fällige Wiederholungen (Merkdauer abgelaufen), die dringendsten zuerst; nur die höchste geübte Stufe einer Fertigkeit
export function faellige(c, fach) {
  const aus = [];
  for (const f of c.k[fach].fertigkeiten) {
    if (f.kern === 'eltern') continue;
    const s = hoechsteGeuebte(c, f);
    if (s === null) continue;
    const e = lies(c.stand, f.id, s);
    if (e && e.na > 0 && faellig(e, c.heute)) aus.push({ f, s, druck: (c.heute - e.letzter) / e.merk });
  }
  return aus.sort((a, b) => b.druck - a.druck);
}

// Leichte Aufgaben (für Aufwärmen ohne Karten, Schlussstein und die Erfolgsaufgabe); fällige zuerst
export function leichte(c, fach = null, { typen = null, n = 6 } = {}) {
  const { stand, heute, P } = c;
  const B = P.beherrschung;
  const aus = [];
  for (const [kk, e] of Object.entries(stand)) {
    const i = kk.lastIndexOf('|');
    const id = kk.slice(0, i), s = kk.slice(i + 1);
    const f = c.k.fertigkeiten.get(id);
    if (!f || f.kern === 'eltern' || (fach && id[0] !== fach)) continue;
    if (typen && !f.typen.some((t) => typen.includes(t))) continue;
    if (!c.spielbar(f, s)) continue;
    const w = e.na > 0 ? wertJetzt(e, heute, B) : 0;
    if (w >= P.sitzung.schlussMinWert || (e.geuebt >= 2 && e.na === 0)) aus.push({ f: id, s, w, faellig: faellig(e, heute) ? 1 : 0 });
  }
  aus.sort((a, b) => b.faellig - a.faellig || b.w - a.w);
  return c.rng.shuffle(aus.slice(0, n * 2)).slice(0, n).map(({ f, s }) => ({ f, s }));
}

const SCHLUSS_TYPEN = ['nachspuren', 'muster', 'zaehlen', 'menge-legen', 'zuordnen'];

export function tagesplan(c) {
  const { heute, P, rng } = c;
  const KK = P.karteikasten;
  const bud = budgets(c.minuten, c.gewichtung, P);
  const ctxTag = { neuesThema: c.neuesThemaHeute || null, zeig: null };
  const art = c.entdecker ? 'entdecker' : c.schatzFaellig ? 'schatz' : 'normal';

  // Aufwärmen: abwechselnd Deutsch und Mathematik
  const wechsel = KK.aufwaermenWechsel;
  const awFach = wechsel[c.lerntagNr % wechsel.length] === 'deutsch' ? 'D' : 'M';
  const karten = kartenHeute(c.kasten, c.kartenKandidaten[awFach] || [], heute, KK,
    { neuHeute: c.neuHeute || 0, neuMax: c.entdecker ? KK.kartenImAufwaermen : KK.neueProTag });
  const aw = karten.map((id) => ({ ...c.kartenZiel(id), karte: id, n: 1, grund: 'karte' })).filter((x) => x.f);
  // wenige Karten: fällige Wiederholungen dieses Fachs, dann leichte Aufgaben
  if (aw.length < 3) for (const x of faellige(c, awFach).filter((x) => c.spielbar(x.f, String(x.s))).slice(0, 3 - aw.length)) aw.push({ f: x.f.id, s: String(x.s), n: 1, grund: 'wiederholung' });
  if (aw.length < 3) for (const x of leichte(c, awFach, { n: 3 - aw.length })) aw.push({ ...x, n: 1, grund: 'leicht' });
  if (aw.length < 2) for (const x of c.startLeicht?.[awFach] || []) aw.push({ ...x, n: 1, grund: 'start' });
  const steine = [{ art: 'aufwaermen', fach: awFach, sek: bud.aufwaermen, eintraege: aw, entdecker: !!c.entdecker }];

  // Zeig-Runde: die Stufe mit dem höchsten Wert, die bereit ist
  if (art === 'normal' && (c.zeigHeute || 0) < P.zeigRunde.maxProTag) {
    let best = null;
    for (const [kk, e] of Object.entries(c.stand)) {
      const i = kk.lastIndexOf('|');
      const id = kk.slice(0, i), s = kk.slice(i + 1);
      const f = c.k.fertigkeiten.get(id);
      if (!f || f.kern === 'eltern' || !c.spielbar(f, s) || !zeigBereit(e, heute, P.beherrschung, P.zeigRunde)) continue;
      const w = wertJetzt(e, heute, P.beherrschung);
      if (!best || w > best.w) best = { f: id, s, w, fach: id[0] };
    }
    if (best) ctxTag.zeig = best;
  }

  if (art === 'schatz') {
    steine.push({ art: 'schatz', sek: bud.D + bud.M, eintraege: schatzAuswahl(c) });
  } else {
    const faecher = bud.zwei ? (c.lerntagNr % 2 ? ['M', 'D'] : ['D', 'M']) : [c.einzelFach || (c.lerntagNr % 2 ? 'M' : 'D')];
    const haupt = {};
    for (const fach of faecher) {
      let eintraege = schlange(c, fach, ctxTag);
      if (art === 'entdecker') { const pr = probeSchlange(c, fach); const ids = new Set(pr.map((e) => e.f)); eintraege = [...pr, ...eintraege.filter((e) => !ids.has(e.f))]; }
      haupt[fach] = { art: fach === 'D' ? 'deutsch' : 'mathe', fach, sek: bud.zwei ? bud[fach] : bud.einzel, eintraege };
    }
    for (const fach of ['D', 'M']) if (haupt[fach]) steine.push(haupt[fach]);
  }

  // Schlussstein: etwas Sicheres und Ruhiges
  let sl = leichte(c, null, { typen: SCHLUSS_TYPEN, n: 2 }).map((x) => ({ ...x, n: 2, grund: 'schluss' }));
  if (!sl.length) sl = rng.shuffle(c.startLeicht?.schluss || []).slice(0, 2).map((x) => ({ ...x, n: 2, grund: 'schluss' }));
  steine.push({ art: 'schluss', sek: bud.schluss, eintraege: sl });

  return {
    tag: heute, art, steine, erledigt: [], zeig: ctxTag.zeig ? { f: ctxTag.zeig.f, s: ctxTag.zeig.s } : null,
    neuesThema: ctxTag.neuesThema && ctxTag.neuesThema !== c.neuesThemaHeute ? ctxTag.neuesThema : null,
  };
}

// Entdeckerrunde: Fertigkeiten, die laut Lehrmittel schon dran waren, ab Stufe 1 antippen; zwei richtig → eine Stufe höher
export function probeSchlange(c, fach) {
  const proben = c.entdecker?.proben || {};
  const aus = [];
  for (const id of schonDran(c, fach)) {
    const f = c.k.fertigkeiten.get(id);
    if (!f || f.kern !== true) continue;
    const p = proben[id];
    if (p?.fertig) continue;
    const s = p ? String(p.s) : String(STUFEN(f)[0]);
    if (!c.spielbar(f, s)) continue;
    aus.push({ f: id, s, n: 2, grund: 'entdecker', probe: true });
  }
  return aus;
}

// Schatzkarte: 10 bis 12 gemischte Aufgaben aus allem, was schon geübt wurde, verteilt über die Bereiche
export function schatzAuswahl(c) {
  const { P, rng } = c;
  const SK = P.schatzkarte;
  const ziel = rng.int(SK.aufgabenMin, SK.aufgabenMax);
  const nD = Math.round(ziel * c.gewichtung.D / (c.gewichtung.D + c.gewichtung.M));
  const aus = [];
  for (const [fach, n] of [['D', nD], ['M', ziel - nD]]) {
    const proGruppe = new Map();
    for (const f of c.k[fach].fertigkeiten) {
      if (f.kern === 'eltern') continue;
      const s = hoechsteGeuebte(c, f);
      if (s === null || !c.spielbar(f, String(s))) continue;
      if (!proGruppe.has(f.gruppe)) proGruppe.set(f.gruppe, []);
      proGruppe.get(f.gruppe).push({ f: f.id, s: String(s), n: 1, grund: 'schatz', gruppe: f.gruppe });
    }
    const gruppen = [...proGruppe.values()].map((l) => rng.shuffle(l));
    const teil = [];
    for (let runde = 0; teil.length < n && gruppen.some((g) => g.length > runde); runde++) for (const g of gruppen) if (g[runde] && teil.length < n) teil.push(g[runde]);
    aus.push(...teil);
  }
  return rng.shuffle(aus);
}
