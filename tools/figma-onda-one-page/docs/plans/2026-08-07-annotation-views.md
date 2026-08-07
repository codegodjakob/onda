# Annotation Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic annotation placeholders on the existing `Claude Code` Figma page with exactly 174 fixture-faithful, recoverable, strictly verified annotation views: six views for each of 29 annotation kinds.

**Architecture:** `src/definitions.mjs` owns one frozen, generated contract derived directly from the production annotation definitions and the 29 evaluation fixtures. `src/plan.mjs` owns pure inventory validation, recovery planning, canonical race snapshots, guarded batch execution, and strict evidence; `src/runtime.mjs` only collects, resolves, renders, and serializes Figma nodes against those contracts. The six existing annotation phases remain the only write entry points, and each phase gets a complete preflight/context/write-barrier cycle before touching its five-or-four owned Sections.

**Tech Stack:** Node.js ESM, `node:test`, Figma Plugin API, esbuild, immutable JavaScript contract objects.

## Global Constraints

- Source truth is exactly `app/evals/fixtures/annotation-cases.mjs` plus `app/src/annotation-contract.mjs`; do not duplicate or normalize away fixture text.
- Produce exactly 29 annotation kinds in `ALL_ANNOTATION_KINDS` order: 24 operation Sections `05.01` through `05.24`, then five note Sections `06.01` through `06.05`.
- Produce exactly six ordered views for every kind — `Open`; `Accept · Undo`; `Reject · Scope`; `Error · Retry`; `Responsive · 320 px`; `Dark` — for exactly 174 views total.
- Map forms exactly: `correction→Form=Correction`, `rewrite→Form=Rewrite`, `insertion→Form=Insertion`, `slot→Form=Slot`, `region→Form=Region`, `source→Form=Source`, `compare→Form=Compare`, `dialogue→Form=Dialogue`, `title→Form=Title`.
- `faden`, `anmerkung`, `luecke`, `nachfrage`, and `aufgreifen` have no effective text operation. Their `Accept · Undo` view must explicitly say acceptance is unavailable and preserve the item as an editorial note; it must never expose or synthesize an effective text operation.
- Every view owns exact nested Instances of `annotation-anchor`, `annotation-form`, and `annotation-card`; it also owns the action/status Instances required by the view contract. All visible `Role/<name>` TEXT descendants receive complete instance-local copy after their fonts load.
- Every view and region uses real non-`NONE` Auto Layout, every Instance is a true child of its contracted region, and every instance height equals `componentRenderedHeight` for its Component definition.
- Output remains grayscale; radii are limited to the existing small tokens; only the owned `annotation-card` overlay consumer may retain `Onda/Shadow/Overlay`.
- `Responsive · 320 px` has width exactly 320, padding exactly 16, vertical composition, no parent/internal-role overflow or sibling overlap, and every interactive target is at least 44 px high.
- `Dark` alone uses bindings from `Onda · Semantic · Dark`; no visible Dark frame, copy, Instance, or visible Instance Role may carry a Light semantic binding. Non-Dark annotation views remain Light.
- Recovery is safe and idempotent. Unknown marked, unowned, duplicate, wrong-type, wrong-parent, binding, effect, copy, geometry, identity, and post-preflight race corruptions abort before the first annotation write.
- Preserve six ordered phases `annotations-1` through `annotations-6`; batches contain kinds `0..4`, `5..9`, `10..14`, `15..19`, `20..24`, and `25..28` respectively.
- Full recursive snapshot and final write barrier cover the target Page, every owned annotation Section, view, region, copy node, Instance, and visible Instance Role descendant plus untouched Page records needed to prove scope.
- Do not change Section `08 · Dialoge`, Section `11 · Prototyp`, any B2a2/Core view contract, any Component Set/main Component, or any file outside `tools/figma-onda-one-page/**`. Leave `.scratch/**` untouched.
- Preserve RED evidence. Use at most three rubric iterations, require at least 95/100 and every hard gate, and stop if the score does not improve. Each task needs independent spec and code-quality approval before its plugin-only commit is accepted.

---

## Frozen Annotation Contract

Add and export this exact public shape from `src/definitions.mjs`; every nested object and array is recursively frozen.

