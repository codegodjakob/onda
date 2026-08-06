# Onda Figma Product File Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a complete, monochrome Figma design file for the productive Onda application, including 29 dedicated annotation pages, multi-state dialogs, responsive references, and a clickable primary workflow.

**Architecture:** Create one new Figma Design file and build it top-down: page skeleton, variables and styles, local component library, product views, annotation families, dialogs, responsive references, and prototype links. Every major page uses one top-level wrapper frame, Auto Layout, local component instances, and a named coverage section; all work is validated structurally and visually before the next dependent task begins.

**Tech Stack:** Figma Design, Figma Plugin API through `use_figma`, Figma variables, local components and variants, Auto Layout, prototype reactions, ABC Diatype, productive Onda source under `app/`, and existing browser screenshots under `app/evals/results/screenshots/`.

## Global Constraints

- The productive code under `app/` is the source of truth for scope, copy, state, and behavior.
- The design file is named `Onda · Produktdesign` and is created as a Figma Design file.
- All visible paints are neutral grayscale values; solid RGB colors must satisfy `r === g && g === b` within a tolerance of `0.002`.
- Base surfaces and lists use 0 px radius; controls use 4 px; larger static surfaces use at most 6 px; overlays use 8 px; only true circles use full radius.
- ABC Diatype is the only intended font family, using 12, 15, 21, and 40 px at weights 400, 500, and 700.
- If ABC Diatype is unavailable in Figma, the implementation records the exact font result and uses a clearly named temporary system fallback instead of silently claiming a match.
- Important hit targets are at least 44 × 44 px.
- Shadows are limited to real overlays; base surfaces, lists, and static cards remain flat.
- The Aura is monochrome and appears only where the productive UI communicates AI presence.
- Repeated UI is built once as a local component and placed as instances.
- Every container with related children uses Auto Layout.
- Each mutating `use_figma` call returns every created or mutated node ID.
- Each `use_figma` call changes at most ten logical nodes or one coherent repeated family and switches pages at most once.
- Every completed task writes a Figma version-history checkpoint and updates the local evidence ledger.
- No productive application code, data model, or Design System download files are modified.

## File Structure

**Figma artifact:**

- Create: `Onda · Produktdesign` in the user's selected Figma plan
- Create pages: `00 · Übersicht`, `01 · Foundations`, `02 · Komponenten`, `03 · Bibliothek`, `04 · Editor`, all `05.01`–`05.24` annotation pages, all `06.01`–`06.05` note pages, `07 · Agent & Quellen`, `08 · Dialoge`, `09 · Menüs & Nebenansichten`, `10 · Responsive & Dark`, and `11 · Prototyp`

**Local evidence:**

- Create: `docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md` — file URL, page/frame IDs, per-task checks, visual scores, and unresolved deviations
- Create: `docs/superpowers/evidence/2026-08-06-onda-figma/eval.md` — iteration-by-iteration rubric and final hard-gate results
- Read: `docs/superpowers/specs/2026-08-06-onda-figma-produktdatei-design.md`
- Read: `app/src/annotation-contract.mjs`
- Read: `app/src/onda-tokens.css`
- Read: `app/index.html`
- Read: `app/src/workspace.js`
- Read: `app/src/*-ui.mjs`
- Read: `app/evals/results/screenshots/*.png`

## Spec Coverage Map

| Acceptance criterion | Implemented by | Fresh evidence |
|---|---|---|
| AC-1 · Vollständige Abdeckung | Tasks 3, 5–14 | exact page/frame inventory in Task 15 |
| AC-2 · Monochromes System | Tasks 3–14 | paint traversal and screenshots in Task 15 |
| AC-3 · Kantiges Formsystem | Tasks 3–14 | radius/effect traversal in Task 15 |
| AC-4 · Komponenten und Auto Layout | Task 4 and all composed-page tasks | component, instance, and layout metadata in Task 15 |
| AC-5 · Anmerkungszustände | Tasks 6–10 | 29-page fan-out audit and screenshots |
| AC-6 · Dialogzustände | Task 12 | seven-row metadata and detail screenshots |
| AC-7 · Responsive Erreichbarkeit | Tasks 6–13 | frame-bound checks at 1440/1024/720/320 |
| AC-8 · Monochromer Dark Mode | Tasks 3 and 13 | explicit-mode metadata and paired screenshots |
| AC-9 · Fehler und Wiederherstellung | Tasks 5–13 | named error states and prototype destinations |
| AC-10 · Bedienbarkeit | Tasks 4, 12, and 13 | hit-target, focus-state, and long-content checks |
| AC-11 · Klickbarer Hauptablauf | Task 14 | reaction/destination graph |
| AC-12 · Visuelle Qualität | Task 15 | rubric scores across at most three iterations |

