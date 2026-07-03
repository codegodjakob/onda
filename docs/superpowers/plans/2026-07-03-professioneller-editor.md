# Professioneller Schreib-Editor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die bestehende Schreibwerkzeug.app zum professionellen Editor ausbauen: Tiptap-Fundament, ruhiges UI (max. ~6 Toolbar-Elemente, Rest in Dropdowns), Slash-Menü, Markdown-Kürzel, granulare Word-Formate, Bilder, Suche/Papierkorb, Dark/Fokus-Modus, Druck, Motion-Polish — voll getestet.

**Architecture:** Web-Oberfläche (Tiptap v2, per esbuild zu einem Offline-Bundle gebaut) in der bestehenden Swift/WKWebView-Hülle. Persistenz unverändert über die `store`-Bridge → `data.json` (atomar + Backup). Neu in Swift: `aiwt-img://`-SchemeHandler für Bilddateien, `saveimg`-Handler, Druck-Menü (⌘P). Browser-Fallback (localStorage, data:-URLs) bleibt funktionsfähig.

**Tech Stack:** Tiptap 2.11.x (+Extensions), esbuild, Vanilla JS/CSS, Swift (AppKit/WebKit), python3-http.server für Preview-Tests.

**Spec:** `docs/superpowers/specs/2026-07-03-professioneller-editor-design.md`

---

## Dateistruktur

```
app/
  package.json          — npm-Projekt (tiptap + esbuild), Script "build"
  src/editor.js         — Editor-Aufbau: Extensions, FontSize, Storage-Adapter, Bridge, Probe
  src/ui.js             — Seitenleiste, Toolbar+Dropdowns, Bubble, Slash, Einstellungen, Papierkorb
  src/style.css         — Design-Tokens, Komponenten, Dark, Fokus, Motion, Print-CSS
  index.html            — schlankes Grundgerüst; lädt style.css + dist/editor.bundle.js
  dist/editor.bundle.js — generiert (nicht von Hand editieren)
mac/
  main.swift            — + ImgSchemeHandler, saveimg, Druck-Menü, Probe-Erweiterung, Orphan-Cleanup
  build.sh              — + npm-Build-Schritt, kopiert index.html/style.css/Bundle
docs/superpowers/…      — Spec + dieser Plan
```

Alte `app/index.html`-Logik wird ersetzt; die **Bridge-Verträge bleiben identisch**:
`window.__NATIVE_DATA__` (injiziert), Handler `store`/`exportmd`/`probe`, Callbacks `__nativeSaveOk__/__nativeSaveFail__/__flushForQuit__/__newDocFromMenu__/__exportFromMenu__`. Neu: Handler `saveimg`, Callback `__imgSaved__`, `__printFromMenu__` optional.

**Datenformat:** `{docs:[{id,title,body,updated,trashed?,trashedAt?}], active, settings:{theme:'auto'|'light'|'dark', fontSize:16-21, lineWidth:600|720|900, font:'serif'|'sans', spellcheck:bool}}`

---

### Task 0: Git-Repo anlegen (Sicherungsnetz)

**Files:** neu: `.gitignore`

- [ ] **Step 1:** `.gitignore` schreiben:
```
node_modules/
app/dist/
Schreibwerkzeug.app/
mac/AppIcon.iconset/
.DS_Store
```
- [ ] **Step 2:** Repo initialisieren & Basis sichern:
```bash
cd "/Users/jakobschlenker/Documents/AI Writing Tool"
git init -b main && git add -A && git commit -m "chore: Basis vor Editor-Ausbau (funktionierende v1-App)"
```
Expected: Commit-Hash, keine Fehler.

### Task 1: npm-Projekt + Bundle-Grundlage

**Files:** Create: `app/package.json`, `app/src/editor.js` (minimal), Modify: —

