# Konzept «Lernwelt»

Stand 19. Oktober 2026, Etappe 1 (Konzept und Spezifikation, zur Durchsicht). Alle Zahlen stehen in `site/data/parameter.json`, `site/data/ziele.json`, `site/data/lehrmittel.json` und `site/data/buchstaben.json` und lassen sich dort ändern. Was eine Annahme ist, steht in Abschnitt 12; was nur die Lehrperson weiss, in Abschnitt 13.

## 0. Entscheide aus den Rückfragen (19.10.2026)

| Frage | Antwort | Folge für das Konzept |
| --- | --- | --- |
| Was ist in der Schule schon eingeführt? | Alle Buchstaben und Zahlen. | Der Schwerpunkt liegt nicht auf dem Kennenlernen der Buchstaben, sondern auf Zusammenschleifen, Lesen, lautgetreuem Schreiben und Rechnen. Alle Einzelbuchstaben sind freigegeben; der Buchstabenplan regelt nur noch die Verbindungen (Sch, Ei, Au … , offen). Zahlenraum 20 ist freigegeben, gerechnet wird zuerst bis 10. |
| Wie klingen Laute? | Gerätestimme mit Umwegen. | Keine Tondateien, die CSP bleibt `default-src 'self'`. Laute werden über Wörter angesprochen, Dehnlaute («mmm») nur nach Hörtest (Abschnitt 2.3). Eigene Aufnahmen bleiben später als Paket möglich. |
| Übt das Kind meist allein? | Ja. | Die Vorlesen-Aufgabe wird gebaut, ist aber ausgeschaltet. |
| Was nach der Sitzung? | Schluss mit Schlusskarte. | Keine Zusatzrunde im Kinderbereich. Eine weitere Sitzung können nur die Eltern freigeben. |

## 1. Ziel und Rahmen

| | |
| --- | --- |
| Kind | 1. Klasse, Primarschule Schlieren (Kanton Zürich), Schuljahr 2026/27, Schulbeginn 17.8.2026; kann zu Beginn kaum lesen |
| Lehrplan | Lehrplan 21, Zyklus 1, Schwerpunkt 1. Klasse |
| Lehrmittel | Mathematik 1 Primarstufe (LMVZ): Reihenfolge nach der veröffentlichten Jahresplanung. Deutsch: unbekannt, angenommen «Deutsch Eins» (silbenanalytisch, unverbundene Basisschrift) |
| Fächer | Deutsch (Hören und Laute, Buchstaben, Lesen, Schreiben, Wortschatz, Hörverstehen) und Mathematik (Zahlen bis 20, Rechnen, Form und Raum, Grössen) |
| Gerät | iPad quer (Hauptgerät), iPhone und iPad hoch brauchbar; als App auf dem Home-Bildschirm, offline |
| Zeit | etwa 10 Minuten pro Lerntag (5 bis 15 einstellbar), Montag bis Freitag, in den Ferien nichts geplant |

Die App ist ein tägliches, kurzes Üben ohne Druck, das das Kind allein bedienen kann. Sie ist keine Beurteilung, keine Diagnose und kein Ersatz für Unterricht oder Förderung (Abschnitt 11).

## 2. Kinderbereich

### 2.1 Ablauf einer Sitzung

1. **Start:** Der Fuchs begrüsst das Kind mit Namen (der Name bleibt auf dem Gerät). Ein grosser Start-Tipp; damit darf die Stimme auf iOS sprechen.
2. **Plan als Weg mit Steinen:** zwei bis vier Steine mit Bildern (Aufwärmen, Buch für Deutsch, Würfel für Mathematik, Stern als Schlussstein). Nach dem Aufwärmen wählt das Kind, ob es mit Deutsch oder Mathematik weitergeht. Der letzte Stein ist immer leicht.
3. **Bausteine** (Abschnitt 6): Aufwärmen, Deutsch, Mathematik, Schlussstein. Ein Baustein besteht aus ein oder zwei Runden zu je vier bis sechs Aufgaben derselben Fertigkeit und Stufe.
4. **Schlusskarte** (gesprochen): was geübt wurde, ein Lob für den Einsatz (nicht für Richtigkeit), dann wächst das Sammelbild um ein Teil. «Bis morgen!» Danach endet der Kinderbereich für heute.

Beispiel (Mittwoch im November, 10 Minuten):

| Zeit | Stein | Inhalt |
| --- | --- | --- |
| 1½ min | Aufwärmen | 5 Karten aus dem Karteikasten: Zerlegungen bis 10 |
| 4 min | Deutsch (vom Kind gewählt) | Runde «Wörter lesen», Stufe 2 (5 Aufgaben); Runde «Anfangslaut», Wiederholung (4 Aufgaben) |
| 3 min | Mathematik | «Zerlegen bis 10», Stufe 2 (aktuelles Kapitel «Zerlegen», 5 Aufgaben) |
| 1 min | Schlussstein | 2 Aufgaben «Zählen bis 20», sicher |
| | Schluss | «Heute hast du Wörter gelesen und Zahlen zerlegt. Du hast toll mitgemacht!» Im Wald erscheint ein Igel. |

### 2.2 Bedienung

