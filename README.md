# Lernwelt (1. Klasse)

Lern-App für ein Kind der 1. Primarklasse in Schlieren (Kanton Zürich, Lehrplan 21, Zyklus 1): Deutsch (Laute, Buchstaben, Lesen, Schreiben, Wortschatz, Zuhören) und Mathematik (Zahlen bis 20, Rechnen, Form und Raum, Grössen). Täglich etwa 10 Minuten, ohne Druck, allein bedienbar ohne Lesen: Jeder Auftrag wird vorgesprochen, Knöpfe sind Bildsymbole, eine Zeigehand zeigt, was zu tun ist. Statische Website auf Cloudflare Pages unter `https://www.jakobjaeger.ch`, offline nutzbar. Die Daten liegen im Browser des Geräts (IndexedDB); optional gleicht die App sie über eine kleine Cloudflare-Datenbank (D1) hinter Cloudflare Access zwischen den Geräten der Familie ab (Abschnitt 4).

Geschwisterprojekt der «Lernplattform» (`mikejaeger-privat/Lernplattform`): Technik, Aufbau der Dokumentation und Prüfwerkzeuge kommen von dort; Didaktik, Inhalte und Bedienung sind für ein sechs- bis siebenjähriges Kind neu.

- **Bereitstellen:** über GitHub; jeder Push auf `main` baut und veröffentlicht automatisch.
- **Konzept und Parameter:** [KONZEPT.md](KONZEPT.md)
- **Eigene Inhalte (Lernwörter, Pakete):** [INHALTE.md](INHALTE.md)

## Stand

**Alle sieben Etappen gebaut und geprüft.** Lauffähig ist die ganze App: Einrichtung (Name, PIN, Stimme mit Hörtest), beide Fächer vollständig (50 Mathematik- und 42 Deutsch-Fertigkeiten mit je drei Stufen), der tägliche Weg aus dem Lernmodell (Aufwärmen mit Karteikasten, Deutsch und Mathematik, Schlussstein; Entdeckerrunde, «Zeig, was du kannst», Schatzkarte, Sammelbild) und der Elternbereich: Heute geübt, Stand je Fertigkeit, Schatzkarten-Berichte, Etappen zur Orientierung, Buchstabenplan, Mathematik-Kapitel, Lernwörter, Aufgaben ausprobieren, Rückmeldungen, Einstellungen, Sicherung, Abgleich zwischen Geräten und Pakete mit eigenen Inhalten ([INHALTE.md](INHALTE.md)).

Vor dem ersten Lerntag: Buchstabenplan und Mathematik-Kapitel nach dem Gespräch mit der Lehrperson einstellen (offene Fragen: [KONZEPT.md](KONZEPT.md), Abschnitt 13) und die Prüfliste im echten Safari unten einmal durchgehen. Was die automatische Schlussprüfung abdeckt, steht in KONZEPT.md, Abschnitt 10.

## Ordner

| Ordner | Inhalt |
| --- | --- |
| `site/` | Die Website (Ausgabeordner für Cloudflare Pages) |
| `site/data/` | Katalog, Wortlexikon, Buchstabenplan, Lehrmittel-Reihenfolge, Ferien, Parameter, feste Deutsch-Inhalte, Nachspur-Vorlagen (JSON) |
| `site/js/` | `app/` Zustand, Speicher, Sprache, Klang, Anbindung des Lernens · `core/` reine Logik (Lernmodell, Karteikasten, Tagesplan, Ablauf eines Steins, Kalender, Prüfen der Antworten, Nachspuren, Abgleichregeln) · `math/` und `deutsch/` Generatoren · `ui/` Kinder- und Elternbereich, Aufgabentypen, Darstellungen, Figuren |
| `site/fonts/` | «Lernwelt Schrift» (Teilmenge von Andika, SIL Open Font License, siehe `LIESMICH.txt`) |
| `functions/`, `server/` | Abgleich zwischen Geräten: Pages Function unter `/api/*` und ihre Logik (D1, Prüfung der Access-Anmeldung) |
| `tools/` | Bau, Prüfungen, Tests, Spezifikationen (nur für die Entwicklung) |
| `quellen/` | Lehrplan-21-Kompetenzen in eigenen Worten, Lehrmittel- und Ferienquellen |

## 1. Auf Cloudflare Pages bereitstellen (über GitHub)

