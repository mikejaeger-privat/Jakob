// Kurze Simulation (bis Weihnachten, drei Profile): keine Verstösse gegen Zeit, Freigaben, Karteikasten, Erfolg am Schluss
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('Simulation bis Weihnachten ohne Verstösse', () => {
  const r = spawnSync(process.execPath, ['tools/sim/lauf.mjs', '--bis', '2026-12-18'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout.slice(-2000) + r.stderr.slice(-2000));
  assert.match(r.stdout, /Keine Verstösse/);
});

// Fälle, die die Simulation mit mehreren Läufen gefunden hat (Etappe 7):
// Erfolgsaufgabe für ein langsames Kind, das für alle leichten Aufgaben länger als 30 Sekunden braucht (Entdeckerrunde, 5 Minuten)
test('Langsames Kind, 5 Minuten, mehrere Läufe: jede Sitzung bekommt ihre Erfolgsaufgabe', () => {
  const r = spawnSync(process.execPath, ['tools/sim/lauf.mjs', '--laeufe', '10', '--profil', 'langsam', '--minuten', '5', '--bis', '2026-11-13'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout.slice(-2000) + r.stderr.slice(-2000));
});
// Zeig-Runde mit langen Legeaufgaben kurz vor Schluss: beginnt nur, wenn sie ganz Platz hat; nach der Zeit keine Aufgabe mehr
test('Langsames Kind, Lauf 10, ganzes Jahr: keine Aufgabe nach der Zeit', () => {
  const r = spawnSync(process.execPath, ['tools/sim/lauf.mjs', '--profil', 'langsam', '--lauf', '10'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout.slice(-2000) + r.stderr.slice(-2000));
  assert.match(r.stdout, /Keine Verstösse/);
});
