// Kurze Simulation (bis Weihnachten, drei Profile): keine Verstösse gegen Zeit, Freigaben, Karteikasten, Erfolg am Schluss
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('Simulation bis Weihnachten ohne Verstösse', () => {
  const r = spawnSync(process.execPath, ['tools/sim/lauf.mjs', '--bis', '2026-12-18'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout.slice(-2000) + r.stderr.slice(-2000));
  assert.match(r.stdout, /Keine Verstösse/);
});
