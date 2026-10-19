# Aufgaben: Typen, Schema, Ablauf (Zyklus 1)

Gilt für alle Aufgaben, egal ob sie aus einem Mathe-Generator, einem Wortgenerator (Deutsch, aus dem Wortlexikon) oder aus einer festen Inhaltsdatei kommen. Zur Laufzeit sehen alle Aufgaben gleich aus. Die Bausteine für die Darstellung liegen in `site/js/ui/` und werden in beiden Fächern verwendet.

## 1. Grundsätze für den Kinderbereich

- Das Kind kann zu Beginn nicht lesen. Jeder Auftrag, jeder Hinweis, jede Erklärung und jede Rückmeldung wird vorgesprochen. Angezeigter Text gibt es nur dort, wo er gelesen werden soll (Lese- und Schreibaufgaben) oder wo er Zahl oder Zeichen ist.
- Pro Bildschirm eine Aufgabe und höchstens eine Entscheidung. Immer an derselben Stelle: Lautsprecher (nochmals hören) oben links, Fragezeichen (Hilfe) oben rechts, Pfeil (weiter) unten rechts, Haken (fertig) unten Mitte, wo eine Aufgabe ihn braucht.
- Zielflächen mindestens 64 × 64 px, Abstand mindestens 16 px. Keine Systemtastatur, keine Doppeltipps, Wischen nie als einzige Möglichkeit. Ziehen geht immer auch mit Tipp-Tipp (zuerst das Teil, dann das Ziel).
- Schrift im Kinderbereich: Andika (lokal eingebettet), mindestens 28 px, Lesewörter mindestens 40 px.
- Wörter, die im Kinderbereich nicht vorkommen (weder gesprochen noch geschrieben): Test, Prüfung, Stufe, Niveau, Fehler, falsch, Punkte, Note.

## 2. Das Aufgabenobjekt

```js
{
  id: 'D-LE-03-1-w-rose',        // eindeutig; Generatoren: <Fertigkeit>-<Stufe>-<Signatur>
  f: 'D-LE-03',                  // Fertigkeit
  s: 1,                          // Stufe
  typ: 'bild-wort',
  frage: 'Lies das Wort. Welches Bild passt?',  // Auftrag; wird vorgesprochen
  sprich: null,                  // optional: Sprechfassung, wenn sie vom Auftrag abweicht (Pausen mit « … »)
  zeige: 'Rose',                 // optional: Text, der gelesen werden soll (nie vor der Antwort vorlesen)
  bilder: ['🌹', '🐇', '🚌'],    // alle verwendeten Bilder (Prüfung, Vorladen)
  braucht: ['r', 'o', 's', 'e'], // angezeigte Buchstaben und Verbindungen (Buchstabenfreigabe)
  hinweis: 'Lies Silbe für Silbe: Ro … se.',
  erklaerung: 'Da steht Rose. Die Rose ist eine Blume.',
  fehlerbilder: [],              // optional: [{ eingabe, text }]
  pool: 'training',              // 'training' (Standard)
  sig: 'rose|hase|bus',          // Generatoren: Signatur gegen Wiederholungen
  daten: {},                     // Generatoren: Rohdaten zum unabhängigen Nachrechnen
  // … Felder des Typs (Abschnitt 4)
}
```

| Feld | Pflicht | Regel |
| --- | --- | --- |
| `frage` | ja | Du-Form, ein kurzer Satz, Standarddeutsch. Wird automatisch vorgesprochen, sobald die Aufgabe erscheint (und mit dem Lautsprecher-Knopf erneut). |
| `sprich` | nein | Nur wenn die Sprechfassung abweicht, z. B. «Was reimt sich auf … Maus?». `…` erzeugt eine Pause (Parameter `pauseZwischenTeilenMs`). |
| `zeige` | bei Lesen/Schreiben | Text oder Liste (Silben, Wörter). Wird erst nach der Antwort vorgesprochen. |
| `braucht` | wenn `zeige` oder Buchstaben-Kacheln vorkommen | Kleingeschrieben, Buchstaben und Verbindungen nach `site/data/buchstaben.json`. Die App spielt die Aufgabe nur, wenn alle eingeführt sind. Für feste Inhalte prüft `tools/pruefe_inhalte.mjs`, dass `braucht` zur Schreibung passt. |
| `hinweis` | ja | Hilft beim Denken, verrät die Lösung nicht. Gesprochen. |
| `erklaerung` | ja | Nennt die Lösung und warum, ein bis zwei kurze Sätze. Gesprochen, mit hervorgehobener Lösung. |
| `fehlerbilder` | nein | Typische falsche Antwort und eine gezielte, freundliche Erklärung. |