Der Code liegt im privaten Repository `mikejaeger-privat/Jakob`. Pages-Projekt anlegen: Workers & Pages › **Create** › **Pages** › **Connect to Git** › Repository `Jakob` wählen.

| Einstellung | Wert |
| --- | --- |
| Project name | `lernwelt` (ergibt `lernwelt.pages.dev`; anderer Name möglich, dann unten überall ersetzen) |
| Production branch | `main` |
| Build command | `node tools/baue.mjs` |
| Build output directory | `site` |
| Root directory | leer |
| Variable | `NODE_VERSION` = `22` |

Cloudflare baut bei jedem Push auf `main` neu (`baue.mjs` erzeugt die Version des Offline-Speichers `sw.js`) und erkennt den Ordner `functions/` automatisch. Neue Versionen bietet die App nur im Elternbereich an («Eine neue Version ist bereit», Knopf **Jetzt aktualisieren**); im Kinderbereich wird nie neu geladen.

Die Datei `site/_headers` setzt strenge Sicherheitsregeln (Content-Security-Policy `default-src 'self'` ohne externe Quellen, keine Einbettung in fremde Seiten, keine Suchmaschinen-Indexierung). Cloudflare liest sie automatisch.

Zurück zu einer früheren Version: Pages-Projekt › **Deployments** › funktionierende Bereitstellung › **Rollback**. Ein Commit ohne Bereitstellung: `[CF-Pages-Skip]` an den Anfang der Commit-Nachricht.

## 2. Eigene Adresse www.jakobjaeger.ch

Voraussetzung: Die Domain `jakobjaeger.ch` ist als Zone im selben Cloudflare-Konto (Nameserver bei Cloudflare).

1. Pages-Projekt `lernwelt` › **Custom domains** › **Set up a custom domain** › `www.jakobjaeger.ch`. Cloudflare legt den DNS-Eintrag (CNAME auf `lernwelt.pages.dev`) selbst an, das Zertifikat folgt nach wenigen Minuten.
2. Die Adresse ohne `www` weiterleiten: Zone `jakobjaeger.ch` › **DNS** › Eintrag `jakobjaeger.ch` (Typ `A`, Inhalt `192.0.2.1`, **Proxied**) anlegen, falls es keinen gibt. Dann **Rules › Redirect Rules** › **Create rule** › Vorlage «Redirect from root to WWW» oder selbst: Wenn Hostname gleich `jakobjaeger.ch`, dann **Dynamic** auf `concat("https://www.jakobjaeger.ch", http.request.uri.path)`, Status **301**, Query beibehalten.
3. Prüfen: `https://jakobjaeger.ch` landet auf `https://www.jakobjaeger.ch`.

Die App selbst kennt keine Domain; sie läuft auch unter `lernwelt.pages.dev`. Für das Kind immer dieselbe Adresse verwenden: Speicher, Sicherung und Home-Bildschirm-Symbol hängen an der Adresse.

## 3. Zugang schützen mit Cloudflare Access

Die Seite enthält keine persönlichen Daten (die liegen nur auf dem Gerät), trotzdem soll nicht jeder sie öffnen. Für den Abgleich (Abschnitt 4) ist Access Pflicht. Cloudflare Access ist für bis zu 50 Personen kostenlos. Es gilt dasselbe Zero-Trust-Team wie für die Lernplattform; die Lernwelt bekommt aber eine **eigene Anwendung** mit eigenem AUD-Tag.

1. Im Cloudflare-Dashboard **Zero Trust** › **Access › Applications › Add an application › Self-hosted**.
2. **Application name:** `Lernwelt`.
3. **Application domains** (je eine Zeile): `www.jakobjaeger.ch`, `jakobjaeger.ch`, `lernwelt.pages.dev`, `*.lernwelt.pages.dev` (schützt auch die Vorschau-Adressen).
4. **Session duration:** lang wählen, z. B. **1 month**. So muss sich niemand ständig neu anmelden.
5. **Policy:** Action **Allow**, Include **Emails** mit den Mailadressen der Familie. Anmeldemethode **One-time PIN** (Code per Mail) genügt.
6. Speichern. Ab jetzt fragt die Seite zuerst nach Mailadresse und Code. Die Anmeldung erledigen die Eltern einmal pro Gerät.