- **Alles wird gesprochen:** Auftrag, Hinweis, Erklärung, Rückmeldung, Schaltflächen. Sprachausgabe des Geräts (`speechSynthesis`), Stimme `de-CH`, sonst `de-DE`, nur lokale Stimmen, Tempo 0.85 (einstellbar), kein Überlappen, Abbruch beim Seitenwechsel. Auf jeder Aufgabe ein Lautsprecher-Knopf «nochmals hören».
- **Einführung beim ersten Start:** Der Fuchs zeigt in einer gesprochenen Kennenlern-Runde (etwa 2 Minuten) die vier Knöpfe; das Kind tippt jeden einmal selbst an («Tippe auf den Lautsprecher, dann sage ich es nochmals»). Antippen des Fuchses auf dem Startbildschirm spielt die Einführung erneut.
- **Vormachen statt erklären:** Beim ersten Mal pro Aufgabenart, auf das Fragezeichen und nach 12 Sekunden ohne Berührung zeigt eine Zeigehand die Bewegung (tippen, ziehen, nachspuren). Das ist eine Hilfe, kein Drängen; es läuft keine Zeit ab.
- **Bildsymbol pro Aufgabenart** oben in der Mitte: Ohr (hören), Auge (lesen), Finger (antippen), Stift (spuren), Würfel (zählen). So weiss das Kind auch ohne Ton, was zu tun ist.
- **Kein Lesen nötig**, ausser in der Leseaufgabe selbst. Grosse Bildsymbole immer an derselben Stelle: Lautsprecher, Fragezeichen (Hilfe), Pfeil (weiter), Haken (fertig). Keine Textmenüs. Höchstens eine Entscheidung pro Bildschirm.
- **Eingabe ohne Tastatur:** antippen, ziehen (immer auch Tipp-Tipp), nachspuren, Zahlenfeld 0 bis 20, Buchstabenkacheln (nur eingeführte Buchstaben), Plättchen legen. Zielflächen mindestens 64 px. Keine Doppeltipps, Wischen nie als einzige Möglichkeit.
- **Schrift:** Andika (SIL Open Font License, lokal, einstöckiges a, offenes g), mindestens 28 px, Lesewörter 40 px. Nachspuren mit eigenen SVG-Pfaden je Buchstabe (gross und klein, mit Umlauten) und Ziffer, angelehnt an die unverbundene Basisschrift, mit Startpunkt und Strichreihenfolge.
- **Bilder:** Emoji aus dem Wortlexikon (bis Emoji-Version 13), eigene SVG-Zeichnungen, wo Emoji fehlen oder mehrdeutig sind. Maskottchen: ein eigener, einfacher SVG-Fuchs.
- **Gestaltung:** Die Idee «Lichtraum» der Lernplattform (weiche Lichtflächen, Milchglas) in eigenen, wärmeren Farben (Waldgrün, Fuchsorange), damit die beiden Apps auf demselben iPad klar unterscheidbar sind. Eigenes Icon «Lernwelt». Dunkles Design, «Bewegung reduzieren» und «Transparenz reduzieren» werden beachtet.

### 2.3 Laute mit der Gerätestimme

Die Gerätestimme spricht Wörter gut, einzelne Laute schlecht (sie sagt «Be» statt /b/). Darum:

| Was | Wie die App es macht |
| --- | --- |
| Ein Laut | immer über ein Wort: «Was hörst du am Anfang von … Maus?»; oder der Buchstabe wird gezeigt, nie gesprochen |
| Dehnbare Laute (Selbstlaute, m, n, l, s, f, sch) | als «mmm», «sss» usw., nur wenn im Elternbereich «Dehnlaute vorsprechen» eingeschaltet ist; dort gibt es einen Hörtest mit allen Dehnlauten |
| Silben | einzeln mit Pause («So … fa»), nur bei Wörtern ohne Silbe mit unbetontem e (die Stimme spräche «ne» mit langem e); nur wenn im Elternbereich «Silben einzeln vorsprechen» eingeschaltet ist, mit Hörtest |
| Zusammenziehen | Stufe 1 Silben, Stufe 2 Anfangslaut und Rest («Mmm … aus»), Stufe 3 Laut für Laut nur bei Wörtern aus dehnbaren Lauten (Oma, Sofa, Lama, Ufo, Ananas) |
| Gleich klingende Laute | nie Lösung und Ablenker zugleich: a und ei, e und ä, i und ü, b und p, d und t, g und k (in der Mundart kaum unterscheidbar), z und s, tz und z, ck und k, ie und i |
| Höraufgaben zu Anlaut, Endlaut, Reim, Silben | Wörter ohne Artikel (der Artikel verändert den ersten Laut) |

**Stimme einrichten (Eltern, beim ersten Start und im Elternbereich):** Die App sucht eine deutsche Stimme auf dem Gerät, spricht einen Probesatz und führt durch einen Hörtest: Klingen «So … fa» und «mmm» richtig? Je nach Antwort schaltet sie «Silben einzeln vorsprechen» und «Dehnlaute vorsprechen» ein oder aus. Fehlt eine deutsche Stimme oder klingt sie blechern, steht Schritt für Schritt da, wie man auf dem iPad eine bessere lädt (Einstellungen › Bedienungshilfen › Gesprochene Inhalte › Stimmen › Deutsch, eine «erweiterte» Stimme wählen). Ohne deutsche Stimme auf dem Gerät zeigt die App den Eltern diese Anleitung (Stimme laden) und spielt nur Aufgaben, die ohne Ton gehen: Nachspuren, Zählen mit Bildern, Muster, Formen, Wort lesen und Bild wählen, Rechnen mit Bild.

### 2.4 Fehler auffangen

- Erster Fehler: freundlicher Hinweis (gesprochen), die Auswahl wird kleiner oder das Entscheidende hervorgehoben, zweiter Versuch.
- Zweiter Fehler: Die Lösung wird gezeigt und erklärt (gesprochen, mit Bild), dann weiter. Später in der Sitzung kommt dieselbe Fertigkeit in leichterer Form noch einmal.
- Kein rotes Kreuz, kein Zähler, kein Tadel-Ton. Richtig: kurze, leise Bestätigung (Animation, Ton aus der Web Audio API, keine Mediendateien).
- Im Kinderbereich kommen die Wörter Test, Prüfung, Stufe, Niveau, Fehler, falsch, Punkte und Note nicht vor. Keine Serien, keine Ranglisten, kein Zeitdruck.

## 3. Kompetenzkatalog

92 Fertigkeiten (`site/data/katalog/`), jede mit zwei bis drei **Stufen**, die Teilschritte beschreiben (zum Beispiel «mit Bild», «ohne Bild bis 10», «bis 20»), nicht Leistungsniveaus.

| Deutsch (42) | | Mathematik (50) | |
| --- | --- | --- | --- |
| HB Hören und Laute | 8 | ZA Zählen | 9 |
| BU Buchstaben | 7 | ME Mengen und Zahlen | 8 |
| LE Lesen | 10 | ZE Zerlegen | 6 |
| SC Schreiben | 6 | RE Rechnen | 15 |
| WS Wortschatz und Sprache | 9 | FO Form und Raum | 6 |
| HV Hören und Verstehen | 2 | GR Grössen und Daten | 6 |

