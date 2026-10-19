// Prüft das Token von Cloudflare Access (Header Cf-Access-Jwt-Assertion).
// Nur wer die Access-Anmeldung bestanden hat, kommt an die Daten. Fehlt die Konfiguration, bleibt alles zu.
//   TEAM_DOMAIN  z. B. https://familie.cloudflareaccess.com
//   POLICY_AUD   AUD-Tag der Access-Anwendung (Zero Trust › Access › Applications › Additional settings › AUD tag)

let schluesselCache = { domain: null, zeit: 0, keys: new Map() };
const CACHE_MS = 60 * 60 * 1000, NEU_FRUEHESTENS_MS = 5 * 60 * 1000;   // unbekannte Schlüssel lösen höchstens alle 5 Minuten ein Nachladen aus

const b64url = (s) => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = t.length % 4 ? '='.repeat(4 - (t.length % 4)) : '';
  const bin = atob(t + pad);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
};
const jsonAus = (teil) => JSON.parse(new TextDecoder().decode(b64url(teil)));

export function normDomain(d) {
  let x = String(d || '').trim().replace(/\/+$/, '');
  if (x && !/^https:\/\//.test(x)) x = 'https://' + x.replace(/^http:\/\//, '');
  return x;
}

async function holeSchluessel(domain, kid, holen) {
  const alter = schluesselCache.domain === domain ? Date.now() - schluesselCache.zeit : Infinity;
  if (alter < CACHE_MS && schluesselCache.keys.has(kid)) return schluesselCache.keys.get(kid);
  if (alter < NEU_FRUEHESTENS_MS) return null;
  let antwort;
  try { antwort = await holen(`${domain}/cdn-cgi/access/certs`); } catch { antwort = null; }
  if (!antwort || !antwort.ok) throw Object.assign(new Error('Die Schlüssel von Cloudflare Access sind nicht erreichbar. TEAM_DOMAIN prüfen.'), { status: 503, code: 'access-fehler' });
  const { keys = [] } = await antwort.json();
  const map = new Map();
  for (const k of keys) {
    if (k.kty !== 'RSA' || !k.kid) continue;
    map.set(k.kid, await crypto.subtle.importKey('jwk', { kty: 'RSA', n: k.n, e: k.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']));
  }
  schluesselCache = { domain, zeit: Date.now(), keys: map };
  return map.get(kid) || null;
}

// Gibt { email } zurück oder wirft einen Fehler mit .status (401/503).
export async function pruefeAccess(request, env, holen = fetch) {
  const domain = normDomain(env.TEAM_DOMAIN), aud = String(env.POLICY_AUD || '').trim();
  if (!domain || !aud) throw Object.assign(new Error('Access ist für den Abgleich nicht eingerichtet (TEAM_DOMAIN, POLICY_AUD).'), { status: 503, code: 'nicht-eingerichtet' });
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw Object.assign(new Error('Keine Access-Anmeldung.'), { status: 401, code: 'anmeldung' });
  const teile = token.split('.');
  if (teile.length !== 3) throw Object.assign(new Error('Token ungültig.'), { status: 401, code: 'anmeldung' });
  let kopf, inhalt;
  try { kopf = jsonAus(teile[0]); inhalt = jsonAus(teile[1]); } catch { throw Object.assign(new Error('Token ungültig.'), { status: 401, code: 'anmeldung' }); }
  if (!kopf || typeof kopf !== 'object' || !inhalt || typeof inhalt !== 'object') throw Object.assign(new Error('Token ungültig.'), { status: 401, code: 'anmeldung' });
  if (kopf.alg !== 'RS256' || !kopf.kid) throw Object.assign(new Error('Token-Verfahren nicht erlaubt.'), { status: 401, code: 'anmeldung' });
  const key = await holeSchluessel(domain, kopf.kid, holen);
  if (!key) throw Object.assign(new Error('Unbekannter Schlüssel.'), { status: 401, code: 'anmeldung' });
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(teile[2]), new TextEncoder().encode(teile[0] + '.' + teile[1]));
  if (!ok) throw Object.assign(new Error('Signatur ungültig.'), { status: 401, code: 'anmeldung' });
  const jetzt = Math.floor(Date.now() / 1000);
  const auds = Array.isArray(inhalt.aud) ? inhalt.aud : [inhalt.aud];
  if (!auds.includes(aud)) throw Object.assign(new Error('Token gehört zu einer anderen Anwendung.'), { status: 401, code: 'anmeldung' });
  if (normDomain(inhalt.iss) !== domain) throw Object.assign(new Error('Token stammt nicht von diesem Team.'), { status: 401, code: 'anmeldung' });
  if (typeof inhalt.exp !== 'number' || inhalt.exp < jetzt - 60) throw Object.assign(new Error('Anmeldung abgelaufen.'), { status: 401, code: 'anmeldung' });
  if (typeof inhalt.nbf === 'number' && inhalt.nbf > jetzt + 60) throw Object.assign(new Error('Token noch nicht gültig.'), { status: 401, code: 'anmeldung' });
  return { email: String(inhalt.email || inhalt.sub || 'unbekannt') };
}

export function _cacheLeeren() { schluesselCache = { domain: null, zeit: 0, keys: new Map() }; }