Hinweise:
- Die Manifest-Datei wird mit Anmeldedaten geladen (`crossorigin="use-credentials"`), damit «Zum Home-Bildschirm» auch hinter Access funktioniert.
- Offline startet die App aus dem Gerätespeicher, auch wenn die Access-Sitzung abgelaufen ist. Neue Versionen und Abgleich gibt es erst nach erneuter Anmeldung; das Kind kann weiter üben.
- Die Eltern-PIN in der App ist nur eine Kindersicherung, kein Zugangsschutz.

## 4. Abgleich zwischen Geräten (optional)

Ohne diese Schritte speichert jedes Gerät für sich. Mit ihnen gleichen alle Geräte der Familie denselben Lernstand ab: beim Öffnen, nach dem Üben, beim Wechsel in eine andere App und alle 5 Minuten. Offline geht das Üben normal weiter; abgeglichen wird, sobald wieder Verbindung besteht.

**Was gespeichert wird:** Lernstände, Karteikasten, Lerntage, Einstellungen, Buchstabenplan, Lernwörter, Tagesplan, Entdeckerrunde, Sammelbild, Schatzkarten, Rückmeldungen, Pakete und das Protokoll der Antworten in einer D1-Datenbank des eigenen Cloudflare-Kontos. **Nicht** gespeichert wird der Vorname: Er wird auf jedem Gerät einmal eingetippt und verlässt das Gerät nie. Die Daten sind nicht Ende-zu-Ende verschlüsselt; Cloudflare könnte sie technisch lesen. Den Zugriff schützen Cloudflare Access und eine zusätzliche Prüfung des Access-Tokens in der Function. Ohne vollständige Einrichtung bleibt der Abgleich aus.

Einrichten (einmalig, im Cloudflare-Dashboard):

1. **Datenbank anlegen:** Storage & Databases › **D1 SQL Database** › **Create Database**. Name `lernwelt`. Unter **Data location** › **Specify jurisdiction** › **European Union** wählen (lässt sich später nicht ändern). **Create**. Die Tabellen legt die App beim ersten Abgleich selbst an.
2. **Datenbank verbinden:** Workers & Pages › Projekt `lernwelt` › **Settings** › **Bindings** › **Add** › **D1 database**. Variable name `DB`, Datenbank `lernwelt`, für **Production**.
3. **Access-Angaben hinterlegen:** im selben Projekt › **Settings** › **Variables and Secrets** › **Add**, für Production:
   - `TEAM_DOMAIN` = die Team-Domain aus Zero Trust (Form `https://<team>.cloudflareaccess.com`; dieselbe wie bei der Lernplattform)
   - `POLICY_AUD` = **Application Audience (AUD) Tag** der Access-Anwendung «Lernwelt» (Zero Trust › Access › Applications › Lernwelt › **Additional settings** › AUD tag). Nicht den Tag der Lernplattform verwenden.
4. **Neu bereitstellen:** Deployments › letzte Bereitstellung › **Retry deployment** (oder einen Commit pushen). Bindings und Variablen gelten erst ab der nächsten Bereitstellung.
5. **Prüfen:** In der App Elternbereich › **Daten** › «Abgleich zwischen Geräten». Dort steht «Angemeldet als …» und «Zuletzt abgeglichen …».

Hinweise:
- **Reihenfolge:** Zuerst auf dem Gerät mit dem aktuellen Stand die App öffnen (lädt den Stand hoch), dann auf den anderen Geräten. Ein neues Gerät erkennt den vorhandenen Stand und fragt nur nach dem Namen.
- **Auf zwei Geräten zwischen zwei Abgleichen üben** (etwa offline unterwegs): Lernstand, Karteikasten und Lerntage werden Eintrag für Eintrag zusammengeführt (der weiter geübte gewinnt), Lernwörter, Meldungen, Schatzkarten, Pakete, Sammelbild-Teile und die Tage der Entdeckerrunde werden vereinigt. Bei Einstellungen und Tagesplan gilt die neuere Änderung. Am selben Tag auf zwei Geräten zu üben ist möglich; dann zählt die Lernzeit pro Gerät.
- **Zurücksetzen** im Elternbereich löscht dann alles online und auf allen Geräten (braucht eine Verbindung).
- **Access abgelaufen:** Geübt werden kann weiter. Der Elternbereich zeigt «Abgleich pausiert» mit dem Knopf **Neu anmelden**. Im Kinderbereich erscheint dazu nichts.
- Kosten: Das kostenlose Kontingent von D1 und Pages Functions reicht für eine Familie bei Weitem.