---

### Task 1: Create the Figma file and evidence ledger

**Files:**

- Create: Figma file `Onda · Produktdesign`
- Create: `docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md`

**Interfaces:**

- Consumes: the approved design specification
- Produces: `fileKeyFromTask1`, `fileUrlFromTask1`, selected Figma plan key, and the evidence ledger used by every later task

- [ ] **Step 1: Resolve the Figma plan**

Call `whoami`. If one plan is returned, select its exact `key`. If several are returned, pause and ask the user which named plan to use; do not guess.

- [ ] **Step 2: Create the blank Design file**

Call `create_new_file` with the selected plan key, `fileName: "Onda · Produktdesign"`, and `editorType: "design"`. Record the exact returned `file_key` as `fileKeyFromTask1` and `file_url` as `fileUrlFromTask1`.

- [ ] **Step 3: Verify the blank-file baseline**

Run a read-only `use_figma` call against `fileKeyFromTask1`:

```js
return {
  editorType: figma.editorType,
  fileKey: figma.fileKey,
  pages: figma.root.children.map(page => ({ id: page.id, name: page.name, children: page.children.length })),
}
```

Expected: `editorType` is `figma`; no required Onda page exists yet. This is the failing structural baseline.

- [ ] **Step 4: Create the evidence ledger**

Create `coverage.md` with the exact file URL, file key, selected plan name, the 39 required Figma page names, and unchecked rows for AC-1 through AC-12. Include a section called `Abweichungen` initialized with `Keine erfasst.`

- [ ] **Step 5: Save a Figma version checkpoint**

Run:

```js
const result = await figma.saveVersionHistoryAsync(
  "00 · Datei angelegt",
  "Leere Onda-Produktdatei vor Seiten- und Komponentenaufbau"
)
return { versionId: result.id }
```

Expected: one version ID is returned.

### Task 2: Complete Figma and design-system discovery

**Files:**

- Modify: `docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md`
- Read: `app/`, `design-system/`, and the target Figma file

**Interfaces:**

- Consumes: `fileKeyFromTask1`
- Produces: `fontDecision`, `componentDiscoveryDecision`, and exact source/reference inventory for later tasks

- [ ] **Step 1: Prove whether Code Connect mappings exist**

Run:

```bash
rg --files app design-system | rg '\.figma\.(ts|tsx|js)$|\.swift$|\.kt$'
```

Expected: no Onda Code Connect file is returned. Record `Code Connect: keine Zuordnung vorhanden` in the ledger.

- [ ] **Step 2: Record the existing-screen discovery result**

The target is a newly created blank file, so record `Bestehende Figma-Screens: nicht anwendbar — neue leere Datei`. Do not claim that the absence of local variables means no library variables exist.

- [ ] **Step 3: Inspect available Figma libraries**

Call `get_libraries` for `fileKeyFromTask1`. Record every library already added and every organization library whose name contains `Onda`. If none exists, set `componentDiscoveryDecision` to `Lokale Onda-Komponenten aus produktivem Code erstellen`.

- [ ] **Step 4: Search library components only after Steps 1–3**

If an Onda library is visible, call `search_design_system` for `button`, `input`, `dialog`, `annotation`, `navigation`, and `aura`, scoped to its library key. If no Onda library exists, record that `search_design_system` is not a source for Onda component keys and continue with local components.

- [ ] **Step 5: Verify available fonts**

Run:

```js
const fonts = await figma.listAvailableFontsAsync()
const ondaFonts = fonts
  .filter(item => /ABC Diatype|Diatype/i.test(item.fontName.family))
  .map(item => item.fontName)
return { ondaFonts, count: ondaFonts.length }
```

Expected: ABC Diatype styles are listed, or `count: 0`. Set `fontDecision` to the exact available family/style names; if zero, record the explicit fallback deviation before any text nodes are created.

- [ ] **Step 6: Inventory source views and reference screenshots**

Run:

```bash
rg -n "open(?:Onda)?Dialog|id: '(?:memory|argument|language|audit)Modal'|id=\"(?:home|editorView|agentWidget|evidenceWindow)\"" app/src app/index.html
rg --files app/evals/results/screenshots | sort
```

Expected: seven dialog groups plus library, editor, agent, evidence, and the current screenshot set. Add the exact source locations to the ledger.

### Task 3: Create pages, variables, styles, and Foundations specimens

