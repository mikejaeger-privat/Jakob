# Eigene Inhalte

Lernwörter, zusätzliche Bildwörter und zusätzliche Deutsch-Inhalte kommen als **Paket** (eine JSON-Datei) in die Lernwelt: Elternbereich › Daten › **Pakete mit eigenen Inhalten › Paket wählen**. Die Website muss dafür nicht neu hochgeladen werden. Das Paket liegt danach im Gerätespeicher, geht mit dem Abgleich auf die anderen Geräte und ist Teil der Sicherung. Unter derselben Überschrift lässt sich ein Paket wieder entfernen; ein Paket mit gleicher `id` ersetzt das alte.

Typische Fälle:
- Die Lehrperson gibt eine Liste mit **Lernwörtern** ab → Paket mit `lernwoerter` (einzelne Wörter gehen auch direkt unter Elternbereich › Lernwörter).
- Ein Bildwort fehlt, das die Klasse gerade übt → Paket mit `woerter`.
- Mehr **Sätze, Lesetexte oder Geschichten** → Paket mit `inhalte`.

Grenzen: höchstens 2 MB pro Datei. Pakete gibt es nur für Deutsch; die Mathematik-Aufgaben entstehen aus Generatoren. Neue Fertigkeiten lassen sich nicht über ein Paket anlegen (dafür den Katalog in `site/data/katalog/` ändern, siehe `tools/SPEC-KATALOG.md`).

Die App prüft jedes Paket beim Import mit denselben Regeln wie die Prüfskripte (`tools/pruefe_woerter.mjs`, `tools/pruefe_inhalte.mjs`) und zeigt die ersten zwölf Fehler an; ein fehlerhaftes Paket wird nicht übernommen. Vor dem Import lohnt sich der Selbsttest auf dem Computer (siehe unten).

## Aufbau eines Pakets

```json
{
  "id": "lernwoerter-november",
  "titel": "Lernwörter November",
  "fach": "D",
  "lernwoerter": [],
  "woerter": [],
  "inhalte": {}
}
```

| Feld | Pflicht | Inhalt |
| --- | --- | --- |
| `id` | nein | Name des Pakets: Buchstaben, Ziffern, `.`, `-`, `_`, höchstens 64 Zeichen. Fehlt er, vergibt die App einen. |
| `titel` | nein | Anzeige im Elternbereich (höchstens 80 Zeichen) |
| `fach` | ja | immer `"D"` |
| `hinweis` | nein | freier Text, wird nicht angezeigt |
| `lernwoerter`, `woerter`, `inhalte` | mindestens eines nicht leer | siehe unten |

Schreibweise überall: Schweizer Rechtschreibung (`ss`, nie `ß`), Standarddeutsch, Anführungszeichen «so». Keine Wörter, die nach Bewertung klingen (Test, Prüfung, Stufe, Niveau, Fehler, falsch, Punkte, Note), in Texten, die das Kind sieht oder hört. Keine Namen aus der Familie, keine bekannten Figuren, keine Marken.

## Lernwörter (`lernwoerter`)

```json
"lernwoerter": [
  { "wort": "Sonne", "test": "2026-11-06" },
  { "wort": "rot" },
  "Mama"
]
```

- `wort`: ein Wort aus 2 bis 16 Buchstaben, genau so geschrieben, wie es die Schule verlangt (Gross- und Kleinschreibung zählen).
- `test`: Datum des Wörtertests (`JJJJ-MM-TT`), freiwillig. In den drei Tagen davor übt der Deutsch-Stein die Wörter zusätzlich.
- Ein Wort, das schon in der Liste steht, wird nicht doppelt übernommen. Geübt wird ein Lernwort erst, wenn alle seine Buchstaben und Verbindungen im Buchstabenplan als eingeführt markiert sind (zum Beispiel «St st» für «Stern»).
- Beim Entfernen des Pakets verschwinden seine Lernwörter wieder aus der Liste.

## Bildwörter (`woerter`)

Bildwörter ergänzen das Wortlexikon (`site/data/woerter.json`). Aus ihnen bilden die Generatoren Aufgaben zu Lauten, Silben, Reimen, Lesen und Schreiben. Jedes Wort braucht das vollständige Schema des Lexikons:

```json
{
  "id": "w-p-wolle", "wort": "Wolle", "artikel": "die", "silben": ["Wol", "le"], "laute": ["W", "o", "ll", "e"],
  "anlaut": "w", "endlaut": "ə", "bild": "🧶", "mehrzahl": null, "ober": "Dinge", "reim": null,
  "merk": ["doppel"], "lautgetreu": false, "braucht": ["w", "o", "l", "e"], "lautzaehlbar": true, "silbenSprechbar": false
}
```

| Feld | Inhalt |
| --- | --- |
| `id` | eindeutig, am besten mit `w-p-` beginnend |
| `wort`, `artikel` | Nomen gross, Artikel `der`, `die` oder `das` (der in der Schweiz übliche) |
| `silben` | Sprechsilben; zusammen ergeben sie das Wort |
| `laute` | eine Einheit pro Laut in der Schreibung (Verbindungen wie `Sch`, `ei`, `ck`, Doppelkonsonanten wie `ll`, Vokal mit Dehnungs-h wie `uh` sind je eine Einheit); zusammen ergeben sie das Wort |
| `anlaut`, `endlaut` | Klang am Anfang und am Ende (Buchstaben-ID aus dem Buchstabenplan, `ə` für ein schwaches e am Ende) |
| `bild` | ein Emoji (Unicode-Version höchstens 13, sonst fehlt es auf älteren iPads), das sonst kein Wort hat |
| `mehrzahl` | Text oder `null` |
| `ober` | Oberbegriff aus der Liste in `site/js/core/woerter-pruefen.js` (Tiere, Obst, Gemüse, Essen, Kleider, Körper, Fahrzeuge, Pflanzen, Natur, Spielsachen, Musik, Werkzeug, Haushalt, Schule, Gebäude, Personen, Formen, Fantasie, Dinge) |
| `reim` | Reimgruppe (wie im Lexikon) oder `null` |
| `merk` | Merkstellen (`doppel`, `dehnung-h`, `doppelvokal`, `auslaut`, `er`, `ig`, `v`, `chs`, `ng`, `ai`, `fremd`, `zwei-schreibweisen`, `ss`, `x`); leer heisst lautgetreu |
| `lautgetreu` | `true` genau dann, wenn `merk` leer ist (nur lautgetreue Wörter kommen in Schreibaufgaben) |
| `braucht` | Buchstaben und Verbindungen, die das Wort zeigt (die App rechnet nach und meldet Abweichungen) |
| `lautzaehlbar` | `true`, wenn sich die Laute gut zählen lassen (2 bis 6 Laute) |
| `silbenSprechbar` | `false`, wenn eine Silbe nach der ersten nur ein schwaches e hat (`Ka-mel` ja, `Ro-se` nein); die App rechnet nach |
| `nameUnsicher` | `true`, wenn ein Kind das Bild oft anders nennt; dann kommt es nur vor, wenn das Wort gesprochen wird oder dasteht |
| `sprich` | freiwillig: wie die Stimme das Wort sprechen soll (z. B. «Welo» für Velo) |

Verwechselbare Bilder (Huhn und Hahn) lassen sich über ein Paket nicht festlegen; im Zweifel `nameUnsicher` setzen oder das Wort weglassen.

## Feste Inhalte (`inhalte`)

`inhalte` hat dieselben Teile wie die Dateien in `site/data/inhalte/deutsch/`: `saetze`, `geschichten`, `anweisungen`, `gegenteile`, `bildergeschichten`. Jede Einheit braucht eine eindeutige `id` (am besten mit einem eigenen Vorsatz wie `P1-`) und in `stufen` die Fertigkeit und Stufe, für die sie gedacht ist. Bilder sind Emoji oder Szenen: `{ "art": "menge", "bild": "🍎", "anzahl": 3 }`, `{ "art": "lage", "lage": "unter", "bild": "🐱", "bezug": "🛋️" }`, `{ "art": "aktion", "bild": "🐭", "zeichen": "schlafen" }` (auch `rennen`, `essen`), `{ "art": "farbe", "farbe": "gruen" }`, `{ "art": "groesse", "bild": "🐘", "gross": true }`.

`braucht` nennt alle Buchstaben und Verbindungen, die das Kind sieht. Häufige Wörter (Sichtwörter wie «die», «ich», «nicht») zählen nur mit ihren Einzelbuchstaben. Eine Einheit erscheint erst, wenn alles in `braucht` im Buchstabenplan eingeführt ist.

**Sätze lesen** (D-LE-08: Satz lesen, passendes Bild wählen; die Ablenker-Sätze unterscheiden sich in einem Teil, `unterschied`: `nomen`, `verb`, `farbe` oder `lage`):