## 3. Ablauf einer Aufgabe

1. Die Aufgabe erscheint; der Auftrag wird vorgesprochen. Bei Bildwahl-Aufgaben mit Wörtern nennt die App zuerst die Bilder («Maus. Hund. Haus.»), jedes Bild leuchtet dabei kurz auf (`namenSprechen`, Standard bei Höraufgaben).
2. **Richtig im ersten Versuch:** kurze, leise Bestätigung (Animation, Ton über Web Audio API), Wert 1.
3. **Erster Fehler:** freundlicher Hinweis («Schau nochmals.», «Hör genau hin.» plus `hinweis` bzw. passendes Fehlerbild), die Aufgabe wird leichter (siehe Typ: Auswahl kleiner, Entscheidendes hervorgehoben), zweiter Versuch. Richtig danach: Wert 0.5.
4. **Zweiter Fehler:** Die Lösung wird gezeigt und erklärt (`erklaerung`, gesprochen, Lösung hervorgehoben), dann Pfeil «weiter». Wert 0. Später in derselben Sitzung kommt eine leichtere Aufgabe derselben Fertigkeit (eine Stufe tiefer oder gleiche Stufe mit weniger Auswahl).
5. **Hilfe-Knopf** (Fragezeichen) vor der Antwort: spricht den Hinweis und erleichtert wie nach einem Fehler. Eine Antwort danach zählt wie «nach Hinweis».
6. **Unvollständige Antwort** (leere Felder, offene Paare) verbraucht keinen Versuch; der Haken bleibt grau.
7. Kein rotes Kreuz, kein Fehlerzähler, kein Tadel-Ton. Die Figur freut sich über Einsatz, nicht über Richtigkeit.
8. **Zeig-was-du-kannst-Runde:** ein Versuch pro Aufgabe, kein Hinweis, kein Hilfe-Knopf. Nach einer falschen Antwort zeigt die App ruhig die Lösung («So ist es.») und geht weiter. Für das Kind sieht die Runde aus wie jede andere, am Ende gibt es einen kleinen Stern.

## 4. Aufgabentypen

Für jeden Typ: Felder, Darstellung, Eingabe, Prüfung, Erleichterung nach dem ersten Fehler, Verhalten ohne Stimme.

### `wahl-bild`
- Felder: `optionen: [{ bild, wort?, szene? }]` (2 bis 4), `richtig` (Index), `namenSprechen` (Standard `true`, wenn `wort` gesetzt).
- Darstellung: grosse Bildkarten ohne Text. `szene` statt `bild` für zusammengesetzte Bilder (Abschnitt 6).
- Eingabe: Antippen ist die Antwort.
- Erleichterung: Die gewählte falsche Karte und bei vier Karten eine weitere falsche verschwinden.
- Ohne Stimme: nur Aufgaben, deren Auftrag ohne Ton verständlich ist (Katalog `stimme: "ohne"`).

### `wahl-wort`
- Felder: `vorlesen` (was gesprochen wird: Wort, Silbe, Zahl; bei Buchstaben das Anlautwort), `optionen: [text]` (2 bis 4 geschriebene Buchstaben, Silben, Wörter, Ziffern oder Zeichen `<`, `=`, `>`), `richtig`.
- Darstellung: grosse Textkarten in Andika.
- Erleichterung: eine falsche Karte verschwindet; bei Buchstaben wird das Anlautbild gezeigt.

