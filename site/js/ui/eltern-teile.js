// Elternbereich: Heute, Stand je Fertigkeit, Schatzkarten, Etappen, Rückmeldungen, Pakete.
// Eigener Übungsmassstab, keine Beurteilung, keine Prognose, keine Prozentziele.
import { h, leere, meldung, dialog, dateiKnopf } from './dom.js';
import { Z, speichere } from '../app/zustand.js';
import { G, K, heute, freiGrund } from '../app/steuerung.js';
import { db } from '../app/db.js';
import { L } from '../app/lernen.js';
import { sprich } from '../app/sprache.js';
import { status, lies, wertJetzt } from '../core/stand.js';
import { schonDran } from '../core/plan.js';
import { abschnitte, abschnittAm, kapitelAm } from '../core/schule.js';
import { pruefePaket, wendePaketeAn, lernwoerterAusPaket, PAKET_MAX_BYTES } from '../core/paket.js';
import { datumText, tagNr } from '../core/util.js';
import { zerlege } from '../deutsch/lib.js';

export const STATUS_TEXT = { neu: 'neu', vermutet: 'vermutet', ueben: 'am Üben', fast: 'fast sicher', sicher: 'sicher' };
const ERGEBNIS = (w) => (w === 1 ? 'gelöst' : w === 0.5 ? 'mit Hinweis gelöst' : w === 'geuebt' ? 'geübt' : 'Lösung gezeigt');
const fert = (id) => G.k.fertigkeiten.get(id);
const gruppenName = (f) => (G.k[f.id[0]].gruppen.find((g) => g.id === f.gruppe) || {}).name || f.gruppe;
const B = () => G.P.beherrschung;
const traegt = (st) => st === 'fast' || st === 'sicher' || st === 'vermutet';

// --- Meldungen (Eltern melden eine Aufgabe, die nicht stimmt oder unklar ist) ---
export async function meldeAufgabe(info = {}) {
  const feld = h('textarea.feld', { rows: 4, maxlength: 600, 'aria-label': 'Was stimmt nicht?', placeholder: 'Was stimmt nicht oder ist unklar? (z. B. «Das Bild zeigt eher einen Mantel.»)' });
  const titel = info.f ? `${fert(info.f)?.kurz || info.f}, Stufe ${info.s}` : 'Rückmeldung';
  const ok = await dialog('Aufgabe melden', [h('p.leise.klein', titel + (info.frage ? `: «${info.frage}»` : '')), feld], [{ text: 'Abbrechen', wert: false }, { text: 'Speichern', wert: true, haupt: true }]);
  if (!ok || !feld.value.trim()) return false;
  Z.meldungen = [...(Z.meldungen || []), { id: `m${Date.now().toString(36)}`, tag: heute(), f: info.f || null, s: info.s || null, sig: info.sig || null, typ: info.typ || null, frage: info.frage || null, text: feld.value.trim(), erledigt: false }];
  await speichere('meldungen');
  meldung('Meldung gespeichert (unter «Rückmeldungen»).');
  return true;
}

