// Bot: spielt ganze Lerntage im Kinderbereich (Weg, Steine, Szenen, Schlusskarte), wie ein Kind, das meist richtig antwortet,
// und schaut danach in den Elternbereich. Prüft: keine Konsolenfehler, nichts ragt über den Bildschirmrand, jeder Tag endet
// mit der Schlusskarte, der Plan wechselt von der Entdeckerrunde zum normalen Tag.
// Aufruf: node tools/server.mjs 8765 &  node tools/bot.mjs [--geraet ipad|iphone] [--dunkel] [--tage 2026-10-19,2026-10-20,…] [--falsch 0.2] [--fotos ordner]
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import { loeseAufgabe } from './bot-loesen.mjs';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const GERAET = opt('--geraet', 'ipad');
const TAGE = opt('--tage', '2026-10-19,2026-10-20,2026-10-21,2026-10-22,2026-10-23').split(',');
const FALSCH = Number(opt('--falsch', 0.15));
const FOTOS = opt('--fotos');
const BASIS = 'http://localhost:8765/';
if (FOTOS) fs.mkdirSync(FOTOS, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: GERAET === 'iphone' ? { width: 390, height: 844 } : { width: 1180, height: 820 }, hasTouch: true, reducedMotion: 'reduce', colorScheme: args.includes('--dunkel') ? 'dark' : 'light' });
const page = await ctx.newPage();
page.setDefaultTimeout(10000);
const fehler = [], probleme = [];
page.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
page.on('pageerror', (e) => fehler.push(e.message));
const foto = (n) => (FOTOS ? page.screenshot({ path: `${FOTOS}/${GERAET}-${n}.png` }) : null);
let zufall = 7;
const rnd = () => { zufall = (zufall * 16807) % 2147483647; return zufall / 2147483647; };
const randPruefen = async (wo) => {
  const raus = await page.evaluate(() => [...document.querySelectorAll('.kind-oben > *, .kind-unten > *, .buehne button, .buehne [role="button"], .stein')]
    .filter((el) => el.offsetParent !== null && !el.classList.contains('versteckt')).map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && (r.right > innerWidth + 2 || r.left < -2)).length);
  if (raus) probleme.push(`${wo}: ${raus} Elemente ragen über den Bildschirmrand`);
};

// Einrichtung
await page.goto(`${BASIS}?heute=${TAGE[0]}`);
await page.click('text=Einrichten');
await page.fill('input[aria-label="Vorname des Kindes"]', 'Testkind'); await page.click('text=Weiter');
await page.fill('input[aria-label="PIN"]', '1234'); await page.fill('input[aria-label="PIN wiederholen"]', '1234'); await page.click('text=PIN speichern');
await page.click('.knopfreihe >> text=Weiter'); await page.click('text=Zum Kinderbereich');
await page.click('.k-start');
for (const sel of ['.k-hoeren', '.k-hilfe', '.k-haken', '.k-weiter']) { await page.waitForSelector(sel + '.leuchtet'); await page.click(sel); }
await page.click('.bildkarte >> nth=1');
await page.waitForSelector('.k-weg');

const arten = [];
for (const [ti, tag] of TAGE.entries()) {
  if (ti > 0) { await page.goto(`${BASIS}?heute=${tag}#/`); await page.click('.k-start'); await page.waitForSelector('.k-weg, .k-frei'); }
  if (await page.$('.k-frei')) { await page.click('.k-start'); await page.waitForSelector('.k-weg'); }
  const plan = await page.evaluate(async () => (await import('/js/app/zustand.js')).Z.tagesplan);
  arten.push(plan.art);
  await randPruefen(`${tag} Weg`); await foto(`${tag}-weg`);
  let schritte = 0, aufgaben = 0, schluss = false;
  while (schritte++ < 400) {
    const wo = await page.evaluate(() => (document.querySelector('.k-schluss') ? 'schluss' : document.querySelector('.k-szene') ? 'szene' : document.querySelector('.k-aufgabe') ? 'aufgabe' : document.querySelector('.k-weg') ? 'weg' : 'anders'));
    if (wo === 'schluss') { schluss = true; await page.waitForTimeout(900); await foto(`${tag}-schluss`); break; }
    if (wo === 'szene') { await page.click('.kind-unten .k-start'); continue; }
    if (wo === 'weg') { const s = await page.$('.stein.jetzt'); if (!s) break; await s.click(); await page.waitForTimeout(150); continue; }
    if (wo === 'aufgabe') {
      const n = await page.evaluate(() => window.__aufgabeNr);
      const a = await page.evaluate(() => window.__aufgabe);
      if (aufgaben++ < 3) await randPruefen(`${tag} ${a.f}/${a.s} [${a.typ}]`);
      const zeig = !(await page.$('.k-hilfe'));   // Zeig-Runde: kein Hilfe-Knopf, kein zweiter Versuch
      try { await loeseAufgabe(page, a, !zeig && rnd() < FALSCH); } catch (e) { probleme.push(`${tag} ${a.f}/${a.s} [${a.typ}]: ${e.message.split('\n')[0]}`); await randPruefen(`${tag} ${a.f}/${a.s}`); break; }
      await page.waitForFunction((k) => (window.__aufgabeNr || 0) > k || !document.querySelector('.k-aufgabe'), n, { timeout: 12000 }).catch(() => probleme.push(`${tag} ${a.f}/${a.s}: hängt nach der Antwort`));
      continue;
    }
    await page.waitForTimeout(200);
  }
  if (!schluss) probleme.push(`${tag}: keine Schlusskarte`);
  console.log(`${tag}: ${plan.art}, ${aufgaben} Aufgaben, ${schluss ? 'Schlusskarte' : 'ohne Schlusskarte'}`);
}
if (TAGE.length >= 4 && !(arten[0] === 'entdecker' && arten.includes('normal'))) probleme.push(`Planarten ${arten.join(', ')}: erwartet Entdeckerrunde, dann normale Tage`);

// Elternbereich nach den Lerntagen
await page.evaluate(() => { location.hash = '#/eltern'; });
await page.fill('input[aria-label="PIN"]', '1234'); await page.click('text=Öffnen');
await page.waitForSelector('.eltern-nav');
for (const t of ['ueberblick', 'stand', 'buchstaben', 'mathematik', 'lernwoerter', 'aufgaben', 'rueckmeldungen', 'einstellungen', 'daten', 'grenzen']) {
  await page.click(`.eltern-nav a[href="#/eltern/${t}"]`); await page.waitForTimeout(250);
  const breit = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
  if (breit) probleme.push(`Elternbereich ${t}: breiter als der Bildschirm`);
  if (FOTOS) await page.screenshot({ path: `${FOTOS}/${GERAET}-eltern-${t}.png`, fullPage: true });
}
await browser.close();
for (const p of probleme) console.log('PROBLEM:', p);
for (const e of [...new Set(fehler)]) console.log('FEHLER:', e);
console.log(`${TAGE.length} Lerntage, ${probleme.length} Probleme, ${fehler.length} Konsolenfehler.`);
process.exit(probleme.length || fehler.length ? 1 : 0);
