// Spielt jede Mathematik-Stufe im Browser durch (Elternbereich › Aufgaben ansehen): je drei Aufgaben, richtig gelöst
// über echte Klicks, bei jeder fünften Stufe zuerst eine falsche Antwort. Prüft das Ergebnis jeder Aufgabe und meldet
// Konsolenfehler. Optional ein Foto der ersten Aufgabe jeder Stufe.
// Aufruf: node tools/server.mjs 8765 &  node tools/aufgaben-browser.mjs [--fotos ordner] [--nur M-RE] [--geraet ipad|iphone] [--dunkel] [--laut]
import fs from 'node:fs';
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { loeseAufgabe } from './bot-loesen.mjs';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const FOTOS = opt('--fotos');
const NUR = opt('--nur');
const GERAET = opt('--geraet') || 'ipad';
const BASIS = 'http://localhost:8765/';
const katalog = JSON.parse(fs.readFileSync('site/data/katalog/mathe.json', 'utf8'));
if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });

const browser = await chromium.launch();
const viewport = GERAET === 'iphone' ? { width: 390, height: 844 } : { width: 1180, height: 820 };
const ctx = await browser.newContext({ viewport, hasTouch: false, reducedMotion: 'reduce', colorScheme: args.includes('--dunkel') ? 'dark' : 'light' });
const page = await ctx.newPage();
page.setDefaultTimeout(6000);
const fehler = [];
page.on('console', (m) => { if (m.type() === 'error') fehler.push('Konsole: ' + m.text()); });
page.on('pageerror', (e) => fehler.push('Seitenfehler: ' + e.message));

// Einrichtung ohne PIN, Zahlenraum 100
await page.goto(BASIS + '?heute=2026-10-20');
await page.waitForSelector('.einrichtung');
await page.click('text=Einrichten');
await page.fill('input[aria-label="Vorname des Kindes"]', 'Testkind');
await page.click('text=Weiter');
await page.fill('input[aria-label="PIN"]', '1234'); await page.fill('input[aria-label="PIN wiederholen"]', '1234');
await page.click('text=PIN speichern');
await page.waitForSelector('.stimmtest');
await page.click('.knopfreihe >> text=Weiter');
await page.click('text=Zum Kinderbereich');
await page.waitForSelector('.k-start');
await page.evaluate(async () => { const z = await import('/js/app/zustand.js'); z.Z.einstellungen.zahlenraum = 100; z.Z.einfuehrung.gesehen = true; await z.speichere('einstellungen', 'einfuehrung'); });
await page.evaluate(() => { location.hash = '#/eltern'; });
await page.fill('input[aria-label="PIN"]', '1234'); await page.click('text=Öffnen');
await page.waitForSelector('.eltern-nav');

const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
const loese = (a, falsch) => loeseAufgabe(page, a, falsch);

let stufen = 0, aufgaben = 0;
const probleme = [];
const meldeProblem = probleme.push.bind(probleme);
probleme.push = (...x) => { if (args.includes('--laut')) x.forEach((p) => console.log('PROBLEM:', p)); return meldeProblem(...x); };
const t0 = Date.now();
for (const f of katalog.fertigkeiten) {
  if (NUR && !f.id.startsWith(NUR)) continue;
  for (const s of Object.keys(f.stufen)) {
    stufen++;
    const nr0 = await page.evaluate(() => { window.__ergebnisse = []; return window.__aufgabeNr || 0; });
    await page.evaluate(([id, st]) => { location.hash = `#/vorschau/${id}/${st}`; }, [f.id, s]);
    for (let j = 0; j < 3; j++) {
      try {
        await page.waitForFunction((n) => (window.__aufgabeNr || 0) >= n && document.querySelector('.k-aufgabe .buehne'), nr0 + j + 1, { timeout: 8000 });
      } catch { probleme.push(`${f.id}/${s}: Aufgabe ${j + 1} erscheint nicht`); break; }
      await warte(120);
      const a = await page.evaluate(() => window.__aufgabe);
      if (FOTOS && j === 0) await page.screenshot({ path: `${FOTOS}/${f.id}-${s}.png` });
      const falsch = j === 0 && stufen % 5 === 0;
      let erwartet;
      try { erwartet = await loese(a, falsch); }
      catch (e) { probleme.push(`${f.id}/${s} [${a.typ}]: ${e.message.split('\n')[0]}`); await page.click('.kk-haus').catch(() => {}); break; }
      try { await page.waitForFunction((n) => (window.__ergebnisse || []).length >= n, j + 1, { timeout: 8000 }); }
      catch { probleme.push(`${f.id}/${s} [${a.typ}]: kein Ergebnis nach der Antwort (${JSON.stringify(a.loesung ?? a.richtig ?? '')})`); await page.screenshot({ path: `/tmp/claude-0/-home-claude/9fd7e20f-87be-5455-b73c-ef3120dabe74/scratchpad/haengt-${f.id}-${s}.png` }); await page.click('.kk-haus').catch(() => {}); break; }
      const r = await page.evaluate((n) => window.__ergebnisse[n], j);
      aufgaben++;
      if (r.wert !== erwartet) probleme.push(`${f.id}/${s} [${a.typ}]: Ergebnis ${r.wert}, erwartet ${erwartet} (${a.zeige || a.frage})`);
    }
    await page.waitForFunction(() => location.hash.startsWith('#/eltern'), null, { timeout: 8000 }).catch(() => page.evaluate(() => { location.hash = '#/eltern/aufgaben'; }));
    if (args.includes('--laut')) console.log(`${f.id}/${s} fertig, ${probleme.length} Probleme, ${Math.round((Date.now() - t0) / 1000)} s`);
  }
}
await browser.close();
for (const p of probleme) console.log('PROBLEM:', p);
for (const e of [...new Set(fehler)]) console.log('FEHLER:', e);
console.log(`${stufen} Stufen, ${aufgaben} Aufgaben gelöst, ${probleme.length} Probleme, ${fehler.length} Konsolenfehler, ${Math.round((Date.now() - t0) / 1000)} s.`);
process.exit(probleme.length || fehler.length ? 1 : 0);
