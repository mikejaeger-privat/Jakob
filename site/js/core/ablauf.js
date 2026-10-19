// Ablauf eines Steins (ohne Browser): Aufgaben aus der Warteschlange, solange die Zeit des Steins reicht.
// Zeig-was-du-kannst-Runde ohne Hilfe, Entdeckerrunde (zwei richtig → eine Stufe höher), Rückstufung nach zwei nicht
// gelösten Aufgaben, Schatzkarte, und zum Schluss eine leichte Aufgabe, falls die letzte nicht gelang.
// Die Oberfläche (ui/sitzung.js) und die Simulation (tools/sim/lauf.mjs) liefern nur das Spielen einer Aufgabe und die Szenen.
//   io = { ctx(fach) → Generator-Kontext, spiele(a, { modus, fortschritt }) → { wert, versuche, hilfe, ms, abbruch? },
//          szene(name) → Promise, protokoll(eintrag), seed() → Zahl }
import { erzeuge as erzeugeM } from '../math/index.js';
import { erzeuge as erzeugeD } from '../deutsch/index.js';
import { leichte } from './plan.js';

const gelungen = (w) => w === 1 || w === 0.5 || w === 'geuebt';

// Übt die Aufgabe wirklich die Karte? (sonst würde das Ergebnis der falschen Karte gutgeschrieben)
export function passtZurKarte(a, karte, lernwort) {
  const d = a.daten || {}, ziel = karte.slice(2);
  switch (karte[0]) {
    case 'b': return d.buchstabe === ziel;
    case 'v': return d.verbindung === ziel;
    case 's': return d.wort === ziel;
    case 'l': return !!lernwort && d.wort === lernwort;
    case 'r': return d.karte === ziel;
    default: return false;
  }
}

// Aufgabe zu einem Planeintrag erzeugen, möglichst keine kürzlich gesehene
export async function aufgabeFuer(W, L, io, e, s, vermeiden = []) {
  const f = W.G.k.fertigkeiten.get(e.f);
  if (!f || !f.stufen[s]) return null;
  const istM = e.f.startsWith('M-');
  let ctx = io.ctx(istM ? 'M' : 'D');
  const lw = e.karte ? L.lernwortVon(e.karte) : null;
  if (e.karte) ctx = { ...ctx, karte: e.karte.slice(2), ...(lw ? { lernwoerter: [lw] } : {}) };
  const gesehen = new Set([...(W.Z.gesehen?.[`${e.f}|${s}`] || []), ...vermeiden]);
  let ersatz = null;
  for (let v = 0; v < 8; v++) {
    const a = await (istM ? erzeugeM : erzeugeD)(f, s, io.seed(), ctx);
    if (!a) continue;
    if (e.karte && !passtZurKarte(a, e.karte, lw)) continue;
    if (!gesehen.has(a.sig)) return a;
    ersatz = ersatz || a;
  }
  return ersatz;
}