**Files:**

- Create: all required Figma pages
- Build: `01 · Foundations`
- Modify: `docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md`

**Interfaces:**

- Consumes: `fileKeyFromTask1`, `fontDecision`
- Produces: `pageIds`, `colorVariableIds`, `numberVariableIds`, `textStyleIds`, and the shared grayscale design foundation

- [ ] **Step 1: Run the missing-pages baseline**

```js
const required = [
  "00 · Übersicht", "01 · Foundations", "02 · Komponenten", "03 · Bibliothek", "04 · Editor",
  "05.01 · Rechtschreibung", "05.02 · Grammatik", "05.03 · Zeichensetzung", "05.04 · Wortwahl",
  "05.05 · Satzstil", "05.06 · Absatzstil", "05.07 · Straffen", "05.08 · Wiederholung",
  "05.09 · Ton & Register", "05.10 · Stilmittel", "05.11 · Anglizismus", "05.12 · Terminologie",
  "05.13 · Verschieben", "05.14 · Übergang", "05.15 · Gliederung", "05.16 · Textfluss",
  "05.17 · Roter Faden", "05.18 · Überschrift", "05.19 · Anmerkung", "05.20 · Beleg fehlt",
  "05.21 · Faktencheck", "05.22 · Widerspruch", "05.23 · Gegenargument fehlt", "05.24 · Verständlichkeit",
  "06.01 · Ausformulieren", "06.02 · Gehört zusammen", "06.03 · Nachfrage", "06.04 · Reihenfolge",
  "06.05 · Offener Faden", "07 · Agent & Quellen", "08 · Dialoge", "09 · Menüs & Nebenansichten",
  "10 · Responsive & Dark", "11 · Prototyp"
]
const existing = new Set(figma.root.children.map(page => page.name))
return { missing: required.filter(name => !existing.has(name)), expected: required.length }
```

Expected: all 39 required names are missing.

- [ ] **Step 2: Create and order the 39 pages**

Create pages in the exact order of the `required` array. Rename the initial blank page to `00 · Übersicht`, then create the remaining pages in four sequential calls containing at most ten `figma.createPage()` operations each. In every call, skip names that already exist, append newly created pages in array order, and return every created page ID. After the fourth call, run the baseline script again; expected: `missing: []` and `expected: 39`.

- [ ] **Step 3: Create grayscale color variables with Light and Dark modes**

Create collection `Onda / Farbe` with modes `Light` and `Dark`. Create scoped COLOR variables for `bg/app`, `bg/surface`, `bg/sunken`, `bg/overlay`, `text/primary`, `text/secondary`, `text/tertiary`, `border/subtle`, `border/default`, `focus`, and `danger/destructive`. Every mode value must use equal RGB channels. Bind scopes narrowly: frame fills for backgrounds, text fills for text, strokes for borders, and eligible fills/strokes for focus and destructive roles.

- [ ] **Step 4: Create numeric variables**

Create collection `Onda / Maße` with one mode. Add spacing variables `space/0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`; radius variables `radius/base=0`, `radius/control=4`, `radius/static=6`, `radius/overlay=8`, `radius/circle=999`; widths `width/reading=680`, `width/sidebar=264`; and heights `height/topbar=56`, `height/target=44`. Set explicit scopes such as `GAP`, `WIDTH_HEIGHT`, and corner radius scopes.

- [ ] **Step 5: Create text and effect styles**

Load the exact fonts from `fontDecision` before any mutation. Create text styles `Display/40/700`, `Title/21/700`, `Body/15/400`, `Label/15/500`, and `Caption/12/400`. Create `Overlay/Shadow` as the only general elevation style; do not create shadows for cards or lists.

- [ ] **Step 6: Build the Foundations wrapper and specimens**

On `01 · Foundations`, create a vertical Auto Layout wrapper named `Foundations / Wrapper`. Add sections for grayscale roles, typography, spacing, radii, overlay shadow, icon rule, Aura rule, and Light/Dark side-by-side samples. Bind all displayed values to the variables/styles created above.

- [ ] **Step 7: Validate foundations**

Run a read-only traversal that returns page count, collections and modes, text styles, effect styles, and all solid paint RGB triples on the Foundations wrapper. Expected: 39 pages; two color modes; five text styles; one overlay effect; zero non-grayscale solid paints; radius specimen values limited to 0, 4, 6, 8, and 999.

- [ ] **Step 8: Screenshot and checkpoint**

Capture the Foundations wrapper and inspect for clipped labels, incorrect font, colored paints, or stray large radii. Save version history as `01 · Foundations` and record IDs/checks in the ledger.