## 5. Auf dem iPad einrichten

Hauptgerät ist das iPad im Querformat; auf dem iPhone ist die App ebenfalls brauchbar.

1. **Stimme laden (zuerst):** Einstellungen › Bedienungshilfen › Gesprochene Inhalte › **Stimmen** › **Deutsch**. Eine Stimme in der Qualität **Erweitert** oder **Premium** laden (z. B. «Anna»). Diese klingen deutlich natürlicher als die einfachen Stimmen. Siri-Stimmen stehen Websites in der Regel nicht zur Verfügung.
2. Die Adresse `https://www.jakobjaeger.ch` in **Safari** öffnen, bei Access anmelden, dann in der App: Name des Kindes, Eltern-PIN, **Stimme wählen und Hörtest machen**. Der Hörtest prüft, ob die Stimme einzelne Silben («So», «fa», «La») und gedehnte Laute («mmm») verständlich spricht. Klingt etwas falsch, lässt die App die betroffenen Aufgaben weg.
3. **Teilen › Zum Home-Bildschirm**. Danach die App **immer über das Symbol** öffnen: Dann läuft sie im Vollbild und offline, und Safari löscht die Daten nicht nach einigen Wochen ohne Besuch.
4. Achtung: Safari-Tab und Home-Bildschirm-Symbol haben **getrennte Speicher**. Wer schon im Tab eingerichtet hat: dort im Elternbereich eine Sicherung herunterladen und im Symbol unter **Eltern › Daten › Sicherungsdatei wählen** einspielen (oder den Abgleich nutzen).
5. Elternbereich › Daten zeigt, ob der Browser die Daten dauerhaft aufbewahrt.
6. Empfohlen, wenn das Kind allein übt: **Geführter Zugriff** (Einstellungen › Bedienungshilfen › Geführter Zugriff) hält das iPad in der Lernwelt. Starten: in der Lernwelt dreimal die obere Taste (oder die Home-Taste) drücken.

**Prüfliste Sprachausgabe** (wenn das Kind sagt «es redet nicht»):
- Lautstärke des iPads hoch? Kopfhörer oder Bluetooth-Lautsprecher verbunden, die gerade nicht in Reichweite sind?
- Beim iPhone: Ist der Ton aus (Stummschalter oder Aktionstaste)? Die Sprachausgabe kann dann stumm bleiben.
- Elternbereich › Einstellungen › Stimme: Ist eine Stimme gewählt? Spricht der **Probesatz**?
- Nach einem iPadOS-Update oder dem Löschen von Stimmen: Stimme neu laden (Schritt 1), App schliessen und neu öffnen, Hörtest wiederholen.
- Safari spricht erst nach der ersten Berührung. Das ist eine Regel von Apple; der grosse Startknopf erledigt das.
- Ohne Stimme spielt die App nur Aufgaben, die ohne Ton gehen, und zeigt das den Eltern an.

## 6. Sicherung (wichtig)

Ohne Abgleich liegen alle Lernstände nur auf diesem einen Gerät. Geht das Gerät verloren oder werden die Website-Daten gelöscht, sind sie weg, ausser es gibt eine Sicherung. Mit Abgleich liegt eine Kopie online; eine Sicherungsdatei schützt trotzdem zusätzlich, etwa vor versehentlichem Zurücksetzen.

- **Sichern:** Elternbereich › Daten › **Sicherung herunterladen**. Es entsteht eine JSON-Datei (z. B. `lernwelt-sicherung-2026-11-02.json`). Auf dem iPad landet sie in der App «Dateien»; am besten in iCloud Drive oder per Mail an sich selbst ablegen. Die Datei enthält den Vornamen und die Lernstände; nicht weitergeben.
- **Erinnerung:** Die App erinnert im Elternbereich nach 14 Tagen ohne Sicherung, wenn der Browser die Daten nicht dauerhaft schützt schon nach 7 Tagen. Das Kind sieht davon nichts.
- **Einspielen oder Gerät wechseln:** Auf dem neuen Gerät die App öffnen. Beim ersten Start unter «Daten von einem anderen Gerät übernehmen» oder später unter Eltern › Daten › **Sicherungsdatei wählen**. Die Daten auf dem Gerät werden dabei ersetzt.
- Kann die App einmal nicht starten (z. B. Speicher beschädigt), bietet die Fehlerseite ebenfalls «Sicherung einspielen» an.

