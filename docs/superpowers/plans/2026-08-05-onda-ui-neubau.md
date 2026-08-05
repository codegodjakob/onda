# Onda UI-Neubau Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die gesamte Onda-Oberfläche auf das mitgelieferte Design System umstellen und alle 24 Text- sowie fünf Notizanwendungsfälle semantisch passend, sicher und zugänglich darstellen.

**Architecture:** Die bestehenden Fachmodelle, Tiptap, Persistenz und Native-Brücken bleiben erhalten. Eine neue modulare ES-Präsentationsschicht normalisiert Findings, löst sie deterministisch in Onda-Darstellungsformen auf und führt ausschließlich vorab verifizierte, umkehrbare Textoperationen aus. `workspace.js` bleibt während der Migration Orchestrator, verliert aber Anmerkungs-, Navigations- und Shell-Verantwortung an fokussierte Module.

**Tech Stack:** JavaScript ES modules, Tiptap 2, ProseMirror, esbuild, Node test runner, Playwright, axe-core, Swift/WKWebView, CSS Custom Properties.

## Global Constraints

- Verbindliche Spezifikation: `docs/superpowers/specs/2026-08-05-onda-ui-neubau-design.md`.
- Verbindliche Designquelle: `/Users/jakobschlenker/Downloads/Onda Design System/`.
- Ausschließlich ABC Diatype; Größen 12, 15, 21 und 40 Pixel; Gewichte 400, 500 und 700.
- Ein Akzent Sky `#8db2c9`; Rot ausschließlich für Fehler und destruktive Aktionen.
- Bedienelemente pillenförmig, Flächen 24 Pixel Radius, Fokus als weicher Halo.
- Der echte API-Schlüssel verbleibt im macOS-Schlüsselbund und darf nie gelesen oder protokolliert werden.
- Bestehende Projekte und Findings bleiben tolerant lesbar.
- Keine Textmutation ohne bewusste Annahme und erneute Ankerprüfung.
- Jede Mutation ist rückgängig zu machen.
- TDD: jeder Produktionsschritt beginnt mit einem beobachtbar roten Test.
- Agentic-Eval: höchstens fünf Runden, Zielwert mindestens 4,6/5, alle harten Gates grün.

---

## File Map

### Neue Dateien

- `app/src/annotation-contract.mjs` — einzige Quelle für Arten, Kategorien, Prioritäten, Formen, Modi und Legacy-Normalisierung.
- `app/src/annotation-operations.mjs` — reine Planung, Validierung und Umkehrdaten aller erlaubten Textoperationen.
- `app/src/annotation-components.mjs` — DOM-Komponenten für Mark, Correction, Rewrite, Insertion, Slot, Region, Annotation und Dialog.
- `app/src/annotation-controller.mjs` — aktive Anmerkung, Navigation, Zusammenfassung, stiller Modus, Sammelannahme und Rückgängig.
- `app/src/onda-icons.mjs` — zentrale Lucide-kompatible SVG-Symbole mit `stroke-width="1.75"`.
- `app/src/onda-shell.mjs` — semantische Shell-Zustände und DOM-Helfer für Bibliothek, Schreiben und schmale Viewports.
- `app/src/annotation-lab.mjs` — vollständige Fixture-Galerie der 29 Anwendungsfälle.
- `app/annotation-lab.html` — visuelle, nicht persistierende Prüfansicht.
- `app/src/onda-tokens.css` — wortgetreue, app-taugliche Tokenquelle aus dem Design System.
- `app/src/onda-shell.css` — Shell, Bibliothek, Schreibseite und responsive Layouts.
- `app/src/onda-annotations.css` — sämtliche Anmerkungsformen und Zustände.
- `app/test/annotation-contract.test.mjs` — Taxonomie, Resolver und Migration.
- `app/test/annotation-operations.test.mjs` — Operationen, Mehrdeutigkeit und Umkehrdaten.
- `app/test/annotation-controller.test.mjs` — Reihenfolge, Zähler, still, Sammelannahme und Undo.
- `app/test/annotation-schema.test.mjs` — Modellvertrag für Text- und Notizmodus.
- `app/test/onda-design-contract.test.mjs` — verbotene Tokens, Schriftgrößen, Gewichte, Farben, Radien und Symbolregeln.
- `app/test/onda-ui-smoke.mjs` — Browserfluss für alle Darstellungsfamilien, Responsive, Tastatur und Axe.
- `app/evals/fixtures/annotation-cases.mjs` — kanonische Fixtures aller 29 Arten.
- `app/evals/run-onda-ui-quality.mjs` — strukturierte Rubrik und Ergebnisartefakte.

### Geänderte Dateien

- `app/index.html` — neue Shell-Semantik und CSS-Einstiegspunkte.
- `app/src/editor.js` — neue Styles/Module initialisieren, Dokumentmodus normalisieren, Testbrücken erweitern.
- `app/src/workspace.js` — generische lokale Finding-Fläche durch Controller ersetzen und Nebenflächen an die neue Shell anbinden.
- `app/src/style.css` — Legacy-Regeln entfernen, nur fachlich noch benötigte Editor-/Dialogregeln behalten.
- `app/src/agent-tasks.mjs` — geschlossenes `anmerkungsart`-Enum und Arbeitsmodus.
- `app/src/agent-prompts.mjs` — positive Auswahlregeln für 24 Text- und fünf Notizarten.
- `app/src/agent-findings.mjs` — exakte Art und Operationsmetadaten übernehmen.
- `app/src/hinweislauf-model.mjs` — modusabhängiges Schema-Gate.
- `app/src/reasoning-model.mjs` — genaue Art, Verwerfungsumfang und Undo-fähigen Status normalisieren.
- `app/src/workspace-model.mjs` — `annotationMode`, `quietAnnotations`, aktive Auswahl und Undo-Stack normalisieren.
- `app/src/block-identity.js` — sichere Einfüge-, Verschiebe- und Mehrfachoperationen über ProseMirror.
- `app/src/ui.js` — Bibliothek und globale Bedienelemente auf Shell-Komponenten umstellen.
- `app/src/settings-model.mjs` — entfernte visuelle Varianten tolerant lesen, aber nicht mehr anbieten.
- `app/src/example.js` — Beispieldokument mit repräsentativen genauen Arten ausstatten.
- `app/package.json` — Onda-Qualitätstest in Standardskripte aufnehmen.
- `app/evals/v2-fertigzustand.json` und `app/src/eval-catalog.mjs` — neue harte Gates registrieren.
- `docs/evals/2026-08-05-onda-ui-neubau.md` — Laufprotokoll, Rubrikwerte, Screenshots und Restabweichungen.

