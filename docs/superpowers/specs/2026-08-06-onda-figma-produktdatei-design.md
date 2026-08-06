# Onda: vollständige Produktdatei in Figma

**Datum:** 6. August 2026

**Status:** vom Nutzer freigegeben

## Ziel

Für die produktive Onda-App entsteht eine neue, vollständige Figma-Design-Datei. Sie bildet nicht nur einzelne Vorzeigebilder ab, sondern die belegten Produktansichten, ihre funktional unterschiedlichen Zustände, die 29 Anmerkungsarten und die wesentlichen Arbeitsabläufe.

Die produktive App ist die Quelle der Wahrheit für Umfang, Inhalt und Verhalten. Der bereitgestellte Ordner `Onda Design System` liefert Marke, Typografie, Komponentenideen und Grundprinzipien. Wo das ältere Download-Paket vom aktuellen produktiven Stand abweicht, gilt die zuletzt bestätigte Richtung der App.

## Quellen und Priorität

1. Produktiver Code unter `app/`
2. Aktuelle produktive Screenshots unter `app/evals/results/screenshots/`
3. Bestätigte Spezifikation `2026-08-06-onda-editorial-minimal-design.md`
4. Onda Design System unter `design-system/` und im bereitgestellten Download-Ordner

Spezifikationen dürfen den Code nicht überstimmen, wenn die tatsächliche Oberfläche anders gebaut ist. Abweichungen werden in der Figma-Abdeckungsmatrix sichtbar notiert.

## Gewählte Dateistruktur

Die Datei wird nach Produktabläufen organisiert. Zustandsvarianten liegen innerhalb der zugehörigen Seite nebeneinander. Reine Datenvarianten ohne funktionalen oder visuellen Unterschied werden nicht dupliziert.

### Gemeinsame Produktseiten

1. `00 · Übersicht` — Inhaltsverzeichnis, Nutzerflüsse, Legende und Abdeckungsmatrix
2. `01 · Foundations` — neutrale Farben, Typografie, Abstände, Radien, Schatten, Icons, Light und Dark
3. `02 · Komponenten` — lokale Komponenten, Varianten und Zustände
4. `03 · Bibliothek` — Projekte, Dokumente, Papierkorb, Suche, Sortierung, Leer- und Fehlerzustände
5. `04 · Editor` — Text- und Notizmodus, Seitenleiste, Fokusmodus, eingeklappte Navigation und Speicherzustände
6. `07 · Agent & Quellen` — Gespräch, Agentenstatus, Entscheidungsverlauf, Fundstellen und Recherche
7. `08 · Dialoge` — alle produktiven Dialoge mit mehreren Zustandsversionen
8. `09 · Menüs & Nebenansichten` — Einstellungen, Link, Slash-Menü, Blockeinfügung, Quellenleser und Rechercheablauf
9. `10 · Responsive & Dark` — Referenzen für 1440, 1024, 720 und 320 Pixel sowie Dark Mode
10. `11 · Prototyp` — klickbare Hauptabläufe

### Eigene Seiten für Textanmerkungen

Jede produktive Textanmerkungsart erhält eine eigene Figma-Seite:

1. `05.01 · Rechtschreibung`
2. `05.02 · Grammatik`
3. `05.03 · Zeichensetzung`
4. `05.04 · Wortwahl`
5. `05.05 · Satzstil`
6. `05.06 · Absatzstil`
7. `05.07 · Straffen`
8. `05.08 · Wiederholung`
9. `05.09 · Ton & Register`
10. `05.10 · Stilmittel`
11. `05.11 · Anglizismus`
12. `05.12 · Terminologie`
13. `05.13 · Verschieben`
14. `05.14 · Übergang`
15. `05.15 · Gliederung`
16. `05.16 · Textfluss`
17. `05.17 · Roter Faden`
18. `05.18 · Überschrift`
19. `05.19 · Anmerkung`
20. `05.20 · Beleg fehlt`
21. `05.21 · Faktencheck`
22. `05.22 · Widerspruch`
23. `05.23 · Gegenargument fehlt`
24. `05.24 · Verständlichkeit`

### Eigene Seiten für Notizanmerkungen

Jede produktive Notizanmerkungsart erhält ebenfalls eine eigene Figma-Seite:

1. `06.01 · Ausformulieren`
2. `06.02 · Gehört zusammen`
3. `06.03 · Nachfrage`
4. `06.04 · Reihenfolge`
5. `06.05 · Offener Faden`

## Aufbau jeder Anmerkungsseite

