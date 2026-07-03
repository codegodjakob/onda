# Professioneller Schreib-Editor — Design-Spezifikation

> **Status:** Vom Nutzer freigegeben (2026-07-03). Nächster Schritt: Implementierungs-Plan.
> **Ziel-Nutzer:** Jakob (nicht-technisch) — die App muss sich „höchst professionell" anfühlen: Essentials von Pages/Notion, granulare Word-artige Kontrolle, hochwertige Anmutung.
> **Kontext:** Baut die bestehende Schreibwerkzeug.app (Tauri-artige Swift-Hülle + Web-Oberfläche) zum professionellen Editor aus. Bestehende Texte bleiben erhalten. Dies ist die „Schreibteil"-Stufe des Gesamtkonzepts (siehe `2026-06-29-ki-schreibwerkzeug-design.md`); Struktur-Phase und KI-Unterstützung folgen als nächste Stufen.

## 1. Fundament

- **Editor-Engine: Tiptap v2 (ProseMirror).** Ersetzt die bisherige `contenteditable`/`execCommand`-Lösung (Sackgasse für Listen, Bilder, granulare Formate, Undo). Entspricht der Tech-Empfehlung aus dem Research-Brief; spätere Argument-Bausteine werden eigene Node-Typen.
- **Bundling:** Lokales npm-Projekt in `app/` (`package.json`); `esbuild` bündelt `app/src/editor.js` → `app/dist/editor.bundle.js` (IIFE, globales `AIWTEditor`). Die HTML lädt das Bundle lokal — **App bleibt komplett offline**, kein CDN zur Laufzeit. Node v24 / npm 11 sind auf dem Rechner vorhanden.
- **Tiptap-Extensions:** StarterKit (Absätze, H1–H3, fett/kursiv/durchgestrichen, Listen inkl. Verschachtelung, Zitat, Code-Block, Trennlinie, History) + Underline, Link, TaskList/TaskItem, Image, TextStyle, Color, Highlight, TextAlign, Placeholder, CharacterCount, Typography. **FontSize** als kleine eigene Extension auf TextStyle-Basis (Schriftgröße pro Auswahl).
- **Mac-Hülle bleibt** (Swift: Fenster, Menüs, Datei-Speicherung mit Backup & Reparatur, Selftest/Probe). Ergänzt um: Bild-Serving, Druck-Menü.
- **Datenformat kompatibel:** weiterhin `{docs:[{id,title,body(HTML),updated,…}], active, settings}` in `data.json`; Tiptap parst das bisherige HTML. Neu: `settings`-Objekt, `trashed`/`trashedAt` je Dokument.

## 2. Schreiben & Formatieren (Mischung Notion + Word)

**Block-Ebene (Notion-Gefühl):**
- **Slash-Menü:** „/" am Zeilenanfang öffnet Befehlsliste (Text, Überschrift 1–3, Aufzählung, Nummerierung, Checkliste, Zitat, Trennlinie, Bild). Pfeiltasten + Enter, Tippen filtert, Esc schließt.
- **Markdown-Kürzel beim Tippen:** `# ` → H1, `## ` → H2, `### ` → H3, `- ` → Liste, `1. ` → Nummerierung, `[] ` → Checkliste, `> ` → Zitat, `---` → Trennlinie, `**fett**`, `*kursiv*` (StarterKit-InputRules + TaskList-Rule).
- **Auswahl-Bubble:** schwebende Mini-Leiste bei Textauswahl: B, I, U, S, Schriftgröße, Link, Textfarbe/Highlight.