- [ ] **Step 1:** `app/package.json`:
```json
{
  "name": "schreibwerkzeug-ui",
  "private": true,
  "scripts": { "build": "esbuild src/editor.js --bundle --minify --format=iife --global-name=AIWT --outfile=dist/editor.bundle.js" },
  "dependencies": {
    "@tiptap/core": "2.11.5", "@tiptap/starter-kit": "2.11.5",
    "@tiptap/extension-underline": "2.11.5", "@tiptap/extension-link": "2.11.5",
    "@tiptap/extension-task-list": "2.11.5", "@tiptap/extension-task-item": "2.11.5",
    "@tiptap/extension-image": "2.11.5", "@tiptap/extension-text-style": "2.11.5",
    "@tiptap/extension-color": "2.11.5", "@tiptap/extension-highlight": "2.11.5",
    "@tiptap/extension-text-align": "2.11.5", "@tiptap/extension-placeholder": "2.11.5",
    "@tiptap/extension-character-count": "2.11.5", "@tiptap/extension-typography": "2.11.5"
  },
  "devDependencies": { "esbuild": "0.24.2" }
}
```
- [ ] **Step 2:** Minimaler `app/src/editor.js` (Smoke): `export const version='dev';` plus `console.log` — nur damit der Build läuft.
- [ ] **Step 3:** Bauen: `cd app && npm install --silent && npm run build`
Expected: `dist/editor.bundle.js` existiert (>0 B), Exit 0.
- [ ] **Step 4:** Commit `feat: npm+esbuild Bundle-Grundlage`.

### Task 2: Editor-Kern mit Storage-Adapter (Migration!)

**Files:** Rewrite: `app/index.html`, `app/src/editor.js`; Create: `app/src/style.css`, `app/src/ui.js` (Gerüst)

- [ ] **Step 1:** `index.html` neu — schlank: `<link rel="stylesheet" href="src/style.css">`, Grundgerüst `<div id="app"><aside id="side">…</aside><main id="main"><div id="bar"></div><div id="scroll"><div id="page"><textarea id="title"></textarea><div id="editor"></div></div></div></main></div>`, dann `<script src="dist/editor.bundle.js"></script><script>AIWT.boot()</script>`.
- [ ] **Step 2:** `src/editor.js` — Kern:
```js
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
// … alle Extensions aus package.json importieren …
import { initUI } from './ui.js'

const NATIVE = !!(window.webkit?.messageHandlers?.store)
export const state = { docs: [], active: null, settings: null, editor: null }
const DEFAULTS = { theme:'auto', fontSize:17, lineWidth:720, font:'serif', spellcheck:false }

function load() {
  let d = null
  if (NATIVE) d = window.__NATIVE_DATA__
  else { try { d = JSON.parse(localStorage.getItem('aiwt.v2') || 'null') } catch(e){}
         if (!d) { // Migration aus v1-Browser-Keys
           try { const old = JSON.parse(localStorage.getItem('aiwt.docs.v1')||'null')
                 if (old) d = { docs: old, active: localStorage.getItem('aiwt.active.v1') } } catch(e){} } }
  state.docs = Array.isArray(d?.docs) ? d.docs : []
  state.active = d?.active
  state.settings = Object.assign({}, DEFAULTS, d?.settings || {})
  if (!state.docs.length) newDocRaw()
  if (!state.docs.some(x => x.id === state.active && !x.trashed))
    state.active = (state.docs.find(x => !x.trashed) || state.docs[0]).id
  purgeTrash()
}
export function persist() {
  const payload = JSON.stringify({ docs: state.docs, active: state.active, settings: state.settings })
  if (NATIVE) window.webkit.messageHandlers.store.postMessage(payload)
  else { try { localStorage.setItem('aiwt.v2', payload); window.__nativeSaveOk__?.() } catch(e){ window.__nativeSaveFail__?.() } }
}
```
plus `newDocRaw()`, `purgeTrash()` (30 Tage), Debounce-Save (400 ms) auf `editor.on('update')` + Titel-Input, `__flushForQuit__`, `__newDocFromMenu__`, `__exportFromMenu__`, Probe-Block (wie v1, ergänzt um `editorOk: !!state.editor && state.editor.isEditable`).
- [ ] **Step 3:** Editor instanziieren (`element:#editor`, Extensions: StarterKit `{heading:{levels:[1,2,3]}}`, Underline, Link `{openOnClick:false}`, TaskList, TaskItem `{nested:true}`, Image (Task 7 erweitert), TextStyle, Color, Highlight `{multicolor:true}`, TextAlign `{types:['heading','paragraph']}`, Placeholder `{placeholder:'Schreib hier los — „/" für Befehle …'}`, CharacterCount, Typography, FontSize [Task 3]); `content: aktiverDoc.body`.
- [ ] **Step 4:** Browser-Test (Preview Port 4600): tippen → neu laden → Inhalt da; v1-Daten (alte Keys setzen) → Migration greift.
Run: `preview_eval` Roundtrip wie in v1-Tests. Expected: Titel+Body nach Reload identisch; `AIWT.state.docs.length>=1`.
- [ ] **Step 5:** Commit `feat: Tiptap-Kern + Storage-Adapter + Migration`.