### `wahl-hoeren`
- Felder: `optionen: [{ sprich, farbe }]` (2 bis 3 Hörkarten), `richtig`.
- Darstellung: Karten mit Lautsprecher und Farbe, ohne Text.
- Eingabe: Antippen spielt die Karte ab und wählt sie; der Haken bestätigt.
- Erleichterung: eine falsche Karte verschwindet.

### `bild-wort`
- Felder: `zeige` (Wort oder Satz), `silbenboegen` (`true` zeigt Bögen unter den Silben aus `silben`), `optionen: [{ bild | szene }]`, `richtig`.
- Darstellung: Lesetext gross oben, Bildkarten darunter. Der Text wird erst nach der Antwort vorgesprochen.
- Erleichterung: eine falsche Karte verschwindet; zusätzlich Silbenbögen einblenden (falls nicht schon da).
- Ohne Stimme spielbar.

### `zuordnen`
- Felder: `paare: [[a, b], …]` (2 bis 4). Ein Element ist `{ text }`, `{ bild }`, `{ zahl }`, `{ menge: { art, n } }` oder `{ buchstabe }`.
- Eingabe: links antippen, dann rechts (oder ziehen). Ein richtiges Paar bekommt eine gemeinsame Farbe und bleibt.
- Prüfung: Jede falsche Verbindung ist ein Fehlversuch der Aufgabe. Nach dem ersten bleibt alles Richtige stehen, das falsche Teil springt zurück. Nach dem zweiten zeigt die App die übrigen Paare.
- Bei Bildern wird der Name beim Antippen gesprochen (Reimpaare).

### `legen`
- Felder: `kacheln: [text]` (Buchstaben, Verbindungen als eine Kachel, Silben, Wörter, Ziffern, Zeichen), `loesung: [text]`, `alternativen: [[text]]`, `felder` (Anzahl Ablagefelder; als Laut- oder Silbenkästchen gezeichnet), `vorlage` (sichtbarer Text beim Abschreiben), `verdecken` (`true`: Blitzwort, das Kind verdeckt die Vorlage selbst mit dem Augen-Knopf; kein Zeitlimit), `vorlesen` (gesprochenes Wort oder gesprochene Rechnung), `anlauttabelle` (`true`: Hilfe zeigt die Anlauttabelle mit den eingeführten Buchstaben).
- Eingabe: Kachel antippen legt sie ins nächste freie Feld; ein volles Feld antippen nimmt die Kachel zurück. Haken, wenn alle Felder voll sind.
- Prüfung: genaue Folge, Gross- und Kleinschreibung zählt (Nomen beginnen mit Grossbuchstaben; die Kachel ist entsprechend beschriftet).
- Erleichterung: Richtige Kacheln bleiben liegen, falsche springen zurück; der Hinweis spricht das Wort Silbe für Silbe.

### `nachspuren`
- Felder: `zeichen` (ein Buchstabe oder eine Ziffer) oder `wort`, `hilfe` (`pfeile`, `start`, `keine`).
- Vorlage: eigene SVG-Pfade je Zeichen in `site/data/schrift/basisschrift.json`, angelehnt an die unverbundene Deutschschweizer Basisschrift: Striche in Reihenfolge, Startpunkt, Richtung, Hilfslinien (Grund-, Mittel-, Oberlinie).
- Prüfung (tolerant, in `site/js/core/nachspur.js`): Anteil der Vorlage, der vom Finger überdeckt wurde (Toleranz 12 % der Zeilenhöhe), mindestens 70 %; jeder Strich in grober Richtung (Beginn näher am Startpunkt als am Ende). Strichreihenfolge wird nur als Hinweis verwendet.
- Drei Versuche, nie «falsch»: Nach dem dritten sagt die App «Gut geübt!» und geht weiter. Ergebnis «geübt» (zählt nicht in den Wert, nur als Übung).
- Ohne Stimme spielbar.

