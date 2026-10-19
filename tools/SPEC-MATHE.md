# Mathematik-Generatoren (Zyklus 1): Auftrag und Regeln

Jede Fertigkeit im Katalog (`site/data/katalog/mathe.json`) braucht pro Stufe einen Generator. Bausteine: `site/js/math/lib.js`. Antwortprüfung: `site/js/core/pruefen.js`. Aufgabentypen und Ablauf: `tools/SPEC-AUFGABEN.md`.

## Vertrag

Datei `site/js/math/<gruppe>.js` (ES-Modul, Gruppen `za`, `me`, `ze`, `re`, `fo`, `gr`; Abhängigkeiten nur `./lib.js`):

```js
import { A, sig, auswahl, fehlerbilder, LUECKE, PLUS, MINUS, GLEICH, rechnung } from './lib.js';
export const generatoren = {
  'M-RE-03': { 1: (r, ctx) => A.zahl({ … }), 2: (r, ctx) => …, 3: (r, ctx) => … },
};
```

- `r` ist der Zufallsgenerator (`int(a, b)`, `pick(arr)`, `bool(p)`, `shuffle(arr)`, `sample(arr, n)`, `next()`). Nie `Math.random` oder das Datum: Gleicher Startwert ergibt dieselbe Aufgabe.
- `ctx.bis` ist der Zahlenraum der Stufe (`raum` im Katalog). Eine Stufe wird nur gespielt, wenn ihr `raum` höchstens so gross ist wie der im Elternbereich freigegebene Zahlenraum (`ctx.grenze`: 10, 20 oder 100). `ctx.begriffe` enthält die gesprochenen Fachbegriffe aus `parameter.json` (von den Eltern anpassbar), `ctx.stimme` sagt, ob eine deutsche Stimme da ist. Für den Karteikasten (Blitzrechnen, M-RE-14) legt `ctx.karte` die Zahlen fest: «7=3+4» (Zerlegung), «3+4», «7−3»; `daten.karte` nennt die geübte Karte.
- Alle Zahlen einer Aufgabe (Angaben, Lösung, Zwischenschritte, Ablenker, Beschriftungen) sind höchstens `raum` und nie negativ. Einzige Ausnahme: Stufen mit `ausnahme: "muenzwerte"` zeigen Rappen-Münzen (5 bis 50 Rp.), deren Wert nur erkannt und verglichen, nicht gerechnet wird. Geldbeträge in Rechenaufgaben sind ganze Franken.
- Rückgabe über die Helfer `A.zahl`, `A.wahlBild`, `A.wahlWort`, `A.zuordnen`, `A.legen`, `A.reihenfolge`, `A.muster`, `A.zaehlen`, `A.mengeLegen`, `A.antippen`, `A.hoerenTippen`, `A.nachspuren`. Sie setzen `typ` und werfen bei fehlenden Pflichtfeldern. Ein Generator darf `null` zurückgeben, wenn keine gültige Aufgabe möglich ist.
- Weitere Helfer in `lib.js`: `auswahl(r, richtig, falsche, anzahl)` liefert `{ optionen, richtig }` ohne Doppelte; `fehlerbilder(loesung, bis, [falsch, 'Erklärung'], …)` lässt Einträge ausserhalb des Zahlenraums weg; `nachbarn`, `streue` (Lagen für verstreute Dinge), `reihen` (Lagen in Zehnerreihen), `bereich`, `rechnung(…)`; Listen `NAMEN` (mit Pronomen), `DINGE` (Bild, Einzahl, Mehrzahl, Artikel), `TIERE`, `ORDNUNG_NOM`, `ZAHLWORT`, `JEDEN`, `EINEN`, `menge(n, ding)`.