### Task 4: Build the local Onda component library

**Files:**

- Build: `02 · Komponenten`
- Modify: `docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md`

**Interfaces:**

- Consumes: variables and styles from Task 3
- Produces: local component keys/IDs for product pages, annotations, dialogs, agent, and source flows

- [ ] **Step 1: Run the empty-component baseline**

On `02 · Komponenten`, return all `COMPONENT` and `COMPONENT_SET` nodes. Expected: none.

- [ ] **Step 2: Build action components**

Create local components and variants for `Action/Button` (`primary`, `secondary`, `ghost`, `destructive`; default, hover, focus, disabled), `Action/Icon button` (default, hover, focus, disabled), and `Action/Inline link`. Enforce minimum 44 px hit height/width, 4 px radius for non-circular actions, grayscale variable bindings, and explicit text properties.

- [ ] **Step 3: Build input and navigation components**

Create `Input/Text`, `Input/Search`, `Input/Textarea`, `Input/Select`, `Input/Composer`, `Navigation/Item`, `Navigation/Recent item`, `Navigation/Mode switch`, and `Navigation/Review controls`. Expose text and state properties; keep only the mode switch and true icon circles fully round.

- [ ] **Step 4: Build shell and list components**

Create `Shell/Sidebar`, `Shell/Topbar`, `List/Project row`, `List/Document row`, `List/Source row`, `Status/Inline`, `Empty state`, and `Toast/Inline`. Lists remain radius 0 with a single subtle divider and no shadow.

- [ ] **Step 5: Build overlay and annotation primitives**

Create `Overlay/Dialog`, `Overlay/Floating panel`, `Overlay/Popover`, `Annotation/Anchor`, `Annotation/Correction`, `Annotation/Rewrite`, `Annotation/Insertion`, `Annotation/Slot`, `Annotation/Region`, `Annotation/Source`, `Annotation/Compare`, `Annotation/Dialogue`, and `Annotation/Title`. Overlays use 8 px radius and the single overlay shadow style.

- [ ] **Step 6: Build Agent, Aura, and source components**

Create `Agent/Aura` as a monochrome circular gradient, `Agent/Message`, `Agent/Status`, `Agent/Decision row`, `Source/Citation`, `Source/Reader status`, and `Research/Run status`. The Aura component description must state that it is reserved for AI presence.

- [ ] **Step 7: Validate component structure**

Return all components/component sets with names, IDs, variant properties, text properties, bound variables, Auto Layout mode, and dimensions. Expected: every named family exists; every repeated container uses Auto Layout; non-circular components use radii 0, 4, 6, or 8; no static component uses an effect style.

- [ ] **Step 8: Screenshot and checkpoint**

Capture each component section at readable scale. Fix clipped text or inconsistent spacing before saving version history as `02 · Komponenten`.

### Task 5: Build Bibliothek and Editor core pages

**Files:**

- Build: `03 · Bibliothek`
- Build: `04 · Editor`
- Modify: `docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md`

**Interfaces:**

- Consumes: shell, navigation, action, input, list, and annotation instances from Task 4
- Produces: the shared desktop product shell and core frames reused by later pages

- [ ] **Step 1: Build Bibliothek wrapper and desktop views**

Create `Bibliothek / Wrapper` first. Add 1440 × 1000 frames for projects, documents, paper bin, active search, sorted list, empty project, empty documents, and recoverable load/save failure. Use component instances and production copy from `app/src/ui.js` and current screenshots.

- [ ] **Step 2: Validate Bibliothek**

Return each view frame name, size, instance count, Auto Layout structure, paints, radii, and text families. Expected: all eight views exist; no colored paint; no list/card shadow; no radius above 8 except true circles.

- [ ] **Step 3: Build Editor wrapper and desktop views**

Create `Editor / Wrapper` first. Add 1440 × 1000 frames for text mode, note mode, quiet annotations, collapsed sidebar, focus mode, save-in-progress, saved, recoverable save error, and editor without an active local annotation. Preserve the productive layout hierarchy: sidebar, topbar, review bar, reading column, local annotation layer, and agent/evidence layer positions.

- [ ] **Step 4: Validate Editor**

Expected: nine named views; text remains the strongest hierarchy; base surfaces are flat; review controls use instances; save error exposes a recovery action; no content is clipped at 1440 × 1000.

- [ ] **Step 5: Screenshot and checkpoint**

