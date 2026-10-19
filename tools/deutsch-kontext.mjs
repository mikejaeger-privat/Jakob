// Gemeinsamer Kontext der Deutsch-Prüfwerkzeuge: Lexikon, Buchstabenplan, Katalog, feste Inhalte, Freigaben.
import fs from 'node:fs';
import path from 'node:path';
import { mischeInhalte } from '../site/js/deutsch/lib.js';

export const W = JSON.parse(fs.readFileSync('site/data/woerter.json', 'utf8'));
export const B = JSON.parse(fs.readFileSync('site/data/buchstaben.json', 'utf8'));
export const K = JSON.parse(fs.readFileSync('site/data/katalog/deutsch.json', 'utf8'));
export const P = JSON.parse(fs.readFileSync('site/data/parameter.json', 'utf8'));
const ORDNER = 'site/data/inhalte/deutsch';
export const INHALTE = mischeInhalte(fs.existsSync(ORDNER) ? fs.readdirSync(ORDNER).filter((d) => d.endsWith('.json')).map((d) => JSON.parse(fs.readFileSync(path.join(ORDNER, d), 'utf8'))) : []);
// Standard-Freigabe: alle Einzelbuchstaben, Sch, Ei, Au (Startwert im Buchstabenplan)
export const FREI_STANDARD = new Set(B.liste.filter((b) => b.eingefuehrt).map((b) => b.id));
// Kleine Freigabe für die Prüfung der Sperre: nur gut hörbare, früh eingeführte Buchstaben
export const FREI_KLEIN = new Set(['a', 'm', 'l', 'o', 'i', 'e', 'u', 's', 'n', 'r', 'f', 'w', 't']);
// Alle Buchstaben und Verbindungen
export const FREI_ALLE = new Set(B.liste.map((b) => b.id));

// Beispiel-Lernwörter (wie von Eltern eingetragen; auch mit nicht eingeführten Buchstaben)
export const LERNWOERTER = ['Mama', 'Sonne', 'Haus', 'rot', 'Strasse'];
export function kontext({ freigabe = FREI_STANDARD, stimme = true, silben = true, dehnlaute = true, lernwoerter = LERNWOERTER } = {}) {
  return { lexikon: W, buchstaben: B, freigabe, stimme, silben, dehnlaute, dehnlautText: P.sprache.dehnlautText, inhalte: INHALTE, zuletzt: new Set(), lernwoerter };
}