```js
export const ANNOTATION_FORM_VARIANTS = Object.freeze({
  correction: 'Form=Correction',
  rewrite: 'Form=Rewrite',
  insertion: 'Form=Insertion',
  slot: 'Form=Slot',
  region: 'Form=Region',
  source: 'Form=Source',
  compare: 'Form=Compare',
  dialogue: 'Form=Dialogue',
  title: 'Form=Title',
})

export const ANNOTATION_VIEW_DEFINITIONS = Object.freeze(
  ANNOTATION_CASES.map((fixture, annotationIndex) => Object.freeze({
    kind: fixture.anmerkungsart,
    sectionName: ANNOTATION_SECTIONS[annotationIndex].sectionName,
    definition: ANNOTATION_SECTIONS[annotationIndex],
    fixture: deepFreezeAnnotationPayload(fixture),
    views: Object.freeze(buildAnnotationViewContracts(
      ANNOTATION_SECTIONS[annotationIndex],
      fixture,
      annotationIndex,
    )),
  })),
)
```

Each view exposes the following exact keys:

```js
{
  name, sectionName, kind, fixtureId, width, theme, padding,
  layoutMode: 'VERTICAL', regions, copyContracts, instances,
}
```

Each Instance exposes:

```js
{
  name, setId, variant, region, roleCopy, expectedHeight,
  interactive,
}
```

`copyContracts` contains four separate TEXT records, without prefixes or text rewriting, so the fixture strings can be compared byte-for-byte:

| Role | Exact characters |
|---|---|
| `Target` | `fixture.target` |
| `Finding` | `fixture.short` |
| `Reason` | `fixture.why` |
| `Consequence` | `fixture.folge` |

The fixture payload kept on each annotation contract must also preserve `id`, `anmerkungsart`, `status`, `placement`, `blockId`, `action`, `priority`, `fixtureState`, and form-specific `sources`, `compare`, `move`, `targets`, or `thread` values exactly. No production copy may replace these payload values.

### Exact per-view component contract

All views contain the Anchor, Form, Card, Status, Primary Action, and Secondary Action in this order. `Kind=Text` is used for Sections 05 and `Kind=Note` for Sections 06. The Anchor state is `Active`; every Role copy object contains all TEXT roles of its Component.

| View | Frame | Annotation Card | Status Symbol | Primary Dialog Action | Secondary Dialog Action |
|---|---|---|---|---|---|
| `Open` | 580/Light/padding 24 | `State=Open` | `Status=Warning` | `Kind=Primary` | `Kind=Secondary` |
| `Accept · Undo` with operation | 580/Light/padding 24 | `State=Accepted` | `Status=Ready` | `Kind=Secondary` labeled `Rückgängig` | `Kind=Secondary` labeled `Schließen` |
| `Accept · Undo` without operation | 580/Light/padding 24 | `State=Open` with explicit editorial-note copy | `Status=Warning` | `Kind=Disabled` labeled `Übernehmen nicht verfügbar` | `Kind=Secondary` labeled `Als Hinweis behalten` |
| `Reject · Scope` | 580/Light/padding 24 | `State=Rejected` | `Status=Ready` | `Kind=Secondary` labeled `Rückgängig` | `Kind=Secondary` labeled `Gültigkeit ändern` |
| `Error · Retry` | 580/Light/padding 24 | `State=Error` | `Status=Error` | `Kind=Primary` labeled `Erneut versuchen` | `Kind=Secondary` labeled `Abbrechen` |
| `Responsive · 320 px` | 320/Light/padding 16 | `State=Open` | `Status=Warning` | `Kind=Primary` | `Kind=Secondary` |
| `Dark` | 580/Dark/padding 24 | `State=Open` | `Status=Warning` | `Kind=Primary` | `Kind=Secondary` |

The Form Variant is always `ANNOTATION_FORM_VARIANTS[definition.form]`. The Form exposes the exact target and action payload (`Input = fixture.target`, `Preview = fixture.action`) and uses the fixture reason as `Help`. For unsupported kinds its `Primary Action` is `Nicht verfügbar`; for supported kinds it names the actual operation outcome. The Card uses the exact fixture finding as `Body`, the exact scope as `Scope`, the annotation label as `Title`, and an honest view-specific status. Unsupported `Accept · Undo` must use these exact semantic strings:

```js
{
  'Primary Action': 'Übernehmen nicht verfügbar',
  Status: 'Nur redaktioneller Hinweis',
  Body: fixture.short,
}
```