Capture every Bibliothek and Editor frame. Compare the primary library and editor frames with `onda-library-1280.png` and `onda-editor-1440.png`, allowing the approved monochrome and smaller-radius changes. Save version history as `03–04 · Kernansichten`.

### Task 6: Build correction annotation pages

**Files:**

- Build: `05.01 · Rechtschreibung`, `05.02 · Grammatik`, `05.03 · Zeichensetzung`, `05.04 · Wortwahl`, `05.11 · Anglizismus`
- Modify: evidence ledger

**Interfaces:**

- Consumes: Editor core, correction, action, rejection, and status components
- Produces: five complete dedicated correction pages

- [ ] **Step 1: Run the correction-page baseline**

```js
const names = ["05.01 · Rechtschreibung", "05.02 · Grammatik", "05.03 · Zeichensetzung", "05.04 · Wortwahl", "05.11 · Anglizismus"]
return names.map(name => {
  const page = figma.root.children.find(item => item.name === name)
  return { name, wrapperCount: page ? page.children.filter(node => /Wrapper$/.test(node.name)).length : -1 }
})
```

Expected: every `wrapperCount` is `0`.

- [ ] **Step 2: Build one wrapper per correction page**

Use one mutating call per page. Create top-level vertical wrappers named `05.01 · Rechtschreibung / Wrapper`, `05.02 · Grammatik / Wrapper`, `05.03 · Zeichensetzung / Wrapper`, `05.04 · Wortwahl / Wrapper`, and `05.11 · Anglizismus / Wrapper`. Add frames for anchor-only, expanded correction, accepted result with undo, rejection scope choice, own-version editing where available, recoverable local error, 320 px layout, and Dark reference. Use the kind's exact label, priority, scope, and operation from `annotation-contract.mjs`.

- [ ] **Step 3: Validate the five pages**

Expected: one wrapper per page; required state names exist; each page uses `Annotation/Correction` instances; 320 px frames have no node extending beyond width; all solid paints are grayscale.

- [ ] **Step 4: Screenshot and checkpoint**

Capture each page wrapper plus each 320 px frame. Save version history as `05A · Korrekturen` and mark the five coverage rows complete.

### Task 7: Build rewrite annotation pages

**Files:**

- Build: `05.05 · Satzstil`, `05.06 · Absatzstil`, `05.07 · Straffen`, `05.16 · Textfluss`, `05.17 · Roter Faden`, `06.01 · Ausformulieren`
- Modify: evidence ledger

**Interfaces:**

- Consumes: Editor core and `Annotation/Rewrite`
- Produces: six complete rewrite pages

- [ ] **Step 1: Run the rewrite-page baseline**

```js
const names = ["05.05 · Satzstil", "05.06 · Absatzstil", "05.07 · Straffen", "05.16 · Textfluss", "05.17 · Roter Faden", "06.01 · Ausformulieren"]
return names.map(name => ({ name, childCount: figma.root.children.find(page => page.name === name)?.children.length ?? -1 }))
```

Expected: every `childCount` is `0`.

- [ ] **Step 2: Build rewrite states**

Create one wrapper per page with anchor-only, expanded before/after diff, accepted result and undo, rejection scope choice, own-version path when productive, long-content wrapping, recoverable error, 320 px, and Dark reference. `Roter Faden` must not invent an automatic replacement when the productive contract has no operation.

- [ ] **Step 3: Validate and screenshot**

Expected: six wrappers; diffs show old/new meaning without color; long text wraps without clipping; all repeated UI is instanced. Capture wrappers and 320 px frames.

- [ ] **Step 4: Save checkpoint**

Save version history as `05B–06A · Umschreibungen` and update six ledger rows.

### Task 8: Build insertion and slot annotation pages

**Files:**

- Build: `05.10 · Stilmittel`, `05.13 · Verschieben`, `05.14 · Übergang`, `05.15 · Gliederung`, `05.24 · Verständlichkeit`, `06.02 · Gehört zusammen`, `06.04 · Reihenfolge`
- Modify: evidence ledger

**Interfaces:**

- Consumes: insertion, slot, editor, and action components
- Produces: seven dedicated insertion/placement pages

- [ ] **Step 1: Run the insertion/slot baseline**

```js
const names = ["05.10 · Stilmittel", "05.13 · Verschieben", "05.14 · Übergang", "05.15 · Gliederung", "05.24 · Verständlichkeit", "06.02 · Gehört zusammen", "06.04 · Reihenfolge"]
return names.map(name => ({ name, children: figma.root.children.find(page => page.name === name)?.children.length ?? -1 }))
```

Expected: every `children` value is `0`.

