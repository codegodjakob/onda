# Onda in `Claude Code` — Evidence Ledger

## Verbindlicher Nutzer-Override (2026-08-06)

- Zieldatei: bestehende Figma-Datei `Claude Code`
- Zielseite: ausschließlich die bestehende `Page 1`
- Neue Figma-Seiten: nicht zulässig
- Bestandsschutz: alle vor dem Onda-Lauf vorhandenen Nodes bleiben in Name, Typ, Parent, Position und Größe unverändert
- Platzierung: Onda in einem nachweislich freien Canvas-Bereich mit mindestens 2.000 px Abstand auf der gewählten Platzierungsachse
- Organisation: jede Hauptansicht und jede der 29 Anmerkungsarten als eindeutig benannte top-level `SECTION`; technisch notwendiger Fallback ist ein gleichnamiger top-level Wrapper-Frame
- Darstellung: monochrom; Radien 0/4/6/8; 999 beziehungsweise volle Rundung nur für echte Kreise
- Dialoge: mehrere Zustandsversionen je produktivem Dialogbereich bleiben verpflichtend

## Superseded Artifact

Die frühere Anforderung einer neuen Datei mit 39 Figma-Seiten ist **superseded** und darf nicht weiter umgesetzt werden. Der damalige, nun verworfene Zielartefakt war:

- Datei: `Onda · Produktdesign`
- URL: https://www.figma.com/design/cRhvRhJGzhDvwEqJYbSgVz
- Datei-Key: `cRhvRhJGzhDvwEqJYbSgVz`
- Plan: `Jakob Schlenker's team` (`team::1561356446701075381`)

An diesem verworfenen Artefakt werden keine weiteren Mutationen vorgenommen.

## Zielnachweis vor Mutation

- [ ] Aktiver Dateiname ist exakt `Claude Code`.
- [ ] Ausgewählte Seite ist exakt `Page 1`.
- [ ] Seiteninventar vor Mutation erfasst.
- [ ] Top-level Snapshot vor Mutation erfasst: `id`, `name`, `type`, `parentId`, `x`, `y`, `width`, `height`.
- [ ] Vereinte Bestandsgrenzen berechnet.
- [ ] Freier Onda-Ursprung mit mindestens 2.000 px Abstand dokumentiert.
- Figma-Datei-Key/URL: noch zu erfassen
- Bestands-Snapshot: noch zu erfassen
- Platzierungsursprung: noch zu erfassen

## Erforderliche Sections auf `Page 1`

### Gemeinsame Produktbereiche (10)

- [ ] Onda / 00 · Übersicht
- [ ] Onda / 01 · Foundations
- [ ] Onda / 02 · Komponenten
- [ ] Onda / 03 · Bibliothek
- [ ] Onda / 04 · Editor
- [ ] Onda / 07 · Agent & Quellen
- [ ] Onda / 08 · Dialoge
- [ ] Onda / 09 · Menüs & Nebenansichten
- [ ] Onda / 10 · Responsive & Dark
- [ ] Onda / 11 · Prototyp

### Textanmerkungen (24)

- [ ] Onda / 05.01 · Rechtschreibung
- [ ] Onda / 05.02 · Grammatik
- [ ] Onda / 05.03 · Zeichensetzung
- [ ] Onda / 05.04 · Wortwahl
- [ ] Onda / 05.05 · Satzstil
- [ ] Onda / 05.06 · Absatzstil
- [ ] Onda / 05.07 · Straffen
- [ ] Onda / 05.08 · Wiederholung
- [ ] Onda / 05.09 · Ton & Register
- [ ] Onda / 05.10 · Stilmittel
- [ ] Onda / 05.11 · Anglizismus
- [ ] Onda / 05.12 · Terminologie
- [ ] Onda / 05.13 · Verschieben
- [ ] Onda / 05.14 · Übergang
- [ ] Onda / 05.15 · Gliederung
- [ ] Onda / 05.16 · Textfluss
- [ ] Onda / 05.17 · Roter Faden
- [ ] Onda / 05.18 · Überschrift
- [ ] Onda / 05.19 · Anmerkung
- [ ] Onda / 05.20 · Beleg fehlt
- [ ] Onda / 05.21 · Faktencheck
- [ ] Onda / 05.22 · Widerspruch
- [ ] Onda / 05.23 · Gegenargument fehlt
- [ ] Onda / 05.24 · Verständlichkeit

### Notizanmerkungen (5)

- [ ] Onda / 06.01 · Ausformulieren
- [ ] Onda / 06.02 · Gehört zusammen
- [ ] Onda / 06.03 · Nachfrage
- [ ] Onda / 06.04 · Reihenfolge
- [ ] Onda / 06.05 · Offener Faden

## Dialogabdeckung

- [ ] Projektverständnis — leer, gefüllt, geschützte Korrektur, Interview, Wiederherstellung
- [ ] Quellen im Projekt — leer, Liste, Import, Validierungsfehler, verifiziert, neu zu prüfen, Recherche geplant/läuft/pausiert/prüfbereit/fehlgeschlagen
- [ ] KI-Anschluss — Prüfung, Schlüssel fehlt, bereit, Verbindungsfehler, Budget normal/erreicht, Einzellauf freigegeben
- [ ] Projektgedächtnis — deaktiviert, leer, gefüllt, Freigabe, Export, Löschen, Wiederaufbau, Fehler
- [ ] Argumentationsdossier — ungeprüft, läuft, Dossier, Einordnung, veraltet, Fehler
- [ ] Sprache und Wirkung — Ausgangslage, Profil, Analyse, Vergleich, Korrektur, Fehler
- [ ] Schlussaudit und Export — blockiert, Risiken angenommen, bereit, Format, Datenkontrolle, lokale Löschung

