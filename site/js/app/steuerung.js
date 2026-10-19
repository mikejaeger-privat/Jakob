// Verbindet Grundlagen, gespeicherten Zustand und Kalender. Tagesplan und Verbuchen: app/lernen.js.
import { Z, speichere } from './zustand.js';
import { ladeGrundlagen } from './inhalte.js';
import { speicherStatus } from './db.js';
import { heuteNr, tagNr } from '../core/util.js';
import { kalender } from '../core/kalender.js';

export let G = null;     // Grundlagen: { k, P, Z: ziele, LM: lehrmittel, B: buchstaben, W: woerter }
export let K = null;     // Kalender
export async function init() {
  G = await ladeGrundlagen();
  K = kalender(G.Z);
  try { speicher = await speicherStatus(); } catch { /* egal */ }
  // Neue Buchstaben oder Verbindungen im Plan: mit ihrem Standard ergänzen, eigene Haken bleiben
  if (Z.buchstaben) {
    let neu = false;
    for (const b of G.B.liste) if (!(b.id in Z.buchstaben.frei)) { Z.buchstaben.frei[b.id] = !!b.eingefuehrt; Z.buchstaben.reihenfolge.push(b.id); neu = true; }
    if (neu) speichere('buchstaben');
  }
  return G;
}

// Speicherschutz: Ist der Speicher nicht dauerhaft (Safari ohne Home-Bildschirm), erinnert die App öfter ans Sichern.
export let speicher = { installiert: false, dauerhaft: false };
export const backupTage = () => (speicher.dauerhaft || speicher.installiert ? G.P.backup.erinnerungNachTagen : Math.min(7, G.P.backup.erinnerungNachTagen));
export function backupFaellig(t) { return t - (Z.backup?.letztes ?? Z.profil.erstellt) > backupTage(); }

// Für Tests: ein fester «heute» über ?heute=2026-12-01 (nur auf dem eigenen Testrechner, nie auf der veröffentlichten Seite)
let heuteFix = null;
try {
  const q = new URLSearchParams(location.search).get('heute');
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q) && ['localhost', '127.0.0.1'].includes(location.hostname)) heuteFix = tagNr(q);
} catch { /* Node */ }
export const heute = () => heuteFix ?? heuteNr();

export const istLerntag = (t = heute()) => K.lerntag(t, Z.einstellungen.lernTage);
export const freiGrund = (t = heute()) => K.ferienAm(t) || K.feiertagAm(t) || (istLerntag(t) ? null : 'kein Lerntag');
export const begriff = (k) => Z.einstellungen?.begriffe?.[k] || G.P.begriffe[k] || k;
