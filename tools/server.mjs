// Kleiner Server für Tests: node tools/server.mjs [port] [--abgleich [datei.sqlite]]
// Mit --abgleich gibt es /api/* wie auf Cloudflare (SQLite statt D1, Anmeldung als test@localhost). Nur für diesen Rechner.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('site');
const zahl = process.argv.slice(2).find((a) => /^\d+$/.test(a));
const port = Number(zahl || 8765);
const ai = process.argv.indexOf('--abgleich');
let api = null;
if (ai > 0) {
  const { d1Lokal } = await import('./d1-lokal.mjs');
  const { bearbeite } = await import('../server/abgleich.mjs');
  const datei = process.argv[ai + 1] && !process.argv[ai + 1].startsWith('--') && !/^\d+$/.test(process.argv[ai + 1]) ? process.argv[ai + 1] : ':memory:';
  const env = { DB: d1Lokal(datei) };
  api = async (req, res) => {
    const teile = []; for await (const c of req) teile.push(c);
    const r = await bearbeite(new Request('http://localhost:' + port + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(teile) }), env, { email: 'test@localhost' });
    res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
  };
  console.log('Abgleich aktiv (' + datei + ')');
}
const TYP = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.startsWith('/api/')) {
    if (api) { api(req, res).catch((e) => { console.error(e); res.writeHead(500); res.end(); }); return; }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"aus":true,"text":"Lokaler Server ohne Abgleich (node tools/server.mjs --abgleich)."}'); return;
  }
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': TYP[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(port, api ? '127.0.0.1' : undefined, () => console.log('http://localhost:' + port));   // mit Abgleich (ohne Anmeldung) nur auf diesem Rechner
