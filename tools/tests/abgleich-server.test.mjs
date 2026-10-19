// Tests für den Abgleich-Server (server/abgleich.mjs, server/access.mjs) mit lokaler SQLite statt D1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bearbeite, SCHLUESSEL, _schemaVergessen } from '../../server/abgleich.mjs';
import { pruefeAccess, _cacheLeeren } from '../../server/access.mjs';
import { d1Lokal } from '../d1-lokal.mjs';

const URL_ = 'https://lernwelt-test.pages.dev';
const zugang = { email: 'eltern@example.org' };
const anfrage = (pfad, body, kopf = {}) => new Request(URL_ + pfad, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: URL_, ...kopf }, body: JSON.stringify(body) });
const neueUmgebung = () => { _schemaVergessen(); return { DB: d1Lokal() }; };
const sende = async (env, pfad, body) => { const r = await bearbeite(anfrage(pfad, body), env, zugang); return { status: r.status, j: await r.json() }; };

test('Gerät A schreibt, Gerät B liest; eigene Änderungen kommen nicht zurück', async () => {
  const env = neueUmgebung();
  const a1 = await sende(env, '/api/abgleich', { geraet: 'a', epoche: null, seit: 0,
    daten: { stand: { wert: { m1: { w: 0.5 } }, ts: 1000 }, profil: { wert: { name: 'Geheim', erstellt: 1, pin: null }, ts: 1000 } },
    antworten: [{ id: 'a:1', tag: 20000, e: { f: 'm1', p: 1 } }, { id: 'a:2', tag: 20000, e: { f: 'm1', p: 0 } }] });
  assert.equal(a1.status, 200);
  assert.deepEqual(a1.j.daten, {}, 'A bekommt die eigenen Daten nicht zurück');
  assert.equal(a1.j.antworten.length, 0);
  const b1 = await sende(env, '/api/abgleich', { geraet: 'b', epoche: null, seit: 0 });
  assert.equal(b1.j.epoche, a1.j.epoche);
  assert.deepEqual(b1.j.daten.stand.wert, { m1: { w: 0.5 } }); assert.equal(b1.j.daten.stand.ts, 1000); assert.ok(b1.j.daten.stand.seq > 0);
  assert.deepEqual(Object.keys(a1.j.angenommen).sort(), ['profil', 'stand']);
  assert.equal(b1.j.daten.profil.wert.name, undefined, 'der Name wird nie gespeichert');
  assert.equal(b1.j.antworten.length, 2);
  assert.equal(b1.j.wer, 'eltern@example.org');
  const roh = env.DB.roh.prepare("SELECT wert FROM lp_daten WHERE k = 'profil'").get().wert;
  assert.ok(!roh.includes('Geheim'));
  const b2 = await sende(env, '/api/abgleich', { geraet: 'b', epoche: b1.j.epoche, seit: b1.j.seit });
  assert.deepEqual(b2.j.daten, {}); assert.equal(b2.j.antworten.length, 0);
});

test('Schreiben nur mit bekannter Fassung; abgelehnte Geräte bekommen die aktuelle Fassung; doppelte Antworten zählen einmal', async () => {
  const env = neueUmgebung();
  const a = await sende(env, '/api/abgleich', { geraet: 'a', seit: 0, daten: { einstellungen: { wert: { x: 2 }, ts: 2000 } }, antworten: [{ id: 'a:1', tag: 1, e: { p: 1 } }] });
  const seqA = a.j.angenommen.einstellungen;
  assert.ok(seqA > 0, 'A angenommen');
  // B kennt die Fassung von A nicht (basis 0): abgelehnt, bekommt sie zurück
  const b = await sende(env, '/api/abgleich', { geraet: 'b', epoche: a.j.epoche, seit: 0, daten: { einstellungen: { wert: { x: 1 }, ts: 9000, basis: 0 } }, antworten: [{ id: 'a:1', tag: 1, e: { p: 0 } }] });
  assert.equal(b.j.angenommen.einstellungen, undefined);
  assert.deepEqual(b.j.daten.einstellungen, { wert: { x: 2 }, ts: 2000, seq: seqA });
  // mit der richtigen Basis klappt es
  const b2 = await sende(env, '/api/abgleich', { geraet: 'b', epoche: a.j.epoche, seit: b.j.seit, daten: { einstellungen: { wert: { x: 3 }, ts: 9001, basis: seqA } } });
  assert.ok(b2.j.angenommen.einstellungen > seqA);
  const c = await sende(env, '/api/abgleich', { geraet: 'c', seit: 0 });
  assert.deepEqual(c.j.daten.einstellungen.wert, { x: 3 });
  assert.equal(c.j.antworten.length, 1); assert.equal(c.j.antworten[0].e.p, 1, 'erste Fassung einer Antwort bleibt');
  // A mit veralteter Basis wird abgelehnt
  const a2 = await sende(env, '/api/abgleich', { geraet: 'a', epoche: a.j.epoche, seit: a.j.seit, daten: { einstellungen: { wert: { x: 4 }, ts: 9999, basis: seqA } } });
  assert.equal(a2.j.angenommen.einstellungen, undefined);
  assert.deepEqual(a2.j.daten.einstellungen.wert, { x: 3 });
});