- [ ] **Step 2: Build insertion and slot states**

Insertion pages show exact insertion marker, expanded content, accept/reject/undo, long insertion, error, 320 px, and Dark. Slot pages show source location, destination slot, valid move, invalid/stale destination recovery, reject/undo, 320 px, and Dark. Use text and line pattern rather than color to distinguish source and destination.

- [ ] **Step 3: Validate and screenshot**

Expected: seven wrappers; insertion markers stay attached to exact passages; slot source and destination remain distinguishable in grayscale; no 320 px overflow.

- [ ] **Step 4: Save checkpoint**

Save version history as `05C–06B · Einfügen und Ordnen` and update seven ledger rows.

### Task 9: Build region, source, and comparison annotation pages

**Files:**

- Build: `05.08 · Wiederholung`, `05.09 · Ton & Register`, `05.12 · Terminologie`, `05.20 · Beleg fehlt`, `05.21 · Faktencheck`, `05.22 · Widerspruch`
- Modify: evidence ledger

**Interfaces:**

- Consumes: region, source, compare, evidence, and action components
- Produces: six dedicated multi-location/evidence pages

- [ ] **Step 1: Run the multi-location baseline**

```js
const names = ["05.08 · Wiederholung", "05.09 · Ton & Register", "05.12 · Terminologie", "05.20 · Beleg fehlt", "05.21 · Faktencheck", "05.22 · Widerspruch"]
return names.map(name => ({ name, children: figma.root.children.find(page => page.name === name)?.children.length ?? -1 }))
```

Expected: every `children` value is `0`.

- [ ] **Step 2: Build region and comparison states**

Region pages show multiple anchored passages, collection card, accept-many, partial/stale-location error, rejection scope, undo, 320 px, and Dark. Comparison pages show side-by-side or stacked references with explicit labels and typographic differences instead of color.

- [ ] **Step 3: Build source states**

`Beleg fehlt` and `Faktencheck` show verified source, unverified source with disabled copy/accept, missing exact passage, corrected source needing review, conscious integrity-risk confirmation where productive, rejection, undo, 320 px, and Dark.

- [ ] **Step 4: Validate and screenshot**

Expected: six wrappers; multiple passages remain traceable; verification state is not color-only; disabled actions include explanatory copy; no clipping in long source excerpts.

- [ ] **Step 5: Save checkpoint**

Save version history as `05D · Bereiche und Belege` and update six ledger rows.

### Task 10: Build dialogue and title annotation pages

**Files:**

- Build: `05.18 · Überschrift`, `05.19 · Anmerkung`, `05.23 · Gegenargument fehlt`, `06.03 · Nachfrage`, `06.05 · Offener Faden`
- Modify: evidence ledger

**Interfaces:**

- Consumes: title correction, dialogue, composer, agent message, and status components
- Produces: five dedicated title/dialogue pages and completes all 29 annotation pages

- [ ] **Step 1: Run the final annotation baseline**

```js
const names = ["05.18 · Überschrift", "05.19 · Anmerkung", "05.23 · Gegenargument fehlt", "06.03 · Nachfrage", "06.05 · Offener Faden"]
return names.map(name => ({ name, children: figma.root.children.find(page => page.name === name)?.children.length ?? -1 }))
```

Expected: every `children` value is `0`.

- [ ] **Step 2: Build title states**

Create anchor-only, open title correction, accepted title, rejection scope, own title, undo, stale-title error, 320 px, and Dark states on `05.18 · Überschrift`.

- [ ] **Step 3: Build dialogue states**

For the four dialogue pages, create prompt-only, open thread, composing, running/disabled send, streamed response, offline with setup action, interrupted run with retry, accepted follow-up where productive, 320 px, and Dark frames.

- [ ] **Step 4: Validate all 29 annotation pages**

Run one page-list call followed by one read-only `use_figma` call per annotation page in parallel. Expected: 29 pages; one wrapper per page; no missing required states; no wrapper contains non-grayscale solid paints, unexpected radii, free copies of repeated controls, or text outside frame bounds.

- [ ] **Step 5: Screenshot and checkpoint**

Capture the five new wrappers and any failed detail from the 29-page audit. Save version history as `05–06 · Alle Anmerkungsarten` and mark AC-5 structurally complete.

### Task 11: Build Agent & Quellen

**Files:**

- Build: `07 · Agent & Quellen`
- Modify: evidence ledger

**Interfaces:**

- Consumes: Agent, Aura, source, research, overlay, and action components
- Produces: all agent/evidence/source-library/research side views

- [ ] **Step 1: Build the Agent row**

