# Onda Design System

**Onda** *(ital. „Welle")* — **From thought to flow.** Ein Design System für klare, ruhige, hochwertige Interface-Interaktion — „Friendly Interaction Interface". Aus rohen Gedanken entsteht klarer Ausdruck; sehr reduziert, fast wie ein Designprodukt. Erste Anwendung: ein agentisches KI-Schreibwerkzeug (Web-App); später weitere Software. Kernwerte: **Klarheit, Calm Technology, hochwertige Verarbeitung, vertrauensvolle Gestaltung.** Seriös, aber freundlich.

> Name bestätigt (2026-07-21): **Onda**, Claim **„From thought to flow."** Das Signatur-Element „Aura" (Orb + Verlauf) behält seinen Namen — es bezeichnet die Aura des Agenten, nicht die Marke.

## Sources
- **Orbis — Smart Buddies for Everyday Life**, UX Design Award 2026: https://ux-design-awards.com/winners/2026-2-orbis-smart-buddies-for-everyday-life — vom Nutzer als visuelle Referenz genannt (ruhig, vertrauensvoll, klar; der farbliche Verlauf; clean, aufgeräumt, hell). Bild-URLs sind zugriffsbeschränkt; Richtung aus Beschreibung + Nutzerangaben übernommen. Aura ist ein **eigenständiges** System, keine Kopie.
- **ChatGPT-App** (Referenz des Nutzers): klare, eindeutige Interfaces, viel Weißraum, Ruhe und Ordnung.
- **Nutzerantworten (2026-07-21):** Light + Dark; monochrome Papier/Tinte-Palette mit einem warmen Akzent; scharfe Ecken; Tonalität 80/100 (seriös); Motion 80/100 (viel, smooth); Copy DE + EN; „füge wirklich nur das hinzu was nötig ist".
- Kein Codebase, kein Figma, keine Logo-Dateien vorhanden.

## Content fundamentals
**Sprache:** Deutsch und Englisch gleichwertig; pro Oberfläche eine Sprache, nie gemischt. Deutsch duzt („du"), bleibt aber im Register sachlich.
**Ton:** ruhig, präzise, zurückhaltend. Das Interface behauptet nichts, es stellt fest. Keine Ausrufezeichen, kein Hype-Vokabular („supercharge", „magisch"), keine Emoji.
**Kürze ist Pflicht:** jedes Wort verdient seinen Platz. Erst kürzen, dann formulieren. Leere Zustände sind ein Satz + eine Handlung, kein Absatz.
**Casing:** Sentence case überall — Titel, Buttons, Menüs. ALL-CAPS nur für 11–12px-Eyebrow-Labels mit `--tracking-wider`.
**Aktionen sind Verben:** „Dokument erstellen", „Export starten" — nie Substantivketten.
**KI spricht im Aktiv-Präsens, gelassen:** „Entwurf wird geschrieben …", „Quelle geprüft". Fortschritt wird gezeigt, nicht gefeiert.
**Zahlen & Technisches** (Shortcuts, Tokens, Dateigrößen) stehen in Diatype mit Tabellenziffern (`font-variant-numeric: tabular-nums`); es gibt keine Mono-Schrift.

Beispiele:
| Statt | Schreibe |
|---|---|
| „Los geht's! 🚀" | „Weiter" |
| „Dein Entwurf wurde erfolgreich gespeichert!" | „Gespeichert" |
| „Oops! Da ist was schiefgelaufen :(" | „Verbindung unterbrochen. Erneut versuchen." |
| "Unleash your creativity with AI magic" | "Write with a reliable co-author" |

## Visual foundations
**Farbe.** Nahezu monochrom: fast weißes, warm getöntes Papier (`#fbfaf8`) bis Tinte (`#1c1a17`), Weiß für Flächen. **Ein** Akzent, **Sky** (`#8db2c9`, gedämpftes, entsättigtes Hellblau) — für primäre Aktionen, Links, Fokus, Auswahl; Aura-Verlauf und Glow leiten sich davon ab. Keine Akzent-Varianten, **keine Statusfarben**: Erfolg und Info sind neutral (Tinte auf `--bg-sunken`); **Rot (`#b04a3f`) allein für Fehler und Zerstörendes** — Formfehler, destruktive Aktionen und Fehler-Toasts. Kontrast: `--text-link` und `--text-tertiary` erfüllen AA (4,5:1) auf Papier und Weiß. Dark Mode: warmes Fast-Schwarz (`#141310`), Akzent hellt eine Stufe auf.
**Typografie.** Eine Familie: **ABC Diatype** (Dinamo, lokal gebündelt). **Drei Größen, drei Gewichte — mehr existiert nicht:** Titel 21 Bold 700 (`--text-xl`), Text 15 Regular 400 / Labels Medium 500 (`--text-base`), Caption 12 Regular 400 (`--text-xs`); dazu Display 40 Bold 700 (`--text-4xl`) allein für Seitentitel und Wortmarke. Die Skala kennt genau diese vier Token — Zwischengrößen wurden entfernt, damit keine entstehen können. Keine Mono; Zahlen mit `tabular-nums`. **Pro Element höchstens zwei Größen und zwei Textfarben.**
**Weißraum.** 4px-Raster. Großzügigkeit ist Markenmerkmal: im Zweifel die größere Stufe. Lesespalte 680px, Inhalt max. 1120px.
**Hintergründe.** Flaches Papier. Keine Texturen, Muster oder Fotos als Flächen; höchstens `--gradient-surface` als kaum sichtbarer vertikaler Hauch.
**Animation.** Zurückhaltend: alles antwortet schnell (120ms) und setzt sanft auf (`--ease-out`, expo). Einblendungen = Fade + 6px Aufwärtsbewegung — auch Sprechblasen; kein Aufskalieren, kein Bounce in funktionalem UI. `--ease-spring` gehört allein der Aura-Präsenz — sie lebt, aber leise: der Verlauf rotiert sehr langsam (20s), Halo und Aura-Wolke atmen kaum sichtbar. Größere Ortswechsel 240–360ms mit `--ease-standard`. `prefers-reduced-motion` wird respektiert.
**Hover:** Flächen tönen sich (`--bg-hover`), nichts invertiert; Links dunkeln + Unterstreichung. **Press:** `--bg-active` + `scale(0.98)`. **Fokus:** ausschließlich ein weicher Akzent-Halo (`--shadow-focus`, 4px) — keine Outline, keine Randfarbe, kein Layout-Sprung. Ausgelöst über `:focus-visible`, Mausklicks zeigen nichts; nie `outline:none` ohne diesen Ersatz. **Akzent sparsam:** Sky trägt Aktionen, Auswahl, Fokus und die Aura — nicht ganze Flächen; was nur strukturiert, bleibt neutral (`--bg-sunken` + Haarlinie). auf Feldern.
**Ränder & Schatten.** Trennlinien nur, wo sie etwas klären — **keine Rahmen-Rasterei**: Bereiche werden durch weiche Flächen (`--radius-panel`) und Abstand getrennt, nicht durch Striche. Schatten sind echter Elevation vorbehalten (Menüs, Dialoge, Drag) — weich, warm getönt, nie hart.
**Karten/Widgets:** weiße Fläche auf Papier, `--radius-card` (24px), höchstens `--shadow-xs`; innen großzügig — Standard 20–22px Padding, große Flächen 32px. Ruhig, kein Dekor. **Alle Controls sind Pillen** (Buttons 32/40/48px hoch, Felder 40px, Tabs, Chips), alle Flächen 24px Radius — nur zwei Radien im System.
**Ecken.** Bewusst knapp: Controls 6px, Karten 8px, Overlays 10px. Weiche Flächen (Quellen-Panels, Composer, Sprechblasen) nutzen `--radius-panel` (24px) mit fast unsichtbarer Haarlinie (`--border-subtle`); Such- und Composer-Leisten dürfen Pill sein (`--radius-pill`). Sonst keine Pillen-Container; `--radius-full` für Avatare, Statuspunkte, Aura-Orb.
**Transparenz & Blur.** Nur auf schwebenden Ebenen: Scrim `rgba(Tinte, 0.4)` + `backdrop-filter: blur` auf Dialog/Command-Palette. Nie auf Inhaltsflächen.
**Imagery.** Standardmäßig keine. Wenn Illustration nötig: abstrakte, weiche Farbfelder aus der Aura-Palette. Keine Stockfotos, keine 3D-Blobs, keine gezeichneten Maskottchen.

## Iconography
- **Eine Quelle: die `Icon`-Komponente** (`components/display/Icon.jsx`) — Lucide-Pfade (ISC) im 24er-Raster, `stroke-width: 1.75`, Farbe via `currentColor`; 16px inline neben Text, 20px alleinstehend. **Nie eigene SVG-Glyphen zeichnen** — fehlt ein Symbol, kommt der Pfad in `Icon.jsx` dazu. **Substitution:** es wurde kein Marken-Set geliefert; Lucide passt zur Haarlinien-Ästhetik. Bei vorhandenem Set bitte nachreichen.
- Keine Emoji als Icons. Erlaubtes Unicode: „→" am Ende von Textlinks, „·" als Trenner, „⌘" in Shortcuts.
- **Kein Logo vorhanden.** Wortmarke = „Onda" in ABC Diatype Heavy, `--tracking-tight`. Es wird kein Logo-Zeichen erfunden.

## Fonts
**ABC Diatype** (Dinamo, Edu-Lizenz) — vom Nutzer geliefert (2026-07-22), lokal gebündelt: `assets/fonts/*.woff2` (100–950 inkl. Italics), `@font-face` in `tokens/fonts.css`. Keine Mono-Schrift im System; Technisches steht in Diatype mit `tabular-nums`.

## Intentional additions
- **Aura** (Präsenz-Orb): kanonisches Element für den KI-Agenten — das Produkt ist agentisch, die Präsenz braucht genau eine Form.
- **Textarea** (Kern eines Schreibwerkzeugs), **Avatar** (Dashboard).

## Index
- `styles.css` — globaler Einstieg (nur `@import`); `base.css` — minimale Grundstile inkl. Link-Farben
- `tokens/` — `colors` · `typography` · `spacing` · `radius` · `elevation` · `motion` · `fonts`
- `guidelines/` — Specimen-Karten: Colors (Neutrals, Akzent, Status, Aura-Verlauf, Dark), Type (Display, Text, Gewichte), Spacing (Skala, Radien, Elevation), Motion, Brand (Wortmarke, Stimme)
- `components/` — 27 Komponenten in 8 Gruppen:
  - `actions/` — **Button**, **IconButton**
  - `inputs/` — **Input**, **Textarea**, **Select**, **Checkbox**, **Radio**, **Switch**
  - `display/` — **Card**, **Badge**, **Tag**, **Avatar**, **Icon** (kanonisches Set: Lucide-Pfade, 24er-Raster, 1.75 — eigene Glyphen werden nicht gezeichnet, fehlende Symbole kommen in `Icon.jsx` dazu)
  - `feedback/` — **Dialog**, **Toast**, **Tooltip**
  - `navigation/` — **Tabs** (underline + segmented)
  - `conversation/` — **Bubble** (Orb-Sitz + Blase als eine durchgehende Kontur; `seat="left"` Orb links / `seat="top"` dieselbe Kontur um 90° gedreht, Orb oben rechts, `thinking` für den Denk-Zustand; User: neutrale Fläche), **Composer** (Signatur-Pill, Enter sendet, Auto-Grow auf `--radius-panel`, Stopp-Knopf während der Antwort)
  - `annotation/` — **Annotation** (Anmerkung am Textrand: Art + Bezug + Ziffer + **Rangfolge** (`priority`: Fehler / Empfehlung / Geschmack, sonst aus der Art abgeleitet), optional Vorschlag, Verschiebeziel, Beleg mit Link, Ausschnitt und Herkunft, `compare` für Widersprüche, `count` für Mehrfachstellen, `why` für die Regel auf Abruf, `conflict` für sich ausschließende Vorschläge, `onSecondary` für ‚Andere Quelle‘), **Mark** (Markierung im Fließtext — Korrektur mit Haarlinien-Rahmen, Stil auf neutraler Fläche, Struktur als angehobener Block, Inhalt auf Akzentfläche; kein Farbcode), **Correction** (Korrektur direkt am Wort, alt → neu), **Insertion** (Einfügemarke; der Vorschlag öffnet eine Lücke im Textfluss statt zu überdecken), **Rewrite** (Vorschlagskarte am Rand für alles, was länger als ein Wort ist), **Slot** + **Region** (gestrichelter Zielplatz bzw. getönte Bereichsmarkierung). **Die Darstellungsform folgt der Natur der Anmerkung:** eindeutig falsch → `Correction` am Wort (Rechtschreibung, Grammatik, Zeichensetzung, Wortwahl, Anglizismus). Vergleich nötig → `Rewrite` im Text (Satzstil, Absatzstil, Straffen, Textfluss). Etwas kommt hinzu → `Insertion` (Übergang, Stilmittel, Verständlichkeit). Ortswechsel → `Slot` (Verschieben, Gliederung). Viele Stellen → `Region` + Sammelkarte mit `count` (Ton, Wiederholung, Terminologie). Beleg oder Zahl → `Annotation` mit `source` (Beleg, Faktencheck); zwei Stellen → `compare` (Widerspruch). Meinung oder Frage → `Bubble` als Dialog (Anmerkung, Gegenargument). Titel → `Correction` am Titel (Überschrift). Textweit → Struktur-Karte (Roter Faden).
  - `brand/` — **Aura** (Präsenz-Orb des Agenten)

  **Notizmodus.** Solange der Text aus Stichworten, Pfeilen und Fragmenten besteht, korrigiert der Agent **nichts** — keine Rechtschreibung, keine Grammatik, kein Stil. Stattdessen: ausformulieren, zusammengehörende Notizen bündeln, nachfragen, Reihenfolge vorschlagen, offene Fäden aufgreifen (`kinds.js` → Kategorie `notiz`). Umschalter Notiz ↔ Text; Karte `notes.card.html`.

  **Arbeitsweise (Textansicht).** Rangfolge oben als ruhige Bilanz (x Fehler · y Empfehlungen · z Geschmack); Korrekturen sammelbar („Alle 6 übernehmen"); jede Übernahme ist **rückgängig** und die geänderte Stelle blitzt kurz auf; **Verwerfen hat Konsequenz** (nur diesmal · nicht mehr in diesem Text · nie); **stiller Modus** sammelt Anmerkungen, während geschrieben wird; unter 1040px rutschen die Anmerkungen unter den Text.
- `ui_kits/writing-tool/` — UI-Kit des KI-Schreibwerkzeugs („Onda Write"): interaktives `index.html` + Screens
- `templates/app-shell/` — DC-Startvorlage „App-Shell" für konsumierende Projekte
- `SKILL.md` — Einstieg für Agents (Claude Code kompatibel)