Jede der 29 Anmerkungsseiten enthält die Zustände, die für die jeweilige Art tatsächlich existieren:

- Fundstelle im Text oder in Notizen
- aktive beziehungsweise geöffnete Detailansicht
- Annahme und sichtbares Ergebnis
- Verwerfen und die Folgewahl `Nur diesmal`, `Nicht mehr in diesem Text` oder `Nie vorschlagen`
- eigene Fassung, sofern für diese Art vorgesehen
- Rückgängig
- Fehler mit sichtbarer Wiederholungs- oder Rückkehrmöglichkeit
- Kleinbreitenreferenz
- monochrome Dark-Referenz, wenn der Zustand dadurch eine eigene visuelle Prüfung benötigt

Nicht jede Art unterstützt jede Aktion. Die Seite zeigt nur produktiv belegte Zustände und benennt nicht verfügbare Aktionen in einer kleinen Zustandsnotiz, statt sie als fiktive Oberfläche zu erfinden.

## Dialoge und Zustandsversionen

Die Dialogseite gruppiert die folgenden produktiven Dialoge in horizontalen Reihen. Jede Version ist als eigener, klar benannter Frame ausgeführt.

### Projektverständnis

- leerer beziehungsweise noch ungeklärter Stand
- ausgefüllter Stand
- geschützte Nutzerkorrektur
- aktive Rückfrage oder Interviewzustand
- ruhiger Offline- oder Wiederherstellungszustand, sofern innerhalb des Dialogs sichtbar

### Quellen im Projekt

- leere Bibliothek
- gefüllte Quellenliste
- Quellenimport
- Validierungsfehler beim Import
- Quellenleser mit verifiziertem Original
- nicht belastbare oder neu zu prüfende Quelle
- Recherche geplant
- Recherche läuft
- Recherche pausiert
- Recherche zur Prüfung bereit
- Recherche fehlgeschlagen

### KI-Anschluss

- Verbindung wird geprüft
- Schlüssel fehlt
- Schlüssel hinterlegt und Verbindung bereit
- Verbindungsfehler mit Wiederholung oder Einrichtung
- Monatsbudget normal
- Monatsbudget erreicht
- einzelner Lauf bewusst freigegeben

### Projektgedächtnis

- deaktiviert
- leer
- gefüllt
- Freigabe ausstehend
- Export
- Löschbestätigung
- Wiederaufbau
- Fehler mit Rückkehrmöglichkeit

### Argumentationsdossier

- noch nicht geprüft
- Prüfung läuft
- gefülltes Dossier
- Aussage einordnen
- veralteter Stand oder notwendige Neuprüfung
- Fehler mit Wiederholung

### Sprache und Wirkung

- Ausgangslage
- Sprachprofil
- ausgefüllte Analyse
- Wirkungsvergleich
- Korrektur beziehungsweise erneute Prüfung
- Fehler mit Wiederholung

### Schlussaudit und Export

- Export durch offene Hinweise blockiert
- wissenschaftliche Risiken bewusst angenommen
- Audit bereit
- Exportformat wählen
- Datenkontrolle
- Bestätigung der lokalen Datenlöschung

## Visuelle Richtung

Die Datei ist streng monochrom und deutlich kantiger als das bereitgestellte Download-Paket.

### Farbe

- ausschließlich Papierweiß, Weiß, Schwarz und neutrale Graustufen
- kein Sky-Blau, kein Rot und keine farbigen Statusflächen
- Auswahl, Status und Fokus werden durch Kontrast, Linie, Form, Symbol und Schriftgewicht vermittelt
- Fehler und destruktive Aktionen werden zusätzlich ausdrücklich beschriftet und erhalten ein eindeutiges Symbol
- Light und Dark verwenden dieselbe neutrale Rollenstruktur

### Typografie

- einzige Familie: ABC Diatype
- Größen: 12, 15, 21 und 40 Pixel
- Gewichte: 400, 500 und 700
- technische Zahlen verwenden Tabellenziffern
- pro Element höchstens zwei Größen und zwei neutrale Textwerte

Falls ABC Diatype in der verbundenen Figma-Umgebung nicht verfügbar ist, gilt dies als sichtbare Abweichung und nicht als stillschweigend akzeptierter Ersatz. Die Datei dokumentiert dann die konkrete Blockade und verwendet vorübergehend einen klar benannten System-Fallback.

### Form und Tiefe

