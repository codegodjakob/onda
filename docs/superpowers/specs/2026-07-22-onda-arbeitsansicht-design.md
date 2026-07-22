# Onda — Umsetzung der Arbeitsansicht (AppShell)

> **Status:** Mit dem Nutzer am 22. Juli 2026 erarbeitet und für die Umsetzung freigegeben.
> **Baut auf:** `2026-07-19-v2-arbeitsoberflaeche-design.md` (Interaktionsdesign) und `2026-07-19-agentisches-schreibsystem-v2.md` (Produktlogik).
> **Quelle des Aussehens:** Claude-Design-Projekt „Onda Design System Überarbeitung", Datei `AppShell.dc.html`, Design-System „Onda" (`_ds/onda-design-system-…`).
> **Zweck:** Die bestehende, funktionierende V2-Arbeitsansicht vollständig auf die Onda-Designsprache bringen — ohne die arbeitende Mechanik neu zu erfinden.

Bei Widersprüchen zur sichtbaren Oberfläche hat dieses Dokument Vorrang vor den älteren Spezifikationen. Produktlogik, Findings-Modell, Persistenz und Integritätsregeln bleiben unverändert.

---

## 1. Ziel und Umfang

Die V2-Arbeitsansicht besitzt bereits die richtige **Interaktionsarchitektur** (Strukturablage, lokale Hinweise, schwebendes Agenten-Widget, Belegfenster, Persistenz). Was fehlt, ist die **fertige visuelle Sprache** und eine **konsolidierte Rahmenstruktur**. Onda liefert beides.

**In diesem Abschnitt (freigegeben):**

- Vollständige Transformation der **Schreibansicht** (`#editorView`) auf Onda: neue Rahmenstruktur (persistente, einklappbare Seitenleiste links), Aura-Orb statt `◌`, Randhinweise als Gutter-Karten, Agenten- und Belegpanel im Onda-Stil, Licht/Dunkel plus Akzentvarianten.
- Die **Onda-Tokens** (Farbe, Typografie, Abstand, Radius, Elevation, Motion, Fonts) werden zur einzigen Quelle der visuellen Wahrheit.
- **Projektverständnis** bekommt erstmals eine sichtbare Ansicht (Seitenleisten-Karte + Modal).

**Bewusst außerhalb dieses Abschnitts:**

