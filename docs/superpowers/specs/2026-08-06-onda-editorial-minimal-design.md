# Onda: Editorial Minimal mit warmen Overlays

**Datum:** 6. August 2026

**Status:** visuelle Richtung von Jakob bestätigt

**Entscheidung:** Richtung A für die Arbeitsoberfläche; Form der Pop-ups und Overlays aus Richtung C

## Ziel

Onda soll wie ein präzises redaktionelles Werkzeug wirken: ruhig, textnah und hochwertig, aber nicht weichgezeichnet oder aus Karten zusammengesetzt. Der Text bleibt der visuelle Schwerpunkt. Navigation, Struktur und Werkzeuge ordnen sich ihm unter.

Echte schwebende Ebenen dürfen sich sichtbar vom Arbeitsraum lösen. Dialoge, Menüs, Popovers und Anmerkungskarten erhalten deshalb etwas mehr Rundung und eine zurückhaltende Tiefe. Diese Wärme ist eine funktionale Ebenenmarkierung, keine allgemeine Dekoration.

## Gestalterische Grundlage

### Domäne

- Manuskript und Satzspiegel
- Randnotiz und Korrekturzeichen
- Redaktionstisch und Materialablage
- Textfluss und Lesetempo
- Beleg, Entscheidung und Revision

### Farbwelt

- warmes Papierweiß für den Arbeitsgrund
- klares Weiß für die Schreibfläche
- Kohle und Graphit für Text und Hierarchie
- gedämpftes Sky-Blau für Auswahl, Fokus und KI-Präsenz
- zurückhaltendes Rot ausschließlich für Fehler und Löschen

### Onda-Signatur

Die unverwechselbare Signatur bleibt die **fundstellengenaue Anmerkung**: Eine Stelle im Text und ihre passende Nebenform sind räumlich und semantisch verbunden. Nicht jede Anmerkung wird zur gleichen Karte.

### Zu ersetzende Standards

1. **Pillen überall** werden durch kompakte Rechtecke mit kleinen Radien ersetzt. Pillen bleiben echten binären oder gruppierten Auswahlzuständen vorbehalten.
2. **Jeder Bereich als schwebende Karte** wird durch eine weitgehend flache Arbeitsfläche mit Abstand und feinen Trennungen ersetzt.
3. **Aura als Dekoration** entfällt. Die Aura erscheint nur, wenn KI-Präsenz oder laufende KI-Arbeit kommuniziert wird.

## Formensystem

| Rolle | Radius | Tiefe | Beispiele |
|---|---:|---|---|
| kleine strukturierende Fläche | 8 px | keine | Navigationseintrag, Zeile, Werkzeuggruppe |
| größere statische Fläche | 10 px | keine oder feine Kontur | Projektzeile, Verständnisblock, Seitenbereich |
| echtes Overlay | 16 px | weicher, kurzer Schatten | Dialog, Menü, Popover, schwebende Anmerkung |
| Pille | vollständig rund | keine | Text/Notizen-Umschalter, kompakter Status |
| Kreis | vollständig rund | nur bei Bedarf | reine Icon-Aktion, Aura |

Schatten sind keine allgemeine Flächendekoration. Sie werden nur dort eingesetzt, wo eine Ebene tatsächlich über einer anderen liegt. Statische Bereiche werden durch Weißraum, Hintergrundwechsel im niedrigen Kontrastbereich oder eine einzelne feine Linie gegliedert.

## Bibliothek und App-Rahmen

- Seitenleiste und Hauptbereich bilden einen zusammenhängenden Raum; die Trennung erfolgt über eine feine vertikale Linie.
- Der Hauptbereich verliert den Eindruck einer großen abgerundeten Karte.
- Aktive Navigation erhält eine kompakte, 8 px gerundete Fläche statt einer breiten Pille.
- Projekt- und Dokumentzeilen werden flacher, niedriger und mit 8–10 px Radius dargestellt.
- Die primäre Aktion „Neu“ bleibt klar erkennbar, wird aber zu einem kompakten Button mit 8 px Radius.
- Aura-Punkte erscheinen nur an Stellen mit realer KI-Bedeutung und nicht als symmetrische Zierde.

## Schreibansicht