| Rolle | Radius | Tiefe |
|---|---:|---|
| Grundfläche, Liste, Schreibfläche | 0 px | keine |
| Button, Feld, kompakte Fläche | 4 px | keine |
| größere statische Fläche | höchstens 6 px | keine |
| Dialog, Popover, schwebende Anmerkung | 8 px | zurückhaltender Schatten |
| echter Kreis | vollständig rund | nur bei funktionalem Bedarf |

Vollständig rund bleiben nur echte Kreise wie einzelne Icon-Aktionen, Avatar und Aura. Schatten erscheinen ausschließlich an schwebenden Ebenen. Die Aura wird monochrom und bleibt der KI-Präsenz vorbehalten.

## Komponentenmodell

Die Datei verwendet lokale Figma-Komponenten und Instanzen für alle wiederkehrenden Elemente:

- Bibliotheks- und Editor-Navigation
- Buttons und Icon-Aktionen
- Suche, Eingaben, Auswahlfelder und Composer
- Listenzeilen, Statuszeilen und leere Zustände
- Review-Leiste und Modusumschalter
- Fundstellenmarkierungen und die Darstellungsformen Korrektur, Rewrite, Einfügung, Zielplatz, Bereich, Quelle, Vergleich, Dialog und Titel
- Dialograhmen und Dialogaktionen
- Agentengespräch, Entscheidungsverlauf und Fundstellen
- Quellenimport, Quellenleser und Recherchelauf

Alle Produktframes und Komponenten verwenden Auto Layout. Wiederkehrende Oberflächen werden nicht als frei gezeichnete Kopien angelegt. Ebenen, Komponenten, Varianten und Frames erhalten fachliche deutsche Namen; technische Variantenwerte bleiben kurz und eindeutig.

## Größen und responsive Referenzen

- Desktop: 1440 × 1000 Pixel
- mittlere Breite: 1024 Pixel
- schmale Arbeitsansicht: 720 Pixel
- Kleinbreite: 320 Pixel

Die Breiten entsprechen den bestehenden visuellen Prüfungen. Jede Hauptansicht besitzt eine Desktopreferenz. `10 · Responsive & Dark` sammelt die repräsentativen Umbauten für die übrigen Breiten. Anmerkungsseiten zeigen zusätzlich ihre eigene Kleinbreitenreferenz, weil ihre Positionierung und Aktionsdichte artabhängig sind.

## Klickbare Abläufe

### Hauptablauf

Bibliothek → Projekt → Dokument → Anmerkung → Übernehmen → Rückgängig → Schlussaudit → Export

### Projektwissen

Projektverständnis → Projektgedächtnis, Argumentationsdossier oder Sprache und Wirkung → zurück zum Editor

### Quellen und Recherche

Quellen → Import → Recherche planen → Recherchelauf → Prüfung → Fundstelle übernehmen

### Agent und Beleg

Aura → Agentengespräch → Antwort → zugehörige Fundstelle

Fehler- und Grenzzustände führen sichtbar zu Einrichtung, Wiederholung, Korrektur oder Abbruch zurück. Ein Fehlerframe ist keine tote Endstation.

## Barrierefreiheit

- wichtige Trefferflächen mindestens 44 × 44 Pixel
- sichtbare Fokuszustände ohne Farbcodierung
- Information niemals nur durch Tonwert; Symbol, Text oder Form ergänzt die Bedeutung
- ausreichender Text- und Flächenkontrast in Light und Dark
- Dialoge zeigen eine nachvollziehbare Fokusreihenfolge und eine sichtbare Schließen-Aktion
- lange Inhalte bleiben scrollbar; Hauptaktion und Schließen-Aktion bleiben erreichbar
- 320 Pixel und 200 Prozent Zoom führen nicht zu unbeabsichtigtem horizontalem Scrollen

## Abnahmekriterien

### AC-1 — Vollständige Abdeckung

**Given** die Figma-Abdeckungsmatrix

**When** sie gegen produktiven Code, Dialog-IDs und den Anmerkungsvertrag geprüft wird

**Then** enthält sie alle belegten Produktansichten, 24 Textanmerkungsseiten, fünf Notizanmerkungsseiten und alle vereinbarten Dialogversionen ohne unmarkierte Lücke.

### AC-2 — Monochromes System

**Given** ein beliebiger Produktframe

**When** seine Füllungen, Linien, Effekte und gebundenen Variablen geprüft werden

**Then** verwendet er ausschließlich neutrale Grauwerte und vermittelt Bedeutung zusätzlich über Text, Symbol, Form oder Gewicht.

### AC-3 — Kantiges Formsystem