- **Klasse:** 1 (1. Halbjahr), 1.5 (2. Halbjahr), 2 (Erweiterung, Beginn 2. Klasse). Kern sind 87 Fertigkeiten; Erweiterungen (Alphabet, kurze Texte, Zählen in Schritten, gerade und ungerade) kommen erst, wenn der Kern weit ist. «Lernwörter der Woche» ist nur aktiv, wenn die Eltern Wörter eintragen.
- **Voraussetzungen:** `vor` für Stufe 1; jede höhere Stufe setzt die tiefere auf «fast sicher» voraus.
- **Buchstaben (`braucht`, `auswahl`):** Jede Lese- und Schreibaufgabe enthält nur eingeführte Buchstaben und Verbindungen. Da alle Einzelbuchstaben eingeführt sind, wirkt das vor allem bei den Verbindungen: Wörter mit «ie», «ch» oder «ck» kommen erst, wenn sie im Elternbereich freigegeben sind. Hören und Lautieren dürfen alle Laute nutzen.
- **Zahlenraum (`raum`):** Jede Mathematik-Stufe hat einen Zahlenraum (10, 20, 100). Freigegeben ist 20; 100 erst gegen Ende der 1. Klasse und nur auf Freigabe im Elternbereich.
- **Reihenfolge im Schuljahr (`lehrmittel.json`):** Mathematik nach den 36 Kapiteln der Jahresplanung «Mathematik 1 Primarstufe» (Zählen und Zahlen im August bis Symmetrie und «Regeln und Strategien» im Juli). Am 19. Oktober steht die Klasse laut Plan bei «Punktefeld» und «Rechengeschichten». Deutsch: Reihenfolge als Vorschlag (Annahme): zuerst Laute (bis zur Lautanalyse), Buchstaben festigen, Silben lesen, zwei- und einsilbige Wörter, lautgetreu schreiben; im 2. Halbjahr Verbindungen, Sätze, lange Wörter, Nomen und Begleiter.
- **Lehrplan 21:** Jede Fertigkeit verweist auf Kompetenznummern (z. B. D.1.A.1, MA.1.A.3); Texte in eigenen Worten in `quellen/`.

## 4. Aufgaben

17 Aufgabentypen, als wiederverwendbare Bausteine für beide Fächer (`tools/SPEC-AUFGABEN.md`): Bildwahl, Wortwahl, Hörkarten, Wort lesen und Bild wählen, Zuordnen, Legen, Nachspuren, Zahlenfeld, Zählen durch Antippen, Plättchen legen, Reihenfolge, Muster, Zuhören und Antippen, Silben, Antippen von Stellen, Laut-Platz (vorne, Mitte, hinten) und Vorlesen (nur mit Erwachsenen, aus).

Woher die Aufgaben kommen:

| Quelle | Wofür | Prüfung |
| --- | --- | --- |
| Mathe-Generatoren (`site/js/math/`) | alle Mathematik-Fertigkeiten, mit Darstellungen wie im Lehrmittel: Zehner- und Zwanzigerfeld mit Fünferstruktur, Würfel- und Fingerbilder, Zerlegungshaus, Schüttelbox, Plättchen in zwei Farben, Zahlenstrahl, Rechenstrich, Zahlenmauer, Münzen, Uhr, Waage | Lösung im Code berechnet, je Stufe 200 Aufgaben, Nachrechnen auf zweitem Weg (`SPEC-MATHE.md`) |
| Wortgeneratoren (`site/js/deutsch/`) | Laute, Buchstaben, Silben, Wörter lesen und legen, Oberbegriffe, Einzahl und Mehrzahl, Reime – gebildet aus dem Wortlexikon | Lösung aus den Lexikon-Daten berechnet, keine nicht eingeführten Buchstaben, keine verwechselbaren Bilder |
| Feste Inhalte (`site/data/inhalte/deutsch/`) | Sätze, kleine Geschichten, Anweisungen, Gegenteile, Bildergeschichten | Schema, Selbsttest, zweiter Durchgang (`AUFTRAG-INHALTE.md`) |

**Wortlexikon** (`site/data/woerter.json`, gegengelesen): 295 Bildwörter mit Artikel, Sprechsilben, Lauten (eine Einheit pro Laut in der Schreibung), Anlaut- und Endlaut-Klang, Bild, Mehrzahl, Oberbegriff, Reimgruppe, Merkstellen und den Buchstaben, die es braucht. Davon sind 166 lautgetreu (94 ohne jede Verbindung, 72 mit Sch, Ei, Au, Ie usw.), 27 Reimgruppen, 37 Sichtwörter in drei Gruppen (als Wortbilder von der Sperre durch Verbindungen ausgenommen). Dazu 62 verwechselbare Paare (Kuchen und Torte, Huhn und Hahn, Schloss und Burg) und Unterbegriffe (Taube ist ein Vogel, Pudel ein Hund), die nie zusammen angeboten werden. 63 Bilder sind als «Name unsicher» markiert, weil ein Kind in Zürich sie oft anders nennt (🐞 «Marienkäfer», 🥕 «Rüebli», 🍪 «Guetzli», 🏍️ «Töff»); sie kommen nur vor, wenn das Wort gesprochen wird oder dasteht. **Abweichung vom Auftrag:** Verlangt waren etwa 300 lautgetreue Bildwörter. Mit eindeutigen Emoji gibt es nicht so viele; 94 lautgetreue Wörter ohne Verbindung reichen für die Schreibaufgaben der 1. Klasse. Eigene SVG-Bilder für weitere lautgetreue Wörter (Esel, Rabe, Ofen, Tisch, Rad …) waren für Etappe 4 vorgesehen und sind verschoben: Die Generatoren kommen mit den vorhandenen Wörtern aus; wo es eng wird, steht es unten bei «Deutsch».

**Gegenlesen in Etappe 1:** Eine zweite Instanz hat Lexikon, Katalog und Buchstabenplan als Lehrperson der Unterstufe geprüft. Eingearbeitet: Reime mit zwei richtigen Lösungen (Pokal, Lineal, Vulkan), Komposita in Reimgruppen (Fledermaus, Spiegelei), nicht hörbare Mehrzahl (die Ananas), Bilder mit mehreren Dingen (🍒, 🧦), fehlende Unterbegriffe und verwechselbare Paare, gleich klingende Ablenker (eigene Liste `nieZusammen` im Buchstabenplan), Silben, die die Stimme nicht gut spricht, Klassenzuordnung der Lautanalyse (jetzt 1. Halbjahr), mehrdeutige Stufen in Mathematik (Quadrat und Rechteck, Zahlendreher über 20, Münzwerte über 20), neue Fertigkeiten «Ordnungszahlen» und «Nomen und Begleiter», Blitzrechnen bis 20 im 2. Halbjahr. Anlautwörter: «Bär» für ä, «Jacke» für j; «Mandarine» statt «Orange», «Jacke» statt «Mantel», «Kessel» statt «Eimer».