test('Zurücksetzen: alles weg, alte Geräte erfahren davon', async () => {
  const env = neueUmgebung();
  const a = await sende(env, '/api/abgleich', { geraet: 'a', seit: 0, daten: { stand: { wert: { m: 1 }, ts: 5 } }, antworten: [{ id: 'a:1', tag: 1, e: {} }] });
  const z = await sende(env, '/api/zuruecksetzen', {});
  assert.notEqual(z.j.epoche, a.j.epoche);
  const alt = await sende(env, '/api/abgleich', { geraet: 'b', epoche: a.j.epoche, seit: 3, daten: { stand: { wert: { m: 9 }, ts: 99 } } });
  assert.equal(alt.j.zurueckgesetzt, true);
  const neu = await sende(env, '/api/abgleich', { geraet: 'c', seit: 0 });
  assert.deepEqual(neu.j.daten, {}); assert.equal(neu.j.antworten.length, 0, 'auch das alte Gerät hat nichts zurückgeschrieben');
});

test('Nach dem Zurücksetzen: Gerät ohne Epoche mit alten Daten folgt; neues Gerät darf schreiben; alte Epoche schreibt nichts', async () => {
  const env = neueUmgebung();
  const a = await sende(env, '/api/abgleich', { geraet: 'a', seit: 0, daten: { stand: { wert: { m: 1 }, ts: 5 } } });
  const vorher = Date.now() - 1000;
  await sende(env, '/api/zuruecksetzen', {});
  const alt = await sende(env, '/api/abgleich', { geraet: 'x', epoche: null, angelegt: vorher, seit: 0, daten: { stand: { wert: { alt: 1 }, ts: 1 } } });
  assert.equal(alt.j.zurueckgesetzt, true, 'Daten von vor dem Zurücksetzen kommen nicht zurück');
  const neu = await sende(env, '/api/abgleich', { geraet: 'y', epoche: null, angelegt: Date.now() + 10, seit: 0, daten: { stand: { wert: { neu: 1 }, ts: 1 } } });
  assert.equal(neu.j.zurueckgesetzt, undefined); assert.ok(neu.j.angenommen.stand);
  // Zurücksetzen genau zwischen Prüfung und Schreiben: das Schreiben greift nicht
  const n0 = env.DB.roh.prepare('SELECT (SELECT count(*) FROM lp_daten) + (SELECT count(*) FROM lp_antworten) AS n').get().n;
  const orig = env.DB.batch;
  env.DB.batch = async (liste) => { env.DB.roh.prepare("UPDATE lp_meta SET v = 'neu-dazwischen' WHERE k = 'epoche'").run(); env.DB.batch = orig; return orig.call(env.DB, liste); };
  await sende(env, '/api/abgleich', { geraet: 'y', epoche: neu.j.epoche, seit: neu.j.seit, daten: { tagesplan: { wert: { x: 1 }, ts: 9 } }, antworten: [{ id: 'y:1', tag: 1, e: {} }] });
  const n1 = env.DB.roh.prepare('SELECT (SELECT count(*) FROM lp_daten) + (SELECT count(*) FROM lp_antworten) AS n').get().n;
  assert.equal(n1, n0); void a;
});