---

### Task 1: Semantischer Anmerkungsvertrag

**Files:**
- Create: `app/src/annotation-contract.mjs`
- Create: `app/test/annotation-contract.test.mjs`
- Create: `app/evals/fixtures/annotation-cases.mjs`

**Interfaces:**
- Produces: `TEXT_KINDS`, `NOTE_KINDS`, `ALL_KINDS`, `kindInfo(kind)`, `resolveAnnotationPresentation(finding)`, `normalizeAnnotationFinding(finding)`.
- `resolveAnnotationPresentation` returns `{ kind, category, priority, form, scope, operation }`.

- [ ] **Step 1: Write the failing taxonomy and resolver test**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ALL_KINDS, NOTE_KINDS, TEXT_KINDS,
  normalizeAnnotationFinding, resolveAnnotationPresentation,
} from '../src/annotation-contract.mjs'

test('Onda contract contains exactly 24 text and five note kinds', () => {
  assert.equal(TEXT_KINDS.length, 24)
  assert.equal(NOTE_KINDS.length, 5)
  assert.equal(new Set(ALL_KINDS).size, 29)
})

test('nature of the finding determines its presentation', () => {
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'rechtschreibung' }).form, 'correction')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'satzstil' }).form, 'rewrite')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'uebergang' }).form, 'insertion')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'verschieben' }).form, 'slot')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'ton' }).form, 'region')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'beleg' }).form, 'source')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'widerspruch' }).form, 'compare')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'luecke' }).form, 'dialogue')
  assert.equal(resolveAnnotationPresentation({ anmerkungsart: 'ueberschrift' }).form, 'title')
})

test('legacy wording suggestion is safe taste, not an objective error', () => {
  const normalized = normalizeAnnotationFinding({ kiKategorie: 'sprache', action: 'Neu', target: 'Alt' })
  assert.equal(normalized.anmerkungsart, 'wortwahl')
  assert.equal(resolveAnnotationPresentation(normalized).priority, 'geschmack')
})
```

- [ ] **Step 2: Run the test and confirm the RED state**

Run: `cd app && node --test test/annotation-contract.test.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `annotation-contract.mjs`.

- [ ] **Step 3: Implement the complete immutable contract**

```js
export const TEXT_KINDS = Object.freeze([
  'rechtschreibung','grammatik','zeichensetzung','wortwahl','satzstil','absatzstil',
  'straffen','wiederholung','ton','stilmittel','anglizismus','terminologie','verschieben',
  'uebergang','gliederung','fluss','faden','ueberschrift','anmerkung','beleg','faktencheck',
  'widerspruch','luecke','verstaendlichkeit',
])
export const NOTE_KINDS = Object.freeze(['ausformulieren','buendeln','nachfrage','ordnen','aufgreifen'])
export const ALL_KINDS = Object.freeze([...TEXT_KINDS, ...NOTE_KINDS])

const DEFINITIONS = Object.freeze({
  rechtschreibung:{label:'Rechtschreibung',category:'korrektur',priority:'fehler',form:'correction',scope:'wort',operation:'replace-range'},
  grammatik:{label:'Grammatik',category:'korrektur',priority:'fehler',form:'correction',scope:'satz',operation:'replace-range'},
  zeichensetzung:{label:'Zeichensetzung',category:'korrektur',priority:'fehler',form:'correction',scope:'wort',operation:'replace-range'},
  wortwahl:{label:'Wortwahl',category:'stil',priority:'geschmack',form:'correction',scope:'wort',operation:'replace-range'},
  satzstil:{label:'Satzstil',category:'stil',priority:'empfehlung',form:'rewrite',scope:'satz',operation:'replace-range'},
  absatzstil:{label:'Absatzstil',category:'stil',priority:'geschmack',form:'rewrite',scope:'absatz',operation:'replace-range'},
  straffen:{label:'Straffen',category:'stil',priority:'empfehlung',form:'rewrite',scope:'satz',operation:'replace-range'},
  wiederholung:{label:'Wiederholung',category:'stil',priority:'geschmack',form:'region',scope:'absatz',operation:'replace-many'},
  ton:{label:'Ton & Register',category:'stil',priority:'geschmack',form:'region',scope:'abschnitt',operation:'replace-many'},
  stilmittel:{label:'Stilmittel',category:'stil',priority:'geschmack',form:'insertion',scope:'satz',operation:'insert-at'},
  anglizismus:{label:'Anglizismus',category:'stil',priority:'geschmack',form:'correction',scope:'wort',operation:'replace-range'},
  terminologie:{label:'Terminologie',category:'stil',priority:'empfehlung',form:'compare',scope:'text',operation:'replace-many'},
  verschieben:{label:'Verschieben',category:'struktur',priority:'empfehlung',form:'slot',scope:'absatz',operation:'move-block'},
  uebergang:{label:'Übergang',category:'struktur',priority:'empfehlung',form:'insertion',scope:'satz',operation:'insert-at'},
  gliederung:{label:'Gliederung',category:'struktur',priority:'empfehlung',form:'slot',scope:'abschnitt',operation:'insert-heading'},
  fluss:{label:'Textfluss',category:'struktur',priority:'empfehlung',form:'rewrite',scope:'satz',operation:'replace-range'},
  faden:{label:'Roter Faden',category:'struktur',priority:'empfehlung',form:'rewrite',scope:'text',operation:null},
  ueberschrift:{label:'Überschrift',category:'struktur',priority:'geschmack',form:'title',scope:'titel',operation:'replace-title'},
  anmerkung:{label:'Anmerkung',category:'inhalt',priority:'geschmack',form:'dialogue',scope:'satz',operation:null},
  beleg:{label:'Beleg fehlt',category:'inhalt',priority:'fehler',form:'source',scope:'satz',operation:'attach-source'},
  faktencheck:{label:'Faktencheck',category:'inhalt',priority:'fehler',form:'source',scope:'satz',operation:'replace-range'},
  widerspruch:{label:'Widerspruch',category:'inhalt',priority:'fehler',form:'compare',scope:'text',operation:'replace-range'},
  luecke:{label:'Gegenargument fehlt',category:'inhalt',priority:'empfehlung',form:'dialogue',scope:'abschnitt',operation:null},
  verstaendlichkeit:{label:'Verständlichkeit',category:'inhalt',priority:'empfehlung',form:'insertion',scope:'satz',operation:'insert-at'},
  ausformulieren:{label:'Ausformulieren',category:'notiz',priority:'empfehlung',form:'insertion',scope:'notiz',operation:'replace-range'},
  buendeln:{label:'Gehört zusammen',category:'notiz',priority:'empfehlung',form:'slot',scope:'notiz',operation:'move-block'},
  nachfrage:{label:'Nachfrage',category:'notiz',priority:'empfehlung',form:'dialogue',scope:'notiz',operation:null},
  ordnen:{label:'Reihenfolge',category:'notiz',priority:'empfehlung',form:'slot',scope:'notiz',operation:'move-block'},
  aufgreifen:{label:'Offener Faden',category:'notiz',priority:'geschmack',form:'dialogue',scope:'text',operation:null},
})
```