**Mathematik (Stand Etappe 3):** Alle 50 Fertigkeiten mit je drei Stufen haben Generatoren (`site/js/math/za.js`, `me.js`, `ze.js`, `re.js`, `fo.js`, `gr.js`). Jede Stufe erzeugt mindestens 15 verschiedene Aufgaben, wo der Zahlenraum das zulässt (zehn Stufen schöpfen mit 7 bis 11 Aufgaben alle Möglichkeiten aus, etwa «Plus bis 5 mit Plättchen»). Die Darstellungen sind eigene SVG-Zeichnungen (`site/js/ui/darstellung.js`): Zehner- und Zwanzigerfeld mit Fünferstruktur (rot zuerst, dann blau, in Lesereihenfolge; Durchgestrichenes von hinten), Würfel- und Fingerbilder (gezählt wird mit dem Daumen zuerst), Plättchen, Dinge in Gruppen, Zehnerstreifen, Zahlenhaus, Schüttelbox, Zahlenstrahl, Rechenstrich, Zahlenmauer, Zahlensteine in einer Reihe, Münzen und Geldscheine (vereinfacht, mit Wert), Uhr, Waage, Strichliste, Bilddiagramm, Formen, Körper, Gitter mit Fuchs und Steinen, Spiegel, Stäbe mit Kästchen oder Massstab. Antwortfelder sind leere Kästchen mit einem blassen Fragezeichen; das Zahlenfeld zeigt die Zahlen in Fünferreihen (1 bis 5, 6 bis 10 …) und die 0 darunter. Nachspuren der Ziffern 0 bis 9 mit eigenen Vorlagen (`site/data/schrift/basisschrift.json`, erzeugt mit `tools/baue_schrift.mjs`), tolerant geprüft (`site/js/core/nachspur.js`, Toleranz 10 % der Zeilenhöhe).

**Deutsch (Stand Etappe 4):** Alle 42 Fertigkeiten mit je drei Stufen haben Generatoren (`site/js/deutsch/hb.js`, `bu.js`, `le.js`, `sc.js`, `ws.js`, `hv.js`), gebildet aus dem Wortlexikon, dem Buchstabenplan und festen Inhalten (`site/data/inhalte/deutsch/`: Sätze, Lesetexte, Geschichten zum Zuhören, Anweisungen, Gegenteile, Bildergeschichten, Hörsätze; 309 Einheiten). Jede Aufgabe trägt in `braucht` die Buchstaben und Verbindungen, die sie zeigt; ist eine davon nicht eingeführt, entsteht die Aufgabe nicht. Sichtwörter gelten als Wortbilder («die» braucht nur d, i, e). Lese- und Schreibaufgaben zeigen Silbenbögen als Lesehilfe; Hörkarten (Laute, Silben, Wörter) werden zuerst angetippt und angehört, beim zweiten Antippen gelegt. Buchstaben und Wörter zum Nachspuren in Basisschrift (68 eigene Vorlagen: Ziffern, A bis Z, a bis z, Umlaute). Lernwörter der Woche tragen die Eltern ein; geübt werden nur Wörter, deren Buchstaben eingeführt sind. Mit der Standard-Freigabe (alle Einzelbuchstaben, Sch, Ei, Au) gesperrt sind D-BU-07 und D-LE-09 ab Stufe 2 (andere Verbindungen). Wenig Abwechslung (unter 20 verschiedene Aufgaben) haben D-BU-04/3 (10 Zeichen), D-WS-05 (7 bis 9 Bildergeschichten), D-HV-02 (13 bis 14 Geschichten) und D-LE-10 (9 bis 11 Lesetexte); mehr feste Inhalte würden helfen.

Prüfung Deutsch: `tools/teste_deutsch.mjs` (je Stufe 200 Aufgaben mit Standard- und kleiner Freigabe: Lösung eindeutig und akzeptiert, keine nicht eingeführten Buchstaben, keine verwechselbaren Bilder, Bildnamen sicher, Schreibweise, verbotene Wörter), `tools/pruefe_inhalte.mjs` (Schema der festen Inhalte), `tools/selbsttest_inhalte.mjs` (jede Inhaltseinheit kommt in einer Aufgabe vor), Unit-Tests je Gruppe mit Nachprüfung der Lösung auf zweitem Weg, Browser-Bot über alle Stufen (iPad, iPhone, dunkel). Die Generatoren und Inhalte haben mehrere Instanzen geschrieben und selbst gegengelesen; eine weitere, unabhängige hat alle festen Inhalte und eine Stichprobe der erzeugten Aufgaben als Lehrperson geprüft (zweiter Durchgang): 2 Einheiten gestrichen, 12 korrigiert, 11 Hinweise zu Generatoren umgesetzt (unter anderem: Hinweise nennen die Wörter in der Reihenfolge der Karten, damit die Reihenfolge die Lösung nicht verrät; bei «der, die, das» keine Wörter mit gleicher Mehrzahl; 🧥 und 📷 nur mit gesprochenem Namen). Was fachlich unsicher bleibt, steht in den Abschnitten 12 und 13.

Welche Aufgaben ein Stein spielt, bestimmt seit Etappe 5 der Tagesplan (Abschnitt 6). Im Elternbereich lässt sich unter «Aufgaben» jede Stufe so ausprobieren, wie das Kind sie sieht und hört.

## 5. Lernmodell

Pro Fertigkeit und Stufe ein Stand (`parameter.json`, Abschnitte `beherrschung`, `zeigRunde`, `karteikasten`, `entdeckerrunde`, `schatzkarte`). Umgesetzt in `site/js/core/stand.js` (Stand, Status, Zeig-Runde), `kasten.js` (Karteikasten), `plan.js` (Tagesplan), `lernen.js` (Verbuchen, Entdeckerrunde, Schatzkarte, Sammelbild) und `ablauf.js` (Ablauf eines Steins); die Oberfläche (`ui/sitzung.js`) und die Simulation (`tools/sim/lauf.mjs`) benutzen denselben Code.