**Zeichen-Ebene (Word-Gefühl):**
- Für markierten Text einzeln: **Schriftgröße** (Stepper + Auswahl 12–32 px), fett, kursiv, unterstrichen, durchgestrichen, **Textfarbe** und **Markierfarbe** (kleine kuratierte Palette), **Ausrichtung** links/zentriert/rechts (Absatzebene).
- **Obere Leiste — Gestaltungsregel „sehr ruhig":** maximal ~6 sichtbare Elemente, alles Weitere in Dropdowns. Konkret: links **Blocktyp-Dropdown** („Text ▾") · **B** · **I** · **Format-Menü** („Aa ▾": Schriftgröße, unterstrichen/durchgestrichen, Textfarbe, Markierung, Ausrichtung) · **Einfügen-Menü** („+ ▾": Link, Bild, Checkliste, Zitat, Trennlinie) — rechts nur: Zähler · Speicher-Punkt · Zahnrad (Einstellungen, enthält auch Export/Drucken). Keine Icon-Reihen, keine zweite Leiste.
- **Primäre Formatier-Wege sind kontextuell**, nicht die Leiste: Auswahl-Bubble bei markiertem Text, Slash-Menü, Markdown-Kürzel, Tastenkürzel. Die Leiste ist die ruhige Rückfallebene.
- **Links:** einfügen/bearbeiten über Dialog (Bubble + ⌘K); Klick mit gedrückter ⌘ öffnet im Browser.
- Undo/Redo über ProseMirror-History (Menü ⌘Z/⇧⌘Z funktioniert weiter).

## 3. Bilder

- **Einfügen:** Einfügen aus Zwischenablage (Paste) und Hineinziehen (Drag & Drop).
- **Speicherung nativ:** Bilddaten gehen als Base64 über die Brücke (`saveimg`-Handler); Swift speichert als Datei unter `App Support/Schreibwerkzeug/images/<uuid>.<ext>` und liefert sie über einen **WKURLSchemeHandler** `aiwt-img://<datei>` aus. Im Dokument-HTML steht nur die kleine URL — `data.json` bleibt schlank.
- **Browser-Fallback:** Bilder als `data:`-URL direkt im Dokument (funktional, nur größer).
- **Größe ändern:** Klick markiert Bild, seitliche Anfasser ziehen Breite (25–100 %, gespeichert als Prozent-Breite).
- Löschen des Bildes im Text lässt Datei zurück (Aufräumen verwaister Bilder: beim App-Start, Datei ohne Referenz in irgendeinem Doc → löschen).

## 4. Suche & Verwaltung

- **Suche:** Feld über der Textliste; filtert live über Titel + Textinhalt (HTML-bereinigt, case-insensitiv); Treffer im Listeneintrag hervorgehoben; Esc leert.
- **Sortierung:** zuletzt bearbeitet (Standard) / Titel A–Z, Umschalter über der Liste.
- **Duplizieren:** Hover-Menü (…) am Listeneintrag → „Duplizieren" (Kopie mit „ Kopie"-Suffix).
- **Papierkorb:** „Löschen" verschiebt in Papierkorb-Bereich (einklappbar unten in der Seitenleiste); dort „Wiederherstellen" oder „Endgültig löschen" (mit Nachfrage). Automatisches endgültiges Löschen nach 30 Tagen (beim Laden geprüft via `trashedAt`).

## 5. Komfort & Erscheinung

- **Dunkelmodus:** automatisch nach macOS-System (`prefers-color-scheme`) + manueller Override (Auto/Hell/Dunkel) im Einstellungs-Popover. Vollständige Dark-Palette (auch Editor-Inhalt).
- **Fokus-Modus:** Schalter + ⌘. — aktueller Absatz voll sichtbar, Rest gedimmt (sanfter Übergang); Seitenleiste blendet aus.
- **Dokument-Typografie:** Einstellungs-Popover: Grundschriftgröße (16–21 px), Zeilenbreite (schmal 600 / mittel 720 / breit 900 px), Schriftart des Editors (Serif/Sans). Global, in `settings` gespeichert.
- **Rechtschreibprüfung:** an/aus (nativ macOS; `spellcheck`-Attribut).
- **Drucken/PDF:** ⌘P bzw. Menü „Ablage → Drucken …" → nativer Druckdialog (`webView.printOperation`), daraus PDF sichern. Druck-CSS (schwarz auf weiß, ohne UI).

## 6. Hochwertigkeits-Gefühl (Motion & Polish)