```json
{ "id": "P1-SL-01", "satz": "Das ist ein Wal.", "woerter": ["Das", "ist", "ein", "Wal", "."], "bild": "🐋",
  "ablenker": [{ "satz": "Das ist ein Bär.", "bild": "🐻" }, { "satz": "Das ist ein Igel.", "bild": "🦔" }],
  "unterschied": "nomen", "stufen": { "D-LE-08": 1 }, "braucht": ["d", "a", "s", "i", "t", "ei", "n", "w", "l", "b", "ä", "r", "g", "e"] }
```

**Sätze legen und hören** (D-SC-05: gehörten Satz aus Wortkarten legen; D-HB-08: Wörter im Satz zählen): Satz mit grossem Anfang und Punkt, höchstens sechs Wörter, `woerter` mit dem Satzzeichen als eigene Karte.

```json
{ "id": "P1-SS-01", "satz": "Die Maus schläft.", "woerter": ["Die", "Maus", "schläft", "."],
  "bild": { "art": "aktion", "bild": "🐭", "zeichen": "schlafen" }, "stufen": { "D-SC-05": 1 },
  "braucht": ["d", "ie", "m", "au", "s", "sch", "l", "ä", "f", "t"] }
```

**Geschichten** zum Zuhören (D-HV-02) und kurze Lesetexte (D-LE-10, mit `braucht`): zwei bis fünf kurze Sätze, eine Frage, zwei bis vier Bildantworten.

```json
{ "id": "P1-HG-01", "saetze": ["Der Hund spielt mit dem Ball.", "Die Katze schläft auf dem Sofa."], "frage": "Wer spielt mit dem Ball?",
  "optionen": [{ "bild": "🐶", "wort": "Hund" }, { "bild": "🐱", "wort": "Katze" }, { "bild": "🐭", "wort": "Maus" }],
  "richtig": 0, "erklaerung": "Der Hund spielt mit dem Ball.", "stufen": { "D-HV-02": 1 } }
```

**Anweisungen** (D-HV-01: «Tippe auf …», «Lege … unter …»): eine Szene mit Elementen (`x`, `y`, `w` als Anteil der Fläche von 0 bis 1) und als Lösung `loesung` (Elemente zum Antippen) oder `ziehen` (Element an einen Ort):

```json
{ "id": "P1-A-01", "auftrag": "Tippe auf die Katze.",
  "szene": { "art": "frei", "elemente": [{ "id": "hund", "bild": "🐶", "name": "Hund", "x": 0.2, "y": 0.5, "w": 0.16 },
    { "id": "katze", "bild": "🐱", "name": "Katze", "x": 0.5, "y": 0.5, "w": 0.16 }] },
  "loesung": ["katze"], "hinweis": "Hör gut zu und such das richtige Bild.", "erklaerung": "Das ist die Katze.", "stufen": { "D-HV-01": 1 } }
```

**Gegenteile** (D-WS-02) und **Bildergeschichten** (D-WS-05, drei oder vier Bilder in der richtigen Reihenfolge, je Bild ein gesprochener Satz):

```json
{ "id": "P1-GT-01", "begriff": "gross-klein", "a": { "wort": "gross", "szene": { "art": "groesse", "bild": "🐘", "gross": true } },
  "b": { "wort": "klein", "szene": { "art": "groesse", "bild": "🐘", "gross": false } } }
{ "id": "P1-BG-01", "bilder": ["🥚", "🐣", "🐥"], "sprich": ["Das ist ein Ei.", "Ein Küken schlüpft aus dem Ei.", "Das Küken läuft herum."], "stufen": { "D-WS-05": 1 } }
```

Die Regeln für Inhalte (Sätze kurz, Aufträge ohne Bild verständlich, nur eine richtige Lösung, eindeutige Bilder) stehen in `tools/AUFTRAG-INHALTE.md`.

## Selbsttest vor dem Import

Mit Node.js 22 im Repository:

```sh
node tools/pruefe_paket.mjs mein-paket.json   # dieselbe Prüfung wie beim Import (höchstens zwölf Fehler)
```

Ein vollständiges Beispiel mit allen Teilen liegt in `tools/beispiele/paket-beispiel.json`.

Danach im Elternbereich unter «Aufgaben» die betroffenen Stufen ausprobieren: Neue Inhalte erscheinen dort wie die übrigen.
