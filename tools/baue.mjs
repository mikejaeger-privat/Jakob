// Baut die Website für den Upload: Inhaltsindex, Service Worker mit Version und Dateiliste für den Offline-Betrieb.
// Aufruf: node tools/baue.mjs  (Cloudflare Pages führt das bei jedem Push auf main aus)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const site = path.resolve('site');

// 1 Inhaltsindex: welche festen Deutsch-Inhalte es gibt
const index = {};
for (const [fach, ordner] of [['D', 'deutsch']]) {
  const dir = path.join(site, 'data/inhalte', ordner);
  index[fach] = fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => d.endsWith('.json')).sort().map((d) => `${ordner}/${d}`) : [];
}
fs.mkdirSync(path.join(site, 'data/inhalte'), { recursive: true });
fs.writeFileSync(path.join(site, 'data/inhalte/index.json'), JSON.stringify(index, null, 1) + '\n');

// 2 Dateiliste und Version
const dateien = [];
const sammle = (dir) => {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) sammle(p);
    else if (!['sw.js', '_headers', 'package.json'].includes(d.name) && !d.name.startsWith('.')) dateien.push(path.relative(site, p).split(path.sep).join('/'));
  }
};
sammle(site);
dateien.sort();
const hash = crypto.createHash('sha256');
for (const d of dateien) if (d !== 'index.html') hash.update(d).update(fs.readFileSync(path.join(site, d)));
const version = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + hash.digest('hex').slice(0, 8);
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8').replace(/data-version="[^"]*"/, `data-version="${version}"`);
fs.writeFileSync(path.join(site, 'index.html'), html);
const liste = ['./', ...dateien.filter((d) => d !== 'index.html').map((d) => './' + d)]; // index.html liefert Cloudflare unter ./ aus
const sw = fs.readFileSync('tools/sw-vorlage.js', 'utf8').replace('__VERSION__', version).replace('__DATEIEN__', JSON.stringify(liste, null, 0));
fs.writeFileSync(path.join(site, 'sw.js'), sw);
const groesse = dateien.reduce((s, d) => s + fs.statSync(path.join(site, d)).size, 0);
console.log(`Version ${version}: ${dateien.length} Dateien, ${(groesse / 1024 / 1024).toFixed(2)} MB, Inhalte Deutsch: ${index.D.length}`);