// --- Überblick: heute, Hinweise, Schatzkarten, Etappen ---
export async function teilUeberblick(el, neu, { sicherungsBanner = null } = {}) {
  const t = heute();
  const plan = Z.tagesplan?.tag === t ? Z.tagesplan : null;
  const tag = Z.tage?.[t] || null;
  const frei = freiGrund(t);
  let antworten = [];
  try { antworten = (await db.antworten(t)).filter((a) => a.tag === t); } catch { /* ohne Liste */ }
  const naechsteFerien = K.ferien.find((f) => f.bis >= t);
  const art = plan?.art === 'entdecker' ? `Entdeckerrunde (Tag ${Math.min(3, (Z.entdecker?.tage || []).length || 1)} von ${G.P.entdeckerrunde.lernTage}): Die App schaut, was schon sitzt, und beginnt dort.`
    : plan?.art === 'schatz' ? 'Schatzkarte: gemischte Aufgaben aus allem, was schon geübt wurde (Bericht unten).' : null;
  const alleErledigt = plan && plan.steine.every((x, i) => plan.erledigt.includes(i));
  const zusatz = async () => {
    if (!await dialog('Noch eine Sitzung?', h('p', 'Das Kind kann heute nochmals üben. Der Weg beginnt neu; ein zusätzliches Teil im Sammelbild gibt es nicht.'), [{ text: 'Abbrechen', wert: false }, { text: 'Freigeben', wert: true, haupt: true }])) return;
    L.planHeute({ neu: true }); meldung('Neue Sitzung für heute freigegeben.'); neu();
  };
  const liste = antworten.length ? h('details.heute-liste', h('summary', `Aufgaben von heute (${antworten.length})`),
    h('ul.liste.klein', antworten.map((a) => h('li',
      h('span', `${fert(a.f)?.kurz || a.f}, Stufe ${a.s}: ${ERGEBNIS(a.wert)}`),
      h('button.btn.leise.klein', { type: 'button', onclick: () => meldeAufgabe(a) }, 'Melden'))))) : null;

  leere(el,
    sicherungsBanner,
    h('section.blatt', h('h2', 'Heute'),
      h('p', `${datumText(t, true)}: ${frei ? (frei === 'kein Lerntag' ? 'kein Lerntag (in den Einstellungen änderbar).' : `${frei}, nichts geplant.`) : `Lerntag, ${Z.einstellungen.minuten} Minuten.`}`),
      art ? h('p', art) : null,
      plan ? h('p.leise', `Steine: ${plan.erledigt.length} von ${plan.steine.length} erledigt.`) : null,
      tag?.n ? h('p', `Geübt: ${tag.n} Aufgaben in etwa ${Math.max(1, Math.round(tag.sek / 60))} Minuten.${tag.zeig ? (tag.zeigBestanden ? ' Eine «Zeig, was du kannst»-Runde ist gelungen.' : ' Eine «Zeig, was du kannst»-Runde gemacht; das Thema wird weiter geübt.') : ''}${tag.neuesThema ? ` Neues Thema: ${fert(tag.neuesThema)?.name || tag.neuesThema}.` : ''}`) : null,
      liste,
      alleErledigt ? h('div.knopfreihe', h('button.btn', { type: 'button', onclick: zusatz }, 'Heute nochmals eine Sitzung freigeben')) : null,
      naechsteFerien ? h('p.leise.klein', `Nächste Ferien: ${naechsteFerien.name}, ${datumText(naechsteFerien.von)} bis ${datumText(naechsteFerien.bis)}.`) : null),
    schuleJetzt(t),
    hinweiseLehrperson(t),
    schatzBerichte(),
    etappen(t),
    h('p.leise.klein', `Version ${document.documentElement.dataset.version || ''}`));
}

// Was die Lehrperson für den laufenden Abschnitt angekündigt hat (Elternbrief) und wie die App es aufnimmt
function schuleJetzt(t) {
  const a = abschnittAm(G.LM, t);
  if (!a) {
    const letzter = abschnitte(G.LM).filter((x) => x.bisT < t).at(-1);
    return letzter ? h('section.blatt', h('h2', 'In der Schule'), h('p.leise.klein', `Der letzte Elternbrief (${letzter.name}) galt bis ${datumText(letzter.bisT)}. Bis ein neuer nachgetragen ist, schätzt die App aus der Jahresplanung und dem Datum, was dran ist.`)) : null;
  }
  const kap = G.LM.faecher.M.kapitel[kapitelAm(G.LM, t)]?.name;
  const vorgabe = Number.isInteger(Z.einstellungen?.kapitel);
  return h('section.blatt', h('h2', 'In der Schule'),
    h('p', `${a.name}, ${datumText(a.vonT)} bis ${datumText(a.bisT)} (${a.quelle}):`),
    h('ul.liste.klein',
      a.D ? h('li', h('strong', 'Deutsch: '), a.D.themen.join('; ')) : null,
      a.M ? h('li', h('strong', 'Mathematik: '), a.M.themen.join('; ')) : null,
      (a.weitere || []).map((w) => h('li', h('strong', `${w.fach}: `), w.themen.join('; ')))),
    h('p.leise.klein', `Die App nimmt diese Deutsch- und Mathematik-Themen zuerst dran. Mathematik verteilt die Kapitel gleichmässig über den Abschnitt; ${vorgabe ? 'unter «Mathematik» ist ein Kapitel fest eingestellt, das geht vor' : `jetzt geschätzt: «${kap || '–'}» (unter «Mathematik» änderbar)`}.`),
    (a.weitere || []).map((w) => (w.inApp ? h('p.leise.klein', `${w.fach} in der App: ${w.inApp}`) : null)));
}