| Feld | Inhalt |
| --- | --- |
| `frage` | Auftrag, kurz, Du-Form, wird vorgesprochen. |
| `sprich` | optional: Sprechfassung, wenn sie abweicht (z. B. die gezeigten Zahlen vorsprechen: «Zähle weiter: 7 … 8 … Welche Zahl kommt?»). |
| `zeige` | Was als Text sichtbar ist: die Rechnung, Teile durch Leerzeichen getrennt (`3 + 4 = _`). `_` ist ein Antwortfeld, `○` der Platz für ein Vergleichszeichen. Eine Liste ergibt mehrere Zeilen (Hilfsrechnung oben, Aufgabe unten: `['3 + 4 = 7', '13 + 4 = _']`); die `_` zählen über alle Zeilen. Zahlen, Zeichen und Bilder (Emoji) darf das Kind sehen, Wörter nur in Deutsch-Leseaufgaben. |
| Lösung | je nach Typ (`loesung`, `richtig`, `paare` …). **Immer im Code berechnet.** |
| `hinweis` | Denkanstoss nach dem ersten Fehler, mit den Zahlen der Aufgabe («Zähle von 5 aus weiter.»). Verrät das Ergebnis nicht. |
| `erklaerung` | Lösung und Weg in ein bis zwei Sätzen, gesprochen («5 und 3 sind 8.»). |
| `visual` | Darstellung (Liste unten). |
| `visualNachFehler` | optional: Darstellung, die erst nach dem ersten Fehler erscheint (statt `visual` oder zusätzlich darunter). |
| `sig` | Signatur über `sig(…)` aus den bestimmenden Zahlen (Vielfalt, keine Wiederholung). |
| `daten` | Rohzahlen, damit ein Test die Lösung auf einem zweiten Weg nachrechnen kann. |
| `fehlerbilder` | über `fehlerbilder(loesung, bis, [falsch, 'Erklärung'], …)`, aus den Zahlen der Aufgabe berechnet. Bei Auswahl ist `falsch` der Wert der Option. |
| `bilder` | optional: alle verwendeten Emoji. |

### Felder je Typ (Mathematik)

- **`zahl`**: `loesung` (Zahl oder Liste, eine Zahl je Antwortfeld), `bis` (= `ctx.bis`, bestimmt das Zahlenfeld: Tasten 0 bis 10, 0 bis 20 oder Ziffern 0 bis 9 für grössere Zahlen). **Antwortfelder** sind die `_` in `zeige`; hat `zeige` keine, dann die `'?'` in der Darstellung (Zahlenreihe, Zahlenhaus, Zahlenmauer, Zahlenstrahl-Marke, Schüttelbox) in Lesereihenfolge (Reihen von oben nach unten, je von links nach rechts); sonst ein Feld unter der Darstellung. Optional `einheit` («Fr.», «cm»).
- **`wahl-bild`**: `optionen` (2 bis 4) als `{ visual }`, `{ bild }` (Emoji, mit `wort` wird es vor der Antwort genannt) oder `{ text }` (Zahl oder Zeichen), `richtig` (Index).
- **`wahl-wort`**: `optionen` als Texte (Zahlen, `<`, `=`, `>`, kurze Rechnungen), `richtig`; optional `vorlesen` (wird vorgesprochen, z. B. eine Zahl).
- **`zaehlen`**: `dinge: [{ bild, x, y }]` (Lage 0 bis 1, über `streue` oder `reihen`), `anzahl`, `antwort` (`'wahl'` mit `optionen` und `richtig`, oder `'zahlenfeld'` mit `zahlenfeld` 10 oder 20).
- **`reihenfolge`**: `teile` in der richtigen Folge (Texte oder `{ visual }`/`{ bild }`), `art` (`text`, `bild`, `visual`), `richtung` (`auf` oder `ab`, als Pfeil gezeigt), optional `alternativen`.
- **`legen`**: `kacheln` (Texte; Pfeile als `pfeil:rechts`, `pfeil:links`, `pfeil:oben`, `pfeil:unten`), `loesung` (Liste), optional `alternativen`, `felder` (Anzahl Ablagefelder, Standard Länge der Lösung), `vorlage` (feste Teile, `null` = Feld, z. B. `[null, '+', null, '=', 7]`).
- **`menge-legen`**: `ziel`, `feld` (`zehner`, `zwanziger`, `zehnereiner`, `muenzen`), `start` (schon gelegte Plättchen, für «wegnehmen» grösser als `ziel`), `struktur` (`true`: volle Fünfergruppen und höchstens eine angefangene, von links her), bei `muenzen` die verfügbaren Werte in Rappen (`muenzen`) und `ziel` in Rappen. Im Zehnerfeld ist die obere Reihe rot, die untere blau; im Zwanzigerfeld je die erste Fünfergruppe einer Reihe rot, die zweite blau.
- **`antippen`**: `visual` mit antippbaren Stellen (Zahlenstrahl: Striche; Gitter und Spiegel: Kästchen `"x,y"`; Formen: Index), `loesung` (Liste der Werte), optional `einzeln: true` (nur eine Stelle).
- **`hoeren-tippen`**: `auftrag` (gesprochen), `szene` (`{ art: 'reihe', start: '🚩', elemente: [{ id, bild, name }] }` oder `{ art: 'frei', elemente: [{ id, bild, x, y, w }] }`), `loesung` (IDs in der Reihenfolge des Antippens), optional `reihenfolge: false`.
- **`muster`**: `folge` (Elemente `{ farbe, form }` oder Zahlen; `'?'` markiert die Lücke, Standard am Ende), `optionen`, `richtig`.
- **`zuordnen`**: `paare: [[a, b], …]` (2 bis 4), Elemente `{ text }`, `{ zahl }`, `{ bild }` oder `{ visual }`. Rechte Seite wird gemischt angezeigt.
- **`nachspuren`**: `zeichen` (Ziffer), `hilfe` (`pfeile`, `start`, `keine`).

