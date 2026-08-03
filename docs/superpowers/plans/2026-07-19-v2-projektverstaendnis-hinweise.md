# V2 Projektverstaendnis und Hinweise Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den ersten V2-Funktionsstrang bauen: ein sichtbares, korrigierbares Projektverstaendnis und eine gemeinsame Hinweis-Queue, die genau eine wichtige Grundursache zeigt, alle weiteren Punkte behaelt und Nutzerentscheidungen nachvollziehbar speichert.

**Architecture:** Ein reines JavaScript-Modul kapselt Migration, Priorisierung und Entscheidungen hinter vier Funktionen. `editor.js` normalisiert die gespeicherten Projekt- und Textdaten. `panels.js` projiziert dasselbe Modell als ruhigen Agentenbereich und als textverankerten Hinweis; bestehende Coach-/Lane-Daten werden einmalig migriert. Die UI bleibt ein statischer Tiptap/esbuild-Client und erhaelt in diesem Schritt noch keinen echten Modell- oder Rechercheadapter.

**Tech Stack:** Vanilla JavaScript, ES modules, Node.js `node:test`, Tiptap/ProseMirror, esbuild, Playwright fuer Browserpruefungen.

## Global Constraints

- Der Agent veraendert Text nur nach einer bewussten Uebernahme durch den Nutzer.
- Belegtes Wissen, Einordnung und Entwurf bleiben unterscheidbar.
- Im Normalzustand ist hoechstens eine aktuelle Grundursache prominent.
- Kein offener Hinweis darf durch Priorisierung oder Abhaengigkeiten verloren gehen.
- Integritaetsprobleme werden bei Ablehnung als bewusst akzeptiertes Risiko gespeichert.
- Die Dokumentoberflaeche bietet keine Wahl von Schriftart, Schriftgroesse, Farbe oder Bildern an.
- Bestehende Nutzerdaten muessen durch Schema-Migration lesbar bleiben.
- Kein Commit ohne ausdruecklichen Auftrag des Nutzers.

---

## File Structure

```text
CONTEXT.md
app/
  package.json
  src/
    reasoning-model.mjs   - Normalisierung, Migration, Priorisierung, Entscheidungen
    editor.js             - Persistenzschema und Einbindung des Modells
    panels.js             - Projektverstaendnis, Queue und Hinweisprojektionen
    ui.js                 - reduzierte Schreibwerkzeuge
    example.js            - nachvollziehbare V2-Beispieldaten
    style.css             - ruhige progressive Darstellung
  test/
    reasoning-model.test.mjs
docs/superpowers/specs/2026-07-19-agentisches-schreibsystem-v2.md
```

### Task 1: Reines Reasoning-Modell

**Files:**
- Create: `app/test/reasoning-model.test.mjs`
- Create: `app/src/reasoning-model.mjs`
- Modify: `app/package.json`

**Interfaces:**
- Produces: `ensureProjectUnderstanding(project) -> ProjectUnderstanding`
- Produces: `ensureReasoningModel(doc) -> doc`
- Produces: `getFindingQueue(doc) -> { current, upcoming, parked, acceptedRisks, completed, pendingCount }`
- Produces: `decideFinding(doc, findingId, decision, at?) -> Finding`

- [x] **Step 1: Write failing normalization tests**

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { ensureProjectUnderstanding, ensureReasoningModel } from '../src/reasoning-model.mjs'

test('normalizes project understanding without discarding existing fields', () => {
  const project = { understanding: { task: 'Hausarbeit' } }
  const result = ensureProjectUnderstanding(project)
  assert.equal(result.task, 'Hausarbeit')
  assert.deepEqual(result.audience, [])
  assert.deepEqual(result.protectedIntentions, [])
})