## 7. Anpassen ohne Programmieren

Alle Dateien in `site/data/` sind JSON und mit einem Texteditor bearbeitbar. Danach prüfen (Abschnitt 8) und pushen.

| Datei | Was man dort ändert |
| --- | --- |
| `buchstaben.json` | Buchstaben und Verbindungen mit Anlautwort und Startwert «eingeführt» (im Elternbereich unter «Buchstaben» laufend nachführen) |
| `lehrmittel.json` | Reihenfolge der Kapitel von «Mathematik 1 Primarstufe» mit Monat; Reihenfolge der Deutsch-Stufen (Annahme); unter `schule.abschnitte` die Elternbriefe der Lehrperson (siehe unten) |
| `ziele.json` | Etappen des Schuljahrs, Ferien, Feiertage und einzelne schulfreie Tage der Schule Schlieren |
| `parameter.json` | Lernzeit (10 Minuten, 5 bis 15), Lerntage, Gewichtung Deutsch/Mathematik, Schwellen des Lernmodells, Karteikasten-Abstände, Sprechtempo, Begriffe, Sammelbild |
| `woerter.json` | Bildwörter mit Silben, Lauten, Reim und Merkstellen (Regeln in `tools/SPEC-AUFGABEN.md`) |
| `inhalte/deutsch/*.json` | Feste Deutsch-Inhalte: Sätze, Lesetexte, Geschichten, Anweisungen, Gegenteile, Bildergeschichten, Hörsätze (Regeln in `tools/AUFTRAG-INHALTE.md`; danach `node tools/pruefe_inhalte.mjs` und `node tools/baue.mjs`) |
| `katalog/*.json` | Fertigkeiten und Stufen (Regeln in `tools/SPEC-KATALOG.md`) |

**Neuer Elternbrief** (zum Beispiel zum 3. Quintal): in `lehrmittel.json` unter `schule.abschnitte` einen Eintrag nach dem Muster «2026-q2» anfügen: `von` und `bis` (erster und letzter Schultag des Abschnitts), `quelle`, unter `M` die Themen und die Kapitelnamen von «Mathematik 1» (in der Reihenfolge der Jahresplanung), unter `D` die Themen und die passenden Fertigkeiten (IDs aus `katalog/deutsch.json`, Voraussetzungen zuerst), unter `weitere` die übrigen Fächer. Schulfreie Tage aus dem Brief in `ziele.json` unter `feiertage` eintragen. Dann `node tools/pruefe_katalog.mjs` und `node --test tools/tests/schule.test.mjs`. Der Elternbereich zeigt den Brief unter «Überblick › In der Schule».

Vieles lässt sich direkt im Elternbereich einstellen: Buchstabenplan, Lernwörter der Woche, aktuelles Mathematik-Kapitel, Zahlenraum, Minuten, Lerntage, Verteilung, Stimme und Tempo, Töne, Sammelbild, Vorlesen, Begriffe der Lehrperson.

## 8. Für Entwicklung und Prüfung

Voraussetzung: Node.js 22.