No unsupported contract may contain a non-null `operation`, an `effectiveOperation`, or an action copy that claims a text change occurred.

## Acceptance Criteria

### Happy Path

#### AC-1: Exact fixture-backed matrix

**Given** the production annotation contract and all 29 annotation fixtures

**When** `ANNOTATION_VIEW_DEFINITIONS` is inspected

**Then** it contains the same 29 kinds and 24+5 Section names in the same order, each has the exact frozen fixture payload and six ordered views, and the total is exactly 174.

#### AC-2: Exact components and copy

**Given** any one of the 174 view contracts

**When** its rendered hierarchy and visible text are inspected

**Then** the Anchor, mapped Form, Card, Status, Primary Action, and Secondary Action are exact-Variant owned Instances nested in their contracted real Auto Layout regions, every visible Role is overridden locally, every fixture string remains byte-exact, and every Instance height equals `componentRenderedHeight`.

#### AC-3: Honest decisions

**Given** an annotation with or without a production text operation

**When** its six decision states are inspected

**Then** supported kinds expose the exact operation outcome and Undo, while the five unsupported kinds have no effective operation and their Accept view explicitly says `Übernehmen nicht verfügbar` and `Nur redaktioneller Hinweis`.

### Edge Cases

#### AC-4: Mobile and Dark fidelity

**Given** a `Responsive · 320 px` or `Dark` view

**When** its bounds, layout, paints, bindings, and descendants are measured recursively

**Then** 320 views are exactly 320 wide with padding 16, vertical non-overlapping content, no overflow, and 44-pixel minimum interactive targets; Dark views use only Dark semantic bindings, while all output remains grayscale and only Annotation Card keeps the exact overlay effect.

#### AC-5: Exact, partial, and rerun inventories

**Given** a fresh inventory, an exact inventory, or an owned safe-partial annotation inventory

**When** the relevant annotation batch runs and then reruns

**Then** only missing or corrupt owned descendants are created or repaired, fixture copy and exact identity converge, the second run returns no recovery actions, and unrelated Sections/Components remain byte-identical in the canonical baseline.

### Error States

#### AC-6: Unsafe inventory abort

**Given** an unknown marked, unowned, duplicate, wrong-type, wrong-parent, extra-visible, wrong-binding, wrong-effect, wrong-copy, wrong-geometry, or wrong-Variant candidate

**When** its batch reaches preflight or the final write barrier

**Then** the command fails with the offending identity in its error, records zero annotation writes, and can succeed after the external conflict is removed.

#### AC-7: Race and strict-evidence hard failure

**Given** a same-ID mutation after preflight or a single evidence corruption in cardinality, ownership, ancestry, Auto Layout, order, bounds, Role bounds/copy, Set/Variant link, form mapping, fixture payload, operation honesty, radius, paint, binding, or effect

**When** guarded execution or Verify runs

**Then** execution aborts before writes or strict evidence fails respectively; an exact recursive snapshot reports 29 kinds, 174 views, six successful batches, and passes.

### Non-Functional Criteria

#### AC-8: Scope, reliability, and auditability

**Given** the completed B3 slice

**When** the full test suite, build, recursive snapshot, baseline comparison, git diff, and plugin-only file list are inspected fresh

**Then** all hard gates pass, the generated bundle is current, no Page/Component Set/main Component/B2a2/Core/Section08/Section11 baseline changed, `.scratch/**` is untouched, and each accepted task commit contains only the intended `tools/figma-onda-one-page/**` files.

## File and Interface Map

