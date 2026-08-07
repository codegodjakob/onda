# Tier2 Annotation/Dialog Composites

**Goal:** Append exactly five Tier2 annotation/dialog component sets to the fourteen foundation sets and generalize the existing component/effect safety model without adding agent/source composites.

**Public seams:** `COMPONENT_DEFINITIONS`, `PHASE_DEFINITIONS`, `ui.html`, component/foundation strict evidence, mutation/recovery/staging/TOCTOU functions, and async Figma style APIs.

## Acceptance Criteria

### AC-1: Exact Tier2 contract

**Given** the fourteen existing base sets

**When** the contract is loaded

**Then** Annotation Anchor, Annotation Form, Annotation Card, Dialog Action, and Dialog appear last in that order with tier 2, exact variants/roles, German state-specific copy, declared layout/height/radius, and one Label TEXT property plus generated axes.

### AC-2: Honest annotation coverage

**Given** the app's nine distinct annotation forms

**When** Annotation Form evidence is inspected

**Then** all nine forms occur once with distinct meaningful copy/actions and dialogue/source help does not imply unsupported automatic behavior.

### AC-3: Exact overlay consumers

**Given** the owned `Onda/Shadow/Overlay` style

**When** component and foundation evidence is validated

**Then** only the radius-8 documentation effect card plus all four Annotation Card and five Dialog variants consume it; every consumer is owned, grayscale, linked through the async effect-style API, and any missing/wrong/flat/unowned consumer is rejected.

### AC-4: Flat components stay flat

**Given** any component other than Annotation Card or Dialog

**When** it is rendered or verified

**Then** it has no effect style and no effects; Annotation Card and Dialog use exactly the overlay style.

### AC-5: Safety and recovery

**Given** exact, safe partial, staged, raced, reparented, or replaced Tier2 inventories

**When** component commands run

**Then** exact and safe partial states converge idempotently while collision, ownership, ancestry, property/link/effect drift, and known-ID replacement abort before component writes.

### AC-6: Workflow and scope

**Given** plugin UI/phase order

**When** commands are enumerated and the plugin is verified

**Then** exactly nineteen component commands precede core views, no agent/source composite is added, the full suite/build/diff gates pass, and only plugin files are committed.

## Evaluation

Threshold: **95/100**, maximum **3** iterations.

- Exact contract/copy/forms/UI: 25
- Component evidence/bindings/properties: 20
- Overlay style/consumer safety: 25
- Recovery/staging/race/TOCTOU/async APIs: 20
- Full verification/scope: 10

Hard gates: 19 exact sets/commands; nine exact forms; 10 exact overlay consumers; flat consumers rejected; focused executable RED/GREEN; full suite/build/diff clean; plugin-only commit.

## Execution

1. Write six focused executable tests and record RED.
2. Add five immutable definitions and 19-command UI/phase order.
3. Add optional `effectStyleName`, async style resolution/application/collection, strict component evidence, and exact foundation consumer validation.
4. Generalize fixtures and legacy milestone tests without weakening gates.
5. Evaluate/refine, run fresh full verification, scope-check, and commit separately.

## Evaluation Log

- RED baseline: `node --test test/component-tier2-annotation-dialog.test.mjs` — **0/6 passed, 6/6 failed** before production changes. Failures covered the missing five-set contract/UI, strict Tier2 evidence, ten-consumer Foundation rule, recovery, race detection, and async effect-style API.
- GREEN focused: the same command — **6/6 passed** after implementation.
- Iteration 1 rubric: **100/100** (contract/copy/forms/UI 25/25; component evidence/bindings/properties 20/20; overlay safety 25/25; recovery/staging/race/async APIs 20/20; verification/scope 10/10). All hard gates pass; no refinement iteration required.
- Fresh completion evidence: `npm run verify` built `dist/code.js` and passed **105/105** tests; `git diff --check` passed; scope inspection found only `tools/figma-onda-one-page/**` changes selected for commit. Existing unrelated `.scratch/rueckmeldung/**` files remain untouched and uncommitted.
