// Regeln des Abgleichs in der App (site/js/core/abgleich.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wendeAn, fuerVersand, vomServer, nachVersand, zumVersand } from '../../site/js/core/abgleich.js';

const S0 = (o = {}) => ({ ts: {}, offen: [], ...o });

test('Fern neuer: übernehmen, Name bleibt lokal', () => {
  const Z = { profil: { name: 'Lokal', pin: null }, einstellungen: { a: 1 } };
  const S = S0({ ts: { profil: 5, einstellungen: 5 } });
  const r = wendeAn(Z, S, { profil: { wert: { pin: { salz: 'x' } }, ts: 9 }, einstellungen: { wert: { a: 2 }, ts: 9 } });
  assert.deepEqual(r.geaendert.sort(), ['einstellungen', 'profil']);
  assert.equal(Z.profil.name, 'Lokal'); assert.deepEqual(Z.profil.pin, { salz: 'x' });
  assert.deepEqual(Z.einstellungen, { a: 2 }); assert.equal(S.ts.einstellungen, 9); assert.equal(r.nochmal, false);
});

test('Neues Gerät ohne Profil: Name leer', () => {
  const Z = { profil: null };
  wendeAn(Z, S0(), { profil: { wert: { erstellt: 1 }, ts: 3 } });
  assert.equal(Z.profil.name, '');
});

test('Lokal neuer und offen: bleibt, Basis wird übernommen, geht erneut hoch', () => {
  const Z = { einstellungen: { x: 'lokal' } };
  const S = S0({ ts: { einstellungen: 20 }, offen: ['einstellungen'] });
  const r = wendeAn(Z, S, { einstellungen: { wert: { x: 'fern' }, ts: 10, seq: 7 } });
  assert.deepEqual(r.geaendert, []); assert.equal(Z.einstellungen.x, 'lokal'); assert.equal(r.nochmal, true); assert.equal(S.basis.einstellungen, 7);
});

test('Nicht offen: fern wird immer übernommen (auch mit älterer Uhrzeit des anderen Geräts)', () => {
  const Z = { einfuehrung: { x: 'alt' } };
  const S = S0({ ts: { einfuehrung: 50 } });
  wendeAn(Z, S, { einfuehrung: { wert: { x: 'fern' }, ts: 40, seq: 3 } });
  assert.equal(Z.einfuehrung.x, 'fern');
});

test('Beide geändert, Sammlung, lokal neuer: Themen beider Seiten, lokal gewinnt bei gleichem Thema', () => {
  const Z = { kasten: { a: 'lokal-a', b: 'lokal-b' } };
  const S = S0({ ts: { kasten: 30 }, offen: ['kasten'] });
  wendeAn(Z, S, { kasten: { wert: { b: 'fern-b', c: 'fern-c' }, ts: 20, seq: 4 } });
  assert.deepEqual(Z.kasten, { a: 'lokal-a', b: 'lokal-b', c: 'fern-c' });
  assert.equal(S.ts.kasten, 31); assert.ok(S.offen.includes('kasten'));
});

test('Beide geändert, Sammlung: zusammenführen, fern gewinnt bei gleichem Thema', () => {
  const Z = { stand: { a: 'lokal-a', b: 'lokal-b' } };
  const S = S0({ ts: { stand: 10 }, offen: ['stand'] });
  const r = wendeAn(Z, S, { stand: { wert: { b: 'fern-b', c: 'fern-c' }, ts: 15 } });
  assert.deepEqual(Z.stand, { a: 'lokal-a', b: 'fern-b', c: 'fern-c' });
  assert.ok(S.offen.includes('stand')); assert.equal(S.ts.stand, 16); assert.equal(r.nochmal, true);
});

test('Beide geändert, kein zusammenführbarer Bereich: fern (neuer) gewinnt, lokale Änderung fällt weg', () => {
  const Z = { tagesplan: { tag: 1, von: 'lokal' } };
  const S = S0({ ts: { tagesplan: 10 }, offen: ['tagesplan'] });
  wendeAn(Z, S, { tagesplan: { wert: { tag: 1, von: 'fern' }, ts: 12 } });
  assert.equal(Z.tagesplan.von, 'fern'); assert.ok(!S.offen.includes('tagesplan'));
});

