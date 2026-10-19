# Lernwelt (1. Klasse)

Lern-App für ein Kind der 1. Primarklasse in Schlieren (Kanton Zürich, Lehrplan 21, Zyklus 1): Deutsch (Laute, Buchstaben, Lesen, Schreiben, Wortschatz, Zuhören) und Mathematik (Zahlen bis 20, Rechnen, Form und Raum, Grössen). Täglich etwa 10 Minuten, ohne Druck, allein bedienbar ohne Lesen: Alles wird vorgesprochen. Statische Website auf Cloudflare Pages unter `https://www.jakobjaeger.ch`, offline nutzbar, Daten auf dem Gerät, optional Abgleich zwischen den Geräten der Familie.

Geschwisterprojekt der «Lernplattform» (`mikejaeger-privat/Lernplattform`): Technik, Aufbau der Dokumentation und Prüfwerkzeuge kommen von dort; Didaktik, Inhalte und Bedienung sind für ein sechs- bis siebenjähriges Kind neu.

## Stand

**Etappe 1 von 7: Konzept und Spezifikation (zur Durchsicht).** Noch keine lauffähige App.

| Datei | Inhalt |
| --- | --- |
| [KONZEPT.md](KONZEPT.md) | Konzept: Kinderbereich, Katalog, Lernmodell, Tagesplan, Belohnung, Elternbereich, Technik, Annahmen, offene Fragen |
| `site/data/katalog/deutsch.json`, `mathe.json` | Kompetenzkatalog: 42 Fertigkeiten Deutsch, 50 Mathematik, je 2 bis 3 Stufen |
| `site/data/woerter.json` | Wortlexikon (Entwurf): 296 Bildwörter, Sichtwörter, verwechselbare Paare, Regeln für gleich klingende Laute |
| `site/data/buchstaben.json` | Buchstabenplan mit Anlautwörtern (alle Einzelbuchstaben eingeführt) |
| `site/data/lehrmittel.json` | Reihenfolge im Schuljahr (Mathematik nach «Mathematik 1 Primarstufe») |
| `site/data/ziele.json` | Etappen, Ferien und Feiertage der Schule Schlieren |
| `site/data/parameter.json` | Alle Zahlen des Lernmodells und des Tagesplans |
| `tools/SPEC-*.md`, `tools/AUFTRAG-INHALTE.md` | Spezifikationen für Katalog, Aufgaben, Mathe-Generatoren und Inhalte |
| `quellen/` | Lehrplan-21-Kompetenzen in eigenen Worten, Lehrmittel- und Ferienquellen |

Prüfen (Node.js 22):

```sh
node tools/pruefe_katalog.mjs --bilanz   # Katalog, Lehrmittel-Reihenfolge, Ziele, Parameter
node tools/pruefe_woerter.mjs --bilanz   # Wortlexikon und Buchstabenplan
```

Ab Etappe 2 beschreibt diese Datei den Betrieb: Bereitstellung über GitHub und Cloudflare Pages, Domain und Weiterleitung, Cloudflare Access, Abgleich mit D1, Einrichtung auf dem iPad (inklusive Stimmen), Sicherung und Entwicklung.