Add these exact accessors and the safe legacy fallback to the same file:

```js
const LEGACY_KIND = Object.freeze({
  fakt:'faktencheck', quelle:'beleg', methode:'anmerkung', logik:'widerspruch',
  struktur:'faden', wirkung:'anmerkung', erklaerung:'verstaendlichkeit', sprache:'wortwahl',
})
export function kindInfo(kind) {
  return DEFINITIONS[ALL_KINDS.includes(kind) ? kind : 'anmerkung']
}
export function normalizeAnnotationFinding(finding = {}) {
  const exact = ALL_KINDS.includes(finding.anmerkungsart) ? finding.anmerkungsart : null
  const inferred = finding.stilmittelId ? 'stilmittel' : LEGACY_KIND[finding.kiKategorie || finding.kategorie]
  return { ...finding, anmerkungsart: exact || inferred || 'anmerkung' }
}
export function resolveAnnotationPresentation(finding) {
  const normalized = normalizeAnnotationFinding(finding)
  return Object.freeze({ kind:normalized.anmerkungsart, ...kindInfo(normalized.anmerkungsart) })
}
```

Generate the fixture list directly from `ALL_KINDS`, then overlay source, compare, slot and dialogue metadata by form so every fixture has non-empty `target`, `short`, `why` and `folge`.

- [ ] **Step 4: Run contract tests and existing finding tests**

Run: `cd app && node --test test/annotation-contract.test.mjs test/agent-findings.test.mjs test/reasoning-model.test.mjs`
Expected: all tests PASS.

- [ ] **Step 5: Commit the contract**

```bash
git add app/src/annotation-contract.mjs app/test/annotation-contract.test.mjs app/evals/fixtures/annotation-cases.mjs
git commit -m "feat(anmerkungen): semantischen Onda-Vertrag einfuehren"
```

### Task 2: KI-Schema und Modusvertrag

**Files:**
- Create: `app/test/annotation-schema.test.mjs`
- Modify: `app/src/agent-tasks.mjs`
- Modify: `app/src/agent-prompts.mjs`
- Modify: `app/src/agent-findings.mjs`
- Modify: `app/src/hinweislauf-model.mjs`
- Modify: `app/test/agent-tasks.test.mjs`
- Modify: `app/test/agent-prompts.test.mjs`
- Modify: `app/test/agent-findings.test.mjs`

**Interfaces:**
- Consumes: `TEXT_KINDS`, `NOTE_KINDS`, `normalizeAnnotationFinding`.
- Produces: `hinweiseSchemaFuerModus(mode)`, `hinweisRegelnFuerModus(mode)` and Findings with `anmerkungsart`.

- [ ] **Step 1: Write failing schema separation tests**

```js
test('text mode schema exposes exactly the 24 text kinds', () => {
  const kinds = hinweiseSchemaFuerModus('text').properties.hinweise.items.properties.anmerkungsart.enum
  assert.deepEqual(kinds, TEXT_KINDS)
})

test('note mode schema exposes only the five note kinds', () => {
  const kinds = hinweiseSchemaFuerModus('notiz').properties.hinweise.items.properties.anmerkungsart.enum
  assert.deepEqual(kinds, NOTE_KINDS)
})
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node --test test/annotation-schema.test.mjs`
Expected: FAIL because `hinweiseSchemaFuerModus` is not exported.

- [ ] **Step 3: Add the closed schema field and positive prompt rules**

Add `anmerkungsart` to required fields, build the enum from the selected mode and instruct the model with the exact form-selection rules from the spec. Preserve the eight-value `kategorie` field for existing integrity and moment logic. `hinweisZuFinding` must copy the exact kind and call `normalizeAnnotationFinding` before returning.

```js
export function hinweiseSchemaFuerModus(mode = 'text') {
  const kinds = mode === 'notiz' ? NOTE_KINDS : TEXT_KINDS
  return deepFreeze(withAnnotationKinds(HINWEISE_SCHEMA_BASE, kinds))
}
```

- [ ] **Step 4: Test schema, prompts and conversion**

Run: `cd app && node --test test/annotation-schema.test.mjs test/agent-tasks.test.mjs test/agent-prompts.test.mjs test/agent-findings.test.mjs test/hinweislauf-model.test.mjs`
Expected: all tests PASS, including rejection of a text kind in note mode.

- [ ] **Step 5: Commit the model contract**

```bash
git add app/src/agent-tasks.mjs app/src/agent-prompts.mjs app/src/agent-findings.mjs app/src/hinweislauf-model.mjs app/test/annotation-schema.test.mjs app/test/agent-tasks.test.mjs app/test/agent-prompts.test.mjs app/test/agent-findings.test.mjs
git commit -m "feat(ki): genaue Onda-Anmerkungsarten anfordern"
```

### Task 3: Sichere und umkehrbare Textoperationen