test('migrates legacy coach and lane entries into one finding collection once', () => {
  const doc = {
    coach: [{ id: 'c1', type: 'Struktur', status: 'open', text: 'These fehlt' }],
    lane: [{ id: 'l1', kind: 'form', status: 'open', target: 'sehr gut', short: 'Unpraezise' }],
  }
  ensureReasoningModel(doc)
  ensureReasoningModel(doc)
  assert.equal(doc.findings.length, 2)
  assert.equal(doc.findings.find(x => x.id === 'c1').placement, 'document')
  assert.equal(doc.findings.find(x => x.id === 'l1').placement, 'passage')
})
```

- [x] **Step 2: Run normalization tests and verify RED**

Run: `cd app && node --test test/reasoning-model.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/reasoning-model.mjs`.

- [x] **Step 3: Add queue and decision tests**

```js
test('surfaces one unblocked root cause and parks its dependants', () => {
  const doc = { findings: [
    { id: 'style', status: 'open', priority: 'normal', createdAt: 1 },
    { id: 'root', status: 'open', priority: 'high', category: 'logic', createdAt: 2 },
    { id: 'child', status: 'open', priority: 'critical', rootCauseId: 'root', createdAt: 3 },
  ] }
  const queue = getFindingQueue(doc)
  assert.equal(queue.current.id, 'root')
  assert.deepEqual(queue.parked.map(x => x.id), ['child'])
  assert.equal(queue.pendingCount, 3)
})

test('records rejection of an integrity finding as accepted risk', () => {
  const doc = { findings: [{ id: 'source', status: 'open', category: 'source', priority: 'critical' }] }
  decideFinding(doc, 'source', { kind: 'reject', reason: 'Abgabe heute' }, 42)
  assert.equal(doc.findings[0].status, 'risk-accepted')
  assert.equal(doc.decisions[0].at, 42)
  assert.equal(doc.decisions[0].reason, 'Abgabe heute')
})

test('dismisses a wording proposal without creating an integrity risk', () => {
  const doc = { findings: [{ id: 'wording', status: 'open', category: 'wording' }] }
  decideFinding(doc, 'wording', { kind: 'reject' }, 42)
  assert.equal(doc.findings[0].status, 'dismissed')
  assert.equal(getFindingQueue(doc).acceptedRisks.length, 0)
})
```

- [x] **Step 4: Implement the model**

`reasoning-model.mjs` defines fixed defaults and priority/category ranks, copies legacy fields without inventing content, derives parked state from an open `rootCauseId`, and records immutable decision entries. Integrity categories are exactly `fact`, `source`, `citation`, `method`, and `logic`.

- [x] **Step 5: Add and run the package test command**

Add to `package.json`:

```json
"test": "node --test test/*.test.mjs"
```

Run: `cd app && npm test`

Expected: all model tests PASS with zero failures.

### Task 2: Persisted Schema Migration

**Files:**
- Modify: `app/src/editor.js`
- Modify: `app/test/reasoning-model.test.mjs`

**Interfaces:**
- Consumes: all four exports from `reasoning-model.mjs`
- Produces: schema version 4 payloads with `projects[].understanding`, `docs[].findings`, and `docs[].decisions`

- [x] **Step 1: Add a test for preserving prior decisions during normalization**

```js
test('preserves existing findings and decisions during repeated normalization', () => {
  const doc = {
    findings: [{ id: 'f1', status: 'resolved' }],
    decisions: [{ id: 'd1', findingId: 'f1', kind: 'accept', at: 1 }],
  }
  ensureReasoningModel(doc)
  ensureReasoningModel(doc)
  assert.equal(doc.findings.length, 1)
  assert.equal(doc.decisions.length, 1)
})
```

- [x] **Step 2: Run the test and verify RED if preservation is incomplete**

Run: `cd app && npm test`

Expected: the new assertion fails before the normalization guard is complete.

- [x] **Step 3: Wire normalization into loading and creation**

In `editor.js`:

```js
import { ensureProjectUnderstanding, ensureReasoningModel } from './reasoning-model.mjs'

const SCHEMA = 4

function ensureDocShape(d) {
  // existing shape migration
  ensureReasoningModel(d)
  return d
}