## Darstellungen (nur diese Arten, genau diese Felder)

```js
{ art: 'zehnerfeld', rot: 5, blau: 2, weg: 0 }                 // 2 × 5, Fünferstruktur; weg = durchgestrichene Plättchen (von rechts)
{ art: 'zwanzigerfeld', rot: 10, blau: 3, weg: 0 }             // 2 Reihen × 10, Fünferstruktur
{ art: 'wuerfelbild', n: 5 }                                   // 1 bis 6; zwei Würfel: { art: 'wuerfelbild', n: [5, 3] }
{ art: 'fingerbild', n: 7 }                                     // zwei Hände, 0 bis 10 (eigene SVG)
{ art: 'plaettchen', rot: 4, blau: 3, weg: 0, anordnung: 'reihe' | 'frei' }
{ art: 'dinge', bild: '🍎', n: 6, weg: 2, gruppen: [3, 3] }     // Emoji aus dem Wortlexikon
{ art: 'zehnerstreifen', zehner: 1, einer: 6 }
{ art: 'zerlegungshaus', dach: 7, zeilen: [[3, 4], [5, '?']] }    // dach darf auch '?' sein
{ art: 'schuettelbox', n: 6, sichtbar: 2 }                     // Teil unter dem Deckel ist verborgen
{ art: 'zahlenstrahl', von: 0, bis: 20, beschrift: 'alle' | 'fuenfer' | 'enden' | [0, 10, 20], marken: [{ x: 13, text: '?' }], spruenge: [{ von: 8, nach: 10 }] }
{ art: 'rechenstrich', start: 8, spruenge: [2, 3], beschrift: true } // leere Zahlengerade für den Zehnerstopp
{ art: 'zahlenmauer', reihen: [['?'], [3, 4]] }                  // oberste Reihe zuerst
{ art: 'geld', stuecke: [{ wert: 200, art: 'muenze' }, { wert: 1000, art: 'note' }] } // Werte in Rappen; eigene, vereinfachte SVG-Münzen und -Noten mit Wertangabe, keine Nachbildung echter Noten
{ art: 'uhr', h: 7, m: 30 }                                      // analoge Uhr, nur volle und halbe Stunden
{ art: 'waage', links: '🐘', rechts: '🐭', neigung: 'links' | 'rechts' | 'gleich', zweite: { links, rechts, neigung } } // neigung = Seite, die tiefer hängt; zweite = zweite Waage daneben
{ art: 'strichliste', zeilen: [{ bild: '🍎', n: 7 }] }
{ art: 'bilddiagramm', spalten: [{ bild: '🍎', n: 4 }, { bild: '🍐', n: 6 }] }   // Säulen aus Bildern, unten das Bild als Beschriftung
{ art: 'formen', liste: [{ form: 'kreis' | 'dreieck' | 'quadrat' | 'rechteck', farbe: 'rot', groesse: 1, drehung: 0, x: 0.2, y: 0.3 }] } // x, y Mittelpunkt (0 bis 1, y nach unten), drehung in Grad, antippbar mit Index als Text
{ art: 'koerper', form: 'wuerfel' | 'kugel' | 'quader' | 'zylinder' }
{ art: 'gitter', b: 5, h: 4, start: [0, 0], pfeile: ['rechts', 'rechts', 'oben'], hindernisse: [[2, 1]], ziele: [{ x: 3, y: 2, bild: '🍎' }] } // x nach rechts, y nach unten; 'oben' = y − 1; Start ist der Fuchs, Hindernisse sind Steine
{ art: 'spiegel', b: 6, h: 4, figur: [[0, 0], [1, 0]], achse: 3 }   // Achse links von Spalte «achse»; Spiegelbild von x ist 2·achse − 1 − x; antippbar sind die Kästchen rechts der Achse ("x,y")
{ art: 'laengen', staebe: [{ laenge: 7, farbe: 'rot' }], einheit: 'kaestchen' | 'cm' }
{ art: 'reihe', teile: [7, 8, '?'] }                              // Zahlensteine in einer Reihe; '?' ist ein Antwortfeld
```

Andere Darstellungen nur nach Ergänzung dieser Liste.

## Inhaltliche Regeln