// Bleibt eine Grundfertigkeit lange schwierig, ein ruhiger Hinweis aufs Gespräch mit der Lehrperson
function hinweiseLehrperson(t) {
  const HL = G.P.hinweisLehrperson;
  const betroffen = [];
  for (const [k, e] of Object.entries(Z.stand || {})) {
    const id = k.slice(0, k.lastIndexOf('|'));
    const f = fert(id);
    if (!f || !HL.gruppen.includes(f.gruppe)) continue;
    if (e.tage >= HL.minLernTage && e.na >= HL.minAntworten && wertJetzt(e, t, B()) < HL.maxWert) betroffen.push(f.name);
  }
  if (!betroffen.length) return null;
  return h('section.blatt.hinweis-blatt', h('h2', 'Ein Hinweis'), h('p', HL.text), h('p.leise.klein', `Betrifft: ${[...new Set(betroffen)].join(', ')}.`));
}

function zaehleStatus(fach, t) {
  const z = { neu: 0, vermutet: 0, ueben: 0, fast: 0, sicher: 0 };
  for (const f of G.k[fach].fertigkeiten) if (f.kern === true) for (const s of Object.keys(f.stufen)) z[status(Z.stand, f.id, s, t, B())]++;
  return z;
}

function schatzBerichte() {
  const liste = [...(Z.schatzkarten || [])].reverse();
  if (!liste.length) return h('section.blatt', h('h2', 'Schatzkarten'), h('p.leise', 'Etwa alle sechs Schulwochen spielt das Kind eine Schatzkarte mit gemischten Aufgaben. Hier erscheint dann ein Standortbild.'));
  const name = (g) => { const f = [...G.k.fertigkeiten.values()].find((x) => x.id.startsWith(g + '-')); return f ? `${f.id[0] === 'D' ? 'Deutsch' : 'Mathematik'}: ${gruppenName(f)}` : g; };
  return h('section.blatt', h('h2', 'Schatzkarten'), h('p.massstab', 'Eigener Übungsmassstab dieser App, keine Beurteilung der Schule.'),
    liste.map((b, i) => {
      const vorher = liste[i + 1];
      const sf = (x, fach) => (x?.status?.[fach] ? x.status[fach].sicher + x.status[fach].fast : null);
      const vergleich = (fach, wort) => {
        const jetzt = sf(b, fach), alt = sf(vorher, fach);
        return `${wort}: ${jetzt} Stufen fast sicher oder sicher${alt !== null ? ` (letztes Mal ${alt})` : ''}`;
      };
      return h('div.schatz-bericht', h('h3', `Schatzkarte ${b.nr} vom ${datumText(b.tag)}`),
        h('ul.liste.klein', Object.entries(b.bereiche || {}).map(([g, x]) => h('li', `${name(g)}: ${x.erster} von ${x.n} im ersten Versuch gelöst`))),
        h('p.leise.klein', `${vergleich('D', 'Deutsch')}. ${vergleich('M', 'Mathematik')}.`));
    }));
}