### `zahl`
- Felder: `loesung` (Zahl), `zahlenfeld` (`10` oder `20`: Tasten 0 bis 10 bzw. 0 bis 20), `visual` (Darstellung nach `SPEC-MATHE.md`), optional `einheit` («Fr.», «cm»).
- Eingabe: Taste antippen, die Zahl erscheint gross im Antwortfeld und wird gesprochen; Haken bestätigt.
- Erleichterung: Das Zahlenfeld zeigt nur noch die Zahlen in der Nähe der Lösung (mindestens fünf), oder eine Darstellung wird eingeblendet (`visualNachFehler`).

### `zaehlen`
- Felder: `dinge: [{ bild, x, y }]` (Lage 0 bis 1), `anzahl`, `antwort` (`zahlenfeld` oder `wahl`).
- Eingabe: Jedes Antippen markiert ein Ding und spricht die nächste Zahl; «nochmals zählen» löscht die Markierungen. Danach Anzahl wählen.
- Prüfung: gewählte Zahl gleich `anzahl`.

### `menge-legen`
- Felder: `ziel` (Anzahl), `feld` (`zehner`, `zwanziger`, `reihe`, `lautreihe`, `wortreihe`, `muenzen`), `start` (schon gelegte Plättchen), `farben` (zwei Farben: zuerst fünf rot, dann blau), `struktur` (`true`: Fünferstruktur muss eingehalten sein), `vorlesen` (Wort oder Satz bei `lautreihe`/`wortreihe`), bei `muenzen`: `muenzen` (verfügbare Werte in Rappen) und `ziel` in Rappen.
- Eingabe: freies Feld antippen legt ein Plättchen, Plättchen antippen nimmt es weg; Haken.
- Prüfung: Anzahl bzw. Betrag gleich `ziel` (und Struktur, falls verlangt).

### `reihenfolge`
- Felder: `teile` (richtige Folge; Text, Bild oder Hörkarte), `art` (`text`, `bild`, `hoeren`), `alternativen`, `richtung` (`auf` oder `ab`, als Pfeil gezeigt).
- Eingabe: Karten in der richtigen Reihenfolge antippen (sie rücken in eine Zeile) oder ziehen.
- Erleichterung: Die ersten richtig gelegten Karten bleiben, der Rest kommt zurück.

### `muster`
- Felder: `folge` (Elemente `{ farbe, form }` oder Zahlen), `luecke` (Index, Standard: Ende), `optionen`, `richtig`.

### `hoeren-tippen`
- Felder: `szene: { elemente: [{ id, bild, x, y, w }], orte: [{ id, x, y, w, h }] }`, `auftrag` (gesprochen), `loesung` (Folge von Element-IDs zum Antippen) oder `ziehen: [{ element, ort }]`.
- Prüfung: genaue Folge bzw. Ziel. Lagen (oben, links, zwischen …) berechnet der Generator aus den Koordinaten.

### `silben`
- Felder: `modus` (`zaehlen` oder `verbinden`). `zaehlen`: `wort`, `bild`; das Kind tippt für jede Silbe einmal auf die Trommel (jeder Tipp klingt und zeichnet einen Bogen), dann Haken; oder wählt eine von vier Bogen-Karten (1 bis 4). `verbinden`: `silben` (gemischt), `bild` (optional); das Kind tippt die Silbenkarten in Leserichtung an (Bogen und Pfeil).
- Prüfung: Anzahl bzw. Reihenfolge.

### `vorlesen`
- Felder: `zeige` (Wort oder Satz).
- Ablauf: Das Kind liest einer erwachsenen Person vor; diese tippt «geklappt» oder «üben wir noch». Ergebnis «richtig» bzw. «geübt», nie «falsch». Höchstens eine pro Sitzung und nur, wenn im Elternbereich eingeschaltet (Standard: aus).

### `antippen`
- Felder: `zeige` (Wort, Satz, Zahlenstrahl, Gitter), `ziel` (was gesucht ist), `loesung` (Indizes aller richtigen Stellen).
- Eingabe: Stellen antippen (markieren und wieder entmarkieren), Haken.
- Prüfung: Menge gleich `loesung`. Erleichterung: richtige Markierungen bleiben.