// Spielt Stein i des Plans. Liefert { fertig, abbruch, ergebnisse, stern, bericht }
export async function spieleStein(W, L, io, plan, i) {
  const st = plan.steine[i];
  const t = W.heute();
  const total = W.Z.einstellungen.minuten * 60;
  const schlussOffen = plan.steine.findIndex((x, j) => x.art === 'schluss' && j !== i && !plan.erledigt.includes(j));
  const reserve = schlussOffen >= 0 ? plan.steine[schlussOffen].sek : 0;
  const lauf = st.lauf || (st.lauf = { pos: 0, im: 0, sek: 0, n: 0 });
  const vermeiden = [];
  const ergebnisse = [];
  let stern = null;
  const geplant = st.eintraege.reduce((x, e) => x + e.n, 0);
  let von = st.art === 'schatz' ? geplant : Math.max(1, Math.min(geplant, Math.round(st.sek / 25)));

  if (lauf.n === 0 && st.art === 'schatz') await io.szene('schatzStart');
  while (lauf.pos < st.eintraege.length) {
    const e = st.eintraege[lauf.pos];
    e.erg = e.erg || [];
    const soll = e.n + (e.zeig && L.zeigZusatz(e.erg) ? 1 : 0);
    if (lauf.im >= soll) { stern = abschluss(L, st, lauf.pos, e) ?? stern; lauf.pos++; lauf.im = 0; continue; }
    const s = e.leichter || e.s;
    const a = await aufgabeFuer(W, L, io, e, s, vermeiden);
    if (!a) { lauf.pos++; lauf.im = 0; continue; }
    if (e.karte) a.karte = e.karte;
    const est = L.geschaetzteSekunden(a);
    const mitten = (e.zeig || e.probe) && lauf.im > 0;                 // eine Zeig-Runde oder Probe nicht abbrechen
    const zeitStein = lauf.n > 0 && lauf.sek + est > st.sek * 1.1;
    // nach der eingestellten Zeit keine neue Aufgabe; der Schlussstein ist reserviert (seine erste Aufgabe kommt immer)
    const zeitGesamt = lauf.n > 0 && L.sitzungSekunden(t) + est > total - (st.art === 'schluss' ? 0 : reserve);
    if ((zeitStein || zeitGesamt) && !mitten) break;
    if (e.zeig && lauf.im === 0) await io.szene('zeigStart');
    von = Math.max(von, lauf.n + 1);
    const r = await io.spiele(a, { modus: e.zeig ? 'zeig' : 'normal', fortschritt: { jetzt: lauf.n, von } });
    if (r.abbruch) { W.speichere('tagesplan'); return { abbruch: true, ergebnisse }; }
    vermeiden.push(a.sig);
    L.verbucheAntwort(e, a, r, { entdecker: plan.art === 'entdecker' });
    io.protokoll({ t, fach: a.fach, f: a.f, s: a.s, wert: r.wert, versuche: r.versuche, hilfe: r.hilfe, ms: r.ms, typ: a.typ, sig: a.sig, grund: e.grund, karte: e.karte || null });
    e.erg.push({ wert: r.wert });
    ergebnisse.push(r);
    lauf.im++; lauf.n++; lauf.sek += Math.min(180, r.ms / 1000) + 2;
    // Zwei nicht gelöste in Folge: in dieser Sitzung eine Stufe leichter weiter
    if (!e.zeig && !e.probe && !e.karte && r.wert === 0 && e.erg.length >= 2 && e.erg.at(-2).wert === 0) {
      const f = W.G.k.fertigkeiten.get(e.f);
      const tiefer = String(Number(s) - 1);
      if (f.stufen[tiefer] && W.spielbar(f, tiefer)) e.leichter = tiefer;
      else lauf.im = e.n; // keine leichtere Stufe: zum nächsten Eintrag
    }
    W.speichere('tagesplan');
  }
  // Probe oder Zeig-Runde, deren Aufgaben alle gespielt sind, noch auswerten
  if (lauf.pos < st.eintraege.length) {
    const e = st.eintraege[lauf.pos];
    if (e.erg?.length && lauf.im >= e.n) stern = abschluss(L, st, lauf.pos, e) ?? stern;
  }
  // Endet die Sitzung mit einer nicht gelösten Aufgabe, folgt genau eine leichte
  const letzterStein = plan.steine.every((x, j) => j === i || plan.erledigt.includes(j));
  if (letzterStein && ergebnisse.length && !gelungen(ergebnisse.at(-1).wert)) {
    const r = await erfolgsAufgabe(W, L, io, vermeiden);
    if (r && !r.abbruch) ergebnisse.push({ ...r, erfolg: true });
  }
  let bericht = null;
  if (st.art === 'schatz') {
    const gespielt = st.eintraege.filter((e) => e.erg?.length);
    bericht = L.schatzBericht(gespielt, gespielt.map((e) => e.erg[0]));
    await io.szene('schatzEnde');
  }
  W.speichere('tagesplan');
  return { fertig: true, ergebnisse, stern, bericht };
}

// Eintrag abschliessen: Zeig-Runde auswerten, Probe der Entdeckerrunde (bei Erfolg die nächste Stufe einreihen)
function abschluss(L, st, pos, e) {
  if (e.fertig) return null;
  e.fertig = true;
  if (e.zeig) return L.zeigFertig(e.f, e.s, e.erg) ? 'bestanden' : 'geuebt';
  if (e.probe) {
    const weiter = L.probeFertig(e.f, e.s, e.erg);
    if (weiter && !weiter.fertig) st.eintraege.splice(pos + 1, 0, { f: e.f, s: String(weiter.s), n: 2, grund: 'entdecker', probe: true });
  }
  return null;
}

const SCHNELL = ['wahl-bild', 'wahl-wort', 'zahl', 'zaehlen', 'muster', 'bild-wort', 'wahl-hoeren'];
async function erfolgsAufgabe(W, L, io, vermeiden) {
  const c = L.kontextPlan(W.heute(), { seed: io.seed() });
  const kandidaten = [...leichte(c, null, { typen: SCHNELL, n: 3 }), ...(c.startLeicht.M || [])];
  for (const x of kandidaten) {
    const a = await aufgabeFuer(W, L, io, { f: x.f, s: x.s }, x.s, vermeiden);
    if (!a || L.geschaetzteSekunden(a) > W.G.P.lernzeit.erfolgsaufgabeMaxSek) continue;
    const r = await io.spiele(a, {});
    if (!r.abbruch) {
      L.verbucheAntwort({ f: x.f, s: x.s }, a, r);
      io.protokoll({ t: W.heute(), fach: a.fach, f: a.f, s: a.s, wert: r.wert, versuche: r.versuche, hilfe: r.hilfe, ms: r.ms, typ: a.typ, sig: a.sig, grund: 'erfolg' });
    }
    return r;
  }
  return null;
}
