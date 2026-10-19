// Lädt die Grundlagen der App (Katalog, Parameter, Ziele, Lehrmittel, Buchstabenplan, Wortlexikon, feste Deutsch-Inhalte) einmal pro Start.
import { mischeInhalte } from '../deutsch/lib.js';
async function json(pfad) {
  const r = await fetch(new URL(pfad, document.baseURI), { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${pfad} konnte nicht geladen werden (${r.status}).`);
  return r.json();
}

let grundlagen = null;
export async function ladeGrundlagen() {
  if (grundlagen) return grundlagen;
  const [deutsch, mathe, P, Zi, LM, B, W, index] = await Promise.all([
    json('data/katalog/deutsch.json'), json('data/katalog/mathe.json'), json('data/parameter.json'), json('data/ziele.json'),
    json('data/lehrmittel.json'), json('data/buchstaben.json'), json('data/woerter.json'), json('data/inhalte/index.json'),
  ]);
  const fertigkeiten = new Map([...deutsch.fertigkeiten, ...mathe.fertigkeiten].map((f) => [f.id, f]));
  const IN = mischeInhalte(await Promise.all((index.D || []).map((d) => json('data/inhalte/' + d))));
  grundlagen = { k: { D: deutsch, M: mathe, fertigkeiten }, P, Z: Zi, LM, B, W, IN };
  return grundlagen;
}
export function grundlagenNeuLaden() { grundlagen = null; }