- Die **Bibliothek/Startseite** (`#home`) wird nicht umgebaut. Sie erbt nur die neuen Onda-Tokens (Farben, Fonts, Dunkelmodus); Layout und Karten bleiben vorerst. Eine eigene Onda-Bibliothek ist ein späterer Abschnitt.
- Keine neue Produktlogik, keine echte Webrecherche, kein Multi-Agent, kein Export-Ausbau. Beispieldaten („Stadtklima/Baum als Infrastruktur") bleiben Seed; die **Interaktionen funktionieren echt**.
- Toter V1-Code (`panels.js`, `structure.js`) wird nicht angefasst und nicht wiederbelebt.

## 2. Getroffene Entscheidungen

| Frage | Entscheidung |
|---|---|
| Wie treu zur AppShell? | **Vollständige Transformation** der Schreibansicht. |
| Breite | **Nur Schreibansicht** jetzt; Bibliothek erbt nur Tokens. |
| Bauweise | **Ansatz A — Neu einkleiden + Rahmen neu bauen.** Arbeitende Logik bleibt; Aura-Orb und wenige wiederkehrende Bausteine (Button, IconButton, Badge) werden als kleine wiederverwendbare Teile gebaut. |
| Fließtext-Schrift | **Hanken Grotesk (Sans)**, 16,5px — treu zur AppShell; ersetzt die bisherige Literata-Serife im Dokument. |
| Font-Quelle | **Lokal einbetten** (freie OFL-Fonts als woff2 in `app/fonts/`), kein CDN. Offline-fest. |
| Seitenleiste | **Standardmäßig offen, einklappbar** (Chevron am Wortzeichen), Zustand bleibt über Reload erhalten. Eingeklappt: Editor volle Breite, kleiner Menü-/Onda-Knopf oben links zum Wiederöffnen. |

## 3. Onda-Fundament (Tokens & Schrift)

Onda bringt sieben Token-Dateien mit. Sie werden als CSS in die App übernommen und zur Basis aller Stile:

- `colors.css` — warme Papier→Tinte-Neutralen, ein Akzent (**Sky** `#79b4dc`) mit Varianten `sage · blue · clay · lavender · sand`; alle über **Aliase** (`--text-*`, `--bg-*`, `--border-*`, `--accent*`), die bei `[data-theme="dark"]` umschlagen. Signatur-Verlauf `--gradient-aura` (folgt der Akzentvariante), `--shadow-glow`.
- `typography.css` — `--font-sans: "Hanken Grotesk"`, `--font-mono: "JetBrains Mono"`, Größenskala, Leading, Gewichte, Tracking, semantische Kürzel (`--type-body`, `--type-label`, …).
- `spacing.css` — 4px-Raster; `--sidebar-width: 264px`, `--topbar-height: 56px`, `--container-reading: 680px`.
- `radius.css` — Controls 6px, Karten 8px, Overlays 10px, weiche Panels 18px, Pill für Such-/Composer-Leisten.
- `elevation.css` — weiche, warm getönte Schatten; `--shadow-focus`, `--shadow-glow`.
- `motion.css` — `--ease-out` (Expo-Settle, Standard), `--ease-standard` (Ortswechsel), `--ease-spring` (nur Aura); `--dur-fast 120ms … --dur-slow 360ms`; `prefers-reduced-motion` reduziert Dauern auf ~1ms.
- `fonts.css` — **wird ersetzt**: statt Google-CDN werden lokale `@font-face`-Regeln für Hanken Grotesk (400–800) und JetBrains Mono (400/500) auf `app/fonts/*.woff2` gesetzt.

**Ablösung der Alt-Tokens (geringste Reibung).** Heute stylen zwei getrennte Token-Ebenen:
- global `:root` (`style.css:12-38`, dunkel `51-69`) — für Bibliothek und geteilte Chrome.
- gescoped `--v2-*` auf `#editorView` (`style.css:1207-1238`) — für die ganze Arbeitsansicht.

Vorgehen: Die Onda-Aliase werden global definiert (Onda `colors.css` liefert `--accent` = Sky). Die bestehenden Namen werden **als Aliase auf Onda umgehängt** (z. B. `--v2-canvas: var(--bg-app)`, `--v2-surface: var(--bg-surface)`, `--v2-text: var(--text-primary)`, `--v2-line: var(--border-default)`; das alte `--accentbg → var(--accent-tint)`, `--ok → var(--success)`, `--warn → var(--warning)`; das alte globale `--accent` (`#3a6ea5`) wird durch Ondas Sky-`--accent` ersetzt). Der V2-Ebene fehlt bisher ein eigener Akzent — er wird ergänzt. So erben bestehende Regeln sofort das neue Aussehen; nur Komponenten mit **struktureller** Änderung (Seitenleiste, Hinweis-Karten, Agentenpanel, Belegpanel, Composer, Badges, Aura) werden gezielt neu gestylt. Danach werden die Alt-Tokennamen dort, wo sinnvoll, schrittweise durch Onda-Namen ersetzt — ohne Big-Bang.

**Fonts konkret.** Neue lokale `@font-face` in `style.css` (ersetzt die Diatype/Literata-Deklaration `style.css:3-10` nicht komplett — Diatype/Literata dürfen für die noch nicht umgebaute Bibliothek bleiben, bis diese migriert ist). Fließtext im Dokument (`#page`, `#editor .ProseMirror`) nutzt `--font-sans` in 16,5px/1,7. `applySettings()` (`ui.js:145-164`) darf `--doc-font`/`--doc-size` nicht länger auf Literata/18px überschreiben — der Laufzeit-Override wird entfernt bzw. auf Onda gestellt.

## 4. Rahmenstruktur (Shell)

Ziel-Layout (aus `AppShell.dc.html`): `display:flex` über die volle Höhe — **Seitenleiste 264px** (`flex:none`, `margin-left` steuert Einklappen) + **Editorspalte** (`flex:1`).

### 4.1 Seitenleiste (persistent, einklappbar)

Von oben nach unten:

1. **Wortmarke** — kleine Aura-Marke + „Onda" (Hanken Semibold, `--tracking-tight`). Daneben der **Einklapp-Chevron**.
2. **Zurück-Zeile** — „‹ [Projektname]" führt zur Bibliothek. Ersetzt den bisherigen Header-Zurück-Knopf (`onBack` `workspace.js:1861-1865`).
3. **Projektverständnis** — Eyebrow-Label „PROJEKTVERSTÄNDNIS" + Karte mit Projekttitel/Kernaussage. Klick öffnet ein **Modal** (siehe 6.1). Datenquelle: `ensureProjectUnderstanding` (`reasoning-model.mjs`), Seed `buildExampleUnderstanding` (`example.js:8-18`).
4. **Struktur** — Eyebrow „STRUKTUR" + Liste der Bausteine, **permanent hier** statt in der alten Slide-in-Ablage. Eine Karte je Baustein (Rolle-Label + echter Ausschnitt), kleiner Farbpunkt bei offenem Hinweis (Akzent = Stil/Übergang, Amber = Beleg). Klick → `focusBlock` (`workspace.js:289-304`). Speist sich aus `getEditorBlocks` (`block-identity.js:83-99`). Die bisherige Strukturablage (`renderStructureShelf`/`rebuildStructureShelf` `workspace.js:437-480`, CSS `1339-1446`) und ihr Grid-Spalten-Mechanismus (`#workspaceBody` `style.css:1313-1337`) entfallen; ihr Inhalt zieht in diesen Abschnitt.
5. **Material** — „Quellen im Projekt · N", öffnet das Belegpanel im Projektkontext.
6. **Fußzeile** — Avatar + Name + **schneller Licht/Dunkel-Umschalter** und **Akzent-Auswahl** (schreibt `data-theme`/`data-accent` auf das Wurzelelement, persistiert über `state.settings`, `applySettings` `ui.js:145-164`).

**Einklappen.** Chevron toggelt eine Klasse (z. B. `is-sidebar-collapsed`) auf `#editorView`; Seitenleiste fährt via `margin-left: -264px` (Onda `--ease-standard`, 240–360ms) aus dem Bild, Editor bekommt volle Breite. Eingeklappt erscheint oben links ein kleiner Onda-/Menü-Knopf zum Wiederöffnen; Tastenkürzel ergänzt. Zustand in `state.settings` (oder Workspace-State) gespeichert.

### 4.2 Editorspalte

- **Slim-Header (52px)**, weitgehend leer; oben rechts der **Aura-Orb** (46px) als Agenten-Umschalter. Ersetzt `#agentPresence`/`◌` (`index.html:37`). Kleiner Punkt bei ungesehener Agenten-Initiative (`initiativeUnseen`).
- **Lesespalte** zentriert `max-width:680px`, Titel als große Überschrift (H1, `--fw-semibold`, `--tracking-tight`), darunter die Bausteine. `padding-right` der Spalte wächst, wenn Agentenpanel oder eine Gutter-Karte offen ist (heute `.is-agent-open` `style.css:2257-2262`), damit nichts überlappt.
- Der Header-**Pfad-Knopf** (`#workspacePath`, `onPath` `workspace.js:1866-1868`) entfällt — Navigation liegt jetzt in der Seitenleiste.

### 4.3 Responsiv

Unter der Breakpoint-Grenze (heute `max-width:760px`, `style.css:2264-2296`) wird die Seitenleiste zur **Off-canvas-Schublade** über einen Menü-Knopf; Editor immer volle Breite. Kein horizontaler Überlauf, keine Überlagerung von Text und Panels.

## 5. Komponenten (neu eingekleidet, gleiche Funktion)

Alle bestehenden Klassennamen bleiben (der Smoke-Test prüft sie); Neustyling erfolgt in `style.css`. Als kleine **wiederverwendbare Teile** entstehen:

- **Aura** (`.onda-aura`) — Präsenz-Orb des Agenten. Kreis mit `--gradient-aura`, weichem `--shadow-glow`, Zuständen: `quiet` (ruhig), `thinking` (sanftes Pulsieren/Rotieren mit `--ease-spring`), aktiv. Größen 14/20/46px. `prefers-reduced-motion` → statisch. Ersetzt die Textglyphe `◌` und die Wortmarken-Marke.
- **Button** (`.onda-btn` + `--primary/--ghost/--danger`, Größen `sm`) und **IconButton** (28px). Ersetzen die Ad-hoc-Buttons in Hinweis-Karten, Agentenpanel, Belegpanel, Insert-Menü.
- **Badge/Tag** — Status-Badge (`success`/`warning`, mit optionalem Punkt) und Tag (z. B. „Primärquelle"). Für Verifikationszustände im Belegpanel (`verificationLabel` `workspace.js:1467-1471`) und „Offenes Risiko".

Neu eingekleidet, aber strukturell wie gehabt: weiße Hairline-Karten (`--radius-card`, `--shadow-xs`), Pill-Composer mit rundem Sende-Knopf, Textfelder (Risiko-Begründung, Eigene-Fassung), das semantische Insert-Menü (`.semantic-insert-menu` `style.css:1993-2022`).

## 6. Verhalten — vollständige Interaktionstreue

Nichts Bestehendes verliert seine Funktion. Erhalten (nur umgestylt/umplatziert):

- **Bausteine**: stabile IDs/Rollen (`block-identity.js`), Aktiv-Hervorhebung (`activeBlockPlugin` `workspace.js:69-92`), `+`-Insert zwischen Bausteinen (`#blockInsertLayer`, `renderInsertTrigger` `workspace.js:490-537`, `openInsertMenu` `344-403`).
- **Randhinweise** (`#localAgentLayer`, `renderLocalFinding` `workspace.js:1188-1300`): inline hervorgehobene Phrase (Akzent-Tint = Stil/Übergang, Amber-Tint = Beleglücke) öffnet eine **Karte im rechten Gutter** (`left: calc(100% + 34px)`, Zielbild aus AppShell) mit Beobachtung/Relevanz/Folge, Vorschlags-Diff („bisher → neu", `renderSuggestion` `1094-1124`, Wort-Diff `780-800`), Aktionen Übernehmen/Eigene Fassung/Verwerfen und dem **Risiko-annehmen**-Fluss für unbelegte Zahlen (`1015-1092`). Positionierung bleibt JS-gesteuert (`positionLocalSurface` `1140-1186`) samt Reflow-Spacer (`localFindingPlugin` `94-131`).
- **Agentenpanel** (`#agentWidget`, `renderAgentWidget` `workspace.js:1345-1419`): Liste offener Hinweise (Sprungziele), Entscheidungsverlauf, Chat-Thread, Composer; proaktive Initiative nur in Schreibpausen (`scheduleAgentInitiative` `1645-1711`, Gate `workspace-model.mjs:237-264`), niemals Fokusraub; Ungesehen-Punkt am Orb. Exklusivität der Ebenen (`enforceExclusiveLayers` `226-243`) bleibt.
- **Belegpanel** (`#evidenceWindow`, `renderEvidenceWindow` `workspace.js:1496-1600`): zu belegende Aussage, Quellen mit Verifikations-Badges, Zitat-Kopieren (`copyCitation` `1440-1465`), sichere https-Links (`safeHttpsUrl`/`openSecureExternal` `1421-1438`).
- **Persistenz**: alle sichtbaren Entscheidungen und offenen Zustände überleben Reload (`localStorage aiwt.v2` / WKWebView-Bridge, `editor.js:155-269`). Kein Datenschemabruch (`SCHEMA=6` unverändert; nur Settings um `accent` und Sidebar-Zustand ergänzt).

### 6.1 Neu: Projektverständnis-Ansicht

Modal (Onda-Dialog: Scrim `rgba(Tinte,0.4)` + Blur, `--radius-overlay`/`--radius-panel`, `--shadow-xl` + `--shadow-glow`, Fade+6px). Inhalt aus dem vorhandenen Understanding-Objekt, jeweils Label + Text: Aufgabe, Zielgruppe, Beabsichtigte Wirkung, Belegstandard, Geschützte Absicht, Offene Frage. **Lesen mit Korrekturmöglichkeit** (kein Formularfriedhof). Metastruktur/Verständnis bleiben KI-abgeleitet; der Nutzer weist nichts manuell zu, kann aber korrigieren.

## 7. Motion & Zugänglichkeit

- Einblendungen: Fade + 6px Aufwärts auf `--ease-out`; Dauern 120–360ms; `--ease-spring` nur für die Aura. `prefers-reduced-motion` reduziert auf ~instant.
- Fokus: 2px Akzent-Outline (Tastatur), weicher 3px-Ring auf Feldern (`--shadow-focus`).
- Modal: Fokus-Falle + Schließen mit Esc; neue Agenteninhalte übernehmen nie den Tastaturfokus (bestehende Zusage bleibt).
- Voll bedienbar per Tastatur: Seitenleiste ein-/ausklappen, Orb, Hinweis-Karten, Panels.
- Licht/Dunkel vollständig; Akzentvarianten über `data-accent`.

## 8. Dateien & Berührungspunkte

- `app/index.html` — Rahmen der `#editorView` umbauen: Seitenleiste + Editorspalte statt Header+Grid; `#structureShelf` entfällt; `#agentPresence`→Aura-Orb im Slim-Header; `#agentWidget`/`#evidenceWindow` bleiben (umgestylt). Font-Preloads.
- `app/fonts/` — neue Hanken-Grotesk- + JetBrains-Mono-woff2 (lokal eingebettet).
- `app/src/style.css` — Onda-Tokens einziehen; Alt-Tokens umhängen; neue `@font-face`; Seitenleiste, Slim-Header, Aura, Gutter-Karten, Agenten-/Belegpanel, Composer, Badges, Modal neu stylen; alte Strukturablage-/Grid-Regeln entfernen; Responsiv-Block anpassen.
- `app/src/workspace.js` — Rendering der Seitenleistensektionen (Struktur, Material, Projektverständnis-Karte+Modal), Aura-Orb-Verdrahtung, Einklapp-Logik + Persistenz; Umzug der Strukturablage-Inhalte; Entfall von Pfad-Toggle/Shelf-Grid. Findings/Agent/Beleg-Logik bleibt.
- `app/src/ui.js` — `applySettings()` um `data-accent` und Sidebar-Zustand erweitern; Doc-Font-Override auf Onda stellen; Boot-Reihenfolge unverändert.
- `app/src/editor.js` — nur falls nötig: `state.settings` um `accent`/`sidebarCollapsed` erweitern (abwärtskompatibel, kein SCHEMA-Bruch).
- `app/src/block-identity.js` — unverändert (nur Konsument der Rollen/IDs).
- `app/test/v2-smoke.mjs` — an die neue Rahmenstruktur/Klassennamen anpassen; Zusicherungen gegen tote V1-Pfade bleiben.
- Neue kleine Bausteine (Aura/Button/IconButton/Badge) als CSS-Klassen + ggf. schlanke JS-Helfer, ohne Framework.

## 9. Abnahmekriterien (beobachtbar)

1. **Rahmen**: Persistente, einklappbare Seitenleiste mit Wortmarke, Zurück, Projektverständnis, Struktur, Material, Avatar+Theme; Editor mit Slim-Header und Aura-Orb oben rechts. Kein alter Header-Pfad, keine Slide-in-Ablage. *Beleg: Screenshot hell/dunkel.*
2. **Aura**: Orb mit Onda-Verlauf+Glow ersetzt `◌`; öffnet/schließt das Agentenpanel; Ungesehen-Punkt erscheint bei neuer Initiative. *Beleg: Screenshot + Klick.*
3. **Einklappen**: Chevron klappt die Seitenleiste ein/aus, Editor nimmt volle Breite, Zustand überlebt Reload. *Beleg: Interaktion + Reload.*
4. **Typografie**: UI und Fließtext in Hanken Grotesk (16,5px Body), Technisches in JetBrains Mono; Fonts lokal, keine externen Requests. *Beleg: Netzwerk-Log leer für Fonts.*
5. **Themes**: Licht/Dunkel und mindestens die Akzentumschaltung wirken app-weit (Links, Auswahl, Aura-Glow). *Beleg: Screenshots je Theme/Akzent.*
6. **Interaktionstreue**: Baustein-Insert, Randhinweis öffnen, Vorschlag übernehmen/verwerfen, Eigene Fassung, Risiko annehmen, Agenten-Chat, Belegpanel mit Zitat-Kopie — alle funktionieren und überstehen Reload. *Beleg: Durchklick + Reload.*
7. **Projektverständnis**: Karte öffnet Modal mit den sechs Feldern aus dem Understanding-Modell; korrigierbar. *Beleg: Screenshot.*
8. **Zugänglichkeit/Motion**: Sichtbarer Fokus, Esc/Fokus-Falle im Modal, kein Fokusraub durch Agent, `prefers-reduced-motion` respektiert, kein horizontaler Überlauf desktop/schmal. *Beleg: Tastatur-Durchlauf + schmaler Viewport.*
9. **Tests**: `npm test` grün; angepasster Smoke-Test deckt die neue Struktur; tote V1-Pfade bleiben ausgeschlossen.

## 10. Nicht Teil dieses Abschnitts

Onda-Umbau der Bibliothek/Startseite; echte Webrecherche; vollständige Memory-Infrastruktur; Multi-Agent; Export-Formate; endgültiges Branding. Die Architektur bleibt mit diesen späteren Fähigkeiten kompatibel.