- **Wert:** gleitender Mittelwert der Antworten (richtig 1, nach Hinweis 0.5, falsch 0); ältere Antworten zählen weniger (Gewicht halbiert sich nach 8 Antworten). Start mit zwei gedachten falschen Antworten, damit zwei Glückstreffer nicht reichen. Nachspuren zählt als «geübt», nicht in den Wert.
- **Vergessen:** Wert × 0.5^(Tage seit der letzten Antwort / (3 × Merkdauer)). Merkdauer startet bei 4 Tagen, verdoppelt sich nach einem guten Tag (mindestens 75 % richtig), halbiert sich nach einem schwachen (unter 40 %), Grenzen 2 bis 64 Tage. Die Schwellen sind sanfter als bei der Lernplattform.
- **Status für die Eltern:** **neu** (weniger als 3 Antworten), **am Üben** (Wert unter 0.7), **fast sicher** (Wert mindestens 0.7), **sicher** (Wert mindestens 0.8 und eine bestandene Zeig-was-du-kannst-Runde; sinkt der Wert später unter 0.7, gilt die Stufe wieder als fast sicher und wird wiederholt).
- **Zeig-was-du-kannst-Runde:** wenn der Wert mindestens 0.8 ist und mindestens 6 Antworten an 2 Tagen vorliegen. 4 Aufgaben ohne Hinweis; bestanden mit 4 von 4, oder 3 von 4 und eine fünfte richtig. Für das Kind heisst sie «Zeig, was du kannst» und sieht aus wie jede Runde, mit einem kleinen Stern am Schluss. Nicht bestanden heisst nur: weiter üben; frühestens am nächsten Tag und nach mindestens drei weiteren Antworten ein neuer Versuch. Höchstens eine Runde pro Tag. Eine Stufe, die in der Entdeckerrunde übersprungen wurde («vermutet»), darf einmal direkt in eine Zeig-Runde.
- **Leichter werden:** Zwei Fehler in Folge auf einer Stufe: in der Sitzung eine Stufe leichter weiter, am nächsten Tag erneut versuchen.
- **Karteikasten (Leitner):** Fächer nach 1, 3, 7, 14, 30 Tagen; ein Fehler setzt die Karte ins erste Fach. Arten: Buchstaben (Laut und Buchstabe, alle eingeführten ausser c, q, v, x, y, ä, ö, ü; mit Stimme Laut hören und Buchstabe wählen, ohne Stimme Buchstabe sehen und Bild wählen), Verbindungen und Sichtwörter (nur mit Stimme; Sichtwörter erst, wenn «Häufige Wörter» angefangen ist), Lernwörter der Woche (nur mit eingeführten Buchstaben), Blitzrechnen: Zerlegungen bis 10 (sobald «Zerlegen» trägt), Plus und Minus bis 10 (sobald «Minusrechnen» trägt), bis 20 mit Zehnerübergang (sobald die Minus-Strategien tragen). Höchstens 4 neue Karten pro Tag. Buchstaben, die in der Entdeckerrunde im ersten Versuch kamen, starten im dritten Fach. Jede Karte übt eine Stufe einer Fertigkeit (zum Beispiel D-BU-01 oder M-RE-14) und zählt auch dort.
- **Entdeckerrunde statt Einstufung:** Die ersten drei Lerntage sind normale, kurze Sitzungen mit leichten Aufgaben quer durch beide Fächer. Pro Fertigkeit, die laut Lehrmittel schon dran war, beginnt sie auf Stufe 1; sind zwei Aufgaben richtig, geht es eine Stufe höher. Was so übersprungen wird, startet mit Wert 0.6 und der Markierung «vermutet» (Elternbereich); eine Zeig-was-du-kannst-Runde kann es später bestätigen. Für das Kind gibt es keinen Test, nur einen Ausflug. Ist alles angetippt, füllt der normale Plan die Steine.
- **Schatzkarte:** alle 6 bis 8 Schulwochen (Ferienwochen zählen nicht), die erste nach etwa 6 Schulwochen. 10 bis 12 gemischte Aufgaben aus allem, was bisher dran war. Für das Kind ein Abenteuer mit einem Schatz am Ende, für die Eltern ein Standortbild pro Bereich (Anteil im ersten Versuch gelöst, Veränderungen des Status) mit Vergleich zum letzten Mal. Fällig ist sie am ersten Lerntag nach 6 ganzen Schulwochen (ab der Woche nach der letzten), wenn mindestens 8 Stufen geübt sind. Ab Start am 19.10.2026 ergibt das in der Simulation: 30. November, 1. Februar, 5. April, 7. Juni (Ferienwochen zählen nicht).

## 6. Tagesplan und Lernzeit

- **Lerntage:** Montag bis Freitag (einstellbar). In den Ferien und an Feiertagen der Schule Schlieren (`ziele.json`) ist nichts geplant; die App zeigt «Heute ist frei» und bietet an, trotzdem zu üben.
- **Zeit:** fest 10 Minuten (Eltern 5 bis 15). Keine Berechnung aus Etappenzielen; die Zeit ist fest, der Inhalt passt sich an.
- **Bausteine** (zwei bis vier, Reihenfolge): 1. Aufwärmen (1 bis 2 Minuten, Karteikasten, abwechselnd Buchstaben und Blitzrechnen); 2. und 3. Deutsch und Mathematik (je 2 bis 4 Minuten, das Kind wählt die Reihenfolge); 4. Schlussstein (1 bis 2 Minuten, etwas Sicheres oder Freies: Nachspuren, Muster, Zählen). Bei 5 Minuten fällt ein Hauptteil weg (die Fächer wechseln sich von Tag zu Tag ab).
- **Gewichtung:** Deutsch 55 %, Mathematik 45 % der Hauptteile (einstellbar).
- **Was drankommt** (innerhalb eines Fachs): eine allfällige Zeig-Runde zuerst, dann eine fällige Wiederholung als leichter Einstieg, Lernwörter vor einem Wörtertest (3 Tage vorher), danach abwechselnd aktueller Stoff (aktuelles Mathe-Kapitel; im Deutsch die ersten zwei Themen der Reihenfolge, deren erste Stufe noch nicht trägt), Weiterkommen (angefangene Stufen und die nächste Stufe, abwechselnd), Wiederholung, Lücken (was laut Lehrmittel schon dran war, aber noch nie geübt wurde) und zum Schluss Stufen kurz vor ihrer Zeig-Runde. Höchstzahlen je Grund und Aufgaben je Eintrag in `parameter.json` (`plan.quoten`). Der Plan ist eine Warteschlange; wie weit sie reicht, entscheidet die Zeit. Höchstens ein neues Thema pro Tag; neu heisst: noch nie geübt und laut Lehrmittel noch nicht dran. Keine Aufgabe zweimal im selben Baustein. Höhere Stufen kommen erst, wenn die tiefere trägt (fast sicher, sicher oder vermutet). Zwei nicht gelöste Aufgaben in Folge: für den Rest der Sitzung eine Stufe tiefer.
- **Zeitgrenze:** Die Zeit pro Aufgabe wird gemessen (Start 25 Sekunden, Nachspuren 35, Legen 40, Karte 12) und plant die nächsten Sitzungen. Nach der eingestellten Zeit beginnt keine neue Aufgabe mehr; der Schlussstein ist vorher reserviert (bei 10 Minuten 75 Sekunden), seine erste Aufgabe kommt immer. Jeder Stein hört auf, wenn seine eigene Zeit um ist. Einzige Ausnahme: Ist die letzte Aufgabe nicht gelungen, folgt genau eine sehr leichte (höchstens 30 Sekunden), damit die Sitzung mit einem Erfolg endet. Aufwärmen: abwechselnd ein Tag Deutsch-Karten, ein Tag Rechen-Karten; sind es weniger als drei, füllen fällige Wiederholungen des Fachs auf.
- **Etappen nur für die Eltern:** Weihnachten (18.12.2026), Frühling (23.4.2027), Ende 1. Klasse (16.7.2027). Der Elternbereich zeigt, was laut Lehrmittel bis dahin dran ist und wie der eigene Übungsstand dazu aussieht, ohne Prozentziele.