- Create `tools/figma-onda-one-page/test/annotation-views.test.mjs`: focused tests for the 29×6 contract, unsupported operation honesty, batch recovery/TOCTOU, nested Runtime source, strict corruption resistance, 320/Dark geometry, and Verify hard-gating.
- Modify `tools/figma-onda-one-page/src/definitions.mjs`: import `ANNOTATION_CASES`; export `ANNOTATION_FORM_VARIANTS`, `ANNOTATION_VIEW_DEFINITIONS`, `validateAnnotationViewDefinitions`; reuse `COMPONENT_DEFINITIONS` and `componentRenderedHeight` without changing existing Component/Core/B2a2 definitions.
- Modify `tools/figma-onda-one-page/src/plan.mjs`: export `validateAnnotationViewMutationInventory`, `buildAnnotationViewRecoveryActions`, `canonicalAnnotationViewMutationSnapshot`, `executeGuardedAnnotationViewBatch`, and `validateAnnotationViewEvidence`; add strict annotation evidence to `buildVerificationReport` as a modern hard gate.
- Modify `tools/figma-onda-one-page/src/runtime.mjs`: replace `createAnnotationView`/unguarded `runAnnotationBatch` with recursive inventory collection, node resolution, exact nested rendering, six guarded batches, and annotation evidence serialization. Reuse existing Component instance/font/binding/layout helpers; do not change secondary/Core/component creation paths.
- Modify `tools/figma-onda-one-page/test/plan.test.mjs` and `tools/figma-onda-one-page/test/review-contract.test.mjs` only for the new strict annotation-evidence result shape and batch hard gate; do not weaken existing legacy corruptions.
- Rebuild `tools/figma-onda-one-page/dist/code.js` from `src/runtime.mjs` only through `npm run build`.
- Create `tools/figma-onda-one-page/docs/2026-08-07-annotation-views-evidence.md`: preserve the RED command/output, rubric iterations, independent review verdicts, final commands/counts, and scope proof.

## TDD Implementation Tasks

### Task 1: Freeze the exact 29×6 fixture contract

**Files:**
- Create: `tools/figma-onda-one-page/test/annotation-views.test.mjs`
- Modify: `tools/figma-onda-one-page/src/definitions.mjs`

**Interfaces:**
- Consumes: `ANNOTATION_CASES`, `ANNOTATION_SECTIONS`, `COMPONENT_DEFINITIONS`, `componentRenderedHeight(definition)`.
- Produces: `ANNOTATION_FORM_VARIANTS`, `ANNOTATION_VIEW_DEFINITIONS`, `validateAnnotationViewDefinitions(definitions): string[]`.

- [ ] **Step 1: Write the failing contract test**

```js
test('annotation contract is the exact frozen 29 by 6 fixture matrix', async () => {
  const definitions = await import('../src/definitions.mjs')
  const { ANNOTATION_CASES } = await import('../../../app/evals/fixtures/annotation-cases.mjs')
  assert.equal(definitions.ANNOTATION_VIEW_DEFINITIONS.length, 29)
  assert.equal(definitions.ANNOTATION_VIEW_DEFINITIONS.flatMap(item => item.views).length, 174)
  assert.deepEqual(definitions.ANNOTATION_VIEW_DEFINITIONS.map(item => item.kind), ANNOTATION_CASES.map(item => item.anmerkungsart))
  assert.deepEqual(definitions.ANNOTATION_VIEW_DEFINITIONS.map(item => item.fixture), ANNOTATION_CASES)
  assert.deepEqual(definitions.validateAnnotationViewDefinitions(definitions.ANNOTATION_VIEW_DEFINITIONS), [])
  assertDeepFrozen(definitions.ANNOTATION_VIEW_DEFINITIONS)
})
```

- [ ] **Step 2: Run RED and preserve the expected failure**

Run: `cd tools/figma-onda-one-page && node --test --test-name-pattern='exact frozen 29 by 6' test/annotation-views.test.mjs`

Expected: FAIL because `ANNOTATION_VIEW_DEFINITIONS` is absent or undefined; save the complete command and failure in the evidence document/report before production changes.

- [ ] **Step 3: Implement the minimal frozen generator and validator**

```js
const FORM_VARIANTS = {
  correction: 'Form=Correction', rewrite: 'Form=Rewrite', insertion: 'Form=Insertion',
  slot: 'Form=Slot', region: 'Form=Region', source: 'Form=Source',
  compare: 'Form=Compare', dialogue: 'Form=Dialogue', title: 'Form=Title',
}
export const ANNOTATION_FORM_VARIANTS = Object.freeze(FORM_VARIANTS)

export const ANNOTATION_VIEW_DEFINITIONS = Object.freeze(ANNOTATION_CASES.map((fixture, index) => {
  const annotation = ANNOTATION_SECTIONS[index]
  return deepFreezeAnnotationContract(buildAnnotationContract(annotation, fixture, index))
}))

export function validateAnnotationViewDefinitions(definitions = ANNOTATION_VIEW_DEFINITIONS) {
  return collectAnnotationDefinitionErrors(definitions, ANNOTATION_CASES, ANNOTATION_SECTIONS)
}
```