```sh
node tools/baue.mjs                     # Inhaltsindex, Version und Offline-Liste erzeugen
node tools/server.mjs                   # lokal auf http://localhost:8765 (ohne Abgleich)
node tools/server.mjs --abgleich        # dasselbe mit /api/* (SQLite statt D1, Anmeldung als test@localhost)
node tools/pruefe_katalog.mjs --bilanz  # Katalog, Lehrmittel-Reihenfolge, Ziele, Parameter
node tools/pruefe_woerter.mjs --bilanz  # Wortlexikon und Buchstabenplan
node --test tools/tests/*.test.mjs      # Unit-Tests (Generatoren mit Nachprüfung auf zweitem Weg, Lernmodell, Plan, kurze Simulation, Nachspuren, Abgleich, Access)
node tools/teste_mathe.mjs [za me …]    # alle Mathe-Generatoren: je Stufe 200 Aufgaben in den Zahlenräumen 10, 20, 100
node tools/zeige_mathe.mjs re 3         # Beispielaufgaben lesbar ausgeben, zum Gegenlesen
node tools/teste_deutsch.mjs [hb bu …]  # alle Wortgeneratoren: je Stufe 200 Aufgaben, Standard- und kleine Buchstaben-Freigabe
node tools/pruefe_inhalte.mjs           # feste Deutsch-Inhalte (site/data/inhalte/deutsch/): Schema, «braucht», Bilder, Satzlänge
node tools/selbsttest_inhalte.mjs       # kommt jede feste Inhaltseinheit in einer Aufgabe vor?
node tools/zeige_deutsch.mjs le 3       # Deutsch-Beispielaufgaben lesbar ausgeben (--klein: kleine Freigabe)
node tools/sim/lauf.mjs [--md]          # drei simulierte Kinder bis Ende 1. Klasse mit echtem Plan und Ablauf (--profil mittel --bis 2026-12-18 --neu)
                                        #   --minuten 5  --takt (Buchstaben im Takt)  --lernwoerter  --laeufe 10 (Median über 10 Läufe)  --lauf 3
                                        #   SIM_SPUR=2026-11-18 node tools/sim/lauf.mjs …   (jede Aufgabe dieses Tages mit Zeit)
node tools/pruefe_paket.mjs paket.json  # ein Paket mit eigenen Inhalten so prüfen wie beim Import (INHALTE.md)
node tools/abgleich-browser.mjs         # Abgleich mit drei Geräten im Browser (startet selbst einen Server mit SQLite)
node tools/bot.mjs [--geraet iphone]    # ganze Lerntage im Kinderbereich und alle Seiten des Elternbereichs (--dunkel --bewegung --tage … --fotos ordner)
node tools/aufgaben-browser.mjs         # jede Stufe beider Fächer im Browser lösen (Server auf 8765 nötig, Playwright)
                                        #   --nur D-HB,M-RE  --geraet iphone  --dunkel  --fotos ordner  --laut
node tools/baue_schrift.mjs             # Nachspur-Vorlagen site/data/schrift/basisschrift.json erzeugen
node tools/icons.mjs                    # PNG-Symbole aus site/icons/icon.svg (Playwright nötig)
```

Lokal (nur auf `localhost`) lässt sich ein Datum vortäuschen: `http://localhost:8765/?heute=2026-12-01`.

**Prüfliste im echten Safari** (von Hand auf dem iPad, nach jeder grösseren Änderung; die automatischen Tests laufen ohne Stimme):

1. Startknopf antippen: Die Begrüssung mit dem Namen ist zu hören. Ohne Ton: Abschnitt 5, Prüfliste Sprachausgabe.
2. Einführung: Die Stimme erklärt Lautsprecher, Hilfe, Haken und Pfeil; die Zeigehand zeigt sie der Reihe nach.
3. Elternbereich › Einstellungen › Stimme: Probesatz, Hörtest mit «So», «fa», «La» und «mmm» verständlich.
4. Elternbereich › Aufgaben, je eine Stufe ausprobieren und hinhören: D-HB-01/1 (Reime, Bildnamen werden genannt), D-HB-02/1 (Silben einzeln), D-HB-03/1 (gedehnter Anlaut), D-BU-01/1 (Laut zum Buchstaben), D-WS-07/2 (Hörkarten: erstes Antippen spricht, zweites legt), D-HV-01/1 (Anweisung), M-RE-03/1 (Rechengeschichte), M-GR-04/1 (Uhr).
5. Nachspuren (D-BU-04/1, M-ME-04/1) mit dem Finger: grüner Startpunkt, Lob nach dem Spuren, nach drei Versuchen «Gut geübt».
6. Ein ganzer Lerntag im Kinderbereich: Ansage auf dem Weg, Buch und Würfel wählbar, Schlusskarte nennt das neue Teil im Sammelbild.
7. Lautsprecher-Knopf oben links wiederholt jeden Auftrag; der Hilfe-Knopf gibt einen Hinweis, ohne die Lösung zu verraten.
8. Offline: Flugmodus ein, Lernwelt über das Home-Bildschirm-Symbol öffnen, eine Aufgabe lösen.
9. Neue Version: Nach einem Push zeigt der Elternbereich «Eine neue Version ist bereit»; im Kinderbereich passiert nichts.
10. Geführter Zugriff (Abschnitt 5, Schritt 6) lässt sich starten und beenden.

In Chrome oder Firefox auf dem Computer gibt es je nach System keine deutsche Stimme; die App zeigt dann den Hinweis zur Stimme und läuft ohne Ton weiter.
