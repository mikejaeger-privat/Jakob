// Rendert das SVG-Icon als PNG (180, 192, 512, maskierbar 512). Für PNG ohne runde Ecken (iOS rundet selbst).
// Aufruf: node tools/icons.mjs (braucht Playwright mit Chromium)
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const rund = fs.readFileSync('site/icons/icon.svg', 'utf8');
const voll = rund.replace('rx="112"', 'rx="0"').replace(/V400 A112 112 0 0 1 400 512 H112 A112 112 0 0 1 0 400 Z/, 'V512 H0 Z');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, pad] of [['icon-180', 180, 0], ['icon-192', 192, 0], ['icon-512', 512, 0], ['icon-512-maskable', 512, 0.1]]) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - 2 * pad));
  await page.setContent(`<html><body style="margin:0;background:#2f6b4f;display:grid;place-items:center;width:${size}px;height:${size}px">${voll.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</body></html>`);
  await page.screenshot({ path: `site/icons/${name}.png` });
}
await browser.close();
console.log('Icons erzeugt');