// Etappen: was laut Lehrmittel bis dahin dran ist und wie der eigene Übungsstand dazu aussieht (ohne Prozentziele)
function etappen(t) {
  const kuenftig = K.etappen.filter((e) => e.tag >= t);
  if (!kuenftig.length) return null;
  const kap = G.LM.faecher.M.kapitel;
  const zeilen = kuenftig.map((e) => {
    // Was bis zur Etappe dran ist: laut Elternbrief, sonst nach Jahresplanung und Datum (ohne Vorgabe der Eltern)
    const c = { lm: G.LM, heute: e.tag, dAnteil: L.schuljahrAnteil(e.tag), mKapitel: kapitelAm(G.LM, e.tag) };
    const mIds = schonDran(c, 'M'), dIds = schonDran(c, 'D').filter((id) => fert(id)?.kern === true);
    const tr = (ids) => ids.filter((id) => fert(id) && traegt(status(Z.stand, id, Object.keys(fert(id).stufen)[0], t, B()))).length;
    const brief = abschnitte(G.LM).some((a) => a.vonT <= e.tag);
    return h('li', h('strong', `${e.name} (${datumText(e.tag)})`),
      h('div.leise.klein', `Mathematik ${brief ? 'laut Elternbrief und Jahresplanung' : 'laut Jahresplanung'} bis «${kap[c.mKapitel]?.name || '–'}»: ${mIds.length} Themen; bei ${tr(mIds)} davon gelingt die erste Stufe schon meist (fast sicher, sicher oder vermutet).`),
      h('div.leise.klein', `Deutsch ${brief ? 'laut Elternbrief und angenommener Reihenfolge' : 'nach der angenommenen Reihenfolge'}: ${dIds.length} Themen; bei ${tr(dIds)} davon gelingt die erste Stufe schon meist.`));
  });
  return h('section.blatt', h('h2', 'Etappen zur Orientierung'), h('p.leise.klein', G.Z.etappenHinweis), h('ul.liste', zeilen));
}

// --- Stand je Fertigkeit und Stufe ---
export function teilStand(el) {
  const t = heute();
  const chip = (f, s) => {
    const st = status(Z.stand, f.id, s, t, B());
    const e = lies(Z.stand, f.id, s);
    const titel = e ? `${e.na} Antworten${e.geuebt ? `, ${e.geuebt}× geübt` : ''}${e.letzter !== null ? `, zuletzt ${datumText(e.letzter)}` : ''}` : 'noch nicht geübt';
    return h('span.st-chip.st-' + st, { title: `Stufe ${s}: ${STATUS_TEXT[st]} (${titel})` }, `${s} ${STATUS_TEXT[st]}`);
  };
  const abschnitt = (fach, wort) => {
    const z = zaehleStatus(fach, t);
    const gruppen = new Map();
    for (const f of G.k[fach].fertigkeiten) {
      if (f.kern === 'eltern' && !(Z.lernwoerter || []).some((x) => !x.geloescht)) continue;
      const g = f.kern === false ? 'Erweiterungen' : gruppenName(f);
      if (!gruppen.has(g)) gruppen.set(g, []);
      gruppen.get(g).push(f);
    }
    return h('section.blatt', h('h2', wort),
      h('p.leise.klein', `Stufen: ${z.sicher} sicher, ${z.fast} fast sicher, ${z.ueben} am Üben, ${z.vermutet} vermutet, ${z.neu} neu.`),
      [...gruppen].sort(([a], [b]) => (a === 'Erweiterungen') - (b === 'Erweiterungen')).map(([g, liste]) => {
        const zz = { sicher: 0, fast: 0, ueben: 0, vermutet: 0 };
        for (const f of liste) for (const s of Object.keys(f.stufen)) { const st = status(Z.stand, f.id, s, t, B()); if (st in zz) zz[st]++; }
        const teile = Object.entries(zz).filter(([, n]) => n).map(([k, n]) => `${n} ${STATUS_TEXT[k]}`);
        return h('details.st-gruppe', h('summary', h('strong', g), h('span.leise.klein', ` ${teile.length ? teile.join(', ') : 'noch nicht geübt'}`)),
          h('ul.st-liste', liste.map((f) => h('li', h('span.st-name', f.name), h('span.st-stufen', Object.keys(f.stufen).map((s) => chip(f, s)))))));
      }));
  };
  leere(el,
    h('section.blatt', h('h2', 'Stand'), h('p.massstab', 'Eigener Übungsmassstab dieser App, keine Beurteilung der Schule.'),
      h('ul.liste.klein',
        h('li', h('strong', 'neu: '), 'noch nicht oder kaum geübt.'),
        h('li', h('strong', 'vermutet: '), 'in den ersten Tagen übersprungen, weil es schon sass; wird später bestätigt.'),
        h('li', h('strong', 'am Üben: '), 'wird geübt, gelingt noch nicht regelmässig.'),
        h('li', h('strong', 'fast sicher: '), 'gelingt meist; wartet auf eine «Zeig, was du kannst»-Runde.'),
        h('li', h('strong', 'sicher: '), 'die Runde ist gelungen. Was lange nicht geübt wird, fällt wieder auf «fast sicher» und kommt zur Wiederholung.')),
      h('p.leise.klein', 'Jede Fertigkeit hat drei Stufen (Teilschritte, keine Leistungsniveaus). Der Stand stützt sich auf wenige Aufgaben und sagt nichts über künftige Noten.')),
    abschnitt('D', 'Deutsch'), abschnitt('M', 'Mathematik'));
}