### `lautplatz`
- Felder: `wort` (gesprochen, mit `bild`), `laut` (der gezeigte Buchstabe), `plaetze` (`2`: vorne, hinten; `3`: vorne, Mitte, hinten), `nicht` (`true`: zusätzliche Karte «gar nicht»), `loesung` (`vorne`, `mitte`, `hinten`, `nicht`).
- Darstellung: Bild, Buchstabe, darunter ein Zug mit zwei oder drei Wagen.
- Generatorregel: Der Laut kommt im Wort höchstens einmal als eigene Lauteinheit vor (in «Schaf» kommt «s» nicht vor).

## 5. Sprachausgabe

- Gesprochen wird `sprich`, sonst `frage`, mit der Stimme des Geräts (`speechSynthesis`), Reihenfolge der Stimmen nach `parameter.json` (`de-CH`, `de-DE`, …), nur lokale Stimmen. Tempo nach Einstellung (Standard 0.85). Kein Überlappen: Jede neue Ausgabe bricht die laufende ab; Seitenwechsel bricht ab.
- iOS: Die erste Ausgabe muss aus einer Berührung kommen (grosser Start-Tipp am Anfang jeder Sitzung).
- Buchstaben werden nie allein gesprochen (die Stimme sagt «Be» statt /b/). Ein Laut wird immer über ein Wort angesprochen: «der Anfang von … Maus», oder der Buchstabe wird gezeigt.
- Dehnlaute («mmm», «sss») nur für dehnbare Laute (`buchstaben.json`, `dehnbar`) und nur, wenn im Elternbereich «Dehnlaute vorsprechen» eingeschaltet ist. Die Schreibweise für die Stimme steht in `parameter.json` (`dehnlautText`) und wird im Elternbereich mit einem Hörtest geprüft.
- Silben werden als einzelne Ausgaben mit Pause gesprochen («Ba … na … ne»).
- In Höraufgaben zu Anlaut, Endlaut, Reim und Silben werden Wörter **ohne Artikel** gesprochen (der Artikel verändert den ersten Laut). In Aufgaben zu Einzahl und Mehrzahl mit Artikel.
- Zahlen schreibt der Generator als Ziffern; die Stimme liest sie als Zahlwort.
- Anführungszeichen «» werden vor dem Sprechen entfernt.

## 6. Bilder

- Bildwörter kommen aus `site/data/woerter.json` (Feld `bild`, Emoji bis Version 13). Wo ein Emoji fehlt oder mehrdeutig ist: eigene SVG-Zeichnung in `site/img/`, Bezeichner `svg:<name>`.
- Nie zusammen in einer Aufgabe: ein Wort und ein Wort, dessen `art` es ist (Vogel und Taube, Blume und Rose, Auto und Taxi, Hund und Pudel); Paare aus `verwechselbar`.
- Wörter mit `nameUnsicher` (das Kind nennt das Bild oft anders: 🐞 «Marienkäfer», 🥕 «Rüebli», 🍪 «Guetzli») nur, wenn das Wort vor der Antwort gesprochen wird (`namenSprechen`, `vorlesen`) oder als Text dasteht (Lesen). Nie in Aufgaben, in denen das Kind den Namen des Bildes selbst wissen muss (D-BU-02, D-LE-01 Stufe 2, D-SC-04, Aufgaben ohne Stimme).
- Wörter mit `bildMehrere` (🍒, 🧦, 🧤 zeigen schon zwei) nicht für Einzahl und Mehrzahl und nicht zum Zählen.
- Zusammengesetzte Bilder (`szene`), nur diese Arten:
  - `{ art: 'menge', bild, anzahl }` – mehrere gleiche Dinge (Mehrzahl, Rechnen)
  - `{ art: 'lage', bild, bezug, lage }` – `lage`: `auf`, `unter`, `neben`, `in`, `vor`, `hinter`
  - `{ art: 'aktion', bild, zeichen }` – `zeichen`: `schlafen` (💤), `rennen` (💨), `essen` (🍽️)
  - `{ art: 'farbe', farbe }` – Farbklecks (eigene SVG); `farbe`: rot, blau, gelb, grün, orange, violett, braun, schwarz, weiss, rosa
  - `{ art: 'groesse', bild, gross }` – dasselbe Ding gross oder klein