`buildAnnotationContract` must implement the complete Frozen Annotation Contract and exact per-view table above. `collectAnnotationDefinitionErrors` must independently verify ordered kinds/Sections/views, 174 total, payload equality, deep freeze, exact form mapping, complete TEXT Role keys, exact Set/Variant/height, 320/Dark constraints, and unsupported-operation honesty.

- [ ] **Step 4: Run focused GREEN and adjacent contract tests**

Run: `cd tools/figma-onda-one-page && node --test test/annotation-views.test.mjs test/plan.test.mjs test/component-tier2-annotation-dialog.test.mjs`

Expected: PASS with zero failures and pristine output.

- [ ] **Step 5: Self-review, independent task review, and commit**

Run: `git diff --check && git diff -- tools/figma-onda-one-page/src/definitions.mjs tools/figma-onda-one-page/test/annotation-views.test.mjs`

Expected: no whitespace errors; independent reviewer reports Spec `✅` and Task quality `Approved` before `git add tools/figma-onda-one-page/src/definitions.mjs tools/figma-onda-one-page/test/annotation-views.test.mjs && git commit -m 'feat(figma): define exact annotation views'`.

### Task 2: Guard recursive recovery and six batch write barriers

**Files:**
- Modify: `tools/figma-onda-one-page/test/annotation-views.test.mjs`
- Modify: `tools/figma-onda-one-page/src/plan.mjs`

**Interfaces:**
- Consumes: `ANNOTATION_VIEW_DEFINITIONS`, the completed Task 1 contract, existing phase-transition validation.
- Produces: `validateAnnotationViewMutationInventory(inventory)`, `buildAnnotationViewRecoveryActions(inventory)`, `canonicalAnnotationViewMutationSnapshot(inventory)`, `executeGuardedAnnotationViewBatch(options)`.

- [ ] **Step 1: Add failing exact/partial/corruption/race tests**

```js
test('annotation batches converge safely and reject inventory drift before writes', async () => {
  const exact = annotationInventoryFixture({ batches: [0] })
  assert.equal(validateAnnotationViewMutationInventory(exact).valid, true)
  assert.deepEqual(buildAnnotationViewRecoveryActions(exact), [])
  const partial = annotationInventoryFixture({ batches: [0], omit: 'Rechtschreibung / Open / Card' })
  assert.deepEqual(buildAnnotationViewRecoveryActions(partial), [{ type: 'create-instance', viewName: 'Rechtschreibung / Open', instanceName: 'Card' }])
  for (const corrupt of annotationCorruptions(exact)) assert.equal(validateAnnotationViewMutationInventory(corrupt).valid, false)
  let writes = 0
  await assert.rejects(executeGuardedAnnotationViewBatch(guardFixture({ mutateCurrent: changeSameId, onWrite: () => { writes += 1 } })), /changed before annotation write barrier/)
  assert.equal(writes, 0)
})
```

- [ ] **Step 2: Run RED**

Run: `cd tools/figma-onda-one-page && node --test --test-name-pattern='converge safely|inventory drift' test/annotation-views.test.mjs`

Expected: FAIL because the four annotation mutation interfaces do not exist.

- [ ] **Step 3: Implement exact inventory validation and recovery**

```js
export function validateAnnotationViewMutationInventory(inventory = {}) {
  const errors = collectAnnotationInventoryErrors(inventory, ANNOTATION_VIEW_DEFINITIONS)
  return { valid: errors.length === 0, errors }
}

export function buildAnnotationViewRecoveryActions(inventory = {}) {
  const validation = validateAnnotationViewMutationInventory(inventory)
  if (!validation.valid) throw new Error(validation.errors.join('\n'))
  return compareAnnotationInventoryToContract(inventory, ANNOTATION_VIEW_DEFINITIONS)
}
```

Validation must distinguish safe absence/owned repair from unsafe unknown/duplicate/unowned/wrong-parent/wrong-type/extra-visible candidates. Recovery actions cover Section, view, region, copy, Instance, Role copy, binding, effect, geometry, order, and markers and must be empty after convergence.

- [ ] **Step 4: Implement the canonical full snapshot and final barrier**