test('Viele Antworten: Seiten zu 2000, nichts geht verloren; Abfragen bleiben unter 50', async () => {
  const env = neueUmgebung();
  let ep = null; const basis = {};
  for (let p = 0; p < 3; p++) {
    const antworten = Array.from({ length: 2000 }, (_, i) => ({ id: `a:${p}:${String(i).padStart(4, '0')}`, tag: 20000 + p, e: { i } }));
    const daten = Object.fromEntries(SCHLUESSEL.map((k) => [k, { wert: { k, p }, ts: 100 + p, basis: basis[k] || 0 }]));
    env.DB.nullen();
    const r = await sende(env, '/api/abgleich', { geraet: 'a', epoche: ep, seit: 0, daten, antworten });
    assert.equal(r.status, 200);
    assert.equal(Object.keys(r.j.angenommen).length, SCHLUESSEL.length);
    Object.assign(basis, r.j.angenommen);
    assert.ok(env.DB.anfragen < 50, `zu viele Abfragen: ${env.DB.anfragen}`);
    ep = r.j.epoche;
  }
  const ids = new Set();
  let cursor = null, seit = 0, runden = 0, daten = null;
  do {
    const r = await sende(env, '/api/abgleich', { geraet: 'b', epoche: ep, seit, cursor });
    if (!cursor) daten = r.j.daten;
    for (const x of r.j.antworten) ids.add(x.id);
    cursor = r.j.mehr ? r.j.cursor : null;
    if (!r.j.mehr) seit = r.j.seit;
    runden++;
  } while (cursor && runden < 10);
  assert.equal(ids.size, 6000);
  assert.equal(Object.keys(daten).length, SCHLUESSEL.length);
});

test('Abgelehnt: fremde Herkunft, falscher Schlüssel, falsche Methode, ohne Datenbank', async () => {
  const env = neueUmgebung();
  const r1 = await bearbeite(anfrage('/api/abgleich', { geraet: 'a' }, { Origin: 'https://boese.example' }), env, zugang);
  assert.equal(r1.status, 403);
  const r2 = await sende(env, '/api/abgleich', { geraet: 'a', daten: { backup: { wert: {}, ts: 1 } } });
  assert.equal(r2.status, 400);
  const r3 = await bearbeite(new Request(URL_ + '/api/abgleich'), env, zugang);
  assert.equal(r3.status, 405);
  const r4 = await bearbeite(anfrage('/api/abgleich', { geraet: 'a' }), {}, zugang);
  assert.equal(r4.status, 200); assert.equal((await r4.json()).aus, true, 'ohne Datenbank: «aus», die App bleibt lokal');
  const r5 = await sende(env, '/api/abgleich', { geraet: '../x' });
  assert.equal(r5.status, 400);
});

// --- Access-Token ---
const b64u = (buf) => Buffer.from(buf).toString('base64url');
async function schluesselpaar() {
  const p = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = await crypto.subtle.exportKey('jwk', p.publicKey);
  return { p, jwk: { kty: 'RSA', n: jwk.n, e: jwk.e, kid: 'k1', alg: 'RS256' } };
}
async function token(p, inhalt, kid = 'k1') {
  const kopf = b64u(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' })), body = b64u(JSON.stringify(inhalt));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', p.privateKey, new TextEncoder().encode(kopf + '.' + body));
  return `${kopf}.${body}.${b64u(sig)}`;
}

test('Access-Token: gültig, falsche Anwendung, abgelaufen, falsches Team, gefälscht, ohne Konfiguration', async () => {
  _cacheLeeren();
  const { p, jwk } = await schluesselpaar();
  const andere = await schluesselpaar();
  const env = { TEAM_DOMAIN: 'familie.cloudflareaccess.com', POLICY_AUD: 'aud123' };
  const holen = async (u) => { assert.equal(u, 'https://familie.cloudflareaccess.com/cdn-cgi/access/certs'); return new Response(JSON.stringify({ keys: [jwk] })); };
  const jetzt = Math.floor(Date.now() / 1000);
  const gut = { aud: ['aud123'], iss: 'https://familie.cloudflareaccess.com', exp: jetzt + 600, email: 'eltern@example.org' };
  const mit = (t) => new Request(URL_ + '/api/abgleich', { headers: { 'Cf-Access-Jwt-Assertion': t } });
  assert.deepEqual(await pruefeAccess(mit(await token(p, gut)), env, holen), { email: 'eltern@example.org' });
  const nein = async (t, status = 401, e = env) => { await assert.rejects(pruefeAccess(t === null ? new Request(URL_) : mit(t), e, holen), (x) => x.status === status); };
  await nein(await token(p, { ...gut, aud: ['andere'] }));
  await nein(await token(p, { ...gut, exp: jetzt - 3600 }));
  await nein(await token(p, { ...gut, iss: 'https://boese.cloudflareaccess.com' }));
  await nein(await token(andere.p, gut));
  await nein(await token(p, gut, 'unbekannt'));
  await nein(null);
  await nein('a.b.c');
  await nein(await token(p, gut), 503, { TEAM_DOMAIN: '', POLICY_AUD: 'aud123' });
  const alg = b64u(JSON.stringify({ alg: 'none', kid: 'k1' })) + '.' + b64u(JSON.stringify(gut)) + '.';
  await nein(alg);
});
