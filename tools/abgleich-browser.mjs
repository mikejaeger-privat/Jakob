// Browser-Test des Abgleichs mit zwei (drei) getrennten Geräten gegen den lokalen Server (übernommen aus der Lernplattform).
// Aufruf: node tools/abgleich-browser.mjs   (startet selbst: node tools/server.mjs 8767 --abgleich <tmp>.sqlite)
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const PORT = 8767, URL_ = `http://localhost:${PORT}/?heute=2026-10-20`;
const datei = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'abgleich-')), 'test.sqlite');
const server = spawn(process.execPath, ['tools/server.mjs', String(PORT), '--abgleich', datei], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((ok) => server.stdout.on('data', (d) => { if (String(d).includes('http://')) ok(); }));

const fehler = [], gesendet = [];
const pruefe = (ok, text) => { console.log(`${ok ? 'ok  ' : 'FEHLER'} ${text}`); if (!ok) fehler.push(text); };
const browser = await chromium.launch();
async function geraet(name) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, locale: 'de-CH' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => fehler.push(`[${name}] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) fehler.push(`[${name}] ${m.text()}`); });
  page.on('request', (r) => { if (r.url().includes('/api/')) gesendet.push(r.postData() || ''); });
  return page;
}
// Zugriff auf die laufenden Module der App (gleiche URL = gleiche Instanz)
const app = (page, fn, arg) => page.evaluate(async ([f, a]) => {
  const z = await import('/js/app/zustand.js'), ab = await import('/js/app/abgleich.js'), d = await import('/js/app/db.js');
  return new Function('z', 'ab', 'd', 'a', `return (async () => { ${f} })()`)(z, ab, d, a);
}, [fn, arg]);
const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
async function einrichten(page, name) {
  await page.goto(URL_);
  await page.click('text=Einrichten');
  await page.fill('input[aria-label="Vorname des Kindes"]', name); await page.click('text=Weiter');
  await page.fill('input[aria-label="PIN"]', '1234'); await page.fill('input[aria-label="PIN wiederholen"]', '1234'); await page.click('text=PIN speichern');
  await page.click('.knopfreihe >> text=Weiter'); await page.click('text=Zum Kinderbereich');
  await page.waitForSelector('.k-start');
}

try {
  // Gerät A: neu einrichten, etwas üben (Zustand direkt gesetzt), abgleichen
  const A = await geraet('A');
  await einrichten(A, 'Mia');
  await app(A, `z.Z.einstellungen.minuten = 12; z.Z.stand['M-ZA-01|1'] = { na: 5, sw: 4, sg: 6 }; z.Z.kasten['b:a'] = { fach: 2, n: 1, faellig: 20750 };
    z.Z.sammelbild.teile.push({ id: 'tA', art: 'normal', tag: 20746, nr: 0 }); z.speichere('einstellungen', 'stand', 'kasten', 'sammelbild');
    await z.protokolliere({ tag: 20746, f: 'M-ZA-01', s: 1, wert: 1 }); await ab.gleicheAb();`);
  const stA = await app(A, 'return { zustand: ab.status.zustand, wer: ab.status.wer, offen: z.S.offen.length }');
  pruefe(stA.zustand === 'aktiv' && stA.wer === 'test@localhost' && stA.offen === 0, `A gleicht ab: ${JSON.stringify(stA)}`);

  // Server: Name darf nirgends stehen
  const sql = new DatabaseSync(datei);
  const roh = sql.prepare('SELECT group_concat(wert) AS w FROM lp_daten').get().w || '';
  pruefe(roh.length > 100 && !roh.includes('Mia'), 'Der Name liegt nicht auf dem Server');

  // Gerät B: holt den Stand, fragt nur nach dem Namen
  const B = await geraet('B');
  await B.goto(URL_);
  await B.waitForSelector('text=Willkommen zurück', { timeout: 12000 });
  pruefe(true, 'B erkennt den vorhandenen Stand und fragt nur nach dem Namen');
  await B.fill('input[aria-label="Vorname des Kindes"]', 'Mia B'); await B.click('text=Weiter');
  await B.waitForSelector('.k-start');
  const stB = await app(B, `return { min: z.Z.einstellungen.minuten, name: z.Z.profil.name, antworten: (await d.db.antworten()).length, stand: !!z.Z.stand['M-ZA-01|1'] }`);
  pruefe(stB.min === 12 && stB.name === 'Mia B' && stB.antworten === 1 && stB.stand, `B hat Einstellungen, Stand und Antworten von A: ${JSON.stringify(stB)}`);

  // Beide üben verschiedenes, ohne zwischendurch abzugleichen: alles bleibt (Stand, Karteikasten, Sammelbild, Lernwörter, Antworten)
  await app(A, `z.Z.stand['D-BU-01|1'] = { na: 3, sw: 2, sg: 5 }; z.Z.kasten['b:m'] = { fach: 1, n: 1 }; z.Z.sammelbild.teile.push({ id: 'tA2', art: 'normal', tag: 20747, nr: 1 });
    z.Z.lernwoerter.push({ id: 'lwA', wort: 'Sonne', test: null, angelegt: 20747 }); z.speichere('stand', 'kasten', 'sammelbild', 'lernwoerter');`);
  await app(B, `z.Z.stand['M-ZA-01|1'] = { na: 9, sw: 8, sg: 10 }; z.Z.kasten['b:a'] = { fach: 3, n: 2, faellig: 20760 }; z.Z.sammelbild.teile.push({ id: 'tB', art: 'besonders', tag: 20747, nr: 1 });
    z.Z.lernwoerter.push({ id: 'lwB', wort: 'Mama', test: null, angelegt: 20747 }); z.speichere('stand', 'kasten', 'sammelbild', 'lernwoerter');
    await z.protokolliere({ tag: 20747, f: 'D-BU-01', s: 1, wert: 0.5 });`);
  await app(A, 'await ab.gleicheAb();'); await app(B, 'await ab.gleicheAb();'); await app(A, 'await ab.gleicheAb();');
  const blick = `return { za: z.Z.stand['M-ZA-01|1']?.na, bu: !!z.Z.stand['D-BU-01|1'], ka: z.Z.kasten['b:a']?.fach, km: !!z.Z.kasten['b:m'],
    teile: z.Z.sammelbild.teile.map((t) => t.id).sort().join(','), lw: z.Z.lernwoerter.map((x) => x.wort).sort().join(','), n: (await d.db.antworten()).length }`;
  const sa = await app(A, blick), sb = await app(B, blick);
  const erwartet = { za: 9, bu: true, ka: 3, km: true, teile: 'tA,tA2,tB', lw: 'Mama,Sonne', n: 2 };
  pruefe(JSON.stringify(sa) === JSON.stringify(erwartet), `A zusammengeführt: ${JSON.stringify(sa)}`);
  pruefe(JSON.stringify(sb) === JSON.stringify(erwartet), `B zusammengeführt: ${JSON.stringify(sb)}`);
  pruefe(await app(A, 'return z.Z.profil.name') === 'Mia', 'Name auf A unverändert');

  // Ansicht frischt sich nach einer Änderung auf B auf
  await app(B, `z.Z.einstellungen.minuten = 8; z.speichere('einstellungen'); await ab.gleicheAb();`);
  await A.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await warte(1500);
  pruefe(await app(A, 'return z.Z.einstellungen.minuten') === 8, 'A übernimmt beim Zurückkehren die Änderung von B');

  // Elternbereich zeigt den Abgleich
  await A.goto(URL_ + '#/eltern/daten');
  await A.fill('input[aria-label="PIN"]', '1234'); await A.click('text=Öffnen');
  await A.waitForSelector('.eltern-nav'); await A.waitForTimeout(400);
  pruefe(await A.isVisible('text=Abgleich zwischen Geräten'), 'Elternbereich zeigt «Abgleich zwischen Geräten»');
  pruefe(await A.isVisible('text=Angemeldet als test@localhost'), 'Elternbereich zeigt die Anmeldung');

  // Neues Gerät C ohne Verbindung legt ein Profil an; danach darf es den Familienstand nicht überschreiben
  const C = await geraet('C');
  await C.route('**/api/**', (r) => r.abort());
  await einrichten(C, 'Mia C');
  await C.unroute('**/api/**');
  await app(C, 'await ab.gleicheAb();');
  const sc = await app(C, `return { min: z.Z.einstellungen.minuten, za: z.Z.stand['M-ZA-01|1']?.na, name: z.Z.profil.name, n: (await d.db.antworten()).length }`);
  const srv = JSON.parse(sql.prepare("SELECT wert FROM lp_daten WHERE k = 'einstellungen'").get().wert);
  pruefe(sc.min === 8 && srv.minuten === 8 && sc.za === 9 && sc.name === 'Mia C' && sc.n === 2, `Offline angelegtes Gerät übernimmt den Familienstand: ${JSON.stringify(sc)}, Server ${srv.minuten}`);
  pruefe(gesendet.length > 5 && gesendet.every((b) => !/Mia/.test(b)), `Der Name steht in keiner Anfrage (${gesendet.length} Anfragen geprüft)`);
  await C.close();

  // Zurücksetzen auf B: online weg, A folgt
  await app(B, 'await ab.zuruecksetzenUeberall();');
  await B.reload(); await B.waitForSelector('text=Einrichten');
  pruefe(true, 'B nach dem Zurücksetzen auf dem Startbildschirm');
  const leer = sql.prepare('SELECT (SELECT count(*) FROM lp_daten) + (SELECT count(*) FROM lp_antworten) AS n').get().n;
  pruefe(leer === 0, 'Server nach dem Zurücksetzen leer');
  await Promise.all([A.waitForNavigation({ timeout: 10000 }).catch(() => null), A.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))]);
  await A.waitForSelector('text=Einrichten', { timeout: 10000 });
  pruefe(true, 'A folgt dem Zurücksetzen und startet neu');
  const nachher = sql.prepare('SELECT (SELECT count(*) FROM lp_daten) + (SELECT count(*) FROM lp_antworten) AS n').get().n;
  pruefe(nachher === 0, 'A hat nichts Altes zurückgeschrieben');
} catch (e) {
  fehler.push('Abbruch: ' + e.message);
  console.error(e);
} finally {
  await browser.close(); server.kill();
}
console.log(fehler.length ? `\n${fehler.length} Fehler:\n` + fehler.join('\n') : '\nAlles bestanden.');
process.exit(fehler.length ? 1 : 0);
