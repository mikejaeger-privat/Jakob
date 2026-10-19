// Cloudflare Pages Function für /api/* (Abgleich zwischen Geräten). Logik in server/abgleich.mjs.
// Jede Anfrage muss die Access-Anmeldung bestanden haben; das Token wird hier zusätzlich geprüft.
import { pruefeAccess } from '../../server/access.mjs';
import { bearbeite } from '../../server/abgleich.mjs';

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  // Neu anmelden: Access fängt diesen Aufruf ab, wenn die Sitzung abgelaufen ist, und schickt danach hierher zurück.
  // Die App selbst kommt aus dem Offline-Speicher und würde Access sonst nie mehr sehen.
  if (request.method === 'GET' && url.pathname.replace(/\/+$/, '') === '/api/anmelden') {
    return new Response(null, { status: 302, headers: { Location: '/', 'Cache-Control': 'no-store' } });
  }
  let zugang;
  try {
    zugang = await pruefeAccess(request, env);
  } catch (e) {
    if (!e.status) { console.error('Access-Prüfung', e); e = { status: 500, code: 'server', message: 'Interner Fehler bei der Anmeldeprüfung.' }; }
    // Nicht eingerichtet: freundlich «aus» melden (200), die App bleibt dann beim lokalen Speichern
    const aus = e.code === 'nicht-eingerichtet';
    return new Response(JSON.stringify(aus ? { aus: true, text: e.message } : { fehler: e.code || 'anmeldung', text: e.message }), {
      status: aus ? 200 : (e.status || 401), headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  return bearbeite(request, env, zugang);
}
