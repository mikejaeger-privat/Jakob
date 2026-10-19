# Auftrag für Autorinnen und Autoren der Deutsch-Inhalte (Zyklus 1)

Du schreibst Inhalte für eine Lern-App. Zielkind: 1. Primarklasse im Kanton Zürich (6 bis 7 Jahre), Lehrplan 21, Zyklus 1. Das Kind kann zu Beginn kaum lesen und übt allein; alles, was es nicht lesen soll, wird vorgesprochen. Die Aufgaben werden automatisch geprüft. Eine falsche oder mehrdeutige Aufgabe schadet einem Erstklasskind mehr als zehn fehlende. **Richtigkeit geht vor Menge.**

## Vorgehen

1. Lies `tools/SPEC-AUFGABEN.md` ganz (Typen, Schema, Sprachausgabe, Bilder, feste Inhalte).
2. Lies im Katalog (`site/data/katalog/deutsch.json`) die Einträge deiner Fertigkeiten: `name`, `klasse` und die Stufentexte. **Jede Aufgabe muss genau zum Text ihrer Stufe passen.**
3. Verwende Wörter aus dem Wortlexikon (`site/data/woerter.json`) und die Sichtwörter. Ein neues Wort nur, wenn es ein eindeutiges Bild hat; dann zuerst ins Lexikon eintragen (alle Felder) und `node tools/pruefe_woerter.mjs` laufen lassen.
4. Schreibe in kleinen Schritten (pro Fertigkeit eine Teil-Datei im Scratchpad), am Schluss zusammenführen.
5. Prüfe mit `node tools/pruefe_inhalte.mjs <datei>` und `node tools/selbsttest_inhalte.mjs`, bis keine Fehler bleiben.
6. Zweiter Durchgang (Pflicht): Lies jede Aufgabe so, als hättest du sie nicht geschrieben, und höre sie dir in Gedanken an, wie die Stimme sie spricht. Frage dich: Ist die Lösung sicher richtig und die einzige? Versteht ein Kind von sechs Jahren den Auftrag, wenn es ihn nur hört? Könnte ein Bild auch etwas anderes zeigen? Kommt ein Buchstabe vor, der nicht in `braucht` steht? Streiche jede Aufgabe, bei der du zögerst.
7. Schlussbericht (kurz): Dateien, Zahl der Inhalte pro Fertigkeit und Stufe, Ergebnis der Prüfskripte, Änderungen im zweiten Durchgang, alle Stellen, die fachlich unsicher bleiben (mit ID).

## Sprache

- Standarddeutsch in Schweizer Rechtschreibung: nie «ß» (Strasse, gross, Fuss). Schweizer Wörter, die auch in der Schule gelten, sind willkommen (Velo, Znüni, Trottinett, Peperoni), kein Dialekt.
- Du-Form. Sätze in Lese- und Legeaufgaben höchstens sechs Wörter, Geschichten zum Zuhören höchstens fünf kurze Sätze.
- Gesprochene Aufträge so, dass sie ohne Bild und Text verständlich sind: «Tippe auf das Bild, das sich auf Maus reimt.» statt «Was passt?».
- Keine Markennamen, keine realen Personen, keine bekannten Figuren, nicht die Namen der Familie. Namen für Geschichten: Lea, Noah, Mia, Luca, Elena, Leon, Nina, Jonas, Sara, Elias.
- Inhalte aus der Welt eines Kindes in der Schweiz: Familie, Schule, Tiere, Natur, Jahreszeiten, Spielplatz, Wald, Berge, Bauernhof. Freundlich, ohne Klischees.
- Nichts aus Lehrmitteln oder dem Internet abschreiben.

## Lesen und Schreiben

- Leseaufgaben verwenden nur Buchstaben und Verbindungen, die im Buchstabenplan eingeführt sind; `braucht` listet sie vollständig (das Prüfskript rechnet nach).
- Stufe 1 einer Lesefertigkeit: nur lautgetreue Wörter (`lautgetreu: true` im Lexikon) und Sichtwörter.
- Schreibaufgaben (Legen, Lücke) verwenden nur lautgetreue Wörter. Wörter mit Merkstellen (Doppelkonsonant, stummes h, -er, Auslaut d/g/b, v) kommen erst als Lernwörter, wenn die Schule sie vorgibt.
- Nomen gross, Satzanfang gross, Satzende mit Punkt.

## Hören

- Höraufgaben zu Lauten nennen Wörter ohne Artikel.
- Keine Aufgabe, deren Lösung von Aussprache oder Dialekt abhängt (z. B. ä und e, i und ü, b und p in Mundart).
- Buchstaben nie allein sprechen lassen; immer über ein Wort («wie am Anfang von Maus»).

## Silben und Laute im Lexikon

Silben sind Sprechsilben (Ro-se, Son-ne, Ba-na-ne). Laute sind die Einheiten der Schreibung, je eine pro gesprochenem Laut: Verbindungen (Sch, ei, au, ie, ch, ck, tz, ng …), Doppelkonsonanten (ll, ss) und Vokal mit stummem h (uh, ah) sind je eine Einheit. Jedes neue Wort wird von einer zweiten Instanz gegengelesen (Silben, Laute, Anlaut, Endlaut, Merkstellen, Bild eindeutig).
