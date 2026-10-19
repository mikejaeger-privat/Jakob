// Prüft das Wortlexikon site/data/woerter.json und seinen Bezug zum Buchstabenplan.
// Aufruf: node tools/pruefe_woerter.mjs [--bilanz]
import { readFileSync } from 'node:fs';
import { pruefeWort, VERBINDUNGEN, OBER } from '../site/js/core/woerter-pruefen.js';

const lies = (p) => JSON.parse(readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const lex = lies('site/data/woerter.json');
const plan = lies('site/data/buchstaben.json');
const bilanz = process.argv.includes('--bilanz');

const fehler = [];
const warnungen = [];
const F = (m) => fehler.push(m);
const W = (m) => warnungen.push(m);

const text = readFileSync(new URL('../site/data/woerter.json', import.meta.url), 'utf8');
if (text.includes('ß')) F('Das Lexikon enthält «ß» (Schweizer Rechtschreibung: ss).');

const planIds = new Set(plan.liste.map((b) => b.id));
const ids = new Set(), worte = new Set(), bilder = new Map();
for (const w of lex.woerter) {
  const wo = `${w.id} (${w.wort})`;
  if (ids.has(w.id)) F(`${wo}: ID doppelt`);
  ids.add(w.id);
  for (const m of pruefeWort(w, { merkstellen: lex.merkstellen, planIds, worte, bilder })) F(m);
  worte.add(w.wort);
  bilder.set(w.bild, w.wort);
  if (w.art && !lex.woerter.some((x) => x.wort === w.art)) W(`${wo}: Unterbegriff «${w.art}» ist kein Wort im Lexikon`);
  if (w.bildMehrere && w.mehrzahl === null) W(`${wo}: bildMehrere ohne Mehrzahl`);
}

const reime = {};
for (const w of lex.woerter) if (w.reim) (reime[w.reim] ||= []).push(w.wort);
for (const [r, l] of Object.entries(reime)) if (l.length < 2) W(`Reimgruppe «${r}» hat nur ${l.join(', ')}`);

for (const [a, b] of lex.verwechselbar) for (const x of [a, b]) if (!worte.has(x)) F(`verwechselbar: «${x}» nicht im Lexikon`);
const paare = new Set(lex.verwechselbar.map(([a, b]) => [a, b].sort().join('|')));
if (paare.size !== lex.verwechselbar.length) W('verwechselbar: Paar doppelt');
const klaenge = new Set(lex.woerter.flatMap((w) => [w.anlaut, w.endlaut]).filter(Boolean));
const gueltigeKlaenge = new Set([...planIds, 'ə', 'kw']);
for (const [a, b] of lex.klangNieZusammen) for (const x of [a, b]) if (!gueltigeKlaenge.has(x)) F(`klangNieZusammen: Klang «${x}» unbekannt`);
for (const k of klaenge) if (!gueltigeKlaenge.has(k)) F(`Klang «${k}» (anlaut/endlaut) unbekannt`);
for (const [ober, liste] of Object.entries(lex.oberKonflikt)) {
  if (!OBER.has(ober)) F(`oberKonflikt: Oberbegriff «${ober}» unbekannt`);
  for (const x of liste) if (!worte.has(x)) F(`oberKonflikt ${ober}: «${x}» nicht im Lexikon`);
}

const sicht = new Set();
for (const s of lex.sichtwoerter) {
  if (sicht.has(s.wort)) F(`Sichtwort «${s.wort}» doppelt`);
  sicht.add(s.wort);
  if (![1, 2, 3].includes(s.gruppe)) F(`Sichtwort «${s.wort}»: Gruppe ${s.gruppe}`);
  for (const x of s.braucht) if (!planIds.has(x)) F(`Sichtwort «${s.wort}»: «${x}» fehlt im Buchstabenplan`);
}

const pid = new Set();
for (const b of plan.liste) {
  if (pid.has(b.id)) F(`Buchstabenplan: «${b.id}» doppelt`);
  pid.add(b.id);
  const w = lex.woerter.find((x) => x.wort === b.wort);
  if (!w) { F(`Buchstabenplan «${b.id}»: Anlautwort «${b.wort}» fehlt im Lexikon`); continue; }
  const form = b.form === 'mehrzahl' ? w.mehrzahl : w.wort;
  if (!form || !form.toLowerCase().includes(b.id)) F(`Buchstabenplan «${b.id}»: «${form}» enthält «${b.id}» nicht`);
  if (b.stelle === 'anfang' && !form.toLowerCase().startsWith(b.id)) F(`Buchstabenplan «${b.id}»: «${form}» beginnt nicht mit «${b.id}»`);
  for (const x of [...b.aehnlichForm, ...b.aehnlichLaut, ...b.nieZusammen]) if (!plan.liste.some((y) => y.id === x)) F(`Buchstabenplan «${b.id}»: Bezug «${x}» unbekannt`);
  for (const x of b.nieZusammen) if (!plan.liste.find((y) => y.id === x)?.nieZusammen.includes(b.id)) F(`Buchstabenplan: nieZusammen ${b.id}–${x} nicht gegenseitig`);
  for (const x of b.aehnlichLaut) if (b.nieZusammen.includes(x)) F(`Buchstabenplan «${b.id}»: «${x}» zugleich ähnlich und nieZusammen`);
}

// Reimgruppen: keine Komposita, die das andere Wort enthalten (Fledermaus/Maus)
const silbenVon = new Map(lex.woerter.map((w) => [w.wort, w.silben.map((s) => s.toLowerCase())]));
for (const [r, l] of Object.entries(reime)) for (const a of l) for (const b of l) {
  const sa = silbenVon.get(a), sb = silbenVon.get(b);
  if (a !== b && sa.length > sb.length && sa.slice(-sb.length).join('|') === sb.join('|')) F(`Reimgruppe «${r}»: «${a}» enthält das Wort «${b}»`);
}

if (bilanz) {
  const L = lex.woerter;
  const zaehle = (f) => { const m = {}; for (const w of L) { const k = f(w); m[k] = (m[k] || 0) + 1; } return m; };
  const ohneVerb = (w) => !w.braucht.some((x) => VERBINDUNGEN.has(x));
  console.log(`Wörter: ${L.length}, lautgetreu: ${L.filter((w) => w.lautgetreu).length}, lautgetreu ohne Verbindung: ${L.filter((w) => w.lautgetreu && ohneVerb(w)).length}`);
  console.log('Silben:', zaehle((w) => w.silben.length));
  console.log('Oberbegriffe:', zaehle((w) => w.ober));
  console.log('Anlaute:', zaehle((w) => w.anlaut));
  console.log('Endlaute:', zaehle((w) => w.endlaut));
  console.log(`Reimgruppen: ${Object.keys(reime).length}`, Object.fromEntries(Object.entries(reime).map(([k, v]) => [k, v.length])));
  console.log(`Lautzählbar: ${L.filter((w) => w.lautzaehlbar).length}, Silben sprechbar: ${L.filter((w) => w.silbenSprechbar).length}, Name unsicher: ${L.filter((w) => w.nameUnsicher).length}, Sichtwörter: ${lex.sichtwoerter.length}, verwechselbare Paare: ${lex.verwechselbar.length}`);
}

for (const w of warnungen) console.log('Warnung:', w);
for (const f of fehler) console.log('Fehler:', f);
console.log(fehler.length ? `${fehler.length} Fehler` : `Wortlexikon in Ordnung (${lex.woerter.length} Wörter, ${warnungen.length} Warnungen).`);
process.exit(fehler.length ? 1 : 0);