## Acceptance Criteria

- [ ] **AC-1 · One-page target:** `Claude Code` bleibt die Datei; alle Onda-Inhalte liegen auf `Page 1`; keine Onda-Seite wird zusätzlich angelegt.
- [ ] **AC-2 · Bestandsschutz:** Jeder vorherige top-level Node stimmt im Vorher-/Nachher-Snapshot in ID, Name, Typ, Parent, Position und Größe überein.
- [ ] **AC-3 · Freie Platzierung:** Onda überschneidet keinen Bestands-Node und hält mindestens 2.000 px Abstand auf der gewählten Platzierungsachse.
- [ ] **AC-4 · Vollständigkeit:** zehn gemeinsame Sections, 24 Text- und fünf Notizanmerkungs-Sections sowie sieben vollständige Dialogreihen sind exakt einmal vorhanden.
- [ ] **AC-5 · Monochrom:** keine sichtbare Vollfarbe weicht innerhalb Toleranz von gleichen RGB-Kanälen ab; Status bleibt zusätzlich textlich, symbolisch oder formal verständlich.
- [ ] **AC-6 · Radien:** nicht-kreisförmige Nodes verwenden nur 0, 4, 6 oder 8 px; 999/vollrund kommt nur an geometrisch echten Kreisen vor.
- [ ] **AC-7 · Komponenten/Layout:** wiederkehrende Elemente sind Instanzen, verwandte Container nutzen Auto Layout, statische Flächen haben keinen Schatten.
- [ ] **AC-8 · Anmerkungszustände:** jede der 29 Sections zeigt ihre produktiven Haupt-, Entscheidungs-, Wiederherstellungs-, Fehler-, Kleinbreiten- und repräsentativen Dark-Zustände.
- [ ] **AC-9 · Dialogversionen:** alle sieben Dialogbereiche enthalten die vereinbarten Leer-, Arbeits-, Fehler-, Bestätigungs- und Wiederherstellungsvarianten.
- [ ] **AC-10 · Responsive/Dark:** 1440/1024/720/320 bleiben ohne unbeabsichtigten Überlauf bedienbar; Dark bleibt monochrom und lesbar.
- [ ] **AC-11 · Bedienung/Prototyp:** Haupt- und Support-Flows besitzen keine tote Zwischenstation; wichtige Ziele sind mindestens 44 × 44 px und Fokus-/Recovery-Aktionen sichtbar.
- [ ] **AC-12 · Qualität:** Vollständigkeit, Hierarchie, Konsistenz, Lesbarkeit und Zustandsklarheit erreichen jeweils mindestens 4,5/5 in höchstens drei Iterationen.

## Discovery-Nachweise

### Entscheidungen

- **Code Connect:** keine Zuordnung vorhanden. Dateinamen- und Inhaltssuche in `app/` und `design-system/` ergab keine Onda-Zuordnung.
- **Font-Ziel:** `ABC Diatype`; Quellen: `design-system/tokens/fonts.css:1-17`, `app/src/onda-tokens.css:2-6,37` und `design-system/tokens/typography.css:5`. Die konkrete Figma-Verfügbarkeit muss vor Texterstellung geprüft werden; ein Fallback wird explizit benannt.
- **Komponentenentscheidung:** Lokale Onda-Komponenten in der bestehenden Datei erstellen, sofern keine erreichbare Onda-Library verifiziert wird.
- **Versionierung:** `figma.saveVersionHistoryAsync` war über die verbundene Plugin-API unsupported; Figma Autosave ist derzeit die verfügbare Sicherung.

### Externer Figma-MCP-Blocker

- `use_figma` und `get_libraries` meldeten am 2026-08-06 das Starter-Plan-Limit `You've reached the Figma MCP tool call limit on the Starter plan` (`INVALID_ARGUMENT`).
- Dadurch wurden noch keine Canvas-Nodes im neuen Ziel `Claude Code` mutiert und keine Libraries oder Fonts per MCP verifiziert.
- Ein lokal erstellter Generator darf erst nach Codeprüfung und der erforderlichen Nutzerbestätigung in Figma importiert und ausgeführt werden.

### Source- und Referenzinventar

- Views: `app/index.html:37` (`#home`), `app/index.html:69` (`#editorView`), `app/index.html:159` (`#agentWidget`), `app/index.html:160` (`#evidenceWindow`).
- Dialoginfrastruktur: `app/src/workspace.js:1138` (`openOndaDialog`). Sieben Gruppen: Memory `app/src/memory-ui.mjs:355-356`; Audit `app/src/audit-ui.mjs:142-143`; Argument `app/src/argument-ui.mjs:732-733`; Sprache `app/src/language-ui.mjs:807-808`; Quellen/Material `app/src/workspace.js:1202`; KI `app/src/workspace.js:1235`; Projektverständnis `app/src/workspace.js:1637`.
- Referenz-Screenshots (22): `annotation-lab-{light,dark}-{320,720,1024,1280}.png`; `onda-editor-{320,720,1024,1440}.png`; `onda-editor-dark-{320,1440}.png`; `onda-library-{320,1280}.png`; `onda-library-dark-{320,1280}.png`; `onda-overlay-{agent,argument,audit,ki}.png` unter `app/evals/results/screenshots/`.

## Verifikation und Abweichungen

- Struktureller Prüfbericht: noch ausstehend
- Vorher-/Nachher-Bestandsdiff: noch ausstehend
- Bounds-/Overlap-Prüfung: noch ausstehend
- Visuelle Evaluation: noch ausstehend
- Bekannte Abweichungen: Figma-MCP-Limit; Font- und Library-Verfügbarkeit noch nicht verifiziert