```js
export async function executeGuardedAnnotationViewBatch({
  command, phases, preflight, requireContext, collectCurrentInventory,
  resolveInventoryNodes = async () => null, mutate,
}) {
  assertAnnotationBatchPhase(command, phases)
  const preflightInventory = await preflight()
  assertValidAnnotationInventory(preflightInventory)
  const context = await requireContext()
  const current = await collectCurrentInventory(context)
  assertSameAnnotationSnapshot(preflightInventory, current, 'after context acquisition')
  const resolved = await resolveInventoryNodes(context, current)
  const writeBarrier = await collectCurrentInventory(context)
  assertSameAnnotationSnapshot(current, writeBarrier, 'before annotation write barrier')
  return mutate(writeBarrier, resolved)
}
```

`canonicalAnnotationViewMutationSnapshot` must recursively preserve exact IDs, ownership markers, ancestry/order, type/name, bounds/layout/padding/gap, fills/strokes/bound-variable IDs, effects/effect-style ID, text/Role copy, component properties, main Component/Set/Variant identity, and untouched Page records.

- [ ] **Step 5: Run focused/adjacent GREEN, review, and commit**

Run: `cd tools/figma-onda-one-page && node --test test/annotation-views.test.mjs test/review-contract.test.mjs test/secondary-responsive-views.test.mjs`

Expected: PASS; every injected race reports zero writes. After independent Spec `✅` and Task quality `Approved`, commit only the Task 2 plugin files with `git commit -m 'feat(figma): guard annotation view recovery'`.

### Task 3: Render 174 exact nested views in six guarded batches

**Files:**
- Modify: `tools/figma-onda-one-page/test/annotation-views.test.mjs`
- Modify: `tools/figma-onda-one-page/src/runtime.mjs`
- Rebuild: `tools/figma-onda-one-page/dist/code.js`

**Interfaces:**
- Consumes: all Task 1/2 contracts plus existing font, Component identity, Auto Layout, variable-binding, and instance Role-copy helpers.
- Produces: recursive annotation inventory/evidence records; guarded `runAnnotationBatch(page, ledger, batchIndex)` with exactly six batch ranges.

- [ ] **Step 1: Add failing Runtime-source and behavior tests**

```js
test('runtime renders exact nested owned instances and never mutates components or out-of-scope sections', () => {
  const source = readFileSync(resolve(ROOT, 'src/runtime.mjs'), 'utf8')
  const annotationSlice = source.slice(source.indexOf('function annotationViewEntries'), source.indexOf('const SECONDARY_SECTION_NAMES'))
  assert.match(annotationSlice, /executeGuardedAnnotationViewBatch/)
  assert.match(annotationSlice, /ensureAnnotationRegion/)
  assert.match(annotationSlice, /ensureVariantInstance/)
  assert.match(annotationSlice, /load.*Font/)
  assert.doesNotMatch(annotationSlice, /createComponent|createComponentSet|combineAsVariants/)
  assert.doesNotMatch(annotationSlice, /08 · Dialoge|11 · Prototyp/)
})
```

- [ ] **Step 2: Run RED**

Run: `cd tools/figma-onda-one-page && node --test --test-name-pattern='runtime renders exact nested' test/annotation-views.test.mjs`

Expected: FAIL because generic `createAnnotationView` does not render the contracted hierarchy and the batch is unguarded.

- [ ] **Step 3: Implement recursive collection and exact rendering**

```js
async function runAnnotationBatch(page, ledger, batchIndex) {
  return executeGuardedAnnotationViewBatch({
    command: `annotations-${batchIndex + 1}`,
    phases: ledger.phases,
    preflight: () => collectAnnotationViewMutationInventory(page, batchIndex),
    requireContext: () => loadAnnotationRenderContext(ledger),
    collectCurrentInventory: () => collectAnnotationViewMutationInventory(page, batchIndex),
    resolveInventoryNodes: (_, inventory) => resolveAnnotationInventoryNodes(page, inventory),
    mutate: (inventory, resolved) => renderAnnotationBatch(page, ledger, batchIndex, inventory, resolved),
  })
}
```

`renderAnnotationBatch` must update-or-create only recovery actions for that batch, insert copy/Instances under their real region parents in contract order, resize Instances from `expectedHeight`, set complete local Role text after font loading, bind only Dark view nodes to Dark variables, remove unauthorized owned effects, and mark every owned node for future exact recovery.

