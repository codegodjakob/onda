# SYSTEM-11 · WCAG-2.1-AA-Prüfprotokoll

## Prüfstand

- App-Code: Commit `7c3890e936037a653272997fbc116829753a7773`
- Ausführung: 30. Juli 2026, Europe/Berlin
- Betriebssystem: macOS 15.6 (24G84)
- Chromium: 151.0.7922.34
- Firefox: 153.0
- WebKit: 26.5
- Playwright: 1.62.0
- axe-core / @axe-core/playwright: 4.12.1
- Ansichten: Bibliothek, Editor, Projektverständnis, Quellenbibliothek, Quellenreader, Sprachdossier, Schlussaudit

## Ergebnis

`SYSTEM-11` besteht für den lokal automatisierbaren Umfang. axe meldet in allen sieben Kernzuständen für `wcag2a`, `wcag2aa`, `wcag21a` und `wcag21aa` null Verstöße. Die browsergestützten manuellen Protokollschritte für Tastatur, Fokus, Escape-Rückgabe, 390-Pixel-Reflow, 200-Prozent-Skalierung, Zielgrößen und Fehlererholung bestehen in Chromium, Firefox und WebKit.

Das Ergebnis ist keine Behauptung über noch nicht durchgeführte Studien mit realen Screenreader-Nutzern. VoiceOver-, NVDA- und JAWS-Sitzungen mit externen Teilnehmenden bleiben eine spätere reale Nutzungsevaluation.

## Automatisierte WCAG-Prüfung

Ausgeführt mit:

```text
node test/d2-accessibility.test.mjs
```

| Zustand | WCAG-2.1-A/AA-Verstöße | Ergebnis |
|---|---:|---|
| Bibliothek | 0 | bestanden |
| Editor | 0 | bestanden |
| Projektverständnis | 0 | bestanden |
| Quellenbibliothek | 0 | bestanden |
| Quellenreader | 0 | bestanden |
| Sprachdossier | 0 | bestanden |
| Schlussaudit | 0 | bestanden |

Während der RED-GREEN-Schleife wurden ein fehlender zugänglicher Name des Texteditors und gemessene Kontrastunterschreitungen behoben. Die Schlussprüfung enthält keine deaktivierte axe-Regel und keine Ausnahme für einzelne Ziele.

## Browsergestützte manuelle Prüfschritte

Ausgeführt mit `app/test/etappe-d2-smoke.mjs` in allen drei Engines.

### Tastatur und Fokus

1. Schlussaudit ausschließlich mit `Strg/⌘-E` geöffnet.
2. Anfangsfokus liegt auf der benannten Schließen-Aktion.
3. `Tab` bewegt den Fokus innerhalb des modalen Dialogs weiter; der Fokus bleibt gefangen.
4. Der jeweils fokussierte Eintrag besitzt einen sichtbaren Fokusindikator.
5. `Escape` schließt den Dialog und stellt den Fokus auf `Projektverständnis` wieder her.
6. Die Risikobestätigung ist per Tastatur erreichbar. Vor ihrer Aktivierung ist `Trotz Risiko exportieren` deaktiviert, danach aktiviert.

Ergebnis: bestanden in Chromium, Firefox und WebKit.

### Reflow und Skalierung

1. Viewport `390 × 844` Pixel.
2. Alle Auditgruppen in einer Spalte; kein horizontaler Dokumentüberlauf.
3. Dialog bleibt vollständig innerhalb der sichtbaren Breite.
4. Sichtbare Buttons, Auswahlfelder, Checkbox-Zeilen, Zusammenfassungen und Dateiaktionen besitzen eine CSS-Zielhöhe von mindestens 44 Pixeln; die browserseitige Messung lag rundungsbedingt bei mindestens 43,999 Pixeln.
5. Zusätzlich wurde der Schlussaudit bei 200 Prozent Layoutskalierung in einem `1280 × 900`-Viewport geprüft; Dialog und Dokument erzeugten keinen horizontalen Überlauf.

Ergebnis: bestanden in Chromium, Firefox und WebKit.

### Fehler und Wiederherstellung

1. Ein Datenpaket mit unbekanntem Format eingelesen.
2. Die Oberfläche meldet `Datenpaket nicht übernommen`.
3. Der zuvor gespeicherte lokale Zustand bleibt bytegleich.
4. Löschen bleibt bis zu einer frisch erzeugten und validierten Gesamtsicherung gesperrt.
5. Nach Sicherung verlangt die Löschung einen zweiten Schritt und die Eingabe `LÖSCHEN`.
6. Nach endgültiger Löschung sind Projekte, Texte und API-Schlüssel entfernt; die App startet mit einem frischen lokalen Bestand.

Ergebnis: bestanden in Chromium, Firefox und WebKit.

## Ergänzende Nicht-Funktionsbelege

- Performanceprobe: 15 Stichproben, p95 Eingabe-bis-Frame `8,2 ms`, längste beobachtete Long Task `0 ms`.
- 390-Pixel-Reflow: kein horizontaler Überlauf.
- 200-Prozent-Skalierung: kein horizontaler Überlauf.
- Produktionsbuild: bestanden.
- Paketprüfung: null bekannte npm-Schwachstellen.

## Bewusst offene reale Studien

Diese Punkte sind nicht als bestanden markiert und verändern den automatisierten SYSTEM-11-Status nicht:

- moderierte Nutzung mit VoiceOver auf macOS und iOS;
- moderierte Nutzung mit NVDA oder JAWS unter Windows;
- Prüfung mit individuellen Vergrößerungs-, Kontrast- und Spracheingabe-Setups;
- Verständnis- und Effizienzstudien mit Menschen, die assistive Technologien im Alltag verwenden.