- Die Maskottchen-Figur ist ein eigener SVG-Fuchs; keine bekannten Figuren.

## 7. Wortgeneratoren (Deutsch)

Datei `site/js/deutsch/<gruppe>.js`, Vertrag wie bei Mathematik:

```js
export const generatoren = {
  'D-HB-01': { 1: (r, ctx) => aufgabe, 2: (r, ctx) => …, 3: (r, ctx) => … },
};
```

`r` ist der Zufallsgenerator (nie `Math.random`). `ctx` enthält `lexikon`, `buchstaben` (Buchstabenplan), `freigabe` (Menge der eingeführten Buchstaben und Verbindungen), `dehnlaute` und `silben` (Einstellungen «Dehnlaute vorsprechen», «Silben einzeln vorsprechen»), `stimme` (boolean) und `zuletzt` (Signaturen der letzten 14 Tage). Ein Generator gibt `null` zurück, wenn mit der aktuellen Freigabe keine gültige Aufgabe möglich ist.

### Allgemeine Regeln

1. **Klänge, die gleich klingen oder von der Mundart abhängen,** sind nie zugleich Lösung und Ablenker: bei Anlaut und Endlaut die Paare in `woerter.json` → `klangNieZusammen` (a und ei, a und au, o und eu, e und ä, e und ə, i und ü, b und p, d und t, g und k, k und kw, f und v, f und pf, p und pf, w und v, s und z); bei Buchstaben und Verbindungen `nieZusammen` im Buchstabenplan (k und c, ck, q; z und tz; i und ie; eu und äu; sch und st, sp …). `aehnlichForm` und `aehnlichLaut` sind erst ab Stufe 3 Ablenker.
2. **Reime:** Ein Ablenker darf sich nicht reimen, auch wenn er keine `reim`-Gruppe hat. Geprüft wird der Reimteil: letzter Vokal und alles danach, als Klang vereinheitlicht (uh = u, ah = a, ee = e, ll = l, ss = s, tz = z, ck = k, d/g/b am Ende = t/k/p, ai = ei). Gleicher Reimteil = kein Ablenker (so fällt «Kanu» gegen «Kuh» weg).
3. **Laut im Wort (D-HB-05, D-BU-02 Stufe 3):** Ein Laut kommt vor, wenn er als eigene Einheit oder als Grundlaut einer Einheit vorkommt: Doppelkonsonant = Einzelbuchstabe (ll = l), ck = k, tz = z, ie = i, Vokal mit stummem h = Vokal, aa/ee/oo = Vokal. Wörter mit pf, x, chs, qu, nk, ng sind für die darin versteckten Laute gesperrt (f in Pferd, k in Anker, s in Fuchs). Für den Laut r nur Wörter, in denen r vor einem Vokal steht (die Stimme spricht r nach Vokal kaum).
4. **Bildnamen:** `nameUnsicher` und `bildMehrere` nach Abschnitt 6.
5. **Silben vorsprechen:** nur Wörter mit `silbenSprechbar` (keine Silbe mit unbetontem e: «So … fa», nicht «Ba … na … ne», weil die Stimme «ne» mit langem e spricht), und nur, wenn «Silben einzeln vorsprechen» eingeschaltet ist.
6. **Sichtwörter** gelten als Wortbilder: Sie sind von der Sperre durch nicht eingeführte Verbindungen ausgenommen («ich», «die», «nicht» kommen auch ohne ch und ie).

### Auswahl pro Fertigkeit