**Files:**
- Create: `app/src/annotation-operations.mjs`
- Create: `app/test/annotation-operations.test.mjs`
- Modify: `app/src/block-identity.js`
- Modify: `app/test/anchor-verify.test.mjs`

**Interfaces:**
- Produces: `planAnnotationOperation(finding, documentSnapshot)`, `validateAnnotationOperation(plan, currentSnapshot)`, `invertAnnotationOperation(applied)`.
- A plan is `{ id, kind, targets, payload, before, inverse }`; validation returns `{ ok, reason, resolvedTargets }`.

- [ ] **Step 1: Write failing operation tests**

```js
test('replace-range fails closed for duplicate targets', () => {
  const finding = { id:'f1', target:'gleich', action:'anders', blockId:null, anmerkungsart:'wortwahl' }
  const plan = planAnnotationOperation(finding, { title:'', blocks:[{id:'a',text:'gleich'},{id:'b',text:'gleich'}] })
  assert.equal(plan.ok, false)
  assert.equal(plan.reason, 'ambiguous-target')
})

test('inverse restores replace-many atomically', () => {
  const applied = { kind:'replace-many', before:[['a','Fokus'],['b','Fokus']], after:[['a','Konzentration'],['b','Konzentration']] }
  assert.deepEqual(invertAnnotationOperation(applied).after, applied.before)
})
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node --test test/annotation-operations.test.mjs`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement planning and ProseMirror adapters**

Implement the seven-operation dispatch without a permissive default:

```js
const PLANNERS = Object.freeze({
  'replace-range': planReplaceRange,
  'insert-at': planInsertAt,
  'replace-title': planReplaceTitle,
  'move-block': planMoveBlock,
  'insert-heading': planInsertHeading,
  'replace-many': planReplaceMany,
  'attach-source': planAttachSource,
})
export function planAnnotationOperation(finding, snapshot) {
  const operation = resolveAnnotationPresentation(finding).operation
  if (!operation || !PLANNERS[operation]) return { ok:false, reason:'no-operation' }
  return PLANNERS[operation](finding, snapshot)
}
export function validateAnnotationOperation(plan, current) {
  if (!plan?.ok) return plan || { ok:false, reason:'missing-plan' }
  return sameExpectedState(plan.before, current)
    ? { ok:true, resolvedTargets:plan.targets }
    : { ok:false, reason:'stale-target' }
}
export function invertAnnotationOperation(applied) {
  return { ...applied, before:applied.after, after:applied.before, inverseOf:applied.id }
}
```

The pure planner resolves only exact block IDs and exact text. `block-identity.js` receives adapter functions `insertAnchoredText`, `moveTopLevelBlock`, `insertSemanticHeading`, and `applyAnchoredReplacements`; each returns `{ ok, reason, before, after }` and performs one transaction.

- [ ] **Step 4: Run operation and editor identity tests**

Run: `cd app && node --test test/annotation-operations.test.mjs test/anchor-verify.test.mjs test/workspace-model.test.mjs`
Expected: all tests PASS; duplicate or stale anchors never mutate snapshots.

- [ ] **Step 5: Commit safe operations**

```bash
git add app/src/annotation-operations.mjs app/src/block-identity.js app/test/annotation-operations.test.mjs app/test/anchor-verify.test.mjs
git commit -m "feat(editor): Anmerkungsoperationen sicher und umkehrbar machen"
```

### Task 4: Anmerkungszustand, Reihenfolge und Rückgängig

**Files:**
- Create: `app/src/annotation-controller.mjs`
- Create: `app/test/annotation-controller.test.mjs`
- Modify: `app/src/reasoning-model.mjs`
- Modify: `app/src/workspace-model.mjs`
- Modify: `app/test/reasoning-model.test.mjs`
- Modify: `app/test/workspace-model.test.mjs`

**Interfaces:**
- Consumes: `resolveAnnotationPresentation`, operation planner.
- Produces: `annotationSummary(findings)`, `orderedAnnotations(findings, moment)`, `createAnnotationController(adapter)`, `normalizeAnnotationWorkspace(workspace)`.

- [ ] **Step 1: Write failing state tests**

```js
test('summary and order are Fehler then Empfehlungen then Geschmack', () => {
  const findings = fixtures('wortwahl', 'beleg', 'satzstil')
  assert.deepEqual(annotationSummary(findings), { fehler:1, empfehlungen:1, geschmack:1 })
  assert.deepEqual(orderedAnnotations(findings, 'aufschauen').map(item => item.anmerkungsart), ['beleg','satzstil','wortwahl'])
})

test('quiet mode retains findings but returns no active surface', () => {
  const controller = createAnnotationController(memoryAdapter({ quietAnnotations:true }))
  assert.equal(controller.current(), null)
  assert.equal(controller.summary().total, 3)
})
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node --test test/annotation-controller.test.mjs`
Expected: FAIL with missing module.

- [ ] **Step 3: Implement controller and persisted UI state**

Use one active ID, one quiet boolean, one document mode, a bounded undo stack of 20 entries and rejection scopes `once`, `document`, `personal`. Extend decisions without changing legacy statuses.

- [ ] **Step 4: Run state tests**

Run: `cd app && node --test test/annotation-controller.test.mjs test/reasoning-model.test.mjs test/workspace-model.test.mjs test/momente-model.test.mjs`
Expected: all tests PASS.

- [ ] **Step 5: Commit controller state**

```bash
git add app/src/annotation-controller.mjs app/src/reasoning-model.mjs app/src/workspace-model.mjs app/test/annotation-controller.test.mjs app/test/reasoning-model.test.mjs app/test/workspace-model.test.mjs
git commit -m "feat(anmerkungen): Navigation Ruhemodus und Undo modellieren"
```

### Task 5: Onda-Tokens und Symbolsprache

**Files:**
- Create: `app/src/onda-tokens.css`
- Create: `app/src/onda-icons.mjs`
- Create: `app/test/onda-design-contract.test.mjs`
- Modify: `app/index.html`
- Modify: `app/src/style.css`

**Interfaces:**
- Produces: `ondaIcon(name, { size, label })` returning an SVG DOM node.
- CSS exposes only the canonical token names used by new components.

- [ ] **Step 1: Write a failing design-contract test**