test('Lernstand: bei gleichem Thema gewinnt der Eintrag mit mehr Antworten, unabhängig von der Uhr', () => {
  const Z = { stand: { 'm1': { 1: { na: 12, w: 'lokal' }, 2: { na: 1, w: 'lokal' } } } };
  const S = S0({ ts: { stand: 10 }, offen: ['stand'] });
  wendeAn(Z, S, { stand: { wert: { 'm1': { 1: { na: 5, w: 'fern' }, 2: { na: 3, w: 'fern' }, 3: { na: 1, w: 'fern' } } }, ts: 99 } });
  assert.equal(Z.stand.m1[1].w, 'lokal'); assert.equal(Z.stand.m1[2].w, 'fern'); assert.equal(Z.stand.m1[3].w, 'fern');
});

test('Lernwörter, Schatzkarten, Meldungen und Sammelbild gehen beim Zusammenführen nicht verloren', () => {
  const Z = {
    lernwoerter: [{ id: 'lw1', wort: 'Mama' }], schatzkarten: [{ id: 'sk1', tag: 10 }],
    meldungen: [{ tag: 4, aid: 'x', text: 't', erledigt: true }],
    sammelbild: { szene: 'herbstwald', teile: [{ id: 't1' }, { id: 't2' }], album: [] },
  };
  const S = S0({ ts: { lernwoerter: 10, schatzkarten: 10, meldungen: 10, sammelbild: 10 }, offen: ['lernwoerter', 'schatzkarten', 'meldungen', 'sammelbild'] });
  wendeAn(Z, S, {
    lernwoerter: { wert: [{ id: 'lw2', wort: 'Papa' }], ts: 20 },
    schatzkarten: { wert: [{ id: 'sk0', tag: 5 }, { id: 'sk1', tag: 10 }], ts: 20 },
    meldungen: { wert: [{ tag: 4, aid: 'x', text: 't', erledigt: false }, { tag: 5, aid: 'y', text: 'u', erledigt: false }], ts: 20 },
    sammelbild: { wert: { szene: 'herbstwald', teile: [{ id: 't1' }, { id: 't3' }], album: [{ id: 'a0' }] }, ts: 20 },
  });
  assert.deepEqual(Z.lernwoerter.map((x) => x.id).sort(), ['lw1', 'lw2']);
  assert.deepEqual(Z.schatzkarten.map((x) => x.id), ['sk0', 'sk1'], 'vereinigt und nach Tag geordnet');
  assert.equal(Z.meldungen.length, 2); assert.equal(Z.meldungen.find((m) => m.aid === 'x').erledigt, true);
  assert.deepEqual(Z.sammelbild.teile.map((x) => x.id).sort(), ['t1', 't2', 't3'], 'kein Teil geht verloren');
  assert.equal(Z.sammelbild.album.length, 1);
  assert.ok(S.offen.includes('sammelbild') && S.offen.includes('lernwoerter'));
});

test('Der Name geht nie mit', () => {
  assert.deepEqual(zumVersand('profil', { name: 'Mia', pin: null, erstellt: 3 }), { pin: null, erstellt: 3 });
  assert.deepEqual(zumVersand('stand', { a: 1 }), { a: 1 });
});

test('Antworten: ID bleibt, alte Antworten bekommen eine ID aus dem Inhalt', () => {
  const mit = fuerVersand({ nr: 4, id: 'g:1', tag: 20000, p: 1 });
  assert.deepEqual(mit, { id: 'g:1', tag: 20000, e: { tag: 20000, p: 1 } });
  const a1 = fuerVersand({ nr: 1, tag: 20000, p: 1, aid: 'x' }), a2 = fuerVersand({ nr: 99, tag: 20000, p: 1, aid: 'x' });
  assert.equal(a1.id, a2.id, 'gleiche Antwort, gleiche ID auf jedem Gerät');
  assert.notEqual(a1.id, fuerVersand({ nr: 1, tag: 20000, p: 0, aid: 'x' }).id);
  assert.deepEqual(vomServer(mit), { tag: 20000, p: 1, id: 'g:1', fern: 1 });
  assert.equal(fuerVersand({ nr: 2, fern: 1, id: 'h:1', tag: 1 }).e.fern, undefined);
});

test('Nach dem Hochladen: nur angenommene und seither unveränderte Schlüssel sind erledigt', () => {
  const S = S0({ ts: { a: 5, b: 7, d: 3 }, offen: ['a', 'b', 'c', 'd'] });
  nachVersand(S, { a: 5, b: 6, d: 3 }, { a: 11, b: 11 });
  assert.deepEqual(S.offen, ['b', 'c', 'd'], 'b geändert, c nicht gesendet, d abgelehnt');
  assert.deepEqual(S.basis, { a: 11, b: 11 });
});