- Der Textsatzspiegel führt die Hierarchie. Werkzeugleiste und Seitenleiste treten kontrastärmer auf.
- Die obere Anmerkungsleiste wird zu einer flachen, kompakten Werkzeuggruppe mit 8 px Radius.
- Projektverständnis, Strukturzeilen und Materialbereiche verwenden weniger separate Karten. Gruppierung entsteht primär durch Abschnittsabstände und Labels.
- Die Schreibfläche selbst bleibt ungerahmt oder erhält höchstens eine subtile Flächenkante; sie wirkt wie ein Blatt, nicht wie ein Dashboard-Widget.
- Klickflächen bleiben mindestens 44 × 44 CSS-Pixel groß, auch wenn ihre sichtbare Form kleiner und kantiger erscheint.

## Anmerkungen nach Anwendungsfall

- **Korrektur am Wort:** Markierung direkt im Text; das zugehörige Popover nutzt 16 px Radius und zeigt die minimale Alt/Neu-Differenz.
- **Umschreibung einer Passage:** Fundstelle im Text plus klar gegliederter Diff im Overlay; bisherige und neue Fassung bleiben sofort unterscheidbar.
- **Einfügung:** schmale Einfügemarke an der exakten Stelle; Inhalt im 16-px-Popover.
- **Zielplatz oder freies Feld:** gestrichelte oder fein konturierte Zielregion ohne große Vollflächenkarte.
- **Bereichshinweis:** schmale seitliche Regel entlang des betroffenen Abschnitts; Erläuterung erst bei Fokus oder Öffnung.
- **Quelle oder Sammlung:** Randkarte, weil der Inhalt nicht sinnvoll in einer einzelnen Textmarkierung aufgeht.
- **Meinung oder Gespräch:** Dialogblase im Gesprächskontext, nicht als Korrekturkarte am Text.

Alle Formen verwenden dieselbe Typografie und dieselbe ruhige Aktionshierarchie. Die Art der Anmerkung wird durch Verankerung, Aufbau und Wortwahl unterschieden, nicht durch bunte Statusfarben.

## Overlays und Pop-ups

Dieser Bereich übernimmt bewusst die wärmere Form von Richtung C:

- 16 px Radius für Dialoge, Menüs, Popovers, schwebende Anmerkungen und größere Composer
- zurückhaltender Schatten mit kurzer Ausdehnung; kein Glow außer bei aktiver KI-Präsenz
- Hintergrund klar vom Untergrund abgesetzt, aber ohne harte schwarze Kontur
- Innenabstände großzügig genug für Lesbarkeit, jedoch kompakter als die bisherigen 24-px-Flächen
- Fokus, Escape-Rückkehr, Fokusfalle und Tastaturreihenfolge bleiben unverändert funktionsfähig

## Zustände und Anpassungen

- **Dunkelmodus:** gleiche Ebenenlogik; höhere Ebenen werden nur leicht heller, nicht durch stärkere Schatten oder bunte Flächen markiert.
- **Kleine Breiten:** Radien bleiben konstant. Seitenleiste und Overlays passen ihre Position und Breite an, ohne horizontales Scrollen.
- **200 % Zoom:** Inhalt bleibt vollständig erreichbar; Overlays dürfen nicht außerhalb des sichtbaren Bereichs enden.
- **Reduzierte Bewegung:** bestehende Bewegungsreduktion bleibt erhalten; keine neue Animation ist für das Verständnis erforderlich.
- **Fehlender API-Schlüssel:** Oberfläche bleibt vollständig nutzbar. KI-Aktionen zeigen den ruhigen Einrichtungszustand, ohne Layoutsprung oder Schlüsselbunddialog.

## Nicht im Umfang

- keine Änderung an Dokumentdaten, Agentenlogik oder Persistenz
- keine neue Navigation oder Funktion
- keine zusätzlichen Farben, Schriftgrößen oder Schriftfamilien
- keine Änderung des heruntergeladenen Referenzpakets; die bestätigte neue Richtung wird in der produktiven App und ihren verbindlichen Tests kodiert

## Akzeptanzkriterien

### Hauptpfad

**AC-1 – Flache Bibliothek**