```js
test('new Onda styles use only the four type sizes and three weights', async () => {
  const css = await readFile(new URL('../src/onda-tokens.css', import.meta.url), 'utf8')
  assert.deepEqual([...css.matchAll(/--text-[^:]+:\s*([^;]+)/g)].map(match => match[1]), ['12px','15px','21px','40px'])
  assert.equal(/Hanken|Literata|JetBrains|font-weight:\s*600/.test(css), false)
})
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node --test test/onda-design-contract.test.mjs`
Expected: FAIL because `onda-tokens.css` does not exist.

- [ ] **Step 3: Copy the canonical values and add icons**

Copy values from `tokens/colors.css`, `tokens/spacing.css`, `tokens/radius.css`, `tokens/typography.css`, `tokens/motion.css` and `tokens/elevation.css` into one app token file without aliases that introduce additional visual choices. Implement the icon factory with a fixed `viewBox`, `fill="none"`, rounded caps/joins and stroke width 1.75.

- [ ] **Step 4: Link token CSS before component CSS and remove forbidden declarations**

At this task, link only `onda-tokens.css` before the compatibility `style.css`. Task 6 links `onda-annotations.css`; Task 10 inserts `onda-shell.css` between tokens and annotations. Remove unused font faces and replace Unicode action glyphs only in components migrated in the current task.

- [ ] **Step 5: Verify the design contract**

Run: `cd app && node --test test/onda-design-contract.test.mjs && npm run build`
Expected: PASS and a successful esbuild bundle.

- [ ] **Step 6: Commit tokens and icons**

```bash
git add app/src/onda-tokens.css app/src/onda-icons.mjs app/test/onda-design-contract.test.mjs app/index.html app/src/style.css
git commit -m "refactor(design): Onda-Tokens und Symbole verbindlich machen"
```

### Task 6: Acht Anmerkungskomponenten und Titelkorrektur

**Files:**
- Create: `app/src/annotation-components.mjs`
- Create: `app/src/onda-annotations.css`
- Create: `app/test/onda-ui-smoke.mjs`
- Modify: `app/test/annotation-controller.test.mjs`

**Interfaces:**
- Consumes: presentation object and callbacks `{ onAccept, onDismiss, onSecondary, onReply }`.
- Produces: `renderAnnotationMark`, `renderCorrection`, `renderRewrite`, `renderInsertion`, `renderSlot`, `renderRegion`, `renderAnnotationCard`, `renderDialogue`, `renderTitleCorrection`.

- [ ] **Step 1: Add failing DOM contract tests using the existing Playwright smoke harness**

```js
for (const [kind, form] of Object.entries({
  rechtschreibung:'correction', satzstil:'rewrite', uebergang:'insertion',
  verschieben:'slot', ton:'region', beleg:'source', widerspruch:'compare',
  luecke:'dialogue', ueberschrift:'title',
})) {
  await page.goto(`${base}/annotation-lab.html?kind=${kind}`)
  const surface = page.locator(`[data-annotation-form="${form}"]`)
  assert.equal(await surface.count(), 1)
  assert.ok((await surface.getAttribute('aria-label'))?.length > 0)
}
await page.goto(`${base}/annotation-lab.html?kind=beleg`)
assert.equal(await page.locator('.aura-note__srcmeta script').count(), 0)
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node test/onda-ui-smoke.mjs --section components`
Expected: FAIL because the lab and components do not exist.

- [ ] **Step 3: Port component behavior from the design system**

Implement DOM components with `textContent`, explicit buttons, ARIA state, event isolation and returned focus handles. Port the component CSS values from `components/annotation/*.jsx`; do not introduce a new visual token.

- [ ] **Step 4: Verify component forms at 1280 and 1024 pixels**

Run: `cd app && node test/onda-ui-smoke.mjs --section components`
Expected: PASS with one right-rail layout and one below-text layout.

- [ ] **Step 5: Commit components**

```bash
git add app/src/annotation-components.mjs app/src/onda-annotations.css app/test/onda-ui-smoke.mjs app/test/annotation-controller.test.mjs
git commit -m "feat(ui): fallgerechte Onda-Anmerkungen bauen"
```

### Task 7: Vollständige Anmerkungsgalerie

**Files:**
- Create: `app/annotation-lab.html`
- Create: `app/src/annotation-lab.mjs`
- Modify: `app/test/onda-ui-smoke.mjs`
- Modify: `app/evals/fixtures/annotation-cases.mjs`

**Interfaces:**
- Consumes: canonical fixtures and annotation components.
- Produces: deterministic visual route with query parameters `kind`, `theme`, `width`, `state`.

- [ ] **Step 1: Add a failing completeness test**

```js
const rendered = await page.locator('[data-annotation-kind]').evaluateAll(nodes => nodes.map(node => node.dataset.annotationKind))
assert.deepEqual(rendered.sort(), [...ALL_KINDS].sort())
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node test/onda-ui-smoke.mjs --section lab`
Expected: FAIL because `annotation-lab.html` is absent.

- [ ] **Step 3: Build the deterministic gallery**

Render all 29 cases grouped as Fehler, Empfehlungen, Geschmack and Notizmodus. Include closed, open, applied, rejected, stale, loading and error fixtures without persistence or live network access.

- [ ] **Step 4: Capture the baseline matrix**

Run: `cd app && node test/onda-ui-smoke.mjs --section lab --screenshots`
Expected: PASS and screenshots for light/dark at 1280/1024/720/320 widths.

- [ ] **Step 5: Commit the gallery**

```bash
git add app/annotation-lab.html app/src/annotation-lab.mjs app/evals/fixtures/annotation-cases.mjs app/test/onda-ui-smoke.mjs
git commit -m "test(ui): alle Onda-Anwendungsfaelle sichtbar machen"
```

### Task 8: Schreibansicht integrieren

**Files:**
- Modify: `app/index.html`
- Modify: `app/src/workspace.js`
- Modify: `app/src/editor.js`
- Modify: `app/src/block-identity.js`
- Modify: `app/test/v2-smoke.mjs`
- Modify: `app/test/onda-ui-smoke.mjs`

**Interfaces:**
- Consumes: controller, components and safe operation adapters.
- Produces: live editor review header, right rail/below-text surface and ProseMirror marks.

- [ ] **Step 1: Replace generic-surface expectations with failing semantic expectations**