// --- Rückmeldungen ---
export function teilRueckmeldungen(el, neu) {
  const liste = [...(Z.meldungen || [])].reverse();
  const text = (m) => `${datumText(m.tag)}${m.f ? ` · ${m.f} Stufe ${m.s}` : ''}${m.frage ? ` · «${m.frage}»` : ''}: ${m.text}`;
  const kopieren = async () => {
    try { await navigator.clipboard.writeText(liste.map(text).join('\n')); meldung('Kopiert.'); } catch { meldung('Kopieren nicht möglich.', 'warn'); }
  };
  leere(el,
    h('section.blatt', h('h2', 'Rückmeldungen'),
      h('p', 'Hier sammeln sich Aufgaben, die nicht stimmen oder unklar sind. Melden lässt sich eine Aufgabe unter «Überblick › Aufgaben von heute» und beim Ausprobieren unter «Aufgaben». Das Kind meldet nichts.'),
      h('div.knopfreihe', h('button.btn', { type: 'button', onclick: async () => { if (await meldeAufgabe()) neu(); } }, 'Allgemeine Rückmeldung'),
        liste.length ? h('button.btn.leise', { type: 'button', onclick: kopieren }, 'Alle als Text kopieren') : null)),
    h('section.blatt', h('h2', liste.length ? `Meldungen (${liste.length})` : 'Meldungen'),
      liste.length ? h('ul.lw-liste', liste.map((m) => {
        const box = h('input', { type: 'checkbox', checked: !!m.erledigt, onchange: () => { m.erledigt = box.checked; speichere('meldungen'); } });
        return h('li', h('label.schalter.klein', box, h('span', h('strong', m.f ? `${fert(m.f)?.kurz || m.f}, Stufe ${m.s}` : 'Allgemein'), h('span.leise.klein', ` ${datumText(m.tag)}${m.frage ? ` · «${m.frage}»` : ''}`), h('span.block', m.text))),
          h('button.btn.leise.klein', { type: 'button', onclick: () => { Z.meldungen = Z.meldungen.filter((x) => x !== m); speichere('meldungen'); neu(); } }, 'Entfernen'));
      })) : h('p.leise', 'Noch keine Meldungen.')));
}