function ensureProjectShape(p) {
  if (!Array.isArray(p.material)) p.material = []
  ensureProjectUnderstanding(p)
  return p
}
```

Duplicate operations copy `findings` and `decisions` in addition to legacy fields.

- [x] **Step 4: Run unit tests and production build**

Run: `cd app && npm test && npm run build`

Expected: tests PASS; esbuild exits 0 and writes `dist/editor.bundle.js`.

### Task 3: V2 Example Data

**Files:**
- Modify: `app/src/example.js`
- Modify: `app/src/editor.js`

**Interfaces:**
- Produces: `buildExampleUnderstanding() -> ProjectUnderstanding`
- Produces: legacy example findings that the migration converts without duplicate IDs

- [x] **Step 1: Add an explicit project understanding fixture**

```js
export function buildExampleUnderstanding() {
  return {
    task: 'Ein kurzer argumentativer Essay ueber Calm Technology in Schreibsoftware.',
    audience: ['Designerinnen und Designer', 'Menschen, die konzentriert schreiben'],
    desiredEffect: 'Das Prinzip verstehen und auf konkrete Produktentscheidungen uebertragen koennen.',
    evidenceStandard: 'Zentrale historische Aussagen mit sichtbarer Primaerquelle; Designuebertragung als Einordnung kennzeichnen.',
    protectedIntentions: ['Die Formel "volle Kraft, leise Praesentation" als Schlussgedanke erhalten.'],
    openQuestions: ['Wie stark soll der Text wissenschaftlich oder essayistisch argumentieren?'],
    updatedAt: 0,
  }
}
```

- [x] **Step 2: Remove actual-image example content and unsupported claims**

Delete the generated SVG diagram finding and any exact quantitative interruption claim without a visible verified source. Keep text examples, exact source links and rhetorical-image suggestions.

- [x] **Step 3: Seed the example project with understanding and bump its version**

Set `EX_VERSION = 6`, import `buildExampleUnderstanding`, and pass `understanding: buildExampleUnderstanding()` into the example project.

- [x] **Step 4: Build and smoke-test fixture creation**

Run: `cd app && npm test && npm run build`

Expected: all commands exit 0.

### Task 4: Progressive Agent Panel

**Files:**
- Modify: `app/src/panels.js`
- Modify: `app/src/style.css`

**Interfaces:**
- Consumes: `getFindingQueue(doc)` and `decideFinding(doc, id, decision)`
- Produces: `renderCoachInto()` showing project understanding, one current finding and a collapsed complete queue

- [x] **Step 1: Add browser assertions before changing the UI**

The Playwright check opens the example text and asserts the desired selectors do not yet exist:

```js
await expect(page.getByText('Projektverstaendnis', { exact: true })).toBeVisible()
await expect(page.locator('[data-current-finding]')).toHaveCount(1)
await expect(page.locator('[data-finding-queue]')).toContainText('vorgemerkt')
```

Expected before implementation: FAIL because the project understanding and queue selectors do not exist.

- [x] **Step 2: Read findings from the common model**

Replace `coachList()` and `laneList()` with filtered projections over `doc.findings`. Use `getFindingQueue(doc).current` to decide which finding is prominent. The badge uses `pendingCount`, not the number currently rendered.

- [x] **Step 3: Render editable project understanding**

At the top of the agent panel, render a compact `<details class="project-understanding">`. The closed summary contains only `Projektverstaendnis` and the one-line task. Open content exposes labelled, editable fields for Aufgabe, Zielgruppe, Wirkung, Belegstandard, geschuetzte Absichten and offene Fragen. Blur saves through the existing debounced persistence.

- [x] **Step 4: Render one current finding and a complete collapsed queue**

The current finding gets `data-current-finding`. A collapsed queue gets `data-finding-queue` and lists upcoming and parked findings by short title and category. Completed items and accepted risks are in separate collapsed groups. No item is deleted by queueing.

- [x] **Step 5: Route accept/reject through the model**

All overlay actions call `decideFinding`. Rejection of integrity categories uses copy `Risiko bewusst annehmen`; wording and rhetorical proposals use `Verwerfen`. After a decision, panels and inline anchors rebuild so the next eligible finding becomes current.

- [x] **Step 6: Style the hierarchy**

Use existing neutral surfaces and borders. Keep project understanding unframed, current finding separated by one soft rule, and queue rows as plain text. Do not add nested cards, status scores, gradients or decorative graphics.

### Task 5: One Anchored Current Finding

**Files:**
- Modify: `app/src/panels.js`
- Modify: `app/src/style.css`

**Interfaces:**
- Consumes: `getFindingQueue(doc).current`
- Produces: at most one inline marker with the complete queue still available in the agent panel

- [x] **Step 1: Add a failing browser assertion**

```js
await page.getByTitle('Hinweise am Text ein-/ausblenden').click()
await expect(page.locator('.anno-bubble, .anno-mark[data-aid]')).toHaveCount(1)
```

Expected before implementation: FAIL because the example currently renders multiple inline hints.

- [x] **Step 2: Limit the lane projection**

`laneList()` returns `[queue.current]` only when the current finding is passage-anchored; otherwise it returns `[]`. The toolbar badge still shows all pending findings.

- [x] **Step 3: Mark stale anchors visibly**

If `findInDoc(target)` returns no range, keep the finding in the queue and add `anchorState: 'stale'` plus the label `Textstelle veraendert`. Never silently resolve it.

- [x] **Step 4: Re-run the browser assertion**

Expected: one or zero markers depending on whether the current finding has a passage anchor; never more than one.

### Task 6: Quiet Writing Surface

**Files:**
- Modify: `app/src/ui.js`
- Modify: `app/src/style.css`

**Interfaces:**
- Produces: fixed document appearance with semantic text structure only

- [x] **Step 1: Add failing browser assertions for removed design controls**

```js
await expect(page.getByTitle('Schriftgroesse (Auswahl / Gesamt)')).toHaveCount(0)
await expect(page.getByTitle('Einfuegen (Bild)')).toHaveCount(0)
```

Expected before implementation: FAIL because both controls exist.

- [x] **Step 2: Remove font-size and image controls from the toolbar**

Keep paragraph/heading, lists, quotation/code elements, word count, save state, settings and hint toggle. Remove `Aa`, image insertion and global `Cmd +/-` resizing. Preserve the Tiptap extensions only for backward-compatible rendering of old content.

- [x] **Step 3: Fix document appearance**

Use Literata at 18px with a 700px reading measure for all documents. Keep semantic heading levels as structural hierarchy, not user-selectable typography themes. Theme, spelling, focus mode, export and print remain settings.

- [x] **Step 4: Build and run all checks**

Run: `cd app && npm test && npm run build`

Expected: tests and build PASS.

### Task 7: End-to-End Verification

**Files:**
- Create: `app/test/v2-smoke.mjs`

**Interfaces:**
- Verifies: persistence, priority, progressive disclosure, user decision and responsive layout

- [x] **Step 1: Write a Playwright smoke script**

The script starts from empty localStorage, opens the seeded example, opens the agent panel, edits the task in project understanding, rejects the current non-integrity suggestion, verifies the next item appears, reloads, and confirms both the edit and decision persisted. It captures desktop screenshots at `1440x1000` and mobile screenshots at `390x844`.

- [x] **Step 2: Run with the local server helper**

Run:

```bash
cd app
NODE_PATH="$CODEX_NODE_MODULES" node test/v2-smoke.mjs
```

Expected: exit 0, no browser console errors, exactly one current finding, no horizontal document overflow at either viewport.

- [x] **Step 3: Inspect screenshots and correct visual issues**

Check that text remains dominant, project understanding is closed by default, queue is visibly subordinate, inline hints do not overlap the text and all labels fit.

- [x] **Step 4: Run final verification**

Run:

```bash
cd app && npm test && npm run build
cd .. && git diff --check && git status --short
```

Expected: tests and build PASS, `git diff --check` has no output, and status lists only the intended V2 specification, model, tests and UI changes plus pre-existing untracked research files.