### Task 3: FontSize-Extension + Format-Vollausbau

**Files:** Modify: `app/src/editor.js`

- [ ] **Step 1:** FontSize (eigene Extension, ~20 Zeilen):
```js
import { Extension } from '@tiptap/core'
const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() { return [{ types: ['textStyle'], attributes: { fontSize: {
    default: null,
    parseHTML: el => el.style.fontSize || null,
    renderHTML: attrs => attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {}
  }}}] },
  addCommands() { return {
    setFontSize: size => ({ chain }) => chain().setMark('textStyle', { fontSize: size }).run(),
    unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run()
  } }
})
```
- [ ] **Step 2:** Test (Preview): Auswahl → `editor.chain().focus().selectAll().setFontSize('22px').run()` → `getHTML()` enthält `font-size:22px`; `unsetFontSize` entfernt es; Undo stellt zurück.
- [ ] **Step 3:** Commit `feat: FontSize pro Auswahl (Word-granular)`.

### Task 4: Ruhige Toolbar mit Dropdowns

**Files:** Modify: `app/src/ui.js`, `app/src/style.css`

- [ ] **Step 1:** Dropdown-Baustein (ein generischer `makeMenu(button, items)` mit Klick-außerhalb-schließt, Esc, ARIA `role=menu`). Toolbar-Bestückung exakt: **[Text ▾] [B] [I] [Aa ▾] [+ ▾] ··· [123 Wörter] [●] [⚙ ▾]**.
  - „Text ▾": Text, Überschrift 1/2/3, Zitat, Aufzählung, Nummerierung, Checkliste (setzt Blocktyp, zeigt aktiven).
  - „Aa ▾": Schriftgröße (− 17 +, Presets 14/17/20/24), U, S, Textfarbe (6er-Palette + Standard), Markierung (4er + keine), Ausrichtung (links/zentriert/rechts).
  - „+ ▾": Link (⌘K), Bild…, Trennlinie, Checkliste, Zitat.
  - „⚙ ▾": [Task 9] Erscheinung/Einstellungen + Exportieren (.md) + Drucken (⌘P).
