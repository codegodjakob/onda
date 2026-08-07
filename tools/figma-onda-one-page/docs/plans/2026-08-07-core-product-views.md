# Core Product Views Implementation Plan

**Goal:** Replace the four generic Library/Editor frames with exactly eighteen complete, flat product views built from real, exact component variants on the existing page and sections.

**Architecture:** Export a deeply frozen `CORE_VIEW_DEFINITIONS` matrix containing copy, exact instance contracts, and fixed product-layout regions. Add pure mutation/evidence validators plus canonical snapshots; Runtime only adapts real Figma nodes to those contracts, reuses direct owned nodes, swaps instance variants through async identity, and renders deterministic Rail/Header/Toolbar/Content or Rail/Toolbar/Document/Review compositions. Legacy owned generic frames are reused as the matching new views; obsolete owned internals are hidden, never deleted.

**Scope:** `core-views` only. No Agent, Source, Dialog, Annotation, Responsive, Dark, Prototype, Page, or Component-Set mutation.

## Acceptance Criteria

### AC-1: Exact product contract

**Given** the frozen core-view contract

**When** it is inspected

**Then** it contains exactly eight named Library views and ten named Editor views in the required order, each width 1440, radius 0, effect-free, with distinct honest German title/body/status/action copy and explicit recovery where required.

### AC-2: Real component variants

**Given** any rendered core view

**When** its visible controls are inspected

**Then** every control/row/search/select/status/navigation element is a real repeated `INSTANCE` linked to the exact owned Component Set and Variant through async main-component identity; non-empty views have at least four instances and Empty/Error views at least two.

### AC-3: Overview truthfulness

**Given** `Übersicht / Coverage`

**When** core views are generated

**Then** it reports only `Bibliothek 8`, `Editor 10`, and `Komponenten 27`, has radius 6 and no effect, and makes no completion claim about later Annotation or Dialog phases.

### AC-4: Safe idempotent recovery

**Given** fresh, exact, safe partial, legacy-owned, duplicate, wrong-parent, unowned, or raced inventories

**When** `core-views` runs

**Then** fresh/partial/legacy inventories converge idempotently while collisions and current-inventory drift abort before the first core-view write; existing baseline content and Component Sets remain unchanged.

### AC-5: Strict real evidence

**Given** collected modern core evidence

**When** the pure validator runs

**Then** it validates real type/parent/owner/geometry/effects/pluginData/copy plus async Set/Variant links for exactly eighteen views, and rejects missing, extra, duplicate, stand-in, insufficient-instance, wrong-link, wrong-geometry, wrong-effect, or wrong-marker evidence independently.

### AC-6: Visual and repository gates

**Given** the completed slice

**When** layout and repository evidence are checked

**Then** all surfaces/instances are grayscale, view grids do not overlap, only allowed radii occur, no new Page exists, full verification/diff pass, and only plugin files enter the separate commit.

## Evaluation

Threshold: **95/100**, maximum **3** iterations.

- Contract and honest copy: 25
- True exact instances: 25
- Evidence and false-pass resistance: 20
- Safety, recovery, race, and idempotence: 20
- Visual grayscale/radius/effect/layout quality: 10

Hard gates: exact 8+10 direct views; width 1440/radius 0/no effects; overview 8/10/27 only; real exact variant instances with required cardinality; strict modern evidence hard-gated in Verify; RED/GREEN; full build/tests/diff; plugin-only commit.

## Implementation Steps

1. Add seven focused tests covering contract/copy, strict evidence corruptions, exact instances, mutation recovery, collisions/TOCTOU, Runtime async source, Overview/Verify hard-gate; capture RED.
2. Add frozen view/instance definitions and pure `validateCoreViewMutationInventory`, canonical snapshot, recovery actions, guarded command, and `validateCoreViewEvidence`.
3. Replace generic Runtime builders with inventory collection, preflight, direct-owned frame recovery, async exact variant-instance creation/swap/Label override, deterministic layout, and modern evidence collection.
4. Add core evidence to `runVerify`/`buildVerificationReport`, migrate legacy fixtures without weakening any validator, evaluate and refine at most twice more.
5. Run focused, adjacent, and full verification; run diff/scope checks; commit only `tools/figma-onda-one-page/**`.

## Evaluation Log

- RED baseline: `node --test test/core-product-views.test.mjs` — **0/7 passed, 7/7 failed** with expected assertion failures for the missing frozen contract, pure validators, guarded command, Runtime adapter, and Verify hard-gate; no syntax or harness errors.
- Iteration 1: focused suite **7/7** and build passed, but the full suite was **116/118**. Score **89/100**; hard gate failed because two existing static component-safety proofs read new Core-only filtering/source beyond their intended boundary. Critique: preserve the older component-runtime proof boundary and avoid its prohibited collector expression globally.
- Refinement: added an explicit Core component-set adapter boundary, rewrote the Core evidence variant traversal without weakening legacy tests, and tightened direct-child ownership plus Overview child evidence/revalidation.
- Iteration 2: `npm run verify` passed — build succeeded and **118/118 tests passed**. A stricter visual critique rescinded the provisional pass: the uniform vertical stack did not read as a complete Library/Editor product surface. Corrected rubric: contract/copy **25/25**, true instances **25/25**, evidence **20/20**, safety/recovery **20/20**, visual hierarchy **3/10** = **93/100**; threshold missed.
- Refinement: replaced the stack with exact 1440×800 region compositions (Library: Rail/Header/Toolbar/Content; Editor: Rail/Toolbar/Document/Review), added a narrower collapsed/focus rail and wider writing surface, positioned/resized every direct real instance inside its contracted region, and added strict evidence for all 72 owned empty layout frames plus instance containment.
- Iteration 3: final `npm run verify` passed — build succeeded and **118/118 tests passed**. Rubric: contract/copy **25/25**, true instances **25/25**, evidence **20/20**, safety/recovery **20/20**, visual hierarchy **9/10** = **99/100**. Threshold passed and all automated hard gates pass; one point remains reserved for live Figma pixel inspection outside the repository harness.