| Fertigkeit | Zielwörter | Ablenker |
| --- | --- | --- |
| D-HB-01 Reime | gleiche `reim`-Gruppe | ohne gleichen Reimteil (Regel 2); Stufe 2: ein Ablenker mit gleichem `anlaut` wie das gesprochene Wort; Stufe 3 nur Gruppen mit mindestens drei Wörtern |
| D-HB-02 Silben | Anzahl `silben` im Bereich der Stufe, ohne `silbenUnsicher` | Stufe 3: Bilder mit anderer Silbenzahl |
| D-HB-03 Anlaut | `anlaut` gleich; Stufe 1 nur `anlaut` in a, e, i, o, u, m, n, l, s, f, sch | andere `anlaut`, untereinander verschieden, Regel 1 |
| D-HB-04 Endlaut | `endlaut` gesetzt; Stufe 1: a, o, i, u; Stufe 2: m, n, l, s, f, sch | andere `endlaut`, Regel 1 (z klingt wie s, e wie ə) |
| D-HB-05 Laut im Wort | Laut kommt genau einmal vor (Regel 3) | – |
| D-HB-06 Laute zählen | `lautzaehlbar`, Anzahl `laute` im Bereich der Stufe | – |
| D-HB-07 Zusammenziehen | Stufe 1: `silbenSprechbar`, 2 bis 4 Silben; Stufe 2: einsilbig mit dehnbarem Anlaut; Stufe 3: alle Laute dehnbar, kein Schluss-e (Oma, Sofa, Lama, Ufo, Ananas) | gleiche Silbenzahl |
| D-BU-01 | erste Lauteinheit ist genau der Buchstabe; nicht v, c, x, y, q (Klang und Buchstabe passen nicht eindeutig zusammen); Umlaute kommen hier nicht vor | andere Buchstaben, Regel 1; Stufe 3 aus `aehnlichForm` und den Lautpaaren m/n, o/u |
| D-BU-02 | Stufe 1 und 2 wie D-BU-01; Stufe 3: Umlaute und Verbindungen, Laut kommt im Wort genau einmal vor (Regel 3), Stelle egal | Bilder ohne diesen Laut und ohne `nieZusammen`-Laut |
| D-BU-05 | Wörter, die den Buchstaben ein-, zwei- oder dreimal enthalten | – |
| D-BU-07, D-LE-09 | Verbindung als Lauteinheit im Wort, nur eingeführte aus `auswahl` | nur Verbindungen oder Buchstaben mit anderem Klang (nie tz/z, ck/k, ie/i, äu/eu, st/sch, sp/sch) |
| D-LE-01 | Stufe 1 und 2: offene Silben aus Konsonant und Vokal aus lautgetreuen Wörtern, Stufe 1 nur mit voller Silbe (kein unbetontes e); Stufe 3: geschlossene Silben | Silben mit anderem Anfang |
| D-LE-03 bis D-LE-06 | alle `braucht` eingeführt; Silbenzahl nach Fertigkeit; Stufe 1 nur lautgetreu | Stufe 1 andere `anlaut`; Stufe 3 Wörter, die sich in genau einer Lauteinheit unterscheiden |
| D-SC-02 | `lautgetreu`, alle `braucht` eingeführt, Anzahl `laute` nach Stufe | Ablenker-Kacheln aus `aehnlichLaut` (Stufe 3) oder deutlich anderen Buchstaben; nie aus `nieZusammen` (kein e neben ä) |
| D-SC-03 | alle `braucht` eingeführt | wie D-SC-02 |
| D-SC-04 | `lautgetreu`, ohne `nameUnsicher`; die fehlende Stelle ist ein Einzelbuchstabe | kein Ablenker darf ein Wort ergeben (Lexikon, Sichtwörter, Sperrliste häufiger Wörter wie Mama, Mofa, Name); nie aus `nieZusammen` |
| D-WS-01 | `ober` in Tiere, Obst, Gemüse, Kleider, Fahrzeuge, Musik, Pflanzen, Körper, Werkzeug; ohne `oberUnsicher` und ohne die Wörter in `oberKonflikt` des gefragten Oberbegriffs | andere Oberbegriffe, ebenfalls ohne `oberKonflikt`; Obst und Gemüse nie als Kistenpaar (Stufe 3) |
| D-WS-03 | `mehrzahl` gesetzt, ohne `bildMehrere`; Einzahl und Mehrzahl müssen mit Artikel verschieden klingen (nicht «die Ananas» gegen «die Ananas»); Stufe 3 nur, wenn die Mehrzahl anders geschrieben wird | – |
| D-WS-04 | Paare aus verschiedenen `reim`-Gruppen; Paare dürfen sich untereinander nicht reimen (Regel 2) | – |
| D-WS-09 | Wörter mit eindeutigem Artikel, ohne `nameUnsicher` | – |