- [ ] **Step 2:** Zustands-Sync: `editor.on('selectionUpdate'/'transaction')` → aktive Buttons/Labels (z. B. Blocktyp-Label zeigt „Überschrift 2").
- [ ] **Step 3:** Test (Preview): Blocktyp-Menü setzt H2 (`editor.isActive('heading',{level:2})===true`); Aa-Menü setzt Farbe & Größe; nie mehr als 8 sichtbare Top-Level-Elemente (`#bar > *` zählen ≤ 8).
- [ ] **Step 4:** Commit `feat: ruhige Toolbar mit Dropdowns`.

### Task 5: Auswahl-Bubble + Link-Dialog

**Files:** Modify: `app/src/ui.js`, `app/src/style.css`

- [ ] **Step 1:** Eigene Bubble (kein tippy): auf `selectionUpdate`, wenn Auswahl nicht leer & im Editor: `posToDOMRect`-Äquivalent über `editor.view.coordsAtPos(from/to)` → absolut positioniertes Mini-Panel **[B I U S | Größe − + | Link | Farbe]**, 150 ms Fade, verschwindet bei Klick/Collapse.
- [ ] **Step 2:** Link-Dialog: kleines Inline-Popover (URL-Feld, Übernehmen/Entfernen), ⌘K öffnet; `setLink({href})`/`unsetLink`.
- [ ] **Step 3:** Test (Preview): programmatische Auswahl → Bubble sichtbar (`document.querySelector('.bubble').offsetParent!==null`); setLink → `getHTML()` enthält `<a href=`.
- [ ] **Step 4:** Commit `feat: Auswahl-Bubble + Link-Dialog`.

### Task 6: Slash-Menü

**Files:** Modify: `app/src/ui.js`

- [ ] **Step 1:** Implementierung ohne Zusatz-Dependency: `editor.on('update')`-unabhängig; keydown-Listener im Editor: „/" am Absatzanfang (leerer Textblock) → Menü an Caret-Koordinaten (`view.coordsAtPos`). Einträge = Toolbar-Blocktypen + Bild + Trennlinie. Tippen filtert (Eingabe nach „/" wird gepuffert), ↑↓ Enter Esc; Ausführen ersetzt den „/…"-Text (`deleteRange`) und wendet Befehl an.
- [ ] **Step 2:** Test (Preview): „/" tippen (Event simulieren) → Menü offen; „üb" filtert auf Überschriften; Enter erzeugt H1 (`isActive('heading',{level:1})`).
- [ ] **Step 3:** Markdown-Kürzel-Test (kommen aus StarterKit/TaskItem): `insertContent('# ')` … via `view.someProps`? Stattdessen realistisch: `editor.commands.setContent('')` + simulierte Texteingabe über `view.pasteText('# Hallo')`? — Wenn InputRules per Test schwer auslösbar: manueller Check + `chainedCommands`-Abdeckung; im Probe-Lauf `editorOk` reicht.
- [ ] **Step 4:** Commit `feat: Slash-Menü`.

### Task 7: Bilder (nativ als Dateien, Resize)

**Files:** Modify: `app/src/editor.js`, `app/src/ui.js`, `mac/main.swift`, `app/src/style.css`

- [ ] **Step 1 (Swift):** `ImgSchemeHandler: NSObject, WKURLSchemeHandler` — bedient `aiwt-img://img/<datei>` aus `Store.dir/images/`; MIME nach Endung (png/jpeg/gif/webp); 404→leere Antwort. Registrieren: `cfg.setURLSchemeHandler(ImgSchemeHandler(), forURLScheme:"aiwt-img")`.
- [ ] **Step 2 (Swift):** Handler `saveimg`: Body `{"id":"…","ext":"png","dataBase64":"…"}` → Datei `images/<uuid>.<ext>` schreiben → `evaluateJavaScript("__imgSaved__('<id>','aiwt-img://img/<datei>')")`. Fehler → `__imgSaved__('<id>', null)`.
- [ ] **Step 3 (Swift):** Orphan-Cleanup beim Start (nur wenn Daten valide geladen): alle Dateien in `images/`, die nicht als Substring in data.json vorkommen, löschen.
- [ ] **Step 4 (JS):** Paste/Drop-Handler (`editorProps.handlePaste/handleDrop`): Bild-File → FileReader → Base64 → NATIVE: `saveimg` + Promise-Map über `__imgSaved__`; Browser: direkt `data:`-URL. Dann `insertContent({type:'image', attrs:{src, width:'100%'}})`. Image-Extension um `width`-Attr erweitern (`renderHTML style=width:…`).
- [ ] **Step 5 (JS/CSS):** Resize: Klick auf Bild → Auswahl-Rahmen + 2 seitliche Griffe (NodeView-los über Dekoration am `img.ProseMirror-selectednode` + mousedown-Drag setzt `updateAttributes('image',{width:pct+'%'})`, Raster 25–100 %).
- [ ] **Step 6:** Tests: Browser-Preview: fake-Paste (DataTransfer mit PNG-Blob) → `<img src="data:` im HTML; width-Update ändert Attr. Mac: Probe-Erweiterung `imgBridge:true` (saveimg mit 1×1-PNG testen, URL beginnt mit `aiwt-img://`).
- [ ] **Step 7:** Commit `feat: Bilder mit nativer Dateiablage + Resize`.

### Task 8: Suche, Sortieren, Duplizieren, Papierkorb

**Files:** Modify: `app/src/ui.js`, `app/src/style.css`

