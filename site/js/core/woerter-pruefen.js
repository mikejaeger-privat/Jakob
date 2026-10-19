// Regeln für ein Bildwort des Lexikons (gemeinsam für tools/pruefe_woerter.mjs und den Paket-Import im Elternbereich).
export const VERBINDUNGEN = new Set(['sch', 'ch', 'ei', 'au', 'eu', 'äu', 'ie', 'st', 'sp', 'pf', 'ck', 'tz', 'qu', 'ng', 'nk']);
const DOPPEL = new Set(['ll', 'mm', 'nn', 'ss', 'tt', 'ff', 'pp', 'rr', 'bb', 'dd', 'gg', 'kk', 'zz']);
const DEHNUNG = new Set(['ah', 'eh', 'oh', 'uh', 'äh', 'öh', 'üh']);
const DOPPELVOKAL = new Set(['aa', 'ee', 'oo']);
export const OBER = new Set(['Tiere', 'Obst', 'Gemüse', 'Essen', 'Kleider', 'Körper', 'Fahrzeuge', 'Pflanzen', 'Natur', 'Spielsachen', 'Musik', 'Werkzeug', 'Haushalt', 'Schule', 'Gebäude', 'Personen', 'Formen', 'Fantasie', 'Dinge']);
export const MAX_EMOJI = 13;
const emoji = (t) => typeof t === 'string' && /\p{Extended_Pictographic}/u.test(t);

// Buchstaben und Verbindungen, die ein Wort braucht (aus seinen Lauteinheiten)
export function brauchtAusLauten(laute, fehler = () => {}) {
  const b = [];
  for (const l of laute) {
    const u = String(l).toLowerCase();
    let teile;
    if (VERBINDUNGEN.has(u)) teile = [u];
    else if (u === 'chs') teile = ['ch', 's'];
    else if (u === 'ai') teile = ['a', 'i'];
    else if (DOPPEL.has(u) || DOPPELVOKAL.has(u)) teile = [u[0]];
    else if (DEHNUNG.has(u)) teile = [u[0], 'h'];
    else if ([...u].length === 1) teile = [u];
    else { fehler(`unbekannte Lauteinheit «${l}»`); teile = []; }
    for (const t of teile) if (!b.includes(t)) b.push(t);
  }
  return b;
}

// Prüft ein Wort. kontext: { merkstellen, planIds: Set, worte: Set (schon vergeben), bilder: Map (Bild → Wort) }
export function pruefeWort(w, kontext) {
  const fehler = [];
  const F = (m) => fehler.push(m);
  if (!w || typeof w !== 'object') return ['kein Wort-Objekt'];
  const wo = `${w.id || '?'} (${w.wort || '?'})`;
  for (const k of ['id', 'wort', 'artikel', 'bild', 'ober']) if (typeof w[k] !== 'string' || !w[k]) F(`${wo}: «${k}» fehlt`);
  for (const k of ['silben', 'laute', 'merk', 'braucht']) if (!Array.isArray(w[k])) F(`${wo}: «${k}» muss eine Liste sein`);
  if (fehler.length) return fehler;
  if (/ß/.test(JSON.stringify(w))) F(`${wo}: «ß» (Schweizer Rechtschreibung: ss)`);
  if (kontext.worte?.has(w.wort)) F(`${wo}: Wort schon vorhanden`);
  if (kontext.bilder?.has(w.bild)) F(`${wo}: Bild ${w.bild} schon bei ${kontext.bilder.get(w.bild)}`);
  if (!emoji(w.bild)) F(`${wo}: Bild ist kein Emoji`);
  if (!['der', 'die', 'das'].includes(w.artikel)) F(`${wo}: Artikel «${w.artikel}»`);
  if (w.silben.join('') !== w.wort) F(`${wo}: Silben ergeben nicht das Wort`);
  if (w.laute.join('') !== w.wort) F(`${wo}: Laute ergeben nicht das Wort`);
  if (w.silben.some((s) => !s)) F(`${wo}: leere Silbe`);
  if (!OBER.has(w.ober)) F(`${wo}: Oberbegriff «${w.ober}» unbekannt`);
  if (w.mehrzahl !== null && typeof w.mehrzahl !== 'string') F(`${wo}: mehrzahl muss Text oder null sein`);
  for (const m of w.merk) if (!(m in (kontext.merkstellen || {}))) F(`${wo}: Merkstelle «${m}» unbekannt`);
  if (w.lautgetreu !== (w.merk.length === 0)) F(`${wo}: lautgetreu passt nicht zu merk`);
  const b = brauchtAusLauten(w.laute, (m) => F(`${wo}: ${m}`));
  if (JSON.stringify(b) !== JSON.stringify(w.braucht)) F(`${wo}: braucht ${JSON.stringify(w.braucht)}, berechnet ${JSON.stringify(b)}`);
  for (const x of w.braucht) if (kontext.planIds && !kontext.planIds.has(x)) F(`${wo}: «${x}» fehlt im Buchstabenplan`);
  if (w.ev && w.ev > MAX_EMOJI) F(`${wo}: Emoji-Version ${w.ev} zu neu (höchstens ${MAX_EMOJI})`);
  if (w.anlaut === null || w.anlaut === undefined) F(`${wo}: anlaut fehlt`);
  if (w.lautzaehlbar && (w.laute.length < 2 || w.laute.length > 6)) F(`${wo}: lautzaehlbar mit ${w.laute.length} Lauten`);
  const sprechbar = !w.silben.some((s, i) => i > 0 && /^[^aeiouäöüy]*e[lnrm]?$/.test(s.toLowerCase()));
  if (w.silbenSprechbar !== sprechbar) F(`${wo}: silbenSprechbar sollte ${sprechbar} sein`);
  for (const k of ['nameUnsicher', 'bildMehrere', 'oberUnsicher', 'silbenUnsicher']) if (k in w && w[k] !== true) F(`${wo}: ${k} nur true oder weglassen`);
  if ('sprich' in w && (typeof w.sprich !== 'string' || !w.sprich)) F(`${wo}: sprich leer`);
  return fehler;
}