The smoke test opens the example, injects one fixture of each form through `__workspaceTestBridge`, checks the correct form, accepts it, checks editor text/status, triggers undo and checks full restoration.

- [ ] **Step 2: Verify RED**

Run: `cd app && node test/onda-ui-smoke.mjs --section editor`
Expected: FAIL because the editor still renders `.local-finding-detail-row`.

- [ ] **Step 3: Integrate one active semantic surface**

Replace `renderLocalFinding` and `renderSuggestion` with the controller. Add review header counts, bulk correction action, quiet switch, previous/next controls, refusal aftermath and undo banner. Reuse the existing moment gate before feeding findings to the controller.

- [ ] **Step 4: Connect all operations and focus recovery**

Each accept callback validates against the current Tiptap snapshot, applies one transaction, records the decision, pushes inverse data, persists and flashes the changed node. Reject and dialogue paths never call an operation adapter.

- [ ] **Step 5: Run focused and existing browser flows**

Run: `cd app && node test/onda-ui-smoke.mjs --section editor && node test/v2-smoke.mjs`
Expected: PASS; no generic observation/relevance/consequence surface remains in the writing view.

- [ ] **Step 6: Commit integration**

```bash
git add app/index.html app/src/workspace.js app/src/editor.js app/src/block-identity.js app/test/v2-smoke.mjs app/test/onda-ui-smoke.mjs
git commit -m "feat(editor): semantische Onda-Anmerkungen integrieren"
```

### Task 9: Notizmodus und Verwerfungsfolgen

**Files:**
- Modify: `app/src/annotation-controller.mjs`
- Modify: `app/src/workspace.js`
- Modify: `app/src/hinweislauf-model.mjs`
- Modify: `app/src/erkanntes-model.mjs`
- Modify: `app/test/annotation-controller.test.mjs`
- Modify: `app/test/hinweislauf-model.test.mjs`
- Modify: `app/test/onda-ui-smoke.mjs`

**Interfaces:**
- Uses `workspace.annotationMode` with values `text` or `notiz`.
- Rejection record is `{ findingId, scope:'once'|'document'|'personal', signature, at }`.

- [ ] **Step 1: Write failing mode and rejection-scope tests**

```js
test('note mode admits only note kinds', () => {
  assert.equal(acceptsKindInMode('notiz', 'rechtschreibung'), false)
  assert.equal(acceptsKindInMode('notiz', 'nachfrage'), true)
})
test('suppression scopes remain distinct and revocable', () => {
  const store = createSuppressionStore()
  store.reject({ signature:'wortwahl|sehr gut', documentId:'a', scope:'document' })
  assert.equal(store.suppresses('wortwahl|sehr gut', 'a'), true)
  assert.equal(store.suppresses('wortwahl|sehr gut', 'b'), false)
  const id = store.reject({ signature:'ton|man-du', documentId:'a', scope:'personal' })
  assert.equal(store.suppresses('ton|man-du', 'b'), true)
  store.revoke(id)
  assert.equal(store.suppresses('ton|man-du', 'b'), false)
})
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node --test test/annotation-controller.test.mjs test/hinweislauf-model.test.mjs`
Expected: FAIL at mode gate and suppression scope.

- [ ] **Step 3: Implement mode switch and suppression persistence**

Add a two-option pill control „Text / Notizen“. Pass the mode into schema construction and prompt context. Store document suppression on the document workspace; store personal suppression through the existing memory model with an explicit user-decision provenance.

- [ ] **Step 4: Verify model and browser behavior**

Run: `cd app && node --test test/annotation-controller.test.mjs test/hinweislauf-model.test.mjs test/erkanntes-model.test.mjs && node test/onda-ui-smoke.mjs --section modes`
Expected: PASS.

- [ ] **Step 5: Commit modes and rejection consequences**

```bash
git add app/src/annotation-controller.mjs app/src/workspace.js app/src/hinweislauf-model.mjs app/src/erkanntes-model.mjs app/test/annotation-controller.test.mjs app/test/hinweislauf-model.test.mjs app/test/onda-ui-smoke.mjs
git commit -m "feat(anmerkungen): Notizmodus und Verwerfungsumfang vollenden"
```

### Task 10: Neue App-Shell und Bibliothek

**Files:**
- Create: `app/src/onda-shell.mjs`
- Create: `app/src/onda-shell.css`
- Modify: `app/index.html`
- Modify: `app/src/ui.js`
- Modify: `app/src/workspace.js`
- Modify: `app/src/editor.js`
- Modify: `app/test/v2-smoke.mjs`
- Modify: `app/test/onda-ui-smoke.mjs`

**Interfaces:**
- Produces: `initOndaShell(context)`, `setOndaView(view)`, `renderOndaLibrary(model)`, `applyOndaShellState(state)`.

- [ ] **Step 1: Add failing shell semantics and screenshot assertions**

```js
assert.equal(await page.locator('main').count(), 1)
assert.equal(await page.getByRole('navigation', { name:'Projekt' }).count(), 1)
assert.equal(await page.locator('.onda-aura:not([aria-hidden="true"])').count(), 1)
const measure = await page.locator('#editor .ProseMirror').evaluate(node => node.getBoundingClientRect().width)
assert.ok(measure >= 640 && measure <= 680)
await page.setViewportSize({ width:320, height:780 })
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
assert.ok(overflow <= 1)
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node test/onda-ui-smoke.mjs --section shell`
Expected: FAIL for old shell structure and narrow overflow.

- [ ] **Step 3: Build the new shell**

Rebuild library, project navigation, writing sheet, header and overlays from the writing-tool shell/reference. Keep existing element IDs only where a controller contract needs them; remove duplicate wrappers and legacy card classes after callers migrate.

- [ ] **Step 4: Reconnect existing sidebar functions**

Project understanding, structure, held items, extensions, learned patterns and material receive Onda surface components but continue invoking their current domain handlers.

- [ ] **Step 5: Verify all shell paths**

Run: `cd app && node test/onda-ui-smoke.mjs --section shell && node test/v2-smoke.mjs && node test/etappe-a-smoke.mjs`
Expected: PASS.

- [ ] **Step 6: Commit the shell**