Für jede Fertigkeit und Stufe muss die Freigabe «alle Einzelbuchstaben, Sch, Ei, Au» mindestens 20 verschiedene Aufgaben ergeben, sonst steht die Stufe im Bericht von `tools/teste_deutsch.mjs`.

## 8. Feste Inhalte (Deutsch)

Für Sätze, Geschichten und Anweisungen, die sich nicht aus dem Lexikon bilden lassen. Datei `site/data/inhalte/deutsch/<teil>.json`:

```json
{ "fach": "D", "teil": "saetze1", "stand": "2026-10-19",
  "saetze": [], "geschichten": [], "anweisungen": [], "gegenteile": [], "bildergeschichten": [] }
```

- **Satz** (D-LE-08, D-SC-05, D-HB-08): `{ "id": "S-001", "satz": "Die Maus schläft.", "woerter": ["Die", "Maus", "schläft", "."], "bild": { "art": "aktion", "bild": "🐭", "zeichen": "schlafen" }, "ablenker": [ { "satz": "Der Hase schläft.", "bild": { … } } ], "unterschied": "nomen", "stufen": { "D-LE-08": 1, "D-SC-05": 1, "D-HB-08": 1 }, "braucht": […] }`
- **Geschichte** (D-HV-02, D-WS-05, D-LE-10): `{ "id": "G-001", "saetze": ["…", "…"], "frage": "…", "optionen": [ { "bild": "…" } ], "richtig": 0, "stufen": { "D-HV-02": 1 } }`; bei D-LE-10 zusätzlich `braucht`.
- **Anweisung** (D-HV-01): `{ "id": "A-001", "auftrag": "Tippe auf den Ball und dann auf die Katze.", "szene": { … }, "loesung": ["ball", "katze"], "stufen": { "D-HV-01": 2 } }`
- **Gegenteil** (D-WS-02): `{ "id": "GT-01", "a": { "wort": "gross", "szene": { … } }, "b": { "wort": "klein", "szene": { … } } }`
- **Bildergeschichte** (D-WS-05): `{ "id": "BG-01", "bilder": ["🥚", "🐣", "🐥", "🐔"], "sprich": ["Zuerst ist da ein Ei.", "…"], "stufen": { "D-WS-05": 2 } }`

Farben, Wochentage und Zahlwörter erzeugen Generatoren (feste Listen im Code sind dort erlaubt, weil sie sich nicht ändern).

Regeln: Standarddeutsch in Schweizer Rechtschreibung, kurze Sätze (höchstens sechs Wörter in Lese- und Legeaufgaben), Wörter aus dem Lexikon und den Sichtwörtern, für Leseaufgaben nur eingeführte Buchstaben, eine einzige richtige Lösung. Weitere Regeln in `tools/AUFTRAG-INHALTE.md`.

## 9. Prüfen

- `node tools/pruefe_inhalte.mjs <datei>`: Schema, IDs, Bilder vorhanden, `braucht` passt zur Schreibung, keine «ß».
- `node tools/selbsttest_inhalte.mjs`: Jede hinterlegte Lösung wird akzeptiert, typische falsche nicht; jede Aufgabe ist mit der Standard-Freigabe spielbar oder bewusst gesperrt.
- `node tools/teste_deutsch.mjs`: alle Wortgeneratoren, je Stufe 200 Aufgaben; Lösung eindeutig, keine nicht eingeführten Buchstaben, kein verwechselbares Bildpaar, genug Vielfalt.