## 7. Belohnung

Ein **Sammelbild** (`site/js/ui/sammelbild.js`): Ein Herbstwald füllt sich; jede fertige Sitzung bringt ein Tier oder eine Pflanze (eigene SVG-Zeichnungen, 45 feste Plätze je Bild, das neue Teil wächst auf der Schlusskarte aus dem Boden). An einem Tag mit bestandener Zeig-was-du-kannst-Runde wird das Teil etwas Besonderes (Glühwürmchen, Stern, Regenbogen, Libelle), statt dass ein zusätzliches dazukommt; so bleibt es bei etwa 9 Wochen pro Bild. Die Schlusskarte zeigt das Bild und sagt, was dazugekommen ist; der Fuchs lobt den Einsatz. Ist ein Bild voll (45 Teile, etwa 9 Wochen), beginnt das nächste: Winterwald, Frühlingswiese, Sommersee. Fertige Bilder bleiben im Album. Kein Zusammenhang mit Fehlern, nichts geht verloren, keine Serien. Im Elternbereich abschaltbar. Der Fuchs freut sich über Einsatz, nicht über Richtigkeit.

## 8. Elternbereich

Text, hinter der Eltern-PIN wie bei der Lernplattform (gesalzener Hash; Kindersicherung, kein Zugangsschutz; sperrt nach 15 Minuten).

- **Heute und Stand:** was heute geübt wurde; Stand je Fertigkeit (neu, am Üben, fast sicher, sicher, vermutet), beschriftet mit «Eigener Übungsmassstab dieser App, keine Beurteilung der Schule»; Schatzkarten-Berichte mit Vergleich; Etappen als Orientierung. Hinweis zur Lehrperson, wenn eine Grundfertigkeit (Laute, Zählen, Mengen, Zerlegen) über 6 Lerntage und 30 Antworten unter Wert 0.5 bleibt.
- **Buchstabenplan:** alle Buchstaben und Verbindungen in der angenommenen Reihenfolge, je «eingeführt» an- oder abhaken, Reihenfolge änderbar; Hinweis, die Reihenfolge der Schule zu übernehmen.
- **Mathematik:** aktuelles Kapitel wählen (Liste nach «Mathematik 1»; ohne Angabe schätzt die App es aus dem Datum), Zahlenraum freigeben (10, 20, 100).
- **Lernwörter der Woche:** Wörter eintippen, Datum des Tests (optional); sie gehen in Karteikasten und Plan.
- **Einstellungen:** Lerntage, Minuten, Gewichtung, Vorlesen-Aufgabe, Belohnung, Stimme wählen und testen (inklusive Hörtest der Dehnlaute und Silben, Schalter «Dehnlaute vorsprechen» und «Silben einzeln vorsprechen»), Sprechtempo, gesprochene Fachbegriffe (z. B. «Zahlenhaus» oder «Zerlegungshaus»), Name (bleibt auf dem Gerät), PIN ändern, eine zusätzliche Sitzung für heute freigeben.
- **Rückmeldungen:** Aufgabe melden (die Eltern, nicht das Kind), Liste der Meldungen.
- **Daten:** Sicherung herunterladen und einspielen, Abgleich zwischen Geräten, Pakete importieren (Wortlisten, Lernwörter, zusätzliche Aufgaben), Zurücksetzen.
- **Grenzen:** eine Seite, was die App kann und nicht kann (Abschnitt 11).

## 9. Technik, Datenschutz, Bereitstellung

Wie die Lernplattform, aus der die Infrastruktur übernommen (kopiert und angepasst, nicht eingebunden) wird:

- Statische Website, ES-Module, kein Framework, keine externen Skripte, Schriften, Bilder, Tracker oder Netzwerkdienste, keine Laufzeit-KI. `site/_headers` mit `default-src 'self'` und den übrigen Regeln der Vorlage (Mikrofon und Kamera gesperrt; die Sprachausgabe braucht keine Freigabe; Töne über Web Audio, keine Mediendateien).
- Offline über Service Worker; neue Versionen werden im Hintergrund geladen und erst auf Knopfdruck der Eltern aktiviert, nie mitten in einer Sitzung. Manifest `lang` `de-CH`, Name «Lernwelt», eigene Icons.
- Daten in IndexedDB. Der Vorname bleibt auf dem Gerät und steht nirgends im Code, in keiner Datei des Repos und in keinem Abgleich.
- Abgleich zwischen den Geräten der Familie wie in der Vorlage: Pages Function `/api/abgleich`, D1-Datenbank `lernwelt` (Jurisdiktion EU), Prüfung des Access-Tokens; ohne `TEAM_DOMAIN`, `POLICY_AUD` und Datenbank bleibt der Abgleich aus.
- Bereitstellung über GitHub: Pages-Projekt mit Production branch `main`, Build `node tools/baue.mjs`, Ausgabe `site`, `NODE_VERSION` 22. Custom Domain `www.jakobjaeger.ch`; `jakobjaeger.ch` leitet per Redirect Rule auf `www` um. Cloudflare Access schützt `www.jakobjaeger.ch`, `jakobjaeger.ch` und `*.<projekt>.pages.dev` (One-time PIN, Mailadressen der Familie, Sitzung 1 Monat), dieselbe Zero-Trust-Team-Domain wie die Lernplattform, aber eine eigene Access-Anwendung mit eigenem AUD-Tag. Empfehlung: Pages-Projektname neutral («lernwelt»), weil `*.pages.dev`-Namen öffentlich sichtbar sind.
- Alle Schritte stehen ab Etappe 2 in `README.md`, so dass sie ohne Rückfrage ausführbar sind.