Create frames for closed Aura entry, empty conversation, idle thread, running response, offline/setup, interrupted/retry, initiative message, decision history collapsed/expanded, and unplaced findings. Use the productive copy and behavior from `workspace.js` and `agent-status.mjs`.

- [ ] **Step 2: Build the Evidence row**

Create frames for exact verified claim, demo/unverified claim, missing exact claim, no sources, copied citation confirmation, and long source excerpt. Copy/accept actions must be disabled where the productive code disables them.

- [ ] **Step 3: Build source and research side views**

Create source list, import, import validation error, verified reader, unverified reader, research plan, running, paused, review-ready, mixed evidence, failed, and completed states.

- [ ] **Step 4: Validate, screenshot, and checkpoint**

Expected: every named state exists; Aura appears only in Agent frames; verification and failure are not color-only; long excerpts scroll or wrap. Save version history as `07 · Agent und Quellen`.

### Task 12: Build multi-state dialogs

**Files:**

- Build: `08 · Dialoge`
- Modify: evidence ledger

**Interfaces:**

- Consumes: Dialog, input, action, status, memory, argument, language, audit, source, and research components
- Produces: seven dialog rows with the state coverage approved in the spec

- [ ] **Step 1: Create the Dialoge wrapper and row skeletons**

Create `Dialoge / Wrapper` first, then rows named `Projektverständnis`, `Quellen im Projekt`, `KI-Anschluss`, `Projektgedächtnis`, `Argumentationsdossier`, `Sprache und Wirkung`, and `Schlussaudit & Export`. Each row uses horizontal Auto Layout and explicit state labels.

- [ ] **Step 2: Fill Projektverständnis and Quellen rows**

Build empty, filled, protected correction, active interview, and recoverable offline states for Projektverständnis. Build empty, source list, import, validation error, verified reader, unverified/review-required reader, and research planned/running/paused/review-ready/failed variants for Quellen.

- [ ] **Step 3: Fill KI-Anschluss and Gedächtnis rows**

Build checking, key missing, ready, connection error, budget normal/reached/one-run-released for KI-Anschluss. Build disabled, empty, populated, pending consent, export, delete confirmation, rebuild, and error for Gedächtnis.

- [ ] **Step 4: Fill Argumentation and Sprache rows**

Build unchecked, running, dossier, classify claim, stale/recheck, and error for Argumentation. Build baseline, profile, analysis, effect comparison, correction/recheck, and error for Sprache und Wirkung.

- [ ] **Step 5: Fill Schlussaudit row**

Build blocked by findings, integrity-risk confirmation, risks accepted, ready, export format selection, data control, and local-data deletion confirmation.

- [ ] **Step 6: Validate dialog semantics**

Expected: seven rows; every dialog is an `Overlay/Dialog` instance or contains one; every surface uses 8 px radius and overlay shadow; every long state preserves close and primary action; destructive actions use explicit text and icon rather than color.

- [ ] **Step 7: Screenshot and checkpoint**

Capture every dialog row plus individual screenshots of the longest variants. Save version history as `08 · Dialogzustände` and mark AC-6 complete.

### Task 13: Build menus, responsive references, and Dark references

**Files:**

- Build: `09 · Menüs & Nebenansichten`
- Build: `10 · Responsive & Dark`
- Modify: evidence ledger

**Interfaces:**

- Consumes: core pages and all component families
- Produces: menu/popover states and width/theme verification frames

- [ ] **Step 1: Build menus and secondary views**

Create settings menu, link popover, slash menu, block insertion menu, collapsed/expanded source reader, and research overview/plan/run/review views. Include keyboard focus, empty, and recoverable-error variants where productive.

- [ ] **Step 2: Build responsive library references**

Create Bibliothek at 1440, 1024, 720, and 320 px for primary and empty/error states. Ensure navigation collapses or hides according to current productive behavior and no frame has horizontal overflow.

- [ ] **Step 3: Build responsive editor references**

Create Editor at 1440, 1024, 720, and 320 px with active correction; add 320 px agent and dialog states; add a 200 percent zoom simulation using the 720/320 layouts and enlarged text/targets where required by the source behavior.

- [ ] **Step 4: Build Dark references**

Apply the `Dark` variable mode to library, editor, agent, evidence, one correction, one insertion, one comparison, and one long dialog frame. Do not duplicate every product frame when the variable mode yields the same structure; document the representative mapping in the ledger.

- [ ] **Step 5: Validate and screenshot**