- [ ] **Step 4: Build and run focused GREEN**

Run: `cd tools/figma-onda-one-page && npm run build && node --test test/annotation-views.test.mjs test/package-and-safety.test.mjs`

Expected: build exit 0; focused tests PASS; `dist/code.js` imports no Node built-ins and contains the guarded batch path.

- [ ] **Step 5: Baseline/scope review and commit**

Run: `git diff --check && git diff --name-only`

Expected: only Task 3 plugin files changed; no Section08/11/Core/B2a2/component source block changed. After independent Spec `✅` and Task quality `Approved`, commit with `git commit -m 'feat(figma): render exact annotation views'`.

### Task 4: Make strict annotation evidence a Verify hard gate

**Files:**
- Modify: `tools/figma-onda-one-page/test/annotation-views.test.mjs`
- Modify: `tools/figma-onda-one-page/test/plan.test.mjs`
- Modify: `tools/figma-onda-one-page/test/review-contract.test.mjs`
- Modify: `tools/figma-onda-one-page/src/plan.mjs`
- Modify: `tools/figma-onda-one-page/src/runtime.mjs`
- Rebuild: `tools/figma-onda-one-page/dist/code.js`

**Interfaces:**
- Consumes: Task 1 contract and Runtime recursive records.
- Produces: `validateAnnotationViewEvidence(evidence)` and `buildVerificationReport(snapshot).annotationViewStructureValid` plus errors/counts.

- [ ] **Step 1: Add independent strict-evidence corruptions**

```js
test('strict annotation evidence rejects every independent contract corruption', () => {
  const exact = annotationInventoryFixture({ batches: [0, 1, 2, 3, 4, 5] })
  assert.deepEqual(validateAnnotationViewEvidence(exact), { valid: true, errors: [], counts: { kinds: 29, views: 174 } })
  for (const [name, corrupt] of strictAnnotationCorruptions(exact)) {
    assert.equal(validateAnnotationViewEvidence(corrupt).valid, false, name)
  }
})
```

The corruption generator must independently change: missing/extra/duplicate/wrong Section or view; ownership/marker; parent/ancestor/order; `layoutMode=NONE`; frame/region/Instance/Role bounds and overlap; 320 width/padding/direction/target; form mapping; fixture payload/copy; operation truth; Role completeness/characters; Set/Variant/main identity; height; colored paint; wrong/missing/Light Dark binding; radius; missing/wrong/extra effect.

- [ ] **Step 2: Run RED**

Run: `cd tools/figma-onda-one-page && node --test --test-name-pattern='strict annotation evidence' test/annotation-views.test.mjs`

Expected: FAIL because `validateAnnotationViewEvidence` is absent or does not enforce the corruptions.

- [ ] **Step 3: Implement strict evidence and Verify integration**

```js
export function validateAnnotationViewEvidence(evidence = {}) {
  const errors = collectStrictAnnotationEvidenceErrors(evidence, ANNOTATION_VIEW_DEFINITIONS)
  return {
    valid: errors.length === 0,
    errors,
    counts: {
      kinds: new Set((evidence.views || []).map(view => view.kind)).size,
      views: (evidence.views || []).length,
    },
  }
}
```

`buildVerificationReport` must add `annotationViewStructureValid`, `annotationViewErrors`, exact kind/view counts, and require strict validity whenever modern recursive annotation evidence exists. Legacy snapshots without that field may retain existing compatibility; a present but partial/corrupt modern field can never fall back.

- [ ] **Step 4: Run focused, adjacent, full GREEN and rebuild**

Run: `cd tools/figma-onda-one-page && npm run verify`

Expected: build exit 0; the complete test suite passes with zero failures; all independent corruptions fail only the intended strict gate.

- [ ] **Step 5: Independent review and commit**

Run: `git diff --check && git diff --name-only`

Expected: plugin-only files; reviewer reports Spec `✅`, Task quality `Approved`, and no open Critical/Important findings before `git commit -m 'feat(figma): verify strict annotation views'`.

### Task 5: Evaluate, refine, and record auditable evidence

**Files:**
- Create: `tools/figma-onda-one-page/docs/2026-08-07-annotation-views-evidence.md`
- Modify only if an evaluation finding requires it: the B3 plugin files named above.