- [ ] **Step 1:** Seitenleiste: Suchfeld oben (filtert `docs` über `title` + `body`-Text via unsichtbarem `div.innerText`-Strip, case-insensitiv; Treffer-`<mark>` im Listentitel), Sort-Umschalter (zuletzt/A–Z), Hover-„…"-Menü je Eintrag: Duplizieren / In den Papierkorb.
- [ ] **Step 2:** Papierkorb-Sektion (einklappbar, unten): Einträge mit Wiederherstellen / Endgültig löschen (confirm). `delDoc` → `trashed=true, trashedAt=now`. `purgeTrash()` löscht >30 Tage.
- [ ] **Step 3:** Tests (Preview): 3 Docs anlegen → Suche „xyz" filtert; duplizieren erzeugt „… Kopie"; löschen → in Papierkorb (nicht in Hauptliste), wiederherstellen → zurück; endgültig → weg; `purgeTrash` mit gefälschtem `trashedAt` (−31 Tage) entfernt.
- [ ] **Step 4:** Commit `feat: Suche, Duplizieren, Papierkorb`.

### Task 9: Einstellungen, Dark- & Fokus-Modus, Typografie

**Files:** Modify: `app/src/ui.js`, `app/src/style.css`, `app/src/editor.js` (settings)

- [ ] **Step 1:** CSS-Tokens doppelt: `:root` (hell) + `[data-theme="dark"]`-Block (komplette Palette inkl. Editor-Inhalt, Bubble, Menüs). `applyTheme()`: `auto` → `matchMedia('(prefers-color-scheme: dark)')` + Listener.
- [ ] **Step 2:** ⚙-Menü: Erscheinung (Auto/Hell/Dunkel) · Schrift (Serif/Sans) · Größe (16–21) · Zeilenbreite (schmal/mittel/breit) · Rechtschreibung an/aus (`#editor[spellcheck]`) · Fokus-Modus (⌘.) · — Trenner — · Exportieren (.md) · Drucken (⌘P). Werte → `state.settings` → `persist()`; beim Boot anwenden.
- [ ] **Step 3:** Fokus-Modus: `body.focus-mode` → Seitenleiste + Bar ausgeblendet (opacity/translate-Transition), alle Blöcke `opacity:.35` außer Block mit Cursor (`.has-focus`-Dekoration über `onSelectionUpdate`: nächster Block-Node → DOM-Klasse), ⌘. toggelt, Esc beendet.
- [ ] **Step 4:** Tests (Preview): Theme dunkel → `documentElement.dataset.theme==='dark'` + Hintergrundfarbe geprüft via `getComputedStyle`; Settings überleben Reload; Fokus-Modus setzt Klassen.
- [ ] **Step 5:** Commit `feat: Einstellungen, Dark- und Fokus-Modus`.

### Task 10: Drucken/PDF (nativ)

**Files:** Modify: `mac/main.swift`, `app/src/style.css`

- [ ] **Step 1 (Swift):** Menü „Ablage → Drucken …" ⌘P → `let op = webView.printOperation(with: NSPrintInfo.shared)`; `op.showsPrintPanel=true; op.view?.frame = webView.bounds; op.run…` via `op.runModal(for: window, delegate:nil, didRun:nil, contextInfo:nil)`.
- [ ] **Step 2 (CSS):** `@media print`: nur `#page` sichtbar (Seitenleiste/Bar `display:none`), schwarz auf weiß, Zeilenbreite 100 %, Seitenränder via `@page{margin:2cm}`.
- [ ] **Step 3:** Test: manuell (interaktiver Dialog) — in Abschluss-Checkliste für Jakob.
- [ ] **Step 4:** Commit `feat: Drucken/PDF`.

### Task 11: Motion-Polish (Design-Skills konsultieren)

**Files:** Modify: `app/src/style.css`, `app/src/ui.js`

