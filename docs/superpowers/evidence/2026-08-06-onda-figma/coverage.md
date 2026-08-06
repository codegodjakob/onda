# Onda · Produktdesign — Evidence Ledger

## Datei

- Figma-URL: https://www.figma.com/design/cRhvRhJGzhDvwEqJYbSgVz
- Figma-Datei-Key: `cRhvRhJGzhDvwEqJYbSgVz`
- Figma-Plan: `Jakob Schlenker's team` (`team::1561356446701075381`)

## Erforderliche Figma-Seiten (39)

- [ ] 00 · Übersicht
- [ ] 01 · Foundations
- [ ] 02 · Komponenten
- [ ] 03 · Bibliothek
- [ ] 04 · Editor
- [ ] 05.01 · Rechtschreibung
- [ ] 05.02 · Grammatik
- [ ] 05.03 · Zeichensetzung
- [ ] 05.04 · Wortwahl
- [ ] 05.05 · Satzstil
- [ ] 05.06 · Absatzstil
- [ ] 05.07 · Straffen
- [ ] 05.08 · Wiederholung
- [ ] 05.09 · Ton & Register
- [ ] 05.10 · Stilmittel
- [ ] 05.11 · Anglizismus
- [ ] 05.12 · Terminologie
- [ ] 05.13 · Verschieben
- [ ] 05.14 · Übergang
- [ ] 05.15 · Gliederung
- [ ] 05.16 · Textfluss
- [ ] 05.17 · Roter Faden
- [ ] 05.18 · Überschrift
- [ ] 05.19 · Anmerkung
- [ ] 05.20 · Beleg fehlt
- [ ] 05.21 · Faktencheck
- [ ] 05.22 · Widerspruch
- [ ] 05.23 · Gegenargument fehlt
- [ ] 05.24 · Verständlichkeit
- [ ] 06.01 · Ausformulieren
- [ ] 06.02 · Gehört zusammen
- [ ] 06.03 · Nachfrage
- [ ] 06.04 · Reihenfolge
- [ ] 06.05 · Offener Faden
- [ ] 07 · Agent & Quellen
- [ ] 08 · Dialoge
- [ ] 09 · Menüs & Nebenansichten
- [ ] 10 · Responsive & Dark
- [ ] 11 · Prototyp

## Acceptance Criteria

- [ ] AC-1
- [ ] AC-2
- [ ] AC-3
- [ ] AC-4
- [ ] AC-5
- [ ] AC-6
- [ ] AC-7
- [ ] AC-8
- [ ] AC-9
- [ ] AC-10
- [ ] AC-11
- [ ] AC-12

## Abweichungen

Die verbundene Figma-Plugin-API weist `figma.saveVersionHistoryAsync` als unsupported zurück; Figma Autosave ist die einzige verfügbare Sicherung.

## Task 2 · Figma- und Design-System-Discovery (2026-08-06)

### Entscheidungen

- **Code Connect:** keine Zuordnung vorhanden. Prüfmethode: Dateinamen `*.figma.ts|tsx|js` in `app/` und `design-system/`; zusätzlich Inhaltssuche `FigmaConnect` ausschließlich in `*.swift` und `*.kt`. Beide Trefferlisten sind leer.
- **Bestehende Figma-Screens:** nicht anwendbar — neue leere Datei. Dies folgt aus dem von Task 1 übergebenen Ziel-Datei-Status; die versuchte read-only Plugin-Abfrage konnte wegen des unten dokumentierten Limits nicht als zweite Quelle dienen.
- **Font-Quellentscheidung:** Produktfont ist `ABC Diatype`; Quellen: `design-system/tokens/fonts.css:1-17`, `app/src/onda-tokens.css:2-6,37` und `design-system/tokens/typography.css:5`. Erwartete produktive Gewichte sind 100/300/400/500/700/800/900/950 samt Italics, die Figma-Verfügbarkeit bleibt unten blockiert.
- **componentDiscoveryDecision:** blockiert bis zur Library-Abfrage; keine Onda-Bibliothek oder Component-Keys werden ohne `get_libraries` behauptet. Nach Entsperrung: alle sichtbaren Bibliotheken und jede Organisation-Bibliothek mit „Onda“ erfassen; nur wenn keine existiert, `Lokale Onda-Komponenten aus produktivem Code erstellen` setzen.
- **saveVersionHistoryAsync:** nicht aufgerufen; laut Task 1 in der verbundenen Plugin-API unsupported. Figma Autosave bleibt die einzige verfügbare Sicherung.

### Figma-Prüfungen (read-only; externer Blocker)

- Datei: `cRhvRhJGzhDvwEqJYbSgVz` · https://www.figma.com/design/cRhvRhJGzhDvwEqJYbSgVz
- `use_figma` (Seiten-/Screen-/Instance-Discovery) am 2026-08-06 versucht, mit `skillNames: figma-use,figma-generate-design`; Ergebnis: `You've reached the Figma MCP tool call limit on the Starter plan` (`INVALID_ARGUMENT`). Keine Canvas-Mutation.
- `get_libraries` am 2026-08-06 versucht; gleiches Starter-Plan-Limit. Daher: keine bereits hinzugefügten Libraries, keine Onda-Organisation-Libraries und keine Remote-Variablen verifiziert; `search_design_system` wurde folgerichtig nicht aufgerufen.
- `figma.listAvailableFontsAsync()` konnte wegen desselben Limits nicht ausgeführt werden. Vor jeder Texterstellung muss die Verfügbarkeit von `ABC Diatype` exakt abgefragt und die zurückgegebenen `family/style`-Namen als `fontDecision` übernommen werden; bei `count: 0` ist die Fallback-Abweichung vor dem Erstellen von Text zu erfassen.

### Source- und Referenzinventar

- Views: `app/index.html:37` (`#home`), `app/index.html:69` (`#editorView`), `app/index.html:159` (`#agentWidget`), `app/index.html:160` (`#evidenceWindow`).
- Dialoginfrastruktur: `app/src/workspace.js:1138` (`openOndaDialog`). Sieben Gruppen: Memory `app/src/memory-ui.mjs:355-356`; Audit `app/src/audit-ui.mjs:142-143`; Argument `app/src/argument-ui.mjs:732-733`; Sprache `app/src/language-ui.mjs:807-808`; Quellen/Material `app/src/workspace.js:1202`; KI `app/src/workspace.js:1235`; Projektverständnis `app/src/workspace.js:1637`.
- Referenz-Screenshots (22): `annotation-lab-{light,dark}-{320,720,1024,1280}.png`; `onda-editor-{320,720,1024,1440}.png`; `onda-editor-dark-{320,1440}.png`; `onda-library-{320,1280}.png`; `onda-library-dark-{320,1280}.png`; `onda-overlay-{agent,argument,audit,ki}.png` unter `app/evals/results/screenshots/`.

### Selbstreview / Nachlauf

- Read-only-Figma-Vorgabe eingehalten; kein Figma-Knoten angelegt, geändert oder gelöscht.
- Keine Schlussfolgerung über Remote-Variablen aus lokalen Variablen gezogen.
- Beim Freischalten des Limits zuerst `use_figma` (leere Screens) und `get_libraries`, danach — nur mit sichtbarer Onda-Bibliothek — `search_design_system` für `button`, `input`, `dialog`, `annotation`, `navigation`, `aura`; anschließend die Font-Abfrage erneut ausführen.
