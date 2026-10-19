# Katalog-Schema (Zyklus 1)

Dateien: `site/data/katalog/deutsch.json` und `site/data/katalog/mathe.json`. Prüfen mit `node tools/pruefe_katalog.mjs --bilanz` (muss ohne Fehler durchlaufen).

```json
{
  "fach": "D",
  "name": "Deutsch",
  "stand": "2026-10-19",
  "gruppen": [
    { "id": "LE", "name": "Lesen", "bereich": "Lesen (D.2)", "symbol": "📖" }
  ],
  "fertigkeiten": [
    {
      "id": "D-LE-03",
      "gruppe": "LE",
      "name": "Wörter mit zwei Silben lesen",
      "kurz": "Wörter lesen",
      "klasse": 1,
      "vor": ["D-LE-01"],
      "kern": true,
      "lp21": ["D.2.A.1"],
      "quelle": "woerter",
      "stimme": "ohne",
      "typen": ["bild-wort"],
      "stufen": {
        "1": { "text": "Lautgetreue Wörter mit Silbenbögen; drei deutlich verschiedene Bilder", "schrift": true },
        "2": { "text": "Ohne Silbenbögen, vier Bilder", "schrift": true },
        "3": { "text": "Ähnliche Wörter genau lesen (Rose, Hose, Dose)", "schrift": true }
      },
      "stichwoerter": ["lesen", "wörter lesen", "lesen lernen", "erstlesen"]
    }
  ]
}
```

## Felder

| Feld | Inhalt |
| --- | --- |
| `id` | `<Fach>-<Gruppe>-<Nummer>`, Fach `D` oder `M`, Gruppe zwei Grossbuchstaben, Nummer zweistellig. Nummern ab 90 sind für importierte Pakete reserviert. |
| `gruppe` | Mittlerer Teil der ID; muss in `gruppen` stehen. `gruppen[].symbol` ist ein Emoji für den Elternbereich. |
| `name` | Bezeichnung für die Eltern (Elternbereich, Berichte). |
| `kurz` | Kurzname, höchstens 28 Zeichen, für Listen im Elternbereich. Im Kinderbereich steht kein Text; dort zeigt die App Bildsymbole. |
| `klasse` | `1` (1. Halbjahr der 1. Klasse), `1.5` (2. Halbjahr), `2` (Beginn 2. Klasse, Erweiterung). Achtung: JavaScript ordnet die Schlüssel «1», «2» vor «1.5»; überall numerisch sortieren. |
| `vor` | Voraussetzungen für Stufe 1 (IDs aus beiden Katalogen). Stufe *n* setzt zusätzlich Stufe *n − 1* derselben Fertigkeit auf «fast sicher» voraus. |
| `kern` | `true` = gehört zum Stoff der 1. Klasse; `false` = Erweiterung (kommt erst, wenn der Kern im Fach weit ist); `"eltern"` = nur aktiv, wenn die Eltern Inhalte eintragen (Lernwörter). |
| `lp21` | Kompetenznummern des Lehrplans 21 (Form `D.2.A.1`, `MA.1.A.3`) oder nur der Bereich (`D.5`), wenn keine einzelne Kompetenz eindeutig passt. Texte in `quellen/`. |
| `quelle` | Woher die Aufgaben kommen: `generator` (Mathematik), `woerter` (Wortgeneratoren aus dem Lexikon), `buchstaben` (aus dem Buchstabenplan), `schrift` (Nachspur-Vorlagen), `sichtwoerter`, `inhalte` (feste Aufgaben in `site/data/inhalte/deutsch/`), `eltern` (Lernwörter), `karteikasten`. |
| `stimme` | `noetig` (ohne deutsche Stimme auf dem Gerät nicht spielbar), `hilfreich` (spielbar, Stimme verbessert), `ohne`. Eine Stufe kann das mit eigenem `stimme` überschreiben. |
| `typen` | Aufgabentypen aus `tools/SPEC-AUFGABEN.md`. |
| `karteikasten` | Optional: Karteikasten-Art (`buchstaben`, `sichtwoerter`, `lernwoerter`, `rechnen`). |
| `stufen` | Zwei bis drei Stufen mit Schlüsseln `"1"` bis `"3"`. Sie beschreiben Teilschritte, keine Niveaus. |
| `stichwoerter` | 3 bis 14 kleingeschriebene Suchbegriffe, mit denen die Eltern Lernwörter-Tests oder Hinweise der Lehrperson einer Fertigkeit zuordnen. |

## Felder einer Stufe

| Feld | Inhalt |
| --- | --- |
| `text` | Was das Kind auf dieser Stufe tut, in einem Satz. Beispiele in Klammern zeigen die gemeinte Schwierigkeit. Generatoren und Autorinnen halten sich genau daran. |
| `schrift` | `true`: Die Stufe zeigt Buchstaben zum Lesen oder Schreiben. Jede Aufgabe dieser Stufe darf nur Buchstaben und Verbindungen enthalten, die im Buchstabenplan eingeführt sind (Feld `braucht` der Aufgabe). |
| `braucht` | Optional: Buchstaben oder Verbindungen, die alle eingeführt sein müssen, bevor die Stufe öffnet. |
| `auswahl` | Optional: Verbindungen dieser Stufe. Die Stufe öffnet, sobald mindestens eine davon eingeführt ist; Aufgaben verwenden nur die eingeführten. |
| `raum` | Nur Mathematik: grösste Zahl, die in Aufgaben, Lösungen und Zwischenschritten vorkommen darf: `10`, `20` oder `100`. Die Stufe öffnet nur, wenn der Zahlenraum im Elternbereich freigegeben ist. |
| `vor` | Optional: zusätzliche Voraussetzungen nur für diese Stufe. |
| `stimme` | Optional: überschreibt `stimme` der Fertigkeit. |
| `bedingung` | Optional: `"dehnlaute"` = nur, wenn im Elternbereich «Dehnlaute vorsprechen» eingeschaltet ist; `"silben"` = nur, wenn «Silben einzeln vorsprechen» eingeschaltet ist. Ist die Bedingung aus, gilt die Stufe als übersprungen: Die nächste Stufe öffnet ohne sie, und Voraussetzungen auf diese Fertigkeit gelten ab der nächsten Stufe als erfüllt. |
| `ausnahme` | Optional, nur Mathematik: `"muenzwerte"` = die Beschriftung von Münzen (5 bis 50 Rp.) zählt nicht zum Zahlenraum, weil nur erkannt und geordnet, nicht gerechnet wird. |
| `karten`, `gruppe` | Optional: Karteikasten-Unterart (`zerlegungen`, `plus10`, `minus10`) bzw. Gruppe der Sichtwörter. |

## Regeln

- Schweizer Rechtschreibung, nie «ß». Standarddeutsch.
- Reihenfolge der Fertigkeiten im Katalog = Reihenfolge im Elternbereich. Die Reihenfolge im Schuljahr steht in `site/data/lehrmittel.json`.
- Jede Mathematik-Fertigkeit kommt in mindestens einem Kapitel von `lehrmittel.json` vor, jede Deutsch-Fertigkeit genau einmal in der Deutsch-Reihenfolge.
- Keine Kreise in den Voraussetzungen.