// --- Pakete (INHALTE.md) ---
export function paketAbschnitt(neu) {
  const pakete = Z.imports?.pakete || [];
  const waehlen = dateiKnopf('Paket wählen', async (ev) => {
    const datei = ev.target.files[0]; if (!datei) return;
    if (datei.size > PAKET_MAX_BYTES) { meldung('Diese Datei ist zu gross für ein Paket (höchstens 2 MB).', 'warn', 6000); return; }
    let obj;
    try { obj = JSON.parse(await datei.text()); } catch { meldung('Die Datei ist kein gültiges JSON.', 'warn', 6000); return; }
    const r = pruefePaket(obj, G);
    if (r.fehler.length) {
      await dialog('Paket nicht übernommen', [h('p', 'Das Paket hat Fehler (die ersten zwölf):'), h('ul.liste.klein', r.fehler.map((f) => h('li', f)))]);
      return;
    }
    const p = r.paket;
    const ersetzt = pakete.some((x) => x.id === p.id);
    const beschrieb = `${p.zaehler.lernwoerter} Lernwörter, ${p.zaehler.woerter} Bildwörter, ${p.zaehler.inhalte} Inhalte.`;
    if (!await dialog(`Paket «${p.titel}» übernehmen?`, h('p', beschrieb + (ersetzt ? ' Es ersetzt das Paket mit derselben ID.' : '')), [{ text: 'Abbrechen', wert: false }, { text: 'Übernehmen', wert: true, haupt: true }])) return;
    Z.imports = { ...(Z.imports || {}), pakete: [...pakete.filter((x) => x.id !== p.id), { ...p, importiert: heute() }] };
    if (p.lernwoerter.length) Z.lernwoerter = lernwoerterAusPaket(Z.lernwoerter || [], p, heute(), tagNr);
    wendePaketeAn(G, Z.imports.pakete);
    await speichere('imports', 'lernwoerter');
    meldung(`Paket «${p.titel}» übernommen.`); neu();
  });
  const entfernen = async (p) => {
    if (!await dialog(`Paket «${p.titel}» entfernen?`, h('p', 'Seine Wörter und Inhalte werden nicht mehr geübt. Lernwörter aus dem Paket werden aus der Liste genommen.'), [{ text: 'Abbrechen', wert: false }, { text: 'Entfernen', wert: true, gefahr: true }])) return;
    Z.imports = { ...(Z.imports || {}), pakete: pakete.filter((x) => x.id !== p.id) };
    Z.lernwoerter = (Z.lernwoerter || []).map((x) => (x.paket === p.id ? { ...x, geloescht: true } : x));
    wendePaketeAn(G, Z.imports.pakete);
    await speichere('imports', 'lernwoerter');
    meldung('Paket entfernt.'); neu();
  };
  return h('section.blatt', h('h2', 'Pakete mit eigenen Inhalten'),
    h('p', 'Ein Paket (JSON-Datei) bringt Lernwörter, zusätzliche Bildwörter oder zusätzliche Sätze und Geschichten in die App, ohne die Website zu ändern. Aufbau und Regeln in INHALTE.md im Repository. Die App prüft jedes Paket; ein fehlerhaftes wird nicht übernommen.'),
    h('div.knopfreihe', waehlen),
    pakete.length ? h('ul.lw-liste', pakete.map((p) => h('li', h('strong', p.titel), h('span.leise.klein', ` ${p.zaehler?.lernwoerter || 0} Lernwörter, ${p.zaehler?.woerter || 0} Bildwörter, ${p.zaehler?.inhalte || 0} Inhalte, übernommen am ${datumText(p.importiert)}`),
      h('button.btn.leise.klein', { type: 'button', onclick: () => entfernen(p) }, 'Entfernen')))) : h('p.leise.klein', 'Noch keine Pakete.'));
}

// Lernwort vorsprechen (so, wie die Stimme es dem Kind sagt)
export const vorsprechen = (wort) => sprich(wort);
export const lernwortFrei = (wort) => zerlege(wort).every((e) => Z.buchstaben?.frei?.[e]);