Beim Bau werden die Design-Skills (interface-design, interaction-design) konsultiert. Festgelegte Elemente:
- **Scroll-Fade:** Text läuft oben/unten „milchig" aus (CSS-Mask am Scroll-Container), passend zu Hell/Dunkel.
- **Sanfte Übergänge:** Dokumentwechsel (kurzes Fade), Einstellungs-Popover, Bubble-Erscheinen, Papierkorb-Auf/Zu — 150–250 ms, dezente Easing-Kurven; `prefers-reduced-motion` wird respektiert.
- **Feine Details:** Speicher-Indikator (Punkt statt Text-Blinken), Hover-Zustände, Fokus-Ringe, Auswahlfarbe, Cursor-Ruhe (keine Layout-Sprünge), Leerzustände (freundlicher Hinweis statt weißer Fläche).
- Keine Effekt-Show: Qualität dezent, nichts drängt sich auf.
- **Leitprinzip Ruhe (vom Nutzer festgelegt):** Das Interface bleibt sehr ruhig und klar — wenige sichtbare Optionen, Gruppierung in Dropdowns/Popover statt Knopfreihen; im Zweifel wandert eine Funktion ins Menü statt in die Leiste.
- **Calm Technology (vom Nutzer als Gesamtprinzip festgelegt):** kleinstmögliche Aufmerksamkeits-Beanspruchung; Information über die Peripherie (Speicher-*Punkt* statt blinkender Text, sanfte Zustandswechsel); Werkzeuge kontextuell auf Abruf; robust bei Fehlern (Speichern schlägt fehl → ruhiger, klarer Hinweis, kein Alarm). Voller Funktionsumfang, leise Präsentation.

## 7. Technik, Migration, Fehlerfälle

- **Dateien:** `app/src/editor.js` (Editor-Aufbau + Extensions + Bridge), `app/src/ui.js` (Seitenleiste, Toolbar, Einstellungen, Suche, Papierkorb), `app/src/style.css`, `app/index.html` (schlank, lädt Bundle), `app/dist/editor.bundle.js` (generiert), `mac/main.swift` (+ SchemeHandler, Druck-Menü, `saveimg`), `mac/build.sh` (baut Bundle via npm + esbuild vor dem Kopieren).
- **Migration:** vorhandene `data.json` wird unverändert geladen (HTML-Bodies parst Tiptap; unbekannte Attribute bleiben erhalten, soweit Schema sie kennt). `settings` fehlt → Defaults.
- **Fehlerfälle:** Speicher-Fehler → rote Warnung (wie bisher); Bild-Speichern fehlgeschlagen → Hinweis, Einfügen als data:-URL-Fallback; Scheme-Handler-Datei fehlt → Platzhalter-Grafik.

## 8. Tests (vor Übergabe, automatisiert wo möglich)

1. **Speicherschicht-Selftest** (bestehend, 11 Checks) — unverändert grün.
2. **End-to-End-Probes** (bestehend: frisch/vorhanden/kaputt) + erweitert: Editor initialisiert (Tiptap ready), Format-Befehl + Undo-Roundtrip, Settings-Persistenz.
3. **Browser-Automationstests** (Preview): Markdown-Kürzel erzeugt Überschrift/Liste/Checkliste · Slash-Menü öffnet/filtert/fügt ein · Schriftgröße auf Auswahl an/aus · Suche filtert korrekt · Papierkorb: löschen→wiederherstellen→endgültig · Duplizieren · Dark-Mode-Umschaltung · Fokus-Modus · Neuladen-Persistenz inkl. neuer Formate (Checkliste, Farbe, Größe).
4. **Mac-App real:** Start wie Doppelklick, stabil, Signatur, Icon; Neustart-Persistenz mit neuen Formaten.
5. **Manuelle Checkliste für Jakob:** Drucken/PDF, Bild einfügen + Größe ziehen, Tippgefühl.

## 9. Bau-Reihenfolge

A) Editor-Kern (npm+esbuild, Tiptap, Laden/Speichern über bestehende Brücke, Migration) →
B) Formatierung komplett (Toolbar, Bubble, Slash, Markdown-Kürzel, FontSize/Farben/Ausrichtung) →
C) Bilder (Scheme-Handler, Paste/Drop, Resize) →
D) Verwaltung (Suche, Sortieren, Duplizieren, Papierkorb) →
E) Komfort (Dark/Fokus/Typo-Einstellungen, Spellcheck, Druck) →
F) Design-Feinschliff mit Design-Skills (Scroll-Fades, Übergänge, Details) →
G) Testrunden + App neu bauen.

## Nicht in dieser Stufe (bewusst)

Tabellen, Fußnoten, Kommentare, Versionsverlauf-UI, Word-Export (.docx), Ordner/Projekte-Hierarchie, KI-Funktionen, Struktur-/Ordnen-Ansicht — folgen in späteren Stufen gemäß Gesamtkonzept.