Expected: named width frames exist; no descendant exceeds wrapper width; Dark surfaces remain grayscale; focus and hierarchy remain visible; all primary actions remain reachable. Save version history as `09–10 · Nebenansichten und responsive`.

### Task 14: Build Übersicht and clickable prototype

**Files:**

- Build: `00 · Übersicht`
- Build: `11 · Prototyp`
- Modify: evidence ledger

**Interfaces:**

- Consumes: every completed product page and its frame IDs
- Produces: visual coverage matrix, navigation map, and the clickable primary/user-support flows

- [ ] **Step 1: Build the overview page**

Create sections for file purpose, source priority, grayscale/radius rules, page index, 29-kind matrix, seven-dialog matrix, responsive mapping, and legend. Each matrix entry links to or names the exact destination page/frame.

- [ ] **Step 2: Build the primary prototype flow**

Duplicate only the necessary componentized instances into `11 · Prototyp` and add reactions for: Bibliothek → Projekt → Dokument → active annotation → accept → undo → Schlussaudit → export format → export completion.

- [ ] **Step 3: Build supporting prototype flows**

Add reactions for Projektverständnis → Gedächtnis/Argumentation/Sprache → Editor; Quellen → Import → Research plan → running → review-ready → accepted source; Aura → Agent thread → response → evidence window.

- [ ] **Step 4: Validate prototype reactions**

Return every frame in `11 · Prototyp` with reaction count and destination IDs. Expected: each start frame has a reachable next step; the primary path ends at export completion; error paths reach retry/setup/cancel instead of a dead frame.

- [ ] **Step 5: Screenshot and checkpoint**

Capture Übersicht and a compact prototype-flow map. Save version history as `11 · Übersicht und Prototyp` and mark AC-11 structurally complete.

### Task 15: Run the evaluation loop and final verification

**Files:**

- Create: `docs/superpowers/evidence/2026-08-06-onda-figma/eval.md`
- Modify: `docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md`
- Verify: the complete Figma file

**Interfaces:**

- Consumes: all page/frame/component IDs and screenshots
- Produces: final evidence for AC-1 through AC-12 and the user-facing Figma URL

- [ ] **Step 1: Run structural hard-gate checks**

Fan out one read-only `use_figma` call per page. Aggregate: exact page names/count, one wrapper per content page, components and instances, Auto Layout usage, variable bindings, solid paint RGB values, corner radii, effects, text families/sizes, frame bounds, hit-target sizes, and prototype reactions.

Expected hard gates:

```text
pages = 39
annotation pages = 29
dialog rows = 7
non-grayscale solid paints = 0
unexpected non-circular radii = 0
static nodes with shadows = 0
text sizes outside 12/15/21/40 = 0
important targets below 44×44 = 0
missing primary prototype links = 0
```

- [ ] **Step 2: Assert the font family**

Read every free-standing text node and return distinct font families/styles. Expected: only the exact ABC Diatype family/styles from `fontDecision`; if the documented fallback was necessary, report it as an unmet typography criterion rather than converting it into a pass.

- [ ] **Step 3: Run visual evaluation iteration 1**

Score 1–5 for completeness, hierarchy, consistency, readability, and state clarity using full-page and detail screenshots. Record the score, failed frames, and exact corrective actions in `eval.md`.

- [ ] **Step 4: Apply targeted corrections and re-evaluate**

Fix only failed frames or shared components. Re-run structural checks and screenshots. Stop early when every hard gate passes and every dimension is at least 4.5/5; otherwise run at most two additional total iterations. Stop if a further iteration produces no score improvement and report remaining gaps.

- [ ] **Step 5: Verify every acceptance criterion**

Compare fresh structural and visual evidence with AC-1 through AC-12 in the approved spec. Mark each criterion `PASS` or `FAIL` with node IDs, screenshot references, and measured results. Do not infer a pass from another criterion.

- [ ] **Step 6: Save the final Figma version**

```js
const result = await figma.saveVersionHistoryAsync(
  "Onda · Produktdesign — verifizierter Stand",
  "39 Seiten, 29 Anmerkungsarten, Dialogzustände, responsive Referenzen und Prototyp"
)
return { versionId: result.id }
```

Expected: one final version ID.

- [ ] **Step 7: Commit evidence files**

Run:

```bash
git add docs/superpowers/evidence/2026-08-06-onda-figma/coverage.md docs/superpowers/evidence/2026-08-06-onda-figma/eval.md
git diff --cached --check
git commit -m "docs(evidence): Onda-Figma-Abnahme dokumentieren"
```

Expected: `git diff --cached --check` exits 0 and the commit contains only the two evidence files.