## 10. Qualitätssicherung und Simulation

- Mathematik: `tools/teste_mathe.mjs` (je Stufe 200 Aufgaben, Lösung, Eindeutigkeit, Zahlenraum, keine negativen Ergebnisse, Schweizer Schreibweise) und Unit-Tests pro Generatorgruppe mit Nachrechnen auf zweitem Weg.
- Deutsch: Abschnitt 4 (Prüfung Deutsch).
- Katalog und Lexikon: `tools/pruefe_katalog.mjs`, `tools/pruefe_woerter.mjs`.
- Lernmodell, Karteikasten, Plan: Unit-Tests (`tools/tests/lernmodell.test.mjs`).
- Browser-Bot über alle Stufen beider Fächer (iPad quer, iPhone, dunkles Design, «Bewegung reduzieren»), ohne Konsolenfehler; ganze Lerntage im Kinderbereich (Weg, Steine, Szenen, Schlusskarte). Sprachausgabe im echten Safari von Hand (Prüfliste in `README.md`, Etappe 7).
- **Simulation** (`tools/sim/lauf.mjs`): drei Kinder (langsam, mittel, schnell; angenommenes Können zu Beginn, Lernrate, Tempo, Ausfalltage) vom 19.10.2026 bis zum 16.7.2027, mit dem echten Tagesplan, dem echten Ablauf und den echten Generatoren; nur das Antworten ist simuliert. Geprüft: keine Aufgabe nach der Zeit (ausser der reservierten ersten im Schlussstein und der Erfolgsaufgabe), jede Sitzung endet mit einer gelösten Aufgabe, keine nicht eingeführten Buchstaben, kein Zahlenraum über der Freigabe, keine Karte vor ihrer Fälligkeit, Schatzkarten-Abstände, höchstens ein neues Thema und eine Zeig-Runde pro Tag, keine leeren Steine.

Ergebnis (Stand Etappe 5, 10 Minuten, Lerntage Montag bis Freitag; Stufen der 1. Klasse: Deutsch 93, Mathematik 96):

| | langsam | mittel | schnell |
| --- | --- | --- | --- |
| Lerntage mit Sitzung | 140 | 144 | 157 |
| Aufgaben pro Tag (Mittel) | 20 | 27 | 33 |
| Minuten pro Tag (Mittel / längster Tag) | 9.5 / 10.3 | 9.4 / 10.3 | 9.0 / 10.1 |
| Weihnachten: sicher oder fast sicher (D / M) | 12 / 5 | 23 / 15 | 32 / 32 |
| Ende 1. Klasse: sicher oder fast sicher (D / M) | 32 / 21 | 51 / 44 | 64 / 75 |
| Schatzkarten | 30.11., 3.2., 5.4., 7.6. | 30.11., 1.2., 5.4., 7.6. | wie mittel |
| Verstösse gegen die Regeln oben | 0 | 0 | 0 |

Die Zahlen hängen an den angenommenen Profilen und sind kein Massstab für ein echtes Kind. Sie zeigen: Die Zeit hält, jede Sitzung endet mit einem Erfolg, und auch ein langsames Kind kommt voran, ohne dass die App drängt. Ein Teil der Stufen bleibt am Ende «neu»: dritte Stufen, Themen, die erst gegen Sommer drankommen, und Stufen mit Verbindungen, die noch nicht eingeführt sind.

## 11. Grenzen

- Die App ersetzt keine Förderung und keine Abklärung. Halten Schwierigkeiten mit Lauten, Zahlbegriff oder Mengen an, ist das Gespräch mit der Lehrperson der richtige Weg; die App sagt das im Elternbereich.
- «Sicher» ist ein eigener Übungsmassstab aus wenigen Aufgaben, keine Beurteilung und keine Prognose.
- Die Gerätestimme ist eine Annäherung; Laute klingen nicht wie bei der Lehrperson. Sprechen und Vorlesen prüft die App nicht (kein Mikrofon); Nachspuren ist Übung, keine Beurteilung der Handschrift.
- Bilder sind Emoji; sie sehen je nach Gerät etwas anders aus.
- Alle Inhalte sind KI-erzeugt und automatisch geprüft, aber von keinem Menschen gegengelesen. Meldungen der Eltern fliessen in Korrekturen ein.

## 12. Annahmen