**Given** Grundflächen, Controls, statische Flächen und Overlays

**When** ihre Radien geprüft werden

**Then** verwenden sie ausschließlich 0, 4, höchstens 6 oder 8 Pixel entsprechend ihrer Rolle; nur echte Kreise sind vollständig rund.

### AC-4 — Komponenten und Auto Layout

**Given** ein wiederkehrendes Oberflächenelement

**When** seine Figma-Struktur geprüft wird

**Then** ist es eine benannte Komponenteninstanz mit Auto Layout und nicht eine frei gezeichnete Kopie.

### AC-5 — Anmerkungszustände

**Given** eine der 29 Anmerkungsseiten

**When** ihre produktiv verfügbaren Zustände geprüft werden

**Then** zeigt sie Fundstelle, aktive Ansicht, Entscheidung, Wiederherstellung und die für die Art relevanten Grenz- und Fehlerzustände.

### AC-6 — Dialogzustände

**Given** einer der sieben produktiven Dialogbereiche

**When** seine Frame-Reihe geprüft wird

**Then** sind Hauptpfad, relevante Leer-, Arbeits-, Fehler-, Bestätigungs- und Wiederherstellungszustände enthalten.

### AC-7 — Responsive Erreichbarkeit

**Given** eine Referenz bei 1440, 1024, 720 oder 320 Pixel Breite

**When** Inhalt und Hauptaktionen geprüft werden

**Then** sind sie erreichbar, ohne unbeabsichtigte Überlagerung, abgeschnittenen Text oder horizontales Scrollen.

### AC-8 — Monochromer Dark Mode

**Given** eine Dark-Referenz

**When** sie mit der zugehörigen Light-Referenz verglichen wird

**Then** behält sie Hierarchie, Ebenenlogik und Lesbarkeit ohne zusätzliche Farbe bei.

### AC-9 — Fehler und Wiederherstellung

**Given** ein belegter Fehler- oder Abbruchzustand

**When** der entsprechende Frame oder Prototypschritt geöffnet wird

**Then** ist die Ursache ruhig benannt und eine sichtbare nächste Handlung führt zu Wiederholung, Einrichtung, Korrektur oder sicherem Abbruch.

### AC-10 — Bedienbarkeit

**Given** Tastatur-, Touch- oder vergrößerte Bedienung

**When** Fokus, Klickflächen und Dialogreihenfolge geprüft werden

**Then** sind Fokuszustände sichtbar, wichtige Trefferflächen mindestens 44 × 44 Pixel groß und Hauptaktionen erreichbar.

### AC-11 — Klickbarer Hauptablauf

**Given** die Prototypseite

**When** der Hauptablauf bei der Bibliothek begonnen wird

**Then** lässt er sich ohne tote Zwischenstation über Editor, Anmerkung und Audit bis zum Export durchlaufen.

### AC-12 — Visuelle Qualität

**Given** eine Evaluationsrunde

**When** Vollständigkeit, Hierarchie, Konsistenz, Lesbarkeit und Zustandsklarheit bewertet werden

**Then** erreicht jede Dimension mindestens 4,5 von 5 oder die Datei wird gezielt nachgebessert.

## Evaluationsschleife und Nachweise

Die visuelle Datei wird höchstens dreimal iteriert. Jede Runde protokolliert die fünf Bewertungen aus AC-12, konkrete Fehler und ihre Korrektur. Die Schleife endet früher, wenn alle harten Tore bestehen und sich der Gesamtscore nicht mehr verbessert.

Harte Tore sind AC-1, AC-2, AC-3, AC-5, AC-6, AC-7, AC-9, AC-10 und AC-11.

Nachweise:

- Figma-Seitenliste und Abdeckungsmatrix
- Metadatenprüfung von Komponenten, Instanzen, Auto Layout und Variablen
- Screenshots jeder Produktseite und jeder Anmerkungsseite
- Detail-Screenshots langer Dialoge und Annotationen
- Fontprüfung gegen ABC Diatype
- Light-/Dark- und Kleinbreitenvergleich
- durchgeklickter Hauptprototyp
- Evaluationsprotokoll mit maximal drei Runden

## Nicht im Umfang

- keine Änderung an produktivem Code, Datenmodell oder Agentenlogik
- keine neuen Produktfunktionen oder fiktiven Zustände
- keine farbige Akzentpalette
- keine Veröffentlichung als fremde oder teamweite Figma-Bibliothek
- keine Änderung des bereitgestellten Design-System-Ordners