```bash
git add app/src/onda-shell.mjs app/src/onda-shell.css app/index.html app/src/ui.js app/src/workspace.js app/src/editor.js app/test/v2-smoke.mjs app/test/onda-ui-smoke.mjs
git commit -m "feat(ui): Onda-App-Shell vollstaendig neu bauen"
```

### Task 11: Nebenflächen, Zustände und visuelle Bereinigung

**Files:**
- Modify: `app/src/style.css`
- Modify: `app/src/workspace.js`
- Modify: `app/src/source-library-ui.mjs`
- Modify: `app/src/argument-ui.mjs`
- Modify: `app/src/audit-ui.mjs`
- Modify: `app/src/ui.js`
- Modify: `app/test/onda-design-contract.test.mjs`
- Modify: `app/test/onda-ui-smoke.mjs`

**Interfaces:**
- All surfaces consume canonical tokens and `ondaIcon`.

- [ ] **Step 1: Extend the failing design audit to every rendered main surface**

```js
const selectors = ['#homeInner','.onda-sidebar','#kiModal','#evidenceWindow','.argument-surface','.final-audit','#agentWidget']
const violations = await page.evaluate(selectors => selectors.flatMap(selector => {
  const node = document.querySelector(selector)
  if (!node) return [`missing:${selector}`]
  const style = getComputedStyle(node)
  return [
    style.fontFamily.includes('Diatype') ? null : `font:${selector}`,
    ['400','500','700'].includes(style.fontWeight) ? null : `weight:${selector}:${style.fontWeight}`,
  ].filter(Boolean)
}), selectors)
assert.deepEqual(violations, [])
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node test/onda-ui-smoke.mjs --section surfaces && node --test test/onda-design-contract.test.mjs`
Expected: FAIL with a concrete list of legacy selectors.

- [ ] **Step 3: Migrate every reported surface and delete obsolete CSS**

Use neutral status copy, Sky only for selection/action/focus, red only for genuine failure/destruction, 24-pixel surfaces and pill controls. Replace Unicode arrows, checks, crosses, gears and moons with named SVG icons. Remove rules only after the runtime audit reports no matching node.

- [ ] **Step 4: Verify visual contract and CSS size reduction**

Run: `cd app && node test/onda-ui-smoke.mjs --section surfaces && node --test test/onda-design-contract.test.mjs && npm run build`
Expected: PASS; forbidden runtime style list is empty and the bundle builds.

- [ ] **Step 5: Commit visual cleanup**

```bash
git add app/src/style.css app/src/workspace.js app/src/source-library-ui.mjs app/src/argument-ui.mjs app/src/audit-ui.mjs app/src/ui.js app/test/onda-design-contract.test.mjs app/test/onda-ui-smoke.mjs
git commit -m "refactor(ui): alle Nebenflaechen in Onda vereinheitlichen"
```

### Task 12: Responsive, Tastatur und WCAG-AA

**Files:**
- Modify: `app/src/onda-shell.css`
- Modify: `app/src/onda-annotations.css`
- Modify: `app/src/annotation-components.mjs`
- Modify: `app/src/annotation-controller.mjs`
- Modify: `app/test/d2-accessibility.test.mjs`
- Modify: `app/test/onda-ui-smoke.mjs`

**Interfaces:**
- Breakpoints: right rail above 1040, below-text at/below 1040, compact navigation at/below 720.

- [ ] **Step 1: Add failing viewport, zoom, reduced-motion and keyboard tests**

```js
for (const width of [1280, 1024, 720, 320]) {
  await page.setViewportSize({ width, height:900 })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1))
  await expectVisible(page.getByRole('button', { name:/Weiter|Übernehmen/ }).first())
}
await page.keyboard.press('Tab')
await page.keyboard.press('Enter')
assert.ok(await page.locator('[data-annotation-form]').count())
const results = await new AxeBuilder({ page }).analyze()
assert.deepEqual(results.violations.filter(item => ['critical','serious'].includes(item.impact)), [])
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node test/onda-ui-smoke.mjs --section accessibility`
Expected: FAIL with named overflow, focus or Axe findings.

- [ ] **Step 3: Fix layout and interaction contracts**

Add container queries or media queries at the specified breakpoints, `overflow-wrap:anywhere` for long content, returned focus after close/decision, live status messages, reduced-motion overrides and 44-pixel targets outside text-bound inline marks.

- [ ] **Step 4: Verify accessibility**

Run: `cd app && node test/onda-ui-smoke.mjs --section accessibility && node test/d2-accessibility.test.mjs`
Expected: PASS with zero critical or serious Axe violations.

- [ ] **Step 5: Commit accessibility hardening**

```bash
git add app/src/onda-shell.css app/src/onda-annotations.css app/src/annotation-components.mjs app/src/annotation-controller.mjs app/test/d2-accessibility.test.mjs app/test/onda-ui-smoke.mjs
git commit -m "fix(a11y): Onda-UI responsiv und tastaturfest machen"
```

### Task 13: Onda-Qualitätseval und Fertigzustandskatalog

**Files:**
- Create: `app/evals/run-onda-ui-quality.mjs`
- Modify: `app/package.json`
- Modify: `app/evals/v2-fertigzustand.json`
- Modify: `app/src/eval-catalog.mjs`
- Modify: `app/test/eval-catalog.test.mjs`

**Interfaces:**
- Produces: `app/evals/results/onda-ui-latest.json` with per-criterion evidence and 1–5 rubric scores.

- [ ] **Step 1: Add failing eval-catalog assertions**

```js
test('Onda UI acceptance criteria are hard catalog gates', () => {
  const gates = catalog().filter(entry => entry.id.startsWith('ONDA-UI-'))
  assert.equal(gates.length, 22)
  assert.deepEqual(gates.map(entry => entry.id), Array.from({length:22}, (_, index) => `ONDA-UI-${String(index + 1).padStart(2,'0')}`))
  assert.ok(gates.every(entry => entry.hard === true && entry.command && entry.evidence))
})
```

- [ ] **Step 2: Verify RED**

Run: `cd app && node --test test/eval-catalog.test.mjs`
Expected: FAIL because Onda UI gates are absent.

- [ ] **Step 3: Implement the eval runner**