**Interfaces:**
- Consumes: original acceptance criteria, preserved RED output, task review packages/verdicts, full recursive exact and corruption fixtures.
- Produces: one evidence document with iterations 1–3 and final verification; final whole-branch review verdict.

- [ ] **Step 1: Run evaluation iteration 1**

Run: `cd tools/figma-onda-one-page && npm run verify && git diff --check`

Expected: build/test exit 0 and no diff-check errors. Score the rubric below from fresh command evidence; list every lost point and hard-gate failure.

- [ ] **Step 2: Critique and refine with TDD, at most twice**

```text
For each failed dimension: add one regression test, run it RED for the observed defect, apply the minimum production fix, run focused GREEN, then rerun the full evaluation. Stop when score >= 95 and all hard gates pass, after iteration 3, or when the score does not improve.
```

- [ ] **Step 3: Run independent broad final review**

Run: create one full B3 review package from the pre-plan base commit through HEAD and give it, this plan, the evidence document, and the original constraints to a fresh reviewer.

Expected: Spec `✅`, Task quality `Approved`, no open Critical/Important findings. Any finding receives one TDD fix wave and a fresh re-review.

- [ ] **Step 4: Run fresh final verification against every AC**

Run: `cd tools/figma-onda-one-page && npm run verify && git diff --check && git status --short && git diff --name-only 7d720ee..HEAD`

Expected: build/test exit 0; no whitespace errors; only intended plugin files differ from base; `.scratch/**` remains exactly the pre-existing untracked user state; AC-1 through AC-8 each has explicit passing evidence or is reported unmet.

- [ ] **Step 5: Commit evidence only after the final gate**

Run: `git add tools/figma-onda-one-page/docs/2026-08-07-annotation-views-evidence.md && git commit -m 'docs(figma): record annotation view evaluation'`

Expected: one plugin-only documentation commit after the evidence is complete and final review is clean.

## Evaluation Rubric

Threshold: **95/100**. Maximum: **3 iterations**. Stop early only when every hard gate passes; stop for convergence when a new score is not higher than the previous score.

| Dimension | Points | Passing evidence |
|---|---:|---|
| Exact 29×6 fixture contract and form mapping | 20 | Ordered/deep-freeze/payload/form tests; counts 24+5/174 |
| Honest decisions and complete Role copy | 15 | Supported operations; five unsupported editorial Accept contracts; every visible Role exact |
| Nested Auto Layout, exact Instances, and heights | 20 | Real parent/ancestry/order evidence; exact Set/Variant; `componentRenderedHeight` |
| 320, grayscale, radii, Dark bindings, and effects | 15 | recursive geometry/target/overflow tests; Dark provenance; exact overlay consumer |
| Recovery, idempotence, six batches, and TOCTOU | 15 | fresh/exact/partial/rerun plus unsafe/race zero-write tests |
| Strict evidence and Verify false-pass resistance | 10 | independent corruption matrix and modern hard gate |
| Scope and auditability | 5 | baseline/Page/Set/Core/B2a2/08/11 proof; plugin-only commits; untouched `.scratch` |

Hard gates: exact 29 kinds/24+5 Sections/174 views/names/order; exact fixture payload; exact form mapping; five unsupported kinds with no effective operation; real nested Auto Layout; complete local Role copy; exact Set/Variant and definition-derived height; exact 320 constraints; grayscale/small radii/Dark-only bindings/owned overlay effect; six guarded batches; recursive final barrier; strict Verify; build and full tests GREEN; independent reviews clean; plugin-only scope; Sections08/11, B2a2/Core/components, and `.scratch` unchanged.

## Self-Review Checklist

- [x] Recompute 29 × 6 = 174 and verify the six batch ranges total 29 without gaps or overlap.
- [x] Map every source requirement to AC-1…AC-8 and Task 1…Task 5.
- [x] Run the no-placeholder scan from the writing-plans gate and resolve every match plus every unresolved interface name.
- [x] Verify interface spelling is identical in Files/Interfaces and every consuming task.
- [x] Verify every task owns a complete RED→GREEN→review→plugin-only commit cycle.
- [x] Verify no step authorizes changes to Sections08/11, B2a2/Core/components, Page structure, or `.scratch`.
