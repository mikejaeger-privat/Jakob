# Mathematik-Generatoren (Zyklus 1): Auftrag und Regeln

Jede Fertigkeit im Katalog (`site/data/katalog/mathe.json`) braucht pro Stufe einen Generator. Bausteine: `site/js/math/lib.js`. Antwortprüfung: `site/js/core/pruefen.js`. Aufgabentypen und Ablauf: `tools/SPEC-AUFGABEN.md`.

## Vertrag

Datei `site/js/math/<gruppe>.js` (ES-Modul, Abhängigkeiten nur `./lib.js` und `../core/util.js`):

```js
import { A, sig, optionen, fehlerbilder, NAMEN } from './lib.js';
export const generatoren = {
  'M-RE-03': { 1: (r, ctx) => A.zahl({ … }), 2: (r, ctx) => …, 3: (r, ctx) => … },
};
```

- `r` ist der Zufallsgenerator (`int(a, b)`, `pick(arr)`, `bool(p)`, `shuffle(arr)`, `sample(arr, n)`, `next()`). Nie `Math.random` oder das Datum: Gleicher Startwert ergibt dieselbe Aufgabe.
- `ctx.grenze` ist der im Elternbereich freigegebene Zahlenraum (10, 20 oder 100), `ctx.begriffe` die gesprochenen Fachbegriffe aus `parameter.json`, `ctx.stimme` sagt, ob eine deutsche Stimme da ist.
- Alle Zahlen einer Aufgabe (Angaben, Lösung, Zwischenschritte, Ablenker, Beschriftungen) sind höchstens `min(raum der Stufe, ctx.grenze)`. Ist das nicht möglich, gibt der Generator `null` zurück. Einzige Ausnahme: Stufen mit `ausnahme: "muenzwerte"` zeigen Rappen-Münzen (5 bis 50 Rp.), deren Wert nur erkannt und verglichen, nicht gerechnet wird. Geldbeträge in Rechenaufgaben sind ganze Franken bis zur Grenze.
- Rückgabe über die Helfer `A.zahl`, `A.wahlWort`, `A.wahlBild`, `A.zuordnen`, `A.legen`, `A.reihenfolge`, `A.muster`, `A.zaehlen`, `A.mengeLegen`, `A.antippen`, `A.hoerenTippen`. Die Felder sind die des Typs in `SPEC-AUFGABEN.md`, dazu:

| Feld | Inhalt |
| --- | --- |
| `frage` | Auftrag, kurz, Du-Form, wird vorgesprochen. |
| `zeige` | Was als Text sichtbar ist: die Rechnung (`3 + 4 = ?`), eine Zahl. Zahlen und Zeichen darf das Kind sehen, Wörter nur in Deutsch-Leseaufgaben. |
| Lösung | je nach Typ (`loesung`, `richtig`, `paare` …). **Immer im Code berechnet.** |
| `hinweis` | Denkanstoss nach dem ersten Fehler, mit den Zahlen der Aufgabe («Zähle von 5 aus weiter.»). Verrät das Ergebnis nicht. |
| `erklaerung` | Lösung und Weg in ein bis zwei Sätzen, gesprochen, möglichst mit Darstellung («5 und 3 sind 8. Schau, 5 rote und 3 blaue Plättchen.»). |
| `visual` | Darstellung (Liste unten). |
| `visualNachFehler` | optional: Darstellung, die erst nach dem ersten Fehler erscheint. |
| `sig` | Signatur über `sig(…)` aus den bestimmenden Zahlen. |
| `daten` | Rohzahlen, damit ein Test die Lösung auf einem zweiten Weg nachrechnen kann. |
| `fehlerbilder` | über `fehlerbilder(loesung, [falsch, 'Erklärung'], …)`, aus den Zahlen der Aufgabe berechnet. |

## Darstellungen (nur diese Arten, genau diese Felder)

```js
{ art: 'zehnerfeld', rot: 5, blau: 2, weg: 0 }                 // 2 × 5, Fünferstruktur; weg = durchgestrichene Plättchen (von rechts)
{ art: 'zwanzigerfeld', rot: 10, blau: 3, weg: 0 }             // 2 Reihen × 10, Fünferstruktur
{ art: 'wuerfelbild', n: 5 }                                   // 1 bis 6; zwei Würfel: { art: 'wuerfelbild', n: [5, 3] }
{ art: 'fingerbild', n: 7 }                                     // zwei Hände, 0 bis 10 (eigene SVG)
{ art: 'plaettchen', rot: 4, blau: 3, weg: 0, anordnung: 'reihe' | 'frei' }
{ art: 'dinge', bild: '🍎', n: 6, weg: 2, gruppen: [3, 3] }     // Emoji aus dem Wortlexikon
{ art: 'zehnerstreifen', zehner: 1, einer: 6 }
{ art: 'zerlegungshaus', dach: 7, zeilen: [[3, 4], [5, '?']] }
{ art: 'schuettelbox', n: 6, sichtbar: 2 }                     // Teil unter dem Deckel ist verborgen
{ art: 'zahlenstrahl', von: 0, bis: 20, beschrift: 'alle' | 'fuenfer' | 'enden' | [0, 10, 20], marken: [{ x: 13, text: '?' }], spruenge: [{ von: 8, nach: 10 }] }
{ art: 'rechenstrich', start: 8, spruenge: [2, 3], beschrift: true } // leere Zahlengerade für den Zehnerstopp
{ art: 'zahlenmauer', reihen: [['?'], [3, 4]] }                  // oberste Reihe zuerst
{ art: 'geld', stuecke: [{ wert: 200, art: 'muenze' }, { wert: 1000, art: 'note' }] } // Werte in Rappen; eigene, vereinfachte SVG-Münzen und -Noten mit Wertangabe, keine Nachbildung echter Noten
{ art: 'uhr', h: 7, m: 30 }                                      // analoge Uhr, nur volle und halbe Stunden
{ art: 'waage', links: '🐘', rechts: '🐭', neigung: 'links' | 'rechts' | 'gleich' }
{ art: 'strichliste', zeilen: [{ bild: '🍎', n: 7 }] }
{ art: 'bilddiagramm', spalten: [{ bild: '🍎', n: 4 }, { bild: '🍐', n: 6 }] }
{ art: 'formen', liste: [{ form: 'kreis' | 'dreieck' | 'quadrat' | 'rechteck', farbe: 'rot', groesse: 1, drehung: 0, x: 0.2, y: 0.3 }] }
{ art: 'koerper', form: 'wuerfel' | 'kugel' | 'quader' | 'zylinder' }
{ art: 'gitter', b: 5, h: 4, start: [0, 0], pfeile: ['rechts', 'rechts', 'oben'], hindernisse: [[2, 1]], ziele: [{ x: 3, y: 2, bild: '🍎' }] }
{ art: 'spiegel', b: 6, h: 4, figur: [[0, 0], [1, 0]], achse: 3 }
{ art: 'laengen', staebe: [{ laenge: 7, farbe: 'rot' }], einheit: 'kaestchen' | 'cm' }
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