1. **Verbindungen:** eingeführt sind Sch, Ei, Au; nicht eingeführt Ch, Eu, Ie, St, Sp, Pf, Ck, Tz, Ng, Nk, Qu, Äu (`buchstaben.json`).
2. **Buchstabenreihenfolge** (Vokale und dehnbare Laute zuerst): nur relevant, falls Buchstaben wieder abgehakt werden.
3. **Deutsch-Lehrmittel:** «Deutsch Eins» (silbenanalytisch); die Deutsch-Reihenfolge ist ein Vorschlag.
4. **Mathematik:** «Mathematik 1 Primarstufe»; die Zuordnung der Kapitel zu den Fertigkeiten ist von der App; Inhalt von «Schlüsselrechnungen», «Rechnungsfolgen», «Regeln und Strategien» angenommen.
5. **Zahlenraum 20** ist eingeführt; gerechnet wird zuerst bis 10. Zerlegungen mit 0 erst auf Stufe 3.
6. **Begriffe:** «Zwanzigerfeld» und «Zahlenhaus» (gesprochen), «Quadrat» und «Viereck» wie im Lehrmittel; das Lehrmittel nennt ein Kapitel «Punktefeld». Beide Begriffe sind im Elternbereich änderbar.
7. **Basisschrift unverbunden** in der 1. Klasse.
8. **Ferien:** Schlieren 2026/27 und 2027/28 nach localcities.ch und feriolo.ch; Sportferien 2028 und Auffahrtsbrücke 2028 angenommen.
9. **Gerät:** iPad mit iPadOS 14.2 oder neuer (Emoji 13); eine deutsche Stimme lässt sich laden.
10. **Start** der Nutzung am 19.10.2026 (Simulation und erste Schatzkarte).
11. **Fingerbilder:** gezählt wird mit dem Daumen zuerst; die linke Hand zeigt 1 bis 5, die rechte 6 bis 10.
12. **Ziffern zum Nachspuren:** die 1 mit kurzem Aufstrich, die 7 ohne Querstrich, die 4 offen in zwei Strichen, die 5 mit dem Dach als zweitem Strich.
13. **Zerlegungen:** «alle Zerlegungen» (M-ZE-02 Stufe 3) ohne «0 und 7»; Würfelpunkte heissen «Augen».
14. **Zwanzigerfeld:** Plättchen in Lesereihenfolge (obere Reihe zuerst voll), beim Legen mit zwei Farben je die erste Fünfergruppe einer Reihe rot, die zweite blau.
15. **Wörter in Rechengeschichten:** Znüni, Pausenplatz, Weiher; Tagesablauf mit «Frühstück» und «Mittagessen» (Standarddeutsch, die Gerätestimme spricht es besser als «Zmorge»).
16. **Begriffe:** «Tauschaufgabe», «Rechenfamilie», «Probe», «Nachbarzahl» wie in den Zürcher Lehrmitteln angenommen.
17. **Anlaut:** Langer und kurzer Selbstlaut gelten als gleicher Anfang (Esel und Ente, Igel und Insel). Für Anlaut-Aufgaben nur Wörter, deren Anfang so klingt, wie er geschrieben ist (nicht Stern, Vogel); für Endlaut-Aufgaben keine Wörter mit verhärtetem Auslaut (Zug, Hund).
18. **Verbindungen:** St und Sp gelten nur am Wortanfang als Einheit; Ck und Tz sind Schreibweisen, keine eigenen Laute. Wörter mit chs (Fuchs) kommen in Laut-Aufgaben nicht vor.
19. **Buchstabenformen:** Grosses I und kleines l kommen nie in derselben Zuordnen-Aufgabe vor. Ähnliche Formen (b d p q, m n, u n) erst auf Stufe 3.
20. **Artikel:** Wörter mit schwankendem Artikel in der Schweiz (Tram, Radio, Butter, Brezel, Socke, Magnet, Kiwi, Taxi) kommen in Artikel-Aufgaben nicht vor.
21. **Oberbegriffe:** Obst, Gemüse und Pflanzen, Tiere und Fahrzeuge, Kleider und Körper stehen nie in derselben Sortier-Aufgabe; Schuhe gehören zu den Kleidern.
22. **Karteikasten Buchstaben:** ohne c, q, v, x, y (Klang und Buchstabe passen nicht eindeutig zusammen) und ohne ä, ö, ü (kaum Anlautwörter); diese kommen in anderen Aufgaben vor.
23. **Simulation:** Die drei Profile (Können zu Beginn, Lernrate, Tempo, 5 bis 15 % Ausfalltage) und die Sekunden pro Aufgabentyp sind Annahmen; die App misst die echten Zeiten und plant damit.

## 13. Offene Fragen an die Lehrperson

1. Mit welchem Erstlesewerk arbeitet die Klasse? Welche Buchstabenverbindungen sind schon eingeführt (Sch, Ei, Au, Ch, Eu, Ie, St, Sp, Pf, Ck, Tz)?
2. Wie werden Silben markiert (Bögen, Farben)? Gibt es Lautgebärden oder eine Anlauttabelle?
3. Mathematik: Arbeitet die Klasse mit «Mathematik 1 Primarstufe»? Welches Kapitel ist jetzt dran, welche Themen bis Weihnachten und bis zum Frühling?
4. Schreibt die Klasse die Basisschrift unverbunden oder schon teilverbunden? Gibt es Buchstabenformen, auf die die Lehrperson besonders achtet?
5. Gibt es Lernwörter, Wörtertests oder Hausaufgaben?
6. Welche Darstellungen und Wörter benutzt die Klasse (Zwanzigerfeld oder Punktefeld, Zahlenstrahl, Zerlegungshaus oder Zahlenhaus, Schüttelbox, Rechenstrich)?
7. Welche Strategie für den Zehnerübergang wird geübt (zuerst bis 10, Verdoppeln, beides)?
8. Uhr und Längen: nur volle oder auch halbe Stunden? Schon Zentimeter, oder nur mit Kästchen und Klammern messen?
9. Werden in der 1. Klasse schon Nomen und Begleiter (der, die, das) und die Grossschreibung der Nomen behandelt?
10. Wie zählt die Klasse mit den Fingern (Daumen zuerst)? Wie werden die 1, die 4 und die 7 geschrieben (Aufstrich, offen oder geschlossen, Querstrich)?
11. Gehört «0 und 7» zu den Zerlegungen der 7? Heissen die Wörter «Tauschaufgabe», «Umkehraufgabe», «Rechenfamilie» und «Probe» so wie in der App?
12. Werden Rappen-Münzen schon erkannt, und wird mit Franken schon gerechnet?
13. Gelten «Esel» und «Ente» als Wörter mit gleichem Anfang (langer und kurzer Selbstlaut)?
14. Welche Oberbegriffe kennt die Klasse (Obst, Gemüse, Kleider, Fahrzeuge, Möbel, Musikinstrumente)? Gehören Schuhe zu den Kleidern?
15. Lesen die Kinder schon kurze Texte mit Verneinung («Dort ist der Teddy nicht.») und Fragen nach Wer und Was?

## 14. Zur Durchsicht: Fragen an euch

1. Stimmen die Annahmen in Abschnitt 12, besonders die Verbindungen?
2. Welches iPad (und welche iPadOS-Version) nutzt das Kind? Ist eine deutsche Stimme geladen?
3. Passen 10 Minuten an fünf Tagen und die Gewichtung Deutsch 55 %, Mathematik 45 %?
4. Passen Fuchs und Wald als Figur und Sammelbild? Soll der Fuchs einen Namen haben?
5. Einverstanden mit dem neutralen Pages-Projektnamen «lernwelt»?

## 15. Etappen

1. **Konzept und Spezifikation** (diese Etappe): Konzept, Katalog beider Fächer, Spezifikationen, Wortlexikon-Entwurf, Prüfskripte. Hier anhalten zur Durchsicht.
2. Gerüst: Infrastruktur aus der Vorlage, Start, Heute-Seite, Sprachausgabe, Eltern-PIN, Build; lauffähig und bereitstellbar.
3. Mathematik: Generatoren, Darstellungen, Aufgabentypen, Tests.
4. Deutsch: Wortlexikon fertig, Buchstaben mit Nachspur-Vorlagen, Wortgeneratoren, feste Inhalte, Selbsttest, zweiter Durchgang.
5. Lernmodell, Karteikasten, Tagesplan, Entdeckerrunde, Schatzkarte, Belohnung, Schlusskarte.
6. Elternbereich vollständig, Sicherung, Abgleich, Pakete.
7. Qualitätssicherung, Simulation, Bot, Dokumentation, Liste der offenen Fragen.