Gegeben ist die Projektbibliothek bei einer Breite von mindestens 1024 px, wenn sie geöffnet wird, dann besitzen statische Flächen höchstens 10 px Radius, der Hauptbereich wirkt nicht wie eine schwebende Großkarte und Schatten erscheinen nur an echten Overlays.

**AC-2 – Editoriale Schreibansicht**

Gegeben ist ein geöffnetes Dokument, wenn keine Nebenfläche aktiv ist, dann bleibt der Text der stärkste visuelle Einstiegspunkt und Seitenleiste sowie Werkzeugleiste sind durch Abstand oder feine Linien statt durch große Rundkarten gegliedert.

**AC-3 – Warme Overlays**

Gegeben ist ein Dialog, Menü, Popover oder eine schwebende Anmerkung, wenn es geöffnet wird, dann besitzt es 16 px Radius, eine zurückhaltende Tiefenwirkung und hebt sich eindeutig von der flachen Grundfläche ab.

**AC-4 – Fallgerechte Anmerkungen**

Gegeben sind die Anmerkungsarten Korrektur, Umschreibung, Einfügung, Zielplatz, Bereich, Quelle und Gespräch, wenn ihre Referenzzustände dargestellt werden, dann ist jede Art anhand ihrer Verankerung und ihres Aufbaus unterscheidbar, ohne zusätzliche Statusfarbpalette.

### Grenz- und Fehlerfälle

**AC-5 – Fehlender Schlüssel**

Gegeben ist kein API-Schlüssel im Schlüsselbund, wenn die App und ein Dokument geöffnet werden, dann bleibt das Layout stabil und die KI-Einrichtung erscheint nur nach einer bewussten KI-Aktion.

**AC-6 – Kleine Breite und Zoom**

Gegeben sind 320 px Breite oder 200 % Zoom, wenn Bibliothek, Editor und ein Overlay verwendet werden, dann entsteht kein horizontales Scrollen und alle primären Aktionen bleiben erreichbar.

**AC-7 – Lange Inhalte im Overlay**

Gegeben ist eine lange Begründung oder Diff-Fassung, wenn das Overlay nicht vollständig in den verfügbaren Raum passt, dann scrollt oder repositioniert es sich innerhalb des Fensters und verdeckt weder seine Schließen- noch seine Hauptaktion dauerhaft.

### Nichtfunktionale Kriterien

**AC-8 – Tastatur und Fokus**

Gegeben ist reine Tastaturbedienung, wenn durch Grundfläche und Overlays navigiert wird, dann ist der Fokus sichtbar, bleibt in modalen Dialogen gefangen und kehrt nach Escape zum Auslöser zurück.

**AC-9 – Designsystem-Vertrag**

Gegeben ist der Produktionsbuild, wenn seine Designvertrags-Tests laufen, dann stimmen Radiusrollen, Schatteneinsatz und zulässige Pillenverwendung mit der Tabelle dieser Spezifikation überein.

**AC-10 – Native Auslieferung**

Gegeben ist ein sauber gebautes `Onda.app`-Bundle, wenn es nativ gestartet wird, dann sind alle Stylesheets enthalten, Bibliothek und Editor erscheinen gestaltet und die sichtbare Bundle-Version entspricht dem Commit.

## Evaluationsschleife

Die Umsetzung wird höchstens dreimal visuell iteriert. Jede Runde bewertet auf einer Skala von 1 bis 5:

1. redaktionelle Klarheit
2. visuelle Ruhe
3. Ebenenlogik Grundfläche/Overlay
4. fallgerechte Anmerkungen
5. Konsistenz in Bibliothek, Editor, Dunkelmodus und kleinen Breiten

Zielwert ist mindestens **4,5/5 je Dimension**. Harte Tore sind AC-4, AC-5, AC-6, AC-8, AC-9 und AC-10. Die Schleife endet früher, wenn alle Tore bestehen und sich der Gesamtscore in einer weiteren Runde nicht verbessert.

## Nachweise

- Designvertrags- und Unit-Tests
- bestehende Browser-Smokes und WCAG-Prüfung
- Screenshots der Bibliothek und Schreibansicht bei Desktop- und Kleinbreite, jeweils hell und dunkel
- Referenzzustände aller Anmerkungsarten im Annotation Lab
- nativer Build, Selbsttest, Signaturprüfung und Sichtprüfung des gestarteten `Onda.app`