The runner executes contract, schema, operation, controller, browser, accessibility and build checks; collects screenshots and writes a JSON result with `{ criterion, gate, status, score, evidence }`. It must redact case-insensitive matches for `authorization`, `api-key`, `x-api-key`, `sk-ant-` and `sk-` before persistence.

- [ ] **Step 4: Verify catalog and dry-run eval**

Run: `cd app && node --test test/eval-catalog.test.mjs && node evals/run-onda-ui-quality.mjs --without-live`
Expected: PASS and `onda-ui-latest.json` with all automatable non-live gates green.

- [ ] **Step 5: Commit eval integration**

```bash
git add app/evals/run-onda-ui-quality.mjs app/package.json app/evals/v2-fertigzustand.json app/src/eval-catalog.mjs app/test/eval-catalog.test.mjs
git commit -m "evals: Onda-UI als harten Fertigzustand messen"
```

### Task 14: Echter Native-Minimallauf ohne Geheimniszugriff

**Files:**
- Modify: `app/test/native-probe-model.test.mjs`
- Modify: `app/evals/pruefungen/schluessel-leck.mjs`
- Modify: `app/evals/run-onda-ui-quality.mjs`
- Create: `docs/evals/2026-08-05-onda-ui-neubau.md`

**Interfaces:**
- Uses only existing Native status/probe messages; never requests a key value.

- [ ] **Step 1: Add a failing redaction and process-argument test**

```js
test('native evidence redacts synthetic secrets', () => {
  const raw = 'Authorization: Bearer sk-ant-example x-api-key=sk-example'
  const safe = redactSecrets(raw)
  assert.equal(safe.includes('sk-ant-example'), false)
  assert.equal(safe.includes('sk-example'), false)
  assert.equal(safe.includes('[REDACTED]'), true)
})
```

The process check may read `ps` output but must assert only that no argument contains `authorization`, `x-api-key`, `api-key`, `sk-ant-` or `sk-`; it must not invoke `security find-generic-password` or any Keychain read command.

- [ ] **Step 2: Verify RED**

Run: `cd app && node --test test/native-probe-model.test.mjs && node evals/pruefungen/schluessel-leck.mjs`
Expected: the synthetic leak fixture is detected and the test initially fails.

- [ ] **Step 3: Harden redaction and execute one minimal live request through the Native app**

Launch the built app, verify `hatSchluessel` status, submit one short deterministic annotation request, validate the response against the new text-mode schema and close the app. Persist only pass/fail, model/task identifier, duration, token counts and annotation kind.

- [ ] **Step 4: Re-run leak and native probes**

Run: `cd app && node --test test/native-probe-model.test.mjs && node evals/pruefungen/schluessel-leck.mjs && node evals/run-onda-ui-quality.mjs --live-native`
Expected: PASS; no secret-like value appears in artifacts or process arguments.

- [ ] **Step 5: Commit native evidence**

```bash
git add app/test/native-probe-model.test.mjs app/evals/pruefungen/schluessel-leck.mjs app/evals/run-onda-ui-quality.mjs docs/evals/2026-08-05-onda-ui-neubau.md app/evals/results/onda-ui-latest.json
git commit -m "test(native): echte Onda-Anmerkung sicher verifizieren"
```

### Task 15: Agentic-Eval-Schleife und Abschluss

**Files:**
- Modify: `docs/evals/2026-08-05-onda-ui-neubau.md`
- Modify: `app/evals/results/onda-ui-latest.json`
- Modify only files named by a concrete failed gate.

**Interfaces:**
- Completion threshold: average at least 4.6/5 and every hard gate PASS.

- [ ] **Step 1: Run the complete fresh baseline**

Run: `cd app && npm test && npm run build && node evals/run-onda-ui-quality.mjs --live-native && node evals/run-fertigzustand.mjs`
Expected: command success; otherwise record exact failed gate before changing code.

- [ ] **Step 2: Capture the visual matrix and score round 1**

Use Playwright screenshots for library, editor with each form family, settings, sources, agent dialogue and annotation lab in light/dark at 1280/1024/720/320. Score the seven rubric dimensions 1–5 and record concrete evidence.

- [ ] **Step 3: Refine only failed or sub-threshold criteria**

For each change, add or tighten a test that fails for the observed defect, run it red, implement the smallest correction, run it green, then rerun the affected screenshot. Do not change stable acceptance criteria.

- [ ] **Step 4: Repeat up to five rounds**

Stop when average is at least 4.6 and every hard gate passes. Stop early if two successive rounds do not improve; document the remaining difference rather than hiding it.

- [ ] **Step 5: Run verification-before-completion**

Run: `cd app && npm test && npm run build && node evals/run-onda-ui-quality.mjs --live-native && node evals/run-fertigzustand.mjs && git diff --check`
Expected: all commands PASS, AC-01 through AC-22 have fresh evidence, no secret material is present, and `git status --short` lists only deliberately untracked user-owned scratch files.

- [ ] **Step 6: Commit final evidence and cleanup**

```bash
git add docs/evals/2026-08-05-onda-ui-neubau.md app/evals/results/onda-ui-latest.json
git commit -m "abschluss: Onda UI-Neubau vollstaendig belegen"
```

Do not stage `.scratch/` or any unrelated pre-existing file.

## Self-Review Record

- Spec coverage: AC-01 → Tasks 5, 10, 11; AC-02 → Tasks 1, 6, 7; AC-03 → Tasks 2, 9; AC-04–10 → Tasks 3, 6, 8; AC-11–14 → Tasks 4, 8, 9; AC-15 → Tasks 1, 4, 8; AC-16–17 → Tasks 10–12; AC-18 → Task 14; AC-19–22 → Tasks 13–15.
- Failure and recovery: stale/ambiguous operations are covered in Task 3, gateway/schema recovery in Tasks 2 and 14, save/reload in Tasks 8 and 15.
- Type consistency: the plan uses one `anmerkungsart` field, one `text|notiz` mode, one `{ kind, category, priority, form, scope, operation }` presentation object and one `{ ok, reason, before, after }` mutation result throughout.
- Placeholder scan: every implementation and recovery step names concrete code, commands and expected evidence.
- Execution decision: inline execution is selected because the user explicitly requested completion without interruptions; no subagent dispatch is used.