1. Jede Stufe folgt genau ihrem Text im Katalog (`stufen.<n>.text`); Beispiele in Klammern zeigen die gemeinte Grösse.
2. Keine negativen Zahlen. Kein `+ 0`, `− 0`, kein Ergebnis 0, ausser die Stufe verlangt es (M-RE-04 Stufe 3). Zerlegungen ohne 0 auf Stufe 1 und 2; auf Stufe 3 von M-ZE-02 gehören «0 und 7» und «7 und 0» zu «alle Zerlegungen» (Annahme, bei der Lehrperson zu prüfen).
3. Mindestens 15 verschiedene Aufgaben pro Stufe, wo der Zahlenraum das zulässt; sonst alle möglichen. Abwechslung über Darstellung (Bild, Rechnung, Geschichte) statt über grössere Zahlen.
4. Ablenker bei Auswahl: plausibel und eindeutig falsch, aus typischen Fehlern abgeleitet (eins daneben, falsche Rechenart, Zahlendreher).
5. Fehlerbilder sind Pflicht bei Rechnen und Zahlen lesen: eins zu viel oder zu wenig (Startzahl mitgezählt), Plus statt Minus, Zahlendreher (17 und 71), Zehnerübergang (8 + 5 = 12 oder 14), Minus über 10 mit vertauschten Einern (13 − 5 = 12 statt 8, weil 5 − 3 gerechnet wurde).
6. Rechengeschichten: Alltag eines Kindes in der Schweiz (Znüni, Pausenplatz, Spielplatz, Bäckerei, Bauernhof, Wald, Velo). Namen aus `NAMEN` (ohne die Namen der Familie). Zwei bis drei kurze Sätze, gesprochen; das Bild zeigt die Mengen.
7. Lagewörter (M-FO-04): links und rechts aus Sicht des Kindes. «Zwischen» nur mit genau zwei eindeutigen Nachbarn. Ordnungszahlen (M-ZA-09): Die Reihe hat einen sichtbaren Anfang (Fahne oder Ziel), gezählt wird von dort.
8. Formen (M-FO-01): Ein Quadrat ist auch ein Rechteck und ein Viereck. Gefragt wird nie nach «Rechteck» oder «Viereck», wenn ein Quadrat unter den Bildern ist; auf Stufe 1 ist «Viereck» die Lösung und kein weiteres Viereck in der Auswahl.
9. Zahlen lesen (M-ME-04): Zahlendreher als Ablenker (17 und 71) nur, wenn der Zahlenraum 100 freigegeben ist.

## Sprache und Schreibweisen

- Standarddeutsch in Schweizer Rechtschreibung (nie «ß»), Du-Form, kurze Sätze.
- Begriffe wie im Lehrmittel: plus, minus, gleich, Zehner, Einer, Nachbarzahl, Zahlenstrahl, Zahlenmauer; Felder und Häuser über `ctx.begriffe` (z. B. «Zwanzigerfeld», «Zahlenhaus»), damit die Familie sie an die Wörter der Klasse anpassen kann.
- Rechenzeichen `+`, `−` (U+2212), `=`, `<`, `>`. Platzhalter als Kästchen (`_` in `zeige`, die Darstellung zeichnet ein Kästchen).
- Geld: «5 Fr.», «50 Rp.», gesprochen «5 Franken», «50 Rappen». Uhr: «7 Uhr», «halb 8» (gesprochen «halb acht»).

## Tests (Pflicht)

1. `node tools/teste_mathe.mjs <gruppe>`: je Stufe 200 Aufgaben mit verschiedenen Startwerten und den Zahlenräumen 10, 20, 100. Geprüft: Lösung vorhanden und eindeutig, Ablenker verschieden und falsch, keine Zahl über `min(raum, grenze)`, keine negative Zahl, Darstellung passt zu den Zahlen (z. B. Plättchen zählen ergibt die Angabe), Vielfalt (Anzahl verschiedener Signaturen), keine «ß».
2. `tools/tests/mathe-<gruppe>.test.mjs` mit `node:test`: für jede Stufe 300 Startwerte, Lösung **auf einem zweiten Weg** aus `daten` nachrechnen (Durchzählen, Umkehraufgabe, Rechnen mit Plättchen-Arrays).
3. `node tools/zeige_mathe.mjs <gruppe> 3` ausgeben und jede Stufe wie eine Lehrperson der Unterstufe lesen: Stimmt die Lösung? Ist der Auftrag für ein Kind von sechs Jahren eindeutig, wenn es ihn nur hört? Passt die Darstellung?

## Schlussbericht (kurz)

Erledigte Fertigkeiten und Stufen, Testergebnisse, bewusste Abweichungen vom Stufentext, genutzte Darstellungen, offene Zweifel.
