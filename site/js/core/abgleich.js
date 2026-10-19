// Reine Regeln für den Abgleich zwischen Geräten (ohne Browser, darum testbar). Übernommen aus der Lernplattform.
//
// Haben zwei Geräte seit dem letzten Abgleich denselben Bereich geändert, wird zusammengeführt, wo das sinnvoll ist:
// Lernstand, Karteikasten, gesehene Aufgaben, Messungen und Übungstage Eintrag für Eintrag (der weiter geübte gewinnt),
// Lernwörter, Meldungen und Schatzkarten als Vereinigung, im Sammelbild gehen keine Teile verloren.
// Bei den übrigen Bereichen (Einstellungen, Tagesplan …) gilt die neuere Änderung.

export const SAMMLUNGEN = new Set(['stand', 'kasten', 'gesehen', 'messung', 'tage']);
const istObjekt = (x) => x && typeof x === 'object' && !Array.isArray(x);
const klon = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));

// Ein Eintrag im Lernstand trägt die Zahl seiner Antworten (na): mehr Antworten = weiter geübt
function mischeEintrag(a, b, bGewinnt) {
  if (istObjekt(a) && istObjekt(b)) {
    if (typeof a.na === 'number' && typeof b.na === 'number') return a.na === b.na ? (bGewinnt ? b : a) : (b.na > a.na ? b : a);
    const r = { ...a };
    for (const [k, v] of Object.entries(b)) r[k] = k in a ? mischeEintrag(a[k], v, bGewinnt) : v;
    return r;
  }
  return bGewinnt ? b : a;
}
function mischeSammlung(lokal, fern, fernGewinnt) {
  const r = { ...lokal };
  for (const [k, v] of Object.entries(fern)) r[k] = k in lokal ? mischeEintrag(lokal[k], v, fernGewinnt) : v;
  return r;
}
// Listen ohne Verlust: Einträge beider Seiten, gleiche Einträge einmal
function vereinige(lokal, fern, schluessel, fernGewinnt) {
  const map = new Map();
  for (const x of lokal) map.set(schluessel(x), x);
  for (const x of fern) { const k = schluessel(x); if (!map.has(k) || fernGewinnt) map.set(k, x); }
  return [...map.values()];
}
const ohne = (x, felder) => { const r = { ...x }; for (const f of felder) delete r[f]; return JSON.stringify(r); };
// Sammelbild: Teile und fertige Bilder beider Seiten behalten
function mischeSammelbild(lokal, fern, fernGewinnt) {
  const neu = fernGewinnt ? { ...lokal, ...fern } : { ...fern, ...lokal };
  neu.teile = vereinige(lokal.teile || [], fern.teile || [], (t) => t.id, fernGewinnt);
  neu.album = vereinige(lokal.album || [], fern.album || [], (a) => a.id, fernGewinnt);
  return neu;
}
const MISCHEN = {
  lernwoerter: (l, f, g) => (Array.isArray(l) && Array.isArray(f) ? vereinige(l, f, (x) => x.id || JSON.stringify(x), g) : null),
  schatzkarten: (l, f, g) => (Array.isArray(l) && Array.isArray(f) ? vereinige(l, f, (x) => x.id || JSON.stringify(x), g).sort((a, b) => (a.tag ?? 0) - (b.tag ?? 0)) : null),
  meldungen: (l, f, g) => (Array.isArray(l) && Array.isArray(f)
    ? vereinige(l, f, (x) => ohne(x, ['erledigt']), g).map((x) => ({ ...x, erledigt: [...l, ...f].some((y) => ohne(y, ['erledigt']) === ohne(x, ['erledigt']) && y.erledigt) })) : null),
  sammelbild: (l, f, g) => (istObjekt(l) && istObjekt(f) ? mischeSammelbild(l, f, g) : null),
};
for (const k of SAMMLUNGEN) MISCHEN[k] = (l, f, g) => (istObjekt(l) && istObjekt(f) ? mischeSammlung(l, f, g) : null);

// Z: App-Zustand, S: Abgleich-Verwaltung, fern: { k: { wert, ts, seq } } vom Server (neuere Fassungen anderer Geräte
// oder die aktuelle Fassung, wenn unser Schreiben abgelehnt wurde). Ändert Z und S.
// «nochmal»: es gibt lokal noch etwas hochzuladen (Zusammengeführtes oder lokal Neueres).
export function wendeAn(Z, S, fern) {
  const geaendert = [];
  let nochmal = false;
  S.basis = S.basis || {};
  for (const [k, { wert, ts, seq }] of Object.entries(fern || {})) {
    if (Number.isSafeInteger(seq)) S.basis[k] = seq;   // diese Fassung kennen wir jetzt
    const lokalTs = S.ts[k] || 0;
    const offen = S.offen.includes(k);
    let neu = wert;
    if (offen) {
      const gemischt = MISCHEN[k] ? MISCHEN[k](klon(Z[k]), wert, ts > lokalTs) : null;
      if (gemischt) {
        neu = gemischt;
        S.ts[k] = Math.max(ts, lokalTs) + 1;
        nochmal = true;
      } else if (ts > lokalTs) {
        S.ts[k] = ts;
        S.offen = S.offen.filter((x) => x !== k);   // fern ist neuer: lokale Änderung verworfen
      } else { nochmal = true; continue; }          // lokal ist neuer: bleibt und geht mit der neuen Basis wieder hoch
    } else S.ts[k] = ts;
    if (k === 'profil') neu = istObjekt(neu) ? { ...neu, name: Z.profil?.name || '' } : neu;   // Name bleibt auf dem Gerät
    Z[k] = neu;
    geaendert.push(k);
  }
  return { geaendert, nochmal };
}

// Was hochgeht: der Name des Kindes nie
export function zumVersand(k, wert) {
  if (k === 'profil' && istObjekt(wert)) { const { name, ...rest } = wert; void name; return rest; }
  return wert;
}

// Antworten ohne ID: ID aus dem Inhalt, damit dieselbe Antwort überall gleich heisst
function streuwert(text) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) { const c = text.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 + c, 2246822519) >>> 0; }
  return h1.toString(36) + h2.toString(36);
}
export function fuerVersand(a) {
  const { nr, id, fern, ...e } = a;
  void nr; void fern;
  return { id: id || `alt:${e.tag}:${streuwert(JSON.stringify(e))}`, tag: Number.isSafeInteger(e.tag) ? e.tag : 0, e };
}
export function vomServer(x) { return { ...x.e, id: x.id, fern: 1 }; }

// Nach dem Hochladen: angenommene Schlüssel sind erledigt, sofern sie sich seither nicht wieder geändert haben
export function nachVersand(S, gesendet, angenommen = {}) {
  S.basis = S.basis || {};
  for (const [k, seq] of Object.entries(angenommen)) S.basis[k] = seq;
  S.offen = S.offen.filter((k) => !(k in angenommen) || S.ts[k] !== gesendet[k]);
}