- [ ] **Step 1:** Skill `interaction-design` laden und Empfehlungen auf diese Elemente anwenden (Dauer/Easing-Tokens `--dur:180ms; --ease:cubic-bezier(.25,.6,.3,1)`):
  Scroll-Fade oben/unten am `#scroll` (CSS `mask-image: linear-gradient(transparent, black 48px, black calc(100% - 48px), transparent)`), Dokumentwechsel-Fade (120 ms), Menü/Bubble-Einblendung (Scale .98→1 + Fade), Speicher-Punkt (● grün-Puls beim Sichern → Ruhe), Hover-Zustände, Leerzustände („Noch kein Text — ⌘N beginnt einen neuen."), `@media (prefers-reduced-motion: reduce)` → Transitionen aus.
- [ ] **Step 2:** Sichtprüfung Screenshots hell/dunkel/Fokus (preview_screenshot) — Layout ruhig, keine Sprünge.
- [ ] **Step 3:** Commit `style: Motion & Feinschliff`.

### Task 12: Browser-Automationstestrunde (komplett)

- [ ] **Step 1:** Auf Preview (4600) der Reihe nach als `preview_eval`-Skripte: Kern-Roundtrip inkl. Checkliste+Farbe+Größe nach Reload · Slash → H1 · Toolbar-Menüs · Bubble · Suche/Duplizieren/Papierkorb-Zyklus · Theme/Settings-Persistenz · Fokus-Modus · Konsole fehlerfrei (`preview_console_logs level=error` leer).
Expected: alle Checks true, keine Konsolen-Fehler.
- [ ] **Step 2:** Gefundene Fehler sofort fixen, Schritt wiederholen bis grün. Commit `test: Browser-Runde grün`.

### Task 13: Mac-Build + native Testrunde

**Files:** Modify: `mac/build.sh` (vor Kopieren: `(cd ../app && npm install --silent && npm run build)`; kopiert `index.html`, `src/style.css` → `Resources/src/style.css`, `dist/editor.bundle.js` → `Resources/dist/…`), `mac/main.swift` (Probe sendet zusätzlich `editorOk`, `imgBridge`)

- [ ] **Step 1:** build.sh anpassen (Pfade beibehalten: HTML referenziert `src/style.css` + `dist/editor.bundle.js` relativ — Ordnerstruktur in Resources spiegeln).
- [ ] **Step 2:** `./mac/build.sh` → BUILD OK.
- [ ] **Step 3:** `--selftest` → SELFTEST OK (11 Checks, unverändert).
- [ ] **Step 4:** Probes frisch/vorhanden/kaputt (wie v1, mit `AIWT_DATA_DIR`), jetzt zusätzlich `"editorOk":true,"imgBridge":true`; Neustart-Probe: neue Formate (Checkliste/Farbe) in Daten vorbelegen → nach Lauf unversehrt.
- [ ] **Step 5:** Echter Start via `open`, 6 s stabil, Signatur/Icon/plist ok.
- [ ] **Step 6:** Commit `feat: App-Build v2 + native Tests grün`.

### Task 14: Abschluss

- [ ] **Step 1:** Migrationstest mit Kopie der echten Nutzerdaten: `cp "~/Library/Application Support/Schreibwerkzeug/data.json" /tmp/mig/` → Probe mit `AIWT_DATA_DIR=/tmp/mig` → docCount/Titel unversehrt.
- [ ] **Step 2:** Manuelle Checkliste an Jakob: Tippgefühl, Bild einfügen + ziehen, ⌘P-Druck, Dark/Fokus.
- [ ] **Step 3:** Commit `release: professioneller Editor v2` + kurze Notiz in `docs/superpowers/specs/…-design.md` („Umgesetzt am …").

---

## Self-Review (durchgeführt)

- **Spec-Abdeckung:** Fundament→T1–2 · Formatieren (Notion+Word, ruhige Leiste)→T3–6 · Bilder→T7 · Verwaltung→T8 · Komfort→T9–10 · Motion→T11 · Tests→T12–13 · Migration→T2/T14. Druck-Test nur manuell (interaktiv) — im Plan ausgewiesen. Keine Lücken.
- **Platzhalter:** Task 6 Step 3 präzisiert (InputRules schwer automatisierbar → manueller Check ausgewiesen, kein „TBD").
- **Konsistenz:** Bridge-Namen (`store/saveimg/__imgSaved__`), Datenformat, Pfade (`Resources/src|dist`) in T1/T2/T7/T13 identisch verwendet.
